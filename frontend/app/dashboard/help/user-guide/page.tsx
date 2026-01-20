'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { HugeiconsIcon } from "@hugeicons/react"
import { Search01Icon } from "@hugeicons/core-free-icons";

// Mock data - will be replaced with API calls
const mockArticles = [
  {
    id: 1,
    title: 'Getting Started with Atlas Keswa',
    slug: 'getting-started',
    summary: 'Learn the basics of navigating and using the Atlas Keswa mental health service directory platform.',
    is_featured: true,
    views_count: 142,
    created_at: '2025-01-01T07:00:00+07:00',
  },
  {
    id: 2,
    title: 'Managing Services',
    slug: 'managing-services',
    summary: 'Learn how to add, edit, and manage mental health services in the directory.',
    is_featured: true,
    views_count: 98,
    created_at: '2025-01-01T07:00:00+07:00',
  },
  {
    id: 3,
    title: 'Survey Management Guide',
    slug: 'survey-management',
    summary: 'Complete guide to creating, managing, and verifying surveys in the system.',
    is_featured: false,
    views_count: 76,
    created_at: '2025-01-01T07:00:00+07:00',
  },
  {
    id: 4,
    title: 'Understanding User Roles',
    slug: 'user-roles',
    summary: 'Learn about different user roles and their permissions in the Atlas Keswa platform.',
    is_featured: false,
    views_count: 65,
    created_at: '2025-01-01T07:00:00+07:00',
  },
  {
    id: 5,
    title: 'Data Export and Reporting',
    slug: 'data-export',
    summary: 'How to export data and generate reports from the system.',
    is_featured: false,
    views_count: 54,
    created_at: '2025-01-01T07:00:00+07:00',
  },
];

const breadcrumbs = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Help & Documentation', href: '/dashboard/help' },
  { label: 'User Guide' },
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

      <div className="flex flex-1 flex-col gap-6 p-8">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold">User Guide</h1>
          <p className="text-muted-foreground">
            Comprehensive guides and tutorials for using the Atlas Keswa platform
          </p>
        </div>

        {/* Search */}
        <div className="max-w-md">
          <div className="relative">
            <HugeiconsIcon icon={Search01Icon} size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Featured Articles */}
        {featuredArticles.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Featured Guides</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {featuredArticles.map((article) => (
                <div key={article.id} className="p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-medium">{article.title}</h3>
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 shrink-0">
                      Featured
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {article.summary}
                  </p>
                  <div className="text-xs text-muted-foreground">
                    {article.views_count} views
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Articles */}
        {regularArticles.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4">All Guides</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {regularArticles.map((article) => (
                <div key={article.id} className="p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
                  <h3 className="font-medium mb-2">{article.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {article.summary}
                  </p>
                  <div className="text-xs text-muted-foreground">
                    {article.views_count} views
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
              No articles found matching your search.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
