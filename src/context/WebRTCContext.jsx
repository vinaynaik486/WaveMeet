import React, { createContext, useContext, useCallback, useEffect, useRef } from 'react';
import { useSocket } from './SocketContext';
import { useMeeting } from './MeetingContext';
import { useAuth } from './AuthContext';

const WebRTCContext = createContext(null);

const entrySound = new Audio('/sounds/entry.mp3');
const exitSound = new Audio('/sounds/exit.mp3');
entrySound.volume = 0.5;
exitSound.volume = 0.5;

export function WebRTCProvider({ children }) {
  const { socket } = useSocket();
  const { state, dispatch } = useMeeting();
  const { user } = useAuth();
  const { activeRoomId: roomId } = state;

  const peerConnections = useRef({});
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const iceServersRef = useRef([]);

  const playAudio = useCallback((type) => {
    try {
      const audio = type === 'entry' ? entrySound : exitSound;
      audio.currentTime = 0;
      audio.play().catch(e => console.warn('[AUDIO PLAY ERROR]', e.message));
    } catch (e) {
      console.warn('[AUDIO SETUP ERROR]', e.message);
    }
  }, []);

  /**
   * Universal negotiator. Handles sending offers when tracks change
   * or initial connections are established.
   */
  const negotiate = useCallback(async (targetSocketId) => {
    const pc = peerConnections.current[targetSocketId];
    if (!pc) return;
    try {
      const offer = await pc.createOffer();
      if (pc.signalingState !== 'stable') return; // Prevent glare
      await pc.setLocalDescription(offer);
      socket.emit('offer', { to: targetSocketId, offer: pc.localDescription });
    } catch (err) {
      console.error('[WebRTC] Negotiation failed:', err);
    }
  }, [socket]);

  const createPeer = useCallback((targetSocketId, isInitiator) => {
    const pc = new RTCPeerConnection({ iceServers: iceServersRef.current });

    pc.onicecandidate = (e) => {
      if (e.candidate && socket) {
        socket.emit('ice-candidate', { to: targetSocketId, candidate: e.candidate });
      }
    };

    pc.ontrack = (e) => {
      if (e.streams?.[0]) {
        dispatch({ type: 'UPDATE_PEER_STREAM', payload: { socketId: targetSocketId, stream: e.streams[0] } });
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'failed') pc.restartIce();
    };

    pc.onnegotiationneeded = () => {
      if (isInitiator) negotiate(targetSocketId);
    };

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => pc.addTrack(track, localStreamRef.current));
    }

    peerConnections.current[targetSocketId] = pc;
    return pc;
  }, [socket, dispatch, negotiate]);

  const joinRoom = useCallback(async () => {
    if (!socket || !roomId) return;
    
    let stream = null;
    try {
      // Robust acquisition: try full AV, then fallback
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      } catch (e) {
        console.warn('[WebRTC] AV acquisition failed, trying fallback...', e.name);
        try {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (e2) {
          try {
            stream = await navigator.mediaDevices.getUserMedia({ video: true });
          } catch (e3) {
            console.error('[WebRTC] No media devices found');
          }
        }
      }

      localStreamRef.current = stream;
      
      const isNewRoomSession = state.lastJoinedRoomId !== roomId;

      if (stream) {
        if (isNewRoomSession) {
          const defaultMute = user?.settings?.defaultMuteOnJoin;
          const defaultVideoOff = user?.settings?.defaultVideoOffOnJoin;

          if (defaultMute) {
            stream.getAudioTracks().forEach(t => t.enabled = false);
            dispatch({ type: 'SET_MUTED', payload: true });
          } else {
            dispatch({ type: 'SET_MUTED', payload: false });
          }
          
          if (defaultVideoOff) {
            stream.getVideoTracks().forEach(t => t.enabled = false);
            dispatch({ type: 'SET_CAMERA_OFF', payload: true });
          } else {
            dispatch({ type: 'SET_CAMERA_OFF', payload: false });
          }

          dispatch({ type: 'SET_LAST_ROOM', payload: roomId });
        } else {
          if (state.isMuted) stream.getAudioTracks().forEach(t => t.enabled = false);
          if (state.isCameraOff) stream.getVideoTracks().forEach(t => t.enabled = false);
        }
      }

      dispatch({ type: 'SET_LOCAL_STREAM', payload: stream });
      dispatch({ type: 'SET_JOINED' });
      
      socket.emit('join-room', { 
        roomId: roomId.trim().toLowerCase(), 
        userId: user?.uid || 'anon', 
        userName: user?.displayName || 'Guest',
        photoURL: user?.photoURL,
        waitingRoomEnabled: user?.settings?.waitingRoomEnabled || false
      });
    } catch (err) {
      console.error('[MEDIA] Join error:', err);
      dispatch({ type: 'SET_JOINED' });
      socket.emit('join-room', { 
        roomId: roomId.trim().toLowerCase(), 
        userId: user?.uid || 'anon', 
        userName: user?.displayName || 'Guest',
        photoURL: user?.photoURL,
        waitingRoomEnabled: user?.settings?.waitingRoomEnabled || false
      });
    }
  }, [socket, roomId, user, state.lastJoinedRoomId, state.isMuted, state.isCameraOff, dispatch]);

  const leaveRoom = useCallback(() => {
    if (socket && roomId) socket.emit('leave-room', { roomId: roomId.trim().toLowerCase() });
    Object.values(peerConnections.current).forEach(pc => pc.close());
    peerConnections.current = {};
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(t => t.stop());
      screenStreamRef.current = null;
    }
    dispatch({ type: 'RESET' });
  }, [socket, roomId, dispatch]);

  const toggleMute = useCallback(async () => {
    let stream = localStreamRef.current;
    
    // Recovery: If stream or track missing, try to acquire it
    if (!stream || !stream.getAudioTracks().length) {
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const audioTrack = newStream.getAudioTracks()[0];
        
        if (stream) {
          stream.addTrack(audioTrack);
        } else {
          localStreamRef.current = newStream;
          stream = newStream;
          dispatch({ type: 'SET_LOCAL_STREAM', payload: stream });
        }
        
        // Add to existing connections and trigger negotiation
        for (const [sid, pc] of Object.entries(peerConnections.current)) {
          pc.addTrack(audioTrack, stream);
          negotiate(sid);
        }
        
        dispatch({ type: 'SET_MUTED', payload: false });
        socket?.emit('toggle-audio', { roomId: roomId?.trim().toLowerCase(), enabled: true });
        return;
      } catch (err) {
        console.error('[WebRTC] Failed to acquire mic:', err);
        return;
      }
    }

    const track = stream.getAudioTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      dispatch({ type: 'TOGGLE_MUTE' });
      socket?.emit('toggle-audio', { roomId: roomId?.trim().toLowerCase(), enabled: track.enabled });
    }
  }, [socket, roomId, dispatch, negotiate]);

  const toggleCamera = useCallback(async () => {
    let stream = localStreamRef.current;

    // Recovery: If stream or track missing, try to acquire it
    if (!stream || !stream.getVideoTracks().length) {
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const videoTrack = newStream.getVideoTracks()[0];
        
        if (stream) {
          stream.addTrack(videoTrack);
        } else {
          localStreamRef.current = newStream;
          stream = newStream;
          dispatch({ type: 'SET_LOCAL_STREAM', payload: stream });
        }
        
        // Add to existing connections and trigger negotiation
        for (const [sid, pc] of Object.entries(peerConnections.current)) {
          pc.addTrack(videoTrack, stream);
          negotiate(sid);
        }

        dispatch({ type: 'SET_CAMERA_OFF', payload: false });
        socket?.emit('toggle-video', { roomId: roomId?.trim().toLowerCase(), enabled: true });
        return;
      } catch (err) {
        console.error('[WebRTC] Failed to acquire camera:', err);
        return;
      }
    }

    const track = stream.getVideoTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      dispatch({ type: 'TOGGLE_CAMERA' });
      socket?.emit('toggle-video', { roomId: roomId?.trim().toLowerCase(), enabled: track.enabled });
    }
  }, [socket, roomId, dispatch, negotiate]);

  const toggleScreenShare = useCallback(async () => {
    const nRoomId = roomId?.trim().toLowerCase();
    if (state.isScreenSharing) {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(t => t.stop());
        screenStreamRef.current = null;
      }
      dispatch({ type: 'SET_SCREEN_STREAM', payload: null });
      const camTrack = localStreamRef.current?.getVideoTracks()[0];
      if (camTrack) {
        Object.values(peerConnections.current).forEach(pc => {
          const sender = pc.getSenders().find(s => s.track?.kind === 'video');
          if (sender) sender.replaceTrack(camTrack);
        });
      }
      socket?.emit('screen-share-stop', { roomId: nRoomId });
      return;
    }
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      screenStreamRef.current = screenStream;
      const screenTrack = screenStream.getVideoTracks()[0];
      dispatch({ type: 'SET_SCREEN_STREAM', payload: screenStream });
      Object.values(peerConnections.current).forEach(pc => {
        const sender = pc.getSenders().find(s => s.track?.kind === 'video');
        if (sender) sender.replaceTrack(screenTrack);
      });
      screenTrack.onended = () => {
        screenStreamRef.current = null;
        dispatch({ type: 'SET_SCREEN_STREAM', payload: null });
        const camTrack = localStreamRef.current?.getVideoTracks()[0];
        if (camTrack) {
          Object.values(peerConnections.current).forEach(pc => {
            const sender = pc.getSenders().find(s => s.track?.kind === 'video');
            if (sender) sender.replaceTrack(camTrack);
          });
        }
        socket?.emit('screen-share-stop', { roomId: nRoomId });
      };
      socket?.emit('screen-share-start', { roomId: nRoomId });
    } catch (err) { console.error('[SCREEN]', err); }
  }, [socket, roomId, state.isScreenSharing, dispatch]);

  const sendChatMessage = useCallback((message) => {
    if (!socket || !message.trim()) return;
    socket.emit('chat-message', { roomId: roomId?.trim().toLowerCase(), message, senderId: user?.uid || 'anon', senderName: user?.displayName || 'Guest' });
  }, [socket, roomId, user]);

  useEffect(() => {
    if (!socket) return;

    const onRoomUsers = async ({ users, iceServers }) => {
      iceServersRef.current = iceServers || [];
      for (const u of users) {
        dispatch({ type: 'ADD_PEER', payload: { socketId: u.socketId, odId: u.odId, userName: u.userName, photoURL: u.photoURL, stream: null, audioEnabled: u.audioEnabled ?? true, videoEnabled: u.videoEnabled ?? true } });
        createPeer(u.socketId, true); // onnegotiationneeded will trigger the offer
      }
    };

    const onUserJoined = ({ socketId, odId, userName, photoURL }) => {
      dispatch({ type: 'ADD_PEER', payload: { socketId, odId, userName, photoURL, stream: null, audioEnabled: true, videoEnabled: true } });
      playAudio('entry');
    };

    const onOffer = async ({ from, offer }) => {
      let pc = peerConnections.current[from];
      if (!pc) pc = createPeer(from, false);
      
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('answer', { to: from, answer });
      } catch (err) {
        console.error('[WebRTC] Offer processing failed:', err);
      }
    };

    const onAnswer = async ({ from, answer }) => {
      const pc = peerConnections.current[from];
      if (pc) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
        } catch (err) {
          console.error('[WebRTC] Answer processing failed:', err);
        }
      }
    };

    const onIceCandidate = async ({ from, candidate }) => {
      const pc = peerConnections.current[from];
      if (pc && candidate) {
        try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); } catch (e) { /* ignore */ }
      }
    };

    const onUserLeft = ({ socketId }) => {
      peerConnections.current[socketId]?.close();
      delete peerConnections.current[socketId];
      dispatch({ type: 'REMOVE_PEER', payload: socketId });
      if (socketId !== socket.id) playAudio('exit');
    };

    const onMediaToggle = ({ socketId, audioEnabled, videoEnabled }) => {
      dispatch({ type: 'UPDATE_PEER_MEDIA', payload: { socketId, audioEnabled, videoEnabled } });
    };

    const onNewMessage = (msg) => dispatch({ type: 'ADD_MESSAGE', payload: msg });
    const onChatHistory = (msgs) => dispatch({ type: 'SET_CHAT_HISTORY', payload: msgs });
    const onUserTyping = ({ userName }) => {
      dispatch({ type: 'SET_TYPING', payload: userName });
      setTimeout(() => dispatch({ type: 'CLEAR_TYPING', payload: userName }), 3000);
    };
    const onTasksUpdated = (tasks) => dispatch({ type: 'SET_TASKS', payload: tasks });
    const onReaction = ({ socketId, emoji }) => {
      dispatch({ type: 'SET_REACTION', payload: { socketId, emoji } });
      setTimeout(() => dispatch({ type: 'CLEAR_REACTION', payload: socketId }), 3000);
    };
    const onJoinRequest = ({ odId, displayName, photoURL, socketId: reqSocketId }) => {
      dispatch({ type: 'ADD_JOIN_REQUEST', payload: { odId, displayName, photoURL, socketId: reqSocketId } });
    };
    const onPendingRequests = (requests) => {
      dispatch({ type: 'SET_JOIN_REQUESTS', payload: requests });
    };
    const onWaitingRoom = () => {
      dispatch({ type: 'SET_WAITING', payload: true });
    };
    const onJoinApproved = ({ roomId: approvedRoomId }) => {
      dispatch({ type: 'SET_WAITING', payload: false });
      socket.emit('join-room', {
        roomId: approvedRoomId.trim().toLowerCase(),
        userId: user?.uid || 'anon',
        userName: user?.displayName || 'Guest',
        photoURL: user?.photoURL,
        approved: true,
      });
    };
    const onJoinRejected = ({ reason }) => {
      dispatch({ type: 'SET_WAITING_REJECTED', payload: reason || 'Host declined your request' });
    };
    const onForceMuted = () => {
      const track = localStreamRef.current?.getAudioTracks()[0];
      if (track) { track.enabled = false; dispatch({ type: 'SET_MUTED', payload: true }); }
    };
    const onRemoved = () => leaveRoom();

    socket.on('room-users', onRoomUsers);
    socket.on('user-joined', onUserJoined);
    socket.on('offer', onOffer);
    socket.on('answer', onAnswer);
    socket.on('ice-candidate', onIceCandidate);
    socket.on('user-left', onUserLeft);
    socket.on('user-media-toggle', onMediaToggle);
    socket.on('new-message', onNewMessage);
    socket.on('chat-history', onChatHistory);
    socket.on('user-typing', onUserTyping);
    socket.on('tasks-updated', onTasksUpdated);
    socket.on('user-reaction', onReaction);
    socket.on('join-request-received', onJoinRequest);
    socket.on('pending-requests', onPendingRequests);
    socket.on('waiting-room', onWaitingRoom);
    socket.on('join-approved', onJoinApproved);
    socket.on('join-rejected', onJoinRejected);
    socket.on('force-muted', onForceMuted);
    socket.on('removed-from-meeting', onRemoved);

    return () => {
      socket.off('room-users', onRoomUsers);
      socket.off('user-joined', onUserJoined);
      socket.off('offer', onOffer);
      socket.off('answer', onAnswer);
      socket.off('ice-candidate', onIceCandidate);
      socket.off('user-left', onUserLeft);
      socket.off('user-media-toggle', onMediaToggle);
      socket.off('new-message', onNewMessage);
      socket.off('chat-history', onChatHistory);
      socket.off('user-typing', onUserTyping);
      socket.off('tasks-updated', onTasksUpdated);
      socket.off('user-reaction', onReaction);
      socket.off('join-request-received', onJoinRequest);
      socket.off('pending-requests', onPendingRequests);
      socket.off('waiting-room', onWaitingRoom);
      socket.off('join-approved', onJoinApproved);
      socket.off('join-rejected', onJoinRejected);
      socket.off('force-muted', onForceMuted);
      socket.off('removed-from-meeting', onRemoved);
    };
  }, [socket, createPeer, dispatch, leaveRoom, user]);

  const value = {
    joinRoom,
    leaveRoom,
    toggleMute,
    toggleCamera,
    toggleScreenShare,
    sendChatMessage
  };

  return (
    <WebRTCContext.Provider value={value}>
      {children}
    </WebRTCContext.Provider>
  );
}

export function useWebRTC() {
  const context = useContext(WebRTCContext);
  if (!context) throw new Error('useWebRTC must be used within a WebRTCProvider');
  return context;
}
