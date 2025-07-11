import { useState, useEffect, useRef } from "react";
import {
  Send,
  Phone,
  Video,
  MoreVertical,
  Heart,
  Paperclip,
  Zap,
  Star,
  MessageCircle,
  Image,
  FileText,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "../../contexts/Chat/AuthContext";
import { useSocket } from "../../contexts/Chat/SocketContext";
import CallScreen from "../Call/CallScreen";
import IncomingCallModal from "../Call/IncomingCallModal";
import CallingModal from "../Call/CallingModal";
import VideoCall from '../Call/VideoCall';

import MessageList from "../Chat/MessageList";
import TypingIndicator from "../Chat/TypingIndicator";
import EmojiPicker from "../Chat/EmojiPicker";
import FileUpload from "../Chat/FileUpload";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";

const ICE_SERVERS = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

const ChatWindow = ({ selectedChat, onMessageSent, onlineUsers = [], mobileBackButton, prefillMessage }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const { user } = useAuth();
  const { socket } = useSocket();
  const [callState, setCallState] = useState("idle"); // idle | calling | incoming | active
  const [callType, setCallType] = useState(null); // 'video' | 'voice'
  const [isCaller, setIsCaller] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null); // { fromUserId, callType }
  const [callInfo, setCallInfo] = useState(null); // For active call details
  const [callActive, setCallActive] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [callStatus, setCallStatus] = useState("");
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const messageInputRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const localStreamRef = useRef(null);
  const [callTarget, setCallTarget] = useState(null); // userId of the other party
  const hasSetRemoteAnswer = useRef(false);
  const [videoCallOpen, setVideoCallOpen] = useState(false);
  const [incomingCallData, setIncomingCallData] = useState(null);
  const [videoCallType, setVideoCallType] = useState('video');

  // Handler: When a call is incoming
  const handleIncomingCall = ({ caller, callType }) => {
    setIncomingCall({ caller, callType });
    setCallStatus("Incoming call...");
  };

  useEffect(() => {
    if (selectedChat) {
      fetchMessages();
    }
  }, [selectedChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (socket) {
      // Debug: Listen to common events to see what's being received
      const handleNewMessageEvent = (message) => {
        console.log("📨 ChatWindow: Received new message event:", message);
        handleNewMessage(message);
      };
      const handleUserTypingEvent = (data) => {
        console.log("⌨️ ChatWindow: Received user-typing event:", data);
        handleUserTyping(data);
      };
      const handleUserStopTypingEvent = (data) => {
        console.log("✋ ChatWindow: Received user-stop-typing event:", data);
        handleUserStopTyping(data);
      };
      socket.on("new-message", handleNewMessageEvent);
      socket.on("user-typing", handleUserTypingEvent);
      socket.on("user-stop-typing", handleUserStopTypingEvent);
      return () => {
        socket.off("new-message", handleNewMessageEvent);
        socket.off("user-typing", handleUserTypingEvent);
        socket.off("user-stop-typing", handleUserStopTypingEvent);
      };
    }
  }, [socket?.id, selectedChat?._id]); // Add selectedChat._id to dependencies for correct chat context

  // Listen for incoming call
  useEffect(() => {
    if (!socket) return;
    const handleIncomingCall = (data) => {
      console.log('[ChatWindow] Received callToUser event:', data);
      alert('Incoming call event received! Check console for details.');
      setIncomingCallData(data);
      setVideoCallOpen(true);
      setVideoCallType(data.callType || 'video');
      setTimeout(() => {
        console.log('[ChatWindow] State after incoming call:', {
          incomingCallData: data,
          videoCallOpen: true,
          videoCallType: data.callType || 'video',
        });
      }, 100);
    };
    socket.on('callToUser', handleIncomingCall);
    return () => {
      socket.off('callToUser', handleIncomingCall);
    };
  }, [socket]);

  // Handler to start a call
  const handleStartCall = (type = 'video') => {
    console.log('[ChatWindow] handleStartCall called with type:', type);
    setVideoCallType(type);
    setVideoCallOpen(true);
  };

  // --- Socket Event Handlers ---
  useEffect(() => {
    if (!socket) return;
    console.log("Registering socket event listeners");
    // Incoming call
    socket.on(
      "incoming-call",
      async ({ fromUser, callType, offer, roomId, callId }) => {
        if (callState !== "idle") {
          // Already in a call, auto-reject
          socket.emit("call-reject", {
            callId,
            roomId,
            toUserId: fromUser._id,
          });
          return;
        }
        setIncomingCall({ caller: fromUser, callType, offer, roomId, callId });
        setCallState("incoming");
        setCallStatus("Incoming call...");
      }
    );
    // Call answered
    socket.on("call-answered", ({ fromUserId, answer, roomId }) => {
      setCallState("active");
      setCallInfo((prev) => ({ ...prev, roomId }));
      if (peerConnectionRef.current && !hasSetRemoteAnswer.current) {
        const pc = peerConnectionRef.current;
        if (pc.signalingState !== "stable") {
          pc.setRemoteDescription(new window.RTCSessionDescription(answer));
          setCallStatus("Call connected");
          hasSetRemoteAnswer.current = true;
        }
      }
    });
    // Call rejected
    socket.on("call-reject", ({ reason }) => {
      setCallStatus(reason || "Call rejected");
      setCallState("idle");
      setIsCaller(false);
      setCallInfo(null);
      setCallActive(false);
    });
    // Call ended
    socket.on("call-ended", () => {
      handleEndCallRTC();
    });
    // Call timeout
    socket.on("call-timeout", () => {
      setCallStatus("Call timed out");
      setCallState("idle");
      setIsCaller(false);
      setCallInfo(null);
      setCallActive(false);
    });
    // ICE candidate
    socket.on("ice-candidate", async ({ candidate }) => {
      if (peerConnectionRef.current && candidate) {
        try {
          await peerConnectionRef.current.addIceCandidate(
            new RTCIceCandidate(candidate)
          );
        } catch (err) {
          // Ignore errors
        }
      }
    });
    return () => {
      socket.off("incoming-call");
      socket.off("call-answered");
      socket.off("call-reject");
      socket.off("call-ended");
      socket.off("call-timeout");
      socket.off("ice-candidate");
    };
  }, [socket]);

  // --- WebRTC Setup ---
  const startLocalStream = async (type = "video") => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: type === "video",
        audio: true,
      });
      setLocalStream(stream);
      localStreamRef.current = stream;
      return stream;
    } catch (error) {
      console.error("Error accessing media devices:", error);
      throw error;
    }
  };

  // --- PeerConnection Management ---
  const createPeerConnection = () => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionRef.current = pc;

    // Add local stream tracks to peer connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    // Handle remote stream
    pc.ontrack = (event) => {
      console.log("Received remote stream");
      setRemoteStream(event.streams[0]);
      remoteStreamRef.current = event.streams[0];
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", {
          candidate: event.candidate,
          toUserId: callTarget,
        });
      }
    };

    return pc;
  };

  // --- Reconnection Logic (stub) ---
  const reconnectCall = async () => {
    console.log("Attempting to reconnect call...");
    try {
      await startLocalStream(callType);
      createPeerConnection();
      setCallStatus("Reconnected");
    } catch (error) {
      console.error("Failed to reconnect:", error);
      setCallStatus("Reconnection failed");
    }
  };

  // --- Initiate Call (outgoing) ---
  const initiateCall = async (targetUserId, type = "video") => {
    try {
      await startLocalStream(type);
      const pc = createPeerConnection();
      setCallTarget(targetUserId);
      setIsCaller(true);
      setCallType(type);
      setCallState("calling");
      setCallStatus("Calling...");

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const callId = uuidv4();
      const roomId = `room_${Date.now()}`;

      socket.emit("call-user", {
        toUserId: targetUserId,
        callType: type,
        offer,
        roomId,
        callId,
      });

      setCallInfo({ callId, roomId });
    } catch (error) {
      console.error("Error initiating call:", error);
      setCallStatus("Failed to start call");
      setCallState("idle");
    }
  };

  // --- Accept Call (incoming) ---
  const handleAcceptCallRTC = async () => {
    try {
      await startLocalStream(incomingCall.callType);
      const pc = createPeerConnection();
      setCallType(incomingCall.callType);
      setCallState("active");
      setCallActive(true);
      setCallStatus("Call connected");

      await pc.setRemoteDescription(
        new RTCSessionDescription(incomingCall.offer)
      );

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit("call-answer", {
        toUserId: incomingCall.caller._id,
        answer,
        roomId: incomingCall.roomId,
      });
    } catch (error) {
      console.error("Error accepting call:", error);
      setCallStatus("Failed to accept call");
      setCallState("idle");
    }
  };

  // --- Reject Call ---
  const handleRejectCallRTC = () => {
    socket.emit("call-reject", {
      toUserId: incomingCall.caller._id,
      roomId: incomingCall.roomId,
      callId: incomingCall.callId,
    });
    setCallState("idle");
    setIncomingCall(null);
    setCallStatus("Call rejected");
  };

  // --- End Call ---
  const handleEndCallRTC = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
      localStreamRef.current = null;
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    setRemoteStream(null);
    remoteStreamRef.current = null;
    setCallActive(false);
    setCallState("idle");
    setCallInfo(null);
    setIsCaller(false);
    setCallStatus("Call ended");

    if (callTarget) {
      socket.emit("end-call", { toUserId: callTarget });
      setCallTarget(null);
    }
  };

  // --- Socket Event Listeners ---
  useEffect(() => {
    if (!socket) return;

    // Incoming call
    socket.on("call-initiate", async ({ from, callType, offer }) => {
      setIncomingCall({ caller: from, callType, offer });
      setCallStatus("Incoming call...");
    });

    // Call answered (for caller)
    socket.on("call-answered", async ({ fromUserId, answer, roomId }) => {
      if (peerConnectionRef.current && !hasSetRemoteAnswer.current) {
        const pc = peerConnectionRef.current;
        console.log(
          "Caller: signalingState before setRemoteDescription(answer):",
          pc.signalingState
        );
        if (pc.signalingState !== "stable") {
          await pc.setRemoteDescription(
            new window.RTCSessionDescription(answer)
          );
          console.log(
            "Caller: setRemoteDescription(answer)",
            answer,
            "signalingState:",
            pc.signalingState
          );
          setCallStatus("Call connected");
          hasSetRemoteAnswer.current = true;
        } else {
          console.warn(
            "Caller: PeerConnection already stable, skipping setRemoteDescription(answer)"
          );
        }
      }
    });

    // ICE candidate
    socket.on("ice-candidate", async ({ candidate }) => {
      if (peerConnectionRef.current && candidate) {
        try {
          await peerConnectionRef.current.addIceCandidate(
            new RTCIceCandidate(candidate)
          );
        } catch (err) {
          // Ignore errors
        }
      }
    });

    // Call rejected
    socket.on("call-reject", ({ from }) => {
      setCallStatus("Call rejected");
      handleEndCallRTC();
    });

    // Call ended
    socket.on("call-ended", () => {
      handleEndCallRTC();
    });

    // Cleanup listeners on unmount
    return () => {
      socket.off("call-initiate");
      socket.off("call-answer");
      socket.off("ice-candidate");
      socket.off("call-reject");
      socket.off("call-end");
    };
  }, [socket, callTarget]);

  // TODO: Add useEffect hooks to listen for socket events for call signaling
  // TODO: Add WebRTC logic for handling offer/answer/ICE candidates

  const fetchMessages = async () => {
    if (!selectedChat) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      console.log('ChatWindow: Fetching messages with token:', !!token);
      
      const response = await axios.get(`http://localhost:5000/api/v1/messages/${selectedChat._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
      if (error.response?.status === 401) {
        console.error('Auth error in ChatWindow');
      }
    } finally {
      setLoading(false);
    }
  };

  // Utility to get chat ID from string or object
  const getChatId = (chat) => (typeof chat === "string" ? chat : chat?._id);

  const handleNewMessage = (message) => {
    if (message.chat === selectedChat?._id) {
      // Remove temporary message if it exists and add the real message
      setMessages(prev => {
        const filteredMessages = prev.filter(msg => !msg._id.toString().startsWith(Date.now().toString().slice(0, -3)));
        return [...filteredMessages, message];
      });
    }
  };

  // --- Typing Indicator Handlers ---
  const handleUserTyping = ({ userId, userName, chatId }) => {
    // Only show typing for current chat
    if (userId !== user._id && chatId === selectedChat?._id) {
      console.log(`👀 ${userName} is typing in current chat`);
      setTypingUsers(prev => [...prev.filter(u => u.id !== userId), { id: userId, name: userName }]);
    }
  };

  const handleUserStopTyping = ({ userId, chatId }) => {
    // Only remove typing for current chat
    if (chatId === selectedChat?._id) {
      console.log(`✋ User stopped typing in current chat`);
      setTypingUsers(prev => prev.filter(u => u.id !== userId));
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    const messageText = newMessage.trim();
    const hasFiles = uploadedFiles.length > 0;
    
    if (!messageText && !hasFiles) return;

    if (hasFiles) {
      // Send each uploaded file with optional text
      uploadedFiles.forEach(fileData => {
        handleSendFileWithText(fileData, messageText);
      });
      setNewMessage('');
    } else if (messageText) {
      // Send text message only
      if (!selectedChat || !socket) return;

      const messageData = {
        chatId: selectedChat._id,
        content: messageText,
        messageType: 'text'
      };

      // Create temporary message
      const tempMessage = {
        _id: `temp_${Date.now()}`,
        content: messageText,
        messageType: 'text',
        sender: { 
          _id: user._id, 
          name: `${user.firstName} ${user.lastName}`, 
          avatar: user.avatar 
        },
        createdAt: new Date(),
        isTemp: true
      };

      setMessages(prev => [...prev, tempMessage]);

      // Send via socket
      socket.emit("send-message", messageData);

      // Notify parent component
      onMessageSent({
        chat: selectedChat._id,
        content: messageText,
        messageType: 'text',
        sender: { 
          _id: user._id, 
          name: `${user.firstName} ${user.lastName}`, 
          avatar: user.avatar 
        },
        createdAt: new Date()
      });

      setNewMessage('');
    }
  };

  const handleTyping = (value) => {
    setNewMessage(value);

    if (!socket || !selectedChat) return;

    // Emit typing event with chatId
    if (value.trim()) {
      socket.emit("typing", { chatId: selectedChat._id });
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stop-typing", { chatId: selectedChat._id });
    }, 1000);
  };

  const handleEmojiSelect = (emoji) => {
    const input = messageInputRef.current;
    if (input) {
      const start = input.selectionStart;
      const end = input.selectionEnd;
      const newValue = newMessage.slice(0, start) + emoji + newMessage.slice(end);
      setNewMessage(newValue);
      
      // Set cursor position after emoji
      setTimeout(() => {
        input.setSelectionRange(start + emoji.length, start + emoji.length);
        input.focus();
      }, 0);
    } else {
      setNewMessage(prev => prev + emoji);
    }
  };

  const handleFileSelect = async (fileData) => {
    if (!selectedChat || !socket) return;

    const messageData = {
      chatId: selectedChat._id,
      content: fileData.content,
      messageType: fileData.messageType,
      file: fileData.file
    };

    // Create temporary message
    const tempMessage = {
      _id: `temp_${Date.now()}`,
      content: fileData.content,
      messageType: fileData.messageType,
      file: fileData.file,
      sender: { 
        _id: user._id, 
        name: `${user.firstName} ${user.lastName}`, 
        avatar: user.avatar 
      },
      createdAt: new Date(),
      isTemp: true
    };

    setMessages(prev => [...prev, tempMessage]);

    // Send via socket
    socket.emit("send-message", messageData);

    // Notify parent component
    onMessageSent({
      chat: selectedChat._id,
      content: fileData.content,
      messageType: fileData.messageType,
      file: fileData.file,
      sender: { 
        _id: user._id, 
        name: `${user.firstName} ${user.lastName}`, 
        avatar: user.avatar 
      },
      createdAt: new Date()
    });
  };

  const handleUploadedFile = (uploadedFile) => {
    setUploadedFiles(prev => [...prev, uploadedFile]);
  };

  const handleSendFileWithText = (fileData, text = '') => {
    if (!selectedChat || !socket) return;

    const messageData = {
      chatId: selectedChat._id,
      content: text || fileData.content,
      messageType: fileData.messageType,
      file: fileData.file
    };

    // Create temporary message
    const tempMessage = {
      _id: `temp_${Date.now()}`,
      content: text || fileData.content,
      messageType: fileData.messageType,
      file: fileData.file,
      sender: { 
        _id: user._id, 
        name: `${user.firstName} ${user.lastName}`, 
        avatar: user.avatar 
      },
      createdAt: new Date(),
      isTemp: true
    };

    setMessages(prev => [...prev, tempMessage]);

    // Send via socket
    socket.emit("send-message", messageData);

    // Notify parent component
    onMessageSent({
      chat: selectedChat._id,
      content: text || fileData.content,
      messageType: fileData.messageType,
      file: fileData.file,
      sender: { 
        _id: user._id, 
        name: `${user.firstName} ${user.lastName}`, 
        avatar: user.avatar 
      },
      createdAt: new Date()
    });

    // Remove from uploaded files
    setUploadedFiles(prev => prev.filter(f => f.id !== fileData.id));
  };

  const handleRemoveUploadedFile = (fileId) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  useEffect(() => {
    if (localStream) {
      window._debugLocalStream = localStream;
      console.log("Exposed localStream as window._debugLocalStream");
    }
  }, [localStream]);

  useEffect(() => {
    if (prefillMessage && messageInputRef.current) {
      setNewMessage(prefillMessage);
      messageInputRef.current.focus();
    }
  }, [prefillMessage]);

  if (!selectedChat) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-rose-50 to-pink-50">
        <div className="text-center max-w-md mx-auto p-4 sm:p-8">
          <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-r from-rose-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6 sm:mb-8">
            <MessageCircle className="w-12 h-12 sm:w-16 sm:h-16 text-rose-500" />
          </div>
          <h3 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4">
            Welcome to Chat
          </h3>
          <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8 leading-relaxed px-4">
            Select a conversation from the sidebar to start chatting, or create a new conversation to connect with someone special.
          </p>
          <div className="flex items-center justify-center space-x-2 text-rose-500">
            <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-xs sm:text-sm font-medium">Where connections begin</span>
            <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>
      </div>
    );
  }

  const otherUser = selectedChat?.participants.find(p => p._id !== user._id);
  const isOtherUserOnline = otherUser ? onlineUsers.includes(otherUser._id) : false;

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Chat Header */}
      {selectedChat && (
        <div className="p-3 sm:p-6 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
              {/* Back button for mobile only */}
              {mobileBackButton && (
                <button
                  onClick={mobileBackButton}
                  className="lg:hidden p-2 mr-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-rose-400 to-pink-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg text-sm sm:text-base">
                  {otherUser?.avatar ? (
                    <img 
                      src={otherUser.avatar} 
                      alt={`${otherUser.firstName} ${otherUser.lastName}`}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    `${otherUser?.firstName?.charAt(0) || ''}${otherUser?.lastName?.charAt(0) || ''}`.toUpperCase()
                  )}
                </div>
                {isOtherUserOnline && (
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-emerald-500 rounded-full border-2 border-white"></div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-gray-900 text-base sm:text-lg truncate">
                  {otherUser?.firstName} {otherUser?.lastName}
                </h3>
                <div className="flex items-center space-x-2">
                  {isOtherUserOnline ? (
                    <>
                      <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                      <p className="text-xs sm:text-sm text-emerald-600 font-medium">Active now</p>
                    </>
                  ) : (
                    <>
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      <p className="text-xs sm:text-sm text-gray-500">Offline</p>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleStartCall("voice")}
                className="p-2 sm:p-3 bg-rose-100 hover:bg-rose-200 text-rose-600 rounded-xl transition-all duration-200"
                title="Voice Call"
              >
                <Phone className="w-4 h-4 sm:w-5 sm:h-5" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleStartCall("video")}
                className="p-2 sm:p-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl transition-all duration-200"
                title="Video Call"
              >
                <Video className="w-4 h-4 sm:w-5 sm:h-5" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 sm:p-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-200"
              >
                <MoreVertical className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
              </motion.button>
            </div>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto bg-gradient-to-b from-gray-50 to-white scrollbar-hide">
        {/* Custom CSS for hiding scrollbar */}
        <style jsx>{`
          .scrollbar-hide {
            -ms-overflow-style: none;  /* IE and Edge */
            scrollbar-width: none;  /* Firefox */
          }
          .scrollbar-hide::-webkit-scrollbar {
            display: none;  /* Chrome, Safari and Opera */
          }
        `}</style>

        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-8 h-8 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin"></div>
              <p className="text-gray-500">Loading messages...</p>
            </div>
          </div>
        ) : (
          <>
            <MessageList messages={messages} currentUserId={user._id} />
            <TypingIndicator typingUsers={typingUsers} />
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message Input */}
      <div className="p-3 sm:p-6 bg-white border-t border-gray-200">
        {/* File Previews */}
        {uploadedFiles.length > 0 && (
          <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs sm:text-sm font-medium text-gray-700">Files to send:</h4>
              <button
                onClick={() => setUploadedFiles([])}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Clear all
              </button>
            </div>
            <div className="space-y-2">
              {uploadedFiles.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-2 bg-white rounded border">
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    <div className="flex-shrink-0">
                      {file.messageType === 'image' && <Image className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-600" />}
                      {file.messageType === 'video' && <Video className="w-3 h-3 sm:w-4 sm:h-4 text-rose-600" />}
                      {file.messageType === 'document' && <FileText className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />}
                    </div>
                    <span className="text-xs sm:text-sm text-gray-700 truncate">{file.content}</span>
                  </div>
                  <button
                    onClick={() => handleRemoveUploadedFile(file.id)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                    title="Remove file"
                  >
                    <X className="w-3 h-3 sm:w-4 sm:h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSendMessage} className="flex items-end space-x-2 sm:space-x-4">
          <div className="flex-1 relative">
            <div className="flex items-end bg-gray-50 rounded-2xl border-2 border-gray-200 focus-within:border-rose-500 focus-within:bg-white transition-all duration-200">
              <input
                ref={messageInputRef}
                type="text"
                value={newMessage}
                onChange={(e) => handleTyping(e.target.value)}
                placeholder={uploadedFiles.length > 0 ? "Add a message (optional)..." : "Type your message..."}
                className="flex-1 px-4 sm:px-6 py-3 sm:py-4 bg-transparent outline-none rounded-2xl text-gray-800 placeholder-gray-500 text-sm sm:text-base"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
              />
              <div className="flex items-center space-x-1 sm:space-x-2 pr-3 sm:pr-4 pb-2 sm:pb-3">
                <FileUpload
                  onFileSelect={handleFileSelect}
                  isOpen={showFileUpload}
                  onToggle={setShowFileUpload}
                  onUploadedFile={handleUploadedFile}
                />
                <EmojiPicker
                  onEmojiSelect={handleEmojiSelect}
                  isOpen={showEmojiPicker}
                  onToggle={setShowEmojiPicker}
                  position="top"
                />
              </div>
            </div>
          </div>
          
          <motion.button
            type="submit"
            disabled={!newMessage.trim() && uploadedFiles.length === 0}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all duration-200 flex-shrink-0"
          >
            <Send className="w-5 h-5 sm:w-6 sm:h-6" />
          </motion.button>
        </form>
      </div>

      {/* Calling Modal for Caller */}
      {callState === "calling" && (
        <CallingModal
          callee={otherUser}
          callType={callType}
          onCancel={handleEndCallRTC}
        />
      )}

      {/* Incoming Call Modal for Receiver */}
      {callState === "incoming" && incomingCall && (
        <IncomingCallModal
          caller={incomingCall.caller}
          callType={incomingCall.callType}
          onAccept={handleAcceptCallRTC}
          onReject={handleRejectCallRTC}
        />
      )}

      {/* Call Screen */}
      {callActive && (
        <CallScreen
          localStream={localStream}
          remoteStream={remoteStream}
          callType={callType}
          onEndCall={handleEndCallRTC}
          callStatus={callStatus}
        />
      )}

      {/* Video Call Modal */}
      {videoCallOpen && (
        <VideoCall
          isOpen={videoCallOpen}
          onClose={() => {
            console.log('[ChatWindow] Closing VideoCall modal');
            setVideoCallOpen(false);
            setIncomingCallData(null);
          }}
          callee={selectedChat?.participants?.find((p) => p._id !== user._id)}
          incomingCall={incomingCallData}
          callType={videoCallType}
          onCallStatus={(status) => {
            console.log('[ChatWindow] VideoCall status:', status);
          }}
        />
      )}
    </div>
  );
};

export default ChatWindow;
