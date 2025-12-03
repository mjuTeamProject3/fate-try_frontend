import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@/constants/api';

// Socket.io 서버 URL (API_BASE_URL에서 /v1/api 제거)
const getSocketUrl = () => {
  const apiUrl = API_BASE_URL;
  // /v1/api를 제거하여 Socket.io 서버 URL 생성
  return apiUrl.replace('/v1/api', '');
};

let socket: Socket | null = null;

export const getSocket = async (): Promise<Socket | null> => {
  if (socket?.connected) {
    return socket;
  }

  try {
    const accessToken = await AsyncStorage.getItem('accessToken');
    if (!accessToken) {
      console.error('[socket] No access token found');
      return null;
    }

    const socketUrl = getSocketUrl();
    console.log('[socket] Connecting to:', socketUrl);

    socket = io(socketUrl, {
      auth: {
        token: accessToken,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
      console.log('[socket] Connected:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('[socket] Disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('[socket] Connection error:', error);
    });

    return socket;
  } catch (error) {
    console.error('[socket] Error creating socket:', error);
    return null;
  }
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

















