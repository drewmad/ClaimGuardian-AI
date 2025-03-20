import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { compare } from 'bcrypt';
import { z } from 'zod';

const prisma = new PrismaClient();

// Maximum allowed failed login attempts before account lockout
const MAX_FAILED_ATTEMPTS = 5;

// Lockout duration in minutes
const LOCKOUT_DURATION_MINUTES = 15;

// Validation schema for login
const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(1, { message: 'Password is required' }),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = loginSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email, password } = validation.data;
    
    // Find the user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // No user found with that email
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check if account is locked
    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      const remainingLockoutTime = Math.ceil(
        (user.lockoutUntil.getTime() - Date.now()) / (1000 * 60)
      );
      
      return NextResponse.json(
        { 
          error: `Account is temporarily locked due to too many failed login attempts. Please try again in ${remainingLockoutTime} minute${remainingLockoutTime === 1 ? '' : 's'}.` 
        },
        { status: 429 }
      );
    }

    // Verify password
    const isPasswordValid = await compare(password, user.password);

    // Invalid password
    if (!isPasswordValid) {
      // Increment failed login attempts
      const failedAttempts = (user.failedLoginAttempts || 0) + 1;
      
      // Update user with increased failed attempts
      if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
        // Lock the account for the specified duration
        const lockoutUntil = new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000);
        
        await prisma.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: failedAttempts,
            lockoutUntil: lockoutUntil,
          },
        });
        
        return NextResponse.json(
          { 
            error: `Account has been locked due to too many failed login attempts. Please try again in ${LOCKOUT_DURATION_MINUTES} minutes or reset your password.` 
          },
          { status: 429 }
        );
      } else {
        // Just increment the failed attempts counter
        await prisma.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: failedAttempts,
          },
        });
        
        const attemptsLeft = MAX_FAILED_ATTEMPTS - failedAttempts;
        
        return NextResponse.json(
          { 
            error: `Invalid email or password. ${attemptsLeft} attempt${attemptsLeft === 1 ? '' : 's'} remaining before your account is temporarily locked.` 
          },
          { status: 401 }
        );
      }
    }

    // Check if email is verified
    if (!user.emailVerified) {
      return NextResponse.json(
        { 
          error: 'Please verify your email address before logging in. Check your inbox for the verification link or request a new one.',
          verified: false
        },
        { status: 403 }
      );
    }

    // Reset failed login attempts and lockout
    if (user.failedLoginAttempts > 0 || user.lockoutUntil) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: 0,
          lockoutUntil: null,
        },
      });
    }

    // Check if MFA is required
    if (user.mfaEnabled && user.mfaVerified) {
      return NextResponse.json({
        success: true,
        requiresMfa: true,
        email: user.email,
      });
    }

    // Successfully authenticated
    return NextResponse.json({
      success: true,
      requiresMfa: false,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
} 