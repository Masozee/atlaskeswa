import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import {
  toPublication,
  type Block,
  type PublicationRecord,
  type PublicationStatus,
  type PublicationTypeCode,
} from '@/lib/publications';

const KEY = ['publications'] as const;

/** Published publications for the public site (landing teaser). */
export function usePublicPublications() {
  return useQuery({
    queryKey: [...KEY, 'public'],
    queryFn: async () => (await apiClient.get<PublicationRecord[]>('/publications/')).map(toPublication),
    staleTime: 5 * 60 * 1000,
  });
}

/** CMS list: admins get drafts too. */
export function usePublications(params?: { search?: string; status?: string; type?: string }) {
  return useQuery({
    queryKey: [...KEY, 'list', params],
    queryFn: () => apiClient.get<PublicationRecord[]>('/publications/', params),
  });
}

export function usePublication(slug: string | undefined) {
  return useQuery({
    queryKey: [...KEY, 'detail', slug],
    queryFn: () => apiClient.get<PublicationRecord>(`/publications/${slug}/`),
    enabled: !!slug,
  });
}

export interface PublicationInput {
  slug: string;
  type: PublicationTypeCode;
  status: PublicationStatus;
  date: string;
  title: string;
  excerpt: string;
  author: string;
  period: string;
  cover_src: string;
  cover_alt: string;
  cover_credit: string;
  file_href: string;
  file_label: string;
  file_size: string;
  external_url: string;
  body: Block[];
}

export function useSavePublication(slug?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: PublicationInput) =>
      slug
        ? apiClient.patch<PublicationRecord>(`/publications/${slug}/`, data)
        : apiClient.post<PublicationRecord>('/publications/', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeletePublication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (slug: string) => apiClient.delete(`/publications/${slug}/`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}

export interface UploadedAsset {
  path: string;
  url: string;
  size: string;
  name: string;
}

/** Upload an image or document to the media store. */
export async function uploadPublicationAsset(file: File): Promise<UploadedAsset> {
  const form = new FormData();
  form.append('file', file);
  const res = await apiClient.fetchRaw('/publications/upload/', { method: 'POST', body: form });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || 'Gagal mengunggah berkas.');
  return data as UploadedAsset;
}
