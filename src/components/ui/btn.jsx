import React from 'react'

const Btn = ({ text }) => {
  return (
    <button className={`bg-[#222222] text-white ease-in-out duration-300 py-3 px-5 hover:scale-105 hover:bg-[#333333] hover:text-white rounded-md flex items-center gap-1`}>
      {text}
    </button>
  )
}

export default Btn