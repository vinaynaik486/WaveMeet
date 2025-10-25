import React, { Suspense, lazy } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { MeetingProvider } from '@/context/MeetingContext';
import { WebRTCProvider } from '@/context/WebRTCContext';
import MeetingSidebar from '../components/meeting/MeetingSidebar';
import { TooltipProvider } from "@/components/ui/tooltip";
import ClassicLoader from '@/components/ui/loader';

const Dashboard = lazy(() => import('../pages/Dashboard'));
const CalendarPage = lazy(() => import('../pages/CalendarPage'));
const SettingsPage = lazy(() => import('../pages/SettingsPage'));
const MeetingRoom = lazy(() => import('../pages/MeetingRoom'));
const MeetingEndPage = lazy(() => import('../pages/MeetingEndPage'));

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

  const isMeetingEnd = location.pathname === '/meeting-end';

  return (
    <TooltipProvider>
      <MeetingProvider>
        <WebRTCProvider>
          <Suspense fallback={
            <div className="h-screen w-full flex items-center justify-center bg-[#fafafa] dark:bg-[#0a0a1a]">
              <ClassicLoader />
            </div>
          }>
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
          </Suspense>
        </WebRTCProvider>
      </MeetingProvider>
    </TooltipProvider>
  );
}

export default PrivateRoutes;
