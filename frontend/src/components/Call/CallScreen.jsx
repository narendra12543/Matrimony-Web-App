import React, { useRef, useEffect, useState } from "react";
import { PhoneOff, Mic, MicOff, Video, VideoOff } from "lucide-react";

const CallScreen = ({ localStream, remoteStream, callType, onEndCall, callStatus }) => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [debugInfo, setDebugInfo] = useState({
    localTracks: 0,
    remoteTracks: 0,
    connectionState: '',
    iceState: ''
  });

  // Attach local stream to local video
  useEffect(() => {
    if (localVideoRef.current) {
      if (localStream && localVideoRef.current.srcObject !== localStream) {
        localVideoRef.current.srcObject = localStream;
      } else if (!localStream) {
        localVideoRef.current.srcObject = null;
      }
    }
    setDebugInfo(prev => ({
      ...prev,
      localTracks: localStream ? localStream.getTracks().length : 0
    }));
  }, [localStream]);

  // Attach remote stream to remote video
  useEffect(() => {
    if (remoteVideoRef.current) {
      if (remoteStream && remoteVideoRef.current.srcObject !== remoteStream) {
        remoteVideoRef.current.srcObject = remoteStream;
      } else if (!remoteStream) {
        remoteVideoRef.current.srcObject = null;
      }
    }
    setDebugInfo(prev => ({
      ...prev,
      remoteTracks: remoteStream ? remoteStream.getTracks().length : 0
    }));
  }, [remoteStream]);

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Debug overlay */}
      <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white p-2 text-xs z-50">
        <div>Local Tracks: {debugInfo.localTracks}</div>
        <div>Remote Tracks: {debugInfo.remoteTracks}</div>
        <div>Status: {callStatus}</div>
      </div>

      {/* Remote video (main view) */}
      <div className="flex-1 relative">
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
          onCanPlay={() => console.log('Remote video can play')}
          onError={(e) => console.error('Remote video error:', e)}
        />
        {(!remoteStream || remoteStream.getTracks().length === 0) && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <div className="text-center">
              <div className="w-32 h-32 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl text-white">
                  {callType === "video" ? "📹" : "📞"}
                </span>
              </div>
              <p className="text-white">Waiting for video...</p>
            </div>
          </div>
        )}
      </div>

      {/* Local video (picture-in-picture) */}
      {callType === "video" && (
        <div className="absolute bottom-28 right-4 w-32 h-48 rounded-lg overflow-hidden border-2 border-white bg-black">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : ''}`}
          />
          {isVideoOff && (
            <div className="w-full h-full bg-gray-900 flex items-center justify-center">
              <VideoOff className="w-8 h-8 text-gray-600" />
            </div>
          )}
        </div>
      )}

      {/* Call controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-gray-900 bg-opacity-70 py-6">
        <div className="flex justify-center space-x-8">
          <button
            onClick={toggleMute}
            className={`w-12 h-12 rounded-full flex items-center justify-center ${isMuted ? 'bg-red-600' : 'bg-gray-700'} hover:bg-opacity-80 transition-colors`}
          >
            {isMuted ? (
              <MicOff className="w-6 h-6 text-white" />
            ) : (
              <Mic className="w-6 h-6 text-white" />
            )}
          </button>

          {callType === "video" && (
            <button
              onClick={toggleVideo}
              className={`w-12 h-12 rounded-full flex items-center justify-center ${isVideoOff ? 'bg-red-600' : 'bg-gray-700'} hover:bg-opacity-80 transition-colors`}
            >
              {isVideoOff ? (
                <VideoOff className="w-6 h-6 text-white" />
              ) : (
                <Video className="w-6 h-6 text-white" />
              )}
            </button>
          )}

          <button
            onClick={onEndCall}
            className="w-14 h-14 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-700 transition-colors"
          >
            <PhoneOff className="w-8 h-8 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CallScreen;