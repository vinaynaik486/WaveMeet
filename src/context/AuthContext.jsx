import { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '@/services/authService';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';
          const res = await fetch(`${API}/api/auth/me?uid=${firebaseUser.uid}`);
          if (res.ok) {
            const data = await res.json();
            if (data.user && data.user.settings) {
              firebaseUser.settings = data.user.settings;
            }
          }
        } catch (e) {
          console.warn('Failed to fetch DB user settings', e);
        }
      }
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    await authService.signInWithGoogle();
  };

  const signInWithEmail = async (email, password) => {
    await authService.signInWithEmail(email, password);
  };

  const signUpWithEmail = async (email, password) => {
    await authService.signUpWithEmail(email, password);
  };

  const logout = async () => {
    await authService.logout();
  };

  const updateProfile = async (displayName, photoURL) => {
    const updatedUser = await authService.updateProfile(displayName, photoURL);
    if (updatedUser) setUser({ ...user, ...updatedUser }); // Trigger state update
  };

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

export function useAuth() {
  return useContext(AuthContext);
}
