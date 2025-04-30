import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { io } from 'socket.io-client';
import { 
  FaMicrophone, 
  FaMicrophoneSlash, 
  FaVideo, 
  FaVideoSlash, 
  FaDesktop, 
  FaStop, 
  FaComments, 
  FaTimes, 
  FaSignOutAlt,
  FaUser,
  FaChevronUp,
  FaCopy,
  FaInfoCircle
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';

// Function to generate a random room ID
const generateRoomId = () => {
  const chars = 'abcdefghijkmnpqrstuvwxyz123456789';
  let code = '';
  
  for (let i = 0; i < 3; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  code += '-';
  
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  code += '-';
  
  for (let i = 0; i < 3; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return code;
};

function WebRTCMeeting() {
  const { roomId: urlRoomId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showRoomInfo, setShowRoomInfo] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [remoteStreams, setRemoteStreams] = useState({});
  const [isHost, setIsHost] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [isJoining, setIsJoining] = useState(true);
  const [audioLevel, setAudioLevel] = useState(0);
  const [videoDevices, setVideoDevices] = useState([]);
  const [audioDevices, setAudioDevices] = useState([]);
  const [selectedVideoDevice, setSelectedVideoDevice] = useState('');
  const [selectedAudioDevice, setSelectedAudioDevice] = useState('');
  const [showVideoDropdown, setShowVideoDropdown] = useState(false);
  const [showAudioDropdown, setShowAudioDropdown] = useState(false);
  const [showScreenDropdown, setShowScreenDropdown] = useState(false);
  const [screenSources, setScreenSources] = useState([]);
  const [selectedScreenId, setSelectedScreenId] = useState('');
  const [gridLayout, setGridLayout] = useState('1x1');
  const [meetingCode, setMeetingCode] = useState('');
  
  const localVideoRef = useRef(null);
  const remoteVideoRefs = useRef({});
  const peerConnections = useRef({});
  const localStream = useRef(null);
  const screenStreamRef = useRef(null);
  const chatContainerRef = useRef(null);
  const dataChannels = useRef({});
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const joinSoundRef = useRef(null);
  const exitSoundRef = useRef(null);
  const socketRef = useRef(null);
  const assignedStreams = useRef(new Set());

  // Initialize audio elements
  useEffect(() => {
    const joinSound = new Audio('/sounds/entry.mp3');
    const exitSound = new Audio('/sounds/exit.mp3');
    
    joinSound.volume = 1;
    exitSound.volume = 1;
    
    joinSound.load();
    exitSound.load();
    
    joinSoundRef.current = joinSound;
    exitSoundRef.current = exitSound;

    const animationTimer = setTimeout(() => {
      setIsJoining(false);
      playJoinSound();
    }, 1000);

    return () => {
      clearTimeout(animationTimer);
      joinSound.pause();
      joinSound.src = '';
      exitSound.pause();
      exitSound.src = '';
    };
  }, []);

  const playJoinSound = () => {
    if (joinSoundRef.current) {
      joinSoundRef.current.currentTime = 0;
      joinSoundRef.current.play()
        .catch(error => console.error('Error playing join sound:', error));
    }
  };

  const playExitSound = () => {
    if (exitSoundRef.current) {
      exitSoundRef.current.currentTime = 0;
      exitSoundRef.current.play()
        .catch(error => console.error('Error playing exit sound:', error));
    }
  };

  const analyzeAudio = () => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    const average = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length;
    setAudioLevel(average);

    animationFrameRef.current = requestAnimationFrame(analyzeAudio);
  };

  // Get available media devices
  useEffect(() => {
    const getDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter(device => device.kind === 'videoinput');
        const audioInputs = devices.filter(device => device.kind === 'audioinput');
        
        console.log('Enumerated video devices:', videoInputs);
        console.log('Enumerated audio devices:', audioInputs);
        
        setVideoDevices(videoInputs);
        setAudioDevices(audioInputs);
        
        if (videoInputs.length > 0) {
          setSelectedVideoDevice(videoInputs[0].deviceId);
        }
        
        if (audioInputs.length > 0) {
          setSelectedAudioDevice(audioInputs[0].deviceId);
        }
      } catch (error) {
        console.error('Error getting devices:', error);
        toast.error?.('Failed to get media devices') ?? console.error('Toast error: Failed to get media devices');
      }
    };
    
    getDevices();
    
    navigator.mediaDevices.ondevicechange = () => {
      console.log('Media devices changed, re-enumerating');
      getDevices();
    };

    return () => {
      navigator.mediaDevices.ondevicechange = null;
    };
  }, []);

  // Initialize socket connection and join room
  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    if (!urlRoomId) {
      const newRoomId = generateRoomId();
      navigate(`/meeting/${newRoomId}`, { replace: true });
      return;
    }

    setRoomId(urlRoomId);
    setMeetingCode(urlRoomId);

    let isComponentMounted = true;
    let audioContext = null;

    socketRef.current = io('http://localhost:3001', {
      transports: ['websocket', 'polling'],
      path: '/socket.io/',
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 20000
    });

    const initializeMedia = async () => {
      if (!isComponentMounted) return null;

      try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        audioContextRef.current = audioContext;

        console.log('Attempting to access media devices with:', {
          video: selectedVideoDevice ? { deviceId: { exact: selectedVideoDevice } } : true,
          audio: selectedAudioDevice ? { deviceId: { exact: selectedAudioDevice } } : true
        });

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            aspectRatio: 16/9,
            frameRate: { ideal: 30 },
            deviceId: selectedVideoDevice ? { exact: selectedVideoDevice } : undefined
          },
          audio: selectedAudioDevice ? { deviceId: { exact: selectedAudioDevice } } : true
        });
        
        if (!isComponentMounted) {
          stream.getTracks().forEach(track => track.stop());
          return null;
        }

        localStream.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.play().catch(error => {
            console.error('Error playing local video:', error);
          });
          console.log('Assigned local stream to video element:', stream.id);
        }

        analyserRef.current = audioContext.createAnalyser();
        analyserRef.current.fftSize = 256;
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyserRef.current);
        
        analyzeAudio();

        return stream;
      } catch (error) {
        console.error('Error accessing media devices:', error.name, error.message);
        if (!isComponentMounted) return null;

        try {
          console.log('Falling back to audio-only');
          const audioStream = await navigator.mediaDevices.getUserMedia({
            audio: selectedAudioDevice ? { deviceId: { exact: selectedAudioDevice } } : true
          });
          
          if (!isComponentMounted) {
            audioStream.getTracks().forEach(track => track.stop());
            return null;
          }

          localStream.current = audioStream;
          setIsVideoOff(true);
          toast.warn?.('Video access failed, using audio only. Check webcam availability.') ??
            console.warn('Toast warn: Video access failed, using audio only.');

          if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            audioContextRef.current = audioContext;
          }
          analyserRef.current = audioContext.createAnalyser();
          analyserRef.current.fftSize = 256;
          const source = audioContext.createMediaStreamSource(audioStream);
          source.connect(analyserRef.current);
          
          analyzeAudio();

          return audioStream;
        } catch (audioError) {
          console.error('Error accessing audio:', audioError.name, audioError.message);
          if (isComponentMounted) {
            toast.error?.('Failed to access media devices. Please check permissions and device availability.') ??
              console.error('Toast error: Failed to access media devices.');
          }
          return null;
        }
      }
    };

    socketRef.current.on('connect', async () => {
      console.log('Socket connected:', socketRef.current.id);
      if (isComponentMounted) {
        try {
          const stream = await initializeMedia();
          if (!stream) {
            console.error('No media stream available');
            toast.error?.('Unable to start meeting without media stream.') ??
              console.error('Toast error: Unable to start meeting without media stream.');
            return;
          }
          console.log('Emitting join-room for room:', urlRoomId);
          socketRef.current.emit('join-room', {
            roomId: urlRoomId,
            userId: user.uid,
            userName: user.displayName || 'Anonymous'
          });
        } catch (error) {
          console.error('Error during join-room:', error);
          toast.error?.('Failed to join room') ?? console.error('Toast error: Failed to join room');
        }
      }
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      toast.error?.('Failed to connect to server. Retrying...') ??
        console.error('Toast error: Failed to connect to server');
    });

    socketRef.current.on('room-info', async ({ roomId: serverRoomId, peers, iceServers }) => {
      if (!isComponentMounted) return;

      console.log('Received room-info:', { serverRoomId, peers });
      setRoomId(serverRoomId);
      
      setParticipants(prevParticipants => {
        const newParticipants = peers
          .filter(peer => peer.id !== socketRef.current.id)
          .map(peer => ({
            id: peer.id,
            userId: peer.userId,
            name: peer.userName || `User ${peer.id.slice(0, 4)}`
          }));
        console.log('Updated participants:', newParticipants);
        return newParticipants;
      });

      setIsHost(peers.length === 0 || !peers.some(peer => peer.id !== socketRef.current.id));

      if (iceServers) {
        localStorage.setItem('iceServers', JSON.stringify(iceServers));
      }

      if (localStream.current) {
        for (const peer of peers) {
          if (peer.id !== socketRef.current.id) {
            console.log('Setting up peer connection for peer:', peer.id);
            await setupPeerConnection(peer.id, localStream.current);
            if (!isHost) {
              console.log('Non-host initiating offer to:', peer.id);
              await createAndSendOffer(peer.id);
            }
          }
        }
      }
    });

    socketRef.current.on('user-joined', async ({ peerId, userId, userName }) => {
      if (!isComponentMounted) return;

      console.log('User joined:', { peerId, userId, userName });
      setParticipants(prevParticipants => {
        if (prevParticipants.some(p => p.id === peerId)) {
          return prevParticipants;
        }
        const newParticipant = { id: peerId, userId, name: userName || `User ${peerId.slice(0, 4)}` };
        console.log('Added participant:', newParticipant);
        return [...prevParticipants, newParticipant];
      });

      if (localStream.current && peerId !== socketRef.current.id) {
        console.log('Setting up peer connection for new peer:', peerId);
        await setupPeerConnection(peerId, localStream.current);
        if (isHost) {
          console.log('Host initiating offer to:', peerId);
          await createAndSendOffer(peerId);
        }
      }
    });

    socketRef.current.on('user-left', ({ peerId }) => {
      if (!isComponentMounted) return;

      console.log('User left:', peerId);
      setParticipants(prevParticipants => {
        const updated = prevParticipants.filter(p => p.id !== peerId);
        console.log('Updated participants after user-left:', updated);
        return updated;
      });

      if (peerConnections.current[peerId]) {
        peerConnections.current[peerId].close();
        delete peerConnections.current[peerId];
      }
      if (dataChannels.current[peerId]) {
        dataChannels.current[peerId].close();
        delete dataChannels.current[peerId];
      }
      setRemoteStreams(prev => {
        const newStreams = { ...prev };
        delete newStreams[peerId];
        console.log('Removed remote stream for peer:', peerId);
        return newStreams;
      });
      if (remoteVideoRefs.current[peerId]) {
        remoteVideoRefs.current[peerId].srcObject = null;
        delete remoteVideoRefs.current[peerId];
      }
      assignedStreams.current.delete(peerId);
    });

    socketRef.current.on('signal', async ({ from, signal }) => {
      if (!isComponentMounted) return;

      try {
        if (!peerConnections.current[from]) {
          console.log('Creating new peer connection for signaling from:', from);
          await setupPeerConnection(from, localStream.current);
        }

        const pc = peerConnections.current[from];
        console.log('Received signal:', signal.type, 'from:', from, 'Signaling state:', pc.signalingState);

        if (signal.type === 'offer') {
          await pc.setRemoteDescription(new RTCSessionDescription(signal));
          console.log('Set remote description (offer) for peer:', from);
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socketRef.current.emit('signal', {
            to: from,
            signal: answer,
            roomId: urlRoomId
          });
          console.log('Sent answer to peer:', from);

          if (pc.pendingCandidates && pc.pendingCandidates.length > 0) {
            console.log('Applying queued ICE candidates for peer:', from, pc.pendingCandidates.length);
            for (const candidate of pc.pendingCandidates) {
              await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(error => {
                console.error('Error applying queued ICE candidate:', error);
              });
            }
            pc.pendingCandidates = [];
          }
        } else if (signal.type === 'answer') {
          if (pc.signalingState === 'have-local-offer') {
            await pc.setRemoteDescription(new RTCSessionDescription(signal));
            console.log('Set remote description (answer) for peer:', from);

            if (pc.pendingCandidates && pc.pendingCandidates.length > 0) {
              console.log('Applying queued ICE candidates for peer:', from, pc.pendingCandidates.length);
              for (const candidate of pc.pendingCandidates) {
                await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(error => {
                  console.error('Error applying queued ICE candidate:', error);
                });
              }
              pc.pendingCandidates = [];
            }
          } else {
            console.warn('Ignoring answer: not in have-local-offer state', pc.signalingState);
          }
        }
      } catch (error) {
        console.error('Error handling signal:', error);
        toast.error?.('Failed to process signal') ?? console.error('Toast error: Failed to process signal');
      }
    });

    socketRef.current.on('ice-candidate', async ({ from, candidate }) => {
      if (!isComponentMounted) return;

      try {
        const pc = peerConnections.current[from];
        if (!pc) {
          console.log('No peer connection for peer:', from, 'Queuing candidate');
          peerConnections.current[from] = { pendingCandidates: [candidate] };
          return;
        }

        if (pc.remoteDescription && pc.remoteDescription.type) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
          console.log('Added ICE candidate from:', from, candidate);
        } else {
          console.log('Remote description not set for peer:', from, 'Queuing candidate');
          pc.pendingCandidates = pc.pendingCandidates || [];
          pc.pendingCandidates.push(candidate);
        }
      } catch (error) {
        console.error('Error adding ICE candidate:', error);
      }
    });

    return () => {
      isComponentMounted = false;

      if (socketRef.current) {
        socketRef.current.off('connect');
        socketRef.current.off('connect_error');
        socketRef.current.off('room-info');
        socketRef.current.off('user-joined');
        socketRef.current.off('user-left');
        socketRef.current.off('signal');
        socketRef.current.off('ice-candidate');
        socketRef.current.disconnect();
      }

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContext) {
        audioContext.close();
      }

      if (localStream.current) {
        localStream.current.getTracks().forEach(track => track.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
      }

      Object.values(peerConnections.current).forEach(pc => pc.close());
      peerConnections.current = {};
      Object.values(dataChannels.current).forEach(dc => dc.close());
      dataChannels.current = {};
      assignedStreams.current.clear();
    };
  }, [user, urlRoomId, navigate, selectedVideoDevice, selectedAudioDevice]);

  // Setup peer connection for a specific peer
  const setupPeerConnection = async (peerId, stream) => {
    try {
      const storedIceServers = localStorage.getItem('iceServers');
      const iceServers = storedIceServers ? JSON.parse(storedIceServers) : [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ];

      const pc = new RTCPeerConnection({ iceServers });
      pc.pendingCandidates = [];
      peerConnections.current[peerId] = pc;

      if (stream) {
        stream.getTracks().forEach(track => {
          console.log('Adding track to peer:', peerId, track.kind, track.id);
          pc.addTrack(track, stream);
        });
        console.log('Current senders for peer:', peerId, pc.getSenders().map(s => `${s.track?.kind}: ${s.track?.id}`));
      }

      pc.ontrack = (event) => {
        const stream = event.streams[0];
        if (!stream) {
          console.warn('No stream received for track:', event.track);
          return;
        }
        const streamId = stream.id;
        const trackKey = `${peerId}:${streamId}`;

        console.log('ontrack event:', {
          peerId,
          streamId,
          track: {
            id: event.track.id,
            kind: event.track.kind,
            enabled: event.track.enabled,
            readyState: event.track.readyState
          },
          connectionState: pc.connectionState,
          iceConnectionState: pc.iceConnectionState,
          timestamp: new Date().toISOString()
        });

        if (assignedStreams.current.has(trackKey)) {
          console.log('Stream already assigned for peer:', peerId, 'Stream ID:', streamId);
          return;
        }

        const tracks = stream.getTracks();
        if (tracks.length === 0) {
          console.warn('Stream has no tracks:', peerId, streamId);
          return;
        }
        console.log('Stream tracks:', tracks.map(t => ({ id: t.id, kind: t.kind, enabled: t.enabled, readyState: t.readyState })));

        assignedStreams.current.add(trackKey);

        setRemoteStreams(prev => {
          const existingStream = prev[peerId];
          if (existingStream && existingStream.id === streamId) {
            console.log('Stream already in state for peer:', peerId);
            return prev;
          }
          const newStreams = { ...prev, [peerId]: stream };
          console.log('Updated remote streams:', Object.keys(newStreams));
          return newStreams;
        });

        if (remoteVideoRefs.current[peerId]) {
          const videoElement = remoteVideoRefs.current[peerId];
          if (videoElement.srcObject && videoElement.srcObject.id === streamId) {
            console.log('Video element already has correct stream for peer:', peerId);
            return;
          }
          videoElement.srcObject = stream;
          videoElement.play().catch(error => {
            console.error('Error playing remote video for peer:', peerId, error);
            toast.error?.('Failed to play remote video') ?? console.error('Toast error: Failed to play remote video');
          });
          console.log('Assigned remote stream to video element for:', peerId, streamId, 'at:', new Date().toISOString());
        } else {
          console.warn('No video ref for peer:', peerId, 'Stream will be assigned when ref is available');
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socketRef.current.emit('ice-candidate', {
            to: peerId,
            candidate: event.candidate,
            roomId: urlRoomId
          });
          console.log('Sent ICE candidate to:', peerId, event.candidate);
        } else {
          console.log('ICE candidate gathering complete for peer:', peerId);
        }
      };

      pc.onconnectionstatechange = async () => {
        console.log('Peer:', peerId, 'Connection state:', pc.connectionState, 'ICE state:', pc.iceConnectionState, 'at:', new Date().toISOString());
        if (pc.connectionState === 'connected') {
          setTimeout(() => {
            if (pc.connectionState === 'connected' && (!dataChannels.current[peerId] || dataChannels.current[peerId].readyState !== 'open')) {
              console.log('Creating data channel for peer:', peerId);
              createDataChannel(peerId);
            }
          }, 1000);
        } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
          console.warn('Connection failed/disconnected for peer:', peerId, 'Attempting to reconnect');
          pc.close();
          delete peerConnections.current[peerId];
          if (dataChannels.current[peerId]) {
            dataChannels.current[peerId].close();
            delete dataChannels.current[peerId];
          }
          assignedStreams.current.delete(`${peerId}:${remoteStreams[peerId]?.id}`);
          setRemoteStreams(prev => {
            const newStreams = { ...prev };
            delete newStreams[peerId];
            console.log('Removed remote stream for peer:', peerId);
            return newStreams;
          });
          if (remoteVideoRefs.current[peerId]) {
            remoteVideoRefs.current[peerId].srcObject = null;
          }
          setTimeout(async () => {
            if (isComponentMounted && localStream.current) {
              console.log('Re-establishing peer connection for:', peerId);
              await setupPeerConnection(peerId, localStream.current);
              await createAndSendOffer(peerId);
            }
          }, 2000);
        }
      };

      pc.onnegotiationneeded = async () => {
        console.log('Negotiation needed for peer:', peerId);
        setTimeout(() => createAndSendOffer(peerId), 200);
      };

      pc.ondatachannel = (event) => {
        console.log('Received data channel from:', peerId);
        setupDataChannel(peerId, event.channel);
      };

      return true;
    } catch (error) {
      console.error('Error setting up peer connection:', error);
      toast.error?.('Failed to establish peer connection') ?? console.error('Toast error: Failed to establish peer connection');
      return false;
    }
  };

  const createDataChannel = (peerId) => {
    const pc = peerConnections.current[peerId];
    if (!pc) {
      console.log('Cannot create data channel: peer connection not initialized for peer:', peerId);
      return;
    }

    if (dataChannels.current[peerId] && dataChannels.current[peerId].readyState === 'open') {
      console.log('Data channel already open for peer:', peerId, 'skipping creation');
      return;
    }

    if (dataChannels.current[peerId]) {
      console.log('Closing existing data channel for peer:', peerId);
      dataChannels.current[peerId].close();
      delete dataChannels.current[peerId];
    }

    console.log('Creating data channel for peer:', peerId);
    try {
      const dataChannel = pc.createDataChannel('chat', {
        ordered: true,
        maxRetransmits: 3,
        protocol: 'json'
      });
      setupDataChannel(peerId, dataChannel);
    } catch (error) {
      console.error('Error creating data channel for peer:', peerId, error);
      if (!error.message.includes('already exists')) {
        setTimeout(() => {
          if (peerConnections.current[peerId]?.connectionState === 'connected' && !dataChannels.current[peerId]) {
            createDataChannel(peerId);
          }
        }, 2000);
      }
    }
  };

  const setupDataChannel = (peerId, channel) => {
    if (dataChannels.current[peerId]) {
      console.log('Closing existing data channel for peer:', peerId);
      dataChannels.current[peerId].close();
    }
    dataChannels.current[peerId] = channel;
    channel.messageQueue = [];
    console.log('Setup data channel for peer:', peerId, 'State:', channel.readyState);

    channel.onopen = () => {
      console.log('Data channel opened for peer:', peerId, 'at:', new Date().toISOString());
      const testMessage = JSON.stringify({
        type: 'system',
        message: `Data channel connected to ${peerId}`,
        timestamp: new Date().toISOString()
      });
      try {
        channel.send(testMessage);
        console.log('Sent test message to peer:', peerId);
      } catch (error) {
        console.error('Error sending test message:', error);
        channel.messageQueue.push(testMessage);
      }

      if (channel.messageQueue.length > 0) {
        console.log('Sending queued messages for peer:', peerId, channel.messageQueue.length);
        while (channel.messageQueue.length > 0) {
          const message = channel.messageQueue.shift();
          try {
            channel.send(message);
            console.log('Sent queued message to peer:', peerId);
          } catch (error) {
            console.error('Error sending queued message:', error);
            channel.messageQueue.unshift(message);
            break;
          }
        }
      }
    };

    channel.onclose = () => {
      console.log('Data channel closed for peer:', peerId, 'at:', new Date().toISOString());
      if (dataChannels.current[peerId] === channel) {
        delete dataChannels.current[peerId];
        if (peerConnections.current[peerId]?.connectionState === 'connected') {
          console.log('Attempting to recreate data channel for peer:', peerId);
          setTimeout(() => {
            if (peerConnections.current[peerId]?.connectionState === 'connected' && !dataChannels.current[peerId]) {
              createDataChannel(peerId);
            }
          }, 2000);
        }
      }
    };

    channel.onerror = (error) => {
      console.error('Data channel error for peer:', peerId, error);
      if (peerConnections.current[peerId]?.connectionState === 'connected') {
        setTimeout(() => {
          if (peerConnections.current[peerId]?.connectionState === 'connected' && !dataChannels.current[peerId]) {
            createDataChannel(peerId);
          }
        }, 2000);
      }
    };

    channel.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Received data channel message from:', peerId, data, 'at:', new Date().toISOString());
        if (data.type === 'chat') {
          setMessages(prevMessages => {
            const newMessages = [...prevMessages, data.message];
            console.log('Updated messages:', newMessages);
            return newMessages;
          });
          if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
          }
        } else if (data.type === 'system') {
          console.log('System message:', data.message);
        }
      } catch (error) {
        console.error('Error parsing data channel message from:', peerId, error);
      }
    };
  };

  const createAndSendOffer = async (peerId) => {
    try {
      const pc = peerConnections.current[peerId];
      if (!pc) {
        console.warn('No peer connection for peer:', peerId);
        return;
      }

      console.log('Creating offer for:', peerId);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socketRef.current.emit('signal', {
        to: peerId,
        signal: offer,
        roomId: urlRoomId
      });
      console.log('Sent offer to:', peerId);
    } catch (error) {
      console.error('Error creating offer:', error);
    }
  };

  const trySendMessage = (peerId, message) => {
    const channel = dataChannels.current[peerId];
    if (channel && channel.readyState === 'open') {
      try {
        channel.send(message);
        console.log('Sent message to peer:', peerId, message);
      } catch (error) {
        console.error('Error sending message:', error);
        channel.messageQueue = channel.messageQueue || [];
        channel.messageQueue.push(message);
        console.log('Queued message due to send error for peer:', peerId, 'Queue length:', channel.messageQueue.length);
      }
    } else {
      console.warn('Data channel not open for peer:', peerId, 'State:', channel?.readyState);
      channel.messageQueue = channel.messageQueue || [];
      channel.messageQueue.push(message);
      console.log('Queued message for peer:', peerId, 'Queue length:', channel.messageQueue.length);
      if (peerConnections.current[peerId]?.connectionState === 'connected' && !dataChannels.current[peerId]) {
        console.log('Attempting to recreate data channel for peer:', peerId);
        setTimeout(() => createDataChannel(peerId), 1000);
      }
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    if (Object.keys(peerConnections.current).length === 0) {
      console.log('No peer connections available to send message');
      toast.error?.('No participants to send message to.') ?? console.error('Toast error: No participants to send message');
      return;
    }

    const message = {
      id: Date.now(),
      text: newMessage,
      sender: user?.displayName || 'You',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prevMessages => {
      const newMessages = [...prevMessages, message];
      console.log('Added local message:', newMessages);
      return newMessages;
    });

    const messageString = JSON.stringify({
      type: 'chat',
      message: message
    });

    Object.keys(dataChannels.current).forEach(peerId => {
      if (peerConnections.current[peerId]?.connectionState !== 'connected') {
        console.log('Cannot send message to peer:', peerId, 'Connection state:', peerConnections.current[peerId]?.connectionState);
        toast.error?.('Connection not established with some participants. Please wait...') ?? 
          console.error('Toast error: Connection not established');
        return;
      }
      trySendMessage(peerId, messageString);
    });

    setNewMessage('');
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  const toggleMute = () => {
    if (localStream.current) {
      const audioTrack = localStream.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
        console.log('Toggled mute:', !audioTrack.enabled);
      }
    }
  };

  const toggleVideo = async () => {
    try {
      if (isVideoOff) {
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            aspectRatio: 16/9,
            frameRate: { ideal: 30 },
            deviceId: selectedVideoDevice ? { exact: selectedVideoDevice } : undefined
          },
          audio: false
        });

        const videoTrack = newStream.getVideoTracks()[0];
        
        if (localStream.current) {
          const audioTrack = localStream.current.getAudioTracks()[0];
          const existingVideoTrack = localStream.current.getVideoTracks()[0];
          if (existingVideoTrack) {
            localStream.current.removeTrack(existingVideoTrack);
            existingVideoTrack.stop();
          }
          localStream.current.addTrack(videoTrack);
        } else {
          localStream.current = new MediaStream([videoTrack]);
          if (audioTrack) localStream.current.addTrack(audioTrack);
        }

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream.current;
          localVideoRef.current.play().catch(error => {
            console.error('Error playing local video after toggle:', error);
          });
          console.log('Updated local video stream');
        }

        for (const [peerId, pc] of Object.entries(peerConnections.current)) {
          const sender = pc.getSenders().find(s => s.track?.kind === 'video');
          if (sender) {
            await sender.replaceTrack(videoTrack);
            console.log('Replaced video track for peer:', peerId);
          } else {
            pc.addTrack(videoTrack, localStream.current);
            console.log('Added new video track for peer:', peerId);
          }
          await createAndSendOffer(peerId);
        }

        setIsVideoOff(false);
        toast.success?.('Video turned on') ?? console.log('Video turned on');
      } else {
        if (localStream.current) {
          const videoTrack = localStream.current.getVideoTracks()[0];
          if (videoTrack) {
            videoTrack.stop();
            localStream.current.removeTrack(videoTrack);
          }

          for (const [peerId, pc] of Object.entries(peerConnections.current)) {
            const sender = pc.getSenders().find(s => s.track?.kind === 'video');
            if (sender) {
              await sender.replaceTrack(null);
              console.log('Removed video track for peer:', peerId);
            }
            await createAndSendOffer(peerId);
          }
        }

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream.current;
          console.log('Updated local video stream (video off)');
        }

        setIsVideoOff(true);
        toast.success?.('Video turned off') ?? console.log('Video turned off');
      }
    } catch (error) {
      console.error('Error toggling video:', error);
      toast.error?.('Failed to toggle video. Check webcam availability.') ??
        console.error('Toast error: Failed to toggle video');
      setIsVideoOff(true);
    }
  };

  const getScreenSources = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: "always",
          displaySurface: "monitor",
        },
        audio: false
      });
      
      const track = stream.getVideoTracks()[0];
      const settings = track.getSettings();
      
      stream.getTracks().forEach(track => track.stop());
      
      setSelectedScreenId(settings.deviceId);
      
      setScreenSources([{ id: settings.deviceId, label: 'Screen' }]);
    } catch (error) {
      console.error('Error getting screen sources:', error);
      toast.error?.('Failed to get screen sources') ?? console.error('Toast error: Failed to get screen sources');
    }
  };

  const toggleScreenDropdown = () => {
    if (!showScreenDropdown) {
      getScreenSources();
    }
    setShowScreenDropdown(!showScreenDropdown);
    setShowVideoDropdown(false);
    setShowAudioDropdown(false);
  };

  const startScreenShare = async (sourceId = null) => {
    try {
      const constraints = {
        video: {
          cursor: "always",
          displaySurface: "monitor",
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      };

      if (sourceId) {
        constraints.video.deviceId = sourceId;
      }

      const screenStream = await navigator.mediaDevices.getDisplayMedia(constraints);
      
      screenStreamRef.current = screenStream;
      setIsScreenSharing(true);
      setShowScreenDropdown(false);

      const videoTrack = screenStream.getVideoTracks()[0];
      for (const [peerId, pc] of Object.entries(peerConnections.current)) {
        const sender = pc.getSenders().find(s => s.track?.kind === 'video');
        if (sender) {
          await sender.replaceTrack(videoTrack);
          console.log('Replaced video track with screen share for peer:', peerId);
        } else {
          pc.addTrack(videoTrack, screenStream);
          console.log('Added screen share track for peer:', peerId);
        }
        await createAndSendOffer(peerId);
      }

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = screenStream;
        localVideoRef.current.play().catch(error => {
          console.error('Error playing screen share video:', error);
        });
        console.log('Assigned screen share stream to local video');
      }

      videoTrack.onended = () => {
        stopScreenShare();
      };
    } catch (error) {
      console.error('Error sharing screen:', error);
      toast.error?.('Failed to start screen sharing') ?? console.error('Toast error: Failed to start screen sharing');
    }
  };

  const stopScreenShare = async () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
      setIsScreenSharing(false);

      if (localStream.current && !isVideoOff) {
        const videoTrack = localStream.current.getVideoTracks()[0];
        for (const [peerId, pc] of Object.entries(peerConnections.current)) {
          const sender = pc.getSenders().find(s => s.track?.kind === 'video');
          if (sender && videoTrack) {
            await sender.replaceTrack(videoTrack);
            console.log('Restored video track for peer:', peerId);
          }
          await createAndSendOffer(peerId);
        }
      }

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream.current;
        localVideoRef.current.play().catch(error => {
          console.error('Error playing local video after stopping screen share:', error);
        });
        console.log('Restored local video stream');
      }
    }
  };

  const exitMeeting = () => {
    playExitSound();
    setTimeout(() => {
      cleanupResources();
      navigate('/', { replace: true });
    }, 300);
  };

  const cleanupResources = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    if (localStream.current) {
      localStream.current.getTracks().forEach(track => track.stop());
      localStream.current = null;
    }

    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }

    Object.values(peerConnections.current).forEach(pc => pc.close());
    peerConnections.current = {};

    Object.values(dataChannels.current).forEach(dc => dc.close());
    dataChannels.current = {};

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    assignedStreams.current.clear();
  };

  const switchVideoDevice = async (deviceId) => {
    try {
      console.log('Switching video device to:', deviceId);
      
      if (localStream.current) {
        const videoTrack = localStream.current.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.stop();
          localStream.current.removeTrack(videoTrack);
        }
      }
      
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: { exact: deviceId },
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        },
        audio: false
      });
      
      const newVideoTrack = newStream.getVideoTracks()[0];
      console.log('New video track:', {
        id: newVideoTrack.id,
        kind: newVideoTrack.kind,
        enabled: newVideoTrack.enabled,
        readyState: newVideoTrack.readyState
      });
      
      if (localStream.current) {
        const audioTrack = localStream.current.getAudioTracks()[0];
        localStream.current = new MediaStream([newVideoTrack, ...(audioTrack ? [audioTrack] : [])]);
      } else {
        localStream.current = newStream;
      }
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream.current;
        localVideoRef.current.play().catch(error => {
          console.error('Error playing local video:', error);
        });
        console.log('Switched local video device to:', deviceId, 'Stream ID:', localStream.current.id);
      }
      
      for (const [peerId, pc] of Object.entries(peerConnections.current)) {
        const sender = pc.getSenders().find(s => s.track?.kind === 'video');
        if (sender) {
          await sender.replaceTrack(newVideoTrack);
          console.log('Replaced video track for peer:', peerId, 'Track ID:', newVideoTrack.id);
        } else {
          pc.addTrack(newVideoTrack, localStream.current);
          console.log('Added new video track for peer:', peerId, 'Track ID:', newVideoTrack.id);
        }
        await createAndSendOffer(peerId);
      }
      
      setSelectedVideoDevice(deviceId);
      setIsVideoOff(false);
      setShowVideoDropdown(false);
      toast.success?.('Switched camera successfully') ?? console.log('Switched camera successfully');
    } catch (error) {
      console.error('Error switching video device:', error.name, error.message);
      toast.error?.('Failed to switch camera. Check device availability and permissions.') ??
        console.error('Toast error: Failed to switch camera');
    }
  };

  const switchAudioDevice = async (deviceId) => {
    try {
      console.log('Switching audio device to:', deviceId);
      
      if (localStream.current) {
        const audioTrack = localStream.current.getAudioTracks()[0];
        if (audioTrack) {
          audioTrack.stop();
          localStream.current.removeTrack(audioTrack);
        }
      }
      
      const newStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: { exact: deviceId }
        },
        video: false
      });
      
      const newAudioTrack = newStream.getAudioTracks()[0];
      console.log('New audio track:', {
        id: newAudioTrack.id,
        kind: newAudioTrack.kind,
        enabled: newAudioTrack.enabled,
        readyState: newAudioTrack.readyState
      });
      
      if (localStream.current) {
        const videoTrack = localStream.current.getVideoTracks()[0];
        localStream.current = new MediaStream([...(videoTrack ? [videoTrack] : []), newAudioTrack]);
      } else {
        localStream.current = newStream;
      }
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream.current;
        console.log('Switched local audio device to:', deviceId, 'Stream ID:', localStream.current.id);
      }
      
      if (audioContextRef.current && analyserRef.current) {
        const source = audioContextRef.current.createMediaStreamSource(localStream.current);
        source.connect(analyserRef.current);
        console.log('Updated audio analyzer with new stream');
      }
      
      for (const [peerId, pc] of Object.entries(peerConnections.current)) {
        const sender = pc.getSenders().find(s => s.track?.kind === 'audio');
        if (sender) {
          await sender.replaceTrack(newAudioTrack);
          console.log('Replaced audio track for peer:', peerId, 'Track ID:', newAudioTrack.id);
        } else {
          pc.addTrack(newAudioTrack, localStream.current);
          console.log('Added new audio track for peer:', peerId, 'Track ID:', newAudioTrack.id);
        }
        await createAndSendOffer(peerId);
      }
      
      setSelectedAudioDevice(deviceId);
      setShowAudioDropdown(false);
      toast.success?.('Switched microphone successfully') ?? console.log('Switched microphone successfully');
    } catch (error) {
      console.error('Error switching audio device:', error.name, error.message);
      toast.error?.('Failed to switch microphone. Check device availability and permissions.') ??
        console.error('Toast error: Failed to switch microphone');
    }
  };

  const toggleAudioDropdown = () => {
    setShowAudioDropdown(!showAudioDropdown);
    setShowVideoDropdown(false);
    setShowScreenDropdown(false);
    console.log('Toggled audio dropdown, showAudioDropdown:', !showAudioDropdown);
  };

  const toggleVideoDropdown = () => {
    setShowVideoDropdown(!showVideoDropdown);
    setShowAudioDropdown(false);
    setShowScreenDropdown(false);
    console.log('Toggled video dropdown, showVideoDropdown:', !showVideoDropdown);
  };

  useEffect(() => {
    const totalParticipants = participants.length + 1;
    if (totalParticipants <= 1) {
      setGridLayout('1x1');
    } else if (totalParticipants <= 4) {
      setGridLayout('2x2');
    } else {
      setGridLayout('3x3');
    }
    console.log('Updated grid layout:', gridLayout, 'Participants:', participants.length);
  }, [participants]);

  const getGridClassName = () => {
    switch (gridLayout) {
      case '2x2':
        return 'grid-cols-2 gap-4';
      case '3x3':
        return 'grid-cols-3 gap-3';
      default:
        return 'grid-cols-1';
    }
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(meetingCode);
    toast.success?.('Meeting code copied!') ?? console.log('Meeting code copied');
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      <div className="h-screen flex flex-col">
        <div className={`flex-1 transition-all duration-300 ${isChatOpen ? 'md:w-3/4' : 'w-full'}`} 
             style={{ 
               height: 'calc(98vh - 5rem)',
               marginTop: '0.5rem'
             }}>
          <div className="h-full p-8 pb-20">
            <div className={`grid ${getGridClassName()} h-full max-w-7xl mx-auto`}>
              <div className={`relative bg-[#1E1E1E] rounded-2xl overflow-hidden transform transition-all duration-500 shadow-[0_0_75px_-30px_rgba(255,255,255,0.25)] ${
                isJoining ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
              }`}>
                {!isVideoOff || isScreenSharing ? (
                  <div className="w-full h-full flex items-center justify-center bg-[#1E1E1E]">
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#1E1E1E]">
                    <div className="relative">
                      {!isMuted && audioLevel > 10 && (
                        <>
                          {[...Array(3)].map((_, i) => (
                            <div
                              key={i}
                              className="absolute inset-0 rounded-full border-2 border-white/30"
                              style={{
                                transform: `scale(${1 + (audioLevel / 128) * (0.3 + i * 0.2)})`,
                                opacity: (1 - i * 0.2) * (audioLevel / 128),
                                transition: 'transform 0.1s ease-out, opacity 0.1s ease-out'
                              }}
                            />
                          ))}
                        </>
                      )}
                      <div className="w-32 h-32 rounded-full bg-blue-500 flex items-center justify-center text-5xl font-bold relative z-10">
                        {(user?.displayName || 'You').charAt(0).toUpperCase()}
                      </div>
                    </div>
                  </div>
                )}
                <div className="absolute bottom-4 left-4 bg-black/50 px-4 py-2 rounded-xl text-sm backdrop-blur-md flex items-center gap-3">
                  <span className="font-sofia-medium">{user?.displayName || 'You'}</span>
                  {isHost && <span className="text-blue-400 font-sofia-light">(Host)</span>}
                </div>
              </div>

              {participants.map((participant) => (
                <div
                  key={participant.id}
                  className="relative bg-[#1E1E1E] rounded-2xl overflow-hidden"
                >
                  <div className="w-full h-full flex items-center justify-center bg-[#1E1E1E]">
                    {remoteStreams[participant.id] ? (
                      <video
                        ref={el => {
                          if (el) {
                            remoteVideoRefs.current[participant.id] = el;
                            const stream = remoteStreams[participant.id];
                            if (stream && (!el.srcObject || el.srcObject.id !== stream.id)) {
                              el.srcObject = stream;
                              el.play().catch(error => {
                                console.error('Error playing remote video for:', participant.id, error);
                                toast.error?.('Failed to play remote video') ?? console.error('Toast error: Failed to play remote video');
                              });
                              console.log('Assigned stream to video element for peer:', participant.id, stream.id);
                            }
                          }
                        }}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-32 h-32 rounded-full bg-purple-500 flex items-center justify-center text-5xl font-bold">
                        {participant.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="absolute bottom-4 left-4 bg-black/50 px-4 py-2 rounded-xl text-sm backdrop-blur-md">
                    <span className="font-sofia-medium">{participant.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="fixed bottom-4 left-4 z-50">
          <div className="relative group">
            <button
              onClick={() => setShowRoomInfo(!showRoomInfo)}
              className="p-4 rounded-2xl backdrop-blur-md bg-[#1E1E1E]/80 hover:bg-opacity-90 transition-all shadow-lg"
              title="Meeting Info"
            >
              <FaInfoCircle size={20} />
            </button>
            {showRoomInfo && (
              <div className="absolute bottom-full left-0 mb-4 bg-[#1E1E1E]/95 backdrop-blur-md rounded-lg p-4 shadow-lg w-80">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Meeting Info</h3>
                  <button
                    onClick={() => setShowRoomInfo(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    <FaTimes size={16} />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Meeting Code</p>
                    <div className="flex items-center justify-between bg-[#2A2A2A] p-3 rounded">
                      <code className="text-base font-mono text-white select-all tracking-wider">
                        {meetingCode}
                      </code>
                      <button
                        onClick={copyRoomCode}
                        className="text-blue-400 hover:text-blue-300 transition-colors ml-3 p-1 hover:bg-[#3A3A3A] rounded"
                        title="Copy meeting code"
                      >
                        <FaCopy size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">
                    <p>Share this code with others to join the meeting</p>
                    <p className="mt-2">People who have the meeting code can join anytime</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-6 transition-all duration-500 delay-300 ${
          isJoining ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
        }`}>
          <div className="relative group">
            <div className="flex items-center">
              <button
                onClick={toggleMute}
                className={`p-4 rounded-l-2xl backdrop-blur-md ${
                  isMuted 
                    ? 'bg-red-500/80' 
                    : 'bg-[#1E1E1E]/80'
                } hover:bg-opacity-90 transition-all shadow-lg`}
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <FaMicrophoneSlash size={20} /> : <FaMicrophone size={20} />}
              </button>
              <button
                onClick={toggleAudioDropdown}
                className={`h-full px-2 rounded-r-2xl backdrop-blur-md border-l border-gray-600/30 ${
                  isMuted 
                    ? 'bg-red-500/25' 
                    : 'bg-[#1E1E1E]/25'
                } hover:bg-opacity-90 transition-all`}
              >
                <div className={`transform transition-transform duration-200 ${showAudioDropdown ? 'rotate-180' : ''}`}>
                  <FaChevronUp size={12} />
                </div>
              </button>
            </div>
            {showAudioDropdown && (
              <div className="absolute bottom-full left-0 mb-2 w-64 bg-[#1E1E1E]/90 backdrop-blur-md rounded-xl overflow-hidden shadow-lg">
                <div className="p-2 border-b border-gray-700/50">
                  <h3 className="text-sm font-sofia-medium">Select microphone</h3>
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {audioDevices.map(device => (
                    <button
                      key={device.deviceId}
                      onClick={() => switchAudioDevice(device.deviceId)}
                      className={`w-full p-2 text-left hover:bg-gray-700/50 transition-colors ${
                        device.deviceId === selectedAudioDevice ? 'bg-blue-500/20' : ''
                      }`}
                    >
                      <div className="text-sm font-sofia-light">{device.label || 'Microphone'}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="relative group">
            <div className="flex items-center">
              <button
                onClick={toggleVideo}
                className={`p-4 rounded-l-2xl backdrop-blur-md ${
                  isVideoOff 
                    ? 'bg-red-500/80' 
                    : 'bg-[#1E1E1E]/80'
                } hover:bg-opacity-90 transition-all shadow-lg`}
                title={isVideoOff ? "Turn on camera" : "Turn off camera"}
              >
                {isVideoOff ? <FaVideoSlash size={20} /> : <FaVideo size={20} />}
              </button>
              <button
                onClick={toggleVideoDropdown}
                className={`h-full px-2 rounded-r-2xl backdrop-blur-md border-l border-gray-600/30 ${
                  isVideoOff 
                    ? 'bg-red-500/25' 
                    : 'bg-[#1E1E1E]/25'
                } hover:bg-opacity-90 transition-all`}
              >
                <div className={`transform transition-transform duration-200 ${showVideoDropdown ? 'rotate-180' : ''}`}>
                  <FaChevronUp size={12} />
                </div>
              </button>
            </div>
            {showVideoDropdown && (
              <div className="absolute bottom-full left-0 mb-2 w-64 bg-[#1E1E1E]/90 backdrop-blur-md rounded-xl overflow-hidden shadow-lg">
                <div className="p-2 border-b border-gray-700/50">
                  <h3 className="text-sm font-sofia-medium">Select camera</h3>
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {videoDevices.map(device => (
                    <button
                      key={device.deviceId}
                      onClick={() => switchVideoDevice(device.deviceId)}
                      className={`w-full p-2 text-left hover:bg-gray-700/50 transition-colors ${
                        device.deviceId === selectedVideoDevice ? 'bg-blue-500/20' : ''
                      }`}
                    >
                      <div className="text-sm font-sofia-light">{device.label || 'Camera'}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="relative group">
            <div className="flex items-center">
              <button
                onClick={isScreenSharing ? stopScreenShare : toggleScreenDropdown}
                className={`p-4 rounded-l-2xl backdrop-blur-md ${
                  isScreenSharing 
                    ? 'bg-blue-500/80' 
                    : 'bg-[#1E1E1E]/80'
                } hover:bg-opacity-90 transition-all shadow-lg`}
                title={isScreenSharing ? "Stop sharing" : "Share screen"}
              >
                {isScreenSharing ? <FaStop size={20} /> : <FaDesktop size={20} />}
              </button>
              <button
                onClick={toggleScreenDropdown}
                className={`h-full px-2 rounded-r-2xl backdrop-blur-md border-l border-gray-600/30 ${
                  isScreenSharing 
                    ? 'bg-blue-500/25' 
                    : 'bg-[#1E1E1E]/25'
                } hover:bg-opacity-90 transition-all`}
              >
                <div className={`transform transition-transform duration-200 ${showScreenDropdown ? 'rotate-180' : ''}`}>
                  <FaChevronUp size={12} />
                </div>
              </button>
            </div>
            {showScreenDropdown && (
              <div className="absolute bottom-full left-0 mb-2 w-80 bg-[#1E1E1E]/90 backdrop-blur-md rounded-xl overflow-hidden shadow-lg">
                <div className="p-3 border-b border-gray-700/50">
                  <h3 className="text-sm font-sofia-medium">Select what to share</h3>
                </div>
                <div className="p-3 space-y-3">
                  <div className="space-y-2">
                    <h4 className="text-xs text-gray-400 font-sofia-medium">Your entire screen</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {screenSources.map((source, index) => (
                        <button
                          key={source.id || index}
                          onClick={() => startScreenShare(source.id)}
                          className="p-3 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-colors group"
                        >
                          <div className="aspect-video bg-gray-900/50 rounded-md mb-2 flex items-center justify-center">
                            <FaDesktop size={24} className="text-gray-400 group-hover:text-white transition-colors" />
                          </div>
                          <div className="text-sm font-sofia-light truncate">
                            {source.label || `Screen ${index + 1}`}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-xs text-gray-400 font-sofia-medium">A window</h4>
                    <button
                      onClick={() => startScreenShare()}
                      className="w-full p-3 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-colors flex items-center gap-3"
                    >
                      <div className="w-10 h-10 rounded-md bg-gray-900/50 flex items-center justify-center">
                        <FaDesktop size={20} className="text-gray-400" />
                      </div>
                      <div className="text-sm font-sofia-light">
                        Choose a window to share
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className={`p-4 rounded-2xl backdrop-blur-md ${
              isChatOpen 
                ? 'bg-blue-500/80' 
                : 'bg-[#1E1E1E]/80'
            } hover:bg-opacity-90 transition-all shadow-lg`}
            title={isChatOpen ? "Close chat" : "Open chat"}
          >
            <FaComments size={20} />
          </button>
          
          <button
            onClick={exitMeeting}
            className="p-4 rounded-2xl bg-red-500/80 backdrop-blur-md hover:bg-opacity-90 transition-all shadow-lg"
            title="Leave meeting"
          >
            <FaSignOutAlt size={20} />
          </button>
        </div>

        <div 
          className={`fixed top-0 right-0 h-full w-96 bg-[#1E1E1E]/80 backdrop-blur-md rounded-l-2xl overflow-hidden flex flex-col transition-all duration-300 ease-in-out transform ${
            isChatOpen 
              ? 'translate-x-0 opacity-100' 
              : 'translate-x-full opacity-0'
          }`}
          style={{
            zIndex: 10,
            marginTop: '2rem',
            marginBottom: '3rem',
            height: 'calc(96vh - 5rem)',
            marginRight: '0.2rem'
          }}
        >
          <div className="p-6 border-b border-gray-700/50 flex justify-between items-center">
            <h3 className="font-sofia-medium">Meeting Chat</h3>
            <button 
              onClick={() => setIsChatOpen(false)}
              className="text-gray-400 hover:text-white"
            >
              <FaTimes />
            </button>
          </div>
          <div 
            ref={chatContainerRef}
            className="flex-1 p-6 overflow-y-auto space-y-4"
            style={{
              maxHeight: 'calc(100% - 120px)',
              overflowY: 'auto',
              overflowX: 'hidden'
            }}
          >
            {messages.map((message) => (
              <div key={message.id} className="space-y-1">
                <div className="flex items-start gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-sm flex-shrink-0">
                    {message.sender.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-sofia-medium text-sm truncate">{message.sender}</span>
                      <span className="text-xs text-gray-400">{message.timestamp}</span>
                    </div>
                    <p className="text-sm text-gray-300 break-words">{message.text}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-700/50">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-[#2A2A2A]/80 backdrop-blur-sm text-white rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-sofia-light"
              />
              <button
                type="submit"
                className="bg-blue-500/80 backdrop-blur-sm hover:bg-opacity-90 text-white rounded-xl px-4 py-2 text-sm transition-colors font-sofia-medium"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default WebRTCMeeting;