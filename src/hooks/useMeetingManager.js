import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { generateRoomId } from '@/lib/utils';

/**
 * Orchestrates the meeting entry lifecycle (creation and joining).
 * 
 * Acts as a facade over the routing and auth layers, caching intended destinations
 * in `localStorage` to preserve user intent when authentication interrupts the flow.
 */
export function useMeetingManager() {
    const navigate = useNavigate();
    const { user } = useAuth();

    // Modal and form view states
    const [dialogOpen, setDialogOpen] = useState(false);
    const [isJoinMeeting, setIsJoinMeeting] = useState(false);
    const [showSignIn, setShowSignIn] = useState(false);
    const [showJoinDialog, setShowJoinDialog] = useState(false);

    // Controlled inputs
    const [meetingCode, setMeetingCode] = useState('');
    const [error, setError] = useState('');

    /**
     * Optimistically provisions a new room. If unauthenticated, defers creation
     * by surfacing the auth modal. `handleAuthSuccess` will complete the flow.
     */
    const startNewMeeting = useCallback(() => {
        if (user) {
            navigate(`/meeting/${generateRoomId()}`);
        } else {
            setShowSignIn(true);
            setDialogOpen(true);
        }
    }, [user, navigate]);

    /**
     * Validates and processes meeting joins originating from the primary hero form.
     * Prevents unauthenticated joins directly at the form level.
     */
    const joinMeeting = useCallback((e) => {
        if (e) e.preventDefault();

        if (!user) {
            setShowJoinDialog(true);
            return;
        }

        const cleanCode = meetingCode.trim();
        if (!cleanCode) {
            setError('Please enter a valid meeting code');
            return;
        }

        navigate(`/meeting/${cleanCode}`);
    }, [user, meetingCode, navigate]);

    /**
     * Processes manual join attempts, typically from secondary modals.
     * Caches the target code in storage to survive the OAuth/Login redirect cycle.
     */
    const handleManualJoin = useCallback(() => {
        const cleanCode = meetingCode.trim();
        if (!cleanCode) return;

        if (user) {
            navigate(`/meeting/${cleanCode}`);
        } else {
            localStorage.setItem('pendingMeetingCode', cleanCode);
            setShowSignIn(true);
            setDialogOpen(true);
        }
    }, [user, meetingCode, navigate]);

    /**
     * Recovery handler executed post-authentication.
     * Resolves any cached state (pending joins or creations) mapped prior to login.
     */
    const handleAuthSuccess = useCallback(() => {
        setDialogOpen(false);
        setShowSignIn(false);

        if (isJoinMeeting) {
            const pendingCode = localStorage.getItem('pendingMeetingCode');
            localStorage.removeItem('pendingMeetingCode');
            
            if (pendingCode) {
                navigate(`/meeting/${pendingCode}`);
            }
        } else {
            // Recover a specific room or generate a fresh one if the user just clicked "New Meeting"
            const roomId = localStorage.getItem('pendingRoomId') || generateRoomId();
            localStorage.removeItem('pendingRoomId');
            navigate(`/meeting/${roomId}`);
        }
    }, [isJoinMeeting, navigate]);

    return {
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

        startNewMeeting,
        joinMeeting,
        handleManualJoin,
        handleAuthSuccess
    };
}

