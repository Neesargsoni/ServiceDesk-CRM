import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within SocketProvider");
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // ✅ Use environment variable for Socket.IO connection
    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || "http://localhost:5000";
    
    console.log("🔌 Connecting to Socket.IO server:", SOCKET_URL);

    const socketInstance = io(SOCKET_URL, {
      transports: ["websocket", "polling"], // Try WebSocket first, fallback to polling
      withCredentials: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketInstance.on("connect", () => {
      console.log("✅ Socket connected:", socketInstance.id);
      setConnected(true);
      
      // Join user-specific room if authenticated
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      
      if (token && user.id) {
        socketInstance.emit("join_user_room", user.id);
        console.log("👤 Joined user room:", user.id);
      }
    });

    socketInstance.on("disconnect", (reason) => {
      console.log("❌ Socket disconnected:", reason);
      setConnected(false);
    });

    socketInstance.on("connect_error", (error) => {
      console.error("🔴 Socket connection error:", error.message);
      setConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      console.log("🔌 Disconnecting socket");
      socketInstance.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
};