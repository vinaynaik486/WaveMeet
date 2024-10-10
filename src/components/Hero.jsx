import React, { useEffect, useRef } from 'react';
import Btn from './ui/btn';
import HeroCover from '../assets/App_UI_upscaled.jpg'
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
    <div ref={heroRef} className="font-sofia mx-8 flex flex-col items-center">
      <p className="reveal-text font-bold text-4xl mt-20 text-[#222222] text-center">
        Immersive Meetings, Anywhere
      </p>
      <p className="reveal-text font-sofia-ultralight mt-5 text-[#666666] text-center max-w-lg">
        Effortlessly connect with high-quality video and audio. Experience engaging meetings that bring your team closer.
      </p>
      <div className="flex mt-6 justify-center gap-4 reveal-text">
        <Btn ref={heroRef} text={"Create Meeting"} />
        <button className='border border-gray-400 rounded-md p-3 hover:scale-105 ease-in-out duration-300 '>Register Now</button>
      </div>
      <div className='reveal-text'>
        <img src={HeroCover} alt="" className='mt-16 w-[60rem] mb-16 rounded-xl shadow-[0_0_75px_-30px_rgba(0,0,0,0.75)]' />
      </div>
    </div>
  );
}

export default Hero;