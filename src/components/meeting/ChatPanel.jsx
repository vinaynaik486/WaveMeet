import React, { useState, useRef, useEffect } from 'react';
import { useMeeting } from '@/context/MeetingContext';
import { useSocket } from '@/context/SocketContext';
import { useAuth } from '@/context/AuthContext';
import { MdSend, MdChatBubbleOutline, MdClose } from 'react-icons/md';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function ChatPanel({ onSendMessage, roomId }) {
  const { state, dispatch } = useMeeting();
  const { socket } = useSocket();
  const { user } = useAuth();
  const { chatMessages, typingUsers } = state;
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSendMessage(input.trim());
    setInput('');
  };

  const handleTyping = () => {
    if (socket) socket.emit('typing', { roomId, userName: user?.displayName || 'Guest' });
  };

  return (
    <TooltipProvider>
      <div className="bg-background rounded-3xl flex flex-col h-full overflow-hidden shadow-2xl border border-gray-200 dark:border-white/10 transition-all duration-500">
        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-gray-900 dark:text-white">
              <MdChatBubbleOutline size={20} />
            </div>
            <h3 className="text-[13px] text-gray-900 dark:text-white font-bold tracking-tight leading-none">Room Chat</h3>
          </div>
          <button
            onClick={() => dispatch({ type: 'TOGGLE_CHAT' })}
            className="w-8 h-8 rounded-xl bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white flex items-center justify-center transition-all active:scale-95 border border-transparent hover:border-gray-200 dark:hover:border-white/10"
          >
            <MdClose size={20} />
          </button>
        </div>

        {/* Messages */}
        <div className={`flex-1 overflow-y-auto px-6 py-6 custom-scrollbar ${chatMessages.length === 0 ? 'flex flex-col justify-center' : 'space-y-6'}`}>
          {chatMessages.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center py-0 opacity-30">
              <MdChatBubbleOutline size={64} className="text-gray-300 dark:text-gray-700 mb-4" />
              <p className="text-gray-400 text-sm font-medium italic">No messages yet</p>
            </div>
          )}
          {chatMessages.map((msg, i) => {
            if (msg.type === 'system') {
              return (
                <div key={i} className="flex justify-center my-3 animate-in fade-in duration-700">
                  <div className="text-[11px] font-karla italic text-gray-400 dark:text-gray-500 tracking-tight">
                    {msg.message}
                  </div>
                </div>
              );
            }

            const isMe = msg.senderId === user?.uid;
            const prevMsg = chatMessages[i - 1];
            const showHeader = !prevMsg || prevMsg.senderId !== msg.senderId;
            const timeStr = msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            return (
              <div key={i} className={`flex flex-col ${showHeader ? 'mt-1.5' : 'mt-[1px]'} ${isMe ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                {/* Timing above the component */}
                {showHeader && (
                  <div className="mb-1 px-2">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{timeStr}</span>
                  </div>
                )}

                <div className={`max-w-[85%] px-4 py-3 rounded-[1.5rem] shadow-sm transition-all ${isMe
                  ? 'bg-gray-900 text-white rounded-tr-sm'
                  : 'bg-gray-100 dark:bg-white/5 text-gray-800 dark:text-gray-200 rounded-tl-sm border border-gray-200/50 dark:border-white/5'
                  }`}>
                  {/* Person name inside - only for others */}
                  {showHeader && !isMe && (
                    <div className="text-[10px] font-black uppercase tracking-wider mb-1.5 opacity-60 text-left">
                      {msg.senderName || 'Guest'}
                    </div>
                  )}
                  {/* Message below the name */}
                  <div className={`text-[13px] font-medium leading-relaxed break-words overflow-hidden ${isMe ? 'text-right' : 'text-left'}`}>
                    {msg.message}
                  </div>
                </div>

                {!showHeader && (
                  <span className="text-[8px] text-gray-400 font-black mt-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {timeStr}
                  </span>
                )}
              </div>
            );
          })}
          {typingUsers.length > 0 && (
            <div className="flex items-center gap-2 text-gray-400 text-[10px] font-bold italic px-1">
              <span className="w-1 h-1 bg-gray-300 rounded-full animate-bounce" />
              {typingUsers.join(', ')} typing...
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input area - Unified Design */}
        <div className="px-4 py-4">
          <form onSubmit={handleSend} className="relative group">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleTyping}
              placeholder="Send a message"
              className="w-full pl-6 pr-14 py-4 rounded-full bg-background dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white outline-none placeholder:text-gray-400 dark:placeholder:text-white/30 font-medium focus:border-gray-300 dark:focus:border-white/20 transition-all shadow-inner"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center text-gray-400 dark:text-white/40 hover:text-gray-500 dark:hover:text-gray-400 disabled:opacity-30 transition-all active:scale-90"
            >
              <MdSend size={24} />
            </button>
          </form>
        </div>
      </div>
    </TooltipProvider>
  );
}
