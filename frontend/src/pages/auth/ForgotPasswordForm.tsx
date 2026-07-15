import React, { useState } from 'react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { toast } from '../../components/ui/Toast';
import { apiRequest, ApiError } from '../../lib/api-client';

export const ForgotPasswordForm: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
   
    setSuccess(null);
    setIsLoading(true);

    try {
      const res = await apiRequest<{ message: string }>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email })
      });
      setSuccess(res.message);
toast.success(res.message);
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

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-md">
      <div className="mb-sm">
        <h2 className="text-xl font-bold text-text-primary mb-xs">Reset your password</h2>
        <p className="text-sm text-text-secondary">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>

      

      <Input
        label="Email address"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <Button type="submit" variant="primary" size="lg" disabled={isLoading || !!success} className="mt-sm">
        {isLoading ? 'Sending...' : 'Send reset link'}
      </Button>
      
      <div className="text-center mt-xs">
        <button
          type="button"
          onClick={onBack}
          className="text-sm font-semibold text-text-secondary hover:text-text-primary"
        >
          Back to login
        </button>
      </div>
    </form>
  );
};
