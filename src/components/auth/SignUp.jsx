import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import websiteLogo from '@/assets/logo/logo.png';

export default function SignUp({ onToggleAuth }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { signUpWithEmail, signInWithGoogle } = useAuth();

  const handleSubmit = async () => {
    if (!firstName || !lastName || !email || !password) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await signUpWithEmail(email, password, `${firstName} ${lastName}`);
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        setError(
          <div className="text-center mb-4">
            <p className="text-red-500 mb-2">This email is already registered.</p>
            <button
              onClick={onToggleAuth}
              className="text-blue-500 hover:text-blue-600 underline"
            >
              Click here to login instead
            </button>
          </div>
        );
      } else {
        setError('Failed to create an account. Please try again.');
      }
      console.error('Sign up error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithGoogle();
    } catch (error) {
      if (error.code === 'auth/account-exists-with-different-credential') {
        setError(
          <div className="text-center mb-4">
            <p className="text-red-500 mb-2">An account already exists with this email.</p>
            <button
              onClick={onToggleAuth}
              className="text-blue-500 hover:text-blue-600 underline"
            >
              Click here to login instead
            </button>
          </div>
        );
      } else {
        setError('Failed to sign up with Google. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#121212] p-6 rounded-lg shadow-lg max-w-sm w-full">
      <div className="flex mb-4">
        <img src={websiteLogo} alt="Logo" className="w-16" />
      </div>
      <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 text-left mt-4">Create your account</h2>
      <p className="text-gray-500 dark:text-gray-400 text-left mb-4 mt-2">to continue to WaveMeet</p>

      {error && (
        <div className="mb-4 bg-red-500/10 p-4 rounded-lg">
          {typeof error === 'string' ? (
            <p className="text-red-500 text-center">{error}</p>
          ) : (
            error
          )}
        </div>
      )}

      <button
        onClick={handleGoogleSignIn}
        disabled={loading}
        className="flex items-center justify-center w-full py-2 mb-4 bg-white dark:bg-[#121212] border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
      >
        <img src="https://www.svgrepo.com/show/355037/google.svg" alt="Google Logo" className="h-5 w-5 mr-2" />
        <span className="text-gray-700 dark:text-gray-300">Continue with Google</span>
      </button>

      <div className="flex items-center mb-4">
        <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
        <span className="flex-shrink mx-4 text-gray-500 dark:text-gray-400">or</span>
        <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
      </div>

      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <p className="text-gray-900 dark:text-gray-100 text-left mb-1">First Name</p>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none bg-white dark:bg-[#121212] text-gray-900 dark:text-gray-100"
              required
            />
          </div>
          <div className="flex-1">
            <p className="text-gray-900 dark:text-gray-100 text-left mb-1">Last Name</p>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none bg-white dark:bg-[#121212] text-gray-900 dark:text-gray-100"
              required
            />
          </div>
        </div>

        <div>
          <p className="text-gray-900 dark:text-gray-100 text-left mb-1">Email address</p>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none bg-white dark:bg-[#121212] text-gray-900 dark:text-gray-100"
            required
          />
        </div>

        <div>
          <p className="text-gray-900 dark:text-gray-100 text-left mb-1">Password</p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none bg-white dark:bg-[#121212] text-gray-900 dark:text-gray-100"
            required
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition disabled:bg-gray-400 dark:disabled:bg-gray-600"
        >
          {loading ? 'Loading...' : 'Sign Up'}
        </button>
      </div>
    </div>
  );
}