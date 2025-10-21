"use client";

import useSWR from 'swr';

const fetcher = async (url: string) => {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error('Error fetching admin stats');
  return res.json();
};

export function useAdminStats() {
  const { data, error, isLoading } = useSWR('/api/admin/stats', fetcher);
  return {
    stats: data,
    isLoading,
    isError: error,
  };
}
