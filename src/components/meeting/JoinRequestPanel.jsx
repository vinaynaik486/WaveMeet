import React from 'react';
import { useMeeting } from '@/context/MeetingContext';
import { useSocket } from '@/context/SocketContext';
import { MdClose, MdCheck } from 'react-icons/md';

export default function JoinRequestPanel({ roomId, onClose }) {
  const { state, dispatch } = useMeeting();
  const { socket } = useSocket();
  const { pendingJoinRequests } = state;

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

  if (pendingJoinRequests.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl flex-shrink-0">
      <div className="px-5 pt-5 pb-2">
        <h3 className="text-[15px] font-bold text-gray-900 font-karla-bold">Request to Join</h3>
      </div>
      <div className="px-5 pb-4 space-y-3">
        {pendingJoinRequests.map((req) => (
          <div key={req.socketId} className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-300 to-orange-400 flex items-center justify-center flex-shrink-0 overflow-hidden">
              <span className="text-xs font-bold text-white">{(req.displayName || 'G')[0].toUpperCase()}</span>
            </div>
            <span className="flex-1 text-[13px] text-gray-800 font-karla-medium">{req.displayName}</span>
            {/* Reject — coral/salmon circle */}
            <button onClick={() => handleReject(req)} className="w-8 h-8 rounded-full bg-[#f4796a] hover:bg-[#e8685a] flex items-center justify-center transition-colors">
              <MdClose className="text-white" size={16} />
            </button>
            {/* Accept — dark circle */}
            <button onClick={() => handleApprove(req)} className="w-8 h-8 rounded-full bg-[#3a3a4a] hover:bg-[#2a2a3a] flex items-center justify-center transition-colors">
              <MdCheck className="text-white" size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
