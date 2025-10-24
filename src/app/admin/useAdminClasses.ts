"use client";

import useSWR from 'swr';

const fetcher = async (url: string) => {
  const res = await fetch(url, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Error fetching admin classes');
  return res.json();
};

export function useAdminClasses() {
  const { data, error, isLoading } = useSWR('/api/admin/classes', fetcher);
  return {
    classes: data,
    isLoading,
    isError: error,
  };
}
