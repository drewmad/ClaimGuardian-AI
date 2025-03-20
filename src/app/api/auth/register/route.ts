import { NextResponse } from 'next/server';
import { hash } from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { generateVerificationToken, sendVerificationEmail } from '@/lib/email-service';
import { passwordStrengthSchema, addToPasswordHistory } from '@/lib/password-policies';

const prisma = new PrismaClient();

// Validation schema for registration with enhanced password policy
const registerSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: passwordStrengthSchema,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = registerSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { name, email, password } = validation.data;
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hash(password, 12);
    
    // Create initial password history
    const passwordHistory = addToPasswordHistory(password);
    
    // Generate verification token and expiration (24 hours from now)
    const verificationToken = generateVerificationToken();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    
    // Create user with verification token and password policy data
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        verificationToken,
        verificationExpires,
        passwordHistory,
        passwordLastChanged: new Date(),
      },
    });

    // Send verification email
    const emailResult = await sendVerificationEmail(
      email,
      name || 'User',
      verificationToken
    );

    // Return appropriate response based on email sending success
    if (emailResult.success) {
      return NextResponse.json(
        { 
          message: 'User registered successfully. Please check your email to verify your account.',
          previewUrl: emailResult.messageUrl // Only included in development
        },
        { status: 201 }
      );
    } else {
      // Email failed to send, but user was created
      return NextResponse.json(
        { 
          message: 'User registered successfully, but verification email could not be sent. Please contact support.',
          userId: user.id
        },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'An error occurred during registration' },
      { status: 500 }
    );
  }
} 