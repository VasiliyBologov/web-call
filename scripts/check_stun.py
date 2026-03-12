import socket
import struct
import binascii

def send_stun_request(host, port, timeout=3):
    # STUN Binding Request
    # Message Type: 0x0001
    # Message Length: 0x0000
    # Magic Cookie: 0x2112A442
    # Transaction ID: 12 random bytes
    transaction_id = binascii.unhexlify('00112233445566778899aabb')
    stun_packet = struct.pack('>HHI12s', 0x0001, 0x0000, 0x2112A442, transaction_id)

    try:
        # UDP
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        sock.settimeout(timeout)
        print(f"Sending STUN request (UDP) to {host}:{port}...")
        sock.sendto(stun_packet, (host, port))
        data, addr = sock.recvfrom(1024)
        print(f"Received response from {addr}: {binascii.hexlify(data)}")
        return True
    except socket.timeout:
        print(f"Timeout (UDP) for {host}:{port}")
    except Exception as e:
        print(f"Error (UDP): {e}")

    try:
        # TCP
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(timeout)
        print(f"Connecting (TCP) to {host}:{port}...")
        sock.connect((host, port))
        # For TCP, STUN requires length prefix? Or it's just raw?
        # Standard TURN-over-TCP uses 2-byte length
        tcp_packet = struct.pack('>H', len(stun_packet)) + stun_packet
        sock.sendall(tcp_packet)
        data = sock.recv(1024)
        print(f"Received response (TCP) from {host}:{port}: {binascii.hexlify(data)}")
        return True
    except socket.timeout:
        print(f"Timeout (TCP) for {host}:{port}")
    except Exception as e:
        print(f"Error (TCP): {e}")

    return False

if __name__ == "__main__":
    host = "20.80.101.0"
    ports = [3478]
    for p in ports:
        send_stun_request(host, p)
