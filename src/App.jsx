import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from 'next-themes';
import PrivateRoutes from './routes/PrivateRoutes';
import LandingPage from './pages/LandingPage';
import MeetingRoom from './pages/MeetingRoom';
import Dashboard from './pages/Dashboard';

const App = () => {
  return (
    <Router>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <AuthProvider>
          <div className="scroll-smooth">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />

              {/* Private Routes (Protected) */}
              <Route element={<PrivateRoutes />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/meeting/:roomId" element={<MeetingRoom />} />
              </Route>

              {/* 404 Page */}
              <Route path="*" element={
                <div className="min-h-screen flex items-center justify-center">
                  Page Not Found
                </div>
              } />
            </Routes>
          </div>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
};

export default App;
