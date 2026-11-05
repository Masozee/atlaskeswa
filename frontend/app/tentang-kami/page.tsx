import Link from 'next/link';
import Image from 'next/image';
import { PublicNav } from '@/components/public-nav';
import { PublicFooter } from '@/components/public-footer';
import { DevNotice } from '@/components/dev-notice';
import { Button } from '@/components/ui/button';
import { PUBLIC_CONTAINER } from '@/lib/public-layout';
import { PARTNER_LOGOS } from '@/lib/partners';
import { MITRA_TEXT, OMMHA_INTRO } from '@/lib/articles';
import { InlineText } from '@/components/inline-text';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowRight01Icon } from '@hugeicons/core-free-icons';

export const metadata = {
  title: 'Tentang kami — OMMHA',
  description:
    'OMMHA merupakan studi percontohan untuk mengembangkan Atlas Layanan Kesehatan Jiwa: sistem informasi geospasial yang memetakan layanan kesehatan jiwa secara komprehensif dan terstandar.',
};

function Chapter({ title, children }: { title: React.ReactNode; children: React.ReactNode }) {
  return (
    <section>
      {/* Larger than the data pages' chapter labels: here the heading sits over
          prose at the same size, so it needs the extra step to outrank it. */}
      <h2 className="text-lg font-medium mb-4">{title}</h2>
      {children}
    </section>
  );
}

export default function TentangKamiPage() {
  return (
    <div className="font-geist min-h-screen bg-background">
      <DevNotice />
      <PublicNav />

      <main className={`${PUBLIC_CONTAINER} pb-24`}>
        <div className="pt-10 pb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight leading-[1.08]">
            Tentang kami
          </h1>
          <p className="mt-4 text-[15px] text-foreground/80 max-w-[62ch]">
            OMMHA (<em>One Map for Mental Health Atlas</em>) merupakan studi percontohan untuk
            mengembangkan Atlas Layanan Kesehatan Jiwa, yaitu sistem informasi geospasial yang
            memetakan keberadaan, persebaran, dan jenis-jenis layanan kesehatan jiwa secara
            komprehensif dan terstandar.
          </p>
        </div>

        <div className="border-t" />

        <div className="space-y-16 lg:space-y-20 pt-12 lg:pt-16">
          <Chapter title={<><em>One Map for Mental Health Atlas</em> (OMMHA)</>}>
            <div className="space-y-4 text-[15px] text-foreground/80 leading-relaxed max-w-[68ch]">
              {OMMHA_INTRO.map((text) => (
                <p key={text.slice(0, 24)}>
                  <InlineText text={text} />
                </p>
              ))}
            </div>
            <Button asChild variant="outline" className="rounded-sm shadow-none gap-2 mt-6">
              <Link href="/tentang-kami/ommha">
                Selengkapnya
                <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
              </Link>
            </Button>
          </Chapter>

          <Chapter title="Mitra Kolaborasi">
            <p className="text-[15px] text-foreground/80 leading-relaxed max-w-[68ch] mb-8">
              <InlineText text={MITRA_TEXT} />
            </p>
            {/* Partner marks go monochrome: they are evidence of support, not the
                identity of this page. */}
            <div className="flex flex-wrap items-center gap-x-12 gap-y-8">
              {PARTNER_LOGOS.map((logo) => (
                <div
                  key={logo.src}
                  className="relative h-12 w-28 grayscale opacity-70 transition-all duration-300 hover:grayscale-0 hover:opacity-100"
                >
                  <Image src={logo.src} alt={logo.alt} fill sizes="112px" className="object-contain" />
                </div>
              ))}
            </div>
          </Chapter>

          <Chapter title="Hubungi kami">
            <p className="text-[15px] text-foreground/80 leading-relaxed max-w-[68ch]">
              Punya pertanyaan tentang data atau ingin berkontribusi?
            </p>
            <Button asChild variant="outline" className="rounded-sm shadow-none gap-2 mt-6">
              <Link href="/hubungi-kami">
                Hubungi kami
                <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
              </Link>
            </Button>
          </Chapter>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
