import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { MeetingProvider } from '@/context/MeetingContext';
import { WebRTCProvider } from '@/context/WebRTCContext';
import MeetingSidebar from '../components/meeting/MeetingSidebar';

import Dashboard from '../pages/Dashboard';
import CalendarPage from '../pages/CalendarPage';
import SettingsPage from '../pages/SettingsPage';
import MeetingRoom from '../pages/MeetingRoom';
import MeetingEndPage from '../pages/MeetingEndPage';

import { TooltipProvider } from "@/components/ui/tooltip";

function MeetingLayout({ children }) {
  return (
    <div className="h-screen flex bg-[#fafafa] dark:bg-[#0a0a1a] transition-colors duration-500 overflow-hidden">
      <MeetingSidebar />
      <div className="flex-1 h-full overflow-y-auto custom-scrollbar">
        {children}
      </div>
    </div>
  );
}

function PrivateRoutes() {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return <Navigate to="/" />;

  // Some pages might want to hide the sidebar (like landing or special auth pages), 
  // but for private routes we generally want it.
  const isMeetingEnd = location.pathname === '/meeting-end';

  return (
    <TooltipProvider>
      <MeetingProvider>
        <WebRTCProvider>
          {isMeetingEnd ? (
            <Routes>
              <Route path="/meeting-end" element={<MeetingEndPage />} />
            </Routes>
          ) : (
            <MeetingLayout>
              <Routes>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/calendar" element={<CalendarPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/meeting/:roomId" element={<MeetingRoom />} />
                <Route path="*" element={<Navigate to="/dashboard" />} />
              </Routes>
            </MeetingLayout>
          )}
        </WebRTCProvider>
      </MeetingProvider>
    </TooltipProvider>
  );
}

export default PrivateRoutes;
