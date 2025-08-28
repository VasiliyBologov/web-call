import React, { useEffect, useRef, useState } from 'react'
import { ICE_SERVERS, wsUrl, ICE_TRANSPORT_POLICY } from '../config'

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
  const [outputs, setOutputs] = useState<MediaDeviceInfo[]>([])
  const [sinkId, setSinkId] = useState<string | null>(() => localStorage.getItem('audioSinkId'))
  const [outputSupported, setOutputSupported] = useState<boolean>(() => typeof (HTMLMediaElement.prototype as any).setSinkId === 'function')

  const pcRef = useRef<RTCPeerConnection | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const peerIdRef = useRef<string>(rid())
  const roleRef = useRef<'offerer' | 'answerer' | null>(null)
  const iceRetriesRef = useRef(0)
  const disconnectedTimerRef = useRef<number | null>(null)
  const remoteStreamRef = useRef<MediaStream | null>(null)
  const [needsPlaybackResume, setNeedsPlaybackResume] = useState(false)
  const cleanupPlaybackResumeRef = useRef<(() => void) | null>(null)

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
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS, iceTransportPolicy: ICE_TRANSPORT_POLICY })
      pcRef.current = pc

      stream.getTracks().forEach(t => pc.addTrack(t, stream))

      pc.ontrack = async ev => {
        const [remoteStream] = ev.streams
        if (remoteStream) {
          remoteStreamRef.current = remoteStream
        }
        const el = remoteVideoRef.current as HTMLVideoElement | null
        if (el && remoteStream) {
          el.srcObject = remoteStream
          ;(el as any).muted = false
          try {
            const anyEl: any = el
            if (outputSupported && anyEl.setSinkId) {
              await anyEl.setSinkId(sinkId ?? 'default')
            }
          } catch (e) {
            console.warn('setSinkId failed', e)
          }
          tryPlayRemote('ontrack')
          if (ev.track) {
            ev.track.onunmute = () => tryPlayRemote('track-unmute')
          }
        }
      }
      pc.oniceconnectionstatechange = () => {
        const state = pc.iceConnectionState
        setStatus(`ICE: ${state}`)

        // Clear timer on healthy states
        if (state === 'connected' || state === 'completed') {
          iceRetriesRef.current = 0
          if (disconnectedTimerRef.current) {
            window.clearTimeout(disconnectedTimerRef.current)
            disconnectedTimerRef.current = null
          }
        }

        if (state === 'disconnected') {
          // If stays disconnected for >5s, attempt ICE restart
          if (disconnectedTimerRef.current) {
            window.clearTimeout(disconnectedTimerRef.current)
          }
          disconnectedTimerRef.current = window.setTimeout(() => {
            if (pcRef.current && pcRef.current.iceConnectionState === 'disconnected') {
              attemptIceRestart()
            }
          }, 5000)
        } else if (state === 'failed') {
          attemptIceRestart()
        }
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
      if (disconnectedTimerRef.current) {
        window.clearTimeout(disconnectedTimerRef.current)
        disconnectedTimerRef.current = null
      }
      if (cleanupPlaybackResumeRef.current) {
        cleanupPlaybackResumeRef.current()
      }
      iceRetriesRef.current = 0
      pcRef.current?.getSenders().forEach(s => s.track?.stop())
      localStreamRef.current?.getTracks().forEach(t => t.stop())
      pcRef.current?.close()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  // Enumerate audio output devices and react to changes
  useEffect(() => {
    let mounted = true
    async function ensureLabels() {
      try {
        // Request mic briefly so labels are available in some browsers
        const s = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
        s.getTracks().forEach(t => t.stop())
      } catch {}
    }
    async function refreshOutputs() {
      try {
        const list = await navigator.mediaDevices.enumerateDevices()
        const outs = list.filter(d => d.kind === 'audiooutput')
        if (!mounted) return
        setOutputs(outs)
      } catch (e) {
        console.warn('enumerateDevices failed', e)
      }
    }

    // Initial detection
    ensureLabels().finally(refreshOutputs)

    const onChange = () => refreshOutputs()
    navigator.mediaDevices?.addEventListener?.('devicechange', onChange)
    return () => {
      mounted = false
      navigator.mediaDevices?.removeEventListener?.('devicechange', onChange)
    }
  }, [])

  useEffect(() => {
    const el = remoteVideoRef.current
    if (!el) return
    try {
      el.setAttribute('playsinline', 'true')
      ;(el as any).playsInline = true
      ;(el as any).muted = false
      const onMeta = () => tryPlayRemote('loadedmetadata')
      el.addEventListener('loadedmetadata', onMeta)
      return () => {
        el.removeEventListener('loadedmetadata', onMeta)
      }
    } catch {}
  }, [])

  async function applySink(id: string | null) {
    const el = remoteVideoRef.current as any
    if (!el) return
    if (!outputSupported || !el.setSinkId) return
    try {
      await el.setSinkId(id ?? 'default')
      setSinkId(id)
      if (id) {
        localStorage.setItem('audioSinkId', id)
      } else {
        localStorage.removeItem('audioSinkId')
      }
    } catch (e) {
      console.warn('applySink failed', e)
    }
  }

  function setupPlaybackResumeOnce() {
    if (cleanupPlaybackResumeRef.current) return
    const click = () => {
      tryPlayRemote('manual')
    }
    const touch = () => {
      tryPlayRemote('manual')
    }
    const vis = () => {
      if (document.visibilityState === 'visible') {
        tryPlayRemote('visibilitychange')
      }
    }
    document.addEventListener('click', click, { once: true })
    document.addEventListener('touchstart', touch, { once: true })
    document.addEventListener('visibilitychange', vis)
    cleanupPlaybackResumeRef.current = () => {
      document.removeEventListener('visibilitychange', vis)
      cleanupPlaybackResumeRef.current = null
    }
  }

  async function tryPlayRemote(trigger: string = 'manual') {
    const el = remoteVideoRef.current
    if (!el) return
    try {
      await el.play()
      setNeedsPlaybackResume(false)
      if (cleanupPlaybackResumeRef.current) {
        cleanupPlaybackResumeRef.current()
      }
    } catch (e) {
      // Likely autoplay policy (iOS/Safari). Show resume UI and set handlers.
      setNeedsPlaybackResume(true)
      setupPlaybackResumeOnce()
      console.warn('Remote media play() blocked on', trigger, e)
    }
  }

  async function makeOffer(iceRestart: boolean = false) {
    if (!pcRef.current) return
    const offer = await pcRef.current.createOffer(iceRestart ? { iceRestart: true } : undefined)
    await pcRef.current.setLocalDescription(offer)
    send({ type: 'offer', peerId: peerIdRef.current, sdp: offer })
    setStatus(iceRestart ? 'переподключение…' : 'подключение…')
  }

  async function attemptIceRestart() {
    const pc = pcRef.current
    if (!pc) return
    if (iceRetriesRef.current >= 2) return
    iceRetriesRef.current += 1
    try {
      // Try spec API if present
      if (typeof (pc as any).restartIce === 'function') {
        (pc as any).restartIce()
      }
    } catch {}

    if (roleRef.current === 'offerer') {
      try {
        await makeOffer(true)
      } catch (e) {
        console.warn('ICE restart offer failed', e)
      }
    } else {
      // For answerer, wait for remote restart; still update status
      setStatus('переподключение…')
    }
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
      <div style={{ position: 'relative', flex: 1, background: '#111' }}>
        <video ref={remoteVideoRef} autoPlay playsInline style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', background: '#222' }} />
        {needsPlaybackResume && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3 }}>
            <button
              onClick={() => tryPlayRemote('button')}
              style={{ padding: '12px 18px', fontSize: 18, borderRadius: 8, border: 'none', background: '#1976d2', color: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.3)', cursor: 'pointer' }}
            >
              Включить звук
            </button>
          </div>
        )}
        <video ref={localVideoRef} autoPlay muted playsInline style={{ position: 'absolute', bottom: 16, right: 16, width: 240, height: 135, objectFit: 'cover', background: '#222', borderRadius: 8, boxShadow: '0 2px 12px rgba(0,0,0,0.4)', border: '2px solid rgba(255,255,255,0.3)', zIndex: 2 }} />
      </div>
      <div style={{ padding: 12, display: 'flex', alignItems: 'center', gap: 12, borderTop: '1px solid #ddd' }}>
        <strong style={{ flex: 1 }}>{status}</strong>
        {outputSupported ? (
          <>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>Вывод:</span>
              <select
                style={{ padding: 8, fontSize: 14 }}
                value={sinkId ?? ''}
                onChange={e => applySink(e.target.value || null)}
              >
                <option value="">Системный по умолчанию</option>
                {outputs.map(d => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {d.label || 'Устройство вывода'}
                  </option>
                ))}
              </select>
            </label>
          </>
        ) : (
          <span style={{ color: '#666' }} title="Ваш браузер не позволяет выбирать устройство вывода">
            Выбор вывода недоступен в этом браузере
          </span>
        )}
        <button style={btn} onClick={() => navigator.clipboard.writeText(link)}>Скопировать ссылку</button>
        <button style={btn} onClick={toggleMic}>{micOn ? 'Микрофон выкл' : 'Микрофон вкл'}</button>
        <button style={btn} onClick={toggleCam}>{camOn ? 'Камера выкл' : 'Камера вкл'}</button>
        <button style={{ ...btn, background: '#c62828', color: 'white' }} onClick={hangup}>Положить трубку</button>
      </div>
    </div>
  )
}

const btn: React.CSSProperties = { padding: '10px 14px', fontSize: 16, cursor: 'pointer' }
