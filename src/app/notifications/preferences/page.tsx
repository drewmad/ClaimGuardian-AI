'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface NotificationPreference {
  id: string;
  userId: string;
  claimStatus: 'IN_APP' | 'EMAIL' | 'BOTH';
  policyExpiry: 'IN_APP' | 'EMAIL' | 'BOTH';
  documentUpload: 'IN_APP' | 'EMAIL' | 'BOTH';
  paymentReminder: 'IN_APP' | 'EMAIL' | 'BOTH';
  systemAlert: 'IN_APP' | 'EMAIL' | 'BOTH';
  securityAlert: 'IN_APP' | 'EMAIL' | 'BOTH';
}

type NotificationType = 
  'claimStatus' | 
  'policyExpiry' | 
  'documentUpload' | 
  'paymentReminder' | 
  'systemAlert' | 
  'securityAlert';

const NOTIFICATION_LABELS: Record<NotificationType, string> = {
  claimStatus: 'Claim Status Updates',
  policyExpiry: 'Policy Expiration Reminders',
  documentUpload: 'Document Upload Confirmations',
  paymentReminder: 'Payment Reminders',
  systemAlert: 'System Alerts',
  securityAlert: 'Security Alerts',
};

export default function NotificationPreferencesPage() {
  const { data: session, status } = useSession();
  const [preferences, setPreferences] = useState<NotificationPreference | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Fetch notification preferences
  useEffect(() => {
    const fetchPreferences = async () => {
      if (status !== 'authenticated') return;
      
      try {
        setLoading(true);
        const response = await fetch('/api/notifications/preferences');
        
        if (!response.ok) {
          throw new Error('Failed to fetch notification preferences');
        }
        
        const data = await response.json();
        setPreferences(data);
      } catch (err) {
        setError('Failed to load notification preferences');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPreferences();
  }, [status]);
  
  // Handle preference change
  const handlePreferenceChange = (
    type: NotificationType,
    value: 'IN_APP' | 'EMAIL' | 'BOTH'
  ) => {
    if (!preferences) return;
    
    setPreferences({
      ...preferences,
      [type]: value,
    });
  };
  
  // Save preferences
  const handleSave = async () => {
    if (!preferences) return;
    
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);
      
      const response = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          claimStatus: preferences.claimStatus,
          policyExpiry: preferences.policyExpiry,
          documentUpload: preferences.documentUpload,
          paymentReminder: preferences.paymentReminder,
          systemAlert: preferences.systemAlert,
          securityAlert: preferences.securityAlert,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update notification preferences');
      }
      
      setSuccessMessage('Notification preferences saved successfully');
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      setError('Failed to save notification preferences');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };
  
  // If not authenticated, show login message
  if (status === 'unauthenticated') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Not Authenticated</h2>
          <p className="text-gray-600">Please log in to manage your notification preferences.</p>
          <Link 
            href="/auth/login" 
            className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Log in
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Notification Preferences</h1>
        <Link
          href="/notifications"
          className="text-blue-600 hover:text-blue-800"
        >
          Back to Notifications
        </Link>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-600 p-6 rounded-md mb-6">
          {error}
        </div>
      ) : !preferences ? (
        <div className="bg-white p-8 text-center rounded-md shadow">
          <h2 className="text-lg font-semibold">No preferences found</h2>
          <p className="text-gray-500 mt-1">Unable to load your notification preferences.</p>
        </div>
      ) : (
        <>
          {successMessage && (
            <div className="bg-green-50 text-green-600 p-6 rounded-md mb-6">
              {successMessage}
            </div>
          )}
          
          <div className="bg-white rounded-md shadow overflow-hidden">
            <div className="p-6">
              <p className="text-gray-600 mb-6">
                Choose how you want to receive different types of notifications. You can receive them in-app,
                via email, or both.
              </p>
              
              <div className="space-y-6">
                {(Object.keys(NOTIFICATION_LABELS) as NotificationType[]).map((type) => (
                  <div key={type} className="border-b pb-6 last:border-b-0 last:pb-0">
                    <h3 className="text-lg font-semibold mb-2">{NOTIFICATION_LABELS[type]}</h3>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name={type}
                          value="IN_APP"
                          checked={preferences[type] === 'IN_APP'}
                          onChange={() => handlePreferenceChange(type, 'IN_APP')}
                          className="h-4 w-4 text-blue-600"
                        />
                        <span>In-app only</span>
                      </label>
                      
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name={type}
                          value="EMAIL"
                          checked={preferences[type] === 'EMAIL'}
                          onChange={() => handlePreferenceChange(type, 'EMAIL')}
                          className="h-4 w-4 text-blue-600"
                        />
                        <span>Email only</span>
                      </label>
                      
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name={type}
                          value="BOTH"
                          checked={preferences[type] === 'BOTH'}
                          onChange={() => handlePreferenceChange(type, 'BOTH')}
                          className="h-4 w-4 text-blue-600"
                        />
                        <span>Both</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-8">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className={`px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 ${
                    saving ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {saving ? 'Saving...' : 'Save Preferences'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
} 