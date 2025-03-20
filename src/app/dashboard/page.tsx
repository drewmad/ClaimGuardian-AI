import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/shared/Button';
import { Layout } from '@/components/layout/Layout';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/login');
  }

  // Fetch summary data for the user
  const [policies, claims, policyCount, claimCount] = await Promise.all([
    // Get recent policies
    prisma.insurancePolicy.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 3,
    }),
    // Get recent claims
    prisma.claim.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 3,
      include: {
        policy: {
          select: { policyNumber: true, provider: true },
        },
      },
    }),
    // Get total count of policies
    prisma.insurancePolicy.count({
      where: { userId: session.user.id },
    }),
    // Get total count of claims
    prisma.claim.count({
      where: { userId: session.user.id },
    }),
  ]);

  // Calculate total coverage amount
  const totalCoverage = policies.reduce((sum, policy) => sum + Number(policy.coverageAmount), 0);

  // Get counts of active/inactive policies
  const activePolicies = policies.filter(p => p.isActive && new Date() <= new Date(p.endDate)).length;
  const inactivePolicies = policyCount - activePolicies;

  // Get counts of claims by status
  const activeClaimCount = await prisma.claim.count({
    where: { 
      userId: session.user.id, 
      status: { in: ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW'] } 
    },
  });

  const approvedClaimCount = await prisma.claim.count({
    where: { 
      userId: session.user.id, 
      status: { in: ['APPROVED', 'PAID'] } 
    },
  });

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-semibold mb-6">Dashboard</h1>

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 gap-6 mb-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-gray-500 text-sm mb-1">Total Policies</div>
            <div className="text-3xl font-semibold">{policyCount}</div>
            <div className="text-sm mt-2">
              <span className="text-green-500">{activePolicies} active</span>
              {inactivePolicies > 0 && (
                <span className="text-gray-500 ml-2">{inactivePolicies} inactive</span>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-gray-500 text-sm mb-1">Total Claims</div>
            <div className="text-3xl font-semibold">{claimCount}</div>
            <div className="text-sm mt-2">
              <span className="text-blue-500">{activeClaimCount} active</span>
              {approvedClaimCount > 0 && (
                <span className="text-green-500 ml-2">{approvedClaimCount} approved</span>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-gray-500 text-sm mb-1">Total Coverage</div>
            <div className="text-3xl font-semibold">{formatCurrency(totalCoverage)}</div>
            <div className="text-sm mt-2 text-gray-500">
              Across {policyCount} policies
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-gray-500 text-sm mb-1">Quick Actions</div>
            <div className="space-y-2 mt-2">
              <Link href="/policies/new">
                <Button variant="outline" className="w-full justify-center">New Policy</Button>
              </Link>
              <Link href="/claims/new">
                <Button className="w-full justify-center">File Claim</Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Policies */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-medium">Recent Policies</h2>
            <Link href="/policies">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </div>

          {policies.length > 0 ? (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Policy #</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coverage</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {policies.map(policy => (
                    <tr key={policy.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link href={`/policies/${policy.id}`} className="text-primary hover:underline">
                          {policy.policyNumber}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{policy.provider}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {policy.insuranceType.charAt(0) + policy.insuranceType.slice(1).toLowerCase()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{formatCurrency(Number(policy.coverageAmount))}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          policy.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {policy.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <p className="text-gray-500 mb-4">You don't have any policies yet.</p>
              <Link href="/policies/new">
                <Button>Add Your First Policy</Button>
              </Link>
            </div>
          )}
        </div>

        {/* Recent Claims */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-medium">Recent Claims</h2>
            <Link href="/claims">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </div>

          {claims.length > 0 ? (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Claim #</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Policy</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Incident Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {claims.map(claim => {
                    // Format status for display
                    const formattedStatus = claim.status
                      .split('_')
                      .map(word => word.charAt(0) + word.slice(1).toLowerCase())
                      .join(' ');

                    // Choose status color based on claim status
                    const statusColor = {
                      'DRAFT': 'bg-gray-100 text-gray-800',
                      'SUBMITTED': 'bg-blue-100 text-blue-800',
                      'UNDER_REVIEW': 'bg-yellow-100 text-yellow-800',
                      'APPROVED': 'bg-green-100 text-green-800',
                      'REJECTED': 'bg-red-100 text-red-800',
                      'PAID': 'bg-emerald-100 text-emerald-800',
                      'CLOSED': 'bg-purple-100 text-purple-800',
                    }[claim.status] || 'bg-gray-100 text-gray-800';

                    return (
                      <tr key={claim.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link href={`/claims/${claim.id}`} className="text-primary hover:underline">
                            {claim.claimNumber}
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {claim.policy?.policyNumber} ({claim.policy?.provider})
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                            {formattedStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {new Date(claim.incidentDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {claim.damageAmount ? formatCurrency(Number(claim.damageAmount)) : 'N/A'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <p className="text-gray-500 mb-4">You don't have any claims yet.</p>
              <Link href="/claims/new">
                <Button>File Your First Claim</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
} 