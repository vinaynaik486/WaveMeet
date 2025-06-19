import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import socket from '@/config/socket';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(socket);

  useEffect(() => {
    const s = socketRef.current;

    const onConnect = () => {
      console.log('Socket connected:', s.id);
      setIsConnected(true);
    };

    const onDisconnect = () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    };

    const onError = (err) => {
      console.error('Socket error:', err.message);
    };

    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);
    s.on('connect_error', onError);

    // If already connected (hot reload), sync state
    if (s.connected) {
      setIsConnected(true);
    }

    return () => {
      s.off('connect', onConnect);
      s.off('disconnect', onDisconnect);
      s.off('connect_error', onError);
    };
  }, []);

  const connect = () => {
    if (!socketRef.current.connected) {
      socketRef.current.connect();
    }
  };

  const disconnect = () => {
    if (socketRef.current.connected) {
      socketRef.current.disconnect();
    }
  };

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, isConnected, connect, disconnect }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within SocketProvider');
  return ctx;
}
