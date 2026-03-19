import useSWR from 'swr';
import type { Meeting, Stats } from '@/types';

const fetcher = (url: string) => fetch(url).then((response) => response.json());

export function useMeetings() {
  const { data, error, isLoading, mutate } = useSWR<Meeting[]>('/api/meetings', fetcher);
  return { meetings: data || [], error, isLoading, mutate };
}

export function useMeeting(id: number | null) {
  const { data, error, isLoading, mutate } = useSWR<Meeting>(
    id ? `/api/meetings/${id}` : null,
    fetcher
  );
  return { meeting: data, error, isLoading, mutate };
}

export function useStats() {
  const { data, error, isLoading } = useSWR<Stats>('/api/stats', fetcher);
  return { stats: data, error, isLoading };
}
