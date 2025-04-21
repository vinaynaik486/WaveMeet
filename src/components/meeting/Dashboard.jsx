import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

// Function to generate a random room ID
const generateRoomId = () => {
  const chars = 'abcdefghijkmnpqrstuvwxyz'; // Removed confusing characters like 'l', 'o'
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
  const [roomId, setRoomId] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);

  const createNewMeeting = async () => {
    setIsCreating(true);
    try {
      const newRoomId = generateRoomId();
      navigate(`/meeting/${newRoomId}`);
    } catch (error) {
      console.error('Error creating meeting:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-[#121212] p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-[#1E1E1E] rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
            Welcome, {user?.displayName || user?.email}
          </h1>
          
          <div className="space-y-4">
            <button
              onClick={createNewMeeting}
              disabled={isCreating}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            >
              {isCreating ? (
                <>
                  <span className="animate-spin">⌛</span>
                  Creating Meeting...
                </>
              ) : (
                <>
                  <span>🎥</span>
                  Start New Meeting
                </>
              )}
            </button>

            {roomId && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-[#2A2A2A] rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Meeting created! Room ID: {roomId}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Share this ID with others to join your meeting
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MeetingDashboard; 