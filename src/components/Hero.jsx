import React, { useEffect, useRef } from 'react';
import Btn from './ui/btn';
import HeroCover from '../assets/App_UI.jpg';
import { gsap } from 'gsap';

function Hero() {
  const heroRef = useRef(null);

  useEffect(() => {
    const elements = heroRef.current.querySelectorAll('.reveal-text');
    gsap.fromTo(
      elements,
      { y: 100, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, stagger: 0.2, ease: 'power2.inOut' }
    );
  }, []);

  return (
    <div
      ref={heroRef}
      className="font-sofia px-4 sm:px-6 md:px-8 lg:px-16 xl:px-28 flex flex-col items-center text-center pt-20 sm:pt-24 md:pt-20 lg:pt-16 xl:pt-14"
    >
      <h1 className="reveal-text font-sofia-bold text-2xl sm:text-3xl md:text-4xl lg:text-5xl mt-8 sm:mt-12 md:mt-16 lg:mt-24 text-[#222222] leading-tight">
        Create Meetings with ease
      </h1>
      <p className="reveal-text font-sofia-ultralight text-sm sm:text-base md:text-lg mt-3 sm:mt-4 md:mt-5 text-[#666666] max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl">
        Effortlessly connect with high-quality video and audio. Experience engaging meetings that bring your team closer.
      </p>
      <div className="flex mt-4 sm:mt-5 md:mt-6 justify-center gap-2 sm:gap-3 md:gap-4 reveal-text">
        <Btn ref={heroRef} text={'Create Meeting'} />
        <button className="border border-gray-400 rounded-md px-3 py-2 sm:px-4 sm:py-2 md:px-5 md:py-3 text-sm sm:text-base md:text-lg hover:scale-105 hover:border-black transition-all duration-300 ease-in-out">
          Register Now
        </button>
      </div>
      <div className="reveal-text w-full max-w-[90%] sm:max-w-[80%] md:max-w-[70%] lg:max-w-[60%] xl:max-w-[50%]">
        <img
          src={HeroCover}
          alt="App UI Cover"
          className="mt-8 sm:mt-10 md:mt-12 lg:mt-16 w-full rounded-xl shadow-[0_0_75px_-30px_rgba(0,0,0,0.75)]"
        />
      </div>
    </div>
  );
}

export default Hero;
