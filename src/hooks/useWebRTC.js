import { useEffect, useRef, useCallback } from 'react';
import { useSocket } from '@/context/SocketContext';
import { useMeeting } from '@/context/MeetingContext';
import { useAuth } from '@/context/AuthContext';

/**
 * useWebRTC — handles all WebRTC peer connections and Socket.IO signaling.
 *
 * Flow:
 *  1. User joins room → socket emits 'join-room'
 *  2. Server replies with 'room-joined' (existing peers + ICE config)
 *  3. For each existing peer, we CREATE an offer and send it
 *  4. When a new user joins later, THEY send us an offer
 *  5. We handle offer → create answer → send answer
 *  6. ICE candidates are exchanged throughout
 */
export function useWebRTC(roomId) {
  const { socket } = useSocket();
  const { state, dispatch } = useMeeting();
  const { user } = useAuth();

  // Map of socketId → RTCPeerConnection
  const peerConnections = useRef(new Map());
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);

  // ── Get local media ──────────────────────────────────────
  const getLocalStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localStreamRef.current = stream;
      dispatch({ type: 'SET_LOCAL_STREAM', payload: stream });
      return stream;
    } catch (err) {
      console.error('Failed to get media:', err);
      // Try audio-only fallback
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({
          video: false,
          audio: true,
        });
        localStreamRef.current = audioStream;
        dispatch({ type: 'SET_LOCAL_STREAM', payload: audioStream });
        return audioStream;
      } catch (audioErr) {
        console.error('Failed to get any media:', audioErr);
        return null;
      }
    }
  }, [dispatch]);

  // ── Create a peer connection for a remote user ───────────
  const createPeerConnection = useCallback(
    (remoteSocketId, iceServers) => {
      // Don't create duplicate connections
      if (peerConnections.current.has(remoteSocketId)) {
        return peerConnections.current.get(remoteSocketId);
      }

      const pc = new RTCPeerConnection({ iceServers });

      // Add local tracks to the connection
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current);
        });
      }

      // When we get ICE candidates, send them to the remote peer
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('ice-candidate', {
            to: remoteSocketId,
            candidate: event.candidate,
          });
        }
      };

      // When remote sends us their tracks
      pc.ontrack = (event) => {
        const [remoteStream] = event.streams;
        if (remoteStream) {
          dispatch({
            type: 'UPDATE_PEER_STREAM',
            payload: { socketId: remoteSocketId, stream: remoteStream },
          });
        }
      };

      pc.oniceconnectionstatechange = () => {
        console.log(`ICE state [${remoteSocketId}]:`, pc.iceConnectionState);
        if (pc.iceConnectionState === 'failed') {
          pc.restartIce();
        }
      };

      peerConnections.current.set(remoteSocketId, pc);
      return pc;
    },
    [socket, dispatch]
  );

  // ── Send offer to a peer ─────────────────────────────────
  const sendOffer = useCallback(
    async (remoteSocketId, iceServers) => {
      const pc = createPeerConnection(remoteSocketId, iceServers);
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('offer', { to: remoteSocketId, offer });
      } catch (err) {
        console.error('Error creating offer:', err);
      }
    },
    [createPeerConnection, socket]
  );

  // ── Handle incoming offer ────────────────────────────────
  const handleOffer = useCallback(
    async ({ from, offer }) => {
      const iceServers = state.iceServers;
      const pc = createPeerConnection(from, iceServers);
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('answer', { to: from, answer });
      } catch (err) {
        console.error('Error handling offer:', err);
      }
    },
    [createPeerConnection, socket, state.iceServers]
  );

  // ── Handle incoming answer ───────────────────────────────
  const handleAnswer = useCallback(async ({ from, answer }) => {
    const pc = peerConnections.current.get(from);
    if (pc) {
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      } catch (err) {
        console.error('Error handling answer:', err);
      }
    }
  }, []);

  // ── Handle incoming ICE candidate ────────────────────────
  const handleIceCandidate = useCallback(async ({ from, candidate }) => {
    const pc = peerConnections.current.get(from);
    if (pc && candidate) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error('Error adding ICE candidate:', err);
      }
    }
  }, []);

  // ── Close a single peer connection ───────────────────────
  const closePeerConnection = useCallback(
    (socketId) => {
      const pc = peerConnections.current.get(socketId);
      if (pc) {
        pc.close();
        peerConnections.current.delete(socketId);
      }
      dispatch({ type: 'REMOVE_PEER', payload: socketId });
    },
    [dispatch]
  );

  // ── Join the room ────────────────────────────────────────
  const joinRoom = useCallback(async () => {
    const stream = await getLocalStream();
    if (!stream) {
      console.warn('Joining without media');
    }

    socket.emit('join-room', {
      roomId,
      userId: user?.uid || 'anonymous',
      userName: user?.displayName || 'Guest',
    });
  }, [getLocalStream, socket, roomId, user]);

  // ── Leave the room ───────────────────────────────────────
  const leaveRoom = useCallback(() => {
    socket.emit('leave-room', { roomId });

    // Close all peer connections
    for (const [id] of peerConnections.current) {
      closePeerConnection(id);
    }

    // Stop local media
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
    }

    dispatch({ type: 'RESET' });
  }, [socket, roomId, closePeerConnection, dispatch]);

  // ── Toggle Microphone ────────────────────────────────────
  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        socket.emit('toggle-media', {
          roomId,
          kind: 'audio',
          enabled: audioTrack.enabled,
        });
        dispatch({ type: 'TOGGLE_MUTE' });
      }
    }
  }, [socket, roomId, dispatch]);

  // ── Toggle Camera ────────────────────────────────────────
  const toggleCamera = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        socket.emit('toggle-media', {
          roomId,
          kind: 'video',
          enabled: videoTrack.enabled,
        });
        dispatch({ type: 'TOGGLE_CAMERA' });
      }
    }
  }, [socket, roomId, dispatch]);

  // ── Toggle Screen Share ──────────────────────────────────
  const toggleScreenShare = useCallback(async () => {
    if (state.isScreenSharing) {
      // Stop screen share
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
        screenStreamRef.current = null;
      }

      // Replace screen track with camera track in all connections
      const videoTrack = localStreamRef.current?.getVideoTracks()[0];
      if (videoTrack) {
        for (const [, pc] of peerConnections.current) {
          const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
          if (sender) {
            await sender.replaceTrack(videoTrack);
          }
        }
      }

      socket.emit('screen-share', { roomId, sharing: false });
      dispatch({ type: 'SET_SCREEN_STREAM', payload: null });
    } else {
      // Start screen share
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false,
        });
        screenStreamRef.current = screenStream;

        const screenTrack = screenStream.getVideoTracks()[0];

        // Replace camera track with screen track in all connections
        for (const [, pc] of peerConnections.current) {
          const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
          if (sender) {
            await sender.replaceTrack(screenTrack);
          }
        }

        // When user stops sharing via browser UI
        screenTrack.onended = () => {
          toggleScreenShare();
        };

        socket.emit('screen-share', { roomId, sharing: true });
        dispatch({ type: 'SET_SCREEN_STREAM', payload: screenStream });
      } catch (err) {
        console.error('Screen share failed:', err);
      }
    }
  }, [state.isScreenSharing, socket, roomId, dispatch]);

  // ── Send Chat Message ────────────────────────────────────
  const sendChatMessage = useCallback(
    (message) => {
      if (!message.trim()) return;
      socket.emit('chat-message', {
        roomId,
        userId: user?.uid || 'anonymous',
        userName: user?.displayName || 'Guest',
        message: message.trim(),
      });
    },
    [socket, roomId, user]
  );

  // ── Socket Event Listeners ───────────────────────────────
  useEffect(() => {
    if (!socket) return;

    // When we successfully join and get room info
    const onRoomJoined = async ({ roomId: rId, iceServers, peers }) => {
      dispatch({
        type: 'SET_ROOM',
        payload: { roomId: rId, iceServers },
      });

      // Add all existing peers and send them offers
      for (const peer of peers) {
        dispatch({
          type: 'ADD_PEER',
          payload: {
            socketId: peer.socketId,
            userId: peer.userId,
            userName: peer.userName,
            stream: null,
          },
        });
        await sendOffer(peer.socketId, iceServers);
      }
    };

    // When a new user joins after us
    const onUserJoined = ({ socketId, userId, userName }) => {
      dispatch({
        type: 'ADD_PEER',
        payload: { socketId, userId, userName, stream: null },
      });
      // Don't send offer — the new user will send us one via onRoomJoined
    };

    // When a user leaves
    const onUserLeft = ({ socketId }) => {
      closePeerConnection(socketId);
    };

    // Chat message received
    const onChatMessage = ({ senderId, senderName, message, timestamp }) => {
      dispatch({
        type: 'ADD_CHAT_MESSAGE',
        payload: { senderId, senderName, message, timestamp },
      });
    };

    // Peer toggled their media
    const onPeerMediaToggle = ({ socketId, kind, enabled }) => {
      dispatch({
        type: 'TOGGLE_PEER_MEDIA',
        payload: { socketId, kind, enabled },
      });
    };

    socket.on('room-joined', onRoomJoined);
    socket.on('user-joined', onUserJoined);
    socket.on('user-left', onUserLeft);
    socket.on('offer', handleOffer);
    socket.on('answer', handleAnswer);
    socket.on('ice-candidate', handleIceCandidate);
    socket.on('chat-message', onChatMessage);
    socket.on('peer-media-toggle', onPeerMediaToggle);

    return () => {
      socket.off('room-joined', onRoomJoined);
      socket.off('user-joined', onUserJoined);
      socket.off('user-left', onUserLeft);
      socket.off('offer', handleOffer);
      socket.off('answer', handleAnswer);
      socket.off('ice-candidate', handleIceCandidate);
      socket.off('chat-message', onChatMessage);
      socket.off('peer-media-toggle', onPeerMediaToggle);
    };
  }, [socket, dispatch, sendOffer, handleOffer, handleAnswer, handleIceCandidate, closePeerConnection]);

  return {
    joinRoom,
    leaveRoom,
    toggleMute,
    toggleCamera,
    toggleScreenShare,
    sendChatMessage,
  };
}
