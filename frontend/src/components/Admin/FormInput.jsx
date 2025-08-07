import React from "react";

const FormInput = ({ label, type, name, value, onChange, placeholder }) => (
  <div className="mb-4">
    <label className="block mb-2 font-bold text-gray-800 dark:text-gray-200">
      {label}
    </label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
      required
    />
  </div>
);

export default FormInput;
