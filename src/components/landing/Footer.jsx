import Logo from '../ui/Logo'

function Footer() {
  return (
    <footer className="w-full bg-background p-3 transition-colors duration-300">
      <hr className="my-4 mx-4 sm:mx-8 md:mx-16 lg:mx-20 border-gray-200 dark:border-gray-700" />
      <div className="flex flex-col lg:flex-row justify-between mx-4 sm:mx-8 md:mx-16 lg:mx-20 items-center space-y-4 lg:space-y-0">
        <div 
          className="flex items-center font-karla cursor-pointer transform-gpu"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <Logo className="h-10 sm:h-12" />
          <span className="text-2xl sm:text-3xl font-bold ml-2 text-[#222222] dark:text-white">
            WaveMeet
          </span>
        </div>
        <p className="text-center lg:text-left text-[#222222] dark:text-white font-light">
          &copy;2025 WaveMeet. All Rights Reserved
        </p>
      </div>
    </footer>
  );
}

export default Footer;
