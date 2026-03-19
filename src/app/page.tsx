 'use client';

import AppShell from '@/components/AppShell';
import AuthScreen from '@/components/AuthScreen';
import { useAuth } from '@/hooks/useAuth';

export default function Home() {
  const { auth, isLoading } = useAuth();

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-journal-paper to-journal-bg">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-journal-border border-t-journal-accent" />
          <div className="mt-4 text-sm text-journal-text-secondary">正在打开旅程手帐...</div>
        </div>
      </main>
    );
  }

  if (!auth.authenticated || !auth.user) {
    return <AuthScreen status={auth} />;
  }

  return <AppShell user={auth.user} />;
}
