import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/nextauth';
import { prisma } from '@/lib/prisma';
import { filterPolicies, PolicyFilters } from '@/lib/search-service';

/**
 * Policy filtering API endpoint
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
    
    // Get query parameters
    const url = new URL(request.url);
    
    // Pagination parameters
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10');
    
    // Filter parameters
    const filters: PolicyFilters = {};
    
    // Insurance type filter
    const insuranceType = url.searchParams.get('insuranceType');
    if (insuranceType) {
      filters.insuranceType = insuranceType.split(',');
    }
    
    // Provider filter
    const provider = url.searchParams.get('provider');
    if (provider) {
      filters.provider = provider.split(',');
    }
    
    // Active status filter
    const isActive = url.searchParams.get('isActive');
    if (isActive !== null) {
      filters.isActive = isActive === 'true';
    }
    
    // Coverage amount range
    const minAmount = url.searchParams.get('minAmount');
    if (minAmount !== null) {
      filters.minAmount = parseFloat(minAmount);
    }
    
    const maxAmount = url.searchParams.get('maxAmount');
    if (maxAmount !== null) {
      filters.maxAmount = parseFloat(maxAmount);
    }
    
    // Date ranges
    const startAfter = url.searchParams.get('startAfter');
    if (startAfter) {
      filters.startAfter = new Date(startAfter);
    }
    
    const endBefore = url.searchParams.get('endBefore');
    if (endBefore) {
      filters.endBefore = new Date(endBefore);
    }
    
    // Get user ID from email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Apply filters
    const { policies, total } = await filterPolicies(
      user.id,
      filters,
      page,
      pageSize
    );
    
    // Get unique providers and insurance types for filter options
    const [providers, insuranceTypes] = await Promise.all([
      prisma.insurancePolicy.findMany({
        where: { userId: user.id },
        select: { provider: true },
        distinct: ['provider'],
      }),
      prisma.insurancePolicy.findMany({
        where: { userId: user.id },
        select: { insuranceType: true },
        distinct: ['insuranceType'],
      }),
    ]);
    
    return NextResponse.json({
      policies,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
      filterOptions: {
        providers: providers.map(p => p.provider),
        insuranceTypes: insuranceTypes.map(t => t.insuranceType),
      },
    });
  } catch (error) {
    console.error('Policy filtering error:', error);
    return NextResponse.json(
      { error: 'An error occurred while filtering policies' },
      { status: 500 }
    );
  }
} 