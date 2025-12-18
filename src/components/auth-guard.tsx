"use client";

import { useAuth } from '@/hooks/use-auth-provider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Skeleton } from './ui/skeleton';

export default function AuthGuard({ children, requiredRole }: { children: React.ReactNode, requiredRole: 'commander' | 'sub-commander' }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    
    if (!user) {
      router.replace('/login');
      return;
    }
    
    if (user.role !== requiredRole) {
      // If roles mismatch, redirect to the correct dashboard or login
      const destination = user.role === 'commander' ? '/komandir' : user.role === 'sub-commander' ? '/sub-komandir' : '/login';
      router.replace(destination);
    }
  }, [user, loading, router, requiredRole]);

  if (loading || !user || user.role !== requiredRole) {
    return (
      <div className="flex h-screen w-full items-center justify-center p-8">
        <div className='w-full max-w-md space-y-4'>
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
