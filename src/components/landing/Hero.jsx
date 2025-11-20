import React, { useEffect, useRef } from 'react';
import { PlusIcon } from '@heroicons/react/24/solid';
import HeroCover from '/src/assets/landing-page/App_UI.webp';
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import SignUp from '../auth/SignUp';
import { gsap } from 'gsap';
import SignIn from '../auth/SignIn';
import { useMeetingManager } from '@/hooks/useMeetingManager';

/**
 * Primary entry point for unauthenticated and authenticated users.
 * 
 * Defines the UI boundaries for meeting creation/joining and delegates the
 * underlying business logic (auth checks, routing, caching) to `useMeetingManager`.
 */
function Hero() {
  const heroRef = useRef(null);
  
  // Decoupled meeting orchestration logic
  const {
    user,
    dialogOpen,
    setDialogOpen,
    isJoinMeeting,
    setIsJoinMeeting,
    showSignIn,
    setShowSignIn,
    meetingCode,
    setMeetingCode,
    error,
    setError,
    showJoinDialog,
    setShowJoinDialog,
    startNewMeeting,
    handleManualJoin,
    joinMeeting,
    handleAuthSuccess
  } = useMeetingManager();

  /**
   * Mount-time GSAP orchestrations.
   * `requestAnimationFrame` ensures the DOM layout is fully painted before calculating 
   * initial animation states, preventing layout thrashing and jitter.
   */
  useEffect(() => {
    const animationFrame = requestAnimationFrame(() => {
      const elements = heroRef.current.querySelectorAll('.reveal-text');
      gsap.fromTo(
        elements,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.05, ease: 'power1.out' }
      );
    });

    return () => cancelAnimationFrame(animationFrame);
  }, []);

  /**
   * Enforces a clean modal state invariant.
   * Ensures no residual data (like previous meeting codes or errors) leaks into
   * subsequent modal openings.
   */
  const handleDialogChange = (open) => {
    setDialogOpen(open);
    if (!open) {
      setShowSignIn(false);
      setIsJoinMeeting(false);
      setMeetingCode('');
      setError('');
    }
  };

  const toggleAuth = () => setShowSignIn(prev => !prev);

  /**
   * Extracted sub-component to keep the primary render tree declarative.
   * Defined internally to close over the `useMeetingManager` context without prop-drilling.
   */
  const JoinMeetingContent = () => (
    <div className="w-full">
      <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 font-karla">Join Meeting</h2>
      <input
        type="text"
        value={meetingCode}
        onChange={(e) => setMeetingCode(e.target.value)}
        placeholder="Enter meeting code or link"
        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none bg-transparent dark:text-white font-light"
      />
      <button
        onClick={handleManualJoin}
        className="w-full mt-4 bg-[#222222] dark:bg-white text-white dark:text-[#222222] py-2 rounded-lg font-medium"
      >
        Join
      </button>
    </div>
  );

  return (
    <div
      ref={heroRef}
      className="font-karla px-4 sm:px-6 md:px-8 lg:px-16 xl:px-28 flex flex-col items-center text-center pt-20 sm:pt-24 md:pt-20 lg:pt-16 xl:pt-14 bg-[#fafafa] dark:bg-[#0a0a1a]"
    >
      <h1 className="reveal-text font-bold text-3xl sm:text-4xl md:text-5xl lg:text-6xl mt-8 sm:mt-12 md:mt-16 lg:mt-24 text-[#222222] dark:text-white leading-tight">
        Create Meetings with ease
      </h1>
      <p className="reveal-text font-light text-sm sm:text-base md:text-lg mt-3 sm:mt-4 md:mt-5 text-[#666666] dark:text-gray-300 max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl">
        Effortlessly connect with high-quality video and audio. Experience engaging meetings that bring your team closer.
      </p>
      <div className="flex flex-col sm:flex-row mt-4 sm:mt-5 md:mt-6 justify-center gap-2 sm:gap-3 md:gap-4 reveal-text w-full max-w-md sm:max-w-none">
        <Dialog open={dialogOpen} onOpenChange={handleDialogChange}>
          <DialogTrigger asChild>
            <button
              onClick={startNewMeeting}
              className="bg-[#222222] dark:bg-white dark:text-[#222222] text-white py-2 px-4 sm:py-3 sm:px-5 scale-105 hover:bg-[#333333] dark:hover:bg-gray-100 hover:text-white rounded-md flex justify-center items-center gap-2 reveal-text transform-gpu font-semibold w-full sm:w-auto"
            >
              <PlusIcon className="w-5 sm:w-6" />
              <span className="text-sm sm:text-base">New Meeting</span>
            </button>
          </DialogTrigger>
          <DialogContent className="dark:bg-[#121212] flex items-center justify-center">
            {isJoinMeeting ? <JoinMeetingContent /> :
              <div className="w-full">
                {showSignIn ? (
                  <>
                    <SignIn
                      onToggle={toggleAuth}
                      onSuccess={handleAuthSuccess}
                    />
                    <button
                      onClick={toggleAuth}
                      className="w-full mt-4 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-light"
                    >
                      Don't have an account? Sign Up
                    </button>
                  </>
                ) : (
                  <>
                    <SignUp onToggleAuth={toggleAuth} />
                    <button
                      onClick={toggleAuth}
                      className="w-full mt-4 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-light"
                    >
                      Already have an account? Sign In
                    </button>
                  </>
                )}
              </div>
            }
          </DialogContent>
        </Dialog>

        <form onSubmit={joinMeeting} className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-auto">
            <input
              type="text"
              value={meetingCode}
              onChange={(e) => {
                setMeetingCode(e.target.value);
                setError('');
              }}
              placeholder="Enter a code or link"
              className="bg-[#1E1E1E] border border-gray-700 text-white px-4 py-4 rounded-xl w-full sm:w-[300px] focus:outline-none focus:border-blue-500 font-light"
            />
            {error && (
              <p className="absolute -bottom-6 left-0 text-red-500 text-sm">
                {error}
              </p>
            )}
          </div>
          <button
            type="submit"
            className="bg-[#222222] dark:bg-white text-white dark:text-[#222222] hover:bg-gray-800 dark:hover:bg-gray-200 py-3 px-6 rounded-xl font-semibold transition-colors w-full sm:w-auto text-sm sm:text-base"
          >
            Join
          </button>
        </form>
      </div>
      <div className="reveal-text w-full max-w-[20rem] sm:max-w-[32rem] md:max-w-[48rem] lg:max-w-[64rem] xl:max-w-[72rem] mt-8 sm:mt-10 md:mt-12 lg:mt-16">
        <img
          src={HeroCover}
          alt="App UI Cover"
          className="w-full h-auto rounded-xl shadow-[0_0_75px_-30px_rgba(0,0,0,0.75)] dark:shadow-[0_0_75px_-30px_rgba(255,255,255,0.25)] transform-gpu"
          loading="lazy"
          decoding="async"
        />
      </div>

      {/* Join Dialog */}
      {showJoinDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#1E1E1E] rounded-2xl p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-medium mb-4">Sign in required</h2>
            <p className="text-gray-400 mb-6 font-light">
              Please sign in to create or join a meeting.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowJoinDialog(false)}
                className="text-gray-400 hover:text-white font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowJoinDialog(false);
                  setShowSignIn(true);
                  setDialogOpen(true);
                }}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-xl font-medium transition-colors"
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
