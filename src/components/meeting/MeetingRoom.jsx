import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import WebRTCMeeting from './WebRTCMeeting';
import { 
  FaMicrophone, 
  FaMicrophoneSlash, 
  FaVideo, 
  FaVideoSlash, 
  FaDesktop, 
  FaStop, 
  FaComments, 
  FaTimes, 
  FaSignOutAlt,
  FaInfoCircle,
  FaCopy,
  FaChevronUp
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';

function MeetingRoom() {
  const { roomId } = useParams();
  const { user } = useAuth();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showRoomInfo, setShowRoomInfo] = useState(false);
  const [showVideoDropdown, setShowVideoDropdown] = useState(false);
  const [showAudioDropdown, setShowAudioDropdown] = useState(false);
  const [showScreenDropdown, setShowScreenDropdown] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const chatContainerRef = React.useRef(null);

  const {
    localVideoRef,
    remoteVideoRefs,
    participants,
    isMuted,
    isVideoOff,
    isScreenSharing,
    isJoining,
    roomId: meetingRoomId,
    toggleMute,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    exitMeeting
  } = WebRTCMeeting();

  const copyRoomCode = () => {
    navigator.clipboard.writeText(meetingRoomId);
    toast.success('Meeting code copied!');
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const message = {
      id: Date.now(),
      text: newMessage,
      sender: user?.displayName || 'You',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prevMessages => [...prevMessages, message]);
    setNewMessage('');

    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  const getGridClassName = () => {
    const totalParticipants = participants.length + 1; // Include local user
    
    // Mobile layout - always single column
    if (window.innerWidth < 768) {
      return 'grid-cols-1 gap-4';
    }
    
    // Desktop layouts based on participant count
    if (totalParticipants === 1) {
      return 'grid-cols-1 gap-4';
    } else if (totalParticipants === 2) {
      return 'grid-cols-2 gap-4';
    } else if (totalParticipants <= 4) {
      return 'grid-cols-2 gap-4';
    } else if (totalParticipants <= 6) {
      return 'grid-cols-3 gap-4';
    } else {
      return 'grid-cols-3 gap-4';
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      <div className="h-screen flex flex-col">
        {/* Main Content Area */}
        <div className={`flex-1 transition-all duration-300 ${isChatOpen ? 'md:w-3/4' : 'w-full'}`}>
          <div className="h-[calc(100vh-3rem)] p-4 md:p-8">
            {/* Video Grid Container */}
            <div className={`grid ${getGridClassName()} h-full max-w-7xl mx-auto gap-4`}>
              {/* Local Video */}
              <div className={`relative overflow-hidden transform transition-all duration-500 rounded-2xl ${
                isJoining ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
              }`}>
                {!isVideoOff || isScreenSharing ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover scale-x-[-1]"
                    />
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#1E1E1E]">
                    <div className="w-32 h-32 rounded-full bg-blue-500 flex items-center justify-center text-5xl font-bold">
                      {(user?.displayName || 'You').charAt(0).toUpperCase()}
                    </div>
                  </div>
                )}
                <div className="absolute bottom-4 left-4 bg-black/50 px-4 py-2 rounded-xl text-sm backdrop-blur-md flex items-center gap-3">
                  <span className="font-sofia-medium">{user?.displayName || 'You'}</span>
                </div>
              </div>

              {/* Remote Videos */}
              {participants.map((participant) => (
                <div
                  key={participant.id}
                  className="relative overflow-hidden rounded-2xl"
                >
                  <div className="w-full h-full flex items-center justify-center">
                    <video
                      ref={el => {
                        if (el) {
                          remoteVideoRefs.current[participant.id] = el;
                        }
                      }}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute bottom-4 left-4 bg-black/50 px-4 py-2 rounded-xl text-sm backdrop-blur-md">
                    <span className="font-sofia-medium">{participant.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Room Info Button */}
        <div className="fixed bottom-4 left-4 z-50">
          <div className="relative group">
            <button
              onClick={() => setShowRoomInfo(!showRoomInfo)}
              className="p-4 rounded-2xl backdrop-blur-md bg-[#1E1E1E]/80 hover:bg-opacity-90 transition-all shadow-lg"
              title="Meeting Info"
            >
              <FaInfoCircle size={20} />
            </button>
            {showRoomInfo && (
              <div className="absolute bottom-full left-0 mb-4 bg-[#1E1E1E]/95 backdrop-blur-md rounded-lg p-4 shadow-lg w-80">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Meeting Info</h3>
                  <button
                    onClick={() => setShowRoomInfo(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    <FaTimes size={16} />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Meeting Code</p>
                    <div className="flex items-center justify-between bg-[#2A2A2A] p-3 rounded">
                      <code className="text-base font-mono text-white select-all tracking-wider">
                        {meetingRoomId}
                      </code>
                      <button
                        onClick={copyRoomCode}
                        className="text-blue-400 hover:text-blue-300 transition-colors ml-3 p-1 hover:bg-[#3A3A3A] rounded"
                        title="Copy meeting code"
                      >
                        <FaCopy size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">
                    <p>Share this code with others to join the meeting</p>
                    <p className="mt-2">People who have the meeting code can join anytime</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-6 transition-all duration-500 delay-300 z-50 ${
          isJoining ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
        }`}>
          <div className="relative group">
            <div className="flex items-center">
              <button
                onClick={toggleMute}
                className={`p-4 rounded-l-2xl backdrop-blur-md ${
                  isMuted 
                  ? 'bg-red-500/80' 
                  : 'bg-[#1E1E1E]/80'
                } hover:bg-opacity-90 transition-all shadow-lg`}
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <FaMicrophoneSlash size={20} /> : <FaMicrophone size={20} />}
              </button>
              <button
                onClick={() => setShowAudioDropdown(!showAudioDropdown)}
                className={`h-full px-2 rounded-r-2xl backdrop-blur-md border-l border-gray-600/30 ${
                  isMuted 
                  ? 'bg-red-500/25' 
                  : 'bg-[#1E1E1E]/25'
                } hover:bg-opacity-90 transition-all`}
              >
                <div className={`transform transition-transform duration-200 ${showAudioDropdown ? 'rotate-180' : ''}`}>
                  <FaChevronUp size={12} />
                </div>
              </button>
            </div>
          </div>
          
          <div className="relative group">
            <div className="flex items-center">
              <button
                onClick={toggleVideo}
                className={`p-4 rounded-l-2xl backdrop-blur-md ${
                  isVideoOff 
                  ? 'bg-red-500/80' 
                  : 'bg-[#1E1E1E]/80'
                } hover:bg-opacity-90 transition-all shadow-lg`}
                title={isVideoOff ? "Turn on camera" : "Turn off camera"}
              >
                {isVideoOff ? <FaVideoSlash size={20} /> : <FaVideo size={20} />}
              </button>
              <button
                onClick={() => setShowVideoDropdown(!showVideoDropdown)}
                className={`h-full px-2 rounded-r-2xl backdrop-blur-md border-l border-gray-600/30 ${
                  isVideoOff 
                  ? 'bg-red-500/25' 
                  : 'bg-[#1E1E1E]/25'
                } hover:bg-opacity-90 transition-all`}
              >
                <div className={`transform transition-transform duration-200 ${showVideoDropdown ? 'rotate-180' : ''}`}>
                  <FaChevronUp size={12} />
                </div>
              </button>
            </div>
          </div>
          
          <div className="relative group">
            <div className="flex items-center">
              <button
                onClick={isScreenSharing ? stopScreenShare : startScreenShare}
                className={`p-4 rounded-l-2xl backdrop-blur-md ${
                  isScreenSharing 
                  ? 'bg-blue-500/80' 
                  : 'bg-[#1E1E1E]/80'
                } hover:bg-opacity-90 transition-all shadow-lg`}
                title={isScreenSharing ? "Stop sharing" : "Share screen"}
              >
                {isScreenSharing ? <FaStop size={20} /> : <FaDesktop size={20} />}
              </button>
              <button
                onClick={() => setShowScreenDropdown(!showScreenDropdown)}
                className={`h-full px-2 rounded-r-2xl backdrop-blur-md border-l border-gray-600/30 ${
                  isScreenSharing 
                  ? 'bg-blue-500/25' 
                  : 'bg-[#1E1E1E]/25'
                } hover:bg-opacity-90 transition-all`}
              >
                <div className={`transform transition-transform duration-200 ${showScreenDropdown ? 'rotate-180' : ''}`}>
                  <FaChevronUp size={12} />
                </div>
              </button>
            </div>
          </div>
          
          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className={`p-4 rounded-2xl backdrop-blur-md ${
              isChatOpen 
              ? 'bg-blue-500/80' 
              : 'bg-[#1E1E1E]/80'
            } hover:bg-opacity-90 transition-all shadow-lg`}
            title={isChatOpen ? "Close chat" : "Open chat"}
          >
            <FaComments size={20} />
          </button>
          
          <button
            onClick={exitMeeting}
            className="p-4 rounded-2xl bg-red-500/80 backdrop-blur-md hover:bg-opacity-90 transition-all shadow-lg"
            title="Leave meeting"
          >
            <FaSignOutAlt size={20} />
          </button>
        </div>

        {/* Chat Sidebar */}
        <div 
          className={`fixed top-0 right-0 h-[calc(100vh-7rem)] w-96 bg-[#1E1E1E]/80 backdrop-blur-md rounded-l-2xl overflow-hidden flex flex-col transition-all duration-300 ease-in-out transform ${
            isChatOpen 
              ? 'translate-x-0 opacity-100' 
              : 'translate-x-full opacity-0'
          }`}
          style={{
            zIndex: 10,
            marginTop: '2rem'
          }}
        >
          <div className="p-6 border-b border-gray-700/50 flex justify-between items-center">
            <h3 className="font-sofia-medium">Meeting Chat</h3>
            <button 
              onClick={() => setIsChatOpen(false)}
              className="text-gray-400 hover:text-white"
            >
              <FaTimes />
            </button>
          </div>
          <div 
            ref={chatContainerRef}
            className="flex-1 p-6 overflow-y-auto space-y-4"
            style={{
              maxHeight: 'calc(100% - 120px)',
              overflowY: 'auto',
              overflowX: 'hidden'
            }}
          >
            {messages.map((message) => (
              <div key={message.id} className="space-y-1">
                <div className="flex items-start gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-sm flex-shrink-0">
                    {message.sender.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-sofia-medium text-sm truncate">{message.sender}</span>
                      <span className="text-xs text-gray-400">{message.timestamp}</span>
                    </div>
                    <p className="text-sm text-gray-300 break-words">{message.text}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-700/50">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-[#2A2A2A]/80 backdrop-blur-sm text-white rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-sofia-light"
              />
              <button
                type="submit"
                className="bg-blue-500/80 backdrop-blur-sm hover:bg-opacity-90 text-white rounded-xl px-4 py-2 text-sm transition-colors font-sofia-medium"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default MeetingRoom; 