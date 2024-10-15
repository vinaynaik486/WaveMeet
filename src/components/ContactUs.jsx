import React from 'react'
import Btn from './ui/btn'


function ContactUs() {
  return (

    <section className="bg-white">
      <div className="py-8 mx-2 lg:py-8 px-4 lg:mx-auto sm:mx-16 max-w-screen-md">
        <h2 id="contact_us" className="mb-4 text-4xl tracking-tight font-sofia-bold text-center text-[#222222]">
          Get in touch with us
        </h2>
        <p className="mb-8 lg:mb-16 font-sofia-light text-center text-gray-500  sm:text-md">
          Got a technical issue? Want to send feedback about a beta feature? Need details about our Business plan? Let us know.
        </p>
        <form action="#" className="space-y-6">
          <div>
            <label htmlFor="email" className="block mb-2 font-sofia-medium text-[#222222]">
              Your email
            </label>
            <input
              type="email"
              id="email"
              className="shadow-sm bg-gray-50 border focus:outline-none border-gray-300 text-[#222222] rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
              placeholder="name@wavemeet.com"
              required
            />
          </div>
          <div>
            <label htmlFor="subject" className="block mb-2 font-sofia-medium text-[#222222]">
              Subject
            </label>
            <input
              type="text"
              id="subject"
              className="block p-3 w-full focus:outline-none text-[#222222] bg-gray-50 rounded-lg border border-gray-300 shadow-sm focus:ring-primary-500 focus:border-primary-500 "
              placeholder="Let us know how we can help you"
              required
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="message" className="block mb-2 text-md font-sofia-medium text-[#222222]">
              Your message
            </label>
            <textarea
              id="message"
              rows="6"
              className="block p-2.5 w-full focus:outline-none resize-none text-[#222222] bg-gray-50 rounded-lg shadow-sm border border-gray-300 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Leave a comment..."
            ></textarea>
          </div>
          <Btn text="Send message" />
        </form>
      </div>
    </section>
  )
}

export default ContactUs