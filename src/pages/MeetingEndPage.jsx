import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MdRefresh, MdHome, MdCheckCircle } from 'react-icons/md';

export default function MeetingEndPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const roomId = queryParams.get('roomId');

  const [timeLeft, setTimeLeft] = useState(60);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [navigate]);

  const progressPct = (timeLeft / 60) * 100;
  const strokeDasharray = 2 * Math.PI * 18; // Circumference for radius 18
  const strokeDashoffset = strokeDasharray * (1 - progressPct / 100);

  return (
    <div className="min-h-screen bg-[#f8f9fc] dark:bg-[#0a0a1a] font-karla flex items-center justify-center p-6 transition-colors duration-500 overflow-hidden relative">
      
      {/* Top Left Timer & Status */}
      <div className="absolute top-8 left-8 flex items-center gap-4 bg-white/80 dark:bg-white/5 backdrop-blur-xl px-5 py-3 rounded-2xl border border-white/20 shadow-xl animate-in slide-in-from-left duration-700">
        <div className="relative w-10 h-10 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90">
            <circle
              cx="20"
              cy="20"
              r="18"
              fill="transparent"
              stroke="currentColor"
              strokeWidth="3"
              className="text-gray-100 dark:text-white/10"
            />
            <circle
              cx="20"
              cy="20"
              r="18"
              fill="transparent"
              stroke="currentColor"
              strokeWidth="3"
              strokeDasharray={strokeDasharray}
              style={{ strokeDashoffset, transition: 'stroke-dashoffset 1s linear' }}
              className="text-gray-600 dark:text-gray-400"
            />
          </svg>
          <span className="absolute text-[10px] font-black text-gray-900 dark:text-white">{timeLeft}s</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[11px] font-black text-gray-900 dark:text-white uppercase tracking-wider leading-none">Returning to home screen</span>
          <span className="text-[9px] text-gray-400 font-bold mt-1 uppercase tracking-tighter opacity-60">Auto-navigating in {timeLeft} seconds</span>
        </div>
      </div>

      <div className="max-w-md w-full bg-white dark:bg-[#121222] rounded-[3rem] p-12 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] dark:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] border border-gray-100 dark:border-white/5 text-center animate-in zoom-in-95 duration-500 relative overflow-hidden">
        
        {/* Background Accent */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-gray-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl" />

        <div className="w-24 h-24 bg-emerald-500/10 text-emerald-500 rounded-[2rem] flex items-center justify-center mx-auto mb-10 shadow-inner relative group transition-transform duration-500 hover:scale-110">
          <MdCheckCircle size={56} />
        </div>

        <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-4 tracking-tight leading-tight">You've left the meeting</h1>
        <p className="text-gray-400 font-bold text-sm mb-12 px-4 leading-relaxed opacity-80">
          Your session has ended successfully. You can rejoin or go back to the home screen.
        </p>

        <div className="space-y-4 relative z-10">
          {roomId && (
            <button
              onClick={() => navigate(`/meeting/${roomId}`)}
              className="w-full group flex items-center justify-center gap-4 py-5 rounded-2xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black text-sm hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl shadow-gray-500/20"
            >
              <MdRefresh size={22} className="group-hover:rotate-180 transition-transform duration-700" />
              Rejoin Meeting
            </button>
          )}

          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center justify-center gap-4 py-5 rounded-2xl bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white font-black text-sm border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <MdHome size={22} />
            Return to the homescreen
          </button>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-50 dark:border-white/5 opacity-40">
           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">WaveMeet • Secure Video Conferencing</p>
        </div>
      </div>

    </div>
  );
}
