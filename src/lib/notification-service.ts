import { prisma } from '@/lib/prisma';
import { sendVerificationEmail } from '@/lib/email-service';
import type { NotificationType, NotificationChannel, User, Notification } from '@prisma/client';

export interface NotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}

/**
 * Create a new notification
 */
export async function createNotification(data: NotificationData): Promise<Notification> {
  return prisma.notification.create({
    data: {
      userId: data.userId,
      type: data.type,
      title: data.title,
      message: data.message,
      link: data.link,
    }
  });
}

/**
 * Get user preferences and decide which channels to use for notification
 */
export async function getNotificationChannels(
  userId: string,
  notificationType: NotificationType
): Promise<NotificationChannel> {
  // Get user preferences
  const preferences = await prisma.notificationPreference.findUnique({
    where: { userId },
  });

  // Default to BOTH if no preferences set
  if (!preferences) {
    return 'BOTH';
  }

  // Get channel based on notification type
  switch (notificationType) {
    case 'CLAIM_STATUS_CHANGE':
      return preferences.claimStatus;
    case 'POLICY_EXPIRY':
      return preferences.policyExpiry;
    case 'DOCUMENT_UPLOAD':
      return preferences.documentUpload;
    case 'PAYMENT_REMINDER':
      return preferences.paymentReminder;
    case 'SYSTEM_ALERT':
      return preferences.systemAlert;
    case 'SECURITY_ALERT':
      return preferences.securityAlert;
    default:
      return 'BOTH';
  }
}

/**
 * Send a notification through the specified channels
 */
export async function sendNotification(data: NotificationData): Promise<void> {
  try {
    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
      select: { email: true, name: true }
    });

    if (!user) {
      throw new Error(`User not found: ${data.userId}`);
    }

    // Get preferred channels
    const channel = await getNotificationChannels(data.userId, data.type);

    // Create in-app notification if channel is IN_APP or BOTH
    if (channel === 'IN_APP' || channel === 'BOTH') {
      await createNotification(data);
    }

    // Send email notification if channel is EMAIL or BOTH
    if ((channel === 'EMAIL' || channel === 'BOTH') && user.email) {
      // For now, we're reusing the email service to send notifications
      // In a real app, we'd create specialized email templates for each notification type
      await sendNotificationEmail(
        user.email,
        user.name || 'User',
        data.title,
        data.message,
        data.link
      );
    }
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
}

/**
 * Send an email notification
 */
async function sendNotificationEmail(
  email: string,
  name: string,
  title: string,
  message: string,
  link?: string
): Promise<void> {
  // Build a simple HTML template for the notification email
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #0284c7;">${title}</h2>
      <p>Hello ${name},</p>
      <p>${message}</p>
      ${link ? `<p style="text-align: center; margin: 30px 0;">
        <a href="${link}" style="background-color: #0284c7; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
          View Details
        </a>
      </p>` : ''}
      <p>Thanks,<br>Florida Insurance Team</p>
    </div>
  `;

  // Reuse the email service to send the notification email
  // In a real app, you'd have a dedicated email sender for notifications
  // For simplicity, we're reusing the verification email function
  try {
    await sendVerificationEmail(email, name, htmlContent);
  } catch (error) {
    console.error('Failed to send notification email:', error);
    throw error;
  }
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  await prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true }
  });
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId: string): Promise<number> {
  const result = await prisma.notification.updateMany({
    where: {
      userId,
      isRead: false
    },
    data: { isRead: true }
  });

  return result.count;
}

/**
 * Get unread notifications for a user
 */
export async function getUnreadNotifications(userId: string): Promise<Notification[]> {
  return prisma.notification.findMany({
    where: {
      userId,
      isRead: false
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
}

/**
 * Get all notifications for a user with pagination
 */
export async function getUserNotifications(
  userId: string,
  page: number = 1,
  pageSize: number = 10
): Promise<{ notifications: Notification[]; total: number }> {
  const skip = (page - 1) * pageSize;

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize
    }),
    prisma.notification.count({
      where: { userId }
    })
  ]);

  return { notifications, total };
}

/**
 * Create default notification preferences for a user
 */
export async function createDefaultNotificationPreferences(userId: string): Promise<void> {
  await prisma.notificationPreference.create({
    data: {
      userId,
      // Defaults are set in the schema
    }
  });
}

/**
 * Update notification preferences for a user
 */
export async function updateNotificationPreferences(
  userId: string,
  preferences: Partial<Record<NotificationType, NotificationChannel>>
): Promise<void> {
  // Find existing preferences or create defaults
  const existing = await prisma.notificationPreference.findUnique({
    where: { userId }
  });

  if (!existing) {
    // Create with custom preferences
    await prisma.notificationPreference.create({
      data: {
        userId,
        ...(preferences.CLAIM_STATUS_CHANGE && { claimStatus: preferences.CLAIM_STATUS_CHANGE }),
        ...(preferences.POLICY_EXPIRY && { policyExpiry: preferences.POLICY_EXPIRY }),
        ...(preferences.DOCUMENT_UPLOAD && { documentUpload: preferences.DOCUMENT_UPLOAD }),
        ...(preferences.PAYMENT_REMINDER && { paymentReminder: preferences.PAYMENT_REMINDER }),
        ...(preferences.SYSTEM_ALERT && { systemAlert: preferences.SYSTEM_ALERT }),
        ...(preferences.SECURITY_ALERT && { securityAlert: preferences.SECURITY_ALERT }),
      }
    });
  } else {
    // Update existing preferences
    await prisma.notificationPreference.update({
      where: { userId },
      data: {
        ...(preferences.CLAIM_STATUS_CHANGE && { claimStatus: preferences.CLAIM_STATUS_CHANGE }),
        ...(preferences.POLICY_EXPIRY && { policyExpiry: preferences.POLICY_EXPIRY }),
        ...(preferences.DOCUMENT_UPLOAD && { documentUpload: preferences.DOCUMENT_UPLOAD }),
        ...(preferences.PAYMENT_REMINDER && { paymentReminder: preferences.PAYMENT_REMINDER }),
        ...(preferences.SYSTEM_ALERT && { systemAlert: preferences.SYSTEM_ALERT }),
        ...(preferences.SECURITY_ALERT && { securityAlert: preferences.SECURITY_ALERT }),
      }
    });
  }
} 