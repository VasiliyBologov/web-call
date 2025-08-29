from __future__ import annotations

from enum import Enum
from typing import Any, Literal, Optional

from pydantic import BaseModel, Field


class Role(str, Enum):
    offerer = "offerer"
    answerer = "answerer"


class JoinMessage(BaseModel):
    type: Literal["join"] = "join"
    peerId: str = Field(..., min_length=1, max_length=128)
    role: Role


class SDPMessage(BaseModel):
    type: Literal["offer", "answer"]
    peerId: str
    sdp: Any


class IceCandidate(BaseModel):
    candidate: Any
    sdpMid: Optional[str] = None
    sdpMLineIndex: Optional[int] = None


class IceMessage(BaseModel):
    type: Literal["candidate"] = "candidate"
    peerId: str
    candidate: IceCandidate


class ByeMessage(BaseModel):
    type: Literal["bye"] = "bye"
    peerId: str


class OrientationMessage(BaseModel):
    type: Literal["orientation"] = "orientation"
    peerId: str
    layout: Literal["portrait", "landscape"]


SignalMessage = JoinMessage | SDPMessage | IceMessage | ByeMessage | OrientationMessage


class CreateRoomResponse(BaseModel):
    token: str
    url: str
    ttlSeconds: int


class RoomInfo(BaseModel):
    token: str
    participants: int
    maxParticipants: int = 2
    status: Literal["waiting", "active"]


class ErrorMessage(BaseModel):
    type: Literal["error"] = "error"
    code: str
    message: str
