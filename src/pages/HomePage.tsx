import React from 'react';
import { Dashboard } from '../components/Dashboard/Dashboard';
import type { User } from '../types';

interface HomePageProps {
  user: User | null;
  onAuthSuccess?: () => void;
  onAuthError?: (error: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ user, onAuthSuccess, onAuthError }) => {
  return (
    <Dashboard 
      user={user} 
      onAuthSuccess={onAuthSuccess}
      onAuthError={onAuthError}
    />
  );
};