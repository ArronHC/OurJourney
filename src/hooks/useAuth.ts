import useSWR from 'swr';
import type { AuthStatus } from '@/types';

const fetcher = async (url: string) => {
  const response = await fetch(url, {
    cache: 'no-store',
    headers: { 'Cache-Control': 'no-cache' },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || '请求失败');
  }
  return data;
};

async function postJson(url: string, body?: Record<string, unknown>) {
  const response = await fetch(url, {
    method: 'POST',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || '请求失败');
  }

  return data;
}

export function useAuth() {
  const { data, error, isLoading, mutate } = useSWR<AuthStatus>('/api/auth/me', fetcher);

  const login = async (payload: { email: string; password: string }) => {
    const result = await postJson('/api/auth/login', payload);
    await mutate();
    return result;
  };

  const register = async (payload: {
    email: string;
    display_name: string;
    password: string;
    invite_code?: string;
  }) => {
    const result = await postJson('/api/auth/register', payload);
    await mutate();
    return result;
  };

  const logout = async () => {
    await postJson('/api/auth/logout');
    await mutate();
  };

  return {
    auth: data || {
      authenticated: false,
      user: null,
      user_count: 0,
      can_register_without_invite: false,
    },
    error,
    isLoading,
    mutate,
    login,
    register,
    logout,
  };
}
