import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/nextauth';
import { prisma } from '@/lib/prisma';
import { markNotificationAsRead, markAllNotificationsAsRead } from '@/lib/notification-service';
import { z } from 'zod';

// Validation schema for marking a specific notification as read
const markAsReadSchema = z.object({
  notificationId: z.string().optional(),
  markAll: z.boolean().optional(),
});

/**
 * Mark notifications as read
 */
export async function POST(request: Request) {
  try {
    // Get current user session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Get user from email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    const validation = markAsReadSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }
    
    const { notificationId, markAll } = validation.data;
    
    if (markAll) {
      // Mark all notifications as read
      const count = await markAllNotificationsAsRead(user.id);
      return NextResponse.json({
        success: true,
        message: `Marked ${count} notifications as read`,
      });
    } else if (notificationId) {
      // Mark a specific notification as read
      
      // First check if notification belongs to user
      const notification = await prisma.notification.findUnique({
        where: { id: notificationId },
        select: { userId: true },
      });
      
      if (!notification) {
        return NextResponse.json(
          { error: 'Notification not found' },
          { status: 404 }
        );
      }
      
      if (notification.userId !== user.id) {
        return NextResponse.json(
          { error: 'Unauthorized to mark this notification as read' },
          { status: 403 }
        );
      }
      
      // Mark notification as read
      await markNotificationAsRead(notificationId);
      
      return NextResponse.json({
        success: true,
        message: 'Notification marked as read',
      });
    } else {
      return NextResponse.json(
        { error: 'Either notificationId or markAll must be provided' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark notification as read' },
      { status: 500 }
    );
  }
} 