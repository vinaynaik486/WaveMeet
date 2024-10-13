// src/components/Navbar.jsx
import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import websiteLogo from '../assets/logo/logo.png';
import { PlusIcon } from '@heroicons/react/16/solid';
import { HashLink } from 'react-router-hash-link';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, } from "@/components/ui/dialog"


function Navbar() {
  const navbarRef = useRef(null);
  const [scrolled, setScrolled] = useState(false);
  const [navbarHeight, setNavbarHeight] = useState(0);

  useEffect(() => {
    // Scroll to the top on page reload
    setTimeout(() => {
      window.scrollTo(0, 0); // Forces scroll to top with a small delay
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
    const yOffset = -navbarHeight - 10; // Adjusts for navbar height and extra padding
    window.scrollTo({ top: yCoordinate + yOffset, behavior: 'smooth' });
  };

  return (
    <div
      ref={navbarRef}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white bg-opacity-80 backdrop-blur-sm shadow-md py-2' : 'bg-transparent py-5'
        }`}
    >
      <div id="home" className='mx-20 flex justify-between items-center font-sofia'>
        <div className='flex items-center hover:scale-105 cursor-pointer hover:ease-in-out hover:duration-200'>
          <img src={websiteLogo} alt="" className='h-10 reveal-text' />
          <span className='text-xl font-semibold reveal-text'>WaveMeet</span>
        </div>
        <div className='flex justify-between gap-8'>
          <HashLink
            smooth to="/#solutions"
            scroll={scrollWithOffset}
            className="cursor-pointer"
          >
            <button className='reveal-text ml-20'>Solutions</button>
          </HashLink>
          <HashLink
            smooth to="/#pricing"
            scroll={scrollWithOffset}
            className="cursor-pointer"
          >
            <button className='reveal-text'>Plan & Pricing</button>
          </HashLink>
          <HashLink
            smooth to="/#contact_us"
            scroll={scrollWithOffset}
            className="cursor-pointer"
          >
            <button className='reveal-text'>Contact Us</button>
          </HashLink>
        </div>
        <div className='flex items-center gap-8'>
          <Dialog>
            <DialogTrigger>
              <button className='reveal-text'>Login</button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Are you absolutely sure?</DialogTitle>
                <DialogDescription>
                  This action cannot be undone. This will permanently delete your account
                  and remove your data from our servers.
                </DialogDescription>
              </DialogHeader>
            </DialogContent>
          </Dialog>
          <button className='bg-[#222222] text-white py-3 px-5 hover:scale-105 hover:bg-[#333333] rounded-md flex justify-center items-center gap-2 reveal-text'>
            <PlusIcon className='hover:fill-white w-6' />
            <span>New Meeting</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default Navbar;
