import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

class SocketService {
  constructor() {
    this.io = null;
  }

  init(httpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: env.CLIENT_URL,
        credentials: true,
      },
    });

    this.io.use((socket, next) => {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(new Error('Authentication error'));
      }

      try {
        socket.user = jwt.verify(token, env.JWT_SECRET);
        next();
      } catch {
        next(new Error('Authentication error'));
      }
    });

    this.io.on('connection', (socket) => {
      if (socket.user.role === 'DISPATCHER' || socket.user.role === 'ADMIN') {
        socket.join('dispatchers_room');
      }

      socket.join(`driver_${socket.user.id}`);

      socket.on('driver:location_update', (data) => {
        this.emitToDispatchers('driver:location_changed', {
          driverId: socket.user.id,
          ...data,
        });
      });

      socket.on('disconnect', () => {});
    });
  }

  emitToDispatchers(event, data) {
    this.io?.to('dispatchers_room').emit(event, data);
  }

  emitToDriver(driverId, event, data) {
    this.io?.to(`driver_${driverId}`).emit(event, data);
  }

  close() {
    this.io?.close();
  }
}

export const socketService = new SocketService();
