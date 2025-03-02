import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusIcon, Square2StackIcon } from '@heroicons/react/24/solid';
import HeroCover from '../assets/App_UI.jpg';
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import SignUp from './ui/signup';
import { gsap } from 'gsap';
import SignIn from './ui/signin';
import { useAuth } from '@/context/auth-context';

function Hero() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const heroRef = useRef(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isJoinMeeting, setIsJoinMeeting] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);

  useEffect(() => {
    const elements = heroRef.current.querySelectorAll('.reveal-text');
    gsap.fromTo(
      elements,
      { y: 100, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, stagger: 0.2, ease: 'power2.inOut' }
    );
  }, []);

  const handleNewMeeting = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      handleDialogOpen(false);
    }
  };

  const handleDialogOpen = (isJoin) => {
    setIsJoinMeeting(isJoin);
    setDialogOpen(true);
  };

  const toggleAuth = () => {
    setShowSignIn(!showSignIn);
  };

  const JoinMeetingContent = () => (
    <div className="w-full">
      <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Join Meeting</h2>
      <input
        type="text"
        placeholder="Enter meeting code or link"
        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none bg-transparent dark:text-white"
      />
      <button className="w-full mt-4 bg-[#222222] dark:bg-white text-white dark:text-[#222222] py-2 rounded-lg">
        Join
      </button>
    </div>
  );

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

  const handleDialogChange = (open) => {
    setDialogOpen(open);
    if (!open) {
      setShowSignIn(false);
      setIsJoinMeeting(false);
    }
  };

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
        <Dialog open={dialogOpen} onOpenChange={handleDialogChange}>
          <DialogTrigger asChild>
            <button
              onClick={handleNewMeeting}
              className="bg-[#222222] dark:bg-white dark:text-[#222222] text-white py-2 px-4 sm:py-3 sm:px-5 scale-105 hover:bg-[#333333] dark:hover:bg-gray-100 hover:text-white rounded-md flex justify-center items-center gap-2 reveal-text"
            >
              <PlusIcon className="w-5 sm:w-6" />
              <span className="text-sm sm:text-base">New Meeting</span>
            </button>
          </DialogTrigger>
          <DialogContent className="dark:bg-[#121212]">
            {isJoinMeeting ? <JoinMeetingContent /> : <AuthContent />}
          </DialogContent>
        </Dialog>

        <button
          onClick={() => handleDialogOpen(true)}
          className="flex items-center gap-2 bg-white dark:bg-[#222222] border border-gray-300 dark:border-gray-600 rounded-full px-4 py-2.5 sm:px-5 sm:py-3 min-w-[260px] hover:border-gray-400 dark:hover:border-[#a3a3a3] transition-all duration-300 ease-in-out group"
        >
          <Square2StackIcon className="w-5 h-5 text-black dark:text-white" />
          <span className="text-black dark:text-white text-sm sm:text-base text-left flex-grow">
            Enter a code or link
          </span>
        </button>
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