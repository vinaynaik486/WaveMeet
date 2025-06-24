import React from 'react';
import { useMeeting } from '@/context/MeetingContext';
import VideoTile from './VideoTile';
import MeetingControls from './MeetingControls';

export default function VideoGrid({ onToggleMute, onToggleCamera, onToggleScreenShare }) {
  const { state } = useMeeting();
  const { localStream, peers, isMuted, isCameraOff, isScreenSharing, screenStream } = state;

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-3">
      {/* Featured / Main Speaker */}
      <div className="flex-1 relative min-h-0">
        <VideoTile
          stream={isScreenSharing ? screenStream : localStream}
          userName="You"
          isMuted={isMuted}
          isCameraOff={isCameraOff}
          isLocal={true}
          isFeatured={true}
        />

        {/* Floating Controls on the featured video */}
        <MeetingControls
          onToggleMute={onToggleMute}
          onToggleCamera={onToggleCamera}
          onToggleScreenShare={onToggleScreenShare}
        />
      </div>

      {/* Participant Strip (bottom row) */}
      {peers.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 flex-shrink-0">
          {peers.slice(0, 4).map((peer) => (
            <div key={peer.socketId} className="w-44 md:w-52 flex-shrink-0">
              <VideoTile
                stream={peer.stream}
                userName={peer.userName || 'Guest'}
                isMuted={!peer.audioEnabled}
                isCameraOff={!peer.videoEnabled}
                isLocal={false}
                isFeatured={false}
              />
            </div>
          ))}

          {/* Overflow indicator (+N) */}
          {peers.length > 4 && (
            <div className="w-44 md:w-52 flex-shrink-0 bg-white rounded-2xl border border-gray-100 flex items-center justify-center shadow-sm">
              <div className="flex flex-col items-center gap-1">
                {/* Mini avatar grid */}
                <div className="grid grid-cols-3 gap-1">
                  {peers.slice(4, 10).map((peer) => (
                    <div
                      key={peer.socketId}
                      className="w-7 h-7 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center overflow-hidden"
                    >
                      <span className="text-[9px] font-bold text-gray-500">
                        {(peer.userName || 'G')[0].toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
                <span className="text-sm font-semibold text-gray-600 font-sofia-medium">
                  +{peers.length - 4}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
