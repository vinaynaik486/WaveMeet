import React, { useEffect, useRef } from 'react';
import Btn from '../ui/btn';
import { gsap } from 'gsap';

function ContactUs() {
  const contactRef = useRef(null);

  useEffect(() => {
    const animationFrame = requestAnimationFrame(() => {
      const elements = contactRef.current.querySelectorAll('.reveal-text');
      gsap.fromTo(
        elements,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.05, ease: 'power1.out' }
      );
    });

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, []);

  return (
    <section ref={contactRef} className="bg-white dark:bg-[#121212] transition-colors duration-300">
      <div className="py-8 mx-2 lg:py-8 px-4 lg:mx-auto sm:mx-16 max-w-screen-md">
        <h2 id="contact_us" className="mb-4 text-4xl tracking-tight font-medium text-center text-gray-900 dark:text-gray-100 font-sofia reveal-text">
          Get in touch with us
        </h2>
        <p className="mb-8 lg:mb-16 font-sofia-light text-center text-gray-600 dark:text-gray-400 sm:text-md reveal-text">
          Got a technical issue? Want to send feedback about a beta feature? Need details about our Business plan? Let us know.
        </p>
        <form action="#" className="space-y-6">
          <div>
            <label htmlFor="email" className="block mb-2 font-sofia-medium text-gray-900 dark:text-gray-100 reveal-text">
              Your email
            </label>
            <input
              type="email"
              id="email"
              className="shadow-sm bg-gray-50 dark:bg-[#121212] border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 focus:outline-none font-sofia-light reveal-text"
              placeholder="name@wavemeet.com"
              required
            />
          </div>
          <div>
            <label htmlFor="subject" className="block mb-2 font-sofia-medium text-gray-900 dark:text-gray-100 reveal-text">
              Subject
            </label>
            <input
              type="text"
              id="subject"
              className="block p-3 w-full text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-[#121212] border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 focus:outline-none font-sofia-light reveal-text"
              placeholder="Let us know how we can help you"
              required
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="message" className="block mb-2 text-md font-sofia-medium text-gray-900 dark:text-gray-100 reveal-text">
              Your message
            </label>
            <textarea
              id="message"
              rows="6"
              className="block p-2.5 w-full text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-[#121212] border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 focus:outline-none resize-none font-sofia-light reveal-text"
              placeholder="Leave a comment..."
            ></textarea>
          </div>
          <Btn text="Send message" className="w-full py-2 px-4 rounded-lg transition-all duration-300 ease-in-out font-medium tracking-wide bg-transparent border border-black dark:border-white text-black dark:text-white hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black font-sofia-medium reveal-text" />
        </form>
      </div>
    </section>
  );
}

export default ContactUs;