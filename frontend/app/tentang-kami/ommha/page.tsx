import type { Metadata } from 'next';
import { ArticlePage } from '@/components/article-page';
import { TENTANG_OMMHA } from '@/lib/articles';

export const metadata: Metadata = {
  title: `${TENTANG_OMMHA.title} — OMMHA`,
  description: TENTANG_OMMHA.description,
};

export default function TentangOmmhaPage() {
  return <ArticlePage article={TENTANG_OMMHA} />;
}
