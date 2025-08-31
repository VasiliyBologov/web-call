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
from fastapi.responses import JSONResponse, Response
from fastapi.middleware.trustedhost import TrustedHostMiddleware
import uvicorn

from .models import CreateRoomResponse, RoomInfo, ErrorMessage, JoinMessage, SDPMessage, IceMessage, ByeMessage, OrientationMessage
from .rooms import RoomStore, MAX_PARTICIPANTS_DEFAULT

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

# Глобальные метрики для мониторинга
class Metrics:
    def __init__(self):
        self.active_connections = 0
        self.total_connections = 0
        self.failed_connections = 0
        self.websocket_errors = 0
        self.api_errors = 0
        self.start_time = time.time()
    
    def connection_established(self):
        self.active_connections += 1
        self.total_connections += 1
    
    def connection_closed(self):
        self.active_connections = max(0, self.active_connections - 1)
    
    def connection_failed(self):
        self.failed_connections += 1
    
    def websocket_error(self):
        self.websocket_errors += 1
    
    def api_error(self):
        self.api_errors += 1
    
    def get_stats(self):
        uptime = time.time() - self.start_time
        return {
            "uptime_seconds": uptime,
            "active_connections": self.active_connections,
            "total_connections": self.total_connections,
            "failed_connections": self.failed_connections,
            "websocket_errors": self.websocket_errors,
            "api_errors": self.api_errors,
            "error_rate": (self.failed_connections + self.websocket_errors + self.api_errors) / max(1, self.total_connections)
        }

metrics = Metrics()

# Конфигурация приложения
app = FastAPI(
    title="Web Call Signaling", 
    version="1.0",
    description="Reliable WebRTC signaling server with enhanced error handling and monitoring"
)

# Middleware для безопасности и CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # В продакшене заменить на конкретные домены
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Trusted Host middleware для безопасности
if os.getenv('TRUSTED_HOSTS'):
    app.add_middleware(
        TrustedHostMiddleware, 
        allowed_hosts=os.getenv('TRUSTED_HOSTS').split(',')
    )

store = RoomStore()

@app.on_event("startup")
async def on_startup():
    """Инициализация приложения при запуске"""
    logger.info("Starting Web Call Signaling Server")
    store.start_cleanup()
    logger.info("Room cleanup service started")

@app.on_event("shutdown")
async def on_shutdown():
    """Очистка при закрытии приложения"""
    logger.info("Shutting down Web Call Signaling Server")
    # Закрываем все активные WebSocket соединения
    for token, peers in list(connections.items()):
        for peer_id, ws in list(peers.items()):
            try:
                await ws.close(code=1001, reason="Server shutdown")
            except Exception as e:
                logger.warning(f"Error closing WebSocket for {token}/{peer_id}: {e}")

# Улучшенный health check с детальной информацией
@app.get("/api/health")
async def health():
    """Расширенный health check с метриками"""
    try:
        # Проверяем доступность хранилища комнат
        room_count = len(store.rooms) if hasattr(store, 'rooms') else 0
        
        # Получаем статистику
        stats = metrics.get_stats()
        
        # Определяем статус сервиса
        health_status = "healthy"
        if stats["error_rate"] > 0.1:  # Более 10% ошибок
            health_status = "degraded"
        if stats["error_rate"] > 0.3:  # Более 30% ошибок
            health_status = "unhealthy"
        
        return {
            "status": health_status,
            "timestamp": datetime.utcnow().isoformat(),
            "version": "1.0",
            "metrics": stats,
            "rooms": {
                "active": room_count,
                "store_available": True
            },
            "websocket": {
                "active_connections": stats["active_connections"],
                "total_connections": stats["total_connections"]
            }
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        metrics.api_error()
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
                "uptime": time.time() - metrics.start_time,
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
            },
            "metrics": metrics.get_stats()
        }
    except Exception as e:
        logger.error(f"Debug info failed: {e}")
        metrics.api_error()
        raise HTTPException(status_code=500, detail=f"Debug info unavailable: {str(e)}")

