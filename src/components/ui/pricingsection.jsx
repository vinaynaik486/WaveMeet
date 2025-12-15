import React, { useState } from 'react';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

const PricingPlan = ({ plan, price, features, isPopular, billingCycle }) => {
  const displayPrice = billingCycle === 'yearly' ? Math.floor(price * 0.8 * 12) : price;
  const period = billingCycle === 'yearly' ? '/ year' : '/ month';

  return (
    <div
      className={`relative flex flex-col justify-between h-full w-full max-w-[420px] min-h-[600px] p-8 sm:p-10 mx-auto rounded-2xl transition-all duration-300 ease-in-out
      ${isPopular
        ? 'z-20 bg-background border-[0.5px] border-[#fe583e] shadow-[0_0_25px_-5px_rgba(254,88,62,0.2)] dark:shadow-[0_0_30px_-5px_rgba(254,88,62,0.15)]'
        : 'z-10 bg-background border-[0.5px] border-gray-300 dark:border-[#444] shadow-sm dark:shadow-[rgba(255,255,255,0.02)]'}
      hover:shadow-xl dark:hover:shadow-[rgba(255,255,255,0.12)] group`}
  >
    {isPopular && (
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#fe583e] text-white px-4 py-1 rounded-full text-sm font-semibold">
        Most Popular
      </div>
    )}
    <div>
      <p className="m-0 text-xl font-semibold tracking-tight text-gray-900 dark:text-gray-100 sm:text-2xl md:text-3xl">
        {plan}
      </p>
      <div className="flex items-end mt-6">
        <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 sm:text-4xl">
          ₹{displayPrice}
        </p>
        <p className="ml-1 text-gray-500 text-sm">{period}</p>
      </div>
      <hr className="my-8 border-gray-200 dark:border-gray-800" />
    </div>
    <ul className="mt-4 space-y-4">
      {features.map((feature, index) => (
        <li key={index} className="flex items-center text-gray-600 dark:text-gray-400">
          <div className="w-1.5 h-1.5 rounded-full bg-[#fe583e] mr-3 flex-shrink-0" />
          <span className="text-sm sm:text-base leading-none">{feature}</span>
        </li>
      ))}
    </ul>
    <button
      className={`mt-6 w-full py-3 px-8 rounded-full transition-all duration-300 ease-in-out font-semibold tracking-wide text-sm sm:text-base bg-[#fe583e] text-white hover:bg-[#e04a32]`}
    >
      Start Now
    </button>
  </div>
  );
};

const PricingSection = ({ pricingPlans }) => {
  const [billingCycle, setBillingCycle] = useState('monthly');

  return (
    <section className="py-12 bg-background transition-colors duration-300">
      <div className="max-w-[1600px] mx-auto px-6">
        <div id='pricing' className="text-center mb-12">
          <p className="text-4xl font-medium text-gray-900 dark:text-gray-100 sm:text-5xl">
            Simple, Transparent Pricing
          </p>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-500 sm:text-xl">
            Choose the plan that's right for you
          </p>

          {/* Toggle */}
          <div className="mt-10 flex items-center justify-center gap-4">
            <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>Monthly</span>
            <button
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
              className="relative w-14 h-7 bg-gray-200 dark:bg-gray-800 rounded-full transition-colors duration-300 focus:outline-none"
            >
              <div
                className={`absolute top-1 left-1 w-5 h-5 bg-white dark:bg-[#fe583e] rounded-full shadow-md transform transition-transform duration-300 ${billingCycle === 'yearly' ? 'translate-x-7' : 'translate-x-0'}`}
              />
            </button>
            <span className={`text-sm font-medium ${billingCycle === 'yearly' ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>
              Yearly <span className="ml-1 text-[#fe583e] text-xs font-bold bg-[#fe583e]/10 px-2 py-0.5 rounded-full">Save 20%</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
          {pricingPlans.map((plan, index) => (
            <PricingPlan key={index} {...plan} billingCycle={billingCycle} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
