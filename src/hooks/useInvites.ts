import useSWR from 'swr';
import type { InviteCode } from '@/types';

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

export function useInvites(enabled = true) {
  const { data, error, isLoading, mutate } = useSWR<InviteCode[]>(
    enabled ? '/api/auth/invites' : null,
    fetcher
  );

  const createInvite = async () => {
    const response = await fetch('/api/auth/invites', { method: 'POST', cache: 'no-store' });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || '生成邀请码失败');
    }
    await mutate();
    return data;
  };

  return {
    invites: data || [],
    error,
    isLoading,
    createInvite,
    mutate,
  };
}
