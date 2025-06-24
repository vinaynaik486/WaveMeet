import React, { useRef, useEffect } from 'react';
import { MdMicOff, MdPerson } from 'react-icons/md';

export default function VideoTile({ stream, userName, isMuted, isCameraOff, isLocal, isFeatured }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const showVideo = stream && !isCameraOff;

  if (isFeatured) {
    // ── Featured / Main Speaker Tile ───────────────────────
    return (
      <div className="relative w-full h-full bg-gray-900 rounded-2xl overflow-hidden shadow-lg">
        {showVideo ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={isLocal}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
            <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center">
              <MdPerson className="text-white/40" size={48} />
            </div>
          </div>
        )}

        {/* Name badge — top left */}
        <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/40 backdrop-blur-sm rounded-full px-3 py-1.5">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center flex-shrink-0">
            <span className="text-[10px] font-bold text-white">
              {(userName || 'U')[0].toUpperCase()}
            </span>
          </div>
          <span className="text-white text-sm font-medium font-sofia-medium">
            {userName}
          </span>
          {isMuted && (
            <div className="w-5 h-5 rounded-full bg-red-500/80 flex items-center justify-center">
              <MdMicOff className="text-white" size={12} />
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Small Participant Tile (strip) ─────────────────────
  return (
    <div className="relative bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 h-32 md:h-36">
      {showVideo ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
            <MdPerson className="text-white" size={24} />
          </div>
        </div>
      )}

      {/* Name + status overlay */}
      <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5 bg-black/30 backdrop-blur-sm rounded-full px-2 py-1">
          <div className="w-4 h-4 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center flex-shrink-0">
            <span className="text-[7px] font-bold text-white">
              {(userName || 'G')[0].toUpperCase()}
            </span>
          </div>
          <span className="text-white text-[11px] font-medium truncate max-w-[80px] font-sofia-medium">
            {userName}
          </span>
        </div>
        {isMuted && (
          <div className="w-5 h-5 rounded-full bg-red-500/70 flex items-center justify-center">
            <MdMicOff className="text-white" size={12} />
          </div>
        )}
      </div>
    </div>
  );
}
