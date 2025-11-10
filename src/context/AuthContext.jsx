import { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '@/services/authService';

/**
 * Global Authentication Context.
 * 
 * Manages the user session lifecycle and bridges the gap between Firebase Auth 
 * and the application's proprietary database (hydration of user settings).
 */
const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  
  // Blocks the main render tree until the initial auth state is resolved.
  // Prevents layout thrashing and accidental unauthenticated routing on hard refreshes.
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ---------------------------------------------------------------------------
    // Auth State Observer & Hydration
    // ---------------------------------------------------------------------------
    const unsubscribe = authService.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';
          
          // Hydrate the Firebase user object with custom MongoDB settings (e.g., default mic/cam state)
          const res = await fetch(`${API}/api/auth/me?uid=${firebaseUser.uid}`);
          if (res.ok) {
            const data = await res.json();
            if (data.user && data.user.settings) {
              firebaseUser.settings = data.user.settings;
            }
          }
        } catch (e) {
          console.warn('[AUTH HYDRATION ERROR] Failed to fetch DB user settings', e);
        }
      }
      setUser(firebaseUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // ---------------------------------------------------------------------------
  // Provider Methods
  // ---------------------------------------------------------------------------

  const signInWithGoogle = async () => await authService.signInWithGoogle();
  const signInWithEmail = async (email, password) => await authService.signInWithEmail(email, password);
  const signUpWithEmail = async (email, password) => await authService.signUpWithEmail(email, password);
  const logout = async () => await authService.logout();

  /**
   * Synchronizes profile updates to Firebase and forces a local state re-render.
   */
  const updateProfile = async (displayName, photoURL) => {
    const updatedUser = await authService.updateProfile(displayName, photoURL);
    if (updatedUser) setUser(prev => ({ ...prev, ...updatedUser }));
  };

  /**
   * Optimistically updates the local user settings. 
   * (Persistence to the database should be handled by the caller).
   */
  const updateUserSettings = (newSettings) => {
    setUser(prev => ({ ...prev, settings: { ...prev.settings, ...newSettings } }));
  };

  const value = {
    user,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    logout,
    updateProfile,
    updateUserSettings
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

/**
 * Consumes the active authentication session.
 * Must be used within an <AuthProvider> boundary.
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error('useAuth must be used within an AuthProvider boundary');
  }
  return ctx;
}
