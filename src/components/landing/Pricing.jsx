import React from 'react'
import PricingSection from '../ui/pricingsection'


function Pricing() {
  const pricingPlans = [
    {
      plan: 'Free',
      price: "0",
      features: ['Up to 50 participants per meeting', 'Meeting duration: up to 30 minutes', 'Screen Sharing'],
      isPopular: false
    },
    {
      plan: 'Plus',
      price: 199,
      features: ['Up to 100 participants per meeting', 'Meeting duration: up to 2 hours', 'Full HD (1080p) video quality', 'Screen Sharing'],
      isPopular: true
    },
    {
      plan: 'Pro',
      price: 799,
      features: ['Up to 250 participants per meeting', 'Meeting duration: Unlimited', 'Full HD (1080p) video quality', 'Advanced Multi-screen sharing', '24/7 premium customer support'],
      isPopular: false
    },
    {
      plan: 'Enterprise',
      price: 1499,
      features: ['Everything in Pro', 'Up to 500 participants per meeting', 'Custom Branding & Domain', 'Dedicated Account Manager', 'SLA & 99.9% Uptime Guarantee', 'Advanced Analytics'],
      isPopular: false
    }
  ];
  return (
    <PricingSection pricingPlans={pricingPlans} />
  )
}

export default Pricing;
