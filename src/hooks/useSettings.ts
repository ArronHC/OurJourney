import useSWR from 'swr';
import type { Settings } from '@/types';

const fetcher = async (url: string) => {
  const response = await fetch(url);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || '请求失败');
  }
  return data;
};

export function useSettings() {
  const { data, error, isLoading, mutate } = useSWR<Settings>('/api/settings', fetcher);

  const updateSettings = async (updates: Partial<Settings>) => {
    const response = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || '保存设置失败');
    }
    mutate();
  };

  return { settings: data || {}, error, isLoading, updateSettings };
}
