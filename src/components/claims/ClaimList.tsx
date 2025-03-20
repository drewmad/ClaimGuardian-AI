import React, { useState } from 'react';
// Import workaround if React is not available
// import React, { useState } from '@/lib/fix-react';
import Link from 'next/link';
import { ClaimCard } from './ClaimCard';
import { Button } from '../shared/Button';
import { Loading } from '../shared/Loading';

// Claim interface matching our Prisma schema
interface Claim {
  id: string;
  claimNumber: string;
  policyId: string;
  status: string;
  incidentDate: string | Date;
  reportDate: string | Date;
  description: string;
  damageAmount?: number | null;
  approvedAmount?: number | null;
  rejectionReason?: string | null;
  policy?: {
    policyNumber: string;
    provider: string;
    insuranceType: string;
  };
}

interface ClaimListProps {
  claims: Claim[];
  isLoading?: boolean;
  showPolicies?: boolean;
}

export function ClaimList({ claims, isLoading = false, showPolicies = false }: ClaimListProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <Loading />
      </div>
    );
  }

  if (claims.length === 0) {
    return (
      <div className="text-center py-10">
        <h3 className="text-lg font-medium text-gray-900 mb-2">No claims found</h3>
        <p className="text-gray-500 mb-6">You don't have any insurance claims yet.</p>
        <Link href="/claims/new">
          <Button>File a New Claim</Button>
        </Link>
      </div>
    );
  }

  // Define status groups for filtering
  const statusGroups = {
    all: ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'PAID', 'CLOSED'],
    active: ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW'],
    approved: ['APPROVED', 'PAID'],
    completed: ['APPROVED', 'REJECTED', 'PAID', 'CLOSED'],
  };

  // Filter claims based on selected filter
  const filteredClaims = statusFilter === 'all'
    ? claims
    : claims.filter(claim => statusGroups[statusFilter as keyof typeof statusGroups].includes(claim.status));

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="inline-flex rounded-md shadow-sm">
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium rounded-l-md ${
              statusFilter === 'all'
                ? 'bg-primary text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            } border border-gray-300`}
            onClick={() => setStatusFilter('all')}
          >
            All
          </button>
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium ${
              statusFilter === 'active'
                ? 'bg-primary text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            } border-t border-b border-r border-gray-300`}
            onClick={() => setStatusFilter('active')}
          >
            Active
          </button>
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium ${
              statusFilter === 'approved'
                ? 'bg-primary text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            } border-t border-b border-r border-gray-300`}
            onClick={() => setStatusFilter('approved')}
          >
            Approved
          </button>
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium rounded-r-md ${
              statusFilter === 'completed'
                ? 'bg-primary text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            } border-t border-b border-r border-gray-300`}
            onClick={() => setStatusFilter('completed')}
          >
            Completed
          </button>
        </div>
        
        <Link href="/claims/new">
          <Button>File Claim</Button>
        </Link>
      </div>

      {filteredClaims.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredClaims.map(claim => (
            <ClaimCard key={claim.id} claim={claim} showPolicy={showPolicies} />
          ))}
        </div>
      ) : (
        <div className="text-center py-10">
          <p className="text-gray-500">No {statusFilter} claims found.</p>
        </div>
      )}
    </div>
  );
} 