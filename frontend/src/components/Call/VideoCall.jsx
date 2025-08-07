import React, { useEffect, useRef, useState } from "react";
import Peer from "simple-peer";
import { useSocket } from "../../contexts/Chat/SocketContext";
import { useAuth } from "../../contexts/Chat/AuthContext";
import IncomingCallModal from "./IncomingCallModal";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Phone,
  PhoneOff,
  User,
} from "lucide-react";

// iOS compatibility helper functions
const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

const getMediaDevices = () => {
  // iOS Safari compatibility
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    return navigator.mediaDevices;
  }
  
  // Fallback for older browsers
  const getUserMedia = navigator.getUserMedia || 
                      navigator.webkitGetUserMedia || 
                      navigator.mozGetUserMedia || 
                      navigator.msGetUserMedia;
  
  if (getUserMedia) {
    return {
      getUserMedia: (constraints) => {
        return new Promise((resolve, reject) => {
          getUserMedia.call(navigator, constraints, resolve, reject);
        });
      }
    };
  }
  
  throw new Error('getUserMedia not supported');
};

const VideoCall = ({
  isOpen,
  onClose,
  callee,
  callType = "video",
  onCallStatus,
}) => {
  const { socket } = useSocket();
  const { user } = useAuth();

  const canMakeCall =
    user &&
    (user.trial?.isActive ||
      (user.subscription?.isActive &&
        user.subscription?.planName === "Elite VIP") ||
      (user.subscription?.isActive &&
        user.subscription?.planName === "Premium" &&
        callType === "voice"));

  console.log("VideoCall: User object", user);
  console.log("VideoCall: User subscription", user?.subscription);
  console.log("VideoCall: User trial", user?.trial);

  const getCallRestrictionMessage = () => {
    if (!user) return "Please log in to make calls.";
    if (user.trial?.isActive) return ""; // Trial users have full access
    if (!user.subscription?.isActive)
      return "Subscribe to a premium plan to make calls.";

    if (user.subscription?.planName === "Premium") {
      if (callType === "video") {
        return "Video calls require the Elite VIP.";
      } else if (callType === "voice") {
        return ""; // Voice calls allowed for 499 Plan
      }
    } else if (user.subscription?.planName === "Elite VIP") {
      return ""; // All calls allowed for 999 Plan
    }
    return "Your current plan does not support this call type.";
  };

  const callRestrictionMessage = getCallRestrictionMessage();
  const [stream, setStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [callAccepted, setCallAccepted] = useState(false);
  const [callRejected, setCallRejected] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [callPeerId, setCallPeerId] = useState(null);
  const myVideo = useRef(null);
  const remoteVideo = useRef(null);
  const peerRef = useRef(null);
  const [hadRemoteStream, setHadRemoteStream] = useState(false);
  const [callStatus, setCallStatus] = useState("Connecting...");
  const [isMinimized, setIsMinimized] = useState(false);
  // State to hold incoming call offer signal
  const [incomingCallSignal, setIncomingCallSignal] = useState(null);
  const [incomingCallFrom, setIncomingCallFrom] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);

  // All useEffect hooks go here, at the top level:
  useEffect(() => {
    if (myVideo.current && stream) {
      myVideo.current.srcObject = stream;
    }
  }, [stream]);

  useEffect(() => {
    if (isOpen && !callAccepted && !callRejected) {
      if (peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
      }
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        setStream(null);
      }
      setRemoteStream(null);
      setCallStatus("Connecting...");
      setIsCalling(false);
      setHadRemoteStream(false);
      setCallPeerId(null);
      setIsMicOn(true);
      setIsCamOn(true);
      console.log("[VideoCall] State reset for new call");
    }
  }, [isOpen, callAccepted, callRejected]);

  useEffect(() => {
    if (remoteStream) setHadRemoteStream(true);
  }, [remoteStream]);

  useEffect(() => {
    if (callAccepted && hadRemoteStream && !remoteStream && isOpen) {
      console.log(
        "[VideoCall] useEffect: callAccepted, hadRemoteStream, and remoteStream is now null, closing modal"
      );
      if (onClose) onClose();
    }
  }, [callAccepted, hadRemoteStream, remoteStream, isOpen, onClose]);

  useEffect(() => {
    console.log(
      "[VideoCall] Mounted. isOpen:",
      isOpen,
      "user:",
      user?._id,
      "callee:",
      callee?._id,
      "incomingCall:",
      incomingCall
    );
    if (!socket) return;
    socket.on("callToUser", (data) => {
      console.log("[VideoCall] Received callToUser event:", data);
      onCallStatus && onCallStatus("Incoming call...");
      setCallPeerId(data.from);
    });
    socket.on("callAccepted", (data) => {
      console.log("[VideoCall] Received callAccepted event:", data);
      setCallAccepted(true);
      setCallPeerId(data.from);
      if (peerRef.current) {
        peerRef.current.signal(data.signal);
      }
    });
    socket.on("callRejected", () => {
      console.log("[VideoCall] Received callRejected event");
      setCallRejected(true);
      onCallStatus && onCallStatus("Call rejected");
      if (onClose) {
        console.log("[VideoCall] Calling onClose from callRejected event");
        onClose();
      }
      endCall();
    });
    socket.on("callEnded", () => {
      console.log("[VideoCall] Received callEnded event");
      onCallStatus && onCallStatus("Call ended");
      cleanupCall();
    });
    socket.on("userUnavailable", (data) => {
      console.log("[VideoCall] Received userUnavailable event:", data);
      onCallStatus && onCallStatus(data.message);
      if (onClose) {
        console.log("[VideoCall] Calling onClose from userUnavailable event");
        onClose();
      }
    });
    socket.on("userBusy", (data) => {
      console.log("[VideoCall] Received userBusy event:", data);
      onCallStatus && onCallStatus(data.message);
      if (onClose) {
        console.log("[VideoCall] Calling onClose from userBusy event");
        onClose();
      }
    });
    return () => {
      socket.off("callToUser");
      socket.off("callAccepted");
      socket.off("callRejected");
      socket.off("callEnded");
      socket.off("userUnavailable");
      socket.off("userBusy");
    };
  }, [socket]);

  useEffect(() => {
    if (!socket) return;
    // Log all outgoing socket emits
    const originalEmit = socket.emit;
    socket.emit = function (...args) {
      console.log("[VideoCall][SOCKET EMIT]", ...args);
      return originalEmit.apply(this, args);
    };
    // Log all incoming socket events
    const logEvent =
      (event) =>
      (...args) => {
        console.log(`[VideoCall][SOCKET ON] ${event}`, ...args);
      };
    const eventsToLog = [
      "callToUser",
      "callAccepted",
      "callRejected",
      "callEnded",
      "userUnavailable",
      "userBusy",
      "webrtc-signal",
      "ice-candidate",
    ];
    eventsToLog.forEach((event) => {
      socket.on(event, logEvent(event));
    });
    return () => {
      eventsToLog.forEach((event) => {
        socket.off(event, logEvent(event));
      });
    };
  }, [socket]);

  // Ensure remote video element gets the stream
  useEffect(() => {
    if (remoteVideo.current && remoteStream) {
      console.log("[VideoCall] Setting remote video srcObject");
      remoteVideo.current.srcObject = remoteStream;
      remoteVideo.current.play().catch((err) => {
        console.error("[VideoCall] Error playing remote video:", err);
      });
    }
  }, [remoteStream]);

  // Ensure local video preview always gets the stream
  useEffect(() => {
    if (myVideo.current && stream) {
      myVideo.current.srcObject = stream;
    }
  }, [stream]);

  // Defensive cleanup function
  const cleanupCall = () => {
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
    if (stream) {
      stream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {}
      });
    }
    setStream(null);
    setRemoteStream(null);
    setCallAccepted(false);
    setCallRejected(false);
    setIsCalling(false);
    setCallPeerId(null);
    setHadRemoteStream(false);
    setCallStatus("Call Ended");
    setIncomingCallSignal(null);
    setIncomingCallFrom(null);
    setIncomingCall(null);
    // If you use a prop or context for incomingCall, reset it here too
    if (typeof onClose === "function") onClose();
  };

  // Defensive: before starting a new call, ensure cleanup
  const safePrepareForCall = async () => {
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
    if (stream) {
      stream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {}
      });
      setStream(null);
    }
    setRemoteStream(null);
    setCallAccepted(false);
    setCallRejected(false);
    setIsCalling(false);
    setCallPeerId(null);
    setHadRemoteStream(false);
    setCallStatus("Connecting...");
    setIncomingCallSignal(null);
    setIncomingCallFrom(null);
  };

  // Start a call (as caller) with iOS compatibility
  const startCall = async () => {
    await safePrepareForCall();
    console.log(
      "[VideoCall] startCall called by",
      user?._id,
      "to",
      callee?._id
    );
    setIsCalling(true);
    try {
      const mediaDevices = getMediaDevices();
      const constraints = {
        video: callType === "video" ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user"
        } : false,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      };

      // iOS-specific constraints
      if (isIOS()) {
        constraints.video = callType === "video" ? {
          width: { min: 320, ideal: 640, max: 1280 },
          height: { min: 240, ideal: 480, max: 720 },
          facingMode: "user"
        } : false;
        constraints.audio = {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        };
      }

      const mediaStream = await mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      if (myVideo.current) {
        myVideo.current.srcObject = mediaStream;
      }
      let offerSent = false;
      const peer = new Peer({
        initiator: true,
        trickle: true, // Enable trickle ICE
        stream: mediaStream,
        config: {
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            {
              urls: "turn:openrelay.metered.ca:80",
              username: "openrelayproject",
              credential: "openrelayproject",
            },
            // Additional STUN servers for better iOS compatibility
            { urls: "stun:stun1.l.google.com:19302" },
            { urls: "stun:stun2.l.google.com:19302" },
            { urls: "stun:stun3.l.google.com:19302" },
            { urls: "stun:stun4.l.google.com:19302" },
          ],
        },
      });
      peer.on("signal", (signalData) => {
        console.log("[VideoCall][PEER] signal", signalData);
        if (!offerSent) {
          // Only send the first offer as callToUser
          socket.emit("callToUser", {
            callToUserId: callee._id,
            from: user._id,
            name: user.firstName || user.username,
            email: user.email,
            profilepic: user.avatar,
            signalData: signalData, // <-- send the offer here!
          });
          offerSent = true;
        } else {
          // For subsequent signals (ICE), use webrtc-signal
          socket.emit("webrtc-signal", {
            to: callee._id,
            from: user._id,
            signal: signalData,
          });
        }
      });
      peer.on("connect", () => {
        setCallStatus("Call Connected");
        console.log("[VideoCall][PEER] connect");
      });
      peer.on("error", (err) => {
        setCallStatus("Call Failed");
        console.error("[VideoCall][PEER] error:", err);
      });
      peer.on("close", () => {
        setCallStatus("Call Ended");
        console.log("[VideoCall][PEER] close");
      });
      peer.on("stream", (remoteStream) => {
        console.log("[VideoCall][PEER] stream", remoteStream);
        setRemoteStream(remoteStream);
        if (remoteVideo.current) {
          remoteVideo.current.srcObject = remoteStream;
        }
      });
      peerRef.current = peer;
    } catch (err) {
      console.error(
        "[VideoCall] Error accessing media devices:",
        err,
        err?.stack
      );
      onCallStatus && onCallStatus("Could not access media devices");
      setIsCalling(false);
    }
  };

  // Add a log in the incoming call handler to confirm callee receives the call
  useEffect(() => {
    if (!socket) return;
    const handleIncomingCall = (data) => {
      console.log(
        "[VideoCall][INCOMING CALL] Received callToUser event:",
        data
      );
      setIncomingCall({
        signal: data.signalData,
        from: data.from,
        name: data.name,
        email: data.email,
        profilepic: data.profilepic,
      });
      setCallPeerId(data.from);
      setIncomingCallSignal(data.signalData); // Save the offer signal
      setIncomingCallFrom(data.from);
      setCallAccepted(false);
      setCallRejected(false);
    };
    socket.on("callToUser", handleIncomingCall);
    return () => {
      socket.off("callToUser", handleIncomingCall);
    };
  }, [socket]);

  // Both sides listen for webrtc-signal and call peer.signal only if peerRef.current is not null
  useEffect(() => {
    if (!socket) return;
    const handleWebRTCSignal = (data) => {
      if (peerRef.current && data.signal) {
        console.log("[VideoCall][SOCKET ON] webrtc-signal", data);
        if (data.signal.type === "answer") {
          console.log(
            "[VideoCall][SOCKET ON] Received answer SDP:",
            data.signal
          );
        }
        try {
          peerRef.current.signal(data.signal);
        } catch (e) {
          console.warn("[VideoCall] Tried to signal destroyed peer", e);
        }
      } else {
        console.warn(
          "[VideoCall] Ignored webrtc-signal: peerRef.current is null or missing signal",
          data
        );
      }
    };
    socket.on("webrtc-signal", handleWebRTCSignal);
    return () => {
      socket.off("webrtc-signal", handleWebRTCSignal);
    };
  }, [socket]);

  // Accept an incoming call with iOS compatibility
  const acceptCall = async () => {
    await safePrepareForCall();
    console.log("[VideoCall] acceptCall called by", user?._id);
    try {
      const mediaDevices = getMediaDevices();
      const constraints = {
        video: callType === "video" ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user"
        } : false,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      };

      // iOS-specific constraints
      if (isIOS()) {
        constraints.video = callType === "video" ? {
          width: { min: 320, ideal: 640, max: 1280 },
          height: { min: 240, ideal: 480, max: 720 },
          facingMode: "user"
        } : false;
        constraints.audio = {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        };
      }

      const mediaStream = await mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      if (myVideo.current) {
        myVideo.current.srcObject = mediaStream;
      }
      const peer = new Peer({
        initiator: false,
        trickle: true, // Enable trickle ICE
        stream: mediaStream,
        config: {
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            {
              urls: "turn:openrelay.metered.ca:80",
              username: "openrelayproject",
              credential: "openrelayproject",
            },
            // Additional STUN servers for better iOS compatibility
            { urls: "stun:stun1.l.google.com:19302" },
            { urls: "stun:stun2.l.google.com:19302" },
            { urls: "stun:stun3.l.google.com:19302" },
            { urls: "stun:stun4.l.google.com:19302" },
          ],
        },
      });
      peer.on("signal", (signalData) => {
        console.log("[VideoCall][PEER] signal", signalData);
        const type =
          signalData.type || (signalData.candidate ? "candidate" : "unknown");
        console.log(
          "[VideoCall] Emitting webrtc-signal (callee):",
          type,
          signalData
        );
        // Always send answer/candidates back to the caller
        if (incomingCallFrom) {
          socket.emit("webrtc-signal", {
            to: incomingCallFrom,
            from: user._id,
            signal: signalData,
          });
        } else if (callPeerId) {
          socket.emit("webrtc-signal", {
            to: callPeerId,
            from: user._id,
            signal: signalData,
          });
        }
      });
      peer.on("connect", () => {
        setCallStatus("Call Connected");
        console.log("[VideoCall][PEER] connect (acceptCall)");
      });
      peer.on("error", (err) => {
        setCallStatus("Call Failed");
        console.error("[VideoCall][PEER] error (acceptCall):", err);
      });
      peer.on("close", () => {
        setCallStatus("Call Ended");
        console.log("[VideoCall][PEER] close (acceptCall)");
      });
      peer.on("stream", (remoteStream) => {
        console.log("[VideoCall][PEER] stream (acceptCall)", remoteStream);
        setRemoteStream(remoteStream);
        if (remoteVideo.current) {
          remoteVideo.current.srcObject = remoteStream;
        }
      });
      if (incomingCallSignal) {
        console.log(
          "[VideoCall] Callee signaling with offer:",
          incomingCallSignal
        );
        peer.signal(incomingCallSignal);
      } else if (incomingCall && incomingCall.signal) {
        console.log(
          "[VideoCall] Callee signaling with offer (from incomingCall):",
          incomingCall.signal
        );
        peer.signal(incomingCall.signal);
      } else {
        console.warn("[VideoCall] No incoming offer signal to answer!");
      }
      peerRef.current = peer;
      setCallAccepted(true);
    } catch (err) {
      console.error("[VideoCall] Error accessing media devices (accept):", err);
      onCallStatus && onCallStatus("Could not access media devices");
    }
  };

  // Reject an incoming call
  const rejectCall = () => {
    console.log("[VideoCall] rejectCall called by", user?._id);
    socket.emit("reject-call", {
      to: incomingCall.from,
      name: user.firstName || user.username,
      profilepic: user.avatar,
    });
    setCallRejected(true);
    setIncomingCall(null);
    if (onClose) {
      console.log("[VideoCall] Calling onClose from rejectCall");
      onClose();
    }
  };

  // End the call (local user hangs up)
  const endCall = () => {
    console.log("[VideoCall] endCall called by", user?._id);
    if (callPeerId) {
      socket.emit("call-ended", {
        to: callPeerId,
        from: user._id,
        name: user.firstName || user.username,
      });
    }
    cleanupCall();
  };

  // Mute/unmute mic
  const toggleMic = () => {
    if (stream) {
      stream.getAudioTracks().forEach((track) => {
        track.enabled = !isMicOn;
      });
      setIsMicOn((prev) => !prev);
    }
  };

  // Toggle camera
  const toggleCam = () => {
    if (stream) {
      stream.getVideoTracks().forEach((track) => {
        track.enabled = !isCamOn;
      });
      setIsCamOn((prev) => !prev);
    }
  };

  // Debug log for render state
  console.log(
    "[VideoCall] Render: isOpen:",
    isOpen,
    "incomingCall:",
    incomingCall,
    "callAccepted:",
    callAccepted,
    "callRejected:",
    callRejected
  );

  // Show IncomingCallModal for incoming calls
  if (isOpen && incomingCall && !callAccepted && !callRejected) {
    return (
      <IncomingCallModal
        caller={{
          firstName: incomingCall.name,
          avatar: incomingCall.profilepic,
        }}
        callType={callType}
        onAccept={acceptCall}
        onReject={rejectCall}
      />
    );
  }

  if (!isOpen) return null;

  // WhatsApp-style call UI
  return (
    <div className="fixed inset-0 z-50 bg-gray-900">
      {/* Call Status Indicator - always visible at the top center */}
      <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-50">
        <div
          className={`px-6 py-2 rounded-full text-lg font-bold shadow-lg backdrop-blur-md ${
            callStatus === "Call Connected"
              ? "bg-green-600 text-white"
              : callStatus === "Call Ended" || callStatus === "Call Failed"
              ? "bg-red-600 text-white"
              : "bg-yellow-400 text-gray-900"
          }`}
          style={{
            letterSpacing: "1px",
            minWidth: "180px",
            textAlign: "center",
          }}
        >
          {callStatus}
        </div>
      </div>
      {/* Main video area */}
      <div className="relative w-full h-full">
        {/* Remote video */}
        {(() => {
          console.log(
            "[VideoCall] Render check - callType:",
            callType,
            "remoteStream:",
            !!remoteStream,
            "remoteStream tracks:",
            remoteStream?.getTracks()?.length
          );
          return callType === "video" && remoteStream ? (
            <video
              ref={remoteVideo}
              autoPlay
              playsInline
              muted={false}
              className="w-full h-full object-cover"
              style={{ 
                WebkitUserSelect: 'none',
                WebkitTouchCallout: 'none',
                WebkitTapHighlightColor: 'transparent'
              }}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gray-800">
              <div className="w-32 h-32 rounded-full bg-gray-700 flex items-center justify-center mb-4">
                {callee?.avatar || incomingCall?.profilepic ? (
                  <img
                    src={callee?.avatar || incomingCall?.profilepic}
                    alt={callee?.firstName || incomingCall?.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User className="w-16 h-16 text-gray-400" />
                )}
              </div>
              <h2 className="text-2xl font-semibold text-white">
                {callee?.firstName || incomingCall?.name || "User"}
              </h2>
              <p className="text-gray-400 mt-2">
                {callStatus ||
                  (callType === "video" ? "Video call" : "Voice call")}
              </p>
              {/* Start Call Button */}
              {!callAccepted &&
                !callRejected &&
                !isCalling &&
                (canMakeCall ? (
                  <button
                    onClick={startCall}
                    className="mt-8 px-8 py-4 rounded-full bg-green-500 hover:bg-green-600 text-white text-xl font-bold shadow-lg transition-all"
                  >
                    Start Call
                  </button>
                ) : (
                  <p className="mt-8 text-red-400 text-lg font-semibold text-center">
                    {callRestrictionMessage}
                  </p>
                ))}
            </div>
          );
        })()}

        {/* Local video preview (small in corner) */}
        {callType === "video" && stream && (
          <div className="absolute bottom-24 right-4 w-32 h-48 rounded-lg overflow-hidden border-2 border-gray-600 bg-black">
            <video
              ref={myVideo}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
              style={{ 
                WebkitUserSelect: 'none',
                WebkitTouchCallout: 'none',
                WebkitTapHighlightColor: 'transparent'
              }}
            />
          </div>
        )}

        {/* Caller info (for voice calls) */}
        {callType === "voice" && (
          <div className="absolute top-1/4 w-full flex flex-col items-center">
            <div className="w-32 h-32 rounded-full bg-gray-700 flex items-center justify-center mb-4">
              {callee?.avatar || incomingCall?.profilepic ? (
                <img
                  src={callee?.avatar || incomingCall?.profilepic}
                  alt={callee?.firstName || incomingCall?.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User className="w-16 h-16 text-gray-400" />
              )}
            </div>
            <h2 className="text-2xl font-semibold text-white">
              {callee?.firstName || incomingCall?.name || "User"}
            </h2>
            <p className="text-gray-400 mt-2">{callStatus || "Voice call"}</p>
            {/* Start Call Button for voice */}
            {!callAccepted &&
              !callRejected &&
              !isCalling &&
              (canMakeCall ? (
                <button
                  onClick={startCall}
                  className="mt-8 px-8 py-4 rounded-full bg-green-500 hover:bg-green-600 text-white text-xl font-bold shadow-lg transition-all"
                >
                  Start Call
                </button>
              ) : (
                <p className="mt-8 text-red-400 text-lg font-semibold text-center">
                  {callRestrictionMessage}
                </p>
              ))}
          </div>
        )}

        {/* Controls */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent pb-8 pt-16">
          <div className="flex justify-center space-x-8">
            {/* Mic toggle */}
            <button
              onClick={toggleMic}
              className={`w-14 h-14 rounded-full flex items-center justify-center ${
                isMicOn
                  ? "bg-gray-700 hover:bg-gray-600"
                  : "bg-red-500 hover:bg-red-600"
              } transition-colors`}
              title={isMicOn ? "Mute" : "Unmute"}
            >
              {isMicOn ? (
                <Mic className="w-6 h-6 text-white" />
              ) : (
                <MicOff className="w-6 h-6 text-white" />
              )}
            </button>

            {/* Camera toggle (video only) */}
            {callType === "video" && (
              <button
                onClick={toggleCam}
                className={`w-14 h-14 rounded-full flex items-center justify-center ${
                  isCamOn
                    ? "bg-gray-700 hover:bg-gray-600"
                    : "bg-red-500 hover:bg-red-600"
                } transition-colors`}
                title={isCamOn ? "Turn off camera" : "Turn on camera"}
              >
                {isCamOn ? (
                  <Video className="w-6 h-6 text-white" />
                ) : (
                  <VideoOff className="w-6 h-6 text-white" />
                )}
              </button>
            )}

            {/* End call */}
            <button
              onClick={endCall}
              className="w-14 h-14 rounded-full flex items-center justify-center bg-red-500 hover:bg-red-600 transition-colors"
              title="End call"
            >
              <PhoneOff className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoCall;
