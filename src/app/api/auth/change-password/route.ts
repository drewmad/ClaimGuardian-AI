import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { hash, compare } from 'bcrypt';
import { getServerSession } from 'next-auth/next';
import { z } from 'zod';
import { passwordStrengthSchema, isPasswordInHistory, addToPasswordHistory } from '@/lib/password-policies';

const prisma = new PrismaClient();

// Number of previous passwords to check against
const PASSWORD_HISTORY_CHECK_COUNT = 5;

// Validation schema for password change
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, { message: 'Current password is required' }),
  newPassword: passwordStrengthSchema,
  confirmPassword: z.string().min(1, { message: 'Please confirm your new password' }),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "New passwords don't match",
  path: ['confirmPassword'],
}).refine(data => data.currentPassword !== data.newPassword, {
  message: "New password must be different from your current password",
  path: ['newPassword'],
});

export async function POST(req: Request) {
  try {
    // Get the user session
    const session = await getServerSession();
    
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse request body
    const body = await req.json();
    const validation = changePasswordSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }
    
    const { currentPassword, newPassword } = validation.data;
    
    // Get the user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Verify current password
    const isCurrentPasswordValid = await compare(currentPassword, user.password);
    
    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 401 }
      );
    }
    
    // Check if new password is in the password history
    if (user.passwordHistory && user.passwordHistory.length > 0) {
      if (isPasswordInHistory(newPassword, user.passwordHistory)) {
        return NextResponse.json(
          { error: 'New password cannot be the same as any of your previous passwords' },
          { status: 400 }
        );
      }
    }
    
    // Hash the new password
    const hashedPassword = await hash(newPassword, 12);
    
    // Add the new password to password history
    const updatedPasswordHistory = addToPasswordHistory(
      newPassword, 
      user.passwordHistory || [], 
      PASSWORD_HISTORY_CHECK_COUNT
    );
    
    // Update the user's password
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordHistory: updatedPasswordHistory,
        passwordLastChanged: new Date(),
      },
    });
    
    return NextResponse.json(
      { message: 'Password changed successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Password change error:', error);
    return NextResponse.json(
      { error: 'Failed to change password' },
      { status: 500 }
    );
  }
} 