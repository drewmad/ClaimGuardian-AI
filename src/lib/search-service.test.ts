import { globalSearch, SearchResult, SearchResultType, filterPolicies, filterClaims, filterDocuments } from './search-service';
import { prisma } from '@/lib/prisma';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    insurancePolicy: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    claim: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    document: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

describe('Search Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('globalSearch', () => {
    it('should return empty results for empty search query', async () => {
      const result = await globalSearch({
        query: '',
        userId: 'test-user',
      });

      expect(result).toEqual({ results: [], total: 0 });
      expect(prisma.insurancePolicy.findMany).not.toHaveBeenCalled();
      expect(prisma.claim.findMany).not.toHaveBeenCalled();
      expect(prisma.document.findMany).not.toHaveBeenCalled();
    });

    it('should search policies, claims, and documents by default', async () => {
      // Mock policy data
      const mockPolicies = [
        {
          id: 'policy-1',
          policyNumber: 'POL-001',
          description: 'Home Insurance',
          provider: 'Insurance Co',
          insuranceType: 'HOME',
          updatedAt: new Date('2023-01-01'),
        },
      ];
      
      // Mock claim data
      const mockClaims = [
        {
          id: 'claim-1',
          claimNumber: 'CLM-001',
          description: 'Water damage claim',
          status: 'APPROVED',
          updatedAt: new Date('2023-01-02'),
          policy: { policyNumber: 'POL-001' },
        },
      ];
      
      // Mock document data
      const mockDocuments = [
        {
          id: 'doc-1',
          fileName: 'water-damage.jpg',
          description: 'Photo of water damage',
          documentType: 'PHOTO',
          fileSize: 1024,
          updatedAt: new Date('2023-01-03'),
        },
      ];

      // Set up the mock returns
      (prisma.insurancePolicy.findMany as jest.Mock).mockResolvedValue(mockPolicies);
      (prisma.insurancePolicy.count as jest.Mock).mockResolvedValue(1);
      (prisma.claim.findMany as jest.Mock).mockResolvedValue(mockClaims);
      (prisma.claim.count as jest.Mock).mockResolvedValue(1);
      (prisma.document.findMany as jest.Mock).mockResolvedValue(mockDocuments);
      (prisma.document.count as jest.Mock).mockResolvedValue(1);

      const result = await globalSearch({
        query: 'damage',
        userId: 'test-user',
      });

      // Verify the correct calls were made
      expect(prisma.insurancePolicy.findMany).toHaveBeenCalled();
      expect(prisma.claim.findMany).toHaveBeenCalled();
      expect(prisma.document.findMany).toHaveBeenCalled();
      
      // Check that results are combined and sorted correctly
      expect(result.total).toBe(3);
      expect(result.results.length).toBe(3);
      
      // Results should be sorted by date (most recent first)
      expect(result.results[0].id).toBe('doc-1');
      expect(result.results[1].id).toBe('claim-1');
      expect(result.results[2].id).toBe('policy-1');
    });

    it('should filter search by specified types', async () => {
      // Mock only claim data
      const mockClaims = [
        {
          id: 'claim-1',
          claimNumber: 'CLM-001',
          description: 'Water damage claim',
          status: 'APPROVED',
          updatedAt: new Date('2023-01-02'),
          policy: { policyNumber: 'POL-001' },
        },
      ];

      // Set up the mock returns
      (prisma.claim.findMany as jest.Mock).mockResolvedValue(mockClaims);
      (prisma.claim.count as jest.Mock).mockResolvedValue(1);

      const result = await globalSearch({
        query: 'damage',
        userId: 'test-user',
        types: ['claim'],
      });

      // Verify only claim search was called
      expect(prisma.insurancePolicy.findMany).not.toHaveBeenCalled();
      expect(prisma.claim.findMany).toHaveBeenCalled();
      expect(prisma.document.findMany).not.toHaveBeenCalled();
      
      expect(result.total).toBe(1);
      expect(result.results.length).toBe(1);
      expect(result.results[0].type).toBe('claim');
    });
  });

  describe('filterPolicies', () => {
    it('should apply filters correctly', async () => {
      const mockPolicies = [{ id: 'policy-1', policyNumber: 'POL-001' }];
      (prisma.insurancePolicy.findMany as jest.Mock).mockResolvedValue(mockPolicies);
      (prisma.insurancePolicy.count as jest.Mock).mockResolvedValue(1);

      const result = await filterPolicies(
        'test-user',
        {
          insuranceType: ['HOME'],
          provider: ['Insurance Co'],
          isActive: true,
          minAmount: 100000,
          maxAmount: 500000,
        },
        1,
        10
      );

      expect(prisma.insurancePolicy.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'test-user',
            insuranceType: { in: ['HOME'] },
            provider: { in: ['Insurance Co'] },
            isActive: true,
            coverageAmount: { gte: 100000, lte: 500000 },
          }),
        })
      );
      
      expect(result).toEqual({
        policies: mockPolicies,
        total: 1,
      });
    });
  });
}); 