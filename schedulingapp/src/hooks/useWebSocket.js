import { useState, useEffect, useRef } from "react";

export const useWebSocket = (shouldConnect = true) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectTimeoutRef = useRef(null);
  const socketRef = useRef(null);
  const shouldReconnectRef = useRef(true);

  useEffect(() => {
    if (!shouldConnect) return;

    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsHost =
      process.env.NODE_ENV === "production"
        ? "xuja0812.online"
        : "localhost:8080";
    const wsUrl = `${wsProtocol}//${wsHost}`;

    const connectWebSocket = () => {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log("WebSocket connected");
        setSocket(ws);
        socketRef.current = ws;
        setIsConnected(true);
      };

      ws.onclose = () => {
        console.log("WebSocket disconnected");
        setSocket(null);
        setIsConnected(false);

        if (shouldConnect && shouldReconnectRef.current) {
          reconnectTimeoutRef.current = setTimeout(connectWebSocket, 3000);
        }
      };

      ws.onerror = (error) => {
        console.log("WebSocket error:", error);
      };
    };

    connectWebSocket();

    return () => {
      shouldReconnectRef.current = false; 
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ type: "leave-room" }));
      }
      socketRef.current?.close();
    };
  }, [shouldConnect]);

  const sendMessage = (message) => {
    if (socket && isConnected) {
      socket.send(JSON.stringify(message));
    }
  };

  return { socket, isConnected, sendMessage };
};
