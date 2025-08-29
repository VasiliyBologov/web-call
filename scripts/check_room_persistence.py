import asyncio
import time
from backend.app.rooms import RoomStore

async def main():
    store = RoomStore(ttl_seconds=3600)  # 1 hour TTL
    room = await store.create_room()
    token = room.token
    assert await store.get_room(token) is not None, "Room should exist after creation"

    # Simulate two peers join/leave
    assert room.join('peer1')
    assert room.join('peer2')
    room.leave('peer1')
    room.leave('peer2')

    # Run cleanup shortly after room becomes empty
    await store.cleanup()
    still = await store.get_room(token)
    if still is None:
        raise SystemExit("FAIL: Room was removed when empty before TTL (should persist)")
    print("OK: Empty room persisted (not deleted) before TTL")

    # Force expire and cleanup
    room.expires_at = time.time() - 1
    await store.cleanup()
    deleted = await store.get_room(token)
    if deleted is not None:
        raise SystemExit("FAIL: Room not deleted after TTL expiry")
    print("OK: Room deleted after TTL expiry")

if __name__ == "__main__":
    asyncio.run(main())
