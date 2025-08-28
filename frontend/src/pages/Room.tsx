import React, { useEffect, useRef, useState } from 'react'
import { ICE_SERVERS, wsUrl } from '../config'

type WSMsg =
  | { type: 'room-info'; peers: string[]; max: number }
  | { type: 'peer-joined'; peerId: string }
  | { type: 'peer-left'; peerId: string }
  | { type: 'offer' | 'answer'; peerId: string; sdp: any }
  | { type: 'candidate'; peerId: string; candidate: any }
  | { type: 'error'; code: string; message: string }

function rid() {
  const b = new Uint8Array(8)
  crypto.getRandomValues(b)
  return Array.from(b, x => x.toString(16).padStart(2, '0')).join('')
}

export const Room: React.FC<{ token: string }> = ({ token }) => {
  const [status, setStatus] = useState<string>('инициализация')
  const [micOn, setMicOn] = useState(true)
  const [camOn, setCamOn] = useState(true)
  const [link] = useState<string>(() => `${window.location.origin}/r/${token}`)

  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)

  const pcRef = useRef<RTCPeerConnection | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const peerIdRef = useRef<string>(rid())
  const roleRef = useRef<'offerer' | 'answerer' | null>(null)

  useEffect(() => {
    let closed = false

    async function start() {
      setStatus('запрос устройств…')
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 30 } },
      })
      localStreamRef.current = stream
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }

      setStatus('создание peer connection…')
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS })
      pcRef.current = pc

      stream.getTracks().forEach(t => pc.addTrack(t, stream))

      pc.ontrack = ev => {
        const [remoteStream] = ev.streams
        if (remoteVideoRef.current && remoteStream) {
          remoteVideoRef.current.srcObject = remoteStream
        }
      }
      pc.oniceconnectionstatechange = () => {
        setStatus(`ICE: ${pc.iceConnectionState}`)
      }
      pc.onicecandidate = ev => {
        if (ev.candidate) {
          send({ type: 'candidate', peerId: peerIdRef.current, candidate: ev.candidate })
        }
      }

      setStatus('подключение к сигнализации…')
      const ws = new WebSocket(wsUrl(`/ws/rooms/${token}`))
      wsRef.current = ws

      ws.onopen = () => {
        // join immediately; role corrected after room-info
        send({ type: 'join', peerId: peerIdRef.current, role: 'offerer' })
        setStatus('ожидание собеседника…')
      }

      ws.onmessage = async ev => {
        const msg: WSMsg = JSON.parse(ev.data)
        if (msg.type === 'error') {
          setStatus(`Ошибка: ${msg.code}`)
          return
        }
        if (msg.type === 'room-info') {
          // decide role
          roleRef.current = (msg.peers?.length ?? 0) > 0 ? 'answerer' : 'offerer'
          if (roleRef.current === 'offerer') {
            await makeOffer()
          }
        } else if (msg.type === 'peer-joined') {
          if (roleRef.current === 'offerer') {
            // Send (or resend) offer once a peer is present
            await makeOffer()
          }
        } else if (msg.type === 'offer') {
          if (!pcRef.current) return
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(msg.sdp))
          const answer = await pcRef.current.createAnswer()
          await pcRef.current.setLocalDescription(answer)
          send({ type: 'answer', peerId: peerIdRef.current, sdp: answer })
          setStatus('в сети')
        } else if (msg.type === 'answer') {
          if (!pcRef.current) return
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(msg.sdp))
          setStatus('в сети')
        } else if (msg.type === 'candidate') {
          if (!pcRef.current) return
          try {
            await pcRef.current.addIceCandidate(msg.candidate)
          } catch (e) {
            console.warn('Failed to add ICE', e)
          }
        } else if (msg.type === 'peer-left') {
          setStatus('собеседник вышел')
        }
      }

      ws.onclose = () => {
        if (!closed) setStatus('сигнализация отключена')
      }
    }

    start().catch(err => {
      console.error(err)
      setStatus('Ошибка инициализации: ' + err)
    })

    return () => {
      closed = true
      try {
        send({ type: 'bye', peerId: peerIdRef.current })
      } catch {}
      try { wsRef.current?.close() } catch {}
      pcRef.current?.getSenders().forEach(s => s.track?.stop())
      localStreamRef.current?.getTracks().forEach(t => t.stop())
      pcRef.current?.close()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  async function makeOffer() {
    if (!pcRef.current) return
    const offer = await pcRef.current.createOffer()
    await pcRef.current.setLocalDescription(offer)
    send({ type: 'offer', peerId: peerIdRef.current, sdp: offer })
    setStatus('подключение…')
  }

  function send(obj: any) {
    const ws = wsRef.current
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(obj))
    }
  }

  function toggleMic() {
    const stream = localStreamRef.current
    if (!stream) return
    const enabled = !micOn
    stream.getAudioTracks().forEach(t => (t.enabled = enabled))
    setMicOn(enabled)
  }

  function toggleCam() {
    const stream = localStreamRef.current
    if (!stream) return
    const enabled = !camOn
    stream.getVideoTracks().forEach(t => (t.enabled = enabled))
    setCamOn(enabled)
  }

  function hangup() {
    try { wsRef.current?.close() } catch {}
    try { pcRef.current?.close() } catch {}
    window.location.href = '/'
  }

  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'sans-serif' }}>
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, background: '#111' }}>
        <video ref={localVideoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', background: '#222' }} />
        <video ref={remoteVideoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', background: '#222' }} />
      </div>
      <div style={{ padding: 12, display: 'flex', alignItems: 'center', gap: 12, borderTop: '1px solid #ddd' }}>
        <strong style={{ flex: 1 }}>{status}</strong>
        <button style={btn} onClick={() => navigator.clipboard.writeText(link)}>Скопировать ссылку</button>
        <button style={btn} onClick={toggleMic}>{micOn ? 'Микрофон выкл' : 'Микрофон вкл'}</button>
        <button style={btn} onClick={toggleCam}>{camOn ? 'Камера выкл' : 'Камера вкл'}</button>
        <button style={{ ...btn, background: '#c62828', color: 'white' }} onClick={hangup}>Положить трубку</button>
      </div>
    </div>
  )
}

const btn: React.CSSProperties = { padding: '10px 14px', fontSize: 16, cursor: 'pointer' }
