import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider, useSocket } from './context/SocketContext';
import { ThemeProvider } from 'next-themes';
import ToastAlert from './components/notifications/ToastAlert';
import ClassicLoader from './components/ui/loader';
import LandingPage from './pages/LandingPage';

const PrivateRoutes = React.lazy(() => import('./routes/PrivateRoutes'));

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
              <React.Suspense fallback={
                <div className="h-screen w-full flex items-center justify-center bg-background">
                  <ClassicLoader />
                </div>
              }>
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
              </React.Suspense>
            </div>
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
};

export default App;
