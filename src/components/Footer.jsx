import websiteLogo from '../assets/logo/logo.png';

function Footer() {
  return (
    <footer className="w-full bg-white p-3">
      <hr className="my-4 mx-4 sm:mx-8 md:mx-16 lg:mx-20 border-gray-600" />
      <div className="flex flex-col lg:flex-row justify-between mx-4 sm:mx-8 md:mx-16 lg:mx-20 items-center space-y-4 lg:space-y-0">
        <div className="flex items-center font-sofia cursor-pointer">
          <img src={websiteLogo} alt="WaveMeet logo" className="h-8 sm:h-10" />
          <span className="text-xl sm:text-xl font-semibold reveal-text ml-2">WaveMeet</span>
        </div>
        <p className="text-center lg:text-left">&copy;2024 WaveMeet. All Rights Reserved</p>
      </div>
    </footer>
  );
}

export default Footer;
