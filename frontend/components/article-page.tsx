import Link from 'next/link';
import Image from 'next/image';
import { PublicNav } from '@/components/public-nav';
import { PublicFooter } from '@/components/public-footer';
import { DevNotice } from '@/components/dev-notice';
import { BlockView } from '@/components/article-blocks';
import { PUBLIC_CONTAINER } from '@/lib/public-layout';
import type { Article } from '@/lib/articles';

/** A long-form explainer page: breadcrumb, title, optional cover, prose. */
export function ArticlePage({ article, children }: { article: Article; children?: React.ReactNode }) {
  return (
    <div className="font-geist min-h-screen bg-background">
      <DevNotice />
      <PublicNav />

      <main className={`${PUBLIC_CONTAINER} pb-24`}>
        <header className="pt-8 pb-8">
          <nav aria-label="Breadcrumb" className="text-[13px] text-muted-foreground">
            <ol className="flex flex-wrap items-center gap-1.5">
              <li>
                <Link href="/" className="inline-block py-1 -my-1 hover:text-foreground transition-colors">
                  Beranda
                </Link>
              </li>
              {article.parent && (
                <>
                  <li aria-hidden className="opacity-50">/</li>
                  <li>
                    <Link
                      href={article.parent.href}
                      className="inline-block py-1 -my-1 hover:text-foreground transition-colors"
                    >
                      {article.parent.label}
                    </Link>
                  </li>
                </>
              )}
            </ol>
          </nav>

          <h1 className="mt-5 max-w-[28ch] text-[30px] sm:text-[40px] font-semibold tracking-tight leading-[1.1] text-balance">
            {article.title}
          </h1>
        </header>

        {article.cover && (
          <div className="relative aspect-[16/9] lg:aspect-[21/9] w-full overflow-hidden rounded-lg bg-muted">
            <Image
              src={article.cover.src}
              alt={article.cover.alt}
              fill
              priority
              sizes="(min-width: 1280px) 1248px, 100vw"
              className="object-cover"
            />
          </div>
        )}

        <article className="mt-10 max-w-[72ch] space-y-5 text-[16px] leading-[1.75] text-foreground/85">
          {article.body.map((block, index) => (
            <BlockView key={index} block={block} />
          ))}
        </article>

        {children}
      </main>

      <PublicFooter />
    </div>
  );
}
