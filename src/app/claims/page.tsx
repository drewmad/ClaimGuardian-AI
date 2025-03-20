import React from 'react';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { ClaimList } from '@/components/claims/ClaimList';
import { Layout } from '@/components/layout/Layout';

export default async function ClaimsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/login');
  }

  // Fetch claims for the authenticated user
  const claims = await prisma.claim.findMany({
    where: { userId: session.user.id },
    include: {
      policy: {
        select: {
          policyNumber: true,
          provider: true,
          insuranceType: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Your Insurance Claims</h1>
        </div>

        <ClaimList claims={claims} showPolicies={true} />
      </div>
    </Layout>
  );
} 