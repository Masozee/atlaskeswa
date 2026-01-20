'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CheckCircle2Icon } from 'lucide-react';

export default function SurveySuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md text-center space-y-6">
        <div className="flex justify-center">
          <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-4">
            <CheckCircle2Icon className="w-16 h-16 text-green-600 dark:text-green-400" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Survei Berhasil Disimpan!</h1>
          <p className="text-muted-foreground">
            Terima kasih telah mengisi formulir survei. Data Anda telah berhasil disimpan dan akan segera diproses untuk verifikasi.
          </p>
        </div>

        <div className="bg-muted/50 rounded-lg p-4 text-sm text-left space-y-2">
          <p className="font-medium">Langkah selanjutnya:</p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>Data survei akan direview oleh tim verifikasi</li>
            <li>Anda akan menerima notifikasi jika ada pertanyaan tambahan</li>
            <li>Status survei dapat dipantau melalui dashboard</li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/survey/new">
            <Button variant="outline" className="w-full sm:w-auto">
              Isi Survei Baru
            </Button>
          </Link>
          <Link href="/dashboard/survey">
            <Button className="w-full sm:w-auto">
              Lihat Daftar Survei
            </Button>
          </Link>
        </div>

        <p className="text-xs text-muted-foreground">
          Jika ada pertanyaan, silakan hubungi tim support melalui menu Bantuan di dashboard.
        </p>
      </div>
    </div>
  );
}
