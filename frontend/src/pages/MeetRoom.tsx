import React, { useEffect, useRef, useState, useCallback } from 'react'
import { ICE_SERVERS, wsUrl, ICE_TRANSPORT_POLICY, api } from '../config'
import { IconButton, Tooltip, Menu, MenuItem, Divider } from '@mui/material'
import CallEndIcon from '@mui/icons-material/CallEnd'
import MicIcon from '@mui/icons-material/Mic'
import MicOffIcon from '@mui/icons-material/MicOff'
import VideocamIcon from '@mui/icons-material/Videocam'
import VideocamOffIcon from '@mui/icons-material/VideocamOff'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import CameraswitchIcon from '@mui/icons-material/Cameraswitch'
import SettingsIcon from '@mui/icons-material/Settings'
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from '../components/LanguageSwitcher'

interface MeetRoomProps {
  token: string
}

interface RemotePeer {
  peerId: string
  pc: RTCPeerConnection
  stream: MediaStream | null
  polite: boolean
  makingOffer: () => boolean
  ignoreOffer: () => boolean
  setIgnoreOffer: (v: boolean) => void
}

export const MeetRoom: React.FC<MeetRoomProps> = ({ token }) => {
  const { t } = useTranslation()
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remotePeers, setRemotePeers] = useState<Map<string, RemotePeer>>(new Map())
  const [micOn, setMicOn] = useState(true)
  const [camOn, setCamOn] = useState(true)
  const [status, setStatus] = useState<string>('init')
  const [expiresAt, setExpiresAt] = useState<number | null>(null)
  const [timeLeft, setTimeLeft] = useState<string>('')
  
  // Device states
  const [videoInputs, setVideoInputs] = useState<MediaDeviceInfo[]>([])
  const [outputs, setOutputs] = useState<MediaDeviceInfo[]>([])
  const [currentVideoDeviceId, setCurrentVideoDeviceId] = useState<string | null>(null)
  const [currentFacingMode, setCurrentFacingMode] = useState<'user' | 'environment'>('user')
  const [sinkId, setSinkId] = useState<string | null>(localStorage.getItem('talklink_sink_id'))
  const [settingsAnchor, setSettingsAnchor] = useState<null | HTMLElement>(null)
  const [canSwitchCam, setCanSwitchCam] = useState(false)
  
  useEffect(() => {
    document.title = `TalkLink Meet — ${status === 'online' ? t('room.status.online') : status}`
  }, [t, status])

  const wsRef = useRef<WebSocket | null>(null)
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const peerIdRef = useRef<string>(Math.random().toString(36).substring(2, 15))
  const peersRef = useRef<Map<string, RemotePeer>>(new Map())
  const localStreamRef = useRef<MediaStream | null>(null)
  
  // Refs for signaling to avoid stale closures
  const handleSignalingRef = useRef<(msg: any) => Promise<void>>()

  // Timer logic
  useEffect(() => {
    if (!expiresAt) return
    const interval = setInterval(() => {
      const now = Date.now() / 1000
      const diff = Math.max(0, expiresAt - now)
      const mins = Math.floor(diff / 60)
      const secs = Math.floor(diff % 60)
      setTimeLeft(`${mins}:${secs.toString().padStart(2, '0')}`)
      
      if (diff <= 0) {
        clearInterval(interval)
        setStatus('expired')
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [expiresAt])

  // Get Room Info
  useEffect(() => {
    fetch(api(`/api/meet/${token}`))
      .then(res => res.json())
      .then(data => {
        setExpiresAt(data.expiresAt)
      })
      .catch(err => console.error('Failed to get room info', err))
  }, [token])

  // Ensure local video is attached when stream or status changes
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream
    }
  }, [localStream, status])

  const send = useCallback((msg: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg))
    }
  }, [])

  const createPeerConnection = useCallback((remotePeerId: string, polite: boolean) => {
    const pc = new RTCPeerConnection({
      iceServers: ICE_SERVERS,
      iceTransportPolicy: ICE_TRANSPORT_POLICY as RTCIceTransportPolicy
    })

    let makingOffer = false
    let ignoreOffer = false

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) {
        send({ type: 'candidate', peerId: peerIdRef.current, to: remotePeerId, candidate })
      }
    }

    pc.ontrack = (event) => {
      const [stream] = event.streams
      console.log(`Received remote track from ${remotePeerId}: ${event.track.kind}`)
      const peer = peersRef.current.get(remotePeerId)
      if (peer) {
        // Use the existing stream or the new one
        const remoteStream = stream || peer.stream || new MediaStream([event.track])
        
        // If it's a new track for an existing stream, it might not be in it yet
        if (stream && !stream.getTracks().includes(event.track)) {
           stream.addTrack(event.track)
        }
        
        // Update peer object with the stream (creating a new object to trigger React update)
        peersRef.current.set(remotePeerId, { ...peer, stream: remoteStream })
        setRemotePeers(new Map(peersRef.current))
      }
    }

    pc.onnegotiationneeded = async () => {
      try {
        makingOffer = true
        await pc.setLocalDescription()
        send({ type: 'offer', peerId: peerIdRef.current, to: remotePeerId, sdp: pc.localDescription })
      } catch (err) {
        console.error('Negotiation error', err)
      } finally {
        makingOffer = false
      }
    }

    pc.onsignalingstatechange = () => {
      if (pc.signalingState === 'stable') {
        makingOffer = false
      }
    }

    // Add local tracks from Ref
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current!)
      })
    }

    return { pc, polite, makingOffer: () => makingOffer, ignoreOffer: () => ignoreOffer, setIgnoreOffer: (v: boolean) => { ignoreOffer = v } }
  }, [send])

  const handleSignaling = useCallback(async (msg: any) => {
    const { type, peerId: senderId, sdp, candidate, peers: others } = msg

    if (type === 'room-info') {
      setStatus('online')
      for (const otherId of others) {
        if (!peersRef.current.has(otherId)) {
          const polite = peerIdRef.current < otherId
          const pcData = createPeerConnection(otherId, polite)
          peersRef.current.set(otherId, { peerId: otherId, ...pcData, stream: null })
        }
      }
      setRemotePeers(new Map(peersRef.current))
    } else if (type === 'peer-joined') {
      if (!peersRef.current.has(senderId)) {
        const polite = peerIdRef.current < senderId
        const pcData = createPeerConnection(senderId, polite)
        peersRef.current.set(senderId, { peerId: senderId, ...pcData, stream: null })
        setRemotePeers(new Map(peersRef.current))
      }
    } else if (type === 'offer') {
      let peer = peersRef.current.get(senderId)
      if (!peer) {
        const polite = peerIdRef.current < senderId
        const pcData = createPeerConnection(senderId, polite)
        peer = { peerId: senderId, ...pcData, stream: null }
        peersRef.current.set(senderId, peer)
      }

      const pc = peer.pc
      const offerCollision = (type === 'offer') && (peer.makingOffer() || pc.signalingState !== 'stable')
      
      peer.setIgnoreOffer(!peer.polite && offerCollision)
      if (peer.ignoreOffer()) {
        console.log('Ignoring offer collision', senderId)
        return
      }

      if (offerCollision) {
        await Promise.all([
          pc.setLocalDescription({ type: 'rollback' } as any),
          pc.setRemoteDescription(new RTCSessionDescription(sdp))
        ])
      } else {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp))
      }

      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)
      send({ type: 'answer', peerId: peerIdRef.current, to: senderId, sdp: answer })
      setRemotePeers(new Map(peersRef.current))
    } else if (type === 'answer') {
      const peer = peersRef.current.get(senderId)
      if (peer) {
        await peer.pc.setRemoteDescription(new RTCSessionDescription(sdp))
      }
    } else if (type === 'candidate') {
      const peer = peersRef.current.get(senderId)
      if (peer) {
        try {
          await peer.pc.addIceCandidate(new RTCIceCandidate(candidate))
        } catch (err) {
          if (!peer.ignoreOffer()) throw err
        }
      }
    } else if (type === 'peer-left') {
      const peer = peersRef.current.get(senderId)
      if (peer) {
        peer.pc.close()
        peersRef.current.delete(senderId)
        setRemotePeers(new Map(peersRef.current))
      }
    } else if (type === 'error' && msg.code === 'expired') {
      setStatus('expired')
    }
  }, [createPeerConnection, send])

  handleSignalingRef.current = handleSignaling

  // Initialize Media and WS
  useEffect(() => {
    async function init() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        localStreamRef.current = stream
        setLocalStream(stream)

        // Initial device enumeration
        const devices = await navigator.mediaDevices.enumerateDevices()
        const vids = devices.filter(d => d.kind === 'videoinput')
        setVideoInputs(vids)
        setOutputs(devices.filter(d => d.kind === 'audiooutput'))
        setCanSwitchCam(vids.length > 1 || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent))

        const ws = new WebSocket(wsUrl(`/ws/rooms/${token}`))
        wsRef.current = ws
        ws.onopen = () => {
          ws.send(JSON.stringify({ 
            type: 'join', 
            peerId: peerIdRef.current, 
            role: 'offerer', // Required by JoinMessage model
            timestamp: new Date().toISOString()
          }))
        }
        ws.onmessage = (e) => {
          if (handleSignalingRef.current) {
            handleSignalingRef.current(JSON.parse(e.data))
          }
        }
        ws.onclose = () => setStatus('disconnected')
      } catch (err) {
        console.error('Init failed', err)
        setStatus('error')
      }
    }
    init()
    return () => {
      wsRef.current?.close()
      localStreamRef.current?.getTracks().forEach(t => t.stop())
      peersRef.current.forEach(p => p.pc.close())
    }
  }, [token])

  const toggleMic = () => {
    if (localStreamRef.current) {
      const enabled = !micOn
      localStreamRef.current.getAudioTracks().forEach(t => t.enabled = enabled)
      setMicOn(enabled)
    }
  }

  const toggleCam = () => {
    if (localStreamRef.current) {
      const enabled = !camOn
      localStreamRef.current.getVideoTracks().forEach(t => t.enabled = enabled)
      setCamOn(enabled)
    }
  }

  const switchCamera = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) return
      const stream = localStreamRef.current
      if (!stream) return

      const targetFacing: 'user' | 'environment' = (currentFacingMode === 'environment' ? 'user' : 'environment')
      let nStream: MediaStream | null = null
      try {
        nStream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: { ideal: targetFacing } as any } })
      } catch (err) {
        console.warn('Switch camera failed, trying fallback', err)
        // Fallback: cycle through devices
        if (videoInputs.length > 1) {
          const idx = videoInputs.findIndex(d => d.deviceId === currentVideoDeviceId)
          const next = videoInputs[(idx + 1) % videoInputs.length]
          nStream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { deviceId: { exact: next.deviceId } } })
        }
      }

      if (!nStream) return
      const newTrack = nStream.getVideoTracks()[0]
      if (!newTrack) return
      
      newTrack.enabled = camOn // Keep current cam state

      // Replace track in all PeerConnections
      for (const peer of peersRef.current.values()) {
        const sender = peer.pc.getSenders().find(s => s.track && s.track.kind === 'video')
        if (sender && sender.replaceTrack) {
          await sender.replaceTrack(newTrack)
        }
      }

      const oldTrack = stream.getVideoTracks()[0]
      if (oldTrack) {
        stream.removeTrack(oldTrack)
        setTimeout(() => oldTrack.stop(), 150)
      }
      stream.addTrack(newTrack)
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null
        localVideoRef.current.srcObject = stream
      }

      // Update state
      const s = newTrack.getSettings() as any
      setCurrentVideoDeviceId(s?.deviceId ?? null)
      setCurrentFacingMode(targetFacing)
      
    } catch (e) {
      console.warn('switchCamera failed', e)
    }
  }

  const applySink = (id: string | null) => {
    setSinkId(id)
    if (id) localStorage.setItem('talklink_sink_id', id)
    else localStorage.removeItem('talklink_sink_id')
  }

  const openSettings = (e: React.MouseEvent<HTMLElement>) => setSettingsAnchor(e.currentTarget)
  const closeSettings = () => setSettingsAnchor(null)

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    alert(t('call.copied'))
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-4 text-center">
        <h1 className="text-4xl font-bold mb-4">{t('room.error.init.title')}</h1>
        <p className="text-slate-400 mb-8 max-w-md">{t('room.error.media.title')}</p>
        <button onClick={() => window.location.reload()} className="bg-blue-600 px-6 py-3 rounded-xl font-bold">
          {t('common.back')}
        </button>
      </div>
    )
  }

  if (status === 'init') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-4">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-6"></div>
        <p className="text-slate-400 animate-pulse">{t('room.status.init')}...</p>
      </div>
    )
  }

  const remotePeersList = Array.from(remotePeers.values())
  const totalParticipants = remotePeersList.length + 1
  const outputSupported = 'setSinkId' in HTMLMediaElement.prototype

  return (
    <div className="min-h-screen bg-black text-white flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 flex justify-between items-center bg-slate-900/50 backdrop-blur-md z-20">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 px-3 py-1 rounded-full text-xs font-bold animate-pulse">
            {status.toUpperCase()}
          </div>
          <div className="text-slate-400 font-mono">{timeLeft}</div>
        </div>
        <div className="flex gap-2">
          <IconButton onClick={openSettings} color="inherit">
            <SettingsIcon />
          </IconButton>
          <IconButton onClick={copyLink} color="inherit">
            <ContentCopyIcon />
          </IconButton>
          <IconButton onClick={() => window.location.href = '/'} color="error" className="bg-red-500/10">
            <CallEndIcon />
          </IconButton>
        </div>
      </div>

      <Menu
        anchorEl={settingsAnchor}
        open={Boolean(settingsAnchor)}
        onClose={closeSettings}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <div className="px-4 py-2 text-xs font-bold text-slate-500 uppercase tracking-widest">{t('room.settings.language')}</div>
        <div className="px-4 py-2">
          <LanguageSwitcher />
        </div>
        
        {outputSupported && outputs.length > 0 && (
          <>
            <Divider />
            <div className="px-4 py-2 text-xs font-bold text-slate-500 uppercase tracking-widest">{t('room.settings.audioOutput')}</div>
            <MenuItem selected={!sinkId} onClick={() => { applySink(null); closeSettings(); }}>
              Default
            </MenuItem>
            {outputs.map(d => (
              <MenuItem key={d.deviceId} selected={sinkId === d.deviceId} onClick={() => { applySink(d.deviceId); closeSettings(); }}>
                {d.label || 'Speaker'}
              </MenuItem>
            ))}
          </>
        )}
      </Menu>

      {/* Video Grid */}
      <div className={`flex-1 p-4 pb-32 grid gap-4 overflow-auto ${
        totalParticipants <= 1 ? 'grid-cols-1' :
        totalParticipants <= 2 ? 'grid-cols-1 md:grid-cols-2' :
        totalParticipants <= 4 ? 'grid-cols-2' :
        totalParticipants <= 6 ? 'grid-cols-2 md:grid-cols-3' :
        'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
      }`}>
        {/* Local Video */}
        <div className="relative bg-slate-900 rounded-3xl overflow-hidden aspect-video border border-white/5 shadow-2xl">
          <video 
            ref={localVideoRef} 
            autoPlay 
            muted 
            playsInline 
            className={`w-full h-full object-cover ${currentFacingMode === 'user' ? 'mirror' : ''}`} 
          />
          <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-md px-3 py-1 rounded-lg text-sm font-medium">
            You {micOn ? '' : ' (Muted)'}
          </div>
        </div>

        {/* Remote Videos */}
        {remotePeersList.map(peer => (
          <div key={peer.peerId} className="relative bg-slate-900 rounded-3xl overflow-hidden aspect-video border border-white/5 shadow-2xl">
            <RemoteVideo stream={peer.stream} sinkId={sinkId} />
            <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-md px-3 py-1 rounded-lg text-sm font-medium">
              Peer {peer.peerId.substring(0, 4)}
            </div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="fixed bottom-0 left-0 right-0 p-8 flex justify-center items-center gap-4 bg-gradient-to-t from-black via-black/80 to-transparent z-50">
        <Tooltip title={micOn ? t('room.mic.off') : t('room.mic.on')}>
          <IconButton 
            onClick={toggleMic} 
            size="large"
            sx={{ 
              p: 2.5,
              borderRadius: '1.25rem',
              bgcolor: micOn ? 'rgba(30, 41, 59, 0.9)' : 'rgba(239, 68, 68, 0.9)',
              color: 'white',
              '&:hover': { bgcolor: micOn ? 'rgba(51, 65, 85, 1)' : 'rgba(220, 38, 38, 1)' },
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
              transition: 'all 0.2s'
            }}
          >
            {micOn ? <MicIcon /> : <MicOffIcon />}
          </IconButton>
        </Tooltip>

        <Tooltip title={camOn ? t('room.cam.off') : t('room.cam.on')}>
          <IconButton 
            onClick={toggleCam} 
            size="large"
            sx={{ 
              p: 2.5,
              borderRadius: '1.25rem',
              bgcolor: camOn ? 'rgba(30, 41, 59, 0.9)' : 'rgba(239, 68, 68, 0.9)',
              color: 'white',
              '&:hover': { bgcolor: camOn ? 'rgba(51, 65, 85, 1)' : 'rgba(220, 38, 38, 1)' },
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
              transition: 'all 0.2s'
            }}
          >
            {camOn ? <VideocamIcon /> : <VideocamOffIcon />}
          </IconButton>
        </Tooltip>

        {canSwitchCam && (
          <Tooltip title={t('room.cam.switch')}>
            <IconButton 
              onClick={switchCamera} 
              size="large"
              sx={{ 
                p: 2.5,
                borderRadius: '1.25rem',
                bgcolor: 'rgba(30, 41, 59, 0.9)',
                color: 'white',
                '&:hover': { bgcolor: 'rgba(51, 65, 85, 1)' },
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
                transition: 'all 0.2s'
              }}
            >
              <CameraswitchIcon />
            </IconButton>
          </Tooltip>
        )}

        <div className="w-px h-10 bg-white/10 mx-2"></div>

        <Tooltip title={t('room.hangup')}>
          <IconButton 
            onClick={() => window.location.href = '/'}
            size="large"
            sx={{ 
              p: 2.5,
              borderRadius: '1.25rem',
              bgcolor: 'rgba(239, 68, 68, 0.9)',
              color: 'white',
              '&:hover': { bgcolor: 'rgba(220, 38, 38, 1)' },
              boxShadow: '0 10px 25px -5px rgba(239, 68, 68, 0.4)',
              transition: 'all 0.2s'
            }}
          >
            <CallEndIcon />
          </IconButton>
        </Tooltip>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `.mirror { transform: scaleX(-1); }` }} />
    </div>
  )
}

const RemoteVideo: React.FC<{ stream: MediaStream | null, sinkId: string | null }> = ({ stream, sinkId }) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  
  useEffect(() => {
    const video = videoRef.current
    if (!video || !stream) return

    video.srcObject = stream
    
    // In some browsers, adding a track to a stream already set as srcObject 
    // doesn't trigger audio playback. Re-setting srcObject helps.
    const handleTrackAdded = () => {
      console.log('Track added to remote stream, updating srcObject')
      video.srcObject = null
      video.srcObject = stream
      video.play().catch(() => {}) // Ensure it keeps playing
    }
    
    stream.addEventListener('addtrack', handleTrackAdded)
    
    // Ensure it's playing
    video.play().catch(err => {
      if (err.name !== 'AbortError') {
        console.warn('Remote video play failed:', err)
      }
    })

    return () => {
      stream.removeEventListener('addtrack', handleTrackAdded)
    }
  }, [stream])

  useEffect(() => {
    if (videoRef.current && sinkId && (videoRef.current as any).setSinkId) {
      (videoRef.current as any).setSinkId(sinkId).catch(console.error)
    }
  }, [sinkId])

  return <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
}
