import { auth } from '@/lib/firebase';
import {
    GoogleAuthProvider,
    signInWithPopup,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile
} from 'firebase/auth';

export const authService = {
    signInWithGoogle: async () => {
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            return result.user;
        } catch (error) {
            console.error('Error signing in with Google:', error);
            throw error;
        }
    },

    signInWithEmail: async (email, password) => {
        try {
            const result = await signInWithEmailAndPassword(auth, email, password);
            return result.user;
        } catch (error) {
            console.error('Error signing in with email:', error);
            throw error;
        }
    },

    signUpWithEmail: async (email, password) => {
        try {
            const result = await createUserWithEmailAndPassword(auth, email, password);
            return result.user;
        } catch (error) {
            console.error('Error signing up with email:', error);
            throw error;
        }
    },

    logout: async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error('Error signing out:', error);
            throw error;
        }
    },

    onAuthStateChanged: (callback) => {
        return onAuthStateChanged(auth, callback);
    },
    
    updateProfile: async (displayName, photoURL) => {
        if (!auth.currentUser) return;
        await updateProfile(auth.currentUser, { displayName, photoURL });
        return auth.currentUser;
    }
};
