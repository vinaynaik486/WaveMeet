import React from 'react';
import Btn from './btn';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

const PricingPlan = ({ title, plan, features, isPopular, month, currency }) => (
  <div
    className={`relative flex flex-col items-center max-w-md p-4 mx-auto my-0 border border-solid rounded-lg sm:my-0 sm:p-6 md:my-8 md:p-8 
      ${isPopular ? 'z-20 bg-white border-2 border-gray-500 md:px-8 md:py-16' : 'z-10 lg:mx-4'}
      transition-shadow duration-300 ease-in-out hover:shadow-lg group`}
  >
    {isPopular && (
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
        Most Popular
      </div>
    )}
    <p className="m-0 text-2xl font-sofia-semibold leading-tight tracking-tight text-black border-0 border-gray-200 sm:text-3xl md:text-3xl">
      {title}
    </p>
    <div className="flex items-end mt-6 leading-7 text-gray-900 border-0 border-gray-200">
      <p className="box-border m-0 text-4xl font-bold leading-none border-solid">{currency}{plan}</p>
      <p className="box-border m-0 border-solid">{month}</p>
    </div>
    <ul className="flex-1 p-0 mt-4 mb-6 space-y-4 leading-7 text-gray-900 border-0 border-gray-200">
      {features.map((feature, index) => (
        <li key={index} className="flex items-center gap-2">
          <CheckCircleIcon className="w-6 " />
          <span className="font-sofia-semibold">{feature}</span>
        </li>
      ))}
    </ul>
    <Btn text="Start Now" className="w-full transition-colors duration-300 ease-in-out group-hover:bg-gray-700" />
  </div>
);

const PricingSection = ({ pricingPlans }) => (
  <section className="py-6 leading-7 text-gray-900 bg-white sm:py-12 md:py-16">
    <div className="box-border px-4 mx-auto border-solid sm:px-6 md:px-6 lg:px-0 max-w-7xl">
      <div className="flex flex-col items-center leading-7 text-center text-gray-900 border-0 border-gray-200 mb-8">
        <h2 className="box-border m-0 text-3xl font-sofia-semibold leading-tight tracking-tight text-black border-solid sm:text-5xl md:text-5xl">
          Simple, Transparent Pricing
        </h2>
        <p className="box-border mt-2 text-xl text-gray-900 border-solid sm:text-2xl">
          Choose the plan that's right for you
        </p>
      </div>
      <div
        id="pricing"
        className="grid grid-cols-1 gap-8 mt-4 leading-7 text-gray-900 border-0 border-gray-200 sm:mt-6 sm:gap-6 md:mt-8 lg:grid-cols-3"
      >
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