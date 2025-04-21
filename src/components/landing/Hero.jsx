import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusIcon } from '@heroicons/react/24/solid';
import HeroCover from '/src/assets/landing-page/App_UI.jpg';
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import SignUp from '../auth/SignUp';
import { gsap } from 'gsap';
import SignIn from '../auth/SignIn';
import { useAuth } from '@/context/AuthContext';

function Hero() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const heroRef = useRef(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isJoinMeeting, setIsJoinMeeting] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);
  const [meetingCode, setMeetingCode] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const animationFrame = requestAnimationFrame(() => {
      const elements = heroRef.current.querySelectorAll('.reveal-text');
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

  const handleNewMeeting = () => {
    if (user) {
      const newRoomCode = generateRoomCode();
      localStorage.setItem(`room_${newRoomCode}_host`, user.uid);
      localStorage.setItem('current_room_code', newRoomCode);
      navigate(`/meeting/${newRoomCode}`);
    } else {
      setShowSignIn(true);
      setDialogOpen(true);
    }
  };

  const handleJoinMeeting = () => {
    if (meetingCode.trim()) {
      if (user) {
        navigate(`/meeting/${meetingCode.trim()}`);
      } else {
        setShowSignIn(true);
        setDialogOpen(true);
      }
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
      <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 font-sofia">Join Meeting</h2>
      <input
        type="text"
        value={meetingCode}
        onChange={(e) => setMeetingCode(e.target.value)}
        placeholder="Enter meeting code or link"
        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none bg-transparent dark:text-white font-sofia-light"
      />
      <button 
        onClick={handleJoinMeeting}
        className="w-full mt-4 bg-[#222222] dark:bg-white text-white dark:text-[#222222] py-2 rounded-lg font-sofia-medium"
      >
        Join
      </button>
    </div>
  );

  const AuthContent = () => (
    <div className="w-full">
      {showSignIn ? (
        <>
          <SignIn 
            onToggle={toggleAuth} 
            onSuccess={() => {
              setDialogOpen(false);
              setShowSignIn(false);
              
              if (!isJoinMeeting) {
                const newRoomCode = generateRoomCode();
                navigate(`/meeting/${newRoomCode}`);
              }
            }} 
          />
          <button
            onClick={toggleAuth}
            className="w-full mt-4 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-sofia-light"
          >
            Don't have an account? Sign Up
          </button>
        </>
      ) : (
        <>
          <SignUp onToggleAuth={toggleAuth} />
          <button
            onClick={toggleAuth}
            className="w-full mt-4 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-sofia-light"
          >
            Already have an account? Sign In
          </button>
        </>
      )}
    </div>
  );

  const handleDialogChange = (open) => {
    setDialogOpen(open);
    if (!open) {
      setShowSignIn(false);
      setIsJoinMeeting(false);
      setMeetingCode('');
    }
  };

  // Unique room id
  const generateRoomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 10; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  // new meeting creation
  const createMeeting = () => {
    if (!user) {
      setShowJoinDialog(true);
      return;
    }
    const newRoomCode = generateRoomCode();
    navigate(`/meeting/${newRoomCode}`);
  };

  // join an existing meeting
  const joinMeeting = (e) => {
    e.preventDefault();
    if (!user) {
      setShowJoinDialog(true);
      return;
    }
    if (!roomCode.trim()) {
      setError('Please enter a room code');
      return;
    }
    navigate(`/meeting/${roomCode.trim()}`);
  };

  return (
    <div
      ref={heroRef}
      className="font-sofia px-4 sm:px-6 md:px-8 lg:px-16 xl:px-28 flex flex-col items-center text-center pt-20 sm:pt-24 md:pt-20 lg:pt-16 xl:pt-14 dark:bg-[#121212]"
    >
      <h1 className="reveal-text font-bold text-4xl sm:text-3xl md:text-4xl lg:text-5xl mt-8 sm:mt-12 md:mt-16 lg:mt-24 text-[#222222] dark:text-white leading-tight">
        Create Meetings with ease
      </h1>
      <p className="reveal-text font-sofia-light text-sm sm:text-base md:text-md mt-3 sm:mt-4 md:mt-5 text-[#666666] dark:text-gray-300 max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl">
        Effortlessly connect with high-quality video and audio. Experience engaging meetings that bring your team closer.
      </p>
      <div className="flex mt-4 sm:mt-5 md:mt-6 justify-center gap-2 sm:gap-3 md:gap-4 reveal-text">
        <Dialog open={dialogOpen} onOpenChange={handleDialogChange}>
          <DialogTrigger asChild>
            <button
              onClick={handleNewMeeting}
              className="bg-[#222222] dark:bg-white dark:text-[#222222] text-white py-2 px-4 sm:py-3 sm:px-5 scale-105 hover:bg-[#333333] dark:hover:bg-gray-100 hover:text-white rounded-md flex justify-center items-center gap-2 reveal-text transform-gpu font-sofia-medium"
            >
              <PlusIcon className="w-5 sm:w-6" />
              <span className="text-sm sm:text-base">New Meeting</span>
            </button>
          </DialogTrigger>
          <DialogContent className="dark:bg-[#121212] flex items-center justify-center">
            {isJoinMeeting ? <JoinMeetingContent /> : <AuthContent />}
          </DialogContent>
        </Dialog>

        <form onSubmit={joinMeeting} className="flex items-center gap-4">
          <div className="relative">
            <input
              type="text"
              value={roomCode}
              onChange={(e) => {
                setRoomCode(e.target.value.toUpperCase());
                setError('');
              }}
              placeholder="Enter a code or link"
              className="bg-[#1E1E1E] border border-gray-700 text-white px-4 py-4 rounded-xl w-[300px] focus:outline-none focus:border-blue-500 font-sofia-light"
            />
            {error && (
              <p className="absolute -bottom-6 left-0 text-red-500 text-sm">
                {error}
              </p>
            )}
          </div>
          <button
            type="submit"
            className="text-blue-500 hover:text-blue-400 font-sofia-medium transition-colors"
          >
            Join
          </button>
        </form>
      </div>
      <div className="reveal-text w-[64rem] max-w-[90%] sm:max-w-[80%] md:max-w-[100%] lg:mb-16">
        <img
          src={HeroCover}
          alt="App UI Cover"
          className="mt-8 sm:mt-10 md:mt-12 lg:mt-16 w-full rounded-xl shadow-[0_0_75px_-30px_rgba(0,0,0,0.75)] dark:shadow-[0_0_75px_-30px_rgba(255,255,255,0.25)] transform-gpu"
          loading="lazy"
          decoding="async"
        />
      </div>

      {/* Join Dialog */}
      {showJoinDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#1E1E1E] rounded-2xl p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-sofia-medium mb-4">Sign in required</h2>
            <p className="text-gray-400 mb-6 font-sofia-light">
              Please sign in to create or join a meeting.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowJoinDialog(false)}
                className="text-gray-400 hover:text-white font-sofia-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowJoinDialog(false);
                  // Add your sign-in logic here
                }}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-xl font-sofia-medium transition-colors"
              >
                Sign in
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Hero;