import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/nextauth';

/**
 * Get current session information
 */
export async function GET() {
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
    
    // Get current active session for this user
    // In a real app, we would need to identify the specific session
    // This is simplified for demo purposes
    const currentSession = await prisma.session.findFirst({
      where: {
        userId: user.id,
        expires: { gt: new Date() },
      },
      orderBy: { lastActive: 'desc' },
    });
    
    if (!currentSession) {
      return NextResponse.json(
        { error: 'No active session found' },
        { status: 404 }
      );
    }
    
    // Return session ID and basic info
    return NextResponse.json({
      sessionId: currentSession.id,
      expires: currentSession.expires,
      lastActive: currentSession.lastActive,
    });
  } catch (error) {
    console.error('Error getting current session:', error);
    return NextResponse.json(
      { error: 'Failed to get session information' },
      { status: 500 }
    );
  }
} 