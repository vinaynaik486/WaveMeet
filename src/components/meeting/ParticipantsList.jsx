import React, { useState } from 'react';
import { useMeeting } from '@/context/MeetingContext';
import { useSocket } from '@/context/SocketContext';
import { useAuth } from '@/context/AuthContext';
import { MdMic, MdMicOff, MdVideocam, MdVideocamOff, MdCheck, MdClose, MdGroup, MdPersonAdd } from 'react-icons/md';

export default function ParticipantsList({ roomId }) {
  const { state, dispatch } = useMeeting();
  const { socket } = useSocket();
  const { user } = useAuth();
  const { peers, isMuted, isCameraOff, pendingJoinRequests } = state;
  const [activeTab, setActiveTab] = useState('participants'); // 'participants' or 'requests'

  const handleApprove = (req) => {
    if (!socket) return;
    socket.emit('join-approve', { roomId, targetSocketId: req.socketId, approved: true });
    dispatch({ type: 'REMOVE_JOIN_REQUEST', payload: req.socketId });
  };

  const handleReject = (req) => {
    if (!socket) return;
    socket.emit('join-approve', { roomId, targetSocketId: req.socketId, approved: false });
    dispatch({ type: 'REMOVE_JOIN_REQUEST', payload: req.socketId });
  };

  return (
    <div className="bg-background rounded-2xl border border-gray-200 dark:border-white/5 flex flex-col h-full overflow-hidden shadow-lg transition-all duration-500">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-white/5 flex-shrink-0 bg-background dark:bg-transparent">
        <button 
          onClick={() => setActiveTab('participants')}
          className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-[13px] font-bold font-bold transition-all ${activeTab === 'participants' ? 'text-gray-900 border-b-2 border-gray-900 bg-gray-50/30 dark:bg-white/10' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-[#fafafa] dark:hover:bg-white/5'}`}
        >
          <MdGroup size={18} />
          <span>People ({peers.length + 1})</span>
        </button>
        <button 
          onClick={() => setActiveTab('requests')}
          className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-[13px] font-bold font-bold transition-all relative ${activeTab === 'requests' ? 'text-gray-900 border-b-2 border-gray-900 bg-gray-50/30 dark:bg-white/10' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5'}`}
        >
          <MdPersonAdd size={18} />
          <span>Requests</span>
          {pendingJoinRequests.length > 0 && (
            <span className="absolute top-2.5 right-4 w-4 h-4 bg-[#f4796a] text-white text-[9px] flex items-center justify-center rounded-full animate-pulse font-bold">
              {pendingJoinRequests.length}
            </span>
          )}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 custom-scrollbar">
        {activeTab === 'participants' ? (
          <>
            {/* You */}
            <div className="flex items-center gap-3 px-3 py-2 transition-all">
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border-2 border-white dark:border-gray-800 shadow-sm overflow-hidden bg-gray-500">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="Y" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[11px] font-bold text-white">Y</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] text-gray-900 dark:text-gray-100 font-bold truncate">You (Host)</p>
                <p className="text-[10px] text-gray-400 font-light uppercase tracking-wider">Organizer</p>
              </div>
              <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-white/10 px-2 py-1 rounded-lg border border-gray-100 dark:border-white/5">
                {isMuted ? <MdMicOff className="text-[#f4796a]" size={16} /> : <MdMic className="text-emerald-500" size={16} />}
                {isCameraOff ? <MdVideocamOff className="text-[#f4796a]" size={16} /> : <MdVideocam className="text-gray-500" size={16} />}
              </div>
            </div>

            {/* Others */}
            {peers.map((peer) => (
              <div key={peer.socketId} className="flex items-center gap-3 px-3 py-2 transition-all group">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border-2 border-white dark:border-gray-800 shadow-sm overflow-hidden bg-amber-400">
                  {peer.photoURL ? (
                    <img src={peer.photoURL} alt="P" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[11px] font-bold text-white">{(peer.userName || 'G')[0].toUpperCase()}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-gray-800 dark:text-gray-200 font-medium truncate">{peer.userName || 'Guest'}</p>
                </div>
                <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-white/10 px-2 py-1 rounded-lg border border-gray-100 dark:border-white/5 opacity-60 group-hover:opacity-100 transition-opacity">
                  {peer.audioEnabled === false ? <MdMicOff className="text-[#f4796a]" size={16} /> : <MdMic className="text-emerald-500" size={16} />}
                  {peer.videoEnabled === false ? <MdVideocamOff className="text-[#f4796a]" size={16} /> : <MdVideocam className="text-gray-500" size={16} />}
                </div>
              </div>
            ))}
            {peers.length === 0 && (activeTab === 'participants') && (
              <div className="flex flex-col items-center justify-center py-12 opacity-40">
                <MdGroup size={40} className="text-gray-300 mb-2" />
                <p className="text-gray-400 text-xs font-light italic">No other participants yet</p>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-3 px-1 pt-1">
            {pendingJoinRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 opacity-30">
                <MdPersonAdd size={40} className="text-gray-300 mb-2" />
                <p className="text-gray-500 dark:text-gray-400 text-xs font-medium">No pending requests</p>
              </div>
            ) : (
              pendingJoinRequests.map((req) => (
                <div key={req.socketId} className="flex items-center gap-3 p-3 bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-500/20 dark:to-purple-500/20 flex items-center justify-center flex-shrink-0 border border-gray-50 dark:border-gray-500/30">
                    <span className="text-sm font-bold text-gray-600 dark:text-gray-400">{(req.displayName || 'G')[0].toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-gray-900 dark:text-gray-100 font-bold truncate">{req.displayName}</p>
                    <p className="text-[10px] text-gray-400 font-light">Waiting to join</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleReject(req)}
                      className="w-8 h-8 rounded-full bg-[#f4796a] hover:bg-[#e8685a] flex items-center justify-center text-white shadow-md hover:shadow-lg transition-all active:scale-95"
                      title="Decline"
                    >
                      <MdClose size={18} />
                    </button>
                    <button 
                      onClick={() => handleApprove(req)}
                      className="w-8 h-8 rounded-full bg-gray-900 dark:bg-gray-600 hover:bg-gray-800 dark:hover:bg-gray-500 flex items-center justify-center text-white shadow-md hover:shadow-lg transition-all active:scale-95"
                      title="Accept"
                    >
                      <MdCheck size={18} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
