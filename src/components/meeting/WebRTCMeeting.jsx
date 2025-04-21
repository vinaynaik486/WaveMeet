import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
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
  FaCopy
} from 'react-icons/fa';
import { 
  VideoCameraIcon, 
  VideoCameraSlashIcon, 
  MicrophoneIcon, 
  SpeakerXMarkIcon, 
  ComputerDesktopIcon, 
  PhoneXMarkIcon 
} from '@heroicons/react/24/outline';

function WebRTCMeeting({ roomId }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
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
  const [gridLayout, setGridLayout] = useState('1x1'); // '1x1', '2x2', '3x3' etc.
  
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

  // Initialize audio elements
  useEffect(() => {
    // Create audio elements
    const joinSound = new Audio('/sounds/entry.mp3');
    const exitSound = new Audio('/sounds/exit.mp3');
    
    // Set volumes
    joinSound.volume = 1;
    exitSound.volume = 1;
    
    // Preload the sounds
    joinSound.load();
    exitSound.load();
    
    // Store references
    joinSoundRef.current = joinSound;
    exitSoundRef.current = exitSound;

    // Play join sound after animation completes
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

  // Function to play join sound
  const playJoinSound = () => {
    if (joinSoundRef.current) {
      joinSoundRef.current.currentTime = 0;
      joinSoundRef.current.play()
        .catch(error => console.error('Error playing join sound:', error));
    }
  };

  // Function to play exit sound
  const playExitSound = () => {
    if (exitSoundRef.current) {
      exitSoundRef.current.currentTime = 0;
      exitSoundRef.current.play()
        .catch(error => console.error('Error playing exit sound:', error));
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    // Simulate joining animation
    const animationTimer = setTimeout(() => {
      setIsJoining(false);
    }, 1000);

    // Check if this is the first participant (host)
    const checkHostStatus = async () => {
      try {
        // In a real implementation, you would check with your signaling server
        // For now, we'll use localStorage to simulate this
        const existingParticipants = JSON.parse(localStorage.getItem(`room_${roomId}_participants`) || '[]');
        if (existingParticipants.length === 0) {
          setIsHost(true);
          localStorage.setItem(`room_${roomId}_host`, user.uid);
        }
        
        // Add current user to participants
        const updatedParticipants = [...existingParticipants, { id: user.uid, name: user.displayName }];
        localStorage.setItem(`room_${roomId}_participants`, JSON.stringify(updatedParticipants));
        setParticipants(updatedParticipants);
      } catch (error) {
        console.error('Error checking host status:', error);
      }
    };

    checkHostStatus();

    const initializeMedia = async () => {
      try {
        // First try to get both audio and video
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            aspectRatio: 16/9
          },
          audio: true
        });
        
        localStream.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Set up audio context
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        }
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 256;
        const source = audioContextRef.current.createMediaStreamSource(stream);
        source.connect(analyserRef.current);
        
        // Start analyzing audio levels
        analyzeAudio();

        setupPeerConnection(stream);
      } catch (error) {
        console.error('Error accessing media devices:', error);
        // If video fails, try audio only
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          localStream.current = audioStream;
          setIsVideoOff(true);
          
          // Set up audio context
          if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
          }
          analyserRef.current = audioContextRef.current.createAnalyser();
          analyserRef.current.fftSize = 256;
          const source = audioContextRef.current.createMediaStreamSource(audioStream);
          source.connect(analyserRef.current);
          
          analyzeAudio();
          setupPeerConnection(audioStream);
        } catch (audioError) {
          console.error('Error accessing audio:', audioError);
        }
      }
    };

    const analyzeAudio = () => {
      if (!analyserRef.current) return;

      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);
      
      // Calculate average volume level
      const average = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length;
      setAudioLevel(average);

      animationFrameRef.current = requestAnimationFrame(analyzeAudio);
    };

    const setupPeerConnection = (stream) => {
      const configuration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      };

      peerConnection.current = new RTCPeerConnection(configuration);

      // Create data channel for signaling
      dataChannelRef.current = peerConnection.current.createDataChannel('signaling');
      dataChannelRef.current.onmessage = handleDataChannelMessage;
      dataChannelRef.current.onopen = () => {
        console.log('Data channel opened');
      };

      stream.getTracks().forEach(track => {
        peerConnection.current.addTrack(track, stream);
      });

      peerConnection.current.ontrack = (event) => {
        setRemoteStream(event.streams[0]);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      peerConnection.current.onicecandidate = (event) => {
        if (event.candidate) {
          // Send the candidate to the remote peer through your signaling server
          console.log('New ICE candidate:', event.candidate);
        }
      };
    };

    initializeMedia();

    return () => {
      clearTimeout(animationTimer);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      cleanupResources();
    };
  }, [user, navigate, roomId]);

  const handleDataChannelMessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'host_transfer') {
      setIsHost(data.isHost);
    }
  };

  const transferHost = () => {
    if (isHost && participants.length > 1) {
      // Find the next participant to become host
      const currentHostIndex = participants.findIndex(p => p.id === user.uid);
      const nextHostIndex = (currentHostIndex + 1) % participants.length;
      const nextHost = participants[nextHostIndex];

      // Update host in localStorage
      localStorage.setItem(`room_${roomId}_host`, nextHost.id);

      // Notify other participants through data channel
      if (dataChannelRef.current && dataChannelRef.current.readyState === 'open') {
        dataChannelRef.current.send(JSON.stringify({
          type: 'host_transfer',
          newHostId: nextHost.id,
          isHost: false
        }));
      }
    }
  };

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const cleanupResources = () => {
    console.log("Cleaning up resources...");
    
    // Remove user from participants
    const existingParticipants = JSON.parse(localStorage.getItem(`room_${roomId}_participants`) || '[]');
    const updatedParticipants = existingParticipants.filter(p => p.id !== user.uid);
    localStorage.setItem(`room_${roomId}_participants`, JSON.stringify(updatedParticipants));

    // If host is leaving, transfer host role
    if (isHost) {
      transferHost();
    }
    
    // Stop all tracks in local stream
    if (localStream.current) {
      localStream.current.getTracks().forEach(track => {
        track.stop();
        console.log("Stopped local track:", track.kind);
      });
      localStream.current = null;
    }
    
    // Stop all tracks in screen stream
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log("Stopped screen track:", track.kind);
      });
      screenStreamRef.current = null;
    }
    
    // Close peer connection
    if (peerConnection.current) {
      peerConnection.current.close();
      console.log("Closed peer connection");
      peerConnection.current = null;
    }
    
    // Clear video elements
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
  };

  const toggleMute = () => {
    if (localStream.current) {
      const audioTrack = localStream.current.getAudioTracks()[0];
      audioTrack.enabled = !audioTrack.enabled;
      setIsMuted(!audioTrack.enabled);
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
          audio: false // Don't request audio here since we already have it
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
        console.log('Camera access was denied');
      }
      // Reset the video state in case of error
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
      
      // Get the track settings which include deviceId and other info
      const track = stream.getVideoTracks()[0];
      const settings = track.getSettings();
      
      // Stop the stream since we only needed it to get the sources
      stream.getTracks().forEach(track => track.stop());
      
      // Set the selected screen ID
      setSelectedScreenId(settings.deviceId);
      
      // Get all available screen sources
      if ('getScreenDetails' in navigator) {
        const screens = await navigator.getScreenDetails();
        setScreenSources(screens.screens || []);
      }
    } catch (error) {
      console.error('Error getting screen sources:', error);
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

      // Replace video track in peer connection
      const videoTrack = screenStream.getVideoTracks()[0];
      const sender = peerConnection.current.getSenders().find(s => s.track?.kind === 'video');
      if (sender) {
        sender.replaceTrack(videoTrack);
      }

      // Handle screen share stop
      videoTrack.onended = () => {
        stopScreenShare();
      };
    } catch (error) {
      console.error('Error sharing screen:', error);
    }
  };

  const stopScreenShare = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      setScreenStream(null);
      setIsScreenSharing(false);

      // Restore camera video track
      if (localStream.current) {
        const videoTrack = localStream.current.getVideoTracks()[0];
        const sender = peerConnection.current.getSenders().find(s => s.track.kind === 'video');
        if (sender) {
          sender.replaceTrack(videoTrack);
        }
      }
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      const message = {
        id: Date.now(),
        text: newMessage,
        sender: user?.displayName || 'You',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages([...messages, message]);
      setNewMessage('');
    }
  };

  const exitMeeting = () => {
    console.log("Exiting meeting...");
    
    try {
      // Play exit sound first
      playExitSound();
      
      // Add a small delay to allow the sound to play
      setTimeout(() => {
        // Clean up all resources
        cleanupResources();
        
        // Remove user from participants
        const existingParticipants = JSON.parse(localStorage.getItem(`room_${roomId}_participants`) || '[]');
        const updatedParticipants = existingParticipants.filter(p => p.id !== user.uid);
        localStorage.setItem(`room_${roomId}_participants`, JSON.stringify(updatedParticipants));

        // If host is leaving, transfer host role
        if (isHost) {
          transferHost();
        }

        // Clear any room-specific data
        localStorage.removeItem(`room_${roomId}_host`);
        
        // Navigate to landing page
        console.log("Navigating to landing page...");
        navigate('/', { replace: true });
      }, 300); // Reduced from 500ms to 300ms for better responsiveness
    } catch (error) {
      console.error("Error during exit:", error);
      // Force navigation even if there's an error
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
    }
  };

  const toggleAudioDropdown = () => {
    setShowAudioDropdown(!showAudioDropdown);
    setShowVideoDropdown(false); // Close video dropdown when audio dropdown is toggled
  };

  const toggleVideoDropdown = () => {
    setShowVideoDropdown(!showVideoDropdown);
    setShowAudioDropdown(false); // Close audio dropdown when video dropdown is toggled
  };

  useEffect(() => {
    // Update grid layout based on number of participants
    const updateGridLayout = () => {
      const totalParticipants = participants.length;
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

  // Function to generate a unique room code like Google Meet (abc-defg-hij)
  const generateRoomCode = () => {
    const chars = 'abcdefghijkmnpqrstuvwxyz'; // Removed confusing characters like 'l', 'o'
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

  // Function to copy room code to clipboard
  const copyRoomCode = async () => {
    try {
      // Get the current room code from localStorage or use the roomId prop
      const currentRoomCode = localStorage.getItem('current_room_code') || roomId;
      await navigator.clipboard.writeText(currentRoomCode);
      console.log('Room code copied:', currentRoomCode);
    } catch (err) {
      console.error('Failed to copy room code:', err);
    }
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
              {participants.filter(participant => participant.id !== user?.uid).map((participant, index) => (
                <div
                  key={participant.id}
                  className="relative bg-[#1E1E1E] rounded-2xl overflow-hidden"
                >
                  {/* Remote video content */}
                  <div className="w-full h-full flex items-center justify-center bg-[#1E1E1E]">
                    <div className="w-32 h-32 rounded-full bg-purple-500 flex items-center justify-center text-5xl font-bold">
                      {participant.name.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  {/* Participant Info */}
                  <div className="absolute bottom-4 left-4 bg-black/50 px-4 py-2 rounded-xl text-sm backdrop-blur-md">
                    <span className="font-sofia-medium">{participant.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Room Info Button */}
        <button
          onClick={copyRoomCode}
          className="absolute top-4 left-4 bg-[#1E1E1E]/80 backdrop-blur-md px-4 py-2 rounded-xl text-sm hover:bg-[#2A2A2A]/80 transition-colors flex items-center gap-2"
        >
          <span className="font-sofia-medium">
            Room: {localStorage.getItem('current_room_code') || roomId}
          </span>
          <FaCopy size={14} className="text-gray-400" />
        </button>

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