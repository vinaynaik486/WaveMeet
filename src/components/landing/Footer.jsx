import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import logo from '/src/assets/logo/logo.png'

function Footer() {
  const footerRef = useRef(null);

  useEffect(() => {
    const animationFrame = requestAnimationFrame(() => {
      const elements = footerRef.current.querySelectorAll('.reveal-text');
      gsap.fromTo(
        elements,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.05, ease: 'power1.out' }
      );
    });

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, []);

  return (
    <footer ref={footerRef} className="w-full bg-[#fafafa] dark:bg-[#0a0a1a] p-3 transition-colors duration-300">
      <hr className="my-4 mx-4 sm:mx-8 md:mx-16 lg:mx-20 border-gray-200 dark:border-gray-700" />
      <div className="flex flex-col lg:flex-row justify-between mx-4 sm:mx-8 md:mx-16 lg:mx-20 items-center space-y-4 lg:space-y-0">
        <div 
          className="flex items-center font-karla cursor-pointer hover:scale-105 hover:ease-in-out hover:duration-200 transform-gpu"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <img src={logo} alt="WaveMeet logo" className="h-8 sm:h-10 reveal-text" />
          <span className="text-xl sm:text-xl font-semibold reveal-text ml-2 text-[#222222] dark:text-white">
            WaveMeet
          </span>
        </div>
        <p className="text-center lg:text-left text-[#222222] dark:text-white font-light reveal-text">
          &copy;2025 WaveMeet. All Rights Reserved
        </p>
      </div>
    </footer>
  );
}

export default Footer;
