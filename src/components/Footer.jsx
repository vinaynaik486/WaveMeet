import { Typography } from "@material-tailwind/react";
import websiteLogo from '../assets/logo/logo.png';

function Footer() {
  return (
    <footer className="w-full bg-white p-6">
      <hr className="my-4 mx-16 border-gray-700" />
      <div className="flex justify-between mx-16 items-center">
        <div className="flex items-center font-sofia">
          <img src={websiteLogo} alt="" className='h-10' />
          <span className='text-xl font-semibold reveal-text'>WaveMeet</span>
        </div>
        <p>&copy;2024 WaveMeet. All Rights Reserved</p>
      </div>
    </footer>
  );
}
export default Footer;
