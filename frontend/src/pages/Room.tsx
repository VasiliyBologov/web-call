import React, { useEffect, useRef, useState } from 'react'
import { ICE_SERVERS, wsUrl, ICE_TRANSPORT_POLICY, api } from '../config'
import { IconButton, Tooltip, Menu, MenuItem } from '@mui/material'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import CallEndIcon from '@mui/icons-material/CallEnd'
import MicIcon from '@mui/icons-material/Mic'
import MicOffIcon from '@mui/icons-material/MicOff'
import VideocamIcon from '@mui/icons-material/Videocam'
import VideocamOffIcon from '@mui/icons-material/VideocamOff'
import CameraswitchIcon from '@mui/icons-material/Cameraswitch'
import SettingsIcon from '@mui/icons-material/Settings'

type WSMsg =
  | { type: 'room-info'; peers: string[]; max: number }
  | { type: 'peer-joined'; peerId: string }
  | { type: 'peer-left'; peerId: string }
  | { type: 'offer' | 'answer'; peerId: string; sdp: any }
  | { type: 'candidate'; peerId: string; candidate: any }
  | { type: 'orientation'; peerId: string; layout: 'portrait' | 'landscape' }
  | { type: 'error'; code: string; message: string }

function rid() {
  const b = new Uint8Array(8)
  crypto.getRandomValues(b)
  return Array.from(b, x => x.toString(16).padStart(2, '0')).join('')
}

function isMobileDevice(): boolean {
  const ua = navigator.userAgent || ''
  const touch = (navigator as any).maxTouchPoints || 0
  return /Mobi|Android|iPhone|iPad|iPod/i.test(ua) || touch > 0
}

function currentOrientation(): 'portrait' | 'landscape' {
  try {
    if (window.matchMedia) {
      return window.matchMedia('(orientation: portrait)').matches ? 'portrait' : 'landscape'
    }
  } catch {}
  return window.innerHeight >= window.innerWidth ? 'portrait' : 'landscape'
}

