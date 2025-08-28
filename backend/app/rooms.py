from __future__ import annotations

import asyncio
import secrets
import time
from dataclasses import dataclass, field
from typing import Dict, Optional, Set

DEFAULT_ROOM_TTL_SECONDS = 7 * 24 * 3600  # 7 days
EMPTY_ROOM_IDLE_CLOSE_SECONDS = 5 * 60  # 5 minutes
MAX_PARTICIPANTS_DEFAULT = 2


@dataclass
class Peer:
    peer_id: str
    connected_at: float = field(default_factory=lambda: time.time())


@dataclass
class Room:
    token: str
    created_at: float
    expires_at: float
    max_participants: int = MAX_PARTICIPANTS_DEFAULT
    peers: Dict[str, Peer] = field(default_factory=dict)
    last_empty_since: Optional[float] = None

    def join(self, peer_id: str) -> bool:
        if peer_id in self.peers:
            return True
        if len(self.peers) >= self.max_participants:
            return False
        self.peers[peer_id] = Peer(peer_id)
        self.last_empty_since = None
        return True

    def leave(self, peer_id: str) -> None:
        if peer_id in self.peers:
            del self.peers[peer_id]
        if not self.peers:
            self.last_empty_since = time.time()

    @property
    def participants(self) -> int:
        return len(self.peers)


class RoomStore:
    def __init__(self, ttl_seconds: int = DEFAULT_ROOM_TTL_SECONDS):
        self._rooms: Dict[str, Room] = {}
        self._ttl_seconds = ttl_seconds
        self._lock = asyncio.Lock()
        self._cleanup_task: Optional[asyncio.Task] = None

    def start_cleanup(self) -> None:
        if self._cleanup_task is None:
            self._cleanup_task = asyncio.create_task(self._cleanup_loop())

    async def _cleanup_loop(self):
        while True:
            try:
                await asyncio.sleep(30)
                await self.cleanup()
            except asyncio.CancelledError:
                break
            except Exception:
                # best-effort cleanup; avoid crashing
                pass

    async def cleanup(self):
        now = time.time()
        async with self._lock:
            tokens_to_delete: Set[str] = set()
            for token, room in self._rooms.items():
                if now >= room.expires_at:
                    tokens_to_delete.add(token)
                    continue
                if room.participants == 0 and room.last_empty_since is not None:
                    if now - room.last_empty_since >= EMPTY_ROOM_IDLE_CLOSE_SECONDS:
                        tokens_to_delete.add(token)
            for token in tokens_to_delete:
                self._rooms.pop(token, None)

    async def create_room(self, max_participants: int = MAX_PARTICIPANTS_DEFAULT) -> Room:
        token = self._generate_token()
        now = time.time()
        room = Room(token=token, created_at=now, expires_at=now + self._ttl_seconds,
                    max_participants=max_participants)
        async with self._lock:
            self._rooms[token] = room
        return room

    async def get_room(self, token: str) -> Optional[Room]:
        async with self._lock:
            return self._rooms.get(token)

    async def delete_room(self, token: str) -> None:
        async with self._lock:
            self._rooms.pop(token, None)

    @staticmethod
    def _generate_token() -> str:
        # ~128-bit token, URL-safe
        return secrets.token_urlsafe(16)
