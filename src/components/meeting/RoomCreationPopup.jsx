import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCopy, FaTimes } from 'react-icons/fa';
import { useAuth } from '@/context/AuthContext';

const RoomCreationPopup = ({ roomId, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [showCopyToast, setShowCopyToast] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      setCopied(true);
      setShowCopyToast(true);
      setTimeout(() => {
        setCopied(false);
        setShowCopyToast(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy room code:', err);
    }
  };

  return (
    <div className="relative">
      <div className="fixed bottom-4 left-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 max-w-sm animate-slide-up">
        <div className="flex justify-between items-start mb-2">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Meeting Is Ready</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Share this code with others to join your meeting
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <FaTimes />
          </button>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 p-2 rounded-md">
            <code className="flex-1 text-sm font-mono text-gray-800 dark:text-gray-200">
              {roomId}
            </code>
            <button
              onClick={copyToClipboard}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
              title="Copy to clipboard"
            >
              <FaCopy className="text-gray-600 dark:text-gray-300" />
            </button>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Joined as {user?.email}
          </p>
        </div>
      </div>

      {/* Copy Toast Notification */}
      <div
        className={`fixed bottom-28 left-4 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg transition-all duration-300 flex items-center gap-2 ${
          showCopyToast ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
        }`}
      >
        <span className="text-sm font-sofia-medium">Copied meeting link</span>
      </div>
    </div>
  );
};

export default RoomCreationPopup; 