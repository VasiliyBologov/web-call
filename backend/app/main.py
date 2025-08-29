from __future__ import annotations

import json
import logging
import os
import time
from typing import Dict

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response

from .models import CreateRoomResponse, RoomInfo, ErrorMessage, JoinMessage, SDPMessage, IceMessage, ByeMessage, OrientationMessage
from .rooms import RoomStore, MAX_PARTICIPANTS_DEFAULT

logger = logging.getLogger("webcall")
logging.basicConfig(level=logging.INFO)

app = FastAPI(title="Web Call Signaling", version="1.0")

# CORS (dev-friendly; tighten in prod)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

store = RoomStore()


@app.on_event("startup")
async def on_startup():
    store.start_cleanup()


@app.get("/api/health")
async def health():
    return {"status": "ok"}


@app.post("/api/rooms", response_model=CreateRoomResponse)
async def create_room():
    room = await store.create_room(max_participants=MAX_PARTICIPANTS_DEFAULT)
    base_url = os.getenv("PUBLIC_BASE_URL")
    # Accept only proper absolute URLs for PUBLIC_BASE_URL; ignore placeholders or invalid values
    if base_url:
        base_url = base_url.strip()
        has_placeholder = "${" in base_url or ":-" in base_url
        if has_placeholder or not base_url.lower().startswith(("http://", "https://")):
            base_url = None
        else:
            base_url = base_url.rstrip("/")
    url_path = f"/r/{room.token}"
    url = f"{base_url}{url_path}" if base_url else url_path
    return CreateRoomResponse(token=room.token, url=url, ttlSeconds=7 * 24 * 3600)


@app.get("/api/rooms/{token}", response_model=RoomInfo)
async def get_room(token: str):
    room = await store.get_room(token)
    now = time.time()
    if (not room) or (now >= room.expires_at and room.participants == 0):
        # Auto-create (or recreate) a room with the same token if missing or expired (and empty)
        room = await store.create_room_with_token(token, MAX_PARTICIPANTS_DEFAULT)
    status = "active" if room.participants > 0 else "waiting"
    return RoomInfo(token=token, participants=room.participants, maxParticipants=room.max_participants, status=status)


# --- WebSocket signaling ---

# Mapping: roomToken -> peerId -> WebSocket
connections: Dict[str, Dict[str, WebSocket]] = {}


async def send_error(ws: WebSocket, code: str, message: str):
    await ws.send_text(ErrorMessage(code=code, message=message).model_dump_json())


@app.websocket("/ws/rooms/{token}")
async def ws_room(ws: WebSocket, token: str):
    await ws.accept()
    logger.info("WS connected token=%s", token)

    room = await store.get_room(token)
    now = time.time()
    if (not room) or (now >= room.expires_at and room.participants == 0):
        # Auto-create (or recreate) a room with the same token if missing or expired (and empty)
        room = await store.create_room_with_token(token, MAX_PARTICIPANTS_DEFAULT)

    peer_id: str | None = None

    try:
        while True:
            raw = await ws.receive_text()
            try:
                data = json.loads(raw)
            except Exception:
                await send_error(ws, "bad_json", "Invalid JSON")
                continue

            msg_type = data.get("type")

            # JOIN
            if msg_type == "join":
                try:
                    join = JoinMessage(**data)
                except Exception as e:
                    await send_error(ws, "bad_join", f"{e}")
                    continue

                if peer_id is None:
                    # capacity check
                    if room.participants >= room.max_participants and join.peerId not in room.peers:
                        await send_error(ws, "room_full", "Room is full")
                        await ws.close(code=4403)
                        return

                    ok = room.join(join.peerId)
                    if not ok:
                        await send_error(ws, "room_full", "Room is full")
                        await ws.close(code=4403)
                        return

                    peer_id = join.peerId
                    connections.setdefault(token, {})[peer_id] = ws
                    logger.info("peer joined token=%s peer=%s", token, peer_id)

                    # send room info to the newly joined peer
                    try:
                        await ws.send_text(json.dumps({
                            "type": "room-info",
                            "peers": [p for p in room.peers.keys() if p != peer_id],
                            "max": room.max_participants,
                        }))
                    except Exception:
                        pass

                    # notify others that peer joined (optional minimal event)
                    await broadcast(token, peer_id, {"type": "peer-joined", "peerId": peer_id})
                else:
                    await send_error(ws, "already_joined", "Already joined")

            # OFFER/ANSWER
            elif msg_type in ("offer", "answer"):
                try:
                    sdp = SDPMessage(**data)
                except Exception as e:
                    await send_error(ws, "bad_sdp", f"{e}")
                    continue
                await broadcast(token, sdp.peerId, sdp.model_dump())

            # ICE
            elif msg_type == "candidate":
                try:
                    ice = IceMessage(**data)
                except Exception as e:
                    await send_error(ws, "bad_candidate", f"{e}")
                    continue
                await broadcast(token, ice.peerId, ice.model_dump())

            # BYE
            elif msg_type == "bye":
                try:
                    bye = ByeMessage(**data)
                except Exception as e:
                    await send_error(ws, "bad_bye", f"{e}")
                    continue
                await broadcast(token, bye.peerId, bye.model_dump())

            # ORIENTATION
            elif msg_type == "orientation":
                try:
                    orient = OrientationMessage(**data)
                except Exception as e:
                    await send_error(ws, "bad_orientation", f"{e}")
                    continue
                await broadcast(token, orient.peerId, orient.model_dump())

            else:
                await send_error(ws, "unknown_type", f"Unknown type: {msg_type}")

    except WebSocketDisconnect:
        logger.info("WS disconnect token=%s peer=%s", token, peer_id)
    finally:
        # cleanup
        if peer_id:
            try:
                room.leave(peer_id)
                if token in connections and peer_id in connections[token]:
                    del connections[token][peer_id]
                await broadcast(token, peer_id, {"type": "peer-left", "peerId": peer_id})
            except Exception:
                pass


