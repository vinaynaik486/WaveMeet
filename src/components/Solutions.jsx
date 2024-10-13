import React from 'react'
import Person1 from '../assets/person1.jpg'
import Person2 from '../assets/person2.jpg'
import Person3 from '../assets/person3.jpg'
import Person4 from '../assets/person4.jpg'
import Feature from './ui/feature'


function Solutions() {
  return (
    <div className='flex flex-col items-center'>
      <div id="solutions" className='mt-14 mx-28 mb-10 flex gap-48 font-sofia box-border'>
        <div className=' flex items-center gap-8 min-w-64'>
          <div>
            <img src={Person1} alt="" className='w-[21rem] rounded-lg shadow-[0_0_75px_-30px_rgba(0,0,0,0.75)]' />
            <img src={Person2} alt="" className='w-[21rem] rounded-lg mt-8 shadow-[0_0_75px_-30px_rgba(0,0,0,0.75)]' />
          </div>
          <div>
            <img src={Person3} alt="" className='w-[21rem] rounded-lg shadow-[0_0_75px_-30px_rgba(0,0,0,0.75)]' />
            <img src={Person4} alt="" className='w-[21rem] rounded-lg mt-8 shadow-[0_0_50px_-30px_rgba(0,0,0,0.75)]' />
          </div>
        </div>
        <div className='mr-6'>
          <Feature
            heading="Host your interactive online meeting better"
            description="Imagine you can and be a host for every meet and now you can customize who's the host!"
            features={[
              "Customization Host",
              "Unlimited Participants and more hosts for each meeting. No more limit.",
              "Auto Host is available now"
            ]}
          />
        </div>
      </div>
      <div className='mt-20 mx-28 mb-10 flex gap-48 font-sofia'>
        <div className='ml-6'>
          <Feature
            heading="More features more good results!"
            description="We updated, and have more features like notes, record, screen, translate etc"
            features={[
              "Share screen access",
              "Subtitle for more than 10 languages",
              "Record your meet for future"
            ]}
          />
        </div>
        <div className='flex flex-col justify-around items-end ml-72'>
          <div className='w-64 h-20 flex gap-4 justify-start items-center rounded-md shadow-[0_0_50px_-28px_rgba(0,0,0,0.75)] px-4'>
            <div className='flex-shrink-0 w-6'>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" id="upload">
                <g fill="#222">
                  <path d="M41 59H23A18 18 0 0 1 5 41V23A18 18 0 0 1 23 5h18a18 18 0 0 1 18 18v18a18 18 0 0 1-18 18ZM23 9A14 14 0 0 0 9 23v18a14 14 0 0 0 14 14h18a14 14 0 0 0 14-14V23A14 14 0 0 0 41 9Z"></path>
                  <path d="M32 45.74a2 2 0 0 1-2-2V20.26a2 2 0 0 1 4 0v23.48a2 2 0 0 1-2 2Z"></path>
                  <path d="M20.79 31.67a2 2 0 0 1-1.29-3.53l11.21-9.41a2 2 0 1 1 2.58 3.06L22.07 31.2a2 2 0 0 1-1.28.47Z"></path>
                  <path d="M43.21 31.67a2 2 0 0 1-1.28-.47l-11.22-9.41a2 2 0 0 1 2.58-3.06l11.21 9.41a2 2 0 0 1-1.29 3.53Z"></path>
                </g>
              </svg>
            </div>
            <span className='text-lg font-sofia-semibold'>Share Screen</span>
          </div>
          <div className='w-64 h-20 flex gap-4 justify-start items-center rounded-md shadow-[0_0_50px_-28px_rgba(0,0,0,0.75)] px-4'>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" id="subtitles">
              <path fill="#111" fill-rule="evenodd" d="M9.94358 3.25H14.0564C15.8942 3.24998 17.3498 3.24997 18.489 3.40314C19.6614 3.56076 20.6104 3.89288 21.3588 4.64124C22.1071 5.38961 22.4392 6.33856 22.5969 7.51098C22.75 8.65019 22.75 10.1058 22.75 11.9436V12.0564C22.75 13.8942 22.75 15.3498 22.5969 16.489C22.4392 17.6614 22.1071 18.6104 21.3588 19.3588C20.6104 20.1071 19.6614 20.4392 18.489 20.5969C17.3498 20.75 15.8942 20.75 14.0564 20.75H9.94359C8.10583 20.75 6.65019 20.75 5.51098 20.5969C4.33856 20.4392 3.38961 20.1071 2.64124 19.3588C1.89288 18.6104 1.56076 17.6614 1.40314 16.489C1.24997 15.3498 1.24998 13.8942 1.25 12.0564L1.25 12C1.25 11.5858 1.58579 11.25 2 11.25C2.41421 11.25 2.75 11.5858 2.75 12C2.75 13.9068 2.75159 15.2615 2.88976 16.2892C3.02502 17.2952 3.27869 17.8749 3.7019 18.2981C4.12511 18.7213 4.70476 18.975 5.71085 19.1102C6.73851 19.2484 8.09318 19.25 10 19.25H14C15.9068 19.25 17.2615 19.2484 18.2892 19.1102C19.2952 18.975 19.8749 18.7213 20.2981 18.2981C20.7213 17.8749 20.975 17.2952 21.1102 16.2892C21.2484 15.2615 21.25 13.9068 21.25 12C21.25 10.0932 21.2484 8.73851 21.1102 7.71085C20.975 6.70476 20.7213 6.12511 20.2981 5.7019C19.8749 5.27869 19.2952 5.02502 18.2892 4.88976C17.2615 4.75159 15.9068 4.75 14 4.75H10C8.09318 4.75 6.73851 4.75159 5.71085 4.88976C4.70476 5.02502 4.12511 5.27869 3.7019 5.7019C3.23045 6.17335 2.96931 6.83905 2.84789 8.07342C2.80734 8.48564 2.4403 8.78695 2.02808 8.7464C1.61585 8.70585 1.31455 8.33881 1.3551 7.92658C1.48944 6.56072 1.80633 5.47616 2.64124 4.64124C3.38961 3.89288 4.33856 3.56076 5.51098 3.40314C6.65019 3.24997 8.10582 3.24998 9.94358 3.25Z" clip-rule="evenodd"></path>
              <path fill="#111" fill-rule="evenodd" d="M5.25 16C5.25 15.5858 5.58579 15.25 6 15.25H10C10.4142 15.25 10.75 15.5858 10.75 16 10.75 16.4142 10.4142 16.75 10 16.75H6C5.58579 16.75 5.25 16.4142 5.25 16zM18.75 13C18.75 12.5858 18.4142 12.25 18 12.25H14C13.5858 12.25 13.25 12.5858 13.25 13 13.25 13.4142 13.5858 13.75 14 13.75H18C18.4142 13.75 18.75 13.4142 18.75 13zM11.75 16C11.75 15.5858 12.0858 15.25 12.5 15.25H14C14.4142 15.25 14.75 15.5858 14.75 16 14.75 16.4142 14.4142 16.75 14 16.75H12.5C12.0858 16.75 11.75 16.4142 11.75 16zM12.25 13C12.25 12.5858 11.9142 12.25 11.5 12.25H9.5C9.08579 12.25 8.75 12.5858 8.75 13 8.75 13.4142 9.08579 13.75 9.5 13.75H11.5C11.9142 13.75 12.25 13.4142 12.25 13zM15.75 16C15.75 15.5858 16.0858 15.25 16.5 15.25H18C18.4142 15.25 18.75 15.5858 18.75 16 18.75 16.4142 18.4142 16.75 18 16.75H16.5C16.0858 16.75 15.75 16.4142 15.75 16zM7.75 13C7.75 12.5858 7.41421 12.25 7 12.25H6C5.58579 12.25 5.25 12.5858 5.25 13 5.25 13.4142 5.58579 13.75 6 13.75H7C7.41421 13.75 7.75 13.4142 7.75 13z" clip-rule="evenodd"></path>
            </svg>
            <span className='text-lg font-sofia-semibold'>Add Subtitle</span>
          </div>
          <div className='w-64 h-20 flex gap-4 justify-start items-center rounded-md shadow-[0_0_50px_-28px_rgba(0,0,0,0.75)] px-4'>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" id="record">
              <g id="Page-1" fill="none" fill-rule="evenodd" stroke="none" stroke-width="1">
                <g id="Dribbble-Light-Preview" fill="#000" transform="translate(-380 -3839)">
                  <g id="icons" transform="translate(56 160)">
                    <path id="record-[#982]" d="M338 3689a4 4 0 1 1-8 0 4 4 0 0 1 8 0m-4 8c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8m0-18c-5.523 0-10 4.477-10 10s4.477 10 10 10 10-4.477 10-10-4.477-10-10-10"></path>
                  </g>
                </g>
              </g>
            </svg>
            <span className='text-lg font-sofia-semibold'>Record Screen</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Solutions
