import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/nextauth';
import { prisma } from '@/lib/prisma';
import { updateNotificationPreferences } from '@/lib/notification-service';
import { z } from 'zod';

// Define valid notification channels
const notificationChannelSchema = z.enum(['IN_APP', 'EMAIL', 'BOTH']);

// Define validation schema for notification preferences
const preferencesSchema = z.object({
  claimStatus: notificationChannelSchema.optional(),
  policyExpiry: notificationChannelSchema.optional(),
  documentUpload: notificationChannelSchema.optional(),
  paymentReminder: notificationChannelSchema.optional(),
  systemAlert: notificationChannelSchema.optional(),
  securityAlert: notificationChannelSchema.optional(),
});

/**
 * Get notification preferences for the authenticated user
 */
export async function GET(request: Request) {
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
    
    // Get notification preferences
    const preferences = await prisma.notificationPreference.findUnique({
      where: { userId: user.id },
    });
    
    // If no preferences exist, return defaults
    if (!preferences) {
      return NextResponse.json({
        userId: user.id,
        claimStatus: 'BOTH',
        policyExpiry: 'BOTH',
        documentUpload: 'IN_APP',
        paymentReminder: 'BOTH',
        systemAlert: 'IN_APP',
        securityAlert: 'BOTH',
      });
    }
    
    return NextResponse.json(preferences);
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notification preferences' },
      { status: 500 }
    );
  }
}

/**
 * Update notification preferences for the authenticated user
 */
export async function PUT(request: Request) {
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
    const validation = preferencesSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }
    
    const preferences = validation.data;
    
    // Convert to the format expected by updateNotificationPreferences
    const preferencesForUpdate: any = {};
    
    if (preferences.claimStatus) {
      preferencesForUpdate.CLAIM_STATUS_CHANGE = preferences.claimStatus;
    }
    
    if (preferences.policyExpiry) {
      preferencesForUpdate.POLICY_EXPIRY = preferences.policyExpiry;
    }
    
    if (preferences.documentUpload) {
      preferencesForUpdate.DOCUMENT_UPLOAD = preferences.documentUpload;
    }
    
    if (preferences.paymentReminder) {
      preferencesForUpdate.PAYMENT_REMINDER = preferences.paymentReminder;
    }
    
    if (preferences.systemAlert) {
      preferencesForUpdate.SYSTEM_ALERT = preferences.systemAlert;
    }
    
    if (preferences.securityAlert) {
      preferencesForUpdate.SECURITY_ALERT = preferences.securityAlert;
    }
    
    // Update preferences
    await updateNotificationPreferences(user.id, preferencesForUpdate);
    
    // Get updated preferences
    const updatedPreferences = await prisma.notificationPreference.findUnique({
      where: { userId: user.id },
    });
    
    return NextResponse.json({
      success: true,
      message: 'Notification preferences updated',
      preferences: updatedPreferences,
    });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return NextResponse.json(
      { error: 'Failed to update notification preferences' },
      { status: 500 }
    );
  }
} 