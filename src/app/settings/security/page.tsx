'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ChangePasswordForm from '@/components/auth/ChangePasswordForm';
import MfaSetupForm from '@/components/auth/MfaSetupForm';
import SessionsList from '@/components/auth/SessionsList';

export default function SecuritySettingsPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState('password');

  if (!session || !session.user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Not Authenticated</h2>
          <p className="text-gray-600">Please log in to access security settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Security Settings</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="password">Password</TabsTrigger>
          <TabsTrigger value="two-factor">Two-Factor Authentication</TabsTrigger>
          <TabsTrigger value="sessions">Active Sessions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="password" className="mt-6">
          <div className="max-w-md mx-auto">
            <ChangePasswordForm />
          </div>
        </TabsContent>
        
        <TabsContent value="two-factor" className="mt-6">
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Two-Factor Authentication (2FA)</h2>
              <p className="text-gray-600 mb-6">
                Two-factor authentication adds an extra layer of security to your account by requiring 
                an additional verification code when you sign in.
              </p>
              
              <MfaSetupForm />
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="sessions" className="mt-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Manage Your Active Sessions</h2>
            <p className="text-gray-600 mb-6">
              You can view and manage all devices where you're currently logged in. If you see any unfamiliar 
              devices, you should sign them out and change your password immediately.
            </p>
            
            <SessionsList userId={session.user.id} />
          </div>
        </TabsContent>
      </Tabs>
      
      <div className="mt-8 bg-gray-50 p-6 rounded-lg border border-gray-200">
        <h2 className="text-xl font-semibold mb-4">Account Security Recommendations</h2>
        <ul className="space-y-3">
          <li className="flex items-start">
            <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Use a strong, unique password that you don't use on other sites.</span>
          </li>
          <li className="flex items-start">
            <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Enable two-factor authentication for an additional layer of security.</span>
          </li>
          <li className="flex items-start">
            <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Regularly review your active sessions and sign out from unused devices.</span>
          </li>
          <li className="flex items-start">
            <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Keep your email address up to date to receive security notifications.</span>
          </li>
        </ul>
      </div>
    </div>
  );
} 