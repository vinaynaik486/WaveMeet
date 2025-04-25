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
import { 
  VideoCameraIcon, 
  VideoCameraSlashIcon, 
  MicrophoneIcon, 
  SpeakerXMarkIcon, 
  ComputerDesktopIcon, 
  PhoneXMarkIcon 
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

// Function to generate a random room ID
const generateRoomId = () => {
  const chars = 'abcdefghijkmnpqrstuvwxyz123456789';
  let code = '';
  
  // First part (3 characters)
  for (let i = 0; i < 3; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  code += '-';
  
  // Middle part (4 characters)
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  code += '-';
  
  // Last part (3 characters)
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
  const [remoteStream, setRemoteStream] = useState(null);
  const [screenStream, setScreenStream] = useState(null);
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
  const remoteVideoRef = useRef(null);
  const peerConnection = useRef(null);
  const localStream = useRef(null);
  const screenStreamRef = useRef(null);
  const chatContainerRef = useRef(null);
  const dataChannelRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const joinSoundRef = useRef(null);
  const exitSoundRef = useRef(null);
  const socketRef = useRef(null);

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
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;

    // Initialize Socket.IO connection with retry
    const connectSocket = () => {
      if (!isComponentMounted) return;

      socketRef.current = io('http://localhost:3001', {
        transports: ['websocket'],
        path: '/socket.io/',
        reconnection: true,
        reconnectionAttempts: maxReconnectAttempts,
        reconnectionDelay: 1000,
        forceNew: true,
        timeout: 10000,
        autoConnect: true
      });

      // Socket connection event handlers
      socketRef.current.on('connect', async () => {
        console.log('Socket connected');
        reconnectAttempts = 0; // Reset reconnect attempts on successful connection
        if (isComponentMounted) {
          // Initialize media first
          try {
            const stream = await initializeMedia();
            if (stream && isComponentMounted) {
              // Join room after successful media initialization
              socketRef.current.emit('join-room', {
                roomId: urlRoomId,
                userId: user.uid,
                userName: user.displayName || 'Anonymous'
              });
            }
          } catch (error) {
            console.error('Error initializing media:', error);
            toast.error('Failed to initialize media devices');
          }
        }
      });

      socketRef.current.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        reconnectAttempts++;
        if (reconnectAttempts >= maxReconnectAttempts) {
          toast.error('Failed to connect to server after multiple attempts');
        } else if (isComponentMounted) {
          toast.error('Failed to connect to server, retrying...');
        }
      });

      socketRef.current.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        if (reason === 'io server disconnect' && isComponentMounted) {
          // Server initiated disconnect, try to reconnect
          socketRef.current.connect();
        }
      });
    };

    // Initialize media and setup peer connection
    const initializeMedia = async () => {
      if (!isComponentMounted) return null;

      try {
        // Create audio context first
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        audioContextRef.current = audioContext;

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            aspectRatio: 16/9
          },
          audio: true
        });
        
        if (!isComponentMounted) {
          stream.getTracks().forEach(track => track.stop());
          return null;
        }

        localStream.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Set up audio analysis
        analyserRef.current = audioContext.createAnalyser();
        analyserRef.current.fftSize = 256;
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyserRef.current);
        
        analyzeAudio();

        // Setup peer connection
        const success = await setupPeerConnection(stream);
        if (!success || !isComponentMounted) {
          stream.getTracks().forEach(track => track.stop());
          return null;
        }

        return stream;
      } catch (error) {
        console.error('Error accessing media devices:', error);
        if (!isComponentMounted) return null;

        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          
          if (!isComponentMounted) {
            audioStream.getTracks().forEach(track => track.stop());
            return null;
          }

          localStream.current = audioStream;
          setIsVideoOff(true);
          
          // Set up audio analysis
          if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            audioContextRef.current = audioContext;
          }
          analyserRef.current = audioContext.createAnalyser();
          analyserRef.current.fftSize = 256;
          const source = audioContext.createMediaStreamSource(audioStream);
          source.connect(analyserRef.current);
          
          analyzeAudio();

          // Setup peer connection
          const success = await setupPeerConnection(audioStream);
          if (!success || !isComponentMounted) {
            audioStream.getTracks().forEach(track => track.stop());
            return null;
          }

          return audioStream;
        } catch (audioError) {
          console.error('Error accessing audio:', audioError);
          if (isComponentMounted) {
            toast.error('Failed to access media devices');
          }
          return null;
        }
      }
    };

    connectSocket();

    // Socket.IO event listeners
    socketRef.current.on('room-info', ({ roomId: serverRoomId, peers, iceServers }) => {
      if (!isComponentMounted) return;

      console.log('Received room info:', { serverRoomId, peers });
      setRoomId(serverRoomId);
      
      // Update participants list with unique IDs
      setParticipants(prevParticipants => {
        const newParticipants = peers.map(peer => ({
          id: peer.id,
          userId: peer.userId,
          name: peer.userName || `User ${peer.id.slice(0, 4)}`
        }));
        return [...newParticipants];
      });

      // Set host status
      if (peers.length === 0) {
        setIsHost(true);
      }

      // Store ICE servers for later use
      if (iceServers) {
        localStorage.setItem('iceServers', JSON.stringify(iceServers));
      }
    });

    socketRef.current.on('user-joined', async ({ peerId, userId, userName }) => {
      if (!isComponentMounted) return;

      console.log('User joined:', { peerId, userId, userName });
      setParticipants(prevParticipants => {
        // Check if participant already exists
        if (prevParticipants.some(p => p.id === peerId)) {
          return prevParticipants;
        }
        return [
          ...prevParticipants,
          { id: peerId, userId, name: userName || `User ${peerId.slice(0, 4)}` }
        ];
      });

      if (isHost && peerConnection.current) {
        console.log('Creating offer for new peer:', peerId);
        await createAndSendOffer(peerId);
      }
    });

    socketRef.current.on('user-left', ({ peerId }) => {
      if (!isComponentMounted) return;

      console.log('User left:', peerId);
      setParticipants(prevParticipants => 
        prevParticipants.filter(p => p.id !== peerId)
      );

      // Recreate data channel if needed
      if (peerConnection.current?.connectionState === 'connected') {
        createDataChannel();
      }
    });

    socketRef.current.on('signal', async ({ from, signal }) => {
      if (!isComponentMounted) return;

      try {
        if (!peerConnection.current) {
          console.error('Peer connection not initialized');
          return;
        }

        console.log('Received signal:', signal.type, 'from:', from);

        if (signal.type === 'offer') {
          if (peerConnection.current.signalingState !== 'stable') {
            console.log('Connection not stable, waiting...');
            return;
          }
          await peerConnection.current.setRemoteDescription(new RTCSessionDescription(signal));
          const answer = await peerConnection.current.createAnswer();
          await peerConnection.current.setLocalDescription(answer);
          socketRef.current.emit('signal', {
            to: from,
            signal: answer,
            roomId: urlRoomId
          });
          console.log('Sent answer to peer:', from);
          // Create data channel after sending answer
          setTimeout(() => {
            if (peerConnection.current?.connectionState === 'connected' && !dataChannelRef.current) {
              createDataChannel();
            }
          }, 1000);
        } else if (signal.type === 'answer') {
          if (peerConnection.current.signalingState !== 'have-local-offer') {
            console.log('Connection not in have-local-offer state');
            return;
          }
          await peerConnection.current.setRemoteDescription(new RTCSessionDescription(signal));
          console.log('Set remote description from answer');
          // Create data channel after receiving answer
          setTimeout(() => {
            if (peerConnection.current?.connectionState === 'connected' && !dataChannelRef.current) {
              createDataChannel();
            }
          }, 1000);
        }
      } catch (error) {
        console.error('Error handling signal:', error);
        if (isComponentMounted) {
          toast.error('Failed to establish connection');
        }
      }
    });

    socketRef.current.on('ice-candidate', async ({ from, candidate }) => {
      if (!isComponentMounted) return;

      try {
        if (peerConnection.current && peerConnection.current.remoteDescription) {
          await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch (error) {
        console.error('Error adding ICE candidate:', error);
      }
    });

    return () => {
      isComponentMounted = false;

      // Clean up socket listeners
      if (socketRef.current) {
        socketRef.current.off('room-info');
        socketRef.current.off('user-joined');
        socketRef.current.off('user-left');
        socketRef.current.off('signal');
        socketRef.current.off('ice-candidate');
        socketRef.current.disconnect();
      }

      // Clean up audio analysis
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContext) {
        audioContext.close();
      }

      // Clean up media streams
      if (localStream.current) {
        localStream.current.getTracks().forEach(track => track.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
      }

      // Clean up peer connection
      if (peerConnection.current) {
        peerConnection.current.close();
      }
    };
  }, [user, urlRoomId, navigate, isHost]);

  // Setup peer connection
  const setupPeerConnection = async (stream) => {
    try {
      // Get ICE servers from localStorage or use defaults
      const storedIceServers = localStorage.getItem('iceServers');
      const iceServers = storedIceServers ? JSON.parse(storedIceServers) : [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ];

      const configuration = {
        iceServers,
        iceCandidatePoolSize: 10,
        iceTransportPolicy: 'all',
        bundlePolicy: 'max-bundle',
        rtcpMuxPolicy: 'require'
      };

      // Close existing peer connection if any
      if (peerConnection.current) {
        peerConnection.current.close();
        peerConnection.current = null;
      }

      console.log('Creating new peer connection with configuration:', configuration);
      peerConnection.current = new RTCPeerConnection(configuration);

      // Add local stream tracks
      stream.getTracks().forEach(track => {
        peerConnection.current.addTrack(track, stream);
      });

      // Handle incoming tracks
      peerConnection.current.ontrack = (event) => {
        console.log('Received remote track:', event.track.kind);
        setRemoteStream(event.streams[0]);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      // Handle ICE candidates
      peerConnection.current.onicecandidate = (event) => {
        if (event.candidate && socketRef.current?.connected) {
          socketRef.current.emit('ice-candidate', {
            to: roomId,
            candidate: event.candidate,
            roomId: urlRoomId
          });
        }
      };

      // Handle connection state changes
      peerConnection.current.onconnectionstatechange = () => {
        console.log('Connection state:', peerConnection.current?.connectionState);
        if (peerConnection.current?.connectionState === 'connected') {
          console.log('Peer connection established');
          // Create data channel for both host and non-host
          setTimeout(() => createDataChannel(), 1000);
        } else if (peerConnection.current?.connectionState === 'disconnected' || 
                  peerConnection.current?.connectionState === 'failed') {
          console.log('Connection lost, attempting to reconnect...');
          // Attempt to recreate peer connection
          setTimeout(() => setupPeerConnection(stream), 2000);
        }
      };

      // Handle data channel creation
      peerConnection.current.ondatachannel = (event) => {
        console.log('Received data channel from peer');
        setupDataChannel(event.channel);
      };

      // Create data channel immediately for host
      if (isHost) {
        console.log('Creating data channel as host');
        setTimeout(() => createDataChannel(), 1000);
      }

      return true;
    } catch (error) {
      console.error('Error setting up peer connection:', error);
      toast.error('Failed to establish connection');
      return false;
    }
  };

  // Function to create data channel
  const createDataChannel = () => {
    if (!peerConnection.current) {
      console.log('Cannot create data channel: peer connection not initialized');
      return;
    }

    // Check if we already have an open data channel
    if (dataChannelRef.current && dataChannelRef.current.readyState === 'open') {
      console.log('Data channel already open, skipping creation');
      return;
    }

    // Close existing data channel if any
    if (dataChannelRef.current) {
      console.log('Closing existing data channel');
      dataChannelRef.current.close();
      dataChannelRef.current = null;
    }

    console.log('Creating data channel');
    try {
      const dataChannel = peerConnection.current.createDataChannel('chat', {
        ordered: true,
        maxRetransmits: 3,
        protocol: 'json'
      });
      setupDataChannel(dataChannel);
    } catch (error) {
      console.error('Error creating data channel:', error);
      // Only try again if the error is not "already exists"
      if (!error.message.includes('already exists')) {
        setTimeout(() => createDataChannel(), 1000);
      }
    }
  };

  // Function to setup data channel
  const setupDataChannel = (channel) => {
    console.log('Setting up data channel with state:', channel.readyState);
    dataChannelRef.current = channel;

    channel.onopen = () => {
      console.log('Data channel opened with state:', channel.readyState);
      // Send a test message to verify connection
      try {
        const testMessage = JSON.stringify({
          type: 'system',
          message: 'Data channel connected',
          timestamp: new Date().toISOString()
        });
        console.log('Sending test message:', testMessage);
        channel.send(testMessage);
      } catch (error) {
        console.error('Error sending test message:', error);
      }

      // Send any queued messages
      if (channel.messageQueue && channel.messageQueue.length > 0) {
        console.log('Sending queued messages:', channel.messageQueue.length);
        while (channel.messageQueue.length > 0) {
          const message = channel.messageQueue.shift();
          try {
            console.log('Sending queued message:', message);
            channel.send(message);
          } catch (error) {
            console.error('Error sending queued message:', error);
            // Put the message back in the queue
            channel.messageQueue.unshift(message);
            break;
          }
        }
      }
    };

    channel.onclose = () => {
      console.log('Data channel closed with state:', channel.readyState);
      // Only clear the reference if it's the same channel
      if (dataChannelRef.current === channel) {
        dataChannelRef.current = null;
        // Only attempt to recreate if the peer connection is still connected
        if (peerConnection.current?.connectionState === 'connected') {
          console.log('Attempting to recreate data channel');
          // Add a delay to prevent rapid recreation attempts
          setTimeout(() => {
            if (peerConnection.current?.connectionState === 'connected' && !dataChannelRef.current) {
              createDataChannel();
            }
          }, 2000);
        }
      }
    };

    channel.onerror = (error) => {
      console.error('Data channel error:', error);
      // Only attempt to recreate if the peer connection is still connected
      if (peerConnection.current?.connectionState === 'connected') {
        setTimeout(() => {
          if (peerConnection.current?.connectionState === 'connected' && !dataChannelRef.current) {
            createDataChannel();
          }
        }, 2000);
      }
    };

    channel.onmessage = (event) => {
      console.log('Received message on data channel:', event.data);
      try {
        const data = JSON.parse(event.data);
        console.log('Parsed message data:', data);
        
        if (data.type === 'chat') {
          console.log('Processing chat message:', data.message);
          setMessages(prevMessages => {
            const newMessages = [...prevMessages, data.message];
            console.log('Updated messages:', newMessages);
            return newMessages;
          });
          // Scroll to bottom of chat
          if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
          }
        } else if (data.type === 'system') {
          console.log('System message:', data.message);
        }
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    };

    // Initialize message queue
    channel.messageQueue = [];
  };

  // Function to create and send offer
  const createAndSendOffer = async (peerId) => {
    try {
      if (!peerConnection.current) {
        console.error('Peer connection not initialized');
        return;
      }

      console.log('Creating offer for peer:', peerId);
      const offer = await peerConnection.current.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });
      await peerConnection.current.setLocalDescription(offer);
      socketRef.current.emit('signal', {
        to: peerId,
        signal: offer,
        roomId: urlRoomId
      });
      console.log('Sent offer to peer:', peerId);
    } catch (error) {
      console.error('Error creating offer:', error);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    // Check if peer connection is ready
    if (!peerConnection.current) {
      console.log('Cannot send message: peer connection not initialized');
      toast.error('Connection not ready. Please wait...');
      return;
    }

    if (peerConnection.current.connectionState !== 'connected') {
      console.log('Cannot send message: peer connection not connected');
      toast.error('Connection not established. Please wait...');
      return;
    }

    const message = {
      id: Date.now(),
      text: newMessage,
      sender: user?.displayName || 'You',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    console.log('Preparing to send message:', message);

    // Add message to local state
    setMessages(prevMessages => [...prevMessages, message]);
    
    const messageString = JSON.stringify({
      type: 'chat',
      message: message
    });

    console.log('Message string to send:', messageString);

    // Try to send through data channel
    if (dataChannelRef.current) {
      console.log('Data channel state:', dataChannelRef.current.readyState);
      if (dataChannelRef.current.readyState === 'open') {
        console.log('Sending message through data channel');
        try {
          dataChannelRef.current.send(messageString);
          console.log('Message sent successfully');
        } catch (error) {
          console.error('Error sending message:', error);
          // Queue message if send fails
          if (!dataChannelRef.current.messageQueue) {
            dataChannelRef.current.messageQueue = [];
          }
          dataChannelRef.current.messageQueue.push(messageString);
          console.log('Message queued due to send error');
        }
      } else {
        console.log('Data channel not open, queueing message');
        if (!dataChannelRef.current.messageQueue) {
          dataChannelRef.current.messageQueue = [];
        }
        dataChannelRef.current.messageQueue.push(messageString);
        console.log('Message queued, queue length:', dataChannelRef.current.messageQueue.length);
        // Attempt to recreate data channel if it's not open
        if (peerConnection.current?.connectionState === 'connected') {
          console.log('Attempting to recreate data channel for queued message');
          setTimeout(() => createDataChannel(), 1000);
        }
      }
    } else {
      console.log('Creating data channel for message');
      createDataChannel();
      // Queue the message
      if (!dataChannelRef.current) {
        dataChannelRef.current = { messageQueue: [messageString] };
      } else {
        dataChannelRef.current.messageQueue = [messageString];
      }
      console.log('Message queued for new data channel');
    }

    setNewMessage('');
  };

  const handleDataChannelMessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'host_transfer') {
      setIsHost(data.isHost);
    }
  };

  const transferHost = () => {
    if (!isHost || participants.length <= 1) return;

    const currentHostIndex = participants.findIndex(p => p.id === user.uid);
    const nextHostIndex = (currentHostIndex + 1) % participants.length;
    const nextHost = participants[nextHostIndex];

    localStorage.setItem(`room_${urlRoomId}_host`, nextHost.id);

    if (dataChannelRef.current?.readyState === 'open') {
      dataChannelRef.current.send(JSON.stringify({
        type: 'host_transfer',
        newHostId: nextHost.id,
        isHost: false
      }));
    }
  };

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const cleanupResources = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    if (localStream.current) {
      localStream.current.getTracks().forEach(track => {
        track.stop();
      });
      localStream.current = null;
    }

    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      screenStreamRef.current = null;
    }

    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    const existingParticipants = JSON.parse(localStorage.getItem(`room_${urlRoomId}_participants`) || '[]');
    const updatedParticipants = existingParticipants.filter(p => p.id !== user.uid);
    localStorage.setItem(`room_${urlRoomId}_participants`, JSON.stringify(updatedParticipants));

    if (isHost) {
      transferHost();
    }
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
        // First, ensure any existing video tracks are properly stopped
        if (localStream.current) {
          const existingVideoTrack = localStream.current.getVideoTracks()[0];
          if (existingVideoTrack) {
            existingVideoTrack.stop();
          }
        }

        // Create new stream with video
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            aspectRatio: 16/9
          },
          audio: false
        });

        // Get the video track from the new stream
        const videoTrack = newStream.getVideoTracks()[0];
        
        // Add the video track to the existing stream
        if (localStream.current) {
          const audioTrack = localStream.current.getAudioTracks()[0];
          localStream.current = new MediaStream([videoTrack, audioTrack]);
        } else {
          localStream.current = newStream;
        }

        // Update the video element
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream.current;
        }

        // Update peer connection
        if (peerConnection.current) {
          const sender = peerConnection.current.getSenders().find(s => s.track?.kind === 'video');
          if (sender) {
            await sender.replaceTrack(videoTrack);
          } else {
            peerConnection.current.addTrack(videoTrack, localStream.current);
          }
        }

        setIsVideoOff(false);
      } else {
        // Turning video off
        if (localStream.current) {
          const videoTrack = localStream.current.getVideoTracks()[0];
          if (videoTrack) {
            videoTrack.stop();
            localStream.current.removeTrack(videoTrack);
          }

          // Update peer connection
          if (peerConnection.current) {
            const sender = peerConnection.current.getSenders().find(s => s.track?.kind === 'video');
            if (sender) {
              await sender.replaceTrack(null);
            }
          }
        }

        setIsVideoOff(true);
      }
    } catch (error) {
      console.error('Error toggling video:', error);
      if (error.name === 'NotAllowedError') {
        toast.error('Camera access was denied');
      }
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
      
      if ('getScreenDetails' in navigator) {
        const screens = await navigator.getScreenDetails();
        setScreenSources(screens.screens || []);
      }
    } catch (error) {
      console.error('Error getting screen sources:', error);
      toast.error('Failed to get screen sources');
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
          logicalSurface: true,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      };

      if (sourceId) {
        constraints.video.deviceId = sourceId;
      }

      const screenStream = await navigator.mediaDevices.getDisplayMedia(constraints);
      
      screenStreamRef.current = screenStream;
      setScreenStream(screenStream);
      setIsScreenSharing(true);
      setShowScreenDropdown(false);

      const videoTrack = screenStream.getVideoTracks()[0];
      const sender = peerConnection.current?.getSenders().find(s => s.track?.kind === 'video');
      if (sender) {
        await sender.replaceTrack(videoTrack);
      }

      videoTrack.onended = () => {
        stopScreenShare();
      };
    } catch (error) {
      console.error('Error sharing screen:', error);
      toast.error('Failed to start screen sharing');
    }
  };

  const stopScreenShare = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      setScreenStream(null);
      setIsScreenSharing(false);

      if (localStream.current) {
        const videoTrack = localStream.current.getVideoTracks()[0];
        const sender = peerConnection.current?.getSenders().find(s => s.track?.kind === 'video');
        if (sender && videoTrack) {
          sender.replaceTrack(videoTrack).catch(error => {
            console.error('Error restoring video track:', error);
          });
        }
      }
    }
  };

  const exitMeeting = () => {
    try {
      playExitSound();
      
      setTimeout(() => {
        cleanupResources();
        
        localStorage.removeItem(`room_${urlRoomId}_host`);
        
        navigate('/', { replace: true });
      }, 300);
    } catch (error) {
      console.error('Error during exit:', error);
      navigate('/', { replace: true });
    }
  };

  // Get available media devices
  useEffect(() => {
    const getDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter(device => device.kind === 'videoinput');
        const audioInputs = devices.filter(device => device.kind === 'audioinput');
        
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
        toast.error('Failed to get media devices');
      }
    };
    
    getDevices();
  }, []);

  // Switch video device
  const switchVideoDevice = async (deviceId) => {
    try {
      if (localStream.current) {
        const videoTrack = localStream.current.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.stop();
        }
      }
      
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: { exact: deviceId },
          width: { ideal: 1280 },
          height: { ideal: 720 },
          aspectRatio: 16/9
        },
        audio: false
      });
      
      const newVideoTrack = newStream.getVideoTracks()[0];
      
      if (localStream.current) {
        const audioTrack = localStream.current.getAudioTracks()[0];
        localStream.current = new MediaStream([newVideoTrack, audioTrack]);
      } else {
        localStream.current = newStream;
      }
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream.current;
      }
      
      if (peerConnection.current) {
        const sender = peerConnection.current.getSenders().find(s => s.track?.kind === 'video');
        if (sender) {
          await sender.replaceTrack(newVideoTrack);
        } else {
          peerConnection.current.addTrack(newVideoTrack, localStream.current);
        }
      }
      
      setSelectedVideoDevice(deviceId);
      setShowVideoDropdown(false);
    } catch (error) {
      console.error('Error switching video device:', error);
      toast.error('Failed to switch camera');
    }
  };

  // Switch audio device
  const switchAudioDevice = async (deviceId) => {
    try {
      if (localStream.current) {
        const audioTrack = localStream.current.getAudioTracks()[0];
        if (audioTrack) {
          audioTrack.stop();
        }
      }
      
      const newStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: { exact: deviceId }
        },
        video: false
      });
      
      const newAudioTrack = newStream.getAudioTracks()[0];
      
      if (localStream.current) {
        const videoTrack = localStream.current.getVideoTracks()[0];
        localStream.current = new MediaStream([videoTrack, newAudioTrack]);
      } else {
        localStream.current = newStream;
      }
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream.current;
      }
      
      if (peerConnection.current) {
        const sender = peerConnection.current.getSenders().find(s => s.track?.kind === 'audio');
        if (sender) {
          await sender.replaceTrack(newAudioTrack);
        } else {
          peerConnection.current.addTrack(newAudioTrack, localStream.current);
        }
      }
      
      setSelectedAudioDevice(deviceId);
      setShowAudioDropdown(false);
    } catch (error) {
      console.error('Error switching audio device:', error);
      toast.error('Failed to switch microphone');
    }
  };

  const toggleAudioDropdown = () => {
    setShowAudioDropdown(!showAudioDropdown);
    setShowVideoDropdown(false);
    setShowScreenDropdown(false);
  };

  const toggleVideoDropdown = () => {
    setShowVideoDropdown(!showVideoDropdown);
    setShowAudioDropdown(false);
    setShowScreenDropdown(false);
  };

  // Update grid layout when participants change
  useEffect(() => {
    const updateGridLayout = () => {
      const totalParticipants = participants.length + 1; // +1 for local user
      if (totalParticipants <= 1) {
        setGridLayout('1x1');
      } else if (totalParticipants <= 4) {
        setGridLayout('2x2');
      } else if (totalParticipants <= 9) {
        setGridLayout('3x3');
      }
    };

    updateGridLayout();
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
    toast.success('Meeting code copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      <div className="h-screen flex flex-col">
        {/* Main Content Area */}
        <div className={`flex-1 transition-all duration-300 ${isChatOpen ? 'md:w-3/4' : 'w-full'}`} 
             style={{ 
               height: 'calc(98vh - 5rem)',
               marginTop: '0.5rem'
             }}>
          <div className="h-full p-8 pb-20">
            {/* Video Grid Container */}
            <div className={`grid ${getGridClassName()} h-full max-w-7xl mx-auto`}>
              {/* Local Video */}
              <div className={`relative bg-[#1E1E1E] rounded-2xl overflow-hidden transform transition-all duration-500 shadow-[0_0_75px_-30px_rgba(255,255,255,0.25)] ${
                isJoining ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
              }`}>
                {!isVideoOff ? (
                  <div className="w-full h-full flex items-center justify-center bg-[#1E1E1E]">
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className={`w-full h-full object-cover scale-x-[-1] ${isScreenSharing ? 'hidden' : ''}`}
                    />
                  </div>
                ) : (
                  // Avatar display when video is off
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
                {/* Participant Info */}
                <div className="absolute bottom-4 left-4 bg-black/50 px-4 py-2 rounded-xl text-sm backdrop-blur-md flex items-center gap-3">
                  <span className="font-sofia-medium">{user?.displayName || 'You'}</span>
                  {isHost && <span className="text-blue-400 font-sofia-light">(Host)</span>}
                </div>
              </div>

              {/* Remote Videos */}
              {participants.filter(participant => participant.id !== user?.uid).map((participant) => (
                <div
                  key={participant.id}
                  className="relative bg-[#1E1E1E] rounded-2xl overflow-hidden"
                >
                  <div className="w-full h-full flex items-center justify-center bg-[#1E1E1E]">
                    {remoteStream ? (
                      <video
                        ref={remoteVideoRef}
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

        {/* Room Info Button - Bottom Left */}
        <div className="fixed bottom-4 left-4 z-50">
          <div className="relative group">
            <button
              onClick={() => setShowRoomInfo(!showRoomInfo)}
              className="p-4 rounded-2xl backdrop-blur-md bg-[#1E1E1E]/80 hover:bg-opacity-90 transition-all shadow-lg"
              title="Meeting Info"
            >
              <FaInfoCircle size={20} />
            </button>
            {/* Room Info Modal */}
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

        {/* Controls with Glassmorphism */}
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

        {/* Chat Sidebar with Animation */}
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