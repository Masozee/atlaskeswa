import Link from 'next/link';
import { PublicNav } from '@/components/public-nav';
import { PublicFooter } from '@/components/public-footer';
import { DevNotice } from '@/components/dev-notice';
import { PUBLIC_CONTAINER } from '@/lib/public-layout';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowRight01Icon } from '@hugeicons/core-free-icons';

export const metadata = {
  title: 'Hubungi kami — OMMHA',
  description: 'Kontak tim OMMHA untuk pertanyaan tentang data layanan kesehatan jiwa.',
};

const SUPPORT_EMAIL = 'support@atlaskeswa.id';

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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-[15px] mt-1">{children}</dd>
    </div>
  );
}

export default function HubungiKamiPage() {
  return (
    <div className="font-geist min-h-screen bg-background">
      <DevNotice />
      <PublicNav />

      <main className={`${PUBLIC_CONTAINER} pb-24`}>
        <div className="pt-10 pb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight leading-[1.08]">
            Hubungi kami
          </h1>
          <p className="mt-4 text-[15px] text-foreground/80 max-w-[62ch]">
            Pertanyaan tentang data layanan, permintaan akses, atau koreksi informasi dapat
            dikirimkan melalui email di bawah ini.
          </p>
        </div>

        <div className="border-t" />

        <div className="space-y-16 lg:space-y-20 pt-12 lg:pt-16">
          <Chapter title="Kontak">
            <dl className="grid gap-x-10 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Email">
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="text-primary hover:underline underline-offset-4"
                >
                  {SUPPORT_EMAIL}
                </a>
              </Field>
              <Field label="Waktu respon">
                Biasanya dalam 24 jam pada hari kerja
              </Field>
              <Field label="Jam dukungan">
                Senin&ndash;Jumat, 09.00&ndash;17.00 (GMT+7)
              </Field>
            </dl>
          </Chapter>

          <Chapter title="Mendaftar sebagai pengguna">
            <p className="text-[15px] text-foreground/80 leading-relaxed max-w-[68ch]">
              Akses ke dasbor survei dan verifikasi diberikan oleh administrator sistem. Kirimkan
              email ke{' '}
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="text-primary hover:underline underline-offset-4"
              >
                {SUPPORT_EMAIL}
              </a>{' '}
              dengan identitas dan afiliasi Anda. Tim kami akan memverifikasi dan memberikan akses
              sesuai peran yang dibutuhkan.
            </p>
          </Chapter>

          <Chapter title="Sebelum menghubungi">
            <p className="text-[15px] text-foreground/80 leading-relaxed max-w-[68ch] mb-6">
              Sebagian pertanyaan sudah terjawab di halaman berikut.
            </p>
            <ul className="space-y-3">
              {[
                { href: '/tentang-kami', label: 'Tentang OMMHA dan DESDE-LTC' },
                { href: '/layanan-kesehatan', label: 'Daftar layanan kesehatan jiwa' },
                { href: '/kecamatan', label: 'Sebaran layanan per kecamatan' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="inline-flex items-center gap-2 py-1 -my-1 text-[15px] font-medium hover:underline underline-offset-4"
                  >
                    {link.label}
                    <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
                  </Link>
                </li>
              ))}
            </ul>
          </Chapter>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
