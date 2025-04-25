import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from 'next-themes';
import PrivateRoutes from './routes/PrivateRoutes';
import LandingPage from './pages/LandingPage';
import { MenuProvider } from './context/MenuContext';

const App = () => {
  return (
    <MenuProvider>
      <Router>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
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
          </AuthProvider>
        </ThemeProvider>
      </Router>
    </MenuProvider>
  );
};

export default App;
