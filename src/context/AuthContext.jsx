import { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '@/services/authService';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged((user) => {
      setUser(user);
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

  const value = {
    user,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    logout
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