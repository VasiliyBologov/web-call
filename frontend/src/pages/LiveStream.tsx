import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Box, Container, Typography, IconButton, Grid, Paper, Chip, Button, Alert, Tooltip } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { 
  CallEnd as CallEndIcon, 
  Share as ShareIcon, 
  Report as ReportIcon,
  People as PeopleIcon,
  Chat as ChatIcon,
  VolumeUp as VolumeUpIcon,
  Mic as MicIcon,
  MicOff as MicOffIcon,
  Videocam as VideocamIcon,
  VideocamOff as VideocamOffIcon
} from '@mui/icons-material';
import { ICE_SERVERS, wsUrl, api, ICE_TRANSPORT_POLICY } from '../config';
import Chat from '../components/Chat';

interface LiveStreamProps {
  token: string;
}

export const LiveStream: React.FC<LiveStreamProps> = ({ token }) => {
  const [role, setRole] = useState<'streamer' | 'viewer'>('viewer');
  const roleRef = useRef<'streamer' | 'viewer'>('viewer');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [messages, setMessages] = useState<any[]>([]);
  const [participants, setParticipants] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(true);
  const [remoteMuted, setRemoteMuted] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const ws = useRef<WebSocket | null>(null);
  const pcs = useRef<Map<string, RTCPeerConnection>>(new Map());
  const pendingCandidates = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const isNegotiating = useRef<Map<string, boolean>>(new Map());
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const peerId = useRef<string>(Math.random().toString(36).substring(7));
  const streamerPeerId = useRef<string | null>(null);
  
  const isSafari = () => {
    return /Safari/i.test(navigator.userAgent) && !/Chrome/i.test(navigator.userAgent);
  };

  const preferH264 = (sdp: string): string => {
    try {
      const lines = sdp.split('\n');
      const rtpmap: Record<string, string> = {};
      const h264Pts: string[] = [];
      let mLineIdx = -1;
      let mLineParts: string[] = [];
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('m=video')) {
          mLineIdx = i;
          mLineParts = line.split(' ');
        } else if (line.startsWith('a=rtpmap:')) {
          const m = line.match(/^a=rtpmap:(\d+)\s+([^\/]+)\//i);
          if (m) {
            rtpmap[m[1]] = m[2].toUpperCase();
            if (rtpmap[m[1]] === 'H264') h264Pts.push(m[1]);
          }
        }
      }
      if (mLineIdx >= 0 && h264Pts.length > 0 && mLineParts.length > 3) {
        const currentPts = mLineParts.slice(3);
        const newOrder = [...currentPts.filter(pt => h264Pts.includes(pt)), ...currentPts.filter(pt => !h264Pts.includes(pt))];
        lines[mLineIdx] = [...mLineParts.slice(0, 3), ...newOrder].join(' ');
        return lines.join('\n');
      }
      return sdp;
    } catch {
      return sdp;
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const r = params.get('role') === 'streamer' ? 'streamer' : 'viewer';
    setRole(r);
    roleRef.current = r;

    if (r === 'streamer') {
      startLocalStream();
    }
    
    connectWebSocket(r);

    return () => {
      console.log('Cleaning up LiveStream...');
      ws.current?.close();
      pcs.current.forEach(pc => pc.close());
      pcs.current.clear();
      pendingCandidates.current.clear();
      isNegotiating.current.clear();
      streamRef.current?.getTracks().forEach(t => t.stop());
      setRemoteStreams(new Map());
    };
  }, [token]);

  const startLocalStream = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ 
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }, 
        audio: true 
      });
      setStream(s);
      streamRef.current = s;
      if (localVideoRef.current) localVideoRef.current.srcObject = s;
      
      // Add tracks to any existing connections
      pcs.current.forEach(pc => {
        s.getTracks().forEach(track => {
          const senders = pc.getSenders();
          if (!senders.find(sender => sender.track === track)) {
            pc.addTrack(track, s);
          }
        });
      });
    } catch (err) {
      console.error('Error accessing media devices:', err);
      setError('Could not access camera/microphone. Please ensure permissions are granted.');
    }
  };

  const connectWebSocket = (initialRole: 'streamer' | 'viewer') => {
    const socket = new WebSocket(wsUrl(`/ws/rooms/${token}`));
    ws.current = socket;

    socket.onopen = () => {
      const joinMsg = {
        type: 'join',
        peerId: peerId.current,
        role: initialRole === 'streamer' ? 'offerer' : 'answerer',
        name: initialRole === 'streamer' ? 'Streamer' : 'Viewer'
      };
      socket.send(JSON.stringify(joinMsg));
    };

    socket.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      const currentRole = roleRef.current;
      console.log('[WS] Received message:', data.type, 'from:', data.peerId);
      
      switch (data.type) {
        case 'room-info':
          console.log('[WS] Room info:', data);
          setParticipants(data.peers.length + 1);
          if (data.streamerPeerId) {
            streamerPeerId.current = data.streamerPeerId;
            console.log('[WS] Streamer ID identified:', data.streamerPeerId);
          }
          if (currentRole === 'streamer') {
            data.peers.forEach((peer: any) => {
              const pid = typeof peer === 'string' ? peer : peer.peerId;
              if (pid) initiateWebRTC(pid);
            });
          }
          break;
        case 'peer-joined':
          setParticipants(prev => prev + 1);
          if (currentRole === 'streamer') {
            // Initiate WebRTC with the new viewer
            initiateWebRTC(data.peerId);
          }
          break;
        case 'peer-left':
          setParticipants(prev => Math.max(0, prev - 1));
          if (pcs.current.has(data.peerId)) {
            pcs.current.get(data.peerId)?.close();
            pcs.current.delete(data.peerId);
            setRemoteStreams(prev => {
              const next = new Map(prev);
              next.delete(data.peerId);
              return next;
            });
          }
          break;
        case 'offer':
          handleOffer(data.peerId, data.sdp);
          break;
        case 'answer':
          handleAnswer(data.peerId, data.sdp);
          break;
        case 'candidate':
          handleCandidate(data.peerId, data.candidate);
          break;
        case 'chat':
          setMessages(prev => [...prev, data]);
          break;
      }
    };
  };

  const createPeerConnection = (otherPeerId: string) => {
    if (pcs.current.has(otherPeerId)) return pcs.current.get(otherPeerId)!;

    console.log('Creating PeerConnection for:', otherPeerId);
    const pc = new RTCPeerConnection({ 
      iceServers: ICE_SERVERS,
      iceCandidatePoolSize: 10,
      iceTransportPolicy: ICE_TRANSPORT_POLICY
    });
    pcs.current.set(otherPeerId, pc);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        ws.current?.send(JSON.stringify({
          type: 'candidate',
          peerId: peerId.current,
          to: otherPeerId,
          candidate: event.candidate
        }));
      }
    };

    pc.onnegotiationneeded = async () => {
      if (roleRef.current === 'streamer') {
        try {
          if (isNegotiating.current.get(otherPeerId)) {
            console.log('Negotiation already in progress for:', otherPeerId);
            return;
          }
          isNegotiating.current.set(otherPeerId, true);
          
          console.log('Negotiation needed for peer:', otherPeerId);
          let offer = await pc.createOffer();
          if (isSafari()) {
            offer = { ...offer, sdp: preferH264(offer.sdp || '') };
          }
          await pc.setLocalDescription(offer);
          ws.current?.send(JSON.stringify({
            type: 'offer',
            peerId: peerId.current,
            to: otherPeerId,
            sdp: offer
          }));
        } catch (e) {
          console.error('Failed to create negotiation offer', e);
        } finally {
          isNegotiating.current.set(otherPeerId, false);
        }
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log(`ICE Connection state with ${otherPeerId}: ${pc.iceConnectionState}`);
      if (pc.iceConnectionState === 'failed') {
        pc.restartIce();
      }
    };

    pc.onconnectionstatechange = () => {
      console.log(`Connection state with ${otherPeerId}: ${pc.connectionState}`);
    };

    pc.ontrack = (event) => {
      console.log('Received remote track from:', otherPeerId, event.track.kind);
      
      setRemoteStreams(prev => {
        const next = new Map(prev);
        let remoteStream = next.get(otherPeerId);
        
        if (!remoteStream) {
          remoteStream = new MediaStream();
          next.set(otherPeerId, remoteStream);
        }
        
        if (!remoteStream.getTracks().find(t => t.id === event.track.id)) {
          remoteStream.addTrack(event.track);
          console.log(`Added ${event.track.kind} track to stream for ${otherPeerId}`);
        }
        
        return next;
      });
    };

    const currentStream = streamRef.current;
    if (currentStream) {
      console.log('Adding tracks to new PC for:', otherPeerId, currentStream.getTracks().length);
      currentStream.getTracks().forEach(track => pc.addTrack(track, currentStream));
    }

    return pc;
  };

  const initiateWebRTC = async (otherPeerId: string) => {
    // Just create connection, onnegotiationneeded will handle the rest if tracks are already there
    // If tracks are NOT there yet, it will wait until startLocalStream adds them
    createPeerConnection(otherPeerId);
  };

  const handleOffer = async (otherPeerId: string, sdp: RTCSessionDescriptionInit) => {
    console.log('Handling offer from:', otherPeerId);
    const pc = createPeerConnection(otherPeerId);
    try {
      let finalSdp = sdp;
      if (isSafari()) {
        finalSdp = { ...sdp, sdp: preferH264(sdp.sdp || '') };
      }
      await pc.setRemoteDescription(new RTCSessionDescription(finalSdp));
      let answer = await pc.createAnswer();
      if (isSafari()) {
        answer = { ...answer, sdp: preferH264(answer.sdp || '') };
      }
      await pc.setLocalDescription(answer);
      
      ws.current?.send(JSON.stringify({
        type: 'answer',
        peerId: peerId.current,
        to: otherPeerId,
        sdp: answer
      }));

      // Process pending candidates
      const candidates = pendingCandidates.current.get(otherPeerId) || [];
      console.log(`Processing ${candidates.length} pending candidates for:`, otherPeerId);
      for (const candidate of candidates) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
      pendingCandidates.current.set(otherPeerId, []);
    } catch (e) {
      console.error('Failed to handle offer:', e);
    }
  };

  const handleAnswer = async (otherPeerId: string, sdp: RTCSessionDescriptionInit) => {
    console.log('Handling answer from:', otherPeerId);
    const pc = pcs.current.get(otherPeerId);
    if (pc) {
      try {
        let finalSdp = sdp;
        if (isSafari()) {
          finalSdp = { ...sdp, sdp: preferH264(sdp.sdp || '') };
        }
        await pc.setRemoteDescription(new RTCSessionDescription(finalSdp));
        // Process pending candidates
        const candidates = pendingCandidates.current.get(otherPeerId) || [];
        console.log(`Processing ${candidates.length} pending candidates for:`, otherPeerId);
        for (const candidate of candidates) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
        pendingCandidates.current.set(otherPeerId, []);
      } catch (e) {
        console.error('Failed to handle answer:', e);
      }
    }
  };

  const handleCandidate = async (otherPeerId: string, candidate: RTCIceCandidateInit) => {
    const pc = pcs.current.get(otherPeerId);
    if (pc && pc.remoteDescription && pc.remoteDescription.type) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.error('Failed to add candidate:', e);
      }
    } else {
      if (!pendingCandidates.current.has(otherPeerId)) {
        pendingCandidates.current.set(otherPeerId, []);
      }
      pendingCandidates.current.get(otherPeerId)!.push(candidate);
    }
  };

  const sendMessage = (text: string) => {
    const currentRole = roleRef.current;
    ws.current?.send(JSON.stringify({
      type: 'chat',
      peerId: peerId.current,
      name: currentRole === 'streamer' ? 'Streamer' : 'Viewer',
      text,
      timestamp: Date.now() / 1000
    }));
  };

  const handleReport = async () => {
    try {
      await fetch(api(`/api/live/report?token=${token}&reason=Inappropriate content`), { method: 'POST' });
      alert('Thank you for your report. Our moderators will review this stream.');
    } catch (e) {}
  };

  const handleShare = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('role');
    navigator.clipboard.writeText(url.toString());
    alert('Link copied to clipboard!');
  };

  const toggleMic = () => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setMicOn(audioTrack.enabled);
      }
    }
  };

  const toggleCam = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setCamOn(videoTrack.enabled);
      }
    }
  };

  return (
    <Box sx={{ bgcolor: '#0f172a', minHeight: '100vh', color: 'white', py: isMobile ? 1 : 4 }}>
      <Container maxWidth="xl">
        <Grid container spacing={isMobile ? 1 : 3}>
          <Grid item xs={12} lg={showChat ? 9 : 12}>
            <Box sx={{ 
              position: 'relative', 
              bgcolor: 'black', 
              borderRadius: 2, 
              overflow: 'hidden', 
              minHeight: isMobile ? '30vh' : '60vh', 
              aspectRatio: isMobile ? 'auto' : '16/9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {role === 'streamer' ? (
                <video 
                  ref={localVideoRef} 
                  autoPlay 
                  muted 
                  playsInline 
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                />
              ) : (
                Array.from(remoteStreams.entries())
                  .filter(([pId]) => !streamerPeerId.current || pId === streamerPeerId.current)
                  .map(([pId, s]) => (
                    <Box key={pId} sx={{ width: '100%', height: '100%', position: 'relative' }}>
                    <video 
                      autoPlay 
                      playsInline 
                      muted={remoteMuted}
                      onLoadedMetadata={(e) => {
                        e.currentTarget.play().catch(err => console.warn('Autoplay failed:', err));
                      }}
                      ref={el => { 
                        if (el) {
                          if (el.srcObject !== s) {
                            el.srcObject = s;
                            el.play().catch(err => console.warn('Ref play failed:', err));
                          }
                        } 
                      }}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                    {remoteMuted && (
                      <Box 
                        sx={{ 
                          position: 'absolute', 
                          top: 0, left: 0, right: 0, bottom: 0, 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          bgcolor: 'rgba(0,0,0,0.3)',
                          cursor: 'pointer'
                        }}
                        onClick={() => setRemoteMuted(false)}
                      >
                        <Button variant="contained" color="primary" startIcon={<VolumeUpIcon />}>
                          Click to Unmute
                        </Button>
                      </Box>
                    )}
                  </Box>
                ))
              )}
              
              {!stream && role === 'streamer' && (
                <Box sx={{ textAlign: 'center' }}>
                  <Typography sx={{ p: 4 }}>Initializing camera...</Typography>
                </Box>
              )}
              {remoteStreams.size === 0 && role === 'viewer' && (
                <Box sx={{ textAlign: 'center' }}>
                  <Typography sx={{ p: 4 }}>Waiting for streamer...</Typography>
                </Box>
              )}

              <Box sx={{ position: 'absolute', top: 16, left: 16, display: 'flex', gap: 1 }}>
                <Chip label="LIVE" color="error" size={isMobile ? "small" : "medium"} />
                <Chip 
                  icon={<PeopleIcon sx={{ color: 'white !important' }} />} 
                  label={participants} 
                  size={isMobile ? "small" : "medium"}
                  sx={{ bgcolor: 'rgba(0,0,0,0.5)', color: 'white' }} 
                />
              </Box>
            </Box>

            <Box sx={{ 
              mt: 2, 
              display: 'flex', 
              flexDirection: isMobile ? 'column' : 'row',
              justifyContent: 'space-between', 
              alignItems: isMobile ? 'flex-start' : 'center',
              gap: 2
            }}>
              <Box>
                <Typography variant={isMobile ? "h6" : "h5"}>Live Stream</Typography>
                <Typography color="grey.400" variant="body2">Public Live Window</Typography>
              </Box>
              <Box sx={{ 
                display: 'flex', 
                gap: 1, 
                width: isMobile ? '100%' : 'auto',
                flexWrap: 'wrap'
              }}>
                {role === 'streamer' && (
                  <>
                    <Tooltip title={micOn ? "Mute Microphone" : "Unmute Microphone"}>
                      <IconButton 
                        onClick={toggleMic} 
                        sx={{ 
                          bgcolor: micOn ? 'rgba(255,255,255,0.1)' : 'error.main', 
                          color: 'white',
                          '&:hover': { bgcolor: micOn ? 'rgba(255,255,255,0.2)' : 'error.dark' }
                        }}
                        size={isMobile ? "small" : "medium"}
                      >
                        {micOn ? <MicIcon /> : <MicOffIcon />}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={camOn ? "Turn Camera Off" : "Turn Camera On"}>
                      <IconButton 
                        onClick={toggleCam} 
                        sx={{ 
                          bgcolor: camOn ? 'rgba(255,255,255,0.1)' : 'error.main', 
                          color: 'white',
                          '&:hover': { bgcolor: camOn ? 'rgba(255,255,255,0.2)' : 'error.dark' }
                        }}
                        size={isMobile ? "small" : "medium"}
                      >
                        {camOn ? <VideocamIcon /> : <VideocamOffIcon />}
                      </IconButton>
                    </Tooltip>
                  </>
                )}
                <Button 
                  startIcon={<ShareIcon />} 
                  variant="outlined" 
                  color="inherit" 
                  onClick={handleShare}
                  size={isMobile ? "small" : "medium"}
                >
                  Share
                </Button>
                {isMobile && (
                  <Button 
                    startIcon={<ChatIcon />} 
                    variant="outlined" 
                    color="inherit" 
                    onClick={() => setShowChat(!showChat)}
                    size="small"
                  >
                    Chat
                  </Button>
                )}
                {role === 'viewer' && (
                  <Button 
                    startIcon={<ReportIcon />} 
                    variant="outlined" 
                    color="error" 
                    onClick={handleReport}
                    size={isMobile ? "small" : "medium"}
                  >
                    Report
                  </Button>
                )}
                <Button 
                  startIcon={<CallEndIcon />} 
                  variant="contained" 
                  color="error"
                  onClick={() => window.location.href = '/live-window'}
                  size={isMobile ? "small" : "medium"}
                  sx={{ ml: isMobile ? 0 : 'auto' }}
                >
                  Leave
                </Button>
              </Box>
            </Box>
          </Grid>

          {showChat && (
            <Grid item xs={12} lg={3}>
              <Paper sx={{ 
                height: isMobile ? '400px' : 'calc(100vh - 100px)', 
                p: 2, 
                bgcolor: 'rgba(255,255,255,0.05)', 
                color: 'white',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <Typography variant="h6" gutterBottom>Live Chat</Typography>
                <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                  <Chat 
                    messages={messages} 
                    onSendMessage={sendMessage} 
                    currentPeerId={peerId.current} 
                  />
                </Box>
              </Paper>
            </Grid>
          )}
        </Grid>
      </Container>
    </Box>
  );
};
