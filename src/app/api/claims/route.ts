import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// Claim creation/update validation schema
const claimSchema = z.object({
  policyId: z.string().min(1, 'Policy ID is required'),
  claimNumber: z.string().optional(), // Optional, can be auto-generated
  status: z.enum([
    'DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'PAID', 'CLOSED'
  ]).default('DRAFT'),
  incidentDate: z.string().datetime(),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  damageAmount: z.number().positive('Damage amount must be positive').optional(),
  approvedAmount: z.number().positive('Approved amount must be positive').optional(),
  rejectionReason: z.string().optional(),
});

// Function to generate a unique claim number
async function generateClaimNumber() {
  const prefix = 'CLM';
  const date = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  const claimNumber = `${prefix}${date}${random}`;
  
  // Check if the claim number already exists
  const existingClaim = await prisma.claim.findUnique({
    where: { claimNumber },
  });

  if (existingClaim) {
    // If the claim number already exists, generate a new one
    return generateClaimNumber();
  }

  return claimNumber;
}

// GET /api/claims - Get all claims for the authenticated user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get all claims for the user with policy information
    const claims = await prisma.claim.findMany({
      where: { userId: session.user.id },
      include: {
        policy: {
          select: {
            policyNumber: true,
            provider: true,
            insuranceType: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(claims);
  } catch (error) {
    console.error('Error fetching claims:', error);
    return NextResponse.json(
      { message: 'Failed to fetch claims' },
      { status: 500 }
    );
  }
}

// POST /api/claims - Create a new claim
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validate request body
    const validatedData = claimSchema.parse(body);

    // Check if the policy exists and belongs to the user
    const policy = await prisma.insurancePolicy.findFirst({
      where: {
        id: validatedData.policyId,
        userId: session.user.id,
      },
    });

    if (!policy) {
      return NextResponse.json(
        { message: 'Policy not found or does not belong to the user' },
        { status: 404 }
      );
    }

    // Generate a claim number if not provided
    const claimNumber = validatedData.claimNumber || await generateClaimNumber();

    // Create new claim
    const claim = await prisma.claim.create({
      data: {
        ...validatedData,
        claimNumber,
        userId: session.user.id,
        reportDate: new Date(),
      },
      include: {
        policy: {
          select: {
            policyNumber: true,
            provider: true,
            insuranceType: true,
          },
        },
      },
    });

    return NextResponse.json(
      { 
        message: 'Claim created successfully',
        claim
      },
      { status: 201 }
    );
  } catch (error) {
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.errors[0].message },
        { status: 400 }
      );
    }
    
    // Handle other errors
    console.error('Claim creation error:', error);
    return NextResponse.json(
      { message: 'Failed to create claim' },
      { status: 500 }
    );
  }
} 