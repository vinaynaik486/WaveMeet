import React from 'react';
import { useMeeting } from '@/context/MeetingContext';
import { useAuth } from '@/context/AuthContext';
import { MdClose, MdMic, MdMicOff, MdVideocam, MdVideocamOff, MdPerson } from 'react-icons/md';

export default function ParticipantsList({ onClose }) {
  const { state } = useMeeting();
  const { user } = useAuth();
  const { peers, isMuted, isCameraOff } = state;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden max-h-[50%]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
        <h3 className="text-sm font-semibold text-gray-900 font-sofia-medium">Participants ({peers.length + 1})</h3>
        <button onClick={onClose} className="w-6 h-6 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
          <MdClose className="text-gray-400" size={16} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-gray-50 transition-colors">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
            ) : (
              <MdPerson className="text-white" size={18} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-sm font-medium text-gray-800 truncate block font-sofia-medium">
              {user?.displayName || 'You'} <span className="text-gray-400 font-normal font-sofia-light">(You)</span>
            </span>
          </div>
          <div className="flex items-center gap-1">
            {isMuted ? <MdMicOff className="text-red-400" size={16} /> : <MdMic className="text-gray-400" size={16} />}
            {isCameraOff ? <MdVideocamOff className="text-red-400" size={16} /> : <MdVideocam className="text-gray-400" size={16} />}
          </div>
        </div>
        {peers.map((peer) => (
          <div key={peer.socketId} className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-gray-50 transition-colors">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-white">{(peer.userName || 'G')[0].toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium text-gray-800 truncate block font-sofia-medium">{peer.userName || 'Guest'}</span>
            </div>
            <div className="flex items-center gap-1">
              {!peer.audioEnabled ? <MdMicOff className="text-red-400" size={16} /> : <MdMic className="text-gray-400" size={16} />}
              {!peer.videoEnabled ? <MdVideocamOff className="text-red-400" size={16} /> : <MdVideocam className="text-gray-400" size={16} />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
