import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/auth-context';
import { ThemeProvider } from 'next-themes'; // Add this import
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Solutions from "./components/Solutions";
import Dashboard from './components/Dashboard';
import Pricing from "./components/Pricing";
import ContactUs from "./components/ContactUs";
import Footer from "./components/Footer";

const HomePage = () => {
  return (
    <>
      <Navbar />
      <Hero />
      <Solutions />
      <Pricing />
      <ContactUs />
      <Footer />
    </>
  );
};

function App() {
  return (
    <Router>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <AuthProvider>
          <div className="scroll-smooth">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/Dashboard" element={<Dashboard />} />
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
}

export default App;