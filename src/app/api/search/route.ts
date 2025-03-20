import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/nextauth';
import { prisma } from '@/lib/prisma';
import { globalSearch, SearchResultType } from '@/lib/search-service';

/**
 * Global search API endpoint
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
    const query = url.searchParams.get('q') || '';
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    
    // Get types to search (if specified)
    const typesParam = url.searchParams.get('types');
    const types: SearchResultType[] = typesParam 
      ? typesParam.split(',').filter(type => 
          ['policy', 'claim', 'document'].includes(type)
        ) as SearchResultType[]
      : ['policy', 'claim', 'document'];
    
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
    
    // Perform search
    const { results, total } = await globalSearch({
      query,
      userId: user.id,
      types,
      page,
      limit,
    });
    
    return NextResponse.json({
      results,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'An error occurred while searching' },
      { status: 500 }
    );
  }
} 