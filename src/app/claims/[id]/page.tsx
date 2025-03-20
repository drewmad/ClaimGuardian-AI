import React from 'react';
import { getServerSession } from 'next-auth';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Button } from '@/components/shared/Button';
import { Layout } from '@/components/layout/Layout';

export default async function ClaimDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/login');
  }

  // Fetch claim details
  const claim = await prisma.claim.findUnique({
    where: { 
      id: params.id,
      userId: session.user.id, // Ensure the claim belongs to the user
    },
    include: {
      policy: true,
    },
  });

  if (!claim) {
    notFound();
  }

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
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Claim Details</h1>
          <div className="flex space-x-3">
            {(claim.status === 'DRAFT' || claim.status === 'SUBMITTED') && (
              <Link href={`/claims/${claim.id}/edit`}>
                <Button variant="outline">Edit Claim</Button>
              </Link>
            )}
            <Link href="/claims">
              <Button variant="secondary">Back to Claims</Button>
            </Link>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-medium text-gray-900">Claim #{claim.claimNumber}</h2>
                <p className="text-sm text-gray-500">Reported on {formatDate(claim.reportDate)}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColor}`}>
                {formatStatus(claim.status)}
              </span>
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Claim Information</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Incident Date</p>
                  <p className="text-base">{formatDate(claim.incidentDate)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Description</p>
                  <p className="text-base whitespace-pre-line">{claim.description}</p>
                </div>
                {claim.damageAmount && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Estimated Damage</p>
                    <p className="text-base">{formatCurrency(Number(claim.damageAmount))}</p>
                  </div>
                )}
                {claim.approvedAmount && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Approved Amount</p>
                    <p className="text-base">{formatCurrency(Number(claim.approvedAmount))}</p>
                  </div>
                )}
                {claim.rejectionReason && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Rejection Reason</p>
                    <p className="text-base">{claim.rejectionReason}</p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-3">Policy Information</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Policy Number</p>
                  <Link href={`/policies/${claim.policyId}`} className="text-primary hover:underline">
                    {claim.policy.policyNumber}
                  </Link>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Provider</p>
                  <p className="text-base">{claim.policy.provider}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Insurance Type</p>
                  <p className="text-base">
                    {claim.policy.insuranceType.charAt(0) + claim.policy.insuranceType.slice(1).toLowerCase()}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Coverage Amount</p>
                  <p className="text-base">{formatCurrency(Number(claim.policy.coverageAmount))}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {claim.status === 'DRAFT' && (
          <div className="flex justify-between">
            <Button
              variant="destructive"
              onClick={async () => {
                await fetch(`/api/claims/${claim.id}`, {
                  method: 'DELETE',
                });
                window.location.href = '/claims';
              }}
            >
              Delete Claim
            </Button>
            <Button
              onClick={async () => {
                await fetch(`/api/claims/${claim.id}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    ...claim,
                    status: 'SUBMITTED',
                  }),
                });
                window.location.reload();
              }}
            >
              Submit Claim
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
} 