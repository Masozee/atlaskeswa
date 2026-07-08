'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { HugeiconsIcon } from "@hugeicons/react"
import { Search01Icon } from "@hugeicons/core-free-icons";
import { Separator } from '@/components/ui/separator';

// Mock data - will be replaced with API calls
const mockArticles = [
  {
    id: 1,
    title: 'Memulai dengan Atlas Keswa',
    slug: 'getting-started',
    summary: 'Pelajari dasar-dasar navigasi dan penggunaan platform direktori layanan kesehatan jiwa Atlas Keswa.',
    is_featured: true,
    views_count: 142,
    created_at: '2025-01-01T07:00:00+07:00',
  },
  {
    id: 2,
    title: 'Mengelola Layanan',
    slug: 'managing-services',
    summary: 'Pelajari cara menambah, mengedit, dan mengelola layanan kesehatan jiwa di direktori.',
    is_featured: true,
    views_count: 98,
    created_at: '2025-01-01T07:00:00+07:00',
  },
  {
    id: 3,
    title: 'Panduan Manajemen Survei',
    slug: 'survey-management',
    summary: 'Panduan lengkap untuk membuat, mengelola, dan memverifikasi survei dalam sistem.',
    is_featured: false,
    views_count: 76,
    created_at: '2025-01-01T07:00:00+07:00',
  },
  {
    id: 4,
    title: 'Memahami Peran Pengguna',
    slug: 'user-roles',
    summary: 'Pelajari tentang berbagai peran pengguna dan izinnya di platform Atlas Keswa.',
    is_featured: false,
    views_count: 65,
    created_at: '2025-01-01T07:00:00+07:00',
  },
  {
    id: 5,
    title: 'Ekspor Data dan Pelaporan',
    slug: 'data-export',
    summary: 'Cara mengekspor data dan membuat laporan dari sistem.',
    is_featured: false,
    views_count: 54,
    created_at: '2025-01-01T07:00:00+07:00',
  },
];

const breadcrumbs = [
  { label: 'Dasbor', href: '/dashboard' },
  { label: 'Bantuan & Dokumentasi', href: '/dashboard/help' },
  { label: 'Panduan Pengguna' },
];

export default function UserGuidePage() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredArticles = mockArticles.filter((article) =>
    searchQuery === '' ||
    article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.summary.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const featuredArticles = filteredArticles.filter((article) => article.is_featured);
  const regularArticles = filteredArticles.filter((article) => !article.is_featured);

  return (
    <>
      <PageHeader breadcrumbs={breadcrumbs} />

      <div className="flex flex-1 flex-col gap-4">
        <div className="px-8 pt-8">
          <h1 className="text-2xl font-bold">Panduan Pengguna</h1>
          <p className="text-muted-foreground">
            Panduan dan tutorial lengkap untuk menggunakan platform Atlas Keswa
          </p>
        </div>

        <Separator />

        <div className="flex flex-col gap-4 px-8 pb-8">
        {/* Search */}
        <div className="max-w-md">
          <div className="relative">
            <HugeiconsIcon icon={Search01Icon} size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari artikel..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Featured Articles */}
        {featuredArticles.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Panduan Unggulan</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {featuredArticles.map((article) => (
                <div key={article.id} className="p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-medium">{article.title}</h3>
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 shrink-0">
                      Unggulan
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {article.summary}
                  </p>
                  <div className="text-xs text-muted-foreground">
                    {article.views_count} tampilan
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Articles */}
        {regularArticles.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Semua Panduan</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {regularArticles.map((article) => (
                <div key={article.id} className="p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
                  <h3 className="font-medium mb-2">{article.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {article.summary}
                  </p>
                  <div className="text-xs text-muted-foreground">
                    {article.views_count} tampilan
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Results */}
        {filteredArticles.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              Tidak ada artikel yang cocok dengan pencarian Anda.
            </p>
          </div>
        )}
        </div>
      </div>
    </>
  );
}
