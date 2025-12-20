import React, { useEffect, useCallback, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { useMeeting } from '@/context/MeetingContext';
import { useWebRTC } from '@/context/WebRTCContext';
import VideoGrid from '@/components/meeting/VideoGrid';
import ChatPanel from '@/components/meeting/ChatPanel';
import ParticipantsList from '@/components/meeting/ParticipantsList';
import TaskListPanel from '@/components/meeting/TaskListPanel';
import { MdArrowBack, MdContentCopy, MdCheck, MdLock, MdLockOpen } from 'react-icons/md';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import ClassicLoader from '@/components/ui/loader';
import { toast } from 'react-hot-toast';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * MeetingRoom Component
 * 
 * Serves as the primary layout and container for an active meeting session.
 * Manages socket connections, user roles (host/guest), security states (waiting room),
 * and dynamically renders the appropriate UI panels (chat, participants, tasks).
 */
export default function MeetingRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { connect, disconnect, isConnected, socket } = useSocket();
  const { state, dispatch } = useMeeting();
  const { joined, peers, isChatOpen, isParticipantsOpen, isTasksOpen } = state;
  const { joinRoom, leaveRoom, toggleMute, toggleCamera, toggleScreenShare, sendChatMessage } = useWebRTC();
  const [copied, setCopied] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [isHost, setIsHost] = useState(false);

  // Establish socket connection on mount
  useEffect(() => { connect(); }, [connect]);

  /**
   * Pre-fetches the meeting details via REST API immediately on component mount.
   * This guarantees that UI elements (like the lock button for hosts) render instantly,
   * without waiting for the socket connection to fully establish.
   */
  useEffect(() => {
    if (!roomId || !user) return;
    
    fetch(`${API}/api/meetings/${roomId}`)
      .then(res => {
        if (res.status === 404) throw new Error('Meeting not found');
        return res.json();
      })
      .then(data => {
        if (data.meeting) {
          setIsHost(data.meeting.hostId === user.uid);
          setIsLocked(data.meeting.waitingRoomEnabled || false);
        }
      })
      .catch((err) => {
        console.error('[ROOM_FETCH]', err);
        toast.error('Meeting not found or has ended.');
        navigate('/dashboard');
      });
  }, [roomId, user, navigate]);

  /**
   * Subscribes to real-time meeting state updates via WebSockets.
   * Ensures that mid-meeting changes to host settings (e.g., locking the room)
   * are instantly synchronized.
   */
  useEffect(() => {
    if (!socket || !isConnected || !user) return;

    const handleRoomInfo = (info) => {
      setIsHost(info.hostId === user.uid);
      setIsLocked(info.waitingRoomEnabled || false);
    };
    
    socket.on('room-info', handleRoomInfo);
    return () => {
      socket.off('room-info', handleRoomInfo);
    };
  }, [socket, isConnected, user]);

  const toggleLock = async () => {
    const newStatus = !isLocked;
    setIsLocked(newStatus);
    try {
      await fetch(`${API}/api/meetings/${roomId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ waitingRoomEnabled: newStatus })
      });
    } catch (e) {
      console.error(e);
      setIsLocked(!newStatus); // Revert on failure
    }
  };

  useEffect(() => {
    if (roomId) {
      if (state.activeRoomId && state.activeRoomId !== roomId) {
        leaveRoom();
      }
      dispatch({ type: 'SET_ACTIVE_ROOM', payload: roomId });
    }
  }, [roomId, dispatch, state.activeRoomId, leaveRoom]);

  useEffect(() => { 
    if (isConnected && !joined && state.activeRoomId) joinRoom(); 
  }, [isConnected, joined, joinRoom, state.activeRoomId]);

  const handleLeave = useCallback(() => {
    const rId = roomId;
    dispatch({ type: 'SET_ACTIVE_ROOM', payload: null });
    leaveRoom(); 
    disconnect(); 
    dispatch({ type: 'RESET' });
    navigate(`/meeting-end?roomId=${rId}`);
  }, [leaveRoom, disconnect, navigate, roomId, dispatch]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!user) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#fafafa] dark:bg-[#0a0a1a]">
        <ClassicLoader />
      </div>
    );
  }

  // Waiting room screen
  if (state.isWaiting) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#fafafa] dark:bg-[#0a0a1a] gap-6">
        <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center border border-gray-200 dark:border-white/10">
          <div className="w-4 h-4 rounded-full bg-gray-900 dark:bg-white animate-pulse" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight mb-2">Waiting Room</h2>
          <p className="text-sm text-gray-400 font-medium">Waiting for host to let you in...</p>
        </div>
        <button
          onClick={() => { dispatch({ type: 'SET_WAITING', payload: false }); navigate('/dashboard'); }}
          className="px-6 py-3 rounded-2xl bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 text-sm font-bold hover:bg-gray-200 dark:hover:bg-white/10 transition-all"
        >
          Cancel
        </button>
      </div>
    );
  }

  // Rejection screen
  if (state.waitingRejected) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#fafafa] dark:bg-[#0a0a1a] gap-6">
        <div className="w-20 h-20 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center border border-red-100 dark:border-red-500/20">
          <span className="text-3xl">✕</span>
        </div>
        <div className="text-center">
          <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight mb-2">Request Declined</h2>
          <p className="text-sm text-gray-400 font-medium">{state.waitingRejected}</p>
        </div>
        <button
          onClick={() => { dispatch({ type: 'SET_WAITING_REJECTED', payload: null }); navigate('/dashboard'); }}
          className="px-6 py-3 rounded-2xl bg-gray-900 dark:bg-white/10 text-white text-sm font-bold hover:bg-black dark:hover:bg-white/20 transition-all"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const activePanelsCount = [isChatOpen, isParticipantsOpen, isTasksOpen].filter(Boolean).length;

  return (
    <div className="flex h-full w-full overflow-hidden bg-[#fafafa] dark:bg-[#0a0a1a]">
      <div className="flex-1 flex flex-col min-w-0 px-4 py-3 transition-all duration-500 ease-in-out">
        <div className="flex items-center justify-between mb-4 bg-[#fafafa] dark:bg-[#0a0a1a] rounded-2xl px-5 py-3 shadow-[0_0_50px_rgba(0,0,0,0.08)] dark:shadow-[0_0_50px_rgba(0,0,0,0.3)] border border-gray-200 dark:border-white/10 transition-all duration-500">
          <div className="flex items-center gap-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  onClick={() => navigate('/dashboard')} 
                  className="w-10 h-10 rounded-2xl bg-gray-50 dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-gray-500/20 text-gray-600 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-400 flex items-center justify-center transition-all duration-300 active:scale-95 shadow-sm border border-gray-200 dark:border-white/10"
                >
                  <MdArrowBack size={20} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Back to Dashboard</TooltipContent>
            </Tooltip>
            
            <div>
              <h1 className="text-xl text-gray-900 dark:text-white font-bold tracking-tight">WaveMeet Weekly Meeting</h1>
              <p className="text-[12px] text-gray-400 font-medium flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                {peers.length + 1} Participant{peers.length !== 0 ? 's' : ''} Online
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {isHost && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    onClick={toggleLock} 
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-2xl text-sm font-bold border transition-all active:scale-95 shadow-sm ${
                      isLocked 
                        ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/20 hover:bg-red-100 dark:hover:bg-red-500/20' 
                        : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-500/20'
                    }`}
                  >
                    {isLocked ? <MdLock size={18} /> : <MdLockOpen size={18} />}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">{isLocked ? 'Unlock Room' : 'Lock Room'}</TooltipContent>
              </Tooltip>
            )}

            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  onClick={handleCopyCode} 
                  className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 text-sm font-bold border border-gray-200 dark:border-white/10 transition-all active:scale-95 group shadow-sm"
                >
                  <span className="font-mono text-[13px] text-gray-500 dark:text-gray-400">{roomId}</span>
                  {copied ? <MdCheck className="text-emerald-500" size={18} /> : <MdContentCopy className="text-gray-400 group-hover:text-gray-500" size={18} />}
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Copy Code</TooltipContent>
            </Tooltip>
          </div>
        </div>

        <div className="flex-1 min-h-0">
          <VideoGrid onLeave={handleLeave} onToggleMute={toggleMute} onToggleCamera={toggleCamera} onToggleScreenShare={toggleScreenShare} roomId={roomId} />
        </div>
      </div>

      {activePanelsCount > 0 && (
        <div className="w-[340px] flex flex-col gap-3 py-3 pr-4 pl-0 h-full overflow-hidden transition-all duration-500 animate-in slide-in-from-right bg-[#fafafa] dark:bg-[#0a0a1a]">
          {isParticipantsOpen && (
            <div className="flex-1 min-h-0 transition-all duration-500">
              <ParticipantsList roomId={roomId} />
            </div>
          )}
          {isChatOpen && (
            <div className="flex-1 min-h-0 transition-all duration-500">
              <ChatPanel onSendMessage={sendChatMessage} roomId={roomId} />
            </div>
          )}
          {isTasksOpen && (
            <div className="flex-1 min-h-0 transition-all duration-500">
              <TaskListPanel roomId={roomId} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
