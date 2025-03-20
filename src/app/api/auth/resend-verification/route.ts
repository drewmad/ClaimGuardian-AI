import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { generateVerificationToken, sendVerificationEmail } from '@/lib/email-service';

const prisma = new PrismaClient();

// Validation schema for resend request
const resendSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = resendSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email } = validation.data;
    
    // Find the user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Don't reveal if the user exists or not for security
    if (!user) {
      return NextResponse.json(
        { message: 'If your email is registered, a verification link has been sent.' },
        { status: 200 }
      );
    }

    // If user is already verified, inform them
    if (user.emailVerified) {
      return NextResponse.json(
        { message: 'Your email is already verified. You can login to your account.' },
        { status: 200 }
      );
    }
    
    // Generate new verification token and expiration (24 hours from now)
    const verificationToken = generateVerificationToken();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    
    // Update user with new verification token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken,
        verificationExpires,
      },
    });

    // Send verification email
    const emailResult = await sendVerificationEmail(
      email,
      user.name || 'User',
      verificationToken
    );

    // Return appropriate response based on email sending success
    if (emailResult.success) {
      return NextResponse.json(
        { 
          message: 'Verification email has been sent. Please check your inbox.',
          previewUrl: emailResult.messageUrl // Only included in development
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { error: 'Failed to send verification email. Please try again later.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.json(
      { error: 'An error occurred. Please try again later.' },
      { status: 500 }
    );
  }
} 