import React, { useState } from 'react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { toast } from '../../components/ui/Toast';
import { apiRequest, ApiError } from '../../lib/api-client';
import { useAuth } from '../../lib/auth-context';

export const LoginForm: React.FC<{ onForgotPassword: () => void }> = ({ onForgotPassword }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const data = await apiRequest<{ access_token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      await login(data.access_token);
      window.location.href = new URLSearchParams(window.location.search).get('redirect') || '/dashboard';
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
      <div>
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <div className="flex justify-end mt-xs">
          <button
            type="button"
            onClick={onForgotPassword}
            className="text-sm font-semibold text-primary hover:text-primary-hover"
          >
            Forgot password?
          </button>
        </div>
      </div>
      <Button type="submit" variant="primary" size="lg" disabled={isLoading} className="mt-sm">
        {isLoading ? 'Signing in...' : 'Sign in'}
      </Button>
    </form>
  );
};
