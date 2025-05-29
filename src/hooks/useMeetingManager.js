import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { generateRoomId } from '@/lib/utils';

export function useMeetingManager() {
    const navigate = useNavigate();
    const { user } = useAuth();

    // UI State
    const [dialogOpen, setDialogOpen] = useState(false);
    const [isJoinMeeting, setIsJoinMeeting] = useState(false);
    const [showSignIn, setShowSignIn] = useState(false);
    const [meetingCode, setMeetingCode] = useState('');
    const [error, setError] = useState('');
    const [showJoinDialog, setShowJoinDialog] = useState(false);

    const startNewMeeting = () => {
        if (user) {
            const newRoomId = generateRoomId();
            navigate(`/meeting/${newRoomId}`);
        } else {
            setShowSignIn(true);
            setDialogOpen(true);
        }
    };

    const joinMeeting = (e) => {
        if (e) e.preventDefault();

        if (!user) {
            setShowJoinDialog(true);
            return;
        }

        if (!meetingCode.trim()) {
            setError('Please enter a meeting code');
            return;
        }

        navigate(`/meeting/${meetingCode.trim()}`);
    };

    const handleManualJoin = () => {
        if (meetingCode.trim()) {
            if (user) {
                navigate(`/meeting/${meetingCode.trim()}`);
            } else {
                setShowSignIn(true);
                setDialogOpen(true);
                localStorage.setItem('pendingMeetingCode', meetingCode.trim());
            }
        }
    }

    const handleAuthSuccess = () => {
        setDialogOpen(false);
        setShowSignIn(false);

        if (isJoinMeeting) {
            const code = localStorage.getItem('pendingMeetingCode');
            localStorage.removeItem('pendingMeetingCode');
            if (code) {
                navigate(`/meeting/${code}`);
            }
        } else {
            const roomId = localStorage.getItem('pendingRoomId') || generateRoomId();
            localStorage.removeItem('pendingRoomId');
            navigate(`/meeting/${roomId}`);
        }
    };

    return {
        // State
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
        user,

        // Actions
        startNewMeeting,
        joinMeeting,
        handleManualJoin,
        handleAuthSuccess
    };
}
