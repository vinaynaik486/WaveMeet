import { useState } from 'react';
import { useAuth } from '@/context/auth-context';
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
      await signUpWithEmail(email, password);
    } catch (error) {
      setError(error.message);
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
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center">
      <div className="bg-white dark:bg-[#121212] p-8 rounded-lg shadow-lg max-w-sm w-full">
        <div className="flex mb-6">
          <img src={websiteLogo} alt="Logo" className="w-16" />
        </div>
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 text-left mt-6">Create your account</h2>
        <p className="text-gray-500 dark:text-gray-400 text-left mb-6 mt-2">to continue to WaveMeet</p>

        {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="flex items-center justify-center w-full py-2 mb-4 bg-white dark:bg-[#121212] border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
        >
          <img src="https://www.svgrepo.com/show/355037/google.svg" alt="Google Logo" className="h-5 w-5 mr-2" />
          <span className="text-gray-700 dark:text-gray-300">Continue with Google</span>
        </button>

        <div className="flex items-center my-6">
          <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
          <span className="flex-shrink mx-4 text-gray-500 dark:text-gray-400">or</span>
          <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <p className="text-gray-900 dark:text-gray-100 text-left mb-1">First Name</p>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg mb-2 focus:outline-none bg-white dark:bg-[#121212] text-gray-900 dark:text-gray-100"
              required
            />
          </div>
          <div className="flex-1">
            <p className="text-gray-900 dark:text-gray-100 text-left mb-1">Last Name</p>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg mb-2 focus:outline-none bg-white dark:bg-[#121212] text-gray-900 dark:text-gray-100"
              required
            />
          </div>
        </div>

        <p className="text-gray-900 dark:text-gray-100 text-left mb-1 mt-2">Email address</p>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg mb-1 focus:outline-none bg-white dark:bg-[#121212] text-gray-900 dark:text-gray-100"
          required
        />

        <p className="text-gray-900 dark:text-gray-100 text-left mb-1 mt-2">Password</p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg mb-4 focus:outline-none bg-white dark:bg-[#121212] text-gray-900 dark:text-gray-100"
          required
        />

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition disabled:bg-gray-400 dark:disabled:bg-gray-600"
        >
          {loading ? 'Loading...' : 'Sign Up'}
        </button>

        <button
          onClick={onToggleAuth}
          className="w-full mt-4 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
        >
          Already have an account? Sign In
        </button>
      </div>
    </div>
  );
}