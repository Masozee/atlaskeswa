import Link from 'next/link';
import Image from 'next/image';
import { PUBLIC_CONTAINER } from '@/lib/public-layout';

const FOOTER_LINKS = [
  { href: '/dashboard/help/user-guide', label: 'Panduan pengguna' },
  { href: '/dashboard/help/faq', label: 'FAQ' },
  { href: '/dashboard/help/support', label: 'Dukungan' },
];

/** Footer for every public surface. Lifted out of the landing page so the two
 *  stay identical. */
export function PublicFooter() {
  return (
    <footer className="border-t py-10">
      <div className={PUBLIC_CONTAINER}>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative h-8 w-8">
              <Image src="/OMMHA.png" alt="Logo OMMHA" fill sizes="32px" className="object-contain" />
            </div>
            <div>
              <div className="font-semibold">OMMHA</div>
              <div className="text-xs text-muted-foreground">One Map for Mental Health Atlas</div>
            </div>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            {FOOTER_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-foreground transition-colors">
                {link.label}
              </Link>
            ))}
          </div>
          <div className="text-sm text-muted-foreground">
            © 2025 Atlas Keswa. Hak cipta dilindungi.
          </div>
        </div>
      </div>
    </footer>
  );
}
