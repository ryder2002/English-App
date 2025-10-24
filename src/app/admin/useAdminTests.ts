"use client";

import useSWR from 'swr';

const fetcher = async (url: string) => {
  const res = await fetch(url, {
    credentials: 'include'
  });
  if (!res.ok) throw new Error('Error fetching admin tests');
  return res.json();
};

export function useAdminTests() {
  const { data, error, isLoading } = useSWR('/api/admin/tests', fetcher);
  return {
    tests: data,
    isLoading,
    isError: error,
  };
}
