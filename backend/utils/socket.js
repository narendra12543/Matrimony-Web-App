// Socket.io setup

import { Server } from "socket.io";
import User from "../models/User.js";
import Chat from "../models/Chat.js";
import Message from "../models/Message.js";
import Notification from "../models/Notification.js";
import Call from "../models/Call.js";

let io;

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL,
      methods: ["GET", "POST"],
    },
  });

  // Track connected users
  const connectedUsers = new Map();

  io.on("connection", async (socket) => {
    // Expect userId in handshake query
    const userId = socket.handshake.query.userId;
    if (!userId) return;
    const user = await User.findById(userId);
    if (!user) return;
    socket.userId = user._id.toString();
    socket.user = user;

    // Store user connection
    connectedUsers.set(user._id.toString(), socket.id);

    // Update user online status
    await User.findByIdAndUpdate(user._id, {
      isOnline: true,
      lastActive: new Date(),
    });

    // Send the list of currently online users to the newly connected user
    socket.emit("online-users", Array.from(connectedUsers.keys()));

    // Join user to their chat rooms
    const userChats = await Chat.find({ participants: user._id });
    userChats.forEach((chat) => {
      socket.join(chat._id.toString());
    });

    // Handle joining a chat room
    socket.on("join-chat", (chatId) => {
      socket.join(chatId);
    });

    // Handle sending messages
    socket.on("send-message", async (data) => {
      console.log("Backend: Received send-message event with data:", data);
      try {
        const { chatId, content, messageType = "text", file } = data;
        // Verify user is part of the chat
        const chat = await Chat.findOne({
          _id: chatId,
          participants: user._id,
        }).populate("participants", "firstName lastName avatar");
        if (!chat) return;
        // Create message
        const messageData = {
          chat: chatId,
          sender: user._id,
          content: content || (file ? file.originalName : ""),
          messageType,
        };
        if (file && messageType !== "text") {
          messageData.file = file;
        }
        const message = new Message(messageData);
        await message.save();
        await message.populate("sender", "firstName lastName avatar");
        // Update chat's last message
        chat.lastMessage = message._id;
        chat.updatedAt = new Date();
        await chat.save();
        // Emit message to chat room
        io.to(chatId).emit("new-message", message);
        // Send real-time notification to other participants
        const otherParticipants = chat.participants.filter(
          (p) => p._id.toString() !== user._id.toString()
        );
        console.log(
          "Backend: Other participants for notification:",
          otherParticipants
        );
        for (const participant of otherParticipants) {
          const participantSocketId = connectedUsers.get(
            participant._id.toString()
          );
          console.log(
            `Backend: Participant ${participant._id} socket ID: ${participantSocketId}`
          );
          // Create notification in DB
          const notification = await Notification.create({
            user: participant._id,
            type: "message",
            title: "New Message", // Added title field
            message: `${user.firstName} sent you a message`,
            chat: chatId,
            fromUser: user._id,
            isRead: false,
          });
          console.log("Backend: Notification created in DB:", notification);
          if (participantSocketId) {
            const notificationData = {
              chatId,
              fromUser: user._id,
              senderName:
                user.firstName && user.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : user.firstName || user.email,
              senderAvatar: user.photos?.[0] || user.avatar,
              message: content,
              messageType,
              timestamp: new Date(),
            };
            console.log(
              "Backend: Emitting message-notification with data:",
              notificationData
            );
            io.to(participantSocketId).emit(
              "message-notification",
              notificationData
            );
            io.to(participantSocketId).emit("chat-updated", {
              chatId,
              lastMessage: message,
            });
          }
        }
      } catch (error) {
        console.error("Error sending message:", error);
      }
    });

    // Typing indicators
    socket.on("typing", async (data) => {
      try {
        const { chatId } = data;
        const chat = await Chat.findById(chatId).populate(
          "participants",
          "firstName lastName"
        );
        if (!chat) return;
        const otherParticipants = chat.participants.filter(
          (p) => p._id.toString() !== user._id.toString()
        );
        otherParticipants.forEach((participant) => {
          const participantSocketId = connectedUsers.get(
            participant._id.toString()
          );
          if (participantSocketId) {
            io.to(participantSocketId).emit("user-typing", {
              userId: user._id,
              userName:
                user.firstName && user.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : user.firstName || user.email,
              chatId,
            });
          }
        });
      } catch (error) {
        console.error("Error handling typing:", error);
      }
    });
    socket.on("stop-typing", async (data) => {
      try {
        const { chatId } = data;
        const chat = await Chat.findById(chatId).populate(
          "participants",
          "firstName lastName"
        );
        if (!chat) return;
        const otherParticipants = chat.participants.filter(
          (p) => p._id.toString() !== user._id.toString()
        );
        otherParticipants.forEach((participant) => {
          const participantSocketId = connectedUsers.get(
            participant._id.toString()
          );
          if (participantSocketId) {
            io.to(participantSocketId).emit("user-stop-typing", {
              userId: user._id,
              chatId,
            });
          }
        });
      } catch (error) {
        console.error("Error handling stop typing:", error);
      }
    });

    // --- WebRTC Call Signaling Events ---
    // Map of userId <-> socketId is already handled by connectedUsers

    // Initiate a call (fix event name to match frontend)
    socket.on("callToUser", (data) => {
      console.log(
        "[CALL] callToUser event received from",
        socket.userId,
        "to",
        data.callToUserId,
        "calleeSocketId:",
        connectedUsers.get(data.callToUserId)
      );
      const calleeSocketId = connectedUsers.get(data.callToUserId);
      if (!calleeSocketId) {
        socket.emit("userUnavailable", { message: "User is offline." });
        return;
      }
      // If callee is already in a call
      if (activeCalls.has(data.callToUserId)) {
        socket.emit("userBusy", {
          message: "User is currently in another call.",
        });
        io.to(calleeSocketId).emit("incomingCallWhileBusy", {
          from: data.from,
          name: data.name,
          email: data.email,
          profilepic: data.profilepic,
        });
        return;
      }
      // Relay call to callee
      io.to(calleeSocketId).emit("callToUser", {
        signal: data.signalData,
        from: data.from,
        name: data.name,
        email: data.email,
        profilepic: data.profilepic,
      });
      console.log(
        "[CALL] callToUser event emitted to calleeSocketId:",
        calleeSocketId
      );
    });

    // Answer a call
    socket.on(
      "call-answer",
      async ({ toUserId, fromUserId, answer, roomId }) => {
        console.log(
          "Received call-answer from",
          fromUserId,
          "to",
          toUserId,
          "roomId",
          roomId
        );
        const toSocketId = connectedUsers.get(toUserId);
        if (toSocketId) {
          io.to(toSocketId).emit("call-answered", {
            fromUserId,
            answer,
            roomId,
          });
        }
        // Update call status
        if (roomId) {
          await Call.findOneAndUpdate(
            { "connectionDetails.roomId": roomId },
            { status: "completed" }
          );
        }
      }
    );

    // Reject a call
    socket.on("call-reject", async ({ toUserId, callId }) => {
      const toSocketId = connectedUsers.get(toUserId);
      if (toSocketId) {
        io.to(toSocketId).emit("call-rejected", {
          fromUserId: socket.userId,
          callId,
        });
      }
      // Update call status
      await Call.findByIdAndUpdate(callId, { status: "rejected" });
    });

    // End a call
    socket.on("call-end", async ({ to, from }) => {
      console.log("Received call-end from", from, "to", to);
      const toSocketId = connectedUsers.get(to);
      if (toSocketId) {
        io.to(toSocketId).emit("call-ended", { fromUserId: from });
      }
      // Optionally update call status in DB
    });

    // ICE candidate exchange
    socket.on("ice-candidate", ({ toUserId, candidate }) => {
      console.log(
        "Received ice-candidate from",
        socket.userId,
        "to",
        toUserId,
        candidate
      );
      const toSocketId = connectedUsers.get(toUserId);
      if (toSocketId) {
        io.to(toSocketId).emit("ice-candidate", {
          fromUserId: socket.userId,
          candidate,
        });
      }
    });

    // Call timeout
    socket.on("call-timeout", async ({ toUserId, callId }) => {
      const toSocketId = connectedUsers.get(toUserId);
      if (toSocketId) {
        io.to(toSocketId).emit("call-timeout", {
          fromUserId: socket.userId,
          callId,
        });
      }
      // Update call status
      await Call.findByIdAndUpdate(callId, { status: "missed" });
    });

    // Heartbeat/ping mechanism
    socket.on("heartbeat", async () => {
      await User.findByIdAndUpdate(user._id, {
        lastActive: new Date(),
      });
    });

    // --- Video/Voice Call Presence & Signaling Extensions ---
    // Track active calls (userId <-> { with, socketId })
    const activeCalls = new Map();

    // Send the socket ID to the connected user (for WebRTC peer signaling)
    socket.emit("me", socket.id);

    // Handle user join for presence (already handled above, but emit online-users to all)
    io.emit("online-users", Array.from(connectedUsers.keys()));

    // --- WebRTC Signaling Events ---
    socket.on("callToUser", (data) => {
      console.log("[SOCKET] Event: callToUser", data);
      const toSocketId = connectedUsers.get(data.to);
      if (toSocketId) {
        io.to(toSocketId).emit("callToUser", data);
      }
    });

    socket.on("call-answer", (data) => {
      console.log("[SOCKET] Event: call-answer", data);
      const toSocketId = connectedUsers.get(data.to);
      if (toSocketId) {
        io.to(toSocketId).emit("call-answer", data);
      }
    });

    socket.on("call-reject", (data) => {
      console.log("[SOCKET] Event: call-reject", data);
      const toSocketId = connectedUsers.get(data.to);
      if (toSocketId) {
        io.to(toSocketId).emit("call-reject", data);
      }
    });

    socket.on("call-end", (data) => {
      console.log("[SOCKET] Event: call-end", data);
      const toSocketId = connectedUsers.get(data.to);
      if (toSocketId) {
        io.to(toSocketId).emit("call-end", data);
      }
    });

    socket.on("ice-candidate", ({ toUserId, candidate }) => {
      console.log("[SOCKET] Event: ice-candidate", {
        from: socket.userId,
        to: toUserId,
        candidate,
      });
      const toSocketId = connectedUsers.get(toUserId);
      if (toSocketId) {
        io.to(toSocketId).emit("ice-candidate", {
          fromUserId: socket.userId,
          candidate,
        });
      }
    });

    socket.on("webrtc-signal", (data) => {
      console.log("[SOCKET] Event: webrtc-signal", data);
      const toSocketId = connectedUsers.get(data.to);
      if (toSocketId) {
        io.to(toSocketId).emit("webrtc-signal", {
          from: data.from,
          signal: data.signal,
        });
      }
    });

    // On disconnect, clean up active calls and presence
    socket.on("disconnect", () => {
      const user = Array.from(connectedUsers.entries()).find(
        ([_, id]) => id === socket.id
      );
      if (user) {
        const userId = user[0];
        activeCalls.delete(userId);
        // Remove all calls where this user was the peer
        for (const [key, value] of activeCalls.entries()) {
          if (value.with === userId) activeCalls.delete(key);
        }
        connectedUsers.delete(userId);
      }
      io.emit("online-users", Array.from(connectedUsers.keys()));
      socket.broadcast.emit("discounnectUser", { disUser: socket.id });
    });

    // Emit online status to all connected users
    io.emit("user-online", { userId: user._id });

    // Relay all WebRTC signals (offer, answer, ICE candidates)
    // This block is now redundant as WebRTC signaling is handled by the new socket.on('webrtc-signal')
    // socket.on("webrtc-signal", (data) => {
    //   const toSocketId = connectedUsers.get(data.to);
    //   if (toSocketId) {
    //     io.to(toSocketId).emit("webrtc-signal", {
    //       from: data.from,
    //       signal: data.signal,
    //     });
    //   }
    // });
  });
};

const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
};

export { initializeSocket, getIO };
