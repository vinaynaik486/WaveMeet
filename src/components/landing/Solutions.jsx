import React from 'react';
import Person1 from '/src/assets/landing-page/person1.webp';
import Person2 from '/src/assets/landing-page/person2.webp';
import Person3 from '/src/assets/landing-page/person3.webp';
import Person4 from '/src/assets/landing-page/person4.webp';
import { CheckIcon } from '@heroicons/react/24/outline';

// Internal Feature Component
const FeatureComponent = ({ heading, description, features }) => {
  return (
    <div>
      <h2 className="text-3xl sm:text-4xl font-medium text-gray-900 dark:text-gray-100">
        {heading}
      </h2>
      <p className="mt-3 text-gray-600 dark:text-gray-400">
        {description}
      </p>
      <ul className="mt-8 space-y-4">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center gap-2">
            <CheckIcon className="w-5 sm:w-6 text-gray-900 dark:text-gray-100" />
            <span className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              {feature}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

function Solutions() {
  return (
    <div className='flex flex-col items-center bg-[#fafafa] dark:bg-[#0a0a1a] transition-colors duration-300'>
      <div id="solutions" className='mt-14 mx-4 md:mx-16 lg:mx-28 mb-10 flex flex-col lg:flex-row gap-10 lg:gap-48'>
        <div className='flex items-center justify-center gap-8'>
          <div>
            <img 
              src={Person1} 
              alt="Person 1" 
              className='w-full max-w-[16rem] sm:max-w-[18rem] md:max-w-[20rem] lg:max-w-[22rem] rounded-lg shadow-lg dark:shadow-[rgba(255,255,255,0.08)]' 
            />
            <img 
              src={Person2} 
              alt="Person 2" 
              className='w-full max-w-[16rem] sm:max-w-[18rem] md:max-w-[20rem] lg:max-w-[22rem] rounded-lg mt-8 shadow-lg dark:shadow-[rgba(255,255,255,0.08)]' 
            />
          </div>
          <div>
            <img 
              src={Person3} 
              alt="Person 3" 
              className='w-full max-w-[16rem] sm:max-w-[18rem] md:max-w-[20rem] lg:max-w-[22rem] rounded-lg shadow-lg dark:shadow-[rgba(255,255,255,0.08)]' 
            />
            <img 
              src={Person4} 
              alt="Person 4" 
              className='w-full max-w-[16rem] sm:max-w-[18rem] md:max-w-[20rem] lg:max-w-[22rem] rounded-lg mt-8 shadow-lg dark:shadow-[rgba(255,255,255,0.08)]' 
            />
          </div>
        </div>
        <div className='lg:mr-6 font-medium'>
          <FeatureComponent
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

      <div className='lg:mt-20 mx-4 md:mx-16 lg:mx-28 mb-10 flex flex-col lg:flex-row gap-10 lg:gap-48 font-medium'>
        <div className='lg:ml-6'>
          <FeatureComponent
            heading="More features, more good results!"
            description="We updated, and have more features like notes, record, screen, translate, etc."
            features={[
              "Share screen access",
              "Subtitle for more than 10 languages",
              "Record your meet for future"
            ]}
          />
        </div>
        <div className='flex flex-col justify-around items-center lg:items-end lg:ml-72 gap-4'>
          <FeatureItem icon={UploadIcon} text="Share Screen" />
          <FeatureItem icon={SubtitlesIcon} text="Add Subtitle" />
          <FeatureItem icon={RecordIcon} text="Record Screen" />
        </div>
      </div>
    </div>
  );
}

const FeatureItem = ({ icon: Icon, text }) => (
  <div className='w-64 h-20 flex gap-4 items-center rounded-md shadow-lg px-4 bg-[#fafafa] dark:bg-[#0a0a1a] dark:shadow-[rgba(255,255,255,0.08)] dark:border dark:border-gray-600'>
    <Icon />
    <span className='text-lg font-semibold text-gray-900 dark:text-gray-100'>{text}</span>
  </div>
);

const UploadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="24" height="24">
    <g fill="currentColor" className="text-gray-900 dark:text-gray-100">
      <path d="M41 59H23A18 18 0 0 1 5 41V23A18 18 0 0 1 23 5h18a18 18 0 0 1 18 18v18a18 18 0 0 1-18 18ZM23 9A14 14 0 0 0 9 23v18a14 14 0 0 0 14 14h18a14 14 0 0 0 14-14V23A14 14 0 0 0 41 9Z"></path>
      <path d="M32 45.74a2 2 0 0 1-2-2V20.26a2 2 0 0 1 4 0v23.48a2 2 0 0 1-2 2Z"></path>
      <path d="M20.79 31.67a2 2 0 0 1-1.29-3.53l11.21-9.41a2 2 0 1 1 2.58 3.06L22.07 31.2a2 2 0 0 1-1.28.47Z"></path>
      <path d="M43.21 31.67a2 2 0 0 1-1.28-.47l-11.22-9.41a2 2 0 0 1 2.58-3.06l11.21 9.41a2 2 0 0 1-1.29 3.53Z"></path>
    </g>
  </svg>
);

const SubtitlesIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
    <path fill="currentColor" className="text-gray-900 dark:text-gray-100" fillRule="evenodd" d="M9.94358 3.25H14.0564C15.8942 3.24998 17.3498 3.24997 18.489 3.40314C19.6614 3.56076 20.6104 3.89288 21.3588 4.64124C22.1071 5.38961 22.4392 6.33856 22.5969 7.51098C22.75 8.65019 22.75 10.1058 22.75 11.9436V12.0564C22.75 13.8942 22.75 15.3498 22.5969 16.489C22.4392 17.6614 22.1071 18.6104 21.3588 19.3588C20.6104 20.1071 19.6614 20.4392 18.489 20.5969C17.3498 20.75 15.8942 20.75 14.0564 20.75H9.94359C8.10583 20.75 6.65019 20.75 5.51098 20.5969C4.33856 20.4392 3.38961 20.1071 2.64124 19.3588C1.89288 18.6104 1.56076 17.6614 1.40314 16.489C1.24997 15.3498 1.24998 13.8942 1.25 12.0564L1.25 12C1.25 11.5858 1.58579 11.25 2 11.25C2.41421 11.25 2.75 11.5858 2.75 12C2.75 13.9068 2.75159 15.2615 2.88976 16.2892C3.02502 17.2952 3.27869 17.8749 3.7019 18.2981C4.12511 18.7213 4.70476 18.975 5.71085 19.1102C6.73851 19.2484 8.09318 19.25 10 19.25H14C15.9068 19.25 17.2615 19.2484 18.2892 19.1102C19.2952 18.975 19.8749 18.7213 20.2981 18.2981C20.7213 17.8749 20.975 17.2952 21.1102 16.2892C21.2484 15.2615 21.25 13.9068 21.25 12C21.25 10.0932 21.2484 8.73851 21.1102 7.71085C20.975 6.70476 20.7213 6.12511 20.2981 5.7019C19.8749 5.27869 19.2952 5.02502 18.2892 4.88976C17.2615 4.75159 15.9068 4.75 14 4.75H10C8.09318 4.75 6.73851 4.75159 5.71085 4.88976C4.70476 5.02502 4.12511 5.27869 3.7019 5.7019C3.27869 6.12511 3.02502 6.70476 2.88976 7.71085C2.75159 8.73851 2.75 10.0932 2.75 12C2.75 12.4142 2.41421 12.75 2 12.75C1.58579 12.75 1.25 12.4142 1.25 12C1.25 10.1058 1.24997 8.65019 1.40314 7.51098C1.56076 6.33856 1.89288 5.38961 2.64124 4.64124C3.38961 3.89288 4.33856 3.56076 5.51098 3.40314C6.65019 3.24997 8.10583 3.24998 9.94358 3.25H14.0564Z" clipRule="evenodd"></path>
    <path fill="currentColor" className="text-gray-900 dark:text-gray-100" d="M7 9.25C6.58579 9.25 6.25 9.58579 6.25 10V10C6.25 10.4142 6.58579 10.75 7 10.75H17C17.4142 10.75 17.75 10.4142 17.75 10V10C17.75 9.58579 17.4142 9.25 17 9.25H7ZM7 13.25C6.58579 13.25 6.25 13.5858 6.25 14V14C6.25 14.4142 6.58579 14.75 7 14.75H17C17.4142 14.75 17.75 14.4142 17.75 14V14C17.75 13.5858 17.4142 13.25 17 13.25H7ZM6.25 17C6.25 16.5858 6.58579 16.25 7 16.25H12C12.4142 16.25 12.75 16.5858 12.75 17V17C12.75 17.4142 12.4142 17.75 12 17.75H7C6.58579 17.75 6.25 17.4142 6.25 17V17Z"></path>
  </svg>
);

const RecordIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 29 29">
    <path fill="currentColor" className="text-gray-900 dark:text-gray-100" d="M14.5 2C7.607 2 2 7.607 2 14.5S7.607 27 14.5 27 27 21.393 27 14.5 21.393 2 14.5 2zm0 23C8.71 25 4 20.29 4 14.5S8.71 4 14.5 4 25 8.71 25 14.5 20.29 25 14.5 25z"></path>
    <circle fill="currentColor" className="text-gray-900 dark:text-gray-100" cx="14.5" cy="14.5" r="6.5"></circle>
  </svg>
);

export default Solutions;
