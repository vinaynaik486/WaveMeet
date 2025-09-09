import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useMeeting } from '@/context/MeetingContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { MdDashboard, MdNotifications, MdVideocam, MdCalendarToday, MdSettings, MdPerson, MdChat, MdGroup, MdChecklist, MdLightMode, MdDarkMode, MdMenuOpen, MdMenu } from 'react-icons/md';
import NotificationDropdown, { NotificationBadge } from '@/components/notifications/NotificationDropdown';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function MeetingSidebar({ roomId: propRoomId }) {
  const { user } = useAuth();
  const { dispatch, state } = useMeeting();
  const roomId = propRoomId || state.activeRoomId;
  const navigate = useNavigate();
  const location = useLocation();
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Freeze all transitions while switching theme to prevent staggered color changes
    document.documentElement.classList.add('disable-transitions');
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', theme);
    // Re-enable transitions after paint
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.documentElement.classList.remove('disable-transitions');
      });
    });
  }, [theme]);

  useEffect(() => {
    if (!user) return;
    fetch(`${API}/api/notifications?userId=${user.uid}&unread=true`)
      .then(r => r.json())
      .then(d => setUnreadCount(d.unreadCount || 0))
      .catch(() => {});
  }, [user]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const topItems = [
    { id: 'dashboard', icon: MdDashboard, label: 'Dashboard', action: () => navigate('/dashboard', { state: { fromRoomId: roomId } }), active: location.pathname === '/dashboard' },
    { id: 'notifications', icon: MdNotifications, label: 'Notifications', action: () => setNotifOpen(!notifOpen), badge: unreadCount, active: notifOpen },
    { id: 'video', icon: MdVideocam, label: 'Meeting', action: () => roomId && navigate(`/meeting/${roomId}`), active: !!roomId && !notifOpen && location.pathname.includes('/meeting') },
    { id: 'calendar', icon: MdCalendarToday, label: 'Calendar', action: () => navigate('/calendar'), active: location.pathname === '/calendar' },
    { id: 'settings', icon: MdSettings, label: 'Settings', action: () => navigate(`/settings?roomId=${roomId}`), active: location.pathname === '/settings' },
  ];

  const handleSidebarAction = (type) => {
    if (!location.pathname.includes('/meeting/') && roomId) {
      navigate(`/meeting/${roomId}`);
      // Give a tiny delay for navigation to settle if needed, 
      // but dispatching directly usually works if context is persistent
      setTimeout(() => dispatch({ type }), 100);
    } else {
      dispatch({ type });
    }
  };

  const bottomItems = [
    { id: 'chat', icon: MdChat, label: 'Chat', action: () => handleSidebarAction('TOGGLE_CHAT'), active: state.isChatOpen },
    { id: 'participants', icon: MdGroup, label: 'People', action: () => handleSidebarAction('TOGGLE_PARTICIPANTS'), active: state.isParticipantsOpen },
    { id: 'tasks', icon: MdChecklist, label: 'Tasks', action: () => handleSidebarAction('TOGGLE_TASKS'), active: state.isTasksOpen },
  ];

  const activeBtnClass = "bg-gray-900 dark:bg-white/10 text-white border border-gray-800 dark:border-white/20 shadow-xl";
  const inactiveBtnClass = "text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 border border-transparent";

  return (
    <div 
      className={`${isExpanded ? 'w-64' : 'w-20'} flex flex-col items-center py-6 bg-[#fafafa] dark:bg-[#121222] rounded-2xl m-3 mr-0 relative border border-gray-200 dark:border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.08)] dark:shadow-[0_0_50px_rgba(0,0,0,0.3)] h-[calc(100vh-1.5rem)] transition-all duration-500 ease-in-out z-50 overflow-hidden`}
    >
      
      {/* Sidebar Header: Brand + Toggle */}
      <div className={`flex items-center h-12 mb-10 w-full transition-all duration-500 ${isExpanded ? 'px-5 justify-between' : 'justify-center'}`}>
        <div className={`flex items-center transition-all duration-500 ${isExpanded ? 'opacity-100 translate-x-0 w-auto mr-3' : 'opacity-0 -translate-x-4 w-0 overflow-hidden pointer-events-none'}`}>
          <span className="ml-5 text-gray-900 dark:text-white font-black text-2xl tracking-tighter whitespace-nowrap">
            WaveMeet
          </span>
        </div>
        
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-xl border border-white/5 bg-gray-900 dark:bg-white/10 text-white hover:scale-105 active:scale-95 flex-shrink-0"
        >
          {isExpanded ? <MdMenuOpen size={24} /> : <MdMenu size={24} />}
        </button>
      </div>

      {/* Navigation Items - Scrollable */}
      <div className={`flex-1 w-full overflow-y-auto custom-scrollbar-thin ${isExpanded ? 'px-4' : 'px-0'}`}>
        <div className={`flex flex-col gap-2.5 w-full transition-all ${isExpanded ? 'items-start' : 'items-center'}`}>
          {topItems.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.id} className="relative w-full flex justify-center">
                <Tooltip disabled={isExpanded}>
                  <TooltipTrigger asChild>
                    <button 
                      onClick={() => item.action && item.action()}
                      className={`h-12 rounded-2xl flex items-center transition-all duration-300 relative ${item.active ? activeBtnClass : inactiveBtnClass} ${isExpanded ? 'w-full px-4' : 'w-12 justify-center'}`}
                    >
                      <Icon size={22} className="flex-shrink-0" />
                      <span className={`font-bold text-sm tracking-tight whitespace-nowrap transition-all duration-500 ${isExpanded ? 'opacity-100 translate-x-0 w-auto ml-4' : 'opacity-0 translate-x-4 w-0 overflow-hidden pointer-events-none'}`}>
                        {item.label}
                      </span>
                      {item.active && !isExpanded && <div className="absolute left-[-16px] w-1.5 h-5 bg-gray-400 dark:bg-white/40 rounded-full animate-in fade-in duration-500" />}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="bg-[#121222] border-white/10 text-white font-medium">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
                {item.badge > 0 && <NotificationBadge count={item.badge} className={isExpanded ? 'right-4' : 'right-4 top-1'} />}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mx-auto h-px bg-gray-100 dark:bg-white/5 my-4 transition-all duration-500" style={{ width: isExpanded ? 'calc(100% - 2rem)' : '2.5rem' }} />

      {/* Meeting Room Specific Controls */}
      <div className={`flex flex-col gap-2.5 mb-6 w-full transition-all ${isExpanded ? 'px-4 items-start' : 'items-center'}`}>
        {bottomItems.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.id} className="relative w-full flex justify-center">
              <Tooltip disabled={isExpanded}>
                <TooltipTrigger asChild>
                  <button 
                    onClick={item.action}
                    className={`h-12 rounded-2xl flex items-center transition-all duration-300 relative ${item.active ? activeBtnClass : inactiveBtnClass} ${isExpanded ? 'w-full px-4' : 'w-12 justify-center'}`}
                  >
                    <Icon size={22} className="flex-shrink-0" />
                    <span className={`font-bold text-sm tracking-tight whitespace-nowrap transition-all duration-500 ${isExpanded ? 'opacity-100 translate-x-0 w-auto ml-4' : 'opacity-0 translate-x-4 w-0 overflow-hidden pointer-events-none'}`}>
                      {item.label}
                    </span>
                    {item.active && !isExpanded && <div className="absolute left-[-16px] w-1.5 h-5 bg-gray-400 dark:bg-white/40 rounded-full animate-in fade-in duration-500" />}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-[#121222] border-white/10 text-white font-medium">
                  {item.label}
                </TooltipContent>
              </Tooltip>
            </div>
          );
        })}
      </div>

      {/* Footer Area: User Profile & Theme */}
      <div className={`w-full flex flex-col gap-4 transition-all ${isExpanded ? 'px-4 items-stretch' : 'items-center'}`}>
        <div className={`flex items-center p-1.5 rounded-2xl transition-all duration-500 ${isExpanded ? 'bg-gray-50 dark:bg-white/5' : 'bg-transparent justify-center'}`}>
          <div className="w-11 h-11 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden border border-transparent dark:border-white/10 transition-all cursor-pointer shadow-lg flex-shrink-0">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <MdPerson className="text-white/40" size={22} />
            )}
          </div>
          <div className={`flex flex-col min-w-0 transition-all duration-500 ${isExpanded ? 'opacity-100 translate-x-0 w-auto ml-3' : 'opacity-0 translate-x-4 w-0 overflow-hidden pointer-events-none'}`}>
            <p className="text-xs font-black text-gray-900 dark:text-white truncate leading-none mb-1">{user?.displayName}</p>
            <p className="text-[10px] text-gray-400 font-bold truncate opacity-60">Pro Member</p>
          </div>
        </div>

        <button 
          onClick={toggleTheme} 
          className={`h-11 rounded-2xl flex items-center transition-all duration-500 border border-transparent ${isExpanded ? 'bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 px-4 w-full' : 'text-gray-400 hover:text-gray-900 dark:hover:text-white justify-center w-11'}`}
        >
          {theme === 'light' ? <MdDarkMode size={20} /> : <MdLightMode size={20} />}
          <span className={`font-bold text-sm tracking-tight whitespace-nowrap transition-all duration-500 ${isExpanded ? 'opacity-100 translate-x-0 w-auto ml-4' : 'opacity-0 translate-x-4 w-0 overflow-hidden pointer-events-none'}`}>
            {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
          </span>
        </button>
      </div>

      <NotificationDropdown isOpen={notifOpen} onClose={() => { setNotifOpen(false); setUnreadCount(0); }} />
    </div>
  );
}
