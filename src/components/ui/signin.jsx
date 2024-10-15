import { useState } from 'react';
import websiteLogo from '@/assets/logo/logo.png';


export default function SignIn() {
  const [useEmail, setUseEmail] = useState(false);

  return (
    <div className="flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-sm w-full">
        <div className="flex justify-center mb-6">
          {/* Logo */}
          <img src={websiteLogo} alt="Logo" className="w-16" />
        </div>
        <h2 className="text-2xl font-semibold text-gray-800 text-center">Welcome Back!</h2>
        <p className="text-gray-500 text-center mb-6">to continue to WaveMeet</p>

        {/* Google Sign-in Button */}
        <button className="flex items-center justify-center w-full py-2 mb-4 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition">
          <img src="https://www.svgrepo.com/show/355037/google.svg" alt="Google Logo" className="h-5 w-5 mr-2" />
          <span className="text-gray-700">Continue with Google</span>
        </button>

        {/* Separator */}
        <div className="flex items-center my-6">
          <div className="flex-grow border-t border-gray-300"></div>
          <span className="flex-shrink mx-4 text-gray-500">or</span>
          <div className="flex-grow border-t border-gray-300"></div>
        </div>

        {/* Phone Number or Email Input */}
        {!useEmail ? (
          <div className="flex items-center border border-gray-300 rounded-lg mb-4">
            <select className="border-r border-gray-300 p-2 bg-gray-50 text-gray-700">
              <option value="+91">IN +91</option>
            </select>
            <input
              type="tel"
              placeholder="Phone number"
              className="flex-1 p-2 focus:outline-none"
            />
          </div>
        ) : (
          <input
            type="email"
            placeholder="Email"
            className="w-full p-2 border border-gray-300 rounded-lg mb-4 focus:outline-none"
          />
        )}

        {/* Use email option */}
        <div className="flex justify-end text-sm text-gray-500 hover:text-gray-400 cursor-pointer mb-4" onClick={() => setUseEmail(!useEmail)}>
          {useEmail ? 'Use phone number' : 'Use email'}
        </div>

        {/* Continue Button */}
        <button className="w-full py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition">Continue</button>
      </div>
    </div>
  );
}
