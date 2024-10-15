import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import websiteLogo from '../assets/logo/logo.png';
import { PlusIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/solid';
import { HashLink } from 'react-router-hash-link';
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import SignIn from './ui/signin';

function Navbar() {
  const navbarRef = useRef(null);
  const [scrolled, setScrolled] = useState(false);
  const [navbarHeight, setNavbarHeight] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
      if (offset > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
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

  return (
    <div
      ref={navbarRef}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white bg-opacity-80 backdrop-blur-sm shadow-md py-2' : 'bg-transparent py-5'
        }`}
    >
      <div id="home" className='px-4 sm:px-6 md:px-8 lg:px-20 flex justify-between items-center font-sofia'>
        <div className='flex items-center hover:scale-105 cursor-pointer hover:ease-in-out hover:duration-200'>
          <img src={websiteLogo} alt="" className='h-8 sm:h-10 reveal-text' />
          <span className='text-lg sm:text-xl font-semibold reveal-text'>WaveMeet</span>
        </div>

        <div className='hidden lg:flex justify-between gap-8'>
          <HashLink smooth to="/#solutions" scroll={scrollWithOffset} className="cursor-pointer">
            <button className='reveal-text'>Solutions</button>
          </HashLink>
          <HashLink smooth to="/#pricing" scroll={scrollWithOffset} className="cursor-pointer">
            <button className='reveal-text'>Plan & Pricing</button>
          </HashLink>
          <HashLink smooth to="/#contact_us" scroll={scrollWithOffset} className="cursor-pointer">
            <button className='reveal-text'>Contact Us</button>
          </HashLink>
        </div>

        <div className='hidden lg:flex items-center gap-8'>
          <Dialog>
            <DialogTrigger>
              <button className='reveal-text'>Login</button>
            </DialogTrigger>
            <DialogContent>
              <SignIn />
            </DialogContent>
          </Dialog>
          <button className='bg-[#222222] text-white py-2 px-4 sm:py-3 sm:px-5 scale-105 hover:bg-[#333333] hover:text-white rounded-md flex justify-center items-center gap-2 reveal-text'>
            <PlusIcon className='w-5 sm:w-6' />
            <span className='text-sm sm:text-base'>New Meeting</span>
          </button>
        </div>

        <button
          className='lg:hidden'
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? (
            <XMarkIcon className='w-6 h-6' />
          ) : (
            <Bars3Icon className='w-6 h-6' />
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className='lg:hidden bg-white shadow-md py-4 px-4 sm:px-6 md:px-8'>
          <HashLink smooth to="/#solutions" scroll={scrollWithOffset} className="block py-2">
            <button className='reveal-text'>Solutions</button>
          </HashLink>
          <HashLink smooth to="/#pricing" scroll={scrollWithOffset} className="block py-2">
            <button className='reveal-text'>Plan & Pricing</button>
          </HashLink>
          <HashLink smooth to="/#contact_us" scroll={scrollWithOffset} className="block py-2">
            <button className='reveal-text'>Contact Us</button>
          </HashLink>
          <Dialog>
            <DialogTrigger>
              <button className='reveal-text block py-2'>Login</button>
            </DialogTrigger>
            <DialogContent>
              <SignIn />
            </DialogContent>
          </Dialog>
          <button className='bg-[#222222] text-white py-2 px-4 mt-2 rounded-md flex justify-center items-center gap-2 reveal-text w-full'>
            <PlusIcon className='w-5' />
            <span className='text-sm'>New Meeting</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default Navbar;