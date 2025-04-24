import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-hot-toast';

// Function to generate a random room ID like Google Meet
const generateRoomId = () => {
  const chars = 'abcdefghijkmnpqrstuvwxyz123456789';
  let code = '';
  
  // First part (3 characters)
  for (let i = 0; i < 3; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  code += '-';
  
  // Middle part (4 characters)
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  code += '-';
  
  // Last part (3 characters)
  for (let i = 0; i < 3; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return code;
};

function MeetingDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [meetingCode, setMeetingCode] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);

  const createNewMeeting = () => {
    const newMeetingCode = generateRoomId();
    navigate(`/meeting/${newMeetingCode}`);
  };

  const joinMeeting = (e) => {
    e.preventDefault();
    const code = meetingCode.trim().toLowerCase();
    
    if (!code) {
      setError('Please enter a meeting code');
      return;
    }

    // Basic validation for meeting code format (xxx-xxxx-xxx)
    const codePattern = /^[a-z0-9]{3}-[a-z0-9]{4}-[a-z0-9]{3}$/;
    if (!codePattern.test(code)) {
      setError('Invalid meeting code format. Example: abc-defg-hij');
      return;
    }

    navigate(`/meeting/${code}`);
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-[#121212] p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-[#1E1E1E] rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
            Welcome, {user?.displayName || user?.email}
          </h1>
          
          <div className="space-y-8">
            {/* New Meeting Button */}
            <button
              onClick={createNewMeeting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <span>🎥</span>
              Start New Meeting
            </button>

            {/* Join Meeting Section */}
            <div className="space-y-4">
              <div className="relative">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                  Join a Meeting
                </h2>
                <form onSubmit={joinMeeting} className="flex gap-4">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={meetingCode}
                      onChange={(e) => {
                        setMeetingCode(e.target.value.toLowerCase());
                        setError('');
                      }}
                      placeholder="Enter meeting code (e.g., abc-defg-hij)"
                      className="w-full bg-gray-50 dark:bg-[#2A2A2A] border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors font-mono"
                    />
                    {error && (
                      <p className="absolute -bottom-6 left-0 text-sm text-red-500">
                        {error}
                      </p>
                    )}
                  </div>
                  <button
                    type="submit"
                    className="bg-gray-200 hover:bg-gray-300 dark:bg-[#2A2A2A] dark:hover:bg-[#333333] text-gray-800 dark:text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
                  >
                    Join
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MeetingDashboard; 