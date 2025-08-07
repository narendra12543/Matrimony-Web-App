import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext();
const wsUrl = import.meta.env.VITE_WS_URL;

// iOS compatibility helper
const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isVisible, setIsVisible] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const { user } = useAuth();

  // Track page visibility
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (user) {
      if (!user._id) {
        return;
      }

      setConnectionStatus("connecting");

      // iOS-specific Socket.IO configuration
      const socketOptions = {
        query: {
          userId: user._id,
        },
        transports: isIOS() ? ["polling", "websocket"] : ["websocket", "polling"],
        upgrade: true,
        rememberUpgrade: true,
        timeout: 20000,
        forceNew: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        maxReconnectionAttempts: 10,
        autoConnect: true,
        // iOS-specific options
        ...(isIOS() && {
          forceBase64: true,
          extraHeaders: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        })
      };

      const newSocket = io(wsUrl, socketOptions);

      newSocket.on("connect", () => {
        console.log("✅ Socket connected successfully");
        setConnectionStatus("connected");
        setSocket(newSocket);
      });

      newSocket.on("connect_error", (error) => {
        console.error("❌ Socket connection error:", error);
        setConnectionStatus("error");
        
        // iOS-specific error handling
        if (isIOS() && error.message.includes("polling")) {
          console.log("🔄 Retrying with different transport for iOS");
          newSocket.io.opts.transports = ["websocket"];
          newSocket.connect();
        }
      });

      newSocket.on("disconnect", (reason) => {
        console.log("🔌 Socket disconnected:", reason);
        setConnectionStatus("disconnected");
        setSocket(null);
        
        // Auto-reconnect for iOS
        if (isIOS() && reason === "io server disconnect") {
          console.log("🔄 Auto-reconnecting for iOS");
          setTimeout(() => {
            newSocket.connect();
          }, 1000);
        }
      });

      newSocket.on("reconnect", (attemptNumber) => {
        console.log("🔄 Socket reconnected after", attemptNumber, "attempts");
        setConnectionStatus("connected");
      });

      newSocket.on("reconnect_error", (error) => {
        console.error("❌ Socket reconnection error:", error);
        setConnectionStatus("error");
      });

      newSocket.on("reconnect_failed", () => {
        console.error("❌ Socket reconnection failed");
        setConnectionStatus("error");
      });

      // Handle user online/offline status
      newSocket.on("user-online", ({ userId }) => {
        setOnlineUsers((prev) =>
          prev.includes(userId) ? prev : [...prev, userId]
        );
      });

      newSocket.on("user-offline", ({ userId }) => {
        setOnlineUsers((prev) => prev.filter((id) => id !== userId));
      });

      newSocket.on("online-users", (userIds) => {
        setOnlineUsers(userIds);
      });

      return () => {
        console.log("🧹 Cleaning up socket connection");
        newSocket.close();
        setSocket(null);
        setConnectionStatus("disconnected");
      };
    }
  }, [user]);

  useEffect(() => {
    if (!socket) return;

    socket.on("online-users", (userIds) => {
      setOnlineUsers(userIds);
    });

    socket.on("user-online", ({ userId }) => {
      setOnlineUsers((prev) =>
        prev.includes(userId) ? prev : [...prev, userId]
      );
    });

    socket.on("user-offline", ({ userId }) => {
      setOnlineUsers((prev) => prev.filter((id) => id !== userId));
    });

    return () => {
      socket.off("online-users");
      socket.off("user-online");
      socket.off("user-offline");
    };
  }, [socket]);

  const value = {
    socket,
    onlineUsers,
    isVisible,
    connectionStatus,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};
