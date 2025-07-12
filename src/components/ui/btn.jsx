function Btn({ text }) {
  return (
    <button className="bg-[#222222] dark:bg-white text-white dark:text-[#222222] py-2 px-4 sm:py-3 sm:px-5 rounded-md hover:scale-105 transition-all duration-300 ease-in-out text-sm sm:text-base md:text-lg">
      {text}
    </button>
  )
}

export default Btn
