import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { API_URL } from '../config/env';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export function useSocket() {
  return useContext(SocketContext);
}

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    if (!user?._id) {
      setSocket(null);
      setOnlineUsers([]);
      return;
    }

    const newSocket = io(API_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 500,
    });

    const bindUser = () => {
      if (user?._id) {
        newSocket.emit('join', user._id);
      }
    };

    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
      bindUser();
    });

    newSocket.on('reconnect', () => {
      console.log('Socket reconnected:', newSocket.id);
      bindUser();
    });

    newSocket.on('onlineUsers', (users) => {
      setOnlineUsers(Array.isArray(users) ? users : []);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user?._id]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
}
