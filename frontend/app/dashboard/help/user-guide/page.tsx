'use client';

import { useState, useEffect } from 'react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { DateTime } from '@/components/date-time';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { HugeiconsIcon } from "@hugeicons/react"
import {BookOpen01Icon, Search01Icon, ViewIcon, StarIcon} from "@hugeicons/core-free-icons";

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

export default function UserGuidePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [articles, setArticles] = useState(mockArticles);

  const filteredArticles = articles.filter((article) =>
    searchQuery === '' ||
    article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.summary.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const featuredArticles = filteredArticles.filter((article) => article.is_featured);
  const regularArticles = filteredArticles.filter((article) => !article.is_featured);

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard/help">Help & Documentation</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>User Guide</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="ml-auto">
          <DateTime />
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4">
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
            <div className="mb-3 flex items-center gap-2">
              <HugeiconsIcon icon={StarIcon} size={20} className="text-yello" />
              <h2 className="text-lg font-semibold">Featured Guides</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {featuredArticles.map((article) => (
                <Card key={article.id} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <CardTitle className="text-base">{article.title}</CardTitle>
                        <CardDescription className="mt-1.5">
                          {article.summary}
                        </CardDescription>
                      </div>
                      <HugeiconsIcon icon={BookOpen01Icon} size={20} className="text-primary shrink-0" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <HugeiconsIcon icon={ViewIcon} size={14} />
                        <span>{article.views_count} views</span>
                      </div>
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                        <HugeiconsIcon icon={StarIcon} size={12} className="mr-1" />
                        Featured
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* All Articles */}
        {regularArticles.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-3">All Guides</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {regularArticles.map((article) => (
                <Card key={article.id} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <CardTitle className="text-base">{article.title}</CardTitle>
                        <CardDescription className="mt-1.5">
                          {article.summary}
                        </CardDescription>
                      </div>
                      <HugeiconsIcon icon={BookOpen01Icon} size={20} className="text-muted-foreground shrink-0" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <HugeiconsIcon icon={ViewIcon} size={14} />
                      <span>{article.views_count} views</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* No Results */}
        {filteredArticles.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <HugeiconsIcon icon={BookOpen01Icon} size={48} className="text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                No articles found matching your search.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
