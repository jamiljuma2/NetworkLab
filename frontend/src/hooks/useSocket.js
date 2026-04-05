import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export function useSocket() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ["websocket"] });

    // Real-time event listeners
    const eventNames = [
      "system:hello",
      "scan:started",
      "scan:progress",
      "scan:completed",
      "scan:error",
      "packet:captured",
    ];

    eventNames.forEach((name) => {
      socket.on(name, (payload) => {
        setEvents((prev) =>
          [{ name, payload, at: Date.now() }, ...prev].slice(0, 120)
        );
      });
    });

    return () => socket.disconnect();
  }, []);

  return events;
}
