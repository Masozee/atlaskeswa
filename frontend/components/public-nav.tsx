'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PUBLIC_CONTAINER } from '@/lib/public-layout';

const NAV_LINKS = [
  { href: '/layanan-kesehatan', label: 'Layanan kesehatan' },
  { href: '/kecamatan', label: 'Kecamatan' },
  { href: '/tentang-kami', label: 'Tentang kami' },
  { href: '/hubungi-kami', label: 'Hubungi kami' },
];

/**
 * `brandAsHeading` exists because the landing page has no other h1, while an
 * atlas page's h1 is its own subject — the brand must not outrank it.
 */
export function PublicNav({ brandAsHeading = false }: { brandAsHeading?: boolean }) {
  const Brand = brandAsHeading ? 'h1' : 'span';
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigasi utama"
      className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    >
      <div className={cn(PUBLIC_CONTAINER, 'h-16 flex items-center justify-between')}>
        <Link href="/" className="flex items-center gap-3 min-w-0">
          <span className="relative h-10 w-10 flex-shrink-0">
            <Image src="/OMMHA.png" alt="Logo OMMHA" fill sizes="40px" className="object-contain" />
          </span>
          <span className="min-w-0">
            <Brand className="block font-semibold text-lg leading-tight">OMMHA</Brand>
            <span className="block text-xs text-muted-foreground leading-tight truncate">
              One Map for Mental Health Atlas
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-6">
          <div className="hidden lg:flex items-center gap-5">
            {NAV_LINKS.map((link) => {
              const isCurrent = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isCurrent ? 'page' : undefined}
                  className={cn(
                    'text-sm font-medium transition-colors hover:text-foreground',
                    isCurrent ? 'text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
          <Button asChild>
            <Link href="/login">Masuk</Link>
          </Button>
        </div>
      </div>
    </nav>
  );
}
