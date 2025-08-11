import { useState, useEffect, useRef } from 'react';

export const useWebSocket = (shouldConnect = true) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectTimeoutRef = useRef(null);

  useEffect(() => {
    if (!shouldConnect) return;

    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsHost = process.env.NODE_ENV === "production"
      ? "http://scheduling-app-alb-177610882.us-east-1.elb.amazonaws.com"
      : "localhost:8080";
    const wsUrl = `${wsProtocol}//${wsHost}`;

    const connectWebSocket = () => {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log("WebSocket connected");
        setSocket(ws);
        setIsConnected(true);
      };

      ws.onclose = () => {
        console.log("WebSocket disconnected");
        setSocket(null);
        setIsConnected(false);
        
        if (shouldConnect) {
          reconnectTimeoutRef.current = setTimeout(connectWebSocket, 3000);
        }
      };

      ws.onerror = (error) => {
        console.log("WebSocket error:", error);
      };
    };

    connectWebSocket();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      setSocket(prev => {
        if (prev) prev.close();
        return null;
      });
    };
  }, [shouldConnect]);

  const sendMessage = (message) => {
    if (socket && isConnected) {
      socket.send(JSON.stringify(message));
    }
  };

  return { socket, isConnected, sendMessage };
};