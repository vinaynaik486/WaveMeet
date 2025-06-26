import React from 'react';
import { useMeeting } from '@/context/MeetingContext';
import { MdScreenShare, MdMic, MdMicOff } from 'react-icons/md';

export default function MeetingControls({
  onToggleMute,
  onToggleCamera,
  onToggleScreenShare,
}) {
  const { state } = useMeeting();
  const { isMuted, isScreenSharing } = state;

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
      {/* Screen Share */}
      <button
        onClick={onToggleScreenShare}
        title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
        className={`
          w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg
          ${isScreenSharing
            ? 'bg-indigo-500 text-white hover:bg-indigo-600'
            : 'bg-white/90 backdrop-blur-sm text-gray-700 hover:bg-white'
          }
        `}
      >
        <MdScreenShare size={20} />
      </button>

      {/* Mic Toggle */}
      <button
        onClick={onToggleMute}
        title={isMuted ? 'Unmute' : 'Mute'}
        className={`
          w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg
          ${isMuted
            ? 'bg-red-100 text-red-500 hover:bg-red-200'
            : 'bg-white/90 backdrop-blur-sm text-gray-700 hover:bg-white'
          }
        `}
      >
        {isMuted ? <MdMicOff size={20} /> : <MdMic size={20} />}
      </button>
    </div>
  );
}
