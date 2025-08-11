import React, { createContext, useContext, useEffect, useState } from "react";

const WebSocketContext = createContext(null);

export const useWebSocket = () => useContext(WebSocketContext);

export const WebSocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsHost =
      process.env.NODE_ENV === "production"
        ? "http://scheduling-app-alb-177610882.us-east-1.elb.amazonaws.com"
        : "localhost:8080";
    const wsUrl = `${wsProtocol}//${wsHost}`;

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("WebSocket connected");
      setSocket(ws);
      setIsConnected(true);
    };

    ws.onerror = (error) => {
      console.log("WebSocket error:", error);
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
      setSocket(null);
      setIsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, []);

  return (
    <WebSocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </WebSocketContext.Provider>
  );
};
