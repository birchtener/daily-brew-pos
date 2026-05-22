import dotenv from 'dotenv';
import { createServer } from 'http';
import app from './app';
import { prisma } from './config/db';
import { initWebSocket } from './config/socket';

dotenv.config();

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  try {
    await prisma.$connect();
    console.log('PostgreSQL connection pool initialized successfully via Prisma ORM.');

    const httpServer = createServer(app);
    initWebSocket(httpServer);
    console.log('Real-Time WebSocket Engine attached to gateway channel rooms.');

    httpServer.listen(PORT, ()=> {
        console.log(`POS Backend Engine executing in [${process.env.NODE_ENV || 'development'}] mode on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to launch POS Backend Engine:', error);
    process.exit(1);
  }
}

bootstrap();