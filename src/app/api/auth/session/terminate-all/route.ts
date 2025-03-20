import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/nextauth';

/**
 * Terminate all sessions for the current user except the current session
 */
export async function POST(req: Request) {
  try {
    // Get current user session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Get user info
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Get current active session (assuming it's the most recently active one)
    const currentSession = await prisma.session.findFirst({
      where: {
        userId: user.id,
        expires: { gt: new Date() },
      },
      orderBy: { lastActive: 'desc' },
      select: { id: true },
    });
    
    if (!currentSession) {
      return NextResponse.json(
        { error: 'No active session found' },
        { status: 404 }
      );
    }
    
    // Delete all other sessions for this user
    const result = await prisma.session.deleteMany({
      where: {
        userId: user.id,
        id: { not: currentSession.id },
      },
    });
    
    return NextResponse.json({ 
      success: true,
      message: `${result.count} other sessions terminated successfully` 
    });
  } catch (error) {
    console.error('Error terminating all sessions:', error);
    return NextResponse.json(
      { error: 'Failed to terminate sessions' },
      { status: 500 }
    );
  }
} 