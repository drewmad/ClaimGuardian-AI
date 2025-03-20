import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  // Get token and email from URL parameters
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  const email = searchParams.get('email');
  
  // Validate parameters
  if (!token || !email) {
    return NextResponse.redirect(new URL('/auth/verification-error?error=missing-params', request.url));
  }
  
  try {
    // Find user with matching email and verification token
    const user = await prisma.user.findFirst({
      where: {
        email,
        verificationToken: token,
        verificationExpires: {
          gt: new Date(), // Token must not be expired
        },
        emailVerified: null, // Account must not be already verified
      },
    });
    
    if (!user) {
      return NextResponse.redirect(new URL('/auth/verification-error?error=invalid-token', request.url));
    }
    
    // Update user to mark as verified and clear verification token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
        verificationToken: null,
        verificationExpires: null,
      },
    });
    
    // Redirect to success page
    return NextResponse.redirect(new URL('/auth/verification-success', request.url));
  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.redirect(new URL('/auth/verification-error?error=server-error', request.url));
  }
} 