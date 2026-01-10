import React, { useEffect, useRef } from 'react';
import { PlusIcon } from '@heroicons/react/24/solid';
import HeroCover from '/src/assets/landing-page/hero-img.webp';
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import SignUp from '../auth/SignUp';
import SignIn from '../auth/SignIn';
import BlurIn from '../ui/BlurIn';
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
  // Removed GSAP orchestrations in favor of BlurIn (framer-motion)

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
      className="font-karla px-4 sm:px-6 md:px-8 lg:px-16 xl:px-28 max-w-screen-2xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-12 pt-20 sm:pt-24 md:pt-32 lg:pt-36 pb-20 bg-background overflow-hidden min-h-[calc(100vh-80px)]"
    >
      {/* Left Content */}
      <div className="flex-1 flex flex-col items-start text-left w-full lg:max-w-xl xl:max-w-2xl z-10">
        <BlurIn delay={0.1}>
          <h1 className="font-bold text-4xl sm:text-5xl md:text-6xl text-[#222222] dark:text-white leading-[1.1] tracking-tight">
            Effortless video meetings <br />
            for fast teams
          </h1>
        </BlurIn>

        <BlurIn delay={0.2}>
          <p className="font-light text-lg mt-4 sm:mt-6 text-black dark:text-gray-300 max-w-lg">
            Join calls instantly, collaborate in real time, and keep your team aligned without delays or distractions.
          </p>
        </BlurIn>

        <BlurIn delay={0.3} className="w-full mt-8 sm:mt-10 lg:mt-12">
          <div className="flex items-center w-full max-w-lg bg-transparent border border-gray-300 dark:border-gray-700 rounded-full p-1.5">
            <Dialog open={dialogOpen} onOpenChange={handleDialogChange}>
              <DialogTrigger asChild>
                <button
                  onClick={startNewMeeting}
                  className="bg-[#FE583E] hover:bg-[#E04D36] text-white py-2.5 px-5 sm:px-6 rounded-full flex justify-center items-center gap-2 transform-gpu font-medium transition-colors"
                >
                  <PlusIcon className="w-5 sm:w-5" />
                  <span className="text-sm sm:text-base whitespace-nowrap">New Meeting</span>
                </button>
              </DialogTrigger>
              <DialogContent className="dark:bg-[#121212] p-8 max-w-sm sm:max-w-md border-none shadow-2xl">
                {isJoinMeeting ? <JoinMeetingContent /> :
                  <div className="w-full">
                    {showSignIn ? (
                      <SignIn
                        onToggle={toggleAuth}
                        onSuccess={handleAuthSuccess}
                        onClose={() => handleDialogChange(false)}
                      />
                    ) : (
                      <SignUp 
                        onToggleAuth={toggleAuth} 
                        onClose={() => handleDialogChange(false)}
                      />
                    )}
                  </div>
                }
              </DialogContent>
            </Dialog>

            <form onSubmit={joinMeeting} className="flex-1 flex items-center ml-2 relative">
              <input
                type="text"
                value={meetingCode}
                maxLength={14}
                onChange={(e) => {
                  const rawValue = e.target.value.replace(/[^a-zA-Z0-9]/g, '');
                  const match = rawValue.match(/.{1,4}/g);
                  const formattedValue = match ? match.join('-') : '';
                  setMeetingCode(formattedValue);
                  setError('');
                }}
                placeholder="Enter meeting code"
                className="w-full bg-transparent border border-gray-300 dark:border-gray-600 rounded-md text-gray-800 dark:text-white px-3 py-2 focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 font-light text-sm sm:text-base placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
              />
              {error && (
                <p className="absolute -bottom-8 left-0 text-red-500 text-xs sm:text-sm">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={meetingCode.trim().length === 0}
                className={`font-normal px-4 py-2 ml-1 transition-all duration-200 text-sm sm:text-base whitespace-nowrap rounded-full ${
                  meetingCode.trim().length > 0
                    ? 'text-[#FE583E] bg-transparent hover:bg-[#FE583E]/10 cursor-pointer'
                    : 'text-gray-400 dark:text-gray-600 bg-transparent cursor-not-allowed'
                }`}
              >
                Join
              </button>
            </form>
          </div>
        </BlurIn>
      </div>

      {/* Right Image Content */}
      <div className="flex-1 w-full mt-12 lg:mt-0 flex justify-center lg:justify-end relative">
        <BlurIn delay={0.4} className="w-full max-w-[18rem] sm:max-w-[24rem] md:max-w-[28rem] lg:max-w-[32rem] xl:max-w-[36rem]">
          <img
            src={HeroCover}
            alt="App UI Cover"
            className="w-full h-auto object-contain rounded-2xl"
            loading="lazy"
            decoding="async"
          />
        </BlurIn>
      </div>

      {/* Join Dialog */}
      {showJoinDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-gray-800 rounded-2xl p-8 max-w-md w-full mx-4 shadow-xl">
            <h2 className="text-2xl font-medium mb-4 text-[#222222] dark:text-white">Log in required</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6 font-light">
              Please log in to create or join a meeting.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowJoinDialog(false)}
                className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowJoinDialog(false);
                  setShowSignIn(true);
                  setDialogOpen(true);
                }}
                className="bg-[#FE583E] hover:bg-[#E04D36] text-white px-6 py-2 rounded-full font-medium transition-colors shadow-lg shadow-[#FE583E]/20"
              >
                Log in
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Hero;
