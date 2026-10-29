import app from './app.js';
import { env } from './config/env.js';

const server = app.listen(env.PORT, () => {
  console.log(`Server started on port ${env.PORT} in ${env.NODE_ENV} mode`);
  console.log(`Health check: http://localhost:${env.PORT}/api/health`);
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM. Closing HTTP server...');
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
});
