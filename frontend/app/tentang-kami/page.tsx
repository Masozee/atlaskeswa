import Link from 'next/link';
import Image from 'next/image';
import { PublicNav } from '@/components/public-nav';
import { PublicFooter } from '@/components/public-footer';
import { DevNotice } from '@/components/dev-notice';
import { Button } from '@/components/ui/button';
import { PUBLIC_CONTAINER } from '@/lib/public-layout';
import { PARTNER_LOGOS } from '@/lib/partners';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowRight01Icon } from '@hugeicons/core-free-icons';

export const metadata = {
  title: 'Tentang kami — OMMHA',
  description:
    'OMMHA memetakan layanan kesehatan jiwa di Kabupaten Kebumen menggunakan standar DESDE-LTC.',
};

function Chapter({ title, children }: { title: string; children: React.ReactNode }) {
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
            OMMHA — One Map for Mental Health Atlas — adalah platform digital untuk memetakan,
            memverifikasi, dan membuka data layanan kesehatan jiwa di Indonesia.
          </p>
        </div>

        <div className="border-t" />

        <div className="space-y-16 lg:space-y-20 pt-12 lg:pt-16">
          <Chapter title="Apa yang kami kerjakan">
            <div className="space-y-4 text-[15px] text-foreground/80 leading-relaxed max-w-[68ch]">
              <p>
                Atlas Keswa hadir sebagai platform digital yang memfasilitasi pengumpulan data,
                verifikasi informasi, dan visualisasi hasil pemetaan layanan kesehatan jiwa
                menggunakan standar DESDE-LTC.
              </p>
              <p>
                Data dikumpulkan oleh enumerator di lapangan, diverifikasi oleh tim verifikator,
                lalu dipublikasikan sebagai peta dan direktori yang dapat digunakan oleh Dinas
                Kesehatan, pengelola fasilitas, peneliti, dan pembuat kebijakan.
              </p>
            </div>
          </Chapter>

          <Chapter title="DESDE-LTC">
            <div className="space-y-4 text-[15px] text-foreground/80 leading-relaxed max-w-[68ch]">
              <p>
                DESDE-LTC (Description and Evaluation of Services and DirectoriEs for Long-Term
                Care) adalah sistem klasifikasi internasional yang dikembangkan untuk memetakan dan
                mengevaluasi layanan kesehatan jangka panjang, termasuk layanan kesehatan jiwa.
              </p>
              <p>
                Sistem ini menggunakan kode MTC (Main Type of Care) dan BSIC (Basic Service
                Identification Code) untuk mengklasifikasikan berbagai jenis layanan secara standar
                dan terstruktur, sehingga layanan di satu daerah dapat dibandingkan dengan daerah
                lain.
              </p>
            </div>
          </Chapter>

          <Chapter title="Kabupaten Kebumen">
            <div className="space-y-4 text-[15px] text-foreground/80 leading-relaxed max-w-[68ch]">
              <p>
                Kabupaten Kebumen menjadi salah satu daerah percontohan implementasi sistem
                DESDE-LTC di Indonesia. Pemetaan layanan kesehatan jiwa dilakukan secara
                komprehensif di 26 kecamatan untuk mendukung perencanaan dan pengembangan layanan
                yang lebih baik.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 mt-8">
              <Button asChild variant="outline" className="rounded-sm shadow-none gap-2">
                <Link href="/layanan-kesehatan">
                  Lihat daftar layanan
                  <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
                </Link>
              </Button>
              <Button asChild variant="outline" className="rounded-sm shadow-none gap-2">
                <Link href="/kecamatan">
                  Jelajahi per kecamatan
                  <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
                </Link>
              </Button>
            </div>
          </Chapter>

          <Chapter title="Mitra">
            <p className="text-[15px] text-foreground/80 leading-relaxed max-w-[68ch] mb-8">
              Pemetaan ini merupakan kolaborasi antara YAKKUM, Pemerintah Kabupaten Kebumen, BRIN,
              Kementerian Kesehatan, Universitas Katolik Indonesia Atma Jaya, dan jaringan KONEKSI.
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
