import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useAuth } from '@/context/AuthContext';
import { MdNotifications, MdVideocam, MdChat, MdGroup, MdAccessTime, MdClose, MdDoneAll } from 'react-icons/md';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const ICONS = {
  join_request: MdGroup,
  meeting_invite: MdVideocam,
  message: MdChat,
  reminder: MdAccessTime,
  call: MdVideocam,
};

const COLORS = {
  join_request: 'bg-amber-50 text-amber-500',
  meeting_invite: 'bg-gray-50 text-gray-500',
  message: 'bg-green-50 text-green-500',
  reminder: 'bg-purple-50 text-purple-500',
  call: 'bg-red-50 text-red-500',
};

function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return 'Just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function NotificationDropdown({ isOpen, onClose }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    if (!isOpen || !user) return;
    fetch(`${API}/api/notifications?userId=${user.uid}`)
      .then(r => r.json())
      .then(d => { setNotifications(d.notifications || []); setUnreadCount(d.unreadCount || 0); })
      .catch(() => {});
  }, [isOpen, user]);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    if (isOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen, onClose]);

  const markRead = async (id) => {
    await fetch(`${API}/api/notifications/${id}/read`, { method: 'PUT' });
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    setUnreadCount(c => Math.max(0, c - 1));
  };

  const markAllRead = async () => {
    await fetch(`${API}/api/notifications/read-all`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.uid }),
    });
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  if (!isOpen) return null;

  // Render outside sidebar DOM via portal so it's never clipped
  return ReactDOM.createPortal(
    <div
      ref={ref}
      className="fixed left-24 top-20 w-80 bg-white dark:bg-[#121222] rounded-2xl shadow-2xl border border-gray-100 dark:border-white/10 z-[9999] overflow-hidden animate-in fade-in slide-in-from-left-2 duration-200"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-white/5">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white font-karla">Notifications</h3>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button onClick={markAllRead} title="Mark all read" className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
              <MdDoneAll className="text-gray-400" size={16} />
            </button>
          )}
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
            <MdClose className="text-gray-400" size={16} />
          </button>
        </div>
      </div>

      <div className="max-h-80 overflow-y-auto custom-scrollbar">
        {notifications.length === 0 ? (
          <div className="py-10 text-center">
            <MdNotifications className="mx-auto text-gray-200 dark:text-white/10 mb-2" size={32} />
            <p className="text-gray-400 dark:text-gray-500 text-xs font-karla">No notifications yet</p>
          </div>
        ) : (
          notifications.map(n => {
            const Icon = ICONS[n.type] || MdNotifications;
            const color = COLORS[n.type] || 'bg-gray-50 text-gray-500';
            return (
              <div
                key={n._id}
                onClick={() => !n.read && markRead(n._id)}
                className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer ${!n.read ? 'bg-gray-50/30 dark:bg-white/5' : ''}`}
              >
                <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                  <Icon size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-tight ${!n.read ? 'font-bold text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>{n.title}</p>
                  {n.body && <p className="text-xs text-gray-400 mt-0.5 truncate">{n.body}</p>}
                  <p className="text-[10px] text-gray-300 dark:text-white/20 mt-1">{timeAgo(n.createdAt)}</p>
                </div>
                {!n.read && <div className="w-2 h-2 rounded-full bg-gray-500 flex-shrink-0 mt-2" />}
              </div>
            );
          })
        )}
      </div>
    </div>,
    document.body
  );
}

export function NotificationBadge({ count }) {
  if (!count || count <= 0) return null;
  return (
    <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center animate-pulse z-10">
      <span className="text-[9px] text-white font-bold">{count > 9 ? '9+' : count}</span>
    </div>
  );
}
