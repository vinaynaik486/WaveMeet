import React from 'react';
import Btn from './btn';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

const PricingPlan = ({ plan, price, features, isPopular }) => (
  <div
    className={`relative flex flex-col justify-between h-full w-full max-w-sm p-4 mx-auto border border-solid rounded-lg sm:p-6 md:p-8 
      ${isPopular ? 'z-20 bg-white border-2 border-gray-500' : 'z-10 bg-white'}
      transition-shadow duration-300 ease-in-out hover:shadow-lg group`}
  >
    {/* Added h-full for equal height and justify-between to space out content */}
    {isPopular && (
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
        Most Popular
      </div>
    )}
    <div>
      {/* Wrapped plan name and price in a div */}
      <p className="m-0 text-xl font-sofia-semibold leading-tight tracking-tight text-black border-0 border-gray-200 sm:text-2xl md:text-3xl">
        {plan}
      </p>
      <div className="flex items-end mt-6 leading-7 text-gray-900 border-0 border-gray-200">
        <p className="box-border m-0 text-3xl font-bold leading-none border-solid sm:text-4xl">₹{price}</p>
        <p className="box-border m-0 border-solid">/ month</p>
      </div>
    </div>
    <ul className="flex-grow p-0 mt-4 mb-6 space-y-4 leading-7 text-gray-900 border-0 border-gray-200">
      {/* Changed flex-1 to flex-grow */}
      {features.map((feature, index) => (
        <li key={index} className="flex items-center gap-2">
          <CheckCircleIcon className="w-5 sm:w-6" />
          <span className="font-sofia-semibold text-sm sm:text-base">{feature}</span>
        </li>
      ))}
    </ul>
    <Btn text="Start Now" className="w-full transition-colors duration-300 ease-in-out group-hover:bg-gray-700" />
  </div>
);

const PricingSection = ({ pricingPlans }) => (
  <section className="py-6 leading-7 text-gray-900 bg-white sm:py-12 md:py-16">
    <div className="box-border px-4 mx-auto border-solid sm:px-6 md:px-6 lg:px-8 max-w-7xl">
      <div className="flex flex-col items-center leading-7 text-center text-gray-900 border-0 border-gray-200 mb-8">
        <p id="pricing" className="box-border m-0 text-3xl font-sofia-semibold leading-tight text-black border-solid sm:text-4xl md:text-5xl">
          Simple, Transparent Pricing
        </p>
        <p className="box-border mt-2 text-lg text-gray-900 border-solid sm:text-xl">
          Choose the plan that's right for you
        </p>
      </div>
      <div
        id="pricing"
        className="grid grid-cols-1 gap-8 mt-4 leading-7 text-gray-900 border-0 border-gray-200 sm:mt-6 sm:gap-6 md:mt-8 md:grid-cols-2 lg:grid-cols-3"
      >
        {/* Added md:grid-cols-2 for better responsiveness on medium screens */}
        {pricingPlans.map((plan, index) => (
          <PricingPlan key={index} {...plan} />
        ))}
      </div>
    </div>
  </section>
);

PricingPlan.defaultProps = {
  month: "/ month",
  currency: "₹"
}

export default PricingSection;