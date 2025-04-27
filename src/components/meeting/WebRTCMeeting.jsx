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
  const pendingMessages = useRef({});
  const onTrackCounts = useRef({});

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

    // Initialize Socket.IO connection
    socketRef.current = io('http://localhost:3001', {
      transports: ['websocket', 'polling'],
      path: '/socket.io/',
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 20000
    });

    // Initialize media
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

        // Attempt audio-only fallback
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

    // Socket event handlers
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

      // Setup peer connections for all existing peers
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
        return newStreams;
      });
      if (remoteVideoRefs.current[peerId]) {
        remoteVideoRefs.current[peerId].srcObject = null;
        delete remoteVideoRefs.current[peerId];
      }
      assignedStreams.current.delete(peerId);
      delete pendingMessages.current[peerId];
      delete onTrackCounts.current[peerId];
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

          // Apply any queued ICE candidates
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

            // Apply any queued ICE candidates
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

        if (pc.remoteDescription && pc.remoteDescription.type && pc.localDescription && pc.localDescription.type) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
          console.log('Added ICE candidate from:', from, candidate);
        } else {
          console.log('Descriptions not fully set for peer:', from, 'Queuing candidate', {
            remoteDescription: !!pc.remoteDescription,
            localDescription: !!pc.localDescription
          });
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
      pendingMessages.current = {};
      onTrackCounts.current = {};
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
      pc.pendingCandidates = []; // Initialize pending candidates array
      peerConnections.current[peerId] = pc;

      // Add local stream tracks
      if (stream) {
        stream.getTracks().forEach(track => {
          console.log('Adding track to peer:', peerId, track.kind, track.id);
          pc.addTrack(track, stream);
        });
        console.log('Current senders for peer:', peerId, pc.getSenders().map(s => `${s.track?.kind}: ${s.track?.id}`));
      }

      // Handle incoming tracks
      pc.ontrack = (event) => {
        const stream = event.streams[0];
        if (!stream) {
          console.warn('No stream received for track:', event.track);
          return;
        }
        const streamId = stream.id;
        const trackKey = `${peerId}:${streamId}`;
        onTrackCounts.current[trackKey] = (onTrackCounts.current[trackKey] || 0) + 1;
        
        // Log stream and track details
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
          onTrackCount: onTrackCounts.current[trackKey],
          timestamp: new Date().toISOString()
        });

        // Check if stream is already assigned
        if (assignedStreams.current.has(trackKey)) {
          console.log('Stream already assigned for peer:', peerId, 'Stream ID:', streamId, 'Count:', onTrackCounts.current[trackKey]);
          return;
        }

        // Verify stream has active tracks
        const tracks = stream.getTracks();
        if (tracks.length === 0) {
          console.warn('Stream has no tracks:', peerId, streamId);
          return;
        }
        console.log('Stream tracks:', tracks.map(t => ({ id: t.id, kind: t.kind, enabled: t.enabled, readyState: t.readyState })));

        assignedStreams.current.add(trackKey);
        
        // Update state with debounce
        let debounceTimeout;
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(() => {
          setRemoteStreams(prev => {
            if (prev[peerId] && prev[peerId].id === streamId) {
              console.log('Stream already in state for peer:', peerId);
              return prev;
            }
            const newStreams = { ...prev, [peerId]: stream };
            console.log('Updated remote streams:', Object.keys(newStreams));
            return newStreams;
          });
        }, 100);

        // Assign stream to video element
        if (remoteVideoRefs.current[peerId]) {
          remoteVideoRefs.current[peerId].srcObject = stream;
          console.log('Assigned remote stream to video element for:', peerId, streamId, 'at:', new Date().toISOString());
          remoteVideoRefs.current[peerId].play().catch(error => {
            console.error('Error playing video for peer:', peerId, error);
          });
        } else {
          console.warn('No video ref for peer:', peerId);
        }
      };

      // Handle ICE candidates
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

      // Handle connection state changes
      pc.onconnectionstatechange = async () => {
        console.log('Peer:', peerId, 'Connection state:', pc.connectionState, 'ICE state:', pc.iceConnectionState, 'at:', new Date().toISOString());
        if (pc.connectionState === 'connected') {
          // Create or recreate data channel
          if (!dataChannels.current[peerId] || dataChannels.current[peerId].readyState !== 'open') {
            console.log('Creating data channel for peer:', peerId);
            const dataChannel = pc.createDataChannel('chat', {
              ordered: true,
              maxRetransmits: 3
            });
            setupDataChannel(peerId, dataChannel);
            // Send any pending messages
            if (pendingMessages.current[peerId]?.length > 0) {
              console.log('Sending queued messages for peer:', peerId, pendingMessages.current[peerId].length);
              pendingMessages.current[peerId].forEach(msg => {
                if (dataChannel.readyState === 'open') {
                  dataChannel.send(msg);
                }
              });
              pendingMessages.current[peerId] = [];
            }
          }
        } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
          console.warn('Connection failed/disconnected for peer:', peerId, 'Restarting PC');
          pc.close();
          delete peerConnections.current[peerId];
          if (dataChannels.current[peerId]) {
            dataChannels.current[peerId].close();
            delete dataChannels.current[peerId];
          }
          assignedStreams.current.delete(`${peerId}:${remoteStreams[peerId]?.id}`);
          await setupPeerConnection(peerId, localStream.current);
          await createAndSendOffer(peerId);
        }
      };

      // Handle negotiation needed
      pc.onnegotiationneeded = async () => {
        console.log('Negotiation needed for peer:', peerId);
        await createAndSendOffer(peerId);
      };

      // Handle incoming data channel
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

  // Function to setup data channel
  const setupDataChannel = (peerId, channel) => {
    if (dataChannels.current[peerId]) {
      console.log('Closing existing data channel for peer:', peerId);
      dataChannels.current[peerId].close();
    }
    dataChannels.current[peerId] = channel;
    console.log('Setup data channel for peer:', peerId, 'State:', channel.readyState);

    channel.onopen = () => {
      console.log('Data channel opened for peer:', peerId, 'at:', new Date().toISOString());
      const testMessage = JSON.stringify({
        type: 'system',
        message: `Data channel connected to ${peerId}`,
        timestamp: new Date().toISOString()
      });
      if (channel.readyState === 'open') {
        channel.send(testMessage);
        console.log('Sent test message to peer:', peerId);
        // Send any pending messages
        if (pendingMessages.current[peerId]?.length > 0) {
          console.log('Sending queued messages for peer:', peerId, pendingMessages.current[peerId].length);
          pendingMessages.current[peerId].forEach(msg => {
            channel.send(msg);
          });
          pendingMessages.current[peerId] = [];
        }
      }
    };

    channel.onclose = () => {
      console.log('Data channel closed for peer:', peerId, 'at:', new Date().toISOString());
      delete dataChannels.current[peerId];
    };

    channel.onerror = (error) => {
      console.error('Data channel error for peer:', peerId, error, 'at:', new Date().toISOString());
    };

    channel.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Received data channel message from:', peerId, data, 'at:', new Date().toISOString());
        if (data.type === 'chat') {
          setMessages(prevMessages => [...prevMessages, data.message]);
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

  // Function to create and send offer
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

  // Utility to try sending a message, queuing if channel not open
  const trySendMessage = (peerId, message) => {
    const channel = dataChannels.current[peerId];
    if (channel && channel.readyState === 'open') {
      channel.send(message);
      console.log('Sent message to peer:', peerId, message);
    } else {
      console.warn('Data channel not open for peer:', peerId, 'State:', channel?.readyState);
      pendingMessages.current[peerId] = pendingMessages.current[peerId] || [];
      pendingMessages.current[peerId].push(message);
      console.log('Queued message for peer:', peerId, 'Queue length:', pendingMessages.current[peerId].length);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const message = {
      id: Date.now(),
      text: newMessage,
      sender: user?.displayName || 'You',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prevMessages => [...prevMessages, message]);
    
    const messageString = JSON.stringify({
      type: 'chat',
      message: message
    });

    Object.entries(dataChannels.current).forEach(([peerId]) => {
      trySendMessage(peerId, messageString);
    });

    setNewMessage('');
  };

  const toggleMute = () => {
    if (localStream.current) {
      const audioTrack = localStream.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = async () => {
    try {
      if (isVideoOff) {
        // Turn video on
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            aspectRatio: 16/9,
            deviceId: selectedVideoDevice ? { exact: selectedVideoDevice } : undefined
          },
          audio: false
        });

        const videoTrack = newStream.getVideoTracks()[0];
        
        if (localStream.current) {
          const audioTrack = localStream.current.getAudioTracks()[0];
          if (localStream.current.getVideoTracks()[0]) {
            localStream.current.removeTrack(localStream.current.getVideoTracks()[0]);
          }
          localStream.current.addTrack(videoTrack);
        } else {
          localStream.current = newStream;
        }

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream.current;
          console.log('Updated local video stream');
        }

        // Update all peer connections
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
      } else {
        // Turn video off
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
    pendingMessages.current = {};
    onTrackCounts.current = {};
  };

  // Switch video device
  const switchVideoDevice = async (deviceId) => {
    try {
      console.log('Switching video device to:', deviceId);
      
      // Stop existing video track
      if (localStream.current) {
        const videoTrack = localStream.current.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.stop();
          localStream.current.removeTrack(videoTrack);
        }
      }
      
      // Request new video stream
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
      
      // Update local stream
      if (localStream.current) {
        const audioTrack = localStream.current.getAudioTracks()[0];
        localStream.current = new MediaStream([newVideoTrack, ...(audioTrack ? [audioTrack] : [])]);
      } else {
        localStream.current = newStream;
      }
      
      // Update local video element
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream.current;
        console.log('Switched local video device to:', deviceId, 'Stream ID:', localStream.current.id);
        localVideoRef.current.play().catch(error => {
          console.error('Error playing local video:', error);
        });
      }
      
      
      // Update all peer connections
      for (const [peerId, pc] of Object.entries(peerConnections.current)) {
        const sender = pc.getSenders().find(s => s.track?.kind === 'video');
        if (sender) {
          await sender.replaceTrack(newVideoTrack);
          console.log('Replaced video track for peer:', peerId, 'Track ID:', newVideoTrack.id);
        } else {
          pc.addTrack(newVideoTrack, localStream.current);
          console.log('Added new video track for peer:', peerId, 'Track ID:', newVideoTrack.id);
        }
        // Force renegotiation
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

  // Switch audio device
  const switchAudioDevice = async (deviceId) => {
    try {
      console.log('Switching audio device to:', deviceId);
      
      // Stop existing audio track
      if (localStream.current) {
        const audioTrack = localStream.current.getAudioTracks()[0];
        if (audioTrack) {
          audioTrack.stop();
          localStream.current.removeTrack(audioTrack);
        }
      }
      
      // Request new audio stream
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
      
      // Update local stream
      if (localStream.current) {
        const videoTrack = localStream.current.getVideoTracks()[0];
        localStream.current = new MediaStream([...(videoTrack ? [videoTrack] : []), newAudioTrack]);
      } else {
        localStream.current = newStream;
      }
      
      // Update local video element (for audio context)
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream.current;
        console.log('Switched local audio device to:', deviceId, 'Stream ID:', localStream.current.id);
      }
      
      // Update audio analyzer
      if (audioContextRef.current && analyserRef.current) {
        const source = audioContextRef.current.createMediaStreamSource(localStream.current);
        source.connect(analyserRef.current);
        console.log('Updated audio analyzer with new stream');
      }
      
      // Update all peer connections
      for (const [peerId, pc] of Object.entries(peerConnections.current)) {
        const sender = pc.getSenders().find(s => s.track?.kind === 'audio');
        if (sender) {
          await sender.replaceTrack(newAudioTrack);
          console.log('Replaced audio track for peer:', peerId, 'Track ID:', newAudioTrack.id);
        } else {
          pc.addTrack(newAudioTrack, localStream.current);
          console.log('Added new audio track for peer:', peerId, 'Track ID:', newAudioTrack.id);
        }
        // Force renegotiation
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

  // Update grid layout
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
  }, [participants, gridLayout]);

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

  return {
    localVideoRef,
    remoteVideoRefs,
    participants,
    isMuted,
    isVideoOff,
    isScreenSharing,
    isJoining,
    roomId,
    toggleMute,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    exitMeeting
  };
}

export default WebRTCMeeting;