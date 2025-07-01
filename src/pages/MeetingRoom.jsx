import React, { useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { useMeeting, MeetingProvider } from '@/context/MeetingContext';
import { useWebRTC } from '@/hooks/useWebRTC';
import VideoGrid from '@/components/meeting/VideoGrid';
import MeetingControls from '@/components/meeting/MeetingControls';
import ChatPanel from '@/components/meeting/ChatPanel';
import ParticipantsList from '@/components/meeting/ParticipantsList';
import MeetingSidebar from '@/components/meeting/MeetingSidebar';
import { MdArrowBack, MdCallEnd, MdContentCopy, MdCheck } from 'react-icons/md';

function MeetingRoomInner() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { connect, disconnect, isConnected } = useSocket();
  const { state, dispatch } = useMeeting();
  const { joined, isChatOpen, isParticipantsOpen, peers } = state;

  const {
    joinRoom,
    leaveRoom,
    toggleMute,
    toggleCamera,
    toggleScreenShare,
    sendChatMessage,
  } = useWebRTC(roomId);

  const [copied, setCopied] = React.useState(false);

  useEffect(() => {
    connect();
  }, [connect]);

  useEffect(() => {
    if (isConnected && !joined) {
      joinRoom();
    }
  }, [isConnected, joined, joinRoom]);

  const handleLeave = useCallback(() => {
    leaveRoom();
    disconnect();
    navigate('/');
  }, [leaveRoom, disconnect, navigate]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#f5f5f7]">
        <div className="animate-pulse text-gray-400 font-sofia-medium">Loading meeting...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-[#f5f5f7] overflow-hidden font-sofia">
      {/* Left Sidebar */}
      <MeetingSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 p-3 md:p-4">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between mb-3 md:mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="w-9 h-9 rounded-full bg-white hover:bg-gray-100 flex items-center justify-center transition-colors shadow-sm"
            >
              <MdArrowBack className="text-gray-600" size={18} />
            </button>
            <div>
              <h1 className="text-base md:text-lg font-semibold text-gray-900 font-sofia-medium leading-tight">
                WaveMeet Room
              </h1>
              <p className="text-xs text-gray-400 font-sofia-light">
                {peers.length + 1} Participant{peers.length !== 0 ? 's' : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Copy Room Code */}
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-white hover:bg-gray-50 text-gray-500 text-xs font-sofia-medium shadow-sm transition-colors"
              title="Copy meeting code"
            >
              <span className="font-mono text-[11px]">{roomId}</span>
              {copied ? (
                <MdCheck className="text-green-500" size={16} />
              ) : (
                <MdContentCopy size={14} />
              )}
            </button>

            {/* Leave Meeting */}
            <button
              onClick={handleLeave}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#f87171] hover:bg-[#ef4444] text-white text-xs font-sofia-medium shadow-sm transition-colors"
            >
              <MdCallEnd size={16} />
              <span className="hidden sm:inline">Leave Meeting</span>
            </button>
          </div>
        </div>

        {/* Video Area */}
        <div className="flex-1 flex flex-col min-h-0">
          <VideoGrid
            onToggleMute={toggleMute}
            onToggleCamera={toggleCamera}
            onToggleScreenShare={toggleScreenShare}
          />
        </div>
      </div>

      {/* Right Sidebar (Chat / Participants) */}
      {(isChatOpen || isParticipantsOpen) && (
        <div className="w-80 flex flex-col gap-3 p-3 md:p-4 pl-0 overflow-y-auto">
          {isParticipantsOpen && (
            <ParticipantsList
              onClose={() => dispatch({ type: 'TOGGLE_PARTICIPANTS' })}
            />
          )}
          {isChatOpen && (
            <ChatPanel
              onSendMessage={sendChatMessage}
              onClose={() => dispatch({ type: 'TOGGLE_CHAT' })}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default function MeetingRoom() {
  return (
    <MeetingProvider>
      <MeetingRoomInner />
    </MeetingProvider>
  );
}
