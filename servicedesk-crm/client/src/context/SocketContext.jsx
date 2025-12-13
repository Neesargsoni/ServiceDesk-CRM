import React, { createContext, useContext, useEffect, useState } from "react";
import io from "socket.io-client";

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Connect to Socket.IO server
    // const socketInstance = io("http://localhost:5001", {
    //   transports: ["polling"], // Use polling only to avoid WebSocket errors
    //   reconnection: true,
    //   reconnectionDelay: 1000,
    //   reconnectionAttempts: 10,
    //   timeout: 10000,
    //   upgrade: false // Prevent upgrade to WebSocket
    // });  

    const socketInstance = io(import.meta.env.VITE_API_URL.replace('/api', ''), {
  transports: ["polling"], // Use polling only to avoid WebSocket errors
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
      timeout: 10000,
      upgrade: false
});

    
    
    socketInstance.on("connect", () => {
      console.log("🔌 Socket.IO connected:", socketInstance.id);
      setConnected(true);

      // Join user-specific room if logged in
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      if (user._id) {
        socketInstance.emit("join", user._id);
        
        // Join admin room if user is admin/agent
        if (["admin", "agent"].includes(user.role)) {
          socketInstance.emit("joinAdminRoom");
        }
      }
    });

    socketInstance.on("disconnect", () => {
      console.log("🔌 Socket.IO disconnected");
      setConnected(false);
    });

    socketInstance.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      setConnected(false);
    });

    setSocket(socketInstance);

    // Cleanup on unmount
    return () => {
      socketInstance.disconnect();
    };
  }, []);

  // Add notification helper
  const addNotification = (notification) => {
    setNotifications((prev) => [
      {
        id: Date.now(),
        timestamp: new Date(),
        ...notification,
      },
      ...prev,
    ].slice(0, 50)); // Keep only last 50 notifications
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        connected,
        notifications,
        addNotification,
        clearNotifications,
        removeNotification,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};