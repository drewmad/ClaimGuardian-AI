import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// Claim update validation schema
const claimUpdateSchema = z.object({
  status: z.enum([
    'DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'PAID', 'CLOSED'
  ]),
  incidentDate: z.string().datetime(),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  damageAmount: z.number().positive('Damage amount must be positive').optional(),
  approvedAmount: z.number().positive('Approved amount must be positive').optional(),
  rejectionReason: z.string().optional(),
});

// Helper function to check claim ownership
async function getClaimIfOwned(claimId: string, userId: string) {
  const claim = await prisma.claim.findUnique({
    where: { id: claimId },
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

  if (!claim) {
    return null;
  }

  if (claim.userId !== userId) {
    return null;
  }

  return claim;
}

// GET /api/claims/[id] - Get a specific claim
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const claim = await getClaimIfOwned(params.id, session.user.id);

    if (!claim) {
      return NextResponse.json(
        { message: 'Claim not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(claim);
  } catch (error) {
    console.error('Error fetching claim:', error);
    return NextResponse.json(
      { message: 'Failed to fetch claim' },
      { status: 500 }
    );
  }
}

// PUT /api/claims/[id] - Update a specific claim
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const claim = await getClaimIfOwned(params.id, session.user.id);

    if (!claim) {
      return NextResponse.json(
        { message: 'Claim not found' },
        { status: 404 }
      );
    }

    // Only allow updating claims that are in DRAFT or SUBMITTED status
    // unless the status is being changed
    const body = await request.json();
    const validatedData = claimUpdateSchema.parse(body);

    if (
      (claim.status !== 'DRAFT' && claim.status !== 'SUBMITTED') &&
      (validatedData.status === claim.status)
    ) {
      return NextResponse.json(
        { message: 'This claim cannot be modified in its current status' },
        { status: 400 }
      );
    }

    // Update claim
    const updatedClaim = await prisma.claim.update({
      where: { id: params.id },
      data: validatedData,
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

    return NextResponse.json({
      message: 'Claim updated successfully',
      claim: updatedClaim,
    });
  } catch (error) {
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.errors[0].message },
        { status: 400 }
      );
    }
    
    // Handle other errors
    console.error('Claim update error:', error);
    return NextResponse.json(
      { message: 'Failed to update claim' },
      { status: 500 }
    );
  }
}

// DELETE /api/claims/[id] - Delete a specific claim
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const claim = await getClaimIfOwned(params.id, session.user.id);

    if (!claim) {
      return NextResponse.json(
        { message: 'Claim not found' },
        { status: 404 }
      );
    }

    // Only allow deleting claims that are in DRAFT status
    if (claim.status !== 'DRAFT') {
      return NextResponse.json(
        { message: 'Only draft claims can be deleted' },
        { status: 400 }
      );
    }

    // Delete claim
    await prisma.claim.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      message: 'Claim deleted successfully',
    });
  } catch (error) {
    console.error('Claim deletion error:', error);
    return NextResponse.json(
      { message: 'Failed to delete claim' },
      { status: 500 }
    );
  }
} 