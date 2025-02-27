import React, { useEffect, useRef, useState } from 'react';
import Btn from './ui/btn';
import HeroCover from '../assets/App_UI.jpg';
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import SignUp from './ui/signup';
import { gsap } from 'gsap';
import SignIn from './ui/signin';

function Hero() {
  const heroRef = useRef(null);
  const [showSignIn, setShowSignIn] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const elements = heroRef.current.querySelectorAll('.reveal-text');
    gsap.fromTo(
      elements,
      { y: 100, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, stagger: 0.2, ease: 'power2.inOut' }
    );
  }, []);
  const toggleAuth = () => {
    setShowSignIn(!showSignIn);
  };
  const AuthContent = () => (
    <div className="w-full">
      {showSignIn ? <SignIn /> : <SignUp />}
      <button
        onClick={toggleAuth}
        className="w-full mt-4 text-sm text-gray-600 hover:text-gray-800"
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
      ref={heroRef}
      className="font-sofia px-4 sm:px-6 md:px-8 lg:px-16 xl:px-28 flex flex-col items-center text-center pt-20 sm:pt-24 md:pt-20 lg:pt-16 xl:pt-14 dark:bg-[#121212]"
    >
      <h1 className="reveal-text font-bold text-4xl sm:text-3xl md:text-4xl lg:text-5xl mt-8 sm:mt-12 md:mt-16 lg:mt-24 text-[#222222] dark:text-white leading-tight">
        Create Meetings with ease
      </h1>
      <p className="reveal-text font-sofia-ultralight text-sm sm:text-base md:text-md mt-3 sm:mt-4 md:mt-5 text-[#666666] dark:text-gray-300 max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl">
        Effortlessly connect with high-quality video and audio. Experience engaging meetings that bring your team closer.
      </p>
      <div className="flex mt-4 sm:mt-5 md:mt-6 justify-center gap-2 sm:gap-3 md:gap-4 reveal-text">
        <Btn ref={heroRef} text={'Create Meeting'} />
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <button className="border border-gray-400 rounded-md px-3 py-2 sm:px-4 sm:py-2 md:px-5 md:py-3 text-sm sm:text-base md:text-lg hover:scale-105 hover:border-black dark:hover:border-white dark:text-white transition-all duration-300 ease-in-out">
              {showSignIn ? "Register Now" : "Login"}
            </button>
          </DialogTrigger>
          <DialogContent className="dark:bg-gray-800">
            <AuthContent />
          </DialogContent>
        </Dialog>
      </div>
      <div className="reveal-text w-[64rem] max-w-[90%] sm:max-w-[80%] md:max-w-[100%] lg:mb-16">
        <img
          src={HeroCover}
          alt="App UI Cover"
          className="mt-8 sm:mt-10 md:mt-12 lg:mt-16 w-full rounded-xl shadow-[0_0_75px_-30px_rgba(0,0,0,0.75)] dark:shadow-[0_0_75px_-30px_rgba(255,255,255,0.25)]"
        />
      </div>
    </div>
  );
}

export default Hero;