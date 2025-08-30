import React, { useRef, useEffect, useState } from 'react';
import { MdMicOff, MdPerson, MdPushPin } from 'react-icons/md';

export default function VideoTile({ stream, userName, photoURL, isMuted, isCameraOff, isLocal, isFeatured, onPin, isPinned }) {
  const videoRef = useRef(null);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const showVideo = stream && !isCameraOff;

  const handlePin = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (onPin) onPin();
  };

  return (
    <div
      className={`relative rounded-[2rem] overflow-hidden shadow-2xl group transition-all duration-500 border border-gray-200 dark:border-white/5 ${isFeatured ? 'w-full h-full bg-[#fafafa] dark:bg-[#0a0a1a]' : 'h-full bg-[#fafafa] dark:bg-white/5 backdrop-blur-sm'}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {showVideo ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className={`w-full h-full transition-transform duration-700 ${isFeatured ? 'object-contain bg-[#050505]' : 'object-cover'}`}
        />
      ) : (
        <div className={`w-full h-full flex items-center justify-center relative overflow-hidden ${isFeatured ? 'bg-[#fafafa] dark:bg-[#0a0a1a]' : 'bg-[#fafafa] dark:bg-gray-900/40'}`}>
          {photoURL && (
            <div
              className="absolute inset-0 opacity-40 blur-3xl scale-125 transition-transform duration-1000 group-hover:scale-150"
              style={{ backgroundImage: `url(${photoURL})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
            />
          )}
          <div className={`${isFeatured ? 'w-28 h-28' : 'w-16 h-16'} relative z-10 rounded-full flex items-center justify-center backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden transition-all duration-500`}>
            {photoURL ? (
              <img src={photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                <MdPerson className="text-white/40" size={isFeatured ? 48 : 24} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Name Badge */}
      <div className={`absolute ${isFeatured ? 'top-6 left-6' : 'top-3 left-3'} flex items-center gap-3 bg-black/40 backdrop-blur-[20px] border border-white/10 rounded-full px-4 py-2 shadow-2xl transition-all duration-300 z-10`}>
        <span className={`text-white font-bold tracking-tight ${isFeatured ? 'text-sm' : 'text-[11px]'}`}>
          {userName} {isLocal && '(You)'}
        </span>
        {isMuted && (
          <div className="w-5 h-5 rounded-full bg-red-500/80 flex items-center justify-center shadow-lg border border-white/20">
            <MdMicOff className="text-white" size={12} />
          </div>
        )}
      </div>

      {/* Pin Button — always shown for non-featured, hover for featured */}
      <button
        onClick={handlePin}
        className={`absolute ${isFeatured ? 'top-6 right-6' : 'bottom-3 right-3'} w-10 h-10 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 z-20 border border-white/10 backdrop-blur-md
          ${isPinned
            ? 'bg-gray-900 dark:bg-white/20 text-white opacity-100'
            : 'bg-white/10 text-white opacity-0 group-hover:opacity-100 hover:bg-white/30'
          }`}
      >
        <MdPushPin
          size={20}
          className={`transition-transform duration-300 ${isPinned ? 'rotate-45 scale-110' : 'rotate-[30deg]'}`}
        />
      </button>

      {/* Shadow Overlay */}
      {isFeatured && (
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
      )}
    </div>
  );
}
