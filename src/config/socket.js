import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const socket = io(SOCKET_URL, {
  autoConnect: false,       // We connect manually when joining a room
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  transports: ['websocket', 'polling'],
  withCredentials: true,
  timeout: 10000,
});

export default socket;