import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import websiteLogo from '../assets/logo/logo.png';
import { PlusIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/solid';
import { HashLink } from 'react-router-hash-link';
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import SignIn from './ui/signin';
import SignUp from './ui/signup';
import { useAuth } from '@/context/auth-context';
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";

function Navbar() {
  const { user, logout } = useAuth();
  const navbarRef = useRef(null);
  const [scrolled, setScrolled] = useState(false);
  const [navbarHeight, setNavbarHeight] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSignIn, setShowSignIn] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleDialogChange = (open) => {
    setDialogOpen(open);
    if (!open) {
      setShowSignIn(true); // Reset to signin when dialog closes
    }
  };

  useEffect(() => {
    setTimeout(() => {
      window.scrollTo(0, 0);
    }, 50);

    const updateNavbarHeight = () => {
      if (navbarRef.current) {
        setNavbarHeight(navbarRef.current.offsetHeight);
      }
    };

    updateNavbarHeight();
    window.addEventListener('resize', updateNavbarHeight);

    const elements = navbarRef.current.querySelectorAll('.reveal-text');
    gsap.fromTo(
      elements,
      { y: 50, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, stagger: 0.1, ease: 'power2.inOut' }
    );

    const handleScroll = () => {
      const offset = window.scrollY;
      setScrolled(offset > 50);
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', updateNavbarHeight);
    };
  }, []);

  const scrollWithOffset = (e) => {
    const yCoordinate = e.getBoundingClientRect().top + window.scrollY;
    const yOffset = -navbarHeight - 10;
    window.scrollTo({ top: yCoordinate + yOffset, behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  const toggleAuth = () => {
    setShowSignIn(!showSignIn);
  };

  const AuthContent = () => (
    <div className="w-full">
      {showSignIn ? <SignIn onToggle={toggleAuth} /> : <SignUp onToggle={toggleAuth} />}
      <button
        onClick={toggleAuth}
        className="w-full mt-4 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
      >
        {showSignIn
          ? "Don't have an account? Sign Up"
          : "Already have an account? Sign In"
        }
      </button>
    </div>
  );

  return (
    <div
      ref={navbarRef}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
        ? 'bg-white dark:bg-[#121212] bg-opacity-80 dark:bg-opacity-80 backdrop-blur-md shadow-md py-2'
        : 'bg-transparent py-5'
        }`}
    >
      <div className="relative px-4 py-4 lg:py-2 sm:px-6 md:px-8 lg:px-20 flex justify-between items-center font-sofia">
        {/* Logo */}
        <div className="flex items-center hover:scale-105 cursor-pointer hover:ease-in-out hover:duration-200">
          <img src={websiteLogo} alt="" className="h-8 sm:h-10 reveal-text" />
          <span className="text-xl font-semibold reveal-text dark:text-white">WaveMeet</span>
        </div>

        {/* Centered Navigation Items */}
        <div className="hidden lg:flex absolute left-1/2 transform -translate-x-1/2 gap-8">
          <HashLink smooth to="/#solutions" scroll={scrollWithOffset} className="cursor-pointer">
            <button className="reveal-text dark:text-white hover:text-gray-600 dark:hover:text-gray-300">Solutions</button>
          </HashLink>
          <HashLink smooth to="/#pricing" scroll={scrollWithOffset} className="cursor-pointer">
            <button className="reveal-text dark:text-white hover:text-gray-600 dark:hover:text-gray-300">Plan & Pricing</button>
          </HashLink>
          <HashLink smooth to="/#contact_us" scroll={scrollWithOffset} className="cursor-pointer">
            <button className="reveal-text dark:text-white hover:text-gray-600 dark:hover:text-gray-300">Contact Us</button>
          </HashLink>
        </div>

        {/* Right Side Actions */}
        <div className="hidden lg:flex items-center gap-4">
          {user ? (
            <>
              <span className="dark:text-white">Welcome, {user.email || user.phoneNumber}</span>
              <button
                onClick={handleLogout}
                className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
              >
                Logout
              </button>
            </>
          ) : (
            <Dialog open={dialogOpen} onOpenChange={handleDialogChange}>
              <DialogTrigger asChild>
                <button className="bg-[#222222] dark:bg-white dark:text-[#222222] text-white py-2 px-4 sm:py-3 sm:px-5 scale-105 hover:bg-[#333333] dark:hover:bg-gray-100 hover:text-white rounded-md flex justify-center items-center gap-2 reveal-text">
                  <span className="text-sm sm:text-base">Login</span>
                </button>
              </DialogTrigger>
              <DialogContent className="dark:bg-[#121212]">
                <AuthContent />
              </DialogContent>
            </Dialog>
          )}

          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-[#333333] transition-colors"
          >
            {theme === 'dark' ? (
              <Sun className="h-5 w-5 text-white" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="lg:hidden dark:text-white"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? (
            <XMarkIcon className="w-8 h-8" />
          ) : (
            <Bars3Icon className="w-8 h-8" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white dark:bg-[#1e1e1e] mx-4 mt-4 rounded-lg shadow-md py-4 px-4 sm:px-6 md:px-8">
          <HashLink smooth to="/#solutions" scroll={scrollWithOffset} className="block py-2">
            <button className="reveal-text dark:text-white">Solutions</button>
          </HashLink>
          <HashLink smooth to="/#pricing" scroll={scrollWithOffset} className="block py-2">
            <button className="reveal-text dark:text-white">Plan & Pricing</button>
          </HashLink>
          <HashLink smooth to="/#contact_us" scroll={scrollWithOffset} className="block py-2">
            <button className="reveal-text dark:text-white">Contact Us</button>
          </HashLink>
          {!user && (
            <Dialog open={dialogOpen} onOpenChange={handleDialogChange}>
              <DialogTrigger asChild>
                <button className="reveal-text block py-2 w-full text-left dark:text-white">
                  Login
                </button>
              </DialogTrigger>
              <DialogContent className="dark:bg-[#121212]">
                <AuthContent />
              </DialogContent>
            </Dialog>
          )}
          <div className="flex items-center gap-2 mt-2">
            <button className="bg-[#222222] dark:bg-white dark:text-[#222222] text-white py-2 px-4 rounded-md flex justify-center items-center gap-2 reveal-text flex-1">
              <PlusIcon className="w-5" />
              <span className="text-sm">New Meeting</span>
            </button>
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-[#333333] transition-colors"
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5 text-white" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Navbar;