@app.post("/api/rooms", response_model=CreateRoomResponse)
async def create_room():
    """Создание новой комнаты с улучшенной обработкой ошибок"""
    try:
        room = await store.create_room(max_participants=MAX_PARTICIPANTS_DEFAULT)
        base_url = os.getenv("PUBLIC_BASE_URL")
        
        # Улучшенная валидация PUBLIC_BASE_URL
        if base_url:
            base_url = base_url.strip()
            has_placeholder = "${" in base_url or ":-" in base_url
            if has_placeholder or not base_url.lower().startswith(("http://", "https://")):
                logger.warning(f"Invalid PUBLIC_BASE_URL: {base_url}")
                base_url = None
            else:
                base_url = base_url.rstrip("/")
        
        url_path = f"/r/{room.token}"
        url = f"{base_url}{url_path}" if base_url else url_path
        
        logger.info(f"Room created: {room.token}, max_participants: {room.max_participants}")
        
        return CreateRoomResponse(
            token=room.token, 
            url=url, 
            ttlSeconds=7 * 24 * 3600
        )
    except Exception as e:
        logger.error(f"Failed to create room: {e}")
        metrics.api_error()
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
        metrics.api_error()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get room info: {str(e)}"
        )

# --- WebSocket signaling с улучшенной обработкой ошибок ---

# Mapping: roomToken -> peerId -> WebSocket
connections: Dict[str, Dict[str, WebSocket]] = {}

# Retry конфигурация
WS_RETRY_ATTEMPTS = int(os.getenv('WS_RETRY_ATTEMPTS', '3'))
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
        metrics.connection_established()
        logger.info(f"WebSocket connection established: token={token}, peer={peer_id}")
        yield ws
    except Exception as e:
        logger.error(f"WebSocket connection error: token={token}, peer={peer_id}, error={e}")
        metrics.websocket_error()
        raise
    finally:
        metrics.connection_closed()
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
    """Обработка JOIN сообщения"""
    try:
        join = JoinMessage(**data)
        room = await store.get_room(token)
        
        if not room:
            await send_error(ws, "room_not_found", "Room not found")
            return False
        
        # Проверка емкости
        if room.participants >= room.max_participants and join.peerId not in room.peers:
            await send_error(ws, "room_full", f"Room is full (max {room.max_participants} participants)")
            await ws.close(code=4403)
            return False
        
        ok = room.join(join.peerId)
        if not ok:
            await send_error(ws, "room_full", "Room is full")
            await ws.close(code=4403)
            return False
        
        # Регистрируем соединение
        connections.setdefault(token, {})[join.peerId] = ws
        logger.info(f"Peer joined: token={token}, peer={join.peerId}, total_participants={room.participants}")
        
        # Отправляем информацию о комнате
        try:
            await ws.send_text(json.dumps({
                "type": "room-info",
                "peers": [p for p in room.peers.keys() if p != join.peerId],
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
                    
                    if not success:
                        retry_count += 1
                        if retry_count >= WS_RETRY_ATTEMPTS:
                            logger.error(f"Too many failed messages for {token}/{peer_id}, closing connection")
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
                    metrics.websocket_error()
                    retry_count += 1
                    if retry_count >= WS_RETRY_ATTEMPTS:
                        break
                    await asyncio.sleep(min(WS_RETRY_DELAY * (2 ** retry_count), WS_MAX_RETRY_DELAY))
                    
        except Exception as e:
            logger.error(f"Critical WebSocket error: {e}")
            metrics.websocket_error()
        finally:
            # Очистка при отключении
            if peer_id:
                try:
                    room = await store.get_room(token)
                    if room:
                        room.leave(peer_id)
                    
                    if token in connections and peer_id in connections[token]:
                        del connections[token][peer_id]
                    
                    await broadcast(token, peer_id, {
                        "type": "peer-left", 
                        "peerId": peer_id,
                        "timestamp": datetime.utcnow().isoformat()
                    })
                    
                    logger.info(f"Peer cleanup completed: token={token}, peer={peer_id}")
                    
                except Exception as e:
                    logger.error(f"Error during peer cleanup: {e}")

async def broadcast(token: str, from_peer: str, payload: dict):
    """Улучшенная функция broadcast с обработкой ошибок"""
    peers = connections.get(token, {})
    failed_peers = []
    
    for pid, socket in list(peers.items()):
        if pid == from_peer:
            continue
        
        try:
            await socket.send_text(json.dumps(payload))
            logger.debug(f"Message sent to peer {pid} in room {token}")
        except Exception as e:
            logger.warning(f"Failed to send message to peer {pid} in room {token}: {e}")
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
        metrics.api_error()
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
        metrics.api_error()
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
        metrics.api_error()
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
        metrics.api_error()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve preview: {str(e)}"
        )

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