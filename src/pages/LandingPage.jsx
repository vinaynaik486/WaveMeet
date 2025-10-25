import React from "react";
import Navbar from "../components/landing/Navbar";
import Hero from "../components/landing/Hero";
import Solutions from "../components/landing/Solutions";
import Pricing from "../components/landing/Pricing";
import ContactUs from "../components/landing/ContactUs";
import Footer from "../components/landing/Footer";

const LandingPage = () => {
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

export default LandingPage;

