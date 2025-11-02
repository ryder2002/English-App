"use client";

import useSWR from 'swr';

const fetcher = async (url: string) => {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Error fetching admin stats: ${res.status} ${res.statusText}`);
  }
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
