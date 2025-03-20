import { PrismaClient } from '@prisma/client';

// Prevent multiple instances of Prisma Client in development
declare global {
  var prisma: PrismaClient | undefined;
}

// Create optimized Prisma client
// By default, Prisma Client establishes a connection pool for better performance
// Logging is limited in production for performance
const createPrismaClient = () => {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'error', 'warn']
      : ['error'],
  });
  
  // Don't explicitly connect - Prisma will handle connections automatically
  // when needed. Explicit connect/disconnect can cause connection handling issues
  // in serverless environments like Next.js API routes
  
  return client;
};

// Create a cached instance of PrismaClient
export const prisma = global.prisma || createPrismaClient();

// Prevent multiple instances during hot reloading in development
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

// Add shutdown handler for proper cleanup in production
if (process.env.NODE_ENV === 'production') {
  // Handle graceful shutdown for production servers
  const handleShutdown = async () => {
    console.log('Shutting down Prisma client');
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on('SIGINT', handleShutdown);
  process.on('SIGTERM', handleShutdown);
}

export default prisma; 