async def broadcast(token: str, from_peer: str, payload: dict):
    peers = connections.get(token, {})
    for pid, socket in list(peers.items()):
        if pid == from_peer:
            continue
        try:
            await socket.send_text(json.dumps(payload))
        except Exception:
            # drop broken socket
            try:
                await socket.close()
            except Exception:
                pass
            del peers[pid]


# --- Admin endpoints ---
@app.get("/api/admin/connections")
async def admin_connections():
    """Return list of active rooms and connected peers."""
    rooms = []
    # Snapshot current connections map
    for token, peers_map in list(connections.items()):
        try:
            room = await store.get_room(token)
        except Exception:
            room = None
        peers_list = []
        if room is not None:
            for pid in list(peers_map.keys()):
                connected_at = None
                try:
                    if pid in room.peers:
                        connected_at = room.peers[pid].connected_at
                except Exception:
                    connected_at = None
                peers_list.append({
                    "peerId": pid,
                    "connectedAt": connected_at,
                })
            participants = room.participants
            maxp = room.max_participants
            status = "active" if participants > 0 else "waiting"
        else:
            for pid in list(peers_map.keys()):
                peers_list.append({"peerId": pid, "connectedAt": None})
            participants = len(peers_map)
            maxp = None
            status = "unknown"
        rooms.append({
            "token": token,
            "participants": participants,
            "maxParticipants": maxp,
            "status": status,
            "peers": peers_list,
        })
    return {"rooms": rooms}


@app.delete("/api/admin/connections/{token}/{peer_id}")
async def admin_disconnect(token: str, peer_id: str):
    ws = connections.get(token, {}).get(peer_id)
    if not ws:
        raise HTTPException(status_code=404, detail="Connection not found")
    # Try to inform client then close
    try:
        try:
            await ws.send_text(json.dumps({
                "type": "error",
                "code": "kicked",
                "message": "Disconnected by admin",
            }))
        except Exception:
            pass
        await ws.close(code=4401)
    except Exception:
        pass
    return JSONResponse({"ok": True})


# --- Admin preview endpoints ---
PREVIEW_MAX_BYTES = 300_000
PREVIEW_TTL_SECONDS = 120
# Structure: previews[token][peer_id] = { 'bytes': bytes, 'type': str, 'ts': float }
previews: Dict[str, Dict[str, dict]] = {}


def _cleanup_previews():
    now = time.time()
    for token, peers in list(previews.items()):
        for pid, meta in list(peers.items()):
            try:
                ts = float(meta.get('ts', 0))
            except Exception:
                ts = 0
            if now - ts > PREVIEW_TTL_SECONDS:
                del peers[pid]
        if not peers:
            del previews[token]


@app.post("/api/admin/preview/{token}/{peer_id}")
async def admin_upload_preview(token: str, peer_id: str, request: Request):
    ctype = (request.headers.get("content-type") or "").lower()
    if not (ctype.startswith("image/jpeg") or ctype.startswith("image/png")):
        raise HTTPException(status_code=415, detail="Unsupported media type")
    body = await request.body()
    if not body:
        raise HTTPException(status_code=400, detail="Empty body")
    if len(body) > PREVIEW_MAX_BYTES:
        raise HTTPException(status_code=413, detail="Payload too large")
    _cleanup_previews()
    if token not in previews:
        previews[token] = {}
    previews[token][peer_id] = {"bytes": body, "type": ("image/jpeg" if "jpeg" in ctype else "image/png"), "ts": time.time()}
    return JSONResponse({"ok": True})


@app.get("/api/admin/preview/{token}/{peer_id}")
async def admin_get_preview(token: str, peer_id: str):
    _cleanup_previews()
    meta = previews.get(token, {}).get(peer_id)
    if not meta:
        raise HTTPException(status_code=404, detail="Preview not found")
    return Response(content=meta["bytes"], media_type=meta["type"])