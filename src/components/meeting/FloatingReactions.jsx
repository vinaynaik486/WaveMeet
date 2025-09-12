import React, { useState, useEffect } from 'react';
import { useSocket } from '@/context/SocketContext';

export default function FloatingReactions() {
  const { socket } = useSocket();
  const [reactions, setReactions] = useState([]);

  useEffect(() => {
    if (!socket) return;

    const handleReaction = ({ emoji, userName }) => {
      const id = Math.random().toString(36).substr(2, 9);
      // Create a single reaction with the user's name
      const newReaction = {
        id,
        emoji,
        userName: userName || 'Someone',
        left: 24 + Math.random() * 48,   // 24–72 px from left edge
        delay: 0,
        duration: 3.5 + Math.random() * 1.5,
        scale: 0.8 + Math.random() * 0.3,
        drift: (Math.random() - 0.5) * 80,
      };

      setReactions(prev => [...prev, newReaction]);

      setTimeout(() => {
        setReactions(prev => prev.filter(r => r.id !== id));
      }, 5000);
    };

    socket.on('user-reaction', handleReaction);
    return () => socket.off('user-reaction', handleReaction);
  }, [socket]);

  return (
    <div className="absolute inset-0 pointer-events-none z-[100] overflow-hidden">
      {reactions.map((r) => (
        <div
          key={r.id}
          className="absolute flex flex-col items-center select-none"
          style={{
            bottom: '80px',          // start just above controls
            left: `${r.left}px`,
            animationName: 'floatUp',
            animationDelay: `${r.delay}s`,
            animationDuration: `${r.duration}s`,
            animationTimingFunction: 'ease-out',
            animationFillMode: 'forwards',
            '--drift': `${r.drift}px`,
          }}
        >
          {/* Glass Emoji Container */}
          <div className="w-14 h-14 rounded-full bg-white/10 dark:bg-black/20 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-2xl mb-1 transition-all">
            <span className="text-3xl" style={{ transform: `scale(${r.scale})` }}>{r.emoji}</span>
          </div>
          
          <span className="px-2 py-1 bg-black/40 backdrop-blur-md rounded-full text-[10px] font-black text-white whitespace-nowrap shadow-xl border border-white/10 animate-in fade-in duration-300">
            {r.userName}
          </span>
        </div>
      ))}
    </div>
  );
}
