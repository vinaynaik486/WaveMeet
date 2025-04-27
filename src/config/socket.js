import { io } from 'socket.io-client';

const SOCKET_SERVER_URL = 'http://localhost:3001'; // Update this with your server URL

export const socket = io(SOCKET_SERVER_URL, {
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    transports: ['websocket', 'polling'],
    withCredentials: true,
    forceNew: true,
    path: '/socket.io/',
    timeout: 10000
});

// Socket event listeners for debugging
socket.on('connect', () => {
    console.log('Connected to signaling server');
});

socket.on('disconnect', () => {
    console.log('Disconnected from signaling server');
});

socket.on('connect_error', (error) => {
    console.error('Connection error:', error);
});

export default socket; 