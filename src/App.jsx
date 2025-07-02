import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ThemeProvider } from 'next-themes';
import PrivateRoutes from './routes/PrivateRoutes';
import LandingPage from './pages/LandingPage';

const App = () => {
  return (
    <Router>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <AuthProvider>
          <SocketProvider>
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
