import React from 'react'
import websiteLogo from '../assets/Dark_mode_weblogo.png';
import { PlusIcon } from '@heroicons/react/16/solid';

function Header() {
  return (
    <div className='mt-6 mx-8 flex justify-between items-center font-sofia'>
      <div className='flex items-center hover:scale-105'>
        <img src={websiteLogo} alt="" className='h-10 ' />
        <span className='text-xl font-semibold'>WaveMeet</span>
      </div>
      <div className='flex justify-between gap-8'>
        <button className='hover:bg-[#222222] p-2 hover:text-white rounded-lg hover:delay-150'>Solutions</button>
        <button className='hover:bg-[#222222] p-2 hover:text-white rounded-lg hover:delay-150'>Plan & Pricing</button>
        <button className='hover:bg-[#222222] p-2 hover:text-white rounded-lg hover:delay-150'>About</button>
        <button className='hover:bg-[#222222] p-2 hover:text-white rounded-lg hover:delay-150'>Contact Us</button>
      </div>
      <div className='flex items-center gap-8'>
        <button className='hover:bg-[#222222] p-2 hover:scale-105 hover:text-white rounded-lg'>Login</button>
        <button className='bg-[#222222] text-white p-2 hover:scale-105 hover:bg-[#333333]  hover:text-white rounded-lg flex items-center gap-1'>
          <PlusIcon className='hover:fill-white w-6' />
          <button>New Meeting</button>
        </button>
      </div>
    </div >
  )
}

export default Header