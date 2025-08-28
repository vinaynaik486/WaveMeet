import React from 'react';
import { useMeeting } from '@/context/MeetingContext';
import { MdScreenShare, MdMic, MdMicOff, MdVideocam, MdVideocamOff, MdCallEnd } from 'react-icons/md';
import ReactionPicker from './ReactionPicker';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function MeetingControls({ onLeave, onToggleMute, onToggleCamera, onToggleScreenShare, roomId }) {
  const { state } = useMeeting();
  const { isMuted, isCameraOff, isScreenSharing, isRecording } = state;

  return (
    <TooltipProvider>
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 z-50">
        {/* Recording indicator */}
        {isRecording && (
          <div className="flex items-center gap-2 bg-red-500/10 backdrop-blur-md rounded-full px-4 py-2 mr-2 border border-red-500/20 shadow-xl animate-in slide-in-from-bottom-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-red-500 text-xs font-karla-bold uppercase tracking-wider">Recording</span>
          </div>
        )}

        {/* Mic */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button onClick={onToggleMute}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl backdrop-blur-xl border border-white/20 ${isMuted ? 'bg-red-500 text-white shadow-red-500/30 ring-4 ring-red-500/10' : 'bg-white/10 text-white hover:bg-white/20'}`}>
              {isMuted ? <MdMicOff size={24} /> : <MdMic size={24} />}
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="bg-[#121222] border-white/10 text-white font-karla-medium">{isMuted ? 'Unmute' : 'Mute'}</TooltipContent>
        </Tooltip>

        {/* Camera */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button onClick={onToggleCamera}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl backdrop-blur-xl border border-white/20 ${isCameraOff ? 'bg-red-500 text-white shadow-red-500/30 ring-4 ring-red-500/10' : 'bg-white/10 text-white hover:bg-white/20'}`}>
              {isCameraOff ? <MdVideocamOff size={24} /> : <MdVideocam size={24} />}
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="bg-[#121222] border-white/10 text-white font-karla-medium">{isCameraOff ? 'Turn on camera' : 'Turn off camera'}</TooltipContent>
        </Tooltip>

        {/* Reactions - Centered in the middle of controls */}
        <ReactionPicker roomId={roomId} />

        {/* Screen Share */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button onClick={onToggleScreenShare}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl backdrop-blur-xl border border-white/20 ${isScreenSharing ? 'bg-gray-900 dark:bg-white/20 text-white shadow-black/30' : 'bg-white/10 text-white hover:bg-white/20'}`}>
              <MdScreenShare size={24} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="bg-[#121222] border-white/10 text-white font-karla-medium">Share Screen</TooltipContent>
        </Tooltip>

        {/* Divider */}
        <div className="w-px h-8 bg-white/20 mx-2" />
        
        {/* Leave Meeting */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button onClick={onLeave}
              className="px-6 h-14 rounded-full flex items-center gap-2.5 transition-all duration-300 shadow-2xl backdrop-blur-xl border border-red-500/30 bg-red-500 hover:bg-red-600 text-white shadow-red-500/30 hover:scale-105 active:scale-95">
              <MdCallEnd size={22} />
              <span className="font-karla-bold text-sm">Leave</span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="bg-[#121222] border-white/10 text-white font-karla-medium">Leave Meeting</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
