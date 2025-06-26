import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useMeeting } from '@/context/MeetingContext';
import { useNavigate } from 'react-router-dom';
import {
  MdGridView,
  MdNotifications,
  MdVideocam,
  MdCalendarToday,
  MdSettings,
  MdPerson,
  MdChat,
  MdGroup,
} from 'react-icons/md';

export default function MeetingSidebar() {
  const { user } = useAuth();
  const { dispatch, state } = useMeeting();
  const navigate = useNavigate();
  const [activeItem, setActiveItem] = useState('video');

  const topItems = [
    { id: 'dashboard', icon: MdGridView, label: 'Dashboard', action: () => navigate('/') },
    { id: 'notifications', icon: MdNotifications, label: 'Notifications' },
    { id: 'video', icon: MdVideocam, label: 'Meeting' },
    { id: 'calendar', icon: MdCalendarToday, label: 'Calendar' },
    { id: 'settings', icon: MdSettings, label: 'Settings' },
  ];

  const bottomItems = [
    {
      id: 'chat',
      icon: MdChat,
      label: 'Chat',
      action: () => dispatch({ type: 'TOGGLE_CHAT' }),
      active: state.isChatOpen,
    },
    {
      id: 'participants',
      icon: MdGroup,
      label: 'People',
      action: () => dispatch({ type: 'TOGGLE_PARTICIPANTS' }),
      active: state.isParticipantsOpen,
    },
  ];

  return (
    <div className="w-16 flex flex-col items-center py-4 bg-[#1a1a2e] rounded-2xl m-3 mr-0">
      {/* Logo */}
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-6 shadow-lg">
        <MdVideocam className="text-white" size={20} />
      </div>

      {/* Top nav items */}
      <div className="flex flex-col items-center gap-1 flex-1">
        {topItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeItem === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveItem(item.id);
                if (item.action) item.action();
              }}
              title={item.label}
              className={`
                w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200
                ${isActive
                  ? 'bg-white/15 text-white'
                  : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                }
              `}
            >
              <Icon size={20} />
            </button>
          );
        })}
      </div>

      {/* Divider */}
      <div className="w-8 h-px bg-white/10 my-2" />

      {/* Bottom items (chat, participants) */}
      <div className="flex flex-col items-center gap-1 mb-3">
        {bottomItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={item.action}
              title={item.label}
              className={`
                w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200
                ${item.active
                  ? 'bg-indigo-500/30 text-indigo-300'
                  : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                }
              `}
            >
              <Icon size={20} />
            </button>
          );
        })}
      </div>

      {/* User avatar */}
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center overflow-hidden border-2 border-white/10">
        {user?.photoURL ? (
          <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
        ) : (
          <MdPerson className="text-white/60" size={18} />
        )}
      </div>
    </div>
  );
}
