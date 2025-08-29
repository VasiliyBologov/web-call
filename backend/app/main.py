from __future__ import annotations

import json
import logging
import os
from typing import Dict

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

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
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    status = "active" if room.participants > 0 else "waiting"
    return RoomInfo(token=token, participants=room.participants, status=status)


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
    if not room:
        await send_error(ws, "room_not_found", "Room not found")
        await ws.close(code=4404)
        return

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
