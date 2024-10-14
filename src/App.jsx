import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Solutions from "./components/Solutions";
import Pricing from "./components/Pricing";
import ContactUs from "./components/ContactUs";
import Footer from "./components/Footer";

function App() {
  return (
    <Router>
      <div className="scroll-smooth">
        <Navbar />
        <Hero />
        <Solutions />
        <Pricing />
        <ContactUs />
        <Footer />
      </div>
    </Router>
  );
}

export default App;
