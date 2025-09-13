import React, { useState } from 'react';
import { useSocket } from '@/context/SocketContext';
import { useAuth } from '@/context/AuthContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const REACTIONS = [
  { emoji: '👍', label: 'Like' },
  { emoji: '👏', label: 'Clap' },
  { emoji: '😂', label: 'Laugh' },
  { emoji: '❤️', label: 'Love' },
  { emoji: '🔥', label: 'Fire' },
  { emoji: '🎉', label: 'Celebrate' },
  { emoji: '😮', label: 'Wow' },
  { emoji: '🤔', label: 'Think' }
];

export default function ReactionPicker({ roomId }) {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  const handlePick = (emoji) => {
    if (!socket) return;
    socket.emit('reaction', { roomId, emoji, userName: user?.displayName || 'Someone' });
  };

  return (
    <TooltipProvider>
      <div className="relative">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setOpen(!open)}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl bg-white/10 backdrop-blur-[20px] border border-white/20 text-white hover:bg-white/25 text-2xl relative group ${open ? 'ring-2 ring-gray-500/50' : ''}`}
            >
              <span className="group-hover:scale-125 transition-transform">😊</span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="bg-[#121222] text-white border-white/10">Reactions</TooltipContent>
        </Tooltip>

        {open && (
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-transparent backdrop-blur-[40px] rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.4)] border border-white/10 p-2.5 flex gap-1.5 z-50 animate-in zoom-in-90 slide-in-from-bottom-4 duration-300">
            {REACTIONS.map((item) => (
              <Tooltip key={item.label}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => handlePick(item.emoji)}
                    className="w-12 h-12 rounded-2xl hover:bg-white/10 flex items-center justify-center text-2xl transition-all duration-200 hover:scale-125 active:scale-90"
                  >
                    {item.emoji}
                  </button>
                </TooltipTrigger>
                <TooltipContent className="bg-[#121222] text-white text-[10px] font-karla-bold border-white/10">{item.label}</TooltipContent>
              </Tooltip>
            ))}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
