import React, { useState, useRef, useEffect } from 'react';
import { useMeeting } from '@/context/MeetingContext';
import { useAuth } from '@/context/AuthContext';
import { MdSend, MdClose } from 'react-icons/md';

export default function ChatPanel({ onSendMessage, onClose }) {
  const { state } = useMeeting();
  const { user } = useAuth();
  const { chatMessages } = state;
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSendMessage(input);
    setInput('');
  };

  return (
    <div className="flex-1 min-h-0 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
        <h3 className="text-sm font-semibold text-gray-900 font-sofia-medium">Room Chat</h3>
        <button onClick={onClose} className="w-6 h-6 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
          <MdClose className="text-gray-400" size={16} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {chatMessages.length === 0 && (
          <p className="text-gray-300 text-xs text-center mt-6 font-sofia-light">No messages yet. Say hello!</p>
        )}
        {chatMessages.map((msg, i) => {
          const isMe = msg.senderId === (user?.uid || 'anonymous');
          return (
            <div key={i} className={`flex items-start gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${isMe ? 'bg-gradient-to-br from-indigo-400 to-purple-500' : 'bg-gradient-to-br from-emerald-400 to-teal-500'}`}>
                <span className="text-[9px] font-bold text-white">{(isMe ? 'Y' : (msg.senderName || 'G')[0]).toUpperCase()}</span>
              </div>
              <div className={`max-w-[75%] ${isMe ? 'text-right' : 'text-left'}`}>
                <span className="text-[11px] font-semibold text-gray-700 font-sofia-medium">{isMe ? 'You' : msg.senderName}</span>
                <div className={`inline-block px-3 py-1.5 rounded-2xl text-sm font-sofia-light mt-0.5 ${isMe ? 'bg-indigo-50 text-indigo-800 rounded-tr-sm' : 'bg-gray-100 text-gray-700 rounded-tl-sm'}`}>{msg.message}</div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={handleSend} className="px-3 py-3 border-t border-gray-50">
        <div className="flex items-center gap-2 bg-gray-50 rounded-full px-4 py-2.5">
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type a message ..." className="flex-1 bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-300 font-sofia-light" />
          <button type="submit" disabled={!input.trim()} className="w-7 h-7 rounded-full bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-200 flex items-center justify-center transition-colors">
            <MdSend className="text-white" size={14} />
          </button>
        </div>
      </form>
    </div>
  );
}