function detectInitialLayout(): 'portrait' | 'landscape' {
  // Laptops/desktop always horizontal per requirements
  if (!isMobileDevice()) return 'landscape'
  return currentOrientation()
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
  const [settingsAnchor, setSettingsAnchor] = useState<null | HTMLElement>(null)
  const openSettings = (e: React.MouseEvent<HTMLElement>) => setSettingsAnchor(e.currentTarget)
  const closeSettings = () => setSettingsAnchor(null)

  // Video device management
  const [videoInputs, setVideoInputs] = useState<MediaDeviceInfo[]>([])
  const [currentVideoDeviceId, setCurrentVideoDeviceId] = useState<string | null>(null)
  const [currentFacingMode, setCurrentFacingMode] = useState<'user' | 'environment' | null>(null)
  const canSwitchCam = videoInputs.length > 1 || isMobileDevice()

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
  const pendingCandidatesRef = useRef<any[]>([])
  const [recover, setRecover] = useState<{ title: string; details?: string } | null>(null)

  // Orientation/layout state
  const [localLayout, setLocalLayout] = useState<'portrait' | 'landscape'>(() => detectInitialLayout())
  const [remoteLayout, setRemoteLayout] = useState<'portrait' | 'landscape'>('landscape')

  useEffect(() => {
    let closed = false

    async function start() {
      setStatus('запрос устройств…')
      const videoConstraints: MediaTrackConstraints = { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 30 } }
      let stream: MediaStream
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: videoConstraints,
        })
      } catch (err: any) {
        // Firefox may throw NotFoundError if one of the devices (mic/cam) is missing.
        if (err && (err.name === 'NotFoundError' || err.name === 'OverconstrainedError' || err.name === 'OverConstrainedError')) {
          try {
            // Try audio-only
            stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
          } catch (err2: any) {
            try {
              // Try video-only
              stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: true })
            } catch (err3: any) {
              throw err
            }
          }
        } else {
          throw err
        }
      }
      localStreamRef.current = stream
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }
      const vTrack = stream.getVideoTracks()[0]
      try { setCurrentVideoDeviceId(vTrack?.getSettings()?.deviceId ?? null) } catch {}
      try {
        const fm: any = vTrack?.getSettings?.()?.facingMode
        if (fm === 'user' || fm === 'environment') setCurrentFacingMode(fm)
      } catch {}
      try {
        const devices = await navigator.mediaDevices.enumerateDevices()
        setVideoInputs(devices.filter(d => d.kind === 'videoinput'))
      } catch {}

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
        // Send current layout info (will be ignored if no peer yet)
        sendOrientation(localLayout)
        setStatus('ожидание собеседника…')
      }

      ws.onmessage = async ev => {
        const msg: WSMsg = JSON.parse(ev.data)
        if (msg.type === 'error') {
          setStatus(`Ошибка: ${msg.code}`)
          if (msg.code === 'room_not_found') {
            setRecover({ title: 'Ссылка недействительна', details: 'Комната не найдена или срок действия ссылки истёк.' })
          }
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
          // Share our current layout to the new peer
          sendOrientation(localLayout)
        } else if (msg.type === 'orientation') {
          setRemoteLayout(msg.layout)
        } else if (msg.type === 'offer') {
          if (!pcRef.current) return
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(msg.sdp))
          await flushPendingCandidates()
          const answer = await pcRef.current.createAnswer()
          await pcRef.current.setLocalDescription(answer)
          send({ type: 'answer', peerId: peerIdRef.current, sdp: answer })
          setStatus('в сети')
        } else if (msg.type === 'answer') {
          if (!pcRef.current) return
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(msg.sdp))
          await flushPendingCandidates()
          setStatus('в сети')
        } else if (msg.type === 'candidate') {
          const pc = pcRef.current
          if (!pc) return
          const c = msg.candidate
          if (isEmptyCandidate(c)) {
            return
          }
          try {
            if (!pc.remoteDescription) {
              pendingCandidatesRef.current.push(c)
              return
            }
            await pc.addIceCandidate(c)
          } catch (e) {
            console.warn('Failed to add ICE', e)
          }
        } else if (msg.type === 'peer-left') {
          setStatus('собеседник вышел')
        }
      }

      ws.onclose = (ev) => {
        if (closed) return
        if ((ev as CloseEvent).code === 4404) {
          setStatus('ссылка недействительна')
          setRecover({ title: 'Ссылка недействительна', details: 'Комната не найдена или срок действия ссылки истёк.' })
        } else if ((ev as CloseEvent).code === 4403) {
          setStatus('комната заполнена')
          setRecover({ title: 'Комната заполнена', details: 'В эту комнату уже подключены 2 участника. Создайте новую ссылку.' })
        } else {
          setStatus('сигнализация отключена')
        }
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

  // Track available video input devices and react to changes
  useEffect(() => {
    let mounted = true
    async function refreshVideoInputs() {
      try {
        const list = await navigator.mediaDevices.enumerateDevices()
        const vids = list.filter(d => d.kind === 'videoinput')
        if (!mounted) return
        setVideoInputs(vids)
      } catch (e) {
        console.warn('enumerateDevices failed', e)
      }
    }
    // Initial detection
    refreshVideoInputs()
    const onChange = () => refreshVideoInputs()
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

  async function flushPendingCandidates() {
    const pc = pcRef.current
    if (!pc || !pc.remoteDescription) return
    const q = pendingCandidatesRef.current
    while (q.length) {
      const cand = q.shift()
      if (!cand || !cand.candidate) continue
      try {
        await pc.addIceCandidate(cand)
      } catch (e) {
        console.warn('Flush ICE candidate failed', e)
      }
    }
  }

  function isEmptyCandidate(c: any) {
    return !c || !c.candidate || c.candidate === ''
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

  function sendOrientation(layout: 'portrait' | 'landscape') {
    send({ type: 'orientation', peerId: peerIdRef.current, layout })
  }

  // Watch for device orientation changes and notify peer
  useEffect(() => {
    const handler = () => {
      const next: 'portrait' | 'landscape' = isMobileDevice() ? currentOrientation() : 'landscape'
      if (next !== localLayout) {
        setLocalLayout(next)
        sendOrientation(next)
      }
    }
    window.addEventListener('resize', handler)
    try { (window.screen as any)?.orientation?.addEventListener?.('change', handler) } catch {}
    window.addEventListener('orientationchange', handler)
    return () => {
      window.removeEventListener('resize', handler)
      try { (window.screen as any)?.orientation?.removeEventListener?.('change', handler) } catch {}
      window.removeEventListener('orientationchange', handler)
    }
  }, [localLayout])

  // Disable page scroll while on the call screen
  useEffect(() => {
    const html = document.documentElement
    const body = document.body
    const prevHtmlOverflow = html.style.overflow
    const prevBodyOverflow = body.style.overflow
    html.style.overflow = 'hidden'
    body.style.overflow = 'hidden'
    return () => {
      html.style.overflow = prevHtmlOverflow
      body.style.overflow = prevBodyOverflow
    }
  }, [])

  // Dynamic viewport height for mobile (avoid 100vh issues under URL bar) and support safe-area insets
  useEffect(() => {
    const setVh = () => {
      const vh = (window.visualViewport?.height ?? window.innerHeight)
      document.documentElement.style.setProperty('--app-vh', `${vh}px`)
    }
    setVh()
    const vv = window.visualViewport as any
    window.addEventListener('resize', setVh)
    window.addEventListener('orientationchange', setVh)
    try { vv?.addEventListener?.('resize', setVh) } catch {}
    return () => {
      window.removeEventListener('resize', setVh)
      window.removeEventListener('orientationchange', setVh)
      try { vv?.removeEventListener?.('resize', setVh) } catch {}
    }
  }, [])

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

  async function switchCamera() {
    try {
      if (!canSwitchCam) return
      const stream = localStreamRef.current
      const pc = pcRef.current
      if (!stream) return

      // 1) Try facingMode toggle first (best for iOS Safari)
      const targetFacing: 'user' | 'environment' = (currentFacingMode === 'environment' ? 'user' : 'environment')
      let nStream: MediaStream | null = null
      try {
        nStream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: { exact: targetFacing } as any } })
      } catch {
        try {
          nStream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: { ideal: targetFacing } as any } })
        } catch {}
      }

      // 2) Fallback to deviceId cycling if facingMode failed or not supported
      if (!nStream) {
        const list = videoInputs
        const currentId = currentVideoDeviceId
        if (!list || list.length < 2) return
        const idx = Math.max(0, list.findIndex(d => d.deviceId === currentId))
        const next = list[(idx + 1) % list.length]
        if (!next) return
        nStream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { deviceId: { exact: next.deviceId } as any } })
      }

      const newTrack = nStream.getVideoTracks()[0]
      if (!newTrack) return
      // Preserve camera enabled state
      newTrack.enabled = camOn

      // Replace track in RTCPeerConnection
      const sender = pc?.getSenders().find(s => s.track && s.track.kind === 'video')
      const oldTrack = stream.getVideoTracks()[0]
      if (sender && sender.replaceTrack) {
        await sender.replaceTrack(newTrack)
      } else if (pc) {
        pc.addTrack(newTrack, stream)
        try { await makeOffer() } catch (e) { console.warn('renegotiation after addTrack failed', e) }
      }

      // Update local stream and element
      if (oldTrack) {
        stream.removeTrack(oldTrack)
        // Safari/iOS quirk: delay stopping the old track slightly to allow proper switch-back
        setTimeout(() => { try { oldTrack.stop() } catch {} }, 150)
      }
      stream.addTrack(newTrack)
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null
        localVideoRef.current.srcObject = stream
      }

      // Update state from new track settings
      try {
        const s = newTrack.getSettings?.() as any
        setCurrentVideoDeviceId(s?.deviceId ?? null)
        const fm = s?.facingMode
        if (fm === 'user' || fm === 'environment') {
          setCurrentFacingMode(fm)
        } else {
          setCurrentFacingMode(targetFacing)
        }
      } catch {}

      // Cleanup temporary stream
      nStream.getTracks().forEach(t => { if (t !== newTrack) try { t.stop() } catch {} })
    } catch (e) {
      console.warn('switchCamera failed', e)
    }
  }

  function hangup() {
    try { wsRef.current?.close() } catch {}
    try { pcRef.current?.close() } catch {}
    window.location.href = '/'
  }

  async function createNewRoom() {
    try {
      setStatus('создание новой комнаты…')
      const res = await fetch(api('/api/rooms'), { method: 'POST' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const url = data?.url || (data?.token ? `/r/${data.token}` : null)
      if (!url) throw new Error('bad response')
      window.location.href = url
    } catch (e) {
      console.warn('createNewRoom failed', e)
      setStatus('Не удалось создать комнату')
    }
  }

  return (
    <div style={{ width: '100%', height: 'var(--app-vh, 100vh)', display: 'flex', flexDirection: 'column', fontFamily: 'sans-serif' }}>
      <div style={{ position: 'relative', flex: 1, background: '#111' }}>
        <video ref={remoteVideoRef} autoPlay playsInline style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'contain', background: '#222' }} />
        {needsPlaybackResume && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3 }}>
            <button
              onClick={() => tryPlayRemote('button')}
              style={{ padding: '12px 18px', fontSize: 18, borderRadius: 999, border: 'none', background: '#1976d2', color: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.3)', cursor: 'pointer' }}
            >
              Включить звук
            </button>
          </div>
        )}
        {recover && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 4 }}>
            <div style={{ background: 'white', color: '#111', borderRadius: 12, padding: 20, maxWidth: 420, width: '90%', textAlign: 'center', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{recover.title}</div>
              {recover.details && <div style={{ fontSize: 14, opacity: 0.8, marginBottom: 16 }}>{recover.details}</div>}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                <button onClick={createNewRoom} style={{ padding: '10px 14px', borderRadius: 8, border: 'none', background: '#1976d2', color: 'white', cursor: 'pointer' }}>Создать новую комнату</button>
                <button onClick={() => (window.location.href = '/')} style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #ccc', background: 'white', color: '#111', cursor: 'pointer' }}>На главную</button>
              </div>
            </div>
          </div>
        )}
        <video ref={localVideoRef} autoPlay muted playsInline style={{ position: 'absolute', bottom: 'calc(16px + env(safe-area-inset-bottom, 0px))', right: 'calc(16px + env(safe-area-inset-right, 0px))', width: localLayout === 'portrait' ? 135 : 240, height: localLayout === 'portrait' ? 240 : 135, objectFit: 'cover', background: '#222', borderRadius: 8, boxShadow: '0 2px 12px rgba(0,0,0,0.4)', border: '2px solid rgba(255,255,255,0.3)', zIndex: 2 }} />
        {outputSupported && outputs.length > 0 && (
          <div style={{ position: 'absolute', top: 'calc(16px + env(safe-area-inset-top, 0px))', left: 'calc(16px + env(safe-area-inset-left, 0px))', zIndex: 3 }}>
            <Tooltip title="Настройки звука">
              <IconButton onClick={openSettings} size="large" sx={{ bgcolor: 'rgba(0,0,0,0.5)', color: 'white', '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' } }}>
                <SettingsIcon />
              </IconButton>
            </Tooltip>
            <Menu
              anchorEl={settingsAnchor}
              open={Boolean(settingsAnchor)}
              onClose={closeSettings}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
              transformOrigin={{ vertical: 'top', horizontal: 'left' }}
            >
              <MenuItem selected={!sinkId} onClick={() => { applySink(null); closeSettings(); }}>
                Системный по умолчанию
              </MenuItem>
              {outputs.map(d => (
                <MenuItem key={d.deviceId} selected={sinkId === d.deviceId} onClick={() => { applySink(d.deviceId); closeSettings(); }}>
                  {d.label || 'Устройство вывода'}
                </MenuItem>
              ))}
            </Menu>
          </div>
        )}
        <div style={{ position: 'absolute', top: 'calc(16px + env(safe-area-inset-top, 0px))', right: 'calc(16px + env(safe-area-inset-right, 0px))', zIndex: 3, background: 'rgba(0,0,0,0.5)', color: 'white', padding: '6px 10px', borderRadius: 8, fontSize: 12 }}>
          {status}
        </div>
        <div style={{ position: 'absolute', bottom: 'calc(16px + env(safe-area-inset-bottom, 0px))', left: 'calc(16px + env(safe-area-inset-left, 0px))', display: 'flex', gap: 8, zIndex: 3 }}>
          <Tooltip title={micOn ? 'Микрофон включен' : 'Микрофон выключен'}>
            <IconButton onClick={toggleMic} size="large" sx={{ bgcolor: 'rgba(0,0,0,0.5)', color: 'white', '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' } }}>
              {micOn ? <MicIcon /> : <MicOffIcon />}
            </IconButton>
          </Tooltip>
          <Tooltip title={camOn ? 'Камера включена' : 'Камера выключена'}>
            <IconButton onClick={toggleCam} size="large" sx={{ bgcolor: 'rgba(0,0,0,0.5)', color: 'white', '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' } }}>
              {camOn ? <VideocamIcon /> : <VideocamOffIcon />}
            </IconButton>
          </Tooltip>
          {canSwitchCam && (
            <Tooltip title="Переключить камеру">
              <IconButton onClick={switchCamera} size="large" sx={{ bgcolor: 'rgba(0,0,0,0.5)', color: 'white', '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' } }}>
                <CameraswitchIcon />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Скопировать ссылку">
            <IconButton onClick={() => navigator.clipboard.writeText(link)} size="large" sx={{ bgcolor: 'rgba(0,0,0,0.5)', color: 'white', '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' } }}>
              <ContentCopyIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Положить трубку">
            <IconButton onClick={hangup} size="large" sx={{ bgcolor: 'rgba(211,47,47,0.9)', color: 'white', '&:hover': { bgcolor: 'rgba(198,40,40,1)' } }}>
              <CallEndIcon />
            </IconButton>
          </Tooltip>
        </div>
      </div>
    </div>
  )
}

