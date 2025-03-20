import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/nextauth';
import { z } from 'zod';

// Validation schema for session termination
const terminateSessionSchema = z.object({
  sessionId: z.string(),
});

/**
 * Terminate a specific session
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
    
    // Parse and validate request body
    const body = await req.json();
    const validation = terminateSessionSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }
    
    const { sessionId } = validation.data;
    
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
    
    // Check if the session belongs to the user
    const targetSession = await prisma.session.findUnique({
      where: { id: sessionId },
      select: { userId: true },
    });
    
    if (!targetSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }
    
    // Check ownership - only allow users to terminate their own sessions
    if (targetSession.userId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to terminate this session' },
        { status: 403 }
      );
    }
    
    // Delete the session
    await prisma.session.delete({
      where: { id: sessionId },
    });
    
    return NextResponse.json({ 
      success: true,
      message: 'Session terminated successfully' 
    });
  } catch (error) {
    console.error('Error terminating session:', error);
    return NextResponse.json(
      { error: 'Failed to terminate session' },
      { status: 500 }
    );
  }
} 