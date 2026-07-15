import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AuthLayout } from './AuthLayout';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { toast } from '../../components/ui/Toast';
import { EmptyState } from '../../components/ui/EmptyState';
import { apiRequest, ApiError } from '../../lib/api-client';

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const [success, setSuccess] = useState(false);

  if (!token) {
    return (
      <AuthLayout>
        <EmptyState
          title="Invalid link"
          description="This password reset link is invalid or missing the token."
          actionLabel="Go to login"
          onAction={() => navigate('/auth?tab=login')}
        />
      </AuthLayout>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
   

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);
    try {
      await apiRequest('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, new_password: password })
      });
      toast.success('Password reset successfully');
setSuccess(true);
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <AuthLayout>
        <div className="text-center py-lg">
          <h2 className="text-xl font-bold text-text-primary mb-md">Password reset successfully</h2>
          <Button variant="primary" onClick={() => navigate('/auth?tab=login')}>
            Return to Login
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="mb-sm">
        <h2 className="text-xl font-bold text-text-primary mb-xs">Set new password</h2>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-md">
        
        
        <Input
          label="New Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Input
          label="Confirm Password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        
        <Button type="submit" variant="primary" size="lg" disabled={isLoading} className="mt-sm">
          {isLoading ? 'Resetting...' : 'Reset password'}
        </Button>
      </form>
    </AuthLayout>
  );
};
