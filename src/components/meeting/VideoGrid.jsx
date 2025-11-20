import React, { useState } from 'react';
import { useMeeting } from '@/context/MeetingContext';
import { useAuth } from '@/context/AuthContext';
import VideoTile from './VideoTile';
import MeetingControls from './MeetingControls';
import FloatingReactions from './FloatingReactions';

export default function VideoGrid({ onLeave, onToggleMute, onToggleCamera, onToggleScreenShare, roomId }) {
  const { state } = useMeeting();
  const { user } = useAuth();
  const { localStream, peers, isMuted, isCameraOff, isScreenSharing, screenStream } = state;
  const [pinnedId, setPinnedId] = useState(null);

  // If no other participants, show the local user full screen
  const hasParticipants = peers.length > 0;

  // Determine featured stream
  const pinnedPeer = pinnedId ? peers.find(p => p.socketId === pinnedId) : null;
  const featuredStream = pinnedPeer ? pinnedPeer.stream : (isScreenSharing ? screenStream : localStream);
  const featuredName = pinnedPeer ? (pinnedPeer.userName || 'Guest') : 'You';
  const featuredMuted = pinnedPeer ? !pinnedPeer.audioEnabled : isMuted;
  const featuredCamOff = pinnedPeer ? !pinnedPeer.videoEnabled : isCameraOff;

  // Strip peers (exclude pinned if pinned is a peer, include self if pinned is a peer)
  const stripPeers = pinnedPeer
    ? [{ socketId: 'local', userName: 'You', photoURL: user?.photoURL, stream: localStream, audioEnabled: !isMuted, videoEnabled: !isCameraOff }, ...peers.filter(p => p.socketId !== pinnedId)]
    : peers;

  const featuredPhoto = pinnedPeer ? pinnedPeer.photoURL : user?.photoURL;

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-2 w-full h-full relative">
      {/* Featured / Main Speaker — Full screen if no participants */}
      <div className={`relative min-h-0 transition-all duration-700 ease-in-out ${hasParticipants ? 'flex-[4]' : 'flex-1 h-full'}`}>
        <VideoTile
          stream={featuredStream}
          userName={featuredName}
          photoURL={featuredPhoto}
          isMuted={featuredMuted}
          isCameraOff={featuredCamOff}
          isLocal={!pinnedPeer}
          isFeatured={true}
          onPin={() => setPinnedId(null)}
          isPinned={pinnedId === null && hasParticipants}
        />

        <FloatingReactions />

        {/* Fixed controls for featured video */}
        <MeetingControls
          onLeave={onLeave}
          onToggleMute={onToggleMute}
          onToggleCamera={onToggleCamera}
          onToggleScreenShare={onToggleScreenShare}
          roomId={roomId}
        />
      </div>

      {/* Participant Strip — only visible if participants exist */}
      {hasParticipants && (
        <div className="flex gap-2 overflow-x-auto py-1 flex-shrink-0 min-h-[140px] bg-transparent custom-scrollbar px-0.5">
          {stripPeers.slice(0, 5).map((peer) => (
            <div key={peer.socketId} className="w-56 md:w-64 flex-shrink-0 animate-in fade-in zoom-in-95 duration-500">
              <VideoTile
                stream={peer.stream}
                userName={peer.userName || 'Guest'}
                photoURL={peer.photoURL}
                isMuted={peer.audioEnabled === false || (peer.socketId === 'local' && isMuted)}
                isCameraOff={peer.videoEnabled === false || (peer.socketId === 'local' && isCameraOff)}
                isLocal={peer.socketId === 'local'}
                isFeatured={false}
                onPin={() => setPinnedId(peer.socketId === 'local' ? null : peer.socketId)}
                isPinned={pinnedId === peer.socketId || (peer.socketId === 'local' && pinnedId === null)}
              />
            </div>
          ))}

          {/* Overflow (+N) */}
          {stripPeers.length > 5 && (
            <div className="w-48 flex-shrink-0 bg-white/5 backdrop-blur-xl rounded-[2rem] border border-white/10 flex items-center justify-center shadow-2xl h-full group hover:bg-white/10 transition-all">
              <div className="flex flex-col items-center gap-3">
                <div className="grid grid-cols-2 gap-1.5 p-1">
                  {stripPeers.slice(5, 9).map((peer) => (
                    <div key={peer.socketId} className="w-8 h-8 rounded-full bg-gray-500/20 border border-gray-500/30 flex items-center justify-center overflow-hidden shadow-sm">
                      <span className="text-[9px] font-bold text-gray-300">{(peer.userName || 'G')[0].toUpperCase()}</span>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-xl font-bold text-white font-bold tracking-tight">+{stripPeers.length - 5}</span>
                  <span className="text-[10px] text-white/40 font-medium uppercase tracking-widest">More</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
