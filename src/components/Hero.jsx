import React, { useEffect, useRef } from 'react';
import Btn from './ui/btn';
import HeroCover from '../assets/App_UI.jpg'
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
    <div ref={heroRef} className="font-sofia mx-5 md:mx-28 flex flex-col items-center text-center">
      <p className="reveal-text font-bold text-3xl md:text-5xl mt-10 md:mt-20 text-[#222222]">
        Create Meetings with ease
      </p>
      <p className="reveal-text font-sofia-ultralight text-sm md:text-md mt-3 md:mt-5 text-[#666666] max-w-md md:max-w-lg">
        Effortlessly connect with high-quality video and audio. Experience engaging meetings that bring your team closer.
      </p>
      <div className="flex mt-4 md:mt-6 justify-center gap-2 md:gap-4 reveal-text">
        <Btn ref={heroRef} text={"Create Meeting"} />
        <button className='border border-gray-400 rounded-md p-2 md:p-3 hover:scale-105 ease-in-out duration-300'>Register Now</button>
      </div>
      <div className='reveal-text'>
        <img src={HeroCover} alt="" className='mt-10 md:mt-16 w-full max-w-[30rem] md:max-w-[60rem] mb-10 md:mb-16 rounded-xl shadow-[0_0_75px_-30px_rgba(0,0,0,0.75)]' />
      </div>
    </div>

  );
}

export default Hero;