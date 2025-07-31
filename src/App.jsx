import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider, useSocket } from './context/SocketContext';
import { ThemeProvider } from 'next-themes';
import PrivateRoutes from './routes/PrivateRoutes';
import LandingPage from './pages/LandingPage';
import ToastAlert from './components/notifications/ToastAlert';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Syncs Firebase user to MongoDB on login
function AuthSync() {
  const { user } = useAuth();
  useEffect(() => {
    if (!user) return;
    fetch(`${API_URL}/api/auth/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firebaseUid: user.uid,
        displayName: user.displayName || 'User',
        email: user.email || '',
        photoURL: user.photoURL || '',
      }),
    }).catch(() => {});
  }, [user]);
  return null;
}

// Listens for socket notifications and shows toast
function NotificationToasts() {
  const { socket } = useSocket();
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!socket) return;
    const onNotification = (data) => setToast(data);
    const onReminder = (data) => setToast({ type: 'reminder', title: 'Meeting Reminder', body: `"${data.title}" starts in ${data.startsIn}` });
    socket.on('notification', onNotification);
    socket.on('meeting-reminder', onReminder);
    return () => { socket.off('notification', onNotification); socket.off('meeting-reminder', onReminder); };
  }, [socket]);

  const dismiss = useCallback(() => setToast(null), []);

  return <ToastAlert notification={toast} onDismiss={dismiss} />;
}

const App = () => {
  return (
    <Router>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <AuthProvider>
          <SocketProvider>
            <AuthSync />
            <NotificationToasts />
            <div className="scroll-smooth">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />

                {/* Private Routes (Protected) */}
                <Route path="/*" element={<PrivateRoutes />} />

                {/* 404 Page */}
                <Route path="*" element={
                  <div className="min-h-screen flex items-center justify-center">
                    Page Not Found
                  </div>
                } />
              </Routes>
            </div>
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
};

export default App;
