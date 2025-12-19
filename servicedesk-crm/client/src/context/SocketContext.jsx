import React, { createContext, useContext, useState } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext();

let socketInstance = null;

export const SocketProvider = ({ children }) => {
  const [connected, setConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const connectSocket = (user) => {
    if (socketInstance) return;

    socketInstance = io(import.meta.env.VITE_SOCKET_URL, {
      transports: ["polling"], // Render-safe
      timeout: 20000,
      reconnection: true,
      auth: {
        token: localStorage.getItem("token"),
      },
    });

    socketInstance.on("connect", () => {
      console.log("🔌 Socket connected:", socketInstance.id);
      setConnected(true);

      if (user?._id) {
        socketInstance.emit("join", user._id);
        if (["admin", "agent"].includes(user.role)) {
          socketInstance.emit("joinAdminRoom");
        }
      }
    });

    socketInstance.on("disconnect", () => {
      console.log("🔌 Socket disconnected");
      setConnected(false);
    });

    socketInstance.on("connect_error", (err) => {
      console.warn("⚠️ Socket connection failed:", err.message);
    });
  };

  const disconnectSocket = () => {
    if (socketInstance) {
      socketInstance.disconnect();
      socketInstance = null;
      setConnected(false);
    }
  };

  // Notification helpers
  const addNotification = (notification) => {
    setNotifications((prev) =>
      [
        {
          id: Date.now(),
          timestamp: new Date(),
          ...notification,
        },
        ...prev,
      ].slice(0, 50)
    );
  };

  return (
    <SocketContext.Provider
      value={{
        socket: socketInstance,
        connected,
        connectSocket,
        disconnectSocket,
        notifications,
        addNotification,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
