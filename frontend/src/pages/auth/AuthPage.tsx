import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AuthLayout } from './AuthLayout';
import { LoginForm } from './LoginForm';
import { SignupForm } from './SignupForm';
import { ForgotPasswordForm } from './ForgotPasswordForm';
import { Tabs } from '../../components/ui/Tabs';
import { useAuth } from '../../lib/auth-context';

export const AuthPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const currentTab = searchParams.get('tab') || 'login';
  const [showForgot, setShowForgot] = useState(false);

  useEffect(() => {
    if (user) {
      const redirect = searchParams.get('redirect') || '/dashboard';
      navigate(redirect, { replace: true });
    }
  }, [user, navigate, searchParams]);

  if (showForgot) {
    return (
      <AuthLayout>
        <ForgotPasswordForm onBack={() => setShowForgot(false)} />
      </AuthLayout>
    );
  }

  const tabs = [
    { id: 'login', label: 'Login' },
    { id: 'signup', label: 'Sign Up' }
  ];

  return (
    <AuthLayout>
      <Tabs
        tabs={tabs}
        activeTab={currentTab}
        onChange={(tabId) => {
          setSearchParams({ tab: tabId, ...(searchParams.get('redirect') ? { redirect: searchParams.get('redirect')! } : {}) });
        }}
        className="mb-lg"
      />
      {currentTab === 'login' ? (
        <LoginForm onForgotPassword={() => setShowForgot(true)} />
      ) : (
        <SignupForm />
      )}
    </AuthLayout>
  );
};
