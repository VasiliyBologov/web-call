from __future__ import annotations

from enum import Enum
from typing import Any, Literal, Optional, Union

from pydantic import BaseModel, Field


class Role(str, Enum):
    offerer = "offerer"
    answerer = "answerer"


class JoinMessage(BaseModel):
    type: Literal["join"] = "join"
    peerId: str = Field(..., min_length=1, max_length=128)
    role: Role
    name: Optional[str] = None


class SDPMessage(BaseModel):
    type: Literal["offer", "answer"]
    peerId: str
    to: Optional[str] = None
    sdp: Any


class IceCandidate(BaseModel):
    candidate: Any
    sdpMid: Optional[str] = None
    sdpMLineIndex: Optional[int] = None


class IceMessage(BaseModel):
    type: Literal["candidate"] = "candidate"
    peerId: str
    to: Optional[str] = None
    candidate: IceCandidate


class ByeMessage(BaseModel):
    type: Literal["bye"] = "bye"
    peerId: str


class OrientationMessage(BaseModel):
    type: Literal["orientation"] = "orientation"
    peerId: str
    layout: Literal["portrait", "landscape"]


class ChatMessage(BaseModel):
    type: Literal["chat"] = "chat"
    peerId: str
    name: Optional[str] = None
    text: str
    timestamp: float = Field(default_factory=lambda: 0.0)


SignalMessage = Union[JoinMessage, SDPMessage, IceMessage, ByeMessage, OrientationMessage, ChatMessage]


class CreateRoomResponse(BaseModel):
    token: str
    url: str
    ttlSeconds: int


class RoomInfo(BaseModel):
    token: str
    participants: int
    maxParticipants: int = 2
    status: Literal["waiting", "active"]
    expiresAt: float


class LiveRoomInfo(BaseModel):
    token: str
    title: str
    category: str
    participants: int
    country: Optional[str] = None
    city: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    createdAt: float
    streamerPeerId: Optional[str] = None


class CreateLiveRoomRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=100)
    category: str
    locationLevel: Literal["country", "city", "region", "hidden"] = "country"
    country: Optional[str] = None
    city: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    chatEnabled: bool = True


class ErrorMessage(BaseModel):
    type: Literal["error"] = "error"
    code: str
    message: str
