import React, { useEffect, useRef, useState } from 'react';
import Logo from '../ui/Logo';
import BlurIn from '../ui/BlurIn';
import { PlusIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/solid';
import { HashLink } from 'react-router-hash-link';
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import SignIn from '../auth/SignIn';
import SignUp from '../auth/SignUp';
import { useAuth } from '@/context/AuthContext';
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
      setShowSignIn(true);
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

    // Removed GSAP orchestrations in favor of BlurIn (framer-motion)

    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const offset = window.scrollY;
          setScrolled(offset > 50);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

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
        className="w-full mt-4 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-light"
      >
        {showSignIn
          ? "Don't have an account? Sign Up"
          : "Already have an account? Log In"
        }
      </button>
    </div>
  );

  return (
    <nav
      ref={navbarRef}
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${scrolled
        ? 'bg-white/40 dark:bg-black/40 backdrop-blur-xl py-1.5'
        : 'bg-transparent py-3'
        }`}
    >
      <div className="relative px-4 py-2 lg:py-1 sm:px-6 md:px-8 lg:px-20 flex justify-between items-center font-karla">
        {/* Logo */}
        <BlurIn delay={0.1}>
          <div
            className="flex items-center cursor-pointer transform-gpu"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <Logo className="h-10 sm:h-12" />
            <span className="text-2xl sm:text-3xl font-bold dark:text-white">WaveMeet</span>
          </div>
        </BlurIn>

        <div className="hidden lg:flex absolute left-1/2 transform -translate-x-1/2 gap-8">
          <BlurIn delay={0.2}>
            <HashLink smooth to="/#solutions" scroll={scrollWithOffset} className="cursor-pointer">
              <button className="px-3 py-2 rounded-md dark:text-white hover:bg-gray-100 dark:hover:bg-[#333333] transition-all duration-300 font-normal">Solutions</button>
            </HashLink>
          </BlurIn>

          <BlurIn delay={0.3}>
            <HashLink smooth to="/#pricing" scroll={scrollWithOffset} className="cursor-pointer">
              <button className="px-3 py-2 rounded-md dark:text-white hover:bg-gray-100 dark:hover:bg-[#333333] transition-all duration-300 font-normal">Plan & Pricing</button>
            </HashLink>
          </BlurIn>
          <BlurIn delay={0.4}>
            <HashLink smooth to="/#contact_us" scroll={scrollWithOffset} className="cursor-pointer">
              <button className="px-3 py-2 rounded-md dark:text-white hover:bg-gray-100 dark:hover:bg-[#333333] transition-all duration-300 font-normal">Contact Us</button>
            </HashLink>
          </BlurIn>
        </div>

        {/* Right Side Actions */}
        <div className="hidden lg:flex items-center gap-4">
          {user ? (
            <>
              <span className="dark:text-white font-normal">
                Welcome, {user.displayName ? user.displayName.split(' ')[0] : 'User'}
              </span>
              <button
                onClick={handleLogout}
                className="px-3 py-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#333333] transition-all duration-300 font-medium"
              >
                Logout
              </button>
            </>
          ) : (
            <BlurIn delay={0.5}>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => { setShowSignIn(true); setDialogOpen(true); }}
                  className="px-3 py-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#333333] transition-all duration-300 font-medium text-sm"
                >
                  Login
                </button>
                <button 
                  onClick={() => { setShowSignIn(false); setDialogOpen(true); }}
                  className="bg-transparent border border-[#fe583e] text-[#fe583e] py-2 px-5 sm:py-2.5 sm:px-7 hover:bg-[#fe583e] hover:text-white transition-colors duration-300 rounded-full font-medium text-sm"
                >
                  Create Account
                </button>
              </div>

              <Dialog open={dialogOpen} onOpenChange={handleDialogChange}>
                <DialogContent className="dark:bg-[#121212]">
                  <AuthContent />
                </DialogContent>
              </Dialog>
            </BlurIn>
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
        <div className="lg:hidden bg-[#fafafa] dark:bg-[#0a0a1a] mx-4 mt-4 rounded-lg shadow-md py-4 px-4 sm:px-6 md:px-8">
          <HashLink smooth to="/#solutions" scroll={scrollWithOffset} className="block py-2">
            <button className="reveal-text dark:text-white hover:text-[#fe583e] dark:hover:text-[#fe583e] transition-colors font-medium">Solutions</button>
          </HashLink>
          <HashLink smooth to="/#pricing" scroll={scrollWithOffset} className="block py-2">
            <button className="reveal-text dark:text-white hover:text-[#fe583e] dark:hover:text-[#fe583e] transition-colors font-medium">Plan & Pricing</button>
          </HashLink>
          <HashLink smooth to="/#contact_us" scroll={scrollWithOffset} className="block py-2">
            <button className="reveal-text dark:text-white hover:text-[#fe583e] dark:hover:text-[#fe583e] transition-colors font-medium">Contact Us</button>
          </HashLink>
          <div className="flex items-center justify-between mt-4">
            {!user && (
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => { setShowSignIn(true); setDialogOpen(true); setMobileMenuOpen(false); }}
                  className="text-left px-3 py-2 rounded-md dark:text-white hover:bg-gray-100 dark:hover:bg-[#333333] transition-all duration-300 font-medium text-sm"
                >
                  Login
                </button>
                <button 
                  onClick={() => { setShowSignIn(false); setDialogOpen(true); setMobileMenuOpen(false); }}
                  className="bg-transparent border border-[#fe583e] text-[#fe583e] py-2.5 px-8 hover:bg-[#fe583e] hover:text-white transition-colors rounded-full font-medium text-sm text-center"
                >
                  Create Account
                </button>
              </div>
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
        </div>
      )}
    </nav>
  );
}

export default Navbar;
