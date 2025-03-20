import React from 'react';
import { getServerSession } from 'next-auth';
import { redirect, notFound } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { ClaimForm } from '@/components/claims/ClaimForm';
import { Layout } from '@/components/layout/Layout';
import { formatDateForInput } from '@/lib/utils';

export default async function EditClaimPage({
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
  });

  if (!claim) {
    notFound();
  }

  // Don't allow editing claims that are not in DRAFT or SUBMITTED status
  if (claim.status !== 'DRAFT' && claim.status !== 'SUBMITTED') {
    redirect(`/claims/${claim.id}`);
  }

  // Fetch policies for the user (for the form dropdown)
  const policies = await prisma.insurancePolicy.findMany({
    where: { userId: session.user.id },
    select: {
      id: true,
      policyNumber: true,
      provider: true,
      insuranceType: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  // Format dates for the form
  const claimData = {
    id: claim.id,
    claimNumber: claim.claimNumber,
    policyId: claim.policyId,
    status: claim.status,
    incidentDate: formatDateForInput(claim.incidentDate),
    description: claim.description,
    damageAmount: claim.damageAmount ? Number(claim.damageAmount) : undefined,
    approvedAmount: claim.approvedAmount ? Number(claim.approvedAmount) : undefined,
    rejectionReason: claim.rejectionReason || '',
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-semibold mb-6">Edit Claim</h1>
        <div className="bg-white shadow rounded-lg p-6">
          <ClaimForm 
            initialData={claimData} 
            policies={policies}
            isEditing={true} 
          />
        </div>
      </div>
    </Layout>
  );
} 