import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { MdPerson, MdVideocam, MdMeetingRoom, MdNotifications, MdPalette, MdArrowBack, MdCheck, MdNotificationsOff } from 'react-icons/md';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const TABS = [
  { id: 'profile', label: 'Profile', icon: MdPerson },
  { id: 'av', label: 'Audio & Video', icon: MdVideocam },
  { id: 'meeting', label: 'Meeting', icon: MdMeetingRoom },
  { id: 'notif', label: 'Notifications', icon: MdNotifications },
  { id: 'appearance', label: 'Appearance', icon: MdPalette },
];

function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex items-center justify-between py-4 cursor-pointer group">
      <span className="text-sm text-gray-700 dark:text-gray-300 font-karla-medium group-hover:text-gray-900 dark:group-hover:text-white transition-colors">{label}</span>
      <div className={`w-11 h-6 rounded-full transition-all duration-300 ${checked ? 'bg-gray-900 dark:bg-white/20' : 'bg-gray-200 dark:bg-white/10'} relative`} onClick={onChange}>
        <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform duration-300 shadow-sm ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
      </div>
    </label>
  );
}

export default function SettingsPage() {
  const { user, updateProfile: syncProfile, updateUserSettings } = useAuth();
  const { socket } = useSocket();
  const nav = useNavigate();
  const location = useLocation();
  const [tab, setTab] = useState('profile');
  const [settings, setSettings] = useState({
    defaultMuteOnJoin: false,
    defaultVideoOffOnJoin: false,
    theme: localStorage.getItem('theme') || 'light',
    notifySound: true,
    notifyPush: true,
    notifyEmail: false,
    waitingRoomEnabled: false,
    allowScreenSharing: true,
    recordingPermission: 'host'
  });
  const [profile, setProfile] = useState({ displayName: '', statusMessage: '' });
  const [devices, setDevices] = useState({ mics: [], cams: [], speakers: [] });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const queryParams = new URLSearchParams(location.search);
  const fromRoomId = queryParams.get('roomId') || (location.state && location.state.roomId);

  useEffect(() => {
    if (!user) return;
    setProfile({ displayName: user.displayName || '', statusMessage: '' });
    fetch(`${API}/api/auth/me?uid=${user.uid}`)
      .then(r => r.json())
      .then(d => {
        if (d.user) {
          if (d.user.settings) setSettings(prev => ({ ...prev, ...d.user.settings }));
          setProfile({ displayName: d.user.displayName || '', statusMessage: d.user.statusMessage || '' });
        }
      })
      .catch(console.error);
  }, [user]);

  useEffect(() => {
    const initAV = async () => {
      if (tab === 'av') {
        try {
          const devs = await navigator.mediaDevices.enumerateDevices();
          setDevices({
            mics: devs.filter(d => d.kind === 'audioinput'),
            cams: devs.filter(d => d.kind === 'videoinput'),
            speakers: devs.filter(d => d.kind === 'audiooutput')
          });

          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          streamRef.current = stream;
          if (videoRef.current) videoRef.current.srcObject = stream;
        } catch (e) {
          console.error('[AV] Detection failed:', e);
        }
      }
    };

    initAV();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    };
  }, [tab]);

  const saveSetting = async (key, val) => {
    const upd = { ...settings, [key]: val };
    setSettings(upd);

    if (key === 'theme') {
      document.documentElement.classList.add('disable-transitions');
      localStorage.setItem('theme', val);
      if (val === 'dark') document.documentElement.classList.add('dark');
      else if (val === 'light') document.documentElement.classList.remove('dark');
      else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.classList.toggle('dark', prefersDark);
      }
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          document.documentElement.classList.remove('disable-transitions');
        });
      });
    }

    // Sync waiting room setting to the active meeting
    if (key === 'waitingRoomEnabled' && fromRoomId) {
      try {
        await fetch(`${API}/api/meetings/${fromRoomId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ waitingRoomEnabled: val })
        });
      } catch (e) { /* ignore */ }
    }

    // Immediately sync to AuthContext so other components see the updated settings
    if (updateUserSettings) {
      updateUserSettings({ [key]: val });
    }

    try {
      await fetch(`${API}/api/users/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firebaseUid: user.uid, settings: upd })
      });
      showSaved();
    } catch (e) { console.error(e); }
  };

  const saveProfile = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      // 1. Update Backend
      await fetch(`${API}/api/users/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firebaseUid: user.uid, ...profile })
      });

      // 2. Update Firebase & Local State
      const oldName = user.displayName;
      await syncProfile(profile.displayName, user.photoURL);

      // 3. Notify Chat if in a room
      if (fromRoomId && socket && oldName !== profile.displayName) {
        socket.emit('chat-message', {
          roomId: fromRoomId,
          message: `${oldName} updated his name to ${profile.displayName}`,
          senderId: 'system',
          senderName: 'System',
          timestamp: new Date().toISOString(),
          type: 'system'
        });
      }

      showSaved();
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const showSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] dark:bg-[#0a0a1a] font-karla transition-colors duration-500">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => fromRoomId ? nav(`/meeting/${fromRoomId}`) : nav(-1)}
              className="w-11 h-11 rounded-2xl bg-white dark:bg-[#121222] hover:bg-gray-100 dark:hover:bg-white/10 flex items-center justify-center shadow-sm border border-gray-100 dark:border-white/5 transition-all active:scale-95"
            >
              <MdArrowBack size={22} className="text-gray-600 dark:text-gray-400" />
            </button>
            <div>
              <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Settings</h1>
              <p className="text-sm text-gray-400 font-medium mt-0.5">WaveMeet Dashboard & Experience</p>
            </div>
          </div>

          {saved && (
            <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-500 px-4 py-2 rounded-xl border border-emerald-500/20 animate-in fade-in slide-in-from-top-2">
              <MdCheck size={18} />
              <span className="text-sm font-bold">Saved successfully</span>
            </div>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Tabs */}
          <div className="w-full md:w-56 flex-shrink-0 space-y-2">
            {TABS.map(t => {
              const I = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl text-sm transition-all duration-300 ${tab === t.id ? 'bg-gray-900 dark:bg-white/10 text-white shadow-xl shadow-black/10 translate-x-1' : 'text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-[#121222] hover:text-gray-900'}`}
                >
                  <I size={22} />
                  <span className="font-bold tracking-tight">{t.label}</span>
                </button>
              );
            })}
          </div>

          {/* Main Content */}
          <div className="flex-1 bg-white dark:bg-[#121222] rounded-2xl p-8 md:p-10 shadow-2xl border border-gray-100 dark:border-white/5 transition-all duration-500">
            {tab === 'profile' && (
              <form onSubmit={saveProfile} className="animate-in fade-in duration-500">
                <h3 className="text-xl font- text-gray-900 dark:text-white font-bold mb-8">Your Profile</h3>
                <div className="flex items-center gap-6 mb-10 p-6 bg-gray-50 dark:bg-white/5 rounded-3xl border border-gray-100 dark:border-white/5">
                  <div className="w-20 h-20 rounded-3xl bg-gray-900 dark:bg-white/10 flex items-center justify-center overflow-hidden shadow-xl border-4 border-white dark:border-white/10">
                    {user?.photoURL ? <img src={user.photoURL} className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : <span className="text-white text-3xl font-black">{(user?.displayName || 'U')[0]}</span>}
                  </div>
                  <div>
                    <p className="text-lg text-gray-900 dark:text-white font-bold leading-none">{user?.displayName}</p>
                    <p className="text-sm text-gray-400 font-medium mt-1.5">{user?.email}</p>
                  </div>
                </div>
                <div className="space-y-6">
                  <div>
                    <label className="text-xs text-gray-400 font-bold mb-2 ml-1 uppercase tracking-widest block">Display Name</label>
                    <input value={profile.displayName} onChange={e => setProfile({ ...profile, displayName: e.target.value })} className="w-full px-6 py-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 text-gray-900 dark:text-white text-sm outline-none font-medium focus:border-gray-500 transition-all" required />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 font-bold mb-2 ml-1 uppercase tracking-widest block">Status Quote</label>
                    <input value={profile.statusMessage} onChange={e => setProfile({ ...profile, statusMessage: e.target.value })} className="w-full px-6 py-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 text-gray-900 dark:text-white text-sm outline-none font-medium focus:border-gray-500 transition-all" />
                  </div>
                  <button type="submit" disabled={loading} className="px-10 py-4 rounded-2xl bg-gray-900 dark:bg-white/10 hover:bg-black dark:hover:bg-white/20 text-white text-sm font-bold shadow-xl shadow-black/10 transition-all active:scale-95 disabled:opacity-50 border border-white/5">
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            )}

            {tab === 'av' && (
              <div className="animate-in fade-in duration-500">
                <h3 className="text-xl text-gray-900 dark:text-white font-bold mb-8">Hardware Setup</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <label className="text-xs text-gray-400 font-bold mb-2 ml-1 uppercase tracking-widest block">Microphone</label>
                      <select className="w-full px-6 py-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 text-gray-700 dark:text-gray-300 text-sm font-bold appearance-none cursor-pointer outline-none focus:border-gray-500 transition-all">
                        {devices.mics.length > 0 ? devices.mics.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || 'Default Microphone'}</option>) : <option>No microphone detected</option>}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 font-bold mb-2 ml-1 uppercase tracking-widest block">Camera</label>
                      <select className="w-full px-6 py-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 text-gray-700 dark:text-gray-300 text-sm font-bold appearance-none cursor-pointer outline-none focus:border-gray-500 transition-all">
                        {devices.cams.length > 0 ? devices.cams.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || 'Default Camera'}</option>) : <option>No camera detected</option>}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs text-gray-400 font-bold mb-1 ml-1 uppercase tracking-widest block">Preview</label>
                    <div className="aspect-video rounded-3xl bg-gray-900 overflow-hidden shadow-2xl border-4 border-gray-100 dark:border-white/5 relative">
                      <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
                      {!devices.cams.length && <div className="absolute inset-0 flex items-center justify-center text-white/20"><MdVideocam size={48} /></div>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {tab === 'meeting' && (
              <div className="animate-in fade-in duration-500">
                <h3 className="text-xl text-gray-900 dark:text-white font-bold mb-8">Join Defaults</h3>
                <div className="space-y-1 divide-y divide-gray-50 dark:divide-white/5">
                  <Toggle label="Mute mic on join" checked={settings.defaultMuteOnJoin} onChange={() => saveSetting('defaultMuteOnJoin', !settings.defaultMuteOnJoin)} />
                  <Toggle label="Video off on join" checked={settings.defaultVideoOffOnJoin} onChange={() => saveSetting('defaultVideoOffOnJoin', !settings.defaultVideoOffOnJoin)} />
                  <Toggle label="Require approval to join (Waiting Room)" checked={settings.waitingRoomEnabled} onChange={() => saveSetting('waitingRoomEnabled', !settings.waitingRoomEnabled)} />
                  <Toggle label="Allow screen sharing" checked={settings.allowScreenSharing} onChange={() => saveSetting('allowScreenSharing', !settings.allowScreenSharing)} />
                </div>
              </div>
            )}

            {tab === 'notif' && (
              <div className="animate-in fade-in duration-500 flex flex-col items-center justify-center py-12 text-center">
                {/* SVG Illustration: Fly flying above flower */}
                <svg width="240" height="180" viewBox="0 0 240 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-8">
                  <circle cx="120" cy="140" r="30" className="fill-gray-100 dark:fill-white/5" />
                  <path d="M120 110V140M120 140L100 160M120 140L140 160" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" />
                  <circle cx="120" cy="95" r="15" className="fill-amber-400 opacity-80" />
                  <path d="M105 95C105 85 95 80 90 85C85 90 90 105 105 105" className="fill-amber-200 opacity-60" />
                  <path d="M135 95C135 85 145 80 150 85C155 90 150 105 135 105" className="fill-amber-200 opacity-60" />
                  <g className="animate-bounce">
                    <path d="M60 40C65 35 75 35 80 40C85 45 80 55 70 55C60 55 55 45 60 40Z" className="fill-gray-400 dark:fill-white/20" />
                    <path d="M65 35C60 25 50 25 45 30C40 35 45 45 65 45" className="fill-gray-300 dark:fill-white/10" />
                    <path d="M75 35C80 25 90 25 95 30C100 35 95 45 75 45" className="fill-gray-300 dark:fill-white/10" />
                  </g>
                </svg>
                <h3 className="text-xl text-gray-900 dark:text-white font-bold mb-2">No notifications yet</h3>
                <p className="text-sm text-gray-400 font-medium max-w-[280px]">When you have something new, it will appear here. Enjoy the peace!</p>
              </div>
            )}

            {tab === 'appearance' && (
              <div className="animate-in fade-in duration-500">
                <h3 className="text-xl text-gray-900 dark:text-white font-bold mb-8">Visual Theme</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {['light', 'dark', 'system'].map(t => (
                    <button key={t} onClick={() => saveSetting('theme', t)} className={`p-6 rounded-[2rem] border transition-all duration-300 flex flex-col items-center gap-4 ${settings.theme === t ? 'bg-gray-900 dark:bg-white/20 text-white shadow-xl shadow-black/30 border-gray-900' : 'bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/10 hover:border-gray-500'}`}>
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${settings.theme === t ? 'bg-white/20' : 'bg-gray-900/10 dark:bg-white/10 text-gray-700 dark:text-white'}`}><MdPalette size={24} /></div>
                      <span className="text-sm font-bold capitalize">{t}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
