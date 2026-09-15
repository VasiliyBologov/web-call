import pytest
from httpx import ASGITransport, AsyncClient
import time
from app.main import _log_ref, app


def test_log_reference_does_not_expose_private_identifier():
    token = "private-room-token"
    reference = _log_ref(token)

    assert token not in reference
    assert len(reference) == 12

@pytest.mark.asyncio
async def test_health_check():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

@pytest.mark.asyncio
async def test_create_room():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/rooms")
    assert response.status_code == 200
    data = response.json()
    assert "token" in data
    assert "url" in data
    assert "/r/" in data["url"]

@pytest.mark.asyncio
async def test_create_meeting():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/meet")
    assert response.status_code == 200
    data = response.json()
    assert "token" in data
    assert "url" in data
    assert "/m/" in data["url"]
    assert data["ttlSeconds"] == 7200

@pytest.mark.asyncio
async def test_get_meeting_info():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Create
        create_res = await ac.post("/api/meet")
        token = create_res.json()["token"]
        
        # Get
        response = await ac.get(f"/api/meet/{token}")
    assert response.status_code == 200
    data = response.json()
    assert data["token"] == token
    assert data["maxParticipants"] == 10
    assert data["expiresAt"] > time.time()

@pytest.mark.asyncio
async def test_get_nonexistent_meeting():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/meet/nonexistent-token")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_debug_endpoint_does_not_expose_room_tokens():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        create_response = await ac.post("/api/rooms")
        token = create_response.json()["token"]
        debug_response = await ac.get("/api/debug")

    assert debug_response.status_code == 200
    assert token not in debug_response.text
    assert debug_response.json()["connections"]["room_tokens_exposed"] is False
