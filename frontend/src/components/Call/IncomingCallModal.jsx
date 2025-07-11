import React from "react";
import { Phone, PhoneOff, Video, Mic } from "lucide-react";

const IncomingCallModal = ({ caller, callType, onAccept, onReject }) => {
  return (
    <div className="fixed inset-0 z-50 bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center">
          <div className="mb-8">
            <div className="w-32 h-32 mx-auto rounded-full bg-gray-800 flex items-center justify-center overflow-hidden mb-4">
              {caller?.avatar ? (
                <img 
                  src={caller.avatar} 
                  alt={caller.firstName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-5xl text-gray-400">
                  {caller?.firstName?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              )}
            </div>
            <h3 className="text-2xl font-semibold text-white">
              {caller?.firstName || "Unknown"}
            </h3>
            <p className="text-gray-400 mt-2">
              Incoming {callType === "video" ? "video" : "voice"} call
            </p>
          </div>

          <div className="flex justify-center space-x-8">
            <button 
              onClick={onReject}
              className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
            >
              <PhoneOff className="w-6 h-6 text-white" />
            </button>
            <button 
              onClick={onAccept}
              className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center hover:bg-green-600 transition-colors"
            >
              <Phone className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallModal;