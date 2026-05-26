from __future__ import annotations

import json
import logging
import os
import time
import asyncio
from typing import Dict, Optional
from datetime import datetime
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response, HTMLResponse, PlainTextResponse
from starlette.websockets import WebSocketState
import uvicorn

from .models import CreateRoomResponse, RoomInfo, ErrorMessage, JoinMessage, SDPMessage, IceMessage, ByeMessage, OrientationMessage
from .rooms import RoomStore, MAX_PARTICIPANTS_DEFAULT
from . import seo

# Настройка логирования с детальной информацией
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('webcall.log') if os.getenv('LOG_TO_FILE', 'false').lower() == 'true' else logging.NullHandler()
    ]
)
logger = logging.getLogger("webcall")

store = RoomStore()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Управление жизненным циклом приложения с детальным логированием"""
    try:
        # Startup logic
        logger.info("Lifespan: Starting Web Call Signaling Server")
        store.start_cleanup()
        logger.info("Lifespan: Room cleanup service started")
        
        yield
        
    except asyncio.CancelledError:
        logger.warning("Lifespan: Task was cancelled during runtime")
        raise
    except Exception as e:
        logger.error(f"Lifespan: Critical error occurred: {e}", exc_info=True)
        raise
    finally:
        # Shutdown logic
        logger.info("Lifespan: Shutting down Web Call Signaling Server")
        
        # Останавливаем сервис очистки
        try:
            store.stop_cleanup()
            logger.info("Lifespan: Room cleanup service stopped")
        except Exception as e:
            logger.error(f"Lifespan: Error stopping cleanup: {e}")
        
        # Закрываем все активные WebSocket соединения
        closed_count = 0
        for token, peers in list(connections.items()):
            for peer_id, ws in list(peers.items()):
                try:
                    # Проверяем состояние соединения
                    if ws.client_state != WebSocketState.DISCONNECTED:
                        await ws.close(code=1001, reason="Server shutdown")
                        closed_count += 1
                except Exception as e:
                    logger.warning(f"Lifespan: Error closing WebSocket for {token}/{peer_id}: {e}")
        
        if closed_count > 0:
            logger.info(f"Lifespan: Closed {closed_count} active WebSocket connections")
        
        logger.info("Lifespan: Shutdown complete")

# Конфигурация приложения
app = FastAPI(
    title="Web Call Signaling", 
    version="1.0",
    description="Reliable WebRTC signaling server with enhanced error handling and monitoring",
    lifespan=lifespan
)

# Middleware для безопасности и CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # В продакшене заменить на конкретные домены
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Упрощенный health check
@app.get("/api/health")
async def health():
    """Простой health check"""
    try:
        # Проверяем доступность хранилища комнат
        room_count = len(store.rooms) if hasattr(store, 'rooms') else 0
        
        return {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "version": "1.0",
            "rooms": {
                "active": room_count,
                "store_available": True
            }
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status": "unhealthy",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
        )

# Дополнительный endpoint для диагностики
@app.get("/api/debug")
async def debug_info():
    """Диагностическая информация для отладки"""
    try:
        return {
            "server_info": {
                "pid": os.getpid(),
                "python_version": f"{os.sys.version_info.major}.{os.sys.version_info.minor}.{os.sys.version_info.micro}"
            },
            "environment": {
                "public_base_url": os.getenv("PUBLIC_BASE_URL"),
                "max_participants": MAX_PARTICIPANTS_DEFAULT,
                "log_level": logger.level
            },
            "connections": {
                "active_rooms": len(connections),
                "total_peers": sum(len(peers) for peers in connections.values()),
                "room_tokens": list(connections.keys())
            }
        }
    except Exception as e:
        logger.error(f"Debug info failed: {e}")
        raise HTTPException(status_code=500, detail=f"Debug info unavailable: {str(e)}")

@app.post("/api/rooms", response_model=CreateRoomResponse)
async def create_room(request: Request):
    """Создание новой комнаты с улучшенной обработкой ошибок"""
    try:
        room = await store.create_room(max_participants=MAX_PARTICIPANTS_DEFAULT)
        # Используем PUBLIC_BASE_URL или базовый URL из запроса
        base_url = os.getenv("PUBLIC_BASE_URL", "").rstrip("/")
        if not base_url:
            base_url = str(request.base_url).rstrip("/")
        
        url_path = f"/r/{room.token}"
        url = f"{base_url}{url_path}"
        
        logger.info(f"Room created: {room.token}, max_participants: {room.max_participants}")
        
        return CreateRoomResponse(
            token=room.token, 
            url=url, 
            ttlSeconds=7 * 24 * 3600
        )
    except Exception as e:
        logger.error(f"Failed to create room: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create room: {str(e)}"
        )

@app.get("/api/rooms/{token}", response_model=RoomInfo)
async def get_room(token: str):
    """Получение информации о комнате с улучшенной обработкой ошибок"""
    try:
        room = await store.get_room(token)
        now = time.time()
        
        if (not room) or (now >= room.expires_at and room.participants == 0):
            # Автоматическое создание/воссоздание комнаты
            logger.info(f"Auto-creating room with token: {token}")
            room = await store.create_room_with_token(token, MAX_PARTICIPANTS_DEFAULT)
        
        status = "active" if room.participants > 0 else "waiting"
        
        logger.debug(f"Room info requested: {token}, participants: {room.participants}, status: {status}")
        
        return RoomInfo(
            token=token, 
            participants=room.participants, 
            maxParticipants=room.max_participants, 
            status=status
        )
    except Exception as e:
        logger.error(f"Failed to get room {token}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get room info: {str(e)}"
        )

# --- WebSocket signaling с улучшенной обработкой ошибок ---

# Mapping: roomToken -> peerId -> WebSocket
connections: Dict[str, Dict[str, WebSocket]] = {}

# Retry конфигурация
WS_RETRY_ATTEMPTS = int(os.getenv('WS_RETRY_ATTEMPTS', '10'))
WS_RETRY_DELAY = float(os.getenv('WS_RETRY_DELAY', '1.0'))
WS_MAX_RETRY_DELAY = float(os.getenv('WS_MAX_RETRY_DELAY', '30.0'))

async def send_error(ws: WebSocket, code: str, message: str, details: Optional[str] = None):
    """Отправка структурированной ошибки клиенту"""
    error_data = {
        "type": "error",
        "code": code,
        "message": message,
        "timestamp": datetime.utcnow().isoformat()
    }
    if details:
        error_data["details"] = details
    
    try:
        await ws.send_text(json.dumps(error_data))
        logger.warning(f"Sent error to client: {code} - {message}")
    except Exception as e:
        logger.error(f"Failed to send error to client: {e}")

@asynccontextmanager
async def websocket_connection_manager(ws: WebSocket, token: str, peer_id: Optional[str] = None):
    """Контекстный менеджер для управления WebSocket соединениями"""
    try:
        logger.info(f"WebSocket connection established: token={token}, peer={peer_id}")
        yield ws
    except Exception as e:
        logger.error(f"WebSocket connection error: token={token}, peer={peer_id}, error={e}")
        raise
    finally:
        logger.info(f"WebSocket connection closed: token={token}, peer={peer_id}")

async def handle_websocket_message(ws: WebSocket, token: str, peer_id: str, data: dict):
    """Обработка сообщений WebSocket с улучшенной валидацией"""
    try:
        msg_type = data.get("type")
        
        if not msg_type:
            await send_error(ws, "missing_type", "Message type is required")
            return False
        
        # JOIN
        if msg_type == "join":
            return await handle_join_message(ws, token, peer_id, data)
        
        # OFFER/ANSWER
        elif msg_type in ("offer", "answer"):
            return await handle_sdp_message(ws, token, peer_id, data)
        
        # ICE
        elif msg_type == "candidate":
            return await handle_ice_message(ws, token, peer_id, data)
        
        # BYE
        elif msg_type == "bye":
            return await handle_bye_message(ws, token, peer_id, data)
        
        # ORIENTATION
        elif msg_type == "orientation":
            return await handle_orientation_message(ws, token, peer_id, data)
        
        else:
            await send_error(ws, "unknown_type", f"Unknown message type: {msg_type}")
            return False
            
    except Exception as e:
        logger.error(f"Error handling WebSocket message: {e}")
        await send_error(ws, "internal_error", "Internal server error", str(e))
        return False

async def handle_join_message(ws: WebSocket, token: str, peer_id: str, data: dict):
    """Обработка JOIN сообщения с атомарной регистрацией"""
    try:
        join = JoinMessage(**data)
        
        # Атомарно присоединяемся и получаем список участников
        result = await store.join_room(token, join.peerId)
        if not result:
            await send_error(ws, "room_not_found", "Room not found")
            return False
            
        room, others = result
        
        # Проверка емкости (если мы не были в комнате и она заполнена)
        if join.peerId not in room.peers and len(room.peers) >= room.max_participants:
            await send_error(ws, "room_full", f"Room is full (max {room.max_participants} participants)")
            await ws.close(code=4403)
            return False
        
        # Регистрируем соединение в глобальном реестре
        connections.setdefault(token, {})[join.peerId] = ws
        logger.info(f"Peer joined: token={token}, peer={join.peerId}, total_participants={room.participants}, others_count={len(others)}")
        
        # Отправляем информацию о комнате (список peers на момент входа)
        try:
            await ws.send_text(json.dumps({
                "type": "room-info",
                "peers": others,
                "max": room.max_participants,
                "timestamp": datetime.utcnow().isoformat()
            }))
        except Exception as e:
            logger.error(f"Failed to send room info: {e}")
        
        # Уведомляем других участников
        await broadcast(token, join.peerId, {
            "type": "peer-joined", 
            "peerId": join.peerId,
            "timestamp": datetime.utcnow().isoformat()
        })
        
        return True
        
    except Exception as e:
        logger.error(f"Join message handling failed: {e}")
        await send_error(ws, "bad_join", f"Invalid join message: {str(e)}")
        return False

async def handle_sdp_message(ws: WebSocket, token: str, peer_id: str, data: dict):
    """Обработка SDP сообщений (offer/answer)"""
    try:
        sdp = SDPMessage(**data)
        await broadcast(token, sdp.peerId, sdp.model_dump())
        logger.debug(f"SDP message forwarded: type={data.get('type')}, peer={sdp.peerId}")
        return True
    except Exception as e:
        logger.error(f"SDP message handling failed: {e}")
        await send_error(ws, "bad_sdp", f"Invalid SDP message: {str(e)}")
        return False

async def handle_ice_message(ws: WebSocket, token: str, peer_id: str, data: dict):
    """Обработка ICE кандидатов"""
    try:
        ice = IceMessage(**data)
        await broadcast(token, ice.peerId, ice.model_dump())
        logger.debug(f"ICE candidate forwarded: peer={ice.peerId}")
        return True
    except Exception as e:
        logger.error(f"ICE message handling failed: {e}")
        await send_error(ws, "bad_candidate", f"Invalid ICE candidate: {str(e)}")
        return False

async def handle_bye_message(ws: WebSocket, token: str, peer_id: str, data: dict):
    """Обработка BYE сообщений"""
    try:
        bye = ByeMessage(**data)
        await broadcast(token, bye.peerId, bye.model_dump())
        logger.info(f"Peer leaving: token={token}, peer={bye.peerId}")
        return True
    except Exception as e:
        logger.error(f"BYE message handling failed: {e}")
        await send_error(ws, "bad_bye", f"Invalid bye message: {str(e)}")
        return False

async def handle_orientation_message(ws: WebSocket, token: str, peer_id: str, data: dict):
    """Обработка сообщений об ориентации"""
    try:
        orient = OrientationMessage(**data)
        await broadcast(token, orient.peerId, orient.model_dump())
        logger.debug(f"Orientation message forwarded: peer={orient.peerId}, layout={orient.layout}")
        return True
    except Exception as e:
        logger.error(f"Orientation message handling failed: {e}")
        await send_error(ws, "bad_orientation", f"Invalid orientation message: {str(e)}")
        return False

@app.websocket("/ws/rooms/{token}")
async def ws_room(ws: WebSocket, token: str):
    """WebSocket endpoint с улучшенной обработкой ошибок и retry логикой"""
    await ws.accept()
    
    room = await store.get_room(token)
    now = time.time()
    if (not room) or (now >= room.expires_at and room.participants == 0):
        # Автоматическое создание/воссоздание комнаты
        room = await store.create_room_with_token(token, MAX_PARTICIPANTS_DEFAULT)
        logger.info(f"Auto-created room for WebSocket: {token}")

    peer_id: Optional[str] = None
    retry_count = 0
    
    async with websocket_connection_manager(ws, token, peer_id):
        try:
            while True:
                try:
                    raw = await ws.receive_text()
                    data = json.loads(raw)
                    
                    # Обрабатываем сообщение
                    success = await handle_websocket_message(ws, token, peer_id, data)
                    
                    # Фиксируем peer_id при успешном join
                    if success and data.get("type") == "join":
                        new_peer_id = data.get("peerId")
                        if new_peer_id:
                            if peer_id and peer_id != new_peer_id:
                                logger.info(f"Peer ID changed: {peer_id} -> {new_peer_id}")
                            peer_id = new_peer_id
                    
                    if not success:
                        retry_count += 1
                        logger.warning(f"Message handling failed ({retry_count}/{WS_RETRY_ATTEMPTS}) for {token}/{peer_id}")
                        if retry_count >= WS_RETRY_ATTEMPTS:
                            logger.error(f"Too many failed messages, closing connection")
                            break
                        continue
                    
                    # Сбрасываем счетчик ошибок при успешном сообщении
                    retry_count = 0
                    
                except json.JSONDecodeError as e:
                    logger.warning(f"Invalid JSON from {token}/{peer_id}: {e}")
                    await send_error(ws, "bad_json", "Invalid JSON format")
                    retry_count += 1
                    if retry_count >= WS_RETRY_ATTEMPTS:
                        break
                    continue
                    
                except WebSocketDisconnect:
                    logger.info(f"WebSocket disconnect: token={token}, peer={peer_id}")
                    break
                    
                except Exception as e:
                    logger.error(f"Unexpected error in WebSocket loop: {e}")
                    retry_count += 1
                    if retry_count >= WS_RETRY_ATTEMPTS:
                        break
                    await asyncio.sleep(min(WS_RETRY_DELAY * (2 ** retry_count), WS_MAX_RETRY_DELAY))
                    
        except Exception as e:
            logger.error(f"Critical WebSocket error: {e}")
        finally:
            # Очистка при отключении
            if peer_id:
                try:
                    room = await store.get_room(token)
                    if room:
                        room.leave(peer_id)
                    
                    if token in connections and peer_id in connections[token]:
                        # Удаляем только если это то же самое соединение, которое мы создали
                        if connections[token][peer_id] is ws:
                            del connections[token][peer_id]
                            logger.info(f"Connection removed from registry: {token}/{peer_id}")
                        else:
                            logger.debug(f"Registry already has newer connection for {token}/{peer_id}, skip removal")
                    
                    await broadcast(token, peer_id, {
                        "type": "peer-left", 
                        "peerId": peer_id,
                        "timestamp": datetime.utcnow().isoformat()
                    })
                    
                    logger.info(f"Peer cleanup completed: token={token}, peer={peer_id}")
                    
                except Exception as e:
                    logger.error(f"Error during peer cleanup: {e}")

async def broadcast(token: str, from_peer: str, payload: dict):
    """Улучшенная функция broadcast с обработкой ошибок и детальным логированием"""
    peers = connections.get(token, {})
    if not peers:
        logger.debug(f"Broadcast: no peers in room {token} to send to (from {from_peer})")
        return

    failed_peers = []
    payload_type = payload.get("type", "unknown")
    
    for pid, socket in list(peers.items()):
        if pid == from_peer:
            continue
        
        try:
            await socket.send_text(json.dumps(payload))
            logger.info(f"Broadcast: {payload_type} from {from_peer} sent to {pid} in room {token}")
        except Exception as e:
            logger.warning(f"Broadcast failed: {payload_type} from {from_peer} to {pid}: {e}")
            failed_peers.append(pid)
    
    # Удаляем неработающие соединения
    for pid in failed_peers:
        try:
            peers[pid].close()
        except Exception:
            pass
        del peers[pid]
        logger.info(f"Removed failed peer {pid} from room {token}")

# --- Admin endpoints с улучшенной диагностикой ---
@app.get("/api/admin/connections")
async def admin_connections():
    """Улучшенный endpoint для мониторинга соединений"""
    try:
        rooms = []
        # Снимок текущих соединений
        for token, peers_map in list(connections.items()):
            try:
                room = await store.get_room(token)
            except Exception as e:
                logger.error(f"Failed to get room {token}: {e}")
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
                        "connectionDuration": time.time() - connected_at if connected_at else None
                    })
                
                participants = room.participants
                maxp = room.max_participants
                status = "active" if participants > 0 else "waiting"
            else:
                for pid in list(peers_map.keys()):
                    peers_list.append({"peerId": pid, "connectedAt": None, "connectionDuration": None})
                participants = len(peers_map)
                maxp = None
                status = "unknown"
            
            rooms.append({
                "token": token,
                "participants": participants,
                "maxParticipants": maxp,
                "status": status,
                "peers": peers_list,
                "lastUpdated": datetime.utcnow().isoformat()
            })
        
        return {
            "rooms": rooms,
            "total_rooms": len(rooms),
            "total_peers": sum(len(room["peers"]) for room in rooms),
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Admin connections endpoint failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get connections info: {str(e)}"
        )

@app.delete("/api/admin/connections/{token}/{peer_id}")
async def admin_disconnect(token: str, peer_id: str):
    """Принудительное отключение участника администратором"""
    try:
        ws = connections.get(token, {}).get(peer_id)
        if not ws:
            raise HTTPException(status_code=404, detail="Connection not found")
        
        # Информируем клиента и закрываем соединение
        try:
            await ws.send_text(json.dumps({
                "type": "error",
                "code": "kicked",
                "message": "Disconnected by admin",
                "timestamp": datetime.utcnow().isoformat()
            }))
        except Exception as e:
            logger.warning(f"Failed to send kick message: {e}")
        
        await ws.close(code=4401)
        
        # Очистка
        if token in connections and peer_id in connections[token]:
            del connections[token][peer_id]
        
        room = await store.get_room(token)
        if room:
            room.leave(peer_id)
        
        logger.info(f"Admin disconnected peer {peer_id} from room {token}")
        
        return JSONResponse({"ok": True, "message": f"Peer {peer_id} disconnected from room {token}"})
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Admin disconnect failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to disconnect peer: {str(e)}"
        )

# --- Admin preview endpoints с улучшенной обработкой ошибок ---
PREVIEW_MAX_BYTES = int(os.getenv('PREVIEW_MAX_BYTES', '300000'))
PREVIEW_TTL_SECONDS = int(os.getenv('PREVIEW_TTL_SECONDS', '120'))

# Структура: previews[token][peer_id] = { 'bytes': bytes, 'type': str, 'ts': float }
previews: Dict[str, Dict[str, dict]] = {}

def _cleanup_previews():
    """Очистка устаревших превью"""
    now = time.time()
    cleaned_count = 0
    
    for token, peers in list(previews.items()):
        for pid, meta in list(peers.items()):
            try:
                ts = float(meta.get('ts', 0))
            except Exception:
                ts = 0
            
            if now - ts > PREVIEW_TTL_SECONDS:
                del peers[pid]
                cleaned_count += 1
        
        if not peers:
            del previews[token]
    
    if cleaned_count > 0:
        logger.debug(f"Cleaned up {cleaned_count} expired previews")

@app.post("/api/admin/preview/{token}/{peer_id}")
async def admin_upload_preview(token: str, peer_id: str, request: Request):
    """Загрузка превью с улучшенной валидацией"""
    try:
        ctype = (request.headers.get("content-type") or "").lower()
        if not (ctype.startswith("image/jpeg") or ctype.startswith("image/png")):
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, 
                detail="Only JPEG and PNG images are supported"
            )
        
        body = await request.body()
        if not body:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="Empty preview data"
            )
        
        if len(body) > PREVIEW_MAX_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, 
                detail=f"Preview too large (max {PREVIEW_MAX_BYTES} bytes)"
            )
        
        _cleanup_previews()
        
        if token not in previews:
            previews[token] = {}
        
        previews[token][peer_id] = {
            "bytes": body, 
            "type": ("image/jpeg" if "jpeg" in ctype else "image/png"), 
            "ts": time.time(),
            "size": len(body)
        }
        
        logger.debug(f"Preview uploaded: token={token}, peer={peer_id}, size={len(body)} bytes")
        
        return JSONResponse({
            "ok": True, 
            "size": len(body),
            "timestamp": datetime.utcnow().isoformat()
        })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Preview upload failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload preview: {str(e)}"
        )

@app.get("/api/admin/preview/{token}/{peer_id}")
async def admin_get_preview(token: str, peer_id: str):
    """Получение превью с улучшенной обработкой ошибок"""
    try:
        _cleanup_previews()
        meta = previews.get(token, {}).get(peer_id)
        
        if not meta:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail="Preview not found or expired"
            )
        
        logger.debug(f"Preview retrieved: token={token}, peer={peer_id}")
        
        return Response(
            content=meta["bytes"], 
            media_type=meta["type"],
            headers={
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Pragma": "no-cache",
                "Expires": "0"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Preview retrieval failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve preview: {str(e)}"
        )

# --- SEO ROUTES ---

@app.get("/robots.txt", response_class=PlainTextResponse)
async def robots_txt(request: Request):
    host = request.headers.get("host", "")
    subdomain = seo.get_subdomain(host)
    return seo.get_robots_txt(subdomain, host)

@app.get("/sitemap.xml", response_class=Response)
async def sitemap_xml(request: Request):
    host = request.headers.get("host", "")
    subdomain = seo.get_subdomain(host)
    return Response(content=seo.get_sitemap_xml(subdomain, host), media_type="application/xml")

@app.get("/{path:path}", response_class=HTMLResponse)
async def catch_all(request: Request, path: str):
    # Ignore API and static files
    if path.startswith("api/") or path.startswith("ws/") or "." in path:
        raise HTTPException(status_code=404)
        
    subdomain = seo.get_subdomain(request.headers.get("host", ""))
    metadata = seo.generate_metadata(subdomain, f"/{path}", request.headers.get("host", ""))
    
    # Path to index.html
    # In Docker: /usr/share/nginx/html/index.html
    # Local: frontend/index.html (source) or frontend/dist/index.html (build)
    index_path = os.getenv("INDEX_HTML_PATH", "/usr/share/nginx/html/index.html")
    if not os.path.exists(index_path):
        # Fallback for development
        for p in ["frontend/dist/index.html", "frontend/index.html"]:
            if os.path.exists(p):
                index_path = p
                break
    
    try:
        with open(index_path, "r", encoding="utf-8") as f:
            html = f.read()
        
        html = seo.inject_metadata(html, metadata, f"/{path}", request.headers.get("host", ""))
        return html
    except Exception as e:
        logger.error(f"Failed to serve index.html: {e}")
        return HTMLResponse(content="<html><body>Error loading page</body></html>", status_code=500)

# Запуск сервера с улучшенной конфигурацией
if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=False,
        log_level="info",
        access_log=True,
        timeout_keep_alive=30,
        timeout_graceful_shutdown=30
    )