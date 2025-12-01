import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { MdChevronLeft, MdChevronRight, MdAdd, MdVideocam, MdAccessTime, MdArrowBack, MdClose, MdCheck, MdError, MdPerson, MdContentCopy, MdShare, MdDelete } from 'react-icons/md';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const APP_URL = window.location.origin;
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MO = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function CalendarPage() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [date, setDate] = useState(new Date());
  const [meetings, setMeetings] = useState([]);
  const [selDay, setSelDay] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title:'', date:'', time:'', duration:60 });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  
  const yr = date.getFullYear(), mo = date.getMonth();
  const today = new Date();
  today.setHours(0,0,0,0);

  const fetchMeetings = () => {
    if (!user) return;
    fetch(`${API}/api/calendar?hostId=${user.uid}&month=${mo+1}&year=${yr}`)
      .then(r => r.json())
      .then(d => setMeetings(d.meetings || []))
      .catch(console.error);
  };

  useEffect(() => { fetchMeetings(); }, [user, mo, yr]);

  const firstDay = new Date(yr, mo, 1).getDay();
  const dim = new Date(yr, mo+1, 0).getDate();
  const dayMtgs = (d) => meetings.filter(m => new Date(m.scheduledAt).getDate() === d);

  const handleCreate = async (e) => {
    if (e) e.preventDefault();
    if (!form.title || !form.date || !form.time) return;

    const scheduledAt = new Date(`${form.date}T${form.time}`);
    if (scheduledAt < new Date()) {
      setError('Meeting time cannot be in the past');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API}/api/meetings`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ 
          hostId: user.uid, 
          title: form.title, 
          scheduledAt: scheduledAt.toISOString(), 
          duration: form.duration 
        }) 
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => { setSaved(false); setShowModal(false); }, 1500);
        setForm({ title: '', date: '', time: '', duration: 60 });
        fetchMeetings();
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const copyLink = (roomId) => {
    const link = `${APP_URL}/meeting/${roomId}`;
    navigator.clipboard.writeText(link);
    setCopiedId(roomId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (roomId) => {
    if (!window.confirm('Delete this meeting?')) return;
    try {
      const res = await fetch(`${API}/api/meetings/${roomId}`, { method: 'DELETE' });
      if (res.ok) setMeetings(meetings.filter(m => m.roomId !== roomId));
    } catch (e) { console.error(e); }
  };

  const getTodayISO = () => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  };

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a1a] font-karla transition-colors duration-500">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => nav(-1)} 
              className="w-11 h-11 rounded-2xl bg-white dark:bg-[#121222] hover:bg-gray-100 dark:hover:bg-white/10 flex items-center justify-center shadow-sm border border-gray-100 dark:border-white/5 transition-all active:scale-95"
            >
              <MdArrowBack size={22} className="text-gray-600 dark:text-gray-400" />
            </button>
            <div>
              <h1 className="text-2xl text-gray-900 dark:text-white font-bold tracking-tight">Calendar</h1>
              <p className="text-sm text-gray-400 font-medium mt-0.5">Manage your scheduled meetings</p>
            </div>
          </div>
          <button 
            onClick={() => {
              setForm({ ...form, date: getTodayISO() });
              setShowModal(true);
            }} 
            className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gray-900 dark:bg-white/10 hover:bg-black dark:hover:bg-white/20 text-white text-sm font-bold shadow-xl shadow-black/10 transition-all active:scale-95 border border-white/5"
          >
            <MdAdd size={20}/>
            <span>Schedule Meeting</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar Grid */}
          <div className="lg:col-span-2 bg-white dark:bg-[#121222] rounded-[2rem] p-8 shadow-2xl shadow-black/5 border border-gray-100 dark:border-white/5 transition-all duration-500">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl text-gray-900 dark:text-white font-bold">{MO[mo]} {yr}</h2>
              <div className="flex gap-2">
                <button onClick={() => setDate(new Date(yr, mo - 1, 1))} className="p-2.5 rounded-xl bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-gray-400 transition-all"><MdChevronLeft size={24}/></button>
                <button onClick={() => setDate(new Date(yr, mo + 1, 1))} className="p-2.5 rounded-xl bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-gray-400 transition-all"><MdChevronRight size={24}/></button>
              </div>
            </div>
            
            <div className="grid grid-cols-7 gap-2 mb-4">
              {DAYS.map(d => <div key={d} className="text-center text-[11px] text-gray-400 font-bold uppercase tracking-widest py-2">{d}</div>)}
            </div>
            
            <div className="grid grid-cols-7 gap-3">
              {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} className="aspect-square" />)}
              {Array.from({ length: dim }, (_, i) => i + 1).map(day => {
                const dm = dayMtgs(day); 
                const cellDate = new Date(yr, mo, day);
                const isToday = today.getTime() === cellDate.getTime();
                const isPast = cellDate < today;
                const isSelected = selDay === day;
                
                return (
                  <button 
                    key={day} 
                    onClick={() => {
                      if (isPast) return;
                      setSelDay(day === selDay ? null : day);
                    }} 
                    className={`aspect-square rounded-[1.5rem] flex flex-col items-center justify-center gap-1.5 transition-all relative ${isToday ? 'bg-gray-900 text-white shadow-xl shadow-black/40 scale-105 z-10' : isSelected ? 'bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white ring-2 ring-gray-900/50 dark:ring-white/50' : isPast ? 'opacity-20 cursor-not-allowed' : 'hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300 border border-gray-100 dark:border-white/5'}`}
                  >
                    <span className="text-base font-black">{day}</span>
                    {dm.length > 0 && (
                      <div className={`flex items-center justify-center w-5 h-5 rounded-lg ${isToday ? 'bg-white/20' : 'bg-gray-900/10 dark:bg-white/10'} transition-colors`}>
                        <MdPerson size={14} className={isToday ? 'text-white' : 'text-gray-900 dark:text-white'} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Agenda Side Panel */}
          <div className="bg-white dark:bg-[#121222] rounded-[2rem] p-8 shadow-2xl shadow-black/5 border border-gray-100 dark:border-white/5 transition-all duration-500 overflow-y-auto max-h-[600px] custom-scrollbar">
            <h3 className="text-lg text-gray-900 dark:text-white font-bold mb-6">
              {selDay ? `${MO[mo]} ${selDay}` : 'Upcoming Meetings'}
            </h3>
            <div className="space-y-6">
              {dayMtgs(selDay || today.getDate()).length === 0 ? (
                <div className="text-center py-12 bg-gray-50 dark:bg-white/5 rounded-[2rem] border border-dashed border-gray-200 dark:border-white/10">
                  <div className="w-16 h-16 bg-white dark:bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-4 text-gray-300 shadow-sm">
                    <MdVideocam size={32} />
                  </div>
                  <p className="text-gray-400 text-sm font-medium">No meetings scheduled</p>
                </div>
              ) : (
                dayMtgs(selDay || today.getDate()).map(m => (
                  <div key={m._id} className="group p-6 rounded-[2rem] bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 hover:border-gray-900/30 dark:hover:border-white/30 transition-all duration-300 shadow-sm hover:shadow-xl">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-gray-900 dark:bg-white/10 text-white flex items-center justify-center shadow-lg">
                        <MdVideocam size={24} />
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] font-black bg-emerald-500/10 text-emerald-600 px-3 py-1.5 rounded-xl uppercase tracking-widest">Active</span>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{m.duration} mins</p>
                      </div>
                    </div>
                    
                    <h4 className="text-base font-black text-gray-900 dark:text-white mb-2 leading-tight">{m.title}</h4>
                    
                    <div className="flex items-center gap-2 text-xs text-gray-400 font-bold mb-5">
                      <MdAccessTime size={16} className="text-gray-400"/>
                      <span>{new Date(m.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    <div className="p-3 bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 mb-6 group-hover:bg-gray-50 dark:group-hover:bg-white/10 transition-all">
                      <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1.5 ml-1">Meeting ID</p>
                      <div className="flex items-center justify-between gap-2">
                        <code className="text-xs font-bold text-gray-900 dark:text-white truncate">{m.roomId}</code>
                        <button 
                          onClick={() => copyLink(m.roomId)} 
                          className={`p-2 rounded-xl transition-all ${copiedId === m.roomId ? 'bg-emerald-500 text-white' : 'hover:bg-gray-900 dark:hover:bg-white/20 text-gray-400 dark:text-gray-500 hover:text-white'}`}
                        >
                          {copiedId === m.roomId ? <MdCheck size={16}/> : <MdContentCopy size={16}/>}
                        </button>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button onClick={() => nav(`/meeting/${m.roomId}`)} className="flex-1 py-3.5 rounded-2xl bg-gray-900 dark:bg-white/10 text-white text-xs font-black hover:bg-black dark:hover:bg-white/20 transition-all shadow-xl shadow-black/10 border border-white/5">Start Now</button>
                      <button 
                        onClick={() => handleDelete(m.roomId)}
                        className="w-12 h-12 rounded-2xl bg-white dark:bg-white/5 text-gray-400 hover:text-red-500 flex items-center justify-center border border-gray-200 dark:border-white/10 hover:border-red-500/50 transition-all shadow-sm"
                      >
                        <MdDelete size={20}/>
                      </button>
                      <button 
                        onClick={() => {
                          if (navigator.share) {
                            navigator.share({ title: m.title, text: `Join my WaveMeet: ${m.title}`, url: `${APP_URL}/meeting/${m.roomId}` });
                          } else {
                            copyLink(m.roomId);
                          }
                        }}
                        className="w-12 h-12 rounded-2xl bg-white dark:bg-white/5 text-gray-900 dark:text-white flex items-center justify-center border border-gray-200 dark:border-white/10 hover:border-gray-900 dark:hover:border-white/40 transition-all shadow-sm"
                      >
                        <MdShare size={20}/>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Schedule Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-[#121222] rounded-[3rem] p-10 w-full max-w-md shadow-2xl border border-white/10 animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gray-900 dark:bg-white/10 flex items-center justify-center text-white shadow-xl">
                    <MdAdd size={28}/>
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter">New Meet</h3>
                </div>
                <button onClick={() => setShowModal(false)} className="p-3 rounded-2xl hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 transition-all"><MdClose size={24}/></button>
              </div>
              <form onSubmit={handleCreate} className="space-y-8">
                {error && (
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/10 text-red-500 border border-red-500/20 text-xs font-black animate-in slide-in-from-top-2">
                    <MdError size={20}/>
                    <span>{error}</span>
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-[10px] text-gray-400 font-black mb-1 ml-1 uppercase tracking-widest block">Topic Name</label>
                  <input type="text" placeholder="Product Review..." value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full px-6 py-4 rounded-[1.5rem] bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 text-gray-900 dark:text-white text-sm outline-none font-bold focus:border-gray-500 focus:bg-white dark:focus:bg-white/10 transition-all" required />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] text-gray-400 font-black mb-1 ml-1 uppercase tracking-widest block">Start Date</label>
                    <input type="date" min={getTodayISO()} value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="w-full px-6 py-4 rounded-[1.5rem] bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 text-gray-900 dark:text-white text-sm outline-none font-bold focus:border-gray-500 transition-all" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-gray-400 font-black mb-1 ml-1 uppercase tracking-widest block">Start Time</label>
                    <input type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} className="w-full px-6 py-4 rounded-[1.5rem] bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 text-gray-900 dark:text-white text-sm outline-none font-bold focus:border-gray-500 transition-all" required />
                  </div>
                </div>
                <button 
                  type="submit" 
                  disabled={loading}
                  className={`w-full py-5 rounded-[1.5rem] bg-gray-900 dark:bg-white/10 text-white text-sm font-black shadow-2xl shadow-black/20 transition-all active:scale-95 flex items-center justify-center gap-3 border border-white/5 ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-black dark:hover:bg-white/20'}`}
                >
                  {saved ? <><MdCheck size={24}/> Success!</> : loading ? 'Creating...' : 'Schedule Now'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
