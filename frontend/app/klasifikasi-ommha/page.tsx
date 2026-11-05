import type { Metadata } from 'next';
import { ArticlePage } from '@/components/article-page';
import { KLASIFIKASI_OMMHA } from '@/lib/articles';

export const metadata: Metadata = {
  title: `${KLASIFIKASI_OMMHA.title} — OMMHA`,
  description: KLASIFIKASI_OMMHA.description,
};

export default function KlasifikasiOmmhaPage() {
  return <ArticlePage article={KLASIFIKASI_OMMHA} />;
}
