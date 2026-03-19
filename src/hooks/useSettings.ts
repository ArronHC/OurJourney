import useSWR from 'swr';
import type { Settings } from '@/types';

const fetcher = (url: string) => fetch(url).then((response) => response.json());

export function useSettings() {
  const { data, error, isLoading, mutate } = useSWR<Settings>('/api/settings', fetcher);

  const updateSettings = async (updates: Partial<Settings>) => {
    await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    mutate();
  };

  return { settings: data || {}, error, isLoading, updateSettings };
}
