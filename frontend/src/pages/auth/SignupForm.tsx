import React, { useState } from 'react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { toast } from '../../components/ui/Toast';
import { Checkbox } from '../../components/ui/Checkbox';
import { apiRequest, ApiError } from '../../lib/api-client';
import { useAuth } from '../../lib/auth-context';

export const SignupForm: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [terms, setTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  

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
    if (!terms) {
      toast.error('You must accept the terms of service');
      return;
    }

    setIsLoading(true);
    try {
      const data = await apiRequest<{ access_token: string }>('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      await login(data.access_token);
      window.location.href = '/upload';
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
      <Input
        label="Email address"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <Input
        label="Password"
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
      <div className="pt-xs">
        <Checkbox
          label="I agree to the Terms of Service and Privacy Policy"
          checked={terms}
          onChange={(e) => setTerms(e.target.checked)}
        />
      </div>
      <Button type="submit" variant="primary" size="lg" disabled={isLoading} className="mt-sm">
        {isLoading ? 'Creating account...' : 'Create account'}
      </Button>
    </form>
  );
};
