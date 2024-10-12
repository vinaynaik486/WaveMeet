import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import websiteLogo from '../assets/logo/logo.png';
import { PlusIcon } from '@heroicons/react/16/solid';

function Navbar() {
  const navbarRef = useRef(null);

  useEffect(() => {
    const elements = navbarRef.current.querySelectorAll('.reveal-text');
    gsap.fromTo(
      elements,
      { y: 50, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, stagger: 0.1, ease: 'power2.inOut' }
    );
  }, []);

  return (
    <div ref={navbarRef} className='mt-5 mx-20 flex justify-between items-center font-sofia'>
      <div className='flex items-center hover:scale-105 cursor-pointer hover:ease-in-out hover:duration-200'>
        <img src={websiteLogo} alt="" className='h-10 reveal-text' />
        <span className='text-xl font-semibold reveal-text'>WaveMeet</span>
      </div>
      <div className='flex justify-between gap-8'>
        <button className='reveal-text ml-20'>Solutions</button>
        <button className='reveal-text'>Plan & Pricing</button>
        <button className='reveal-text'>Contact Us</button>
      </div>
      <div className='flex items-center gap-8'>
        <button className='reveal-text'>Login</button>
        <button className='bg-[#222222] text-white py-3 px-5 hover:scale-105 hover:bg-[#333333] rounded-md flex justify-center items-center gap-2 reveal-text'>
          <PlusIcon className='hover:fill-white w-6' />
          <span>New Meeting</span>
        </button>
      </div>
    </div>
  );
}

export default Navbar;