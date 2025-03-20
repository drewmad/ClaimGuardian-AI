import React, { useState } from 'react';
// Import workaround if React is not available
// import React, { useState } from '@/lib/fix-react';
import { Button } from '../shared/Button';
import { Input } from '../shared/Input';
import { formatDateForInput } from '@/lib/utils';

// Define claim statuses based on Prisma schema
const claimStatuses = [
  'DRAFT',
  'SUBMITTED',
  'UNDER_REVIEW',
  'APPROVED',
  'REJECTED',
  'PAID',
  'CLOSED',
];

// Claim interface matching our Prisma schema
interface Claim {
  id?: string;
  claimNumber: string;
  policyId: string;
  status: string;
  incidentDate: string;
  description: string;
  damageAmount?: number;
  approvedAmount?: number;
  rejectionReason?: string;
}

interface Policy {
  id: string;
  policyNumber: string;
  provider: string;
  insuranceType: string;
}

interface ClaimFormProps {
  initialData?: Claim;
  policies?: Policy[];
  selectedPolicyId?: string;
  isEditing?: boolean;
}

export function ClaimForm({ 
  initialData, 
  policies = [], 
  selectedPolicyId,
  isEditing = false 
}: ClaimFormProps) {
  // Get today's date for default values
  const today = formatDateForInput(new Date());

  // Form state
  const [policyId, setPolicyId] = useState(initialData?.policyId || selectedPolicyId || '');
  const [claimNumber, setClaimNumber] = useState(initialData?.claimNumber || '');
  const [status, setStatus] = useState(initialData?.status || 'DRAFT');
  const [incidentDate, setIncidentDate] = useState(
    initialData?.incidentDate 
      ? formatDateForInput(initialData.incidentDate) 
      : today
  );
  const [description, setDescription] = useState(initialData?.description || '');
  const [damageAmount, setDamageAmount] = useState(
    initialData?.damageAmount ? initialData.damageAmount.toString() : ''
  );
  const [approvedAmount, setApprovedAmount] = useState(
    initialData?.approvedAmount ? initialData.approvedAmount.toString() : ''
  );
  const [rejectionReason, setRejectionReason] = useState(initialData?.rejectionReason || '');

  // States for form submission
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // Perform validations
      if (!policyId) {
        setError('Please select a policy');
        setIsLoading(false);
        return;
      }

      // Prepare data for submission
      const data: any = {
        policyId,
        status,
        incidentDate: new Date(incidentDate).toISOString(),
        description,
      };

      // Add optional fields if they have values
      if (claimNumber && !isEditing) {
        data.claimNumber = claimNumber;
      }

      if (damageAmount) {
        data.damageAmount = parseFloat(damageAmount);
      }

      if (status === 'APPROVED' && approvedAmount) {
        data.approvedAmount = parseFloat(approvedAmount);
      }

      if (status === 'REJECTED' && rejectionReason) {
        data.rejectionReason = rejectionReason;
      }

      // Determine API endpoint and method
      const url = isEditing ? `/api/claims/${initialData?.id}` : '/api/claims';
      const method = isEditing ? 'PUT' : 'POST';

      // Submit form data
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
        setError(responseData.message || 'Failed to save claim. Please try again.');
        setIsLoading(false);
        return;
      }

      setSuccess(isEditing ? 'Claim updated successfully' : 'Claim created successfully');
      setIsLoading(false);

      // If successful, reset form for new claim creation or redirect
      if (!isEditing) {
        setClaimNumber('');
        setDescription('');
        setDamageAmount('');
        setApprovedAmount('');
        setRejectionReason('');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label htmlFor="policyId" className="block text-sm font-medium text-gray-700">
            Insurance Policy
          </label>
          <select
            id="policyId"
            name="policyId"
            value={policyId}
            onChange={(e) => setPolicyId(e.target.value)}
            disabled={isEditing || policies.length === 0}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            required
          >
            <option value="">Select a policy</option>
            {policies.map((policy) => (
              <option key={policy.id} value={policy.id}>
                {policy.policyNumber} - {policy.provider} ({policy.insuranceType})
              </option>
            ))}
          </select>
          {policies.length === 0 && (
            <p className="mt-1 text-sm text-red-500">
              No policies available. Please create a policy first.
            </p>
          )}
        </div>

        <div>
          <label htmlFor="claimNumber" className="block text-sm font-medium text-gray-700">
            Claim Number
          </label>
          <Input
            id="claimNumber"
            name="claimNumber"
            type="text"
            value={claimNumber}
            onChange={(e) => setClaimNumber(e.target.value)}
            disabled={isEditing} // Claim number should not be editable once created
            placeholder={isEditing ? '' : 'Auto-generated if left blank'}
            className="mt-1 block w-full"
          />
        </div>
      </div>

      <div>
        <label htmlFor="incidentDate" className="block text-sm font-medium text-gray-700">
          Incident Date
        </label>
        <Input
          id="incidentDate"
          name="incidentDate"
          type="date"
          required
          max={today}
          value={incidentDate}
          onChange={(e) => setIncidentDate(e.target.value)}
          className="mt-1 block w-full"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe what happened..."
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="damageAmount" className="block text-sm font-medium text-gray-700">
          Estimated Damage Amount ($)
        </label>
        <Input
          id="damageAmount"
          name="damageAmount"
          type="number"
          step="0.01"
          min="0"
          value={damageAmount}
          onChange={(e) => setDamageAmount(e.target.value)}
          className="mt-1 block w-full"
        />
      </div>

      {isEditing && (
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">
            Status
          </label>
          <select
            id="status"
            name="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
          >
            {claimStatuses.map((claimStatus) => (
              <option key={claimStatus} value={claimStatus}>
                {claimStatus.charAt(0) + claimStatus.slice(1).toLowerCase().replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>
      )}

      {isEditing && status === 'APPROVED' && (
        <div>
          <label htmlFor="approvedAmount" className="block text-sm font-medium text-gray-700">
            Approved Amount ($)
          </label>
          <Input
            id="approvedAmount"
            name="approvedAmount"
            type="number"
            step="0.01"
            min="0"
            value={approvedAmount}
            onChange={(e) => setApprovedAmount(e.target.value)}
            className="mt-1 block w-full"
          />
        </div>
      )}

      {isEditing && status === 'REJECTED' && (
        <div>
          <label htmlFor="rejectionReason" className="block text-sm font-medium text-gray-700">
            Rejection Reason
          </label>
          <textarea
            id="rejectionReason"
            name="rejectionReason"
            rows={3}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
          />
        </div>
      )}

      {error && <div className="text-red-500 text-sm">{error}</div>}
      {success && <div className="text-green-500 text-sm">{success}</div>}

      <div className="flex justify-end">
        <Button
          type="submit"
          isLoading={isLoading}
        >
          {isEditing ? 'Update Claim' : 'Submit Claim'}
        </Button>
      </div>
    </form>
  );
} 