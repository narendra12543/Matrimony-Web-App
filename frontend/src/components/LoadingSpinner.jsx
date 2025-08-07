import React from "react";

const LoadingSpinner = ({
  size = "md",
  color = "blue",
  className = "",
  text = "",
  fullScreen = false,
  message = "", // New prop for the loading message
  withBackground = false, // New prop for the dark background overlay
}) => {
  const sizeClasses = {
    xs: "w-4 h-4",
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-12 h-12",
    xl: "w-16 h-16",
  };

  const colorClasses = {
    blue: "text-blue-500 dark:text-blue-400",
    white: "text-white",
    gray: "text-gray-500 dark:text-gray-400",
    purple: "text-purple-500 dark:text-purple-400",
    green: "text-green-500 dark:text-green-400",
    red: "text-red-500 dark:text-red-400",
  };

  const spinner = (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      {/* Updated spinner SVG */}
      <svg
        className={`animate-spin ${sizeClasses[size]} ${colorClasses[color]} mb-4`}
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        ></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8v8z"
        ></path>
      </svg>
      {text && (
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{text}</p>
      )}
      {message && (
        <div className={`text-lg font-semibold ${colorClasses[color]}`}>
          {message}
        </div>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center ${
          withBackground
            ? "bg-black bg-opacity-40"
            : "bg-white dark:bg-gray-900 bg-opacity-75 dark:bg-opacity-75"
        }`}
      >
        {withBackground ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 flex flex-col items-center">
            {spinner}
          </div>
        ) : (
          spinner
        )}
      </div>
    );
  }

  return spinner;
};

export default LoadingSpinner;
