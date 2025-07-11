import React from "react";
import { PhoneOff, Mic, MicOff, Video, VideoOff } from "lucide-react";

const CallingModal = ({ callee, callType, onCancel }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-900 rounded-xl overflow-hidden">
        <div className="p-8 text-center">
          <div className="mb-6">
            <div className="w-32 h-32 mx-auto rounded-full bg-gray-800 flex items-center justify-center overflow-hidden mb-4">
              {callee?.avatar ? (
                <img 
                  src={callee.avatar} 
                  alt={callee.firstName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-5xl text-white">
                  {callee?.firstName?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              )}
            </div>
            <h3 className="text-2xl font-semibold text-white">
              {callee?.firstName || callee?.email || "Unknown"}
            </h3>
            <p className="text-gray-400 mt-2">
              Calling {callType === "video" ? "video" : "voice"}...
            </p>
          </div>

          <div className="flex justify-center space-x-6 mt-8">
            <button 
              onClick={onCancel}
              className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-700 transition-colors"
            >
              <PhoneOff className="w-8 h-8 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallingModal;