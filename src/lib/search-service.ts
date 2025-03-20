import { prisma } from '@/lib/prisma';
import { PrismaClient } from '@prisma/client';

// Extend PrismaClient type to include 'document' property
// This is necessary because TypeScript isn't recognizing the generated types correctly
type ExtendedPrismaClient = PrismaClient & {
  document: any;
};

// Cast prisma to the extended type
const extendedPrisma = prisma as unknown as ExtendedPrismaClient;

export type SearchResultType = 'policy' | 'claim' | 'document';

export interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  description: string;
  date: Date;
  link: string;
}

export interface SearchOptions {
  query: string;
  userId: string;
  types?: SearchResultType[];
  limit?: number;
  page?: number;
}

/**
 * Format bytes to human readable format
 */
function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Perform a global search across policies, claims and documents
 */
export async function globalSearch({
  query,
  userId,
  types = ['policy', 'claim', 'document'],
  limit = 20,
  page = 1
}: SearchOptions): Promise<{ results: SearchResult[]; total: number }> {
  const skip = (page - 1) * limit;
  const searchTerms = query.trim().split(/\s+/).filter(Boolean);
  
  // Return empty results if no search terms provided
  if (searchTerms.length === 0) {
    return { results: [], total: 0 };
  }
  
  // Create search conditions for each term
  const createSearchCondition = (field: string, terms: string[]) => {
    if (terms.length === 1) {
      return { [field]: { contains: terms[0], mode: 'insensitive' as const } };
    }
    
    return {
      OR: terms.map(term => ({ 
        [field]: { contains: term, mode: 'insensitive' as const } 
      }))
    };
  };
  
  // Initialize results array and total count
  let results: SearchResult[] = [];
  let total = 0;
  
  // Search for policies
  if (types.includes('policy')) {
    const policiesPromise = prisma.insurancePolicy.findMany({
      where: {
        userId,
        OR: [
          createSearchCondition('policyNumber', searchTerms),
          createSearchCondition('provider', searchTerms),
          createSearchCondition('description', searchTerms),
        ],
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      skip: types.length === 1 ? skip : 0,
    });
    
    const policiesCountPromise = prisma.insurancePolicy.count({
      where: {
        userId,
        OR: [
          createSearchCondition('policyNumber', searchTerms),
          createSearchCondition('provider', searchTerms),
          createSearchCondition('description', searchTerms),
        ],
      },
    });
    
    const [policies, policiesCount] = await Promise.all([policiesPromise, policiesCountPromise]);
    
    results = [
      ...results,
      ...policies.map(policy => ({
        id: policy.id,
        type: 'policy' as SearchResultType,
        title: `Policy #${policy.policyNumber}`,
        description: policy.description || `${policy.provider} - ${policy.insuranceType}`,
        date: policy.updatedAt,
        link: `/policies/${policy.id}`,
      })),
    ];
    
    total += policiesCount;
  }
  
  // Search for claims
  if (types.includes('claim')) {
    const claimsPromise = prisma.claim.findMany({
      where: {
        userId,
        OR: [
          createSearchCondition('claimNumber', searchTerms),
          createSearchCondition('description', searchTerms),
          ...(searchTerms.some(term => term.match(/approved|rejected|paid|draft|submitted|review|closed/i)) ? [
            { 
              status: { 
                in: searchTerms
                  .filter(term => term.match(/approved|rejected|paid|draft|submitted|review|closed/i))
                  .map(term => {
                    const upperTerm = term.toUpperCase();
                    if (upperTerm.includes('APPROVED')) return 'APPROVED';
                    if (upperTerm.includes('REJECTED')) return 'REJECTED';
                    if (upperTerm.includes('PAID')) return 'PAID';
                    if (upperTerm.includes('DRAFT')) return 'DRAFT';
                    if (upperTerm.includes('SUBMITTED')) return 'SUBMITTED';
                    if (upperTerm.includes('REVIEW')) return 'UNDER_REVIEW';
                    if (upperTerm.includes('CLOSED')) return 'CLOSED';
                    return 'DRAFT';
                  }) 
              }
            }
          ] : []),
        ],
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        policy: {
          select: {
            policyNumber: true,
          },
        },
      },
      take: limit,
      skip: types.length === 1 ? skip : 0,
    });
    
    const claimsCountPromise = prisma.claim.count({
      where: {
        userId,
        OR: [
          createSearchCondition('claimNumber', searchTerms),
          createSearchCondition('description', searchTerms),
          ...(searchTerms.some(term => term.match(/approved|rejected|paid|draft|submitted|review|closed/i)) ? [
            { 
              status: { 
                in: searchTerms
                  .filter(term => term.match(/approved|rejected|paid|draft|submitted|review|closed/i))
                  .map(term => {
                    const upperTerm = term.toUpperCase();
                    if (upperTerm.includes('APPROVED')) return 'APPROVED';
                    if (upperTerm.includes('REJECTED')) return 'REJECTED';
                    if (upperTerm.includes('PAID')) return 'PAID';
                    if (upperTerm.includes('DRAFT')) return 'DRAFT';
                    if (upperTerm.includes('SUBMITTED')) return 'SUBMITTED';
                    if (upperTerm.includes('REVIEW')) return 'UNDER_REVIEW';
                    if (upperTerm.includes('CLOSED')) return 'CLOSED';
                    return 'DRAFT';
                  }) 
              }
            }
          ] : []),
        ],
      },
    });
    
    const [claims, claimsCount] = await Promise.all([claimsPromise, claimsCountPromise]);
    
    results = [
      ...results,
      ...claims.map(claim => ({
        id: claim.id,
        type: 'claim' as SearchResultType,
        title: `Claim #${claim.claimNumber}`,
        description: `${claim.description.slice(0, 100)}${claim.description.length > 100 ? '...' : ''} - ${claim.status}`,
        date: claim.updatedAt,
        link: `/claims/${claim.id}`,
      })),
    ];
    
    total += claimsCount;
  }
  
  // Search for documents
  if (types.includes('document')) {
    const documentsPromise = extendedPrisma.document.findMany({
      where: {
        userId,
        OR: [
          createSearchCondition('fileName', searchTerms),
          createSearchCondition('description', searchTerms),
          ...(searchTerms.some(term => term.match(/policy|claim|identity|proof|estimate|invoice|receipt|photo/i)) ? [
            { 
              documentType: { 
                in: searchTerms
                  .filter(term => term.match(/policy|claim|identity|proof|estimate|invoice|receipt|photo/i))
                  .map(term => {
                    const upperTerm = term.toUpperCase();
                    if (upperTerm.includes('POLICY')) return 'POLICY';
                    if (upperTerm.includes('CLAIM')) return 'CLAIM';
                    if (upperTerm.includes('IDENTITY')) return 'IDENTITY';
                    if (upperTerm.includes('PROOF')) return 'PROOF_OF_LOSS';
                    if (upperTerm.includes('ESTIMATE')) return 'ESTIMATE';
                    if (upperTerm.includes('INVOICE')) return 'INVOICE';
                    if (upperTerm.includes('RECEIPT')) return 'RECEIPT';
                    if (upperTerm.includes('PHOTO')) return 'PHOTO';
                    return 'OTHER';
                  }) 
              }
            }
          ] : []),
        ],
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      skip: types.length === 1 ? skip : 0,
    });
    
    const documentsCountPromise = extendedPrisma.document.count({
      where: {
        userId,
        OR: [
          createSearchCondition('fileName', searchTerms),
          createSearchCondition('description', searchTerms),
          ...(searchTerms.some(term => term.match(/policy|claim|identity|proof|estimate|invoice|receipt|photo/i)) ? [
            { 
              documentType: { 
                in: searchTerms
                  .filter(term => term.match(/policy|claim|identity|proof|estimate|invoice|receipt|photo/i))
                  .map(term => {
                    const upperTerm = term.toUpperCase();
                    if (upperTerm.includes('POLICY')) return 'POLICY';
                    if (upperTerm.includes('CLAIM')) return 'CLAIM';
                    if (upperTerm.includes('IDENTITY')) return 'IDENTITY';
                    if (upperTerm.includes('PROOF')) return 'PROOF_OF_LOSS';
                    if (upperTerm.includes('ESTIMATE')) return 'ESTIMATE';
                    if (upperTerm.includes('INVOICE')) return 'INVOICE';
                    if (upperTerm.includes('RECEIPT')) return 'RECEIPT';
                    if (upperTerm.includes('PHOTO')) return 'PHOTO';
                    return 'OTHER';
                  }) 
              }
            }
          ] : []),
        ],
      },
    });
    
    const [documents, documentsCount] = await Promise.all([documentsPromise, documentsCountPromise]);
    
    results = [
      ...results,
      ...documents.map((document: any) => ({
        id: document.id,
        type: 'document' as SearchResultType,
        title: document.fileName,
        description: document.description || `${document.documentType} - ${formatBytes(document.fileSize)}`,
        date: document.updatedAt,
        link: `/documents/${document.id}`,
      })),
    ];
    
    total += documentsCount;
  }
  
  // Sort results by date (most recent first)
  results.sort((a, b) => b.date.getTime() - a.date.getTime());
  
  // Apply pagination to combined results if searching across multiple types
  if (types.length > 1) {
    results = results.slice(skip, skip + limit);
  }
  
  return { results, total };
}

/**
 * Filter policies based on various criteria
 */
export interface PolicyFilters {
  insuranceType?: string[];
  provider?: string[];
  isActive?: boolean;
  minAmount?: number;
  maxAmount?: number;
  startAfter?: Date;
  endBefore?: Date;
}

export async function filterPolicies(
  userId: string,
  filters: PolicyFilters,
  page = 1,
  pageSize = 10
): Promise<{ policies: any[]; total: number }> {
  const where: any = { userId };
  
  // Apply filters
  if (filters.insuranceType && filters.insuranceType.length > 0) {
    where.insuranceType = { in: filters.insuranceType };
  }
  
  if (filters.provider && filters.provider.length > 0) {
    where.provider = { in: filters.provider };
  }
  
  if (filters.isActive !== undefined) {
    where.isActive = filters.isActive;
  }
  
  // Coverage amount range
  if (filters.minAmount !== undefined || filters.maxAmount !== undefined) {
    where.coverageAmount = {};
    
    if (filters.minAmount !== undefined) {
      where.coverageAmount.gte = filters.minAmount;
    }
    
    if (filters.maxAmount !== undefined) {
      where.coverageAmount.lte = filters.maxAmount;
    }
  }
  
  // Date ranges
  if (filters.startAfter !== undefined) {
    where.startDate = { gte: filters.startAfter };
  }
  
  if (filters.endBefore !== undefined) {
    where.endDate = { lte: filters.endBefore };
  }
  
  // Execute query with pagination
  const skip = (page - 1) * pageSize;
  
  const [policies, total] = await Promise.all([
    prisma.insurancePolicy.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.insurancePolicy.count({ where }),
  ]);
  
  return { policies, total };
}

/**
 * Filter claims based on various criteria
 */
export interface ClaimFilters {
  status?: string[];
  policyId?: string;
  incidentDateFrom?: Date;
  incidentDateTo?: Date;
  minAmount?: number;
  maxAmount?: number;
}

export async function filterClaims(
  userId: string,
  filters: ClaimFilters,
  page = 1,
  pageSize = 10
): Promise<{ claims: any[]; total: number }> {
  const where: any = { userId };
  
  // Apply filters
  if (filters.status && filters.status.length > 0) {
    where.status = { in: filters.status };
  }
  
  if (filters.policyId) {
    where.policyId = filters.policyId;
  }
  
  // Incident date range
  if (filters.incidentDateFrom || filters.incidentDateTo) {
    where.incidentDate = {};
    
    if (filters.incidentDateFrom) {
      where.incidentDate.gte = filters.incidentDateFrom;
    }
    
    if (filters.incidentDateTo) {
      where.incidentDate.lte = filters.incidentDateTo;
    }
  }
  
  // Damage amount range
  if (filters.minAmount !== undefined || filters.maxAmount !== undefined) {
    where.damageAmount = {};
    
    if (filters.minAmount !== undefined) {
      where.damageAmount.gte = filters.minAmount;
    }
    
    if (filters.maxAmount !== undefined) {
      where.damageAmount.lte = filters.maxAmount;
    }
  }
  
  // Execute query with pagination
  const skip = (page - 1) * pageSize;
  
  const [claims, total] = await Promise.all([
    prisma.claim.findMany({
      where,
      include: {
        policy: {
          select: {
            policyNumber: true,
            provider: true,
            insuranceType: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.claim.count({ where }),
  ]);
  
  return { claims, total };
}

/**
 * Filter documents based on various criteria
 */
export interface DocumentFilters {
  documentType?: string[];
  policyId?: string;
  claimId?: string;
  uploadDateFrom?: Date;
  uploadDateTo?: Date;
  isAnalyzed?: boolean;
}

export async function filterDocuments(
  userId: string,
  filters: DocumentFilters,
  page = 1,
  pageSize = 10
): Promise<{ documents: any[]; total: number }> {
  const where: any = { userId };
  
  // Apply filters
  if (filters.documentType && filters.documentType.length > 0) {
    where.documentType = { in: filters.documentType };
  }
  
  if (filters.policyId) {
    where.policyId = filters.policyId;
  }
  
  if (filters.claimId) {
    where.claimId = filters.claimId;
  }
  
  if (filters.isAnalyzed !== undefined) {
    where.isAnalyzed = filters.isAnalyzed;
  }
  
  // Upload date range
  if (filters.uploadDateFrom || filters.uploadDateTo) {
    where.uploadDate = {};
    
    if (filters.uploadDateFrom) {
      where.uploadDate.gte = filters.uploadDateFrom;
    }
    
    if (filters.uploadDateTo) {
      where.uploadDate.lte = filters.uploadDateTo;
    }
  }
  
  // Execute query with pagination
  const skip = (page - 1) * pageSize;
  
  const [documents, total] = await Promise.all([
    extendedPrisma.document.findMany({
      where,
      include: {
        policy: {
          select: {
            policyNumber: true,
          },
        },
        claim: {
          select: {
            claimNumber: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      skip,
      take: pageSize,
    }),
    extendedPrisma.document.count({ where }),
  ]);
  
  return { documents, total };
} 