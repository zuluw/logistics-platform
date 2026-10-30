import { createServer } from 'node:http';
import app from './app.js';
import { env } from './config/env.js';
import { socketService } from './services/socket.service.js';

const httpServer = createServer(app);

socketService.init(httpServer);

httpServer.listen(env.PORT, () => {
  console.log(`Server started on port ${env.PORT} in ${env.NODE_ENV} mode`);
  console.log(`Health check: http://localhost:${env.PORT}/api/health`);
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM. Closing HTTP server...');
  socketService.close();
  httpServer.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
});
