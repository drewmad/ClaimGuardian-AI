import { PrismaClient, Session } from '@prisma/client';
import { randomBytes } from 'crypto';
import { UAParser } from 'ua-parser-js';

const prisma = new PrismaClient();

// Session timeout in minutes (default 8 hours)
export const SESSION_TIMEOUT_MINUTES = 8 * 60;

// Maximum concurrent sessions per user
export const MAX_CONCURRENT_SESSIONS = 5;

/**
 * Create a new session for a user
 */
export async function createSession(
  userId: string, 
  ipAddress: string, 
  userAgent: string
): Promise<Session> {
  // Parse user agent to extract device information
  const parser = new UAParser(userAgent);
  const browser = parser.getBrowser();
  const os = parser.getOS();
  const device = parser.getDevice();
  
  // Generate a unique token
  const sessionToken = randomBytes(32).toString('hex');
  
  // Calculate expiry (default 8 hours from now)
  const expires = new Date();
  expires.setMinutes(expires.getMinutes() + SESSION_TIMEOUT_MINUTES);
  
  // Create device info string
  const deviceInfo = JSON.stringify({
    browser: `${browser.name || 'Unknown'} ${browser.version || ''}`.trim(),
    os: `${os.name || 'Unknown'} ${os.version || ''}`.trim(),
    device: device.type || 'desktop',
    vendor: device.vendor || 'Unknown',
    model: device.model || 'Unknown',
  });
  
  // Check if user has reached maximum number of sessions
  const activeSessionsCount = await prisma.session.count({
    where: {
      userId,
      expires: {
        gt: new Date(),
      },
    },
  });
  
  // If user has reached max sessions, remove the oldest one
  if (activeSessionsCount >= MAX_CONCURRENT_SESSIONS) {
    const oldestSession = await prisma.session.findFirst({
      where: {
        userId,
        expires: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
    
    if (oldestSession) {
      await prisma.session.delete({
        where: {
          id: oldestSession.id,
        },
      });
    }
  }
  
  // Create and return the new session
  return prisma.session.create({
    data: {
      sessionToken,
      userId,
      expires,
      ipAddress,
      userAgent,
      deviceInfo,
      lastActive: new Date(),
    },
  });
}

/**
 * Get a session by token
 */
export async function getSessionByToken(token: string): Promise<Session | null> {
  return prisma.session.findUnique({
    where: {
      sessionToken: token,
    },
  });
}

/**
 * Update session last active timestamp
 */
export async function updateSessionActivity(sessionId: string): Promise<void> {
  await prisma.session.update({
    where: {
      id: sessionId,
    },
    data: {
      lastActive: new Date(),
    },
  });
}

/**
 * Extend session expiry time
 */
export async function extendSession(sessionId: string): Promise<void> {
  const expires = new Date();
  expires.setMinutes(expires.getMinutes() + SESSION_TIMEOUT_MINUTES);
  
  await prisma.session.update({
    where: {
      id: sessionId,
    },
    data: {
      expires,
      lastActive: new Date(),
    },
  });
}

/**
 * Delete a session
 */
export async function deleteSession(sessionId: string): Promise<void> {
  await prisma.session.delete({
    where: {
      id: sessionId,
    },
  });
}

/**
 * Delete all sessions for a user
 */
export async function deleteAllUserSessions(userId: string): Promise<void> {
  await prisma.session.deleteMany({
    where: {
      userId,
    },
  });
}

/**
 * Get all active sessions for a user
 */
export async function getUserActiveSessions(userId: string): Promise<Session[]> {
  return prisma.session.findMany({
    where: {
      userId,
      expires: {
        gt: new Date(),
      },
    },
    orderBy: {
      lastActive: 'desc',
    },
  });
}

/**
 * Clean up expired sessions
 */
export async function cleanupExpiredSessions(): Promise<number> {
  const result = await prisma.session.deleteMany({
    where: {
      expires: {
        lt: new Date(),
      },
    },
  });
  
  return result.count;
}

/**
 * Check if a session is valid (not expired and exists)
 */
export async function isValidSession(token: string): Promise<boolean> {
  const session = await prisma.session.findUnique({
    where: {
      sessionToken: token,
    },
  });
  
  if (!session) {
    return false;
  }
  
  return session.expires > new Date();
}

/**
 * Detect suspicious login activity
 */
export async function detectSuspiciousActivity(
  userId: string, 
  ipAddress: string, 
  userAgent: string
): Promise<boolean> {
  // Get user's recent active sessions
  const recentSessions = await prisma.session.findMany({
    where: {
      userId,
      expires: {
        gt: new Date(),
      },
    },
    orderBy: {
      lastActive: 'desc',
    },
    take: 5,
  });
  
  // If this is the first session, it's not suspicious
  if (recentSessions.length === 0) {
    return false;
  }
  
  // Parse new user agent
  const parser = new UAParser(userAgent);
  const browser = parser.getBrowser();
  const os = parser.getOS();
  
  // Check if this IP or device was used before
  const familiarIP = recentSessions.some(session => session.ipAddress === ipAddress);
  const familiarUserAgent = recentSessions.some(session => {
    // Check if the session has deviceInfo
    if (!session.deviceInfo) return false;
    
    try {
      const deviceInfo = JSON.parse(session.deviceInfo);
      // Check if browser and OS match
      return deviceInfo.browser.includes(browser.name || '') &&
             deviceInfo.os.includes(os.name || '');
    } catch (error) {
      return false;
    }
  });
  
  // If both IP and device are new, it might be suspicious
  return !familiarIP && !familiarUserAgent;
} 