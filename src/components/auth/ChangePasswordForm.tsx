'use client';

import { useState } from 'react';
import { z } from 'zod';
import PasswordStrengthMeter from './PasswordStrengthMeter';
import { passwordStrengthSchema } from '@/lib/password-policies';

// Validation schema for password change
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, { message: 'Current password is required' }),
  newPassword: passwordStrengthSchema,
  confirmPassword: z.string().min(1, { message: 'Please confirm your new password' }),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "New passwords don't match",
  path: ['confirmPassword'],
}).refine(data => data.currentPassword !== data.newPassword, {
  message: "New password must be different from your current password",
  path: ['newPassword'],
});

export default function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSuccess(false);
    
    try {
      // Validate form
      changePasswordSchema.parse({
        currentPassword,
        newPassword,
        confirmPassword
      });
      
      setIsLoading(true);
      
      // Call API to change password
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setErrors({ 
          api: data.error || 'Failed to change password. Please try again.' 
        });
      } else {
        setSuccess(true);
        // Clear form on success
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Format ZodError into a friendly errors object
        const formattedErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path) {
            formattedErrors[err.path[0]] = err.message;
          }
        });
        setErrors(formattedErrors);
      } else {
        setErrors({ 
          api: 'An unexpected error occurred. Please try again.' 
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Change Password</h2>
      
      {success && (
        <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-md">
          <p className="font-medium">Password changed successfully!</p>
          <p className="text-sm mt-1">
            Your password has been updated. You'll use the new password the next time you log in.
          </p>
        </div>
      )}
      
      {errors.api && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-md">
          {errors.api}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="currentPassword" className="block text-gray-700 mb-2">
            Current Password
          </label>
          <input
            id="currentPassword"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className={`w-full p-2 border rounded ${
              errors.currentPassword ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={isLoading}
          />
          {errors.currentPassword && (
            <p className="mt-1 text-sm text-red-600">{errors.currentPassword}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="newPassword" className="block text-gray-700 mb-2">
            New Password
          </label>
          <input
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className={`w-full p-2 border rounded ${
              errors.newPassword ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={isLoading}
          />
          <PasswordStrengthMeter password={newPassword} />
          {errors.newPassword && (
            <p className="mt-1 text-sm text-red-600">{errors.newPassword}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="confirmPassword" className="block text-gray-700 mb-2">
            Confirm New Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={`w-full p-2 border rounded ${
              errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={isLoading}
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
          )}
        </div>
        
        <button
          type="submit"
          className={`w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition duration-200 ${
            isLoading ? 'opacity-70 cursor-not-allowed' : ''
          }`}
          disabled={isLoading}
        >
          {isLoading ? 'Changing Password...' : 'Change Password'}
        </button>
      </form>
    </div>
  );
} 