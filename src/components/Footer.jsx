import websiteLogo from '../assets/logo/logo.png';

function Footer() {
  return (
    <footer className="w-full bg-white dark:bg-[#121212] p-3 transition-colors duration-300">
      <hr className="my-4 mx-4 sm:mx-8 md:mx-16 lg:mx-20 border-gray-200 dark:border-gray-700" />
      <div className="flex flex-col lg:flex-row justify-between mx-4 sm:mx-8 md:mx-16 lg:mx-20 items-center space-y-4 lg:space-y-0">
        <div className="flex items-center font-sofia cursor-pointer">
          <img src={websiteLogo} alt="WaveMeet logo" className="h-8 sm:h-10" />
          <span className="text-xl sm:text-xl font-semibold reveal-text ml-2 text-[#222222] dark:text-white">
            WaveMeet
          </span>
        </div>
        <p className="text-center lg:text-left text-[#222222] dark:text-white">
          &copy;2025 WaveMeet. All Rights Reserved
        </p>
      </div>
    </footer>
  );
}

export default Footer;
