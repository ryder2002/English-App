import useSWR from 'swr';

const fetcher = (url: string) => fetch(url, { credentials: 'include' }).then(res => res.json());

export function useAdminHomework() {
  const { data, error, isLoading, mutate } = useSWR('/api/admin/homework', fetcher);

  return {
    homework: data || [],
    isLoading,
    isError: error,
    mutate,
  };
}

