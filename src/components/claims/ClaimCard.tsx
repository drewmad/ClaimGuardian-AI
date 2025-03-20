import React from 'react';
// Import workaround if React is not available
// import React from '@/lib/fix-react';
import Link from 'next/link';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Button } from '../shared/Button';

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

interface ClaimCardProps {
  claim: Claim;
  showPolicy?: boolean;
}

export function ClaimCard({ claim, showPolicy = false }: ClaimCardProps) {
  // Format status for display
  const formatStatus = (status: string) => {
    return status
      .split('_')
      .map(word => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  };

  const statusColor = {
    DRAFT: 'bg-gray-100 text-gray-800',
    SUBMITTED: 'bg-blue-100 text-blue-800',
    UNDER_REVIEW: 'bg-yellow-100 text-yellow-800',
    APPROVED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
    PAID: 'bg-emerald-100 text-emerald-800',
    CLOSED: 'bg-purple-100 text-purple-800',
  }[claim.status] || 'bg-gray-100 text-gray-800';

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transition hover:shadow-lg">
      <div className="p-5">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-semibold text-lg text-gray-900">Claim #{claim.claimNumber}</h3>
            {showPolicy && claim.policy && (
              <p className="text-sm text-gray-600">
                Policy: {claim.policy.policyNumber} - {claim.policy.provider}
              </p>
            )}
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}>
            {formatStatus(claim.status)}
          </span>
        </div>

        <div className="space-y-2 mb-4">
          <div>
            <p className="text-sm text-gray-500">Incident Date</p>
            <p className="text-sm font-medium">{formatDate(claim.incidentDate)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Description</p>
            <p className="text-sm line-clamp-2">{claim.description}</p>
          </div>
          {claim.damageAmount && (
            <div>
              <p className="text-sm text-gray-500">Estimated Damage</p>
              <p className="text-sm font-medium">{formatCurrency(claim.damageAmount)}</p>
            </div>
          )}
          {claim.approvedAmount && (
            <div>
              <p className="text-sm text-gray-500">Approved Amount</p>
              <p className="text-sm font-medium">{formatCurrency(claim.approvedAmount)}</p>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center">
          <Link href={`/claims/${claim.id}`}>
            <Button variant="outline" size="sm">
              View Details
            </Button>
          </Link>
          {(claim.status === 'DRAFT' || claim.status === 'SUBMITTED') && (
            <Link href={`/claims/${claim.id}/edit`}>
              <Button size="sm">
                Edit Claim
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
} 