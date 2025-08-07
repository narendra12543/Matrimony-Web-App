import React from "react";
const SupportTab = () => (
  <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-8 border border-gray-100 dark:border-gray-700 transition-colors duration-300">
    <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
      Support & Help
    </h2>
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-blue-50 border dark:bg-gray-900 border-blue-200 rounded-lg p-6 hover:shadow-lg transition-all duration-300">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">
            Help Center
          </h3>
          <p className="text-blue-600 mb-4">
            Browse frequently asked questions and guides
          </p>
          <button className="bg-blue-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-600 transition-all duration-300">
            Visit Help Center
          </button>
        </div>
        <div className="bg-green-50 border dark:bg-gray-900 border-green-200 rounded-lg p-6 hover:shadow-lg transition-all duration-300">
          <h3 className="text-lg font-semibold text-green-800 mb-2">
            Contact Support
          </h3>
          <p className="text-green-600 mb-4">
            Get help from our support team
          </p>
          <button className="bg-green-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-600 transition-all duration-300">
            Contact Us
          </button>
        </div>
      </div>
      <div className="bg-gray-50 border dark:bg-gray-900 border-gray-200 rounded-lg p-6">
        <h3 className="text-lg dark:text-white font-semibold text-gray-800 mb-4">
          Quick Links
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            href="#"
            className="text-blue-600 hover:text-blue-800 transition-colors duration-300"
          >
            Terms of Service
          </a>
          <a
            href="#"
            className="text-blue-600 hover:text-blue-800 transition-colors duration-300"
          >
            Privacy Policy
          </a>
          {/* <a
            href="#"
            className="text-blue-600 hover:text-blue-800 transition-colors duration-300"
          >
            Safety Guidelines
          </a>
          <a
            href="#"
            className="text-blue-600 hover:text-blue-800 transition-colors duration-300"
          >
            Community Guidelines
          </a>
          <a
            href="#"
            className="text-blue-600 hover:text-blue-800 transition-colors duration-300"
          >
            Success Stories
          </a>
          <a
            href="#"
            className="text-blue-600 hover:text-blue-800 transition-colors duration-300"
          >
            Blog
          </a> */}
        </div>
      </div>
    </div>
  </div>
);
export default SupportTab;
