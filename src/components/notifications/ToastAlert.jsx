import React, { useEffect, useState } from 'react';
import { MdClose, MdVideocam, MdChat, MdGroup, MdAccessTime } from 'react-icons/md';

const ICONS = { 
  join_request: MdGroup, 
  meeting_invite: MdVideocam, 
  message: MdChat, 
  reminder: MdAccessTime, 
  call: MdVideocam 
};

export default function ToastAlert({ notification, onDismiss }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!notification) return;
    setVisible(true);
    const t = setTimeout(() => { 
      setVisible(false); 
      setTimeout(onDismiss, 300); 
    }, 5000);
    return () => clearTimeout(t);
  }, [notification, onDismiss]);

  if (!notification) return null;

  const Icon = ICONS[notification.type] || MdVideocam;

  return (
    <div className={`fixed top-[158px] left-[90px] z-[100] transition-all duration-500 ease-out ${visible ? 'translate-x-0 opacity-100 scale-100' : '-translate-x-8 opacity-0 scale-90'}`}>
      <div className="bg-white dark:bg-[#121222] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-gray-100 dark:border-white/10 p-4 min-w-[320px] max-w-[400px] flex items-start gap-4 transition-all duration-500 relative">
        {/* Pointer arrow */}
        <div className="absolute left-[-6px] top-5 w-3 h-3 bg-white dark:bg-[#121222] border-l border-b border-gray-100 dark:border-white/10 rotate-45" />
        
        <div className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-gray-500/10 flex items-center justify-center flex-shrink-0 shadow-sm border border-gray-100/50 dark:border-gray-500/20">
          <Icon className="text-gray-500 dark:text-gray-400" size={24} />
        </div>
        <div className="flex-1 min-w-0 py-0.5">
          <p className="text-[14px] font-black text-gray-900 dark:text-white font-karla-bold leading-tight tracking-tight">{notification.title}</p>
          {notification.body && <p className="text-[12px] text-gray-500 dark:text-gray-400 font-karla-medium mt-1.5 leading-relaxed">{notification.body}</p>}
        </div>
        <button 
          onClick={() => { setVisible(false); setTimeout(onDismiss, 300); }} 
          className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-colors flex-shrink-0 group"
        >
          <MdClose className="text-gray-300 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-white transition-colors" size={18} />
        </button>
      </div>
    </div>
  );
}
