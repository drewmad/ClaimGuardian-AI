import React from 'react';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { ClaimForm } from '@/components/claims/ClaimForm';
import { Layout } from '@/components/layout/Layout';

export default async function NewClaimPage({
  searchParams,
}: {
  searchParams?: { policyId?: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/login');
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

  // If no policies found, redirect to policies page
  if (policies.length === 0) {
    redirect('/policies/new?redirectTo=claims/new');
  }

  // Get the selected policy from the query params
  const selectedPolicyId = searchParams?.policyId;

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-semibold mb-6">File a New Claim</h1>
        <div className="bg-white shadow rounded-lg p-6">
          <ClaimForm 
            policies={policies}
            selectedPolicyId={selectedPolicyId}
          />
        </div>
      </div>
    </Layout>
  );
} 