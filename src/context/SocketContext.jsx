import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import socket from '@/config/socket';

/**
 * Global WebSocket Context.
 * 
 * Manages the singleton Socket.io connection lifecycle.
 * Provides a reliable transport layer for WebRTC signaling, real-time chat,
 * and global notifications.
 */
const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const [isConnected, setIsConnected] = useState(false);
  
  // Persist the singleton instance across re-renders
  const socketRef = useRef(socket);

  useEffect(() => {
    const s = socketRef.current;

    const onConnect = () => {
      console.log('[SOCKET] Connected:', s.id);
      setIsConnected(true);
    };

    const onDisconnect = () => {
      console.log('[SOCKET] Disconnected');
      setIsConnected(false);
    };

    const onError = (err) => {
      console.error('[SOCKET ERROR]', err.message);
    };

    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);
    s.on('connect_error', onError);

    // Hydrate state if socket is already connected (e.g., during React strict-mode or hot reloads)
    if (s.connected) {
      setIsConnected(true);
    }

    return () => {
      s.off('connect', onConnect);
      s.off('disconnect', onDisconnect);
      s.off('connect_error', onError);
    };
  }, []);

  /**
   * Manually establishes the socket connection.
   * Useful for reconnecting after intentional disconnects or network failures.
   */
  const connect = () => {
    if (!socketRef.current.connected) {
      socketRef.current.connect();
    }
  };

  /**
   * Manually severs the socket connection.
   * Crucial for teardown during meeting exits to prevent ghost connections and memory leaks.
   */
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

/**
 * Consumes the active Socket.io instance and connection state.
 * Must be used within a <SocketProvider> boundary.
 */
export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within a SocketProvider boundary');
  return ctx;
}
