import { io } from "socket.io-client";

let socket: ReturnType<typeof io> | null = null;

export const initSocket = (token?: string) => {
  if (socket) return socket;
  const base = import.meta.env.VITE_API_URL || "http://localhost:5000";
  socket = io(base, {
    auth: {
      token: token || undefined,
    },
  });
  socket.on("connect", () => {
    console.debug("Socket connected", socket?.id);
  });
  socket.on("connect_error", (err) => {
    console.warn("Socket connect error", err);
  });
  return socket;
};

export const getSocket = () => socket;
