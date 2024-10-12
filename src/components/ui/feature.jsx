import React from 'react';
import { CheckIcon } from '@heroicons/react/24/outline'
import Btn from './btn';

const FeatureItem = ({ text }) => (
  <div className="flex items-center font-sofia-semibold mt-8 gap-4 max-w-sm text-[#666666]">
    <CheckIcon className="w-6 text-black flex-shrink-0" /> {/* Set both width and height */}
    <span>{text}</span>
  </div>
);

const Feature = ({ heading, description, features = [] }) => (
  <div className="max-w-sm">
    <h2 className="font-bold text-4xl text-[#222222]">{heading}</h2>
    <p className="font-sofia-ultralight text-md mt-5 text-[#666666]">{description}</p>
    {features.map((feature, index) => (
      <FeatureItem key={index} text={feature} />
    ))}
    <button className="mt-6">
      <Btn text="New meeting" />
    </button>
  </div>
);

export default Feature;