import React from 'react';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

const PricingPlan = ({ plan, price, features, isPopular }) => (
  <div
    className={`relative flex flex-col justify-between h-full w-full max-w-sm p-6 mx-auto border border-solid rounded-xl transition-all duration-300 ease-in-out
      ${isPopular
        ? 'z-20 bg-white dark:bg-[#121212] border border-gray-300 dark:border-[#333] shadow-lg dark:shadow-[rgba(255,255,255,0.08)]'
        : 'z-10 bg-white dark:bg-[#121212] border border-gray-200 dark:border-[#222] shadow-md dark:shadow-[rgba(255,255,255,0.05)]'}
      hover:shadow-xl dark:hover:shadow-[rgba(255,255,255,0.12)] group`}
  >
    {isPopular && (
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black dark:bg-white text-white dark:text-black px-4 py-1 rounded-full text-sm font-semibold">
        Most Popular
      </div>
    )}
    <div>
      <p className="m-0 text-xl font-semibold tracking-tight text-gray-900 dark:text-gray-100 sm:text-2xl md:text-3xl">
        {plan}
      </p>
      <div className="flex items-end mt-6">
        <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 sm:text-4xl">
          ₹{price}
        </p>
        <p className="ml-1 text-gray-500 text-sm">/ month</p>
      </div>
    </div>
    <ul className="mt-4 space-y-4">
      {features.map((feature, index) => (
        <li key={index} className="flex items-center gap-2">
          <CheckCircleIcon className="w-5 sm:w-6 text-black dark:text-white" />
          <span className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            {feature}
          </span>
        </li>
      ))}
    </ul>
    <button
      className={`mt-6 w-full py-2 px-4 rounded-lg transition-all duration-300 ease-in-out font-medium tracking-wide
        ${isPopular
          ? 'bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100'
          : 'bg-transparent border border-black dark:border-white text-black dark:text-white hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black'}`}
    >
      Start Now
    </button>
  </div>
);

const PricingSection = ({ pricingPlans }) => (
  <section className="py-12 bg-white dark:bg-[#121212] transition-colors duration-300">
    <div className="max-w-7xl mx-auto px-6">
      <div id='pricing' className="text-center mb-12">
        <p className="text-4xl font-medium text-gray-900 dark:text-gray-100 sm:text-5xl">
          Simple, Transparent Pricing
        </p>
        <p className="mt-2 text-lg text-gray-600 dark:text-gray-500 sm:text-xl">
          Choose the plan that's right for you
        </p>
      </div>
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {pricingPlans.map((plan, index) => (
          <PricingPlan key={index} {...plan} />
        ))}
      </div>
    </div>
  </section>
);

export default PricingSection;