import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useMeeting } from '@/context/MeetingContext';
import { useSocket } from '@/context/SocketContext';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  MdVideocam, MdAdd, MdContentCopy, MdCheck, MdCalendarToday,
  MdAccessTime, MdArrowBack, MdClose, MdWarning, MdEdit, MdArrowForward, MdDelete
} from 'react-icons/md';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function Dashboard() {
  const { user } = useAuth();
  const { state, dispatch } = useMeeting();
  const { socket, disconnect } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();

  const [meetings, setMeetings] = useState([]);
  const [joinCode, setJoinCode] = useState('');
  const [copied, setCopied] = useState(null);
  const [showWarning, setShowWarning] = useState({ active: false, type: null, data: null });

  // fromRoomId set by MeetingSidebar when navigating here from inside a meeting
  const fromRoomId = location.state?.fromRoomId || null;
  const isInMeeting = state.joined || !!fromRoomId;

  useEffect(() => {
    if (!user) return;
    fetch(`${API_URL}/api/meetings?hostId=${user.uid}&status=scheduled`)
      .then(r => r.json())
      .then(d => setMeetings(d.meetings || []))
      .catch(() => {});
  }, [user]);

  // Properly tear down the current meeting session
  const leaveCurrent = () => {
    if (fromRoomId && socket) {
      socket.emit('leave-room', { roomId: fromRoomId.trim().toLowerCase() });
    }
    // Stop all local media tracks
    if (state.localStream) {
      state.localStream.getTracks().forEach(t => t.stop());
    }
    // Disconnect socket, reset context
    disconnect();
    dispatch({ type: 'RESET' });
  };

  const initiateNewMeeting = () => {
    if (isInMeeting) {
      setShowWarning({ active: true, type: 'new', data: null });
    } else {
      handleNewMeeting();
    }
  };

  const initiateJoin = (code) => {
    const c = (code || joinCode).trim();
    if (!c) return;
    if (isInMeeting) {
      setShowWarning({ active: true, type: 'join', data: c });
    } else {
      handleJoin(c);
    }
  };

  const handleNewMeeting = async () => {
    try {
      const res = await fetch(`${API_URL}/api/meetings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostId: user.uid, title: 'Quick Meeting' }),
      });
      const { meeting } = await res.json();
      leaveCurrent();                                    // ← cleanly disconnect first
      navigate(`/meeting/${meeting.roomId}`);            // then route to new room
    } catch (e) { console.error(e); }
  };

  const handleJoin = (code) => {
    leaveCurrent();                                      // ← cleanly disconnect first
    navigate(`/meeting/${code.toLowerCase()}`);
  };

  const handleCopy = (roomId) => {
    navigator.clipboard.writeText(roomId);
    setCopied(roomId);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDeleteMeeting = async (roomId) => {
    if (!window.confirm('Are you sure you want to delete this meeting?')) return;
    try {
      const res = await fetch(`${API_URL}/api/meetings/${roomId}`, { method: 'DELETE' });
      if (res.ok) {
        setMeetings(meetings.filter(m => m.roomId !== roomId));
      }
    } catch (e) { console.error('Delete failed:', e); }
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  const warningLabel = showWarning.type === 'new'
    ? 'create a new meeting'
    : `join "${showWarning.data}"`;

  return (
    <div className="min-h-screen bg-background font-karla transition-colors duration-500">
      <div className="max-w-5xl mx-auto px-6 py-12">

        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-6">
            <button
              onClick={() => fromRoomId ? navigate(`/meeting/${fromRoomId}`) : navigate(-1)}
              className="w-12 h-12 rounded-2xl bg-white dark:bg-[#121222] hover:bg-gray-100 dark:hover:bg-white/10 flex items-center justify-center shadow-sm border border-gray-100 dark:border-white/5 transition-all active:scale-95"
            >
              <MdArrowBack size={24} className="text-gray-600 dark:text-gray-400" />
            </button>
            <div>
              <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                Hello, {user?.displayName?.split(' ')[0] || 'there'}!
              </h1>
              <p className="text-sm text-gray-400 mt-1">Here's what's happening today.</p>
            </div>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-gray-900 dark:bg-white/10 flex items-center justify-center overflow-hidden shadow-xl border-4 border-white dark:border-white/5">
            {user?.photoURL
              ? <img src={user.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              : <span className="text-white font-black text-lg">{(user?.displayName || 'U')[0]}</span>}
          </div>
        </div>

        {/* Active meeting banner */}
        {fromRoomId && (
          <div className="flex items-center justify-between px-5 py-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-8 animate-in fade-in slide-in-from-top-2 duration-500">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
              <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                Meeting in progress — <span className="font-mono font-black">{fromRoomId}</span>
              </p>
            </div>
            <button
              onClick={() => navigate(`/meeting/${fromRoomId}`)}
              className="flex items-center gap-1.5 text-xs font-black text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 transition-colors"
            >
              Return <MdArrowForward size={16} />
            </button>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">

          {/* New Meeting */}
          <div className="bg-white dark:bg-[#121222] rounded-[2rem] p-8 shadow-2xl shadow-black/5 border border-gray-100 dark:border-white/5">
            <h3 className="text-xs text-gray-400 font-bold mb-6 uppercase tracking-widest ml-1">Create Meeting</h3>
            <button
              onClick={initiateNewMeeting}
              className="w-full group flex items-center justify-between px-6 py-4 rounded-2xl bg-gray-900 dark:bg-white/10 text-white font-bold text-sm hover:bg-black dark:hover:bg-white/20 transition-all shadow-xl active:scale-95 border border-white/5"
            >
              <span>New Meeting</span>
              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <MdAdd size={20} />
              </div>
            </button>
            <p className="text-center text-[10px] text-gray-400 mt-4 italic">
              {isInMeeting ? "You're in a meeting — this will replace it" : 'Start an instant meeting with one click'}
            </p>
          </div>

          {/* Join Meeting */}
          <div className="bg-white dark:bg-[#121222] rounded-[2rem] p-8 shadow-2xl shadow-black/5 border border-gray-100 dark:border-white/5">
            <h3 className="text-xs text-gray-400 font-bold mb-6 uppercase tracking-widest ml-1">Join Meeting</h3>
            <div className="flex gap-3">
              <div className="flex-1 relative group">
                <MdEdit
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-500 group-focus-within:text-gray-900 dark:group-focus-within:text-white transition-colors"
                  size={20}
                />
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && initiateJoin()}
                  placeholder="Enter Meeting ID"
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 text-sm outline-none focus:border-gray-900 dark:focus:border-white/30 text-gray-900 dark:text-white transition-all"
                />
              </div>
              <button
                onClick={() => initiateJoin()}
                disabled={!joinCode.trim()}
                className="px-8 py-4 rounded-2xl bg-gray-900 dark:bg-white/10 text-white text-sm font-bold hover:bg-black dark:hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-xl border border-white/5 active:scale-95"
              >
                Join
              </button>
            </div>
          </div>
        </div>

        {/* Upcoming Meetings */}
        <div className="bg-white dark:bg-[#121222] rounded-[2rem] p-8 shadow-2xl shadow-black/5 border border-gray-100 dark:border-white/5">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-black text-gray-900 dark:text-white">Upcoming Meetings</h3>
            <button
              onClick={() => navigate('/calendar')}
              className="px-4 py-2 rounded-xl bg-gray-50 dark:bg-white/5 text-xs text-gray-600 dark:text-gray-400 font-bold hover:bg-gray-100 dark:hover:bg-white/10 transition-all"
            >
              Full Calendar
            </button>
          </div>
          {meetings.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gray-50 dark:bg-white/5 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-gray-200 dark:text-gray-700">
                <MdCalendarToday size={40} />
              </div>
              <p className="text-gray-400 text-sm">Your schedule is clear</p>
              <p className="text-gray-300 dark:text-gray-600 text-xs mt-1">Ready for a productive day?</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {meetings.slice(0, 6).map((m) => (
                <div key={m._id} className="flex items-center gap-4 p-5 rounded-3xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 hover:border-gray-500/30 transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-white dark:bg-[#121222] shadow-sm flex items-center justify-center flex-shrink-0">
                    <MdVideocam className="text-gray-900 dark:text-white" size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-black text-gray-900 dark:text-white truncate leading-none mb-1.5">{m.title}</p>
                    <span className="flex items-center gap-1.5 text-xs text-gray-400">
                      <MdAccessTime size={14} />{formatDate(m.scheduledAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleCopy(m.roomId)} className="p-2.5 rounded-xl bg-white dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 shadow-sm border border-transparent hover:border-gray-100 transition-all">
                      {copied === m.roomId ? <MdCheck className="text-emerald-500" size={18} /> : <MdContentCopy className="text-gray-400" size={18} />}
                    </button>
                    <button onClick={() => handleDeleteMeeting(m.roomId)} className="p-2.5 rounded-xl bg-white dark:bg-white/5 hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-400 hover:text-red-500 shadow-sm border border-transparent hover:border-red-100 transition-all">
                      <MdDelete size={18} />
                    </button>
                    <button
                      onClick={() => initiateJoin(m.roomId)}
                      className="px-6 py-2.5 rounded-xl bg-gray-900 dark:bg-white/10 text-white text-xs font-bold hover:bg-black dark:hover:bg-white/20 transition-all shadow-sm active:scale-95 border border-white/5"
                    >
                      Join
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ──── Leave Existing Meeting Warning Modal ──── */}
        {showWarning.active && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#121222] rounded-[2.5rem] p-10 w-full max-w-md shadow-2xl border border-white/10 relative animate-in zoom-in-95 duration-300">
              <button
                onClick={() => setShowWarning({ active: false, type: null, data: null })}
                className="absolute top-6 right-6 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 transition-all"
              >
                <MdClose size={24} />
              </button>

              <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 mb-6 mx-auto">
                <MdWarning size={36} />
              </div>

              <h3 className="text-xl font-black text-gray-900 dark:text-white text-center mb-2">
                Leave Active Meeting?
              </h3>

              {fromRoomId && (
                <p className="text-xs text-center font-mono text-gray-400 bg-gray-50 dark:bg-white/5 px-4 py-2 rounded-xl mb-4">
                  {fromRoomId}
                </p>
              )}

              <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-8 leading-relaxed">
                You're currently in a meeting. Do you want to {warningLabel} and leave the current session?
              </p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={async () => {
                    setShowWarning({ active: false, type: null, data: null });
                    if (showWarning.type === 'new') await handleNewMeeting();
                    else handleJoin(showWarning.data);
                  }}
                  className="w-full py-4 rounded-2xl bg-gray-900 dark:bg-white/10 text-white text-sm font-bold shadow-xl hover:bg-black dark:hover:bg-white/20 transition-all active:scale-95 border border-white/5"
                >
                  Yes, Leave & Continue
                </button>
                <button
                  onClick={() => {
                    setShowWarning({ active: false, type: null, data: null });
                    if (fromRoomId) navigate(`/meeting/${fromRoomId}`);
                  }}
                  className="w-full py-4 rounded-2xl bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white text-sm font-bold hover:bg-gray-100 dark:hover:bg-white/10 transition-all active:scale-95"
                >
                  No, Return to Meeting
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
