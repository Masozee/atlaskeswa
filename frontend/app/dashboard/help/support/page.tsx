'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

const myTickets = [
  {
    id: 1,
    subject: 'Tidak dapat mengunggah dokumen survei',
    status: 'in_progress',
    priority: 'high',
    created_at: '2025-12-15 10:30:00',
    replies_count: 2,
  },
  {
    id: 2,
    subject: 'Pertanyaan tentang klasifikasi DESDE-LTC',
    status: 'resolved',
    priority: 'medium',
    created_at: '2025-12-14 14:20:00',
    replies_count: 3,
  },
];

const statusLabels: Record<string, string> = {
  open: 'terbuka',
  in_progress: 'sedang diproses',
  resolved: 'selesai',
  closed: 'ditutup',
};

const priorityLabels: Record<string, string> = {
  low: 'rendah',
  medium: 'sedang',
  high: 'tinggi',
  urgent: 'mendesak',
};

const statusColors = {
  open: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  resolved: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-800',
};

const priorityColors = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
};

const breadcrumbs = [
  { label: 'Dasbor', href: '/dashboard' },
  { label: 'Bantuan & Dokumentasi', href: '/dashboard/help' },
  { label: 'Hubungi Dukungan' },
];

export default function SupportPage() {
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('medium');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log({ subject, category, priority, description });
  };

  return (
    <>
      <PageHeader breadcrumbs={breadcrumbs} />

      <div className="flex flex-1 flex-col gap-4">
        <div className="px-8 pt-8">
          <h1 className="text-2xl font-bold">Hubungi Dukungan</h1>
          <p className="text-muted-foreground">
            Dapatkan bantuan dari tim dukungan kami
          </p>
        </div>

        <Separator />

        <div className="flex flex-col gap-4 px-8 pb-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - New Ticket Form */}
          <div className="lg:col-span-2">
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold mb-1">Ajukan Permintaan Dukungan</h2>
                <p className="text-sm text-muted-foreground">
                  Isi formulir di bawah ini dan tim kami akan segera menghubungi Anda
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Subjek *</Label>
                  <Input
                    id="subject"
                    placeholder="Deskripsi singkat masalah Anda"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="category">Kategori *</Label>
                    <Select value={category} onValueChange={(value) => value && setCategory(value)} required>
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Pilih kategori" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="technical">Masalah Teknis</SelectItem>
                        <SelectItem value="account">Akun & Akses</SelectItem>
                        <SelectItem value="survey">Terkait Survei</SelectItem>
                        <SelectItem value="data">Data & Laporan</SelectItem>
                        <SelectItem value="classification">Klasifikasi DESDE-LTC</SelectItem>
                        <SelectItem value="other">Lainnya</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priority">Prioritas *</Label>
                    <Select value={priority} onValueChange={(value) => value && setPriority(value)} required>
                      <SelectTrigger id="priority">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Rendah</SelectItem>
                        <SelectItem value="medium">Sedang</SelectItem>
                        <SelectItem value="high">Tinggi</SelectItem>
                        <SelectItem value="urgent">Mendesak</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Deskripsi *</Label>
                  <Textarea
                    id="description"
                    placeholder="Mohon berikan detail sebanyak mungkin tentang masalah Anda..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={6}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Sertakan pesan error, langkah-langkah untuk mereproduksi, atau tangkapan layar jika ada
                  </p>
                </div>

                <Button type="submit" className="w-full">
                  Kirim Permintaan
                </Button>
              </form>
            </div>
          </div>

          {/* Right Column - Contact Info & My Tickets */}
          <div className="space-y-6">
            {/* Contact Information */}
            <div className="space-y-3">
              <h2 className="text-lg font-semibold">Informasi Kontak</h2>
              <div className="space-y-3 text-sm">
                <div>
                  <div className="font-medium mb-1">Email</div>
                  <a href="mailto:support@atlaskeswa.id" className="text-primary hover:underline">
                    support@atlaskeswa.id
                  </a>
                </div>
                <div>
                  <div className="font-medium mb-1">Waktu Respon</div>
                  <p className="text-muted-foreground">
                    Kami biasanya merespon dalam 24 jam pada hari kerja
                  </p>
                </div>
                <div>
                  <div className="font-medium mb-1">Jam Dukungan</div>
                  <p className="text-muted-foreground">
                    Senin - Jumat<br />
                    09.00 - 17.00 (GMT+7)
                  </p>
                </div>
              </div>
            </div>

            {/* My Tickets */}
            <div className="space-y-3">
              <h2 className="text-lg font-semibold">Tiket Terbaru Saya</h2>
              <div className="space-y-3">
                {myTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-medium text-sm line-clamp-1">{ticket.subject}</h4>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant="outline"
                        className={statusColors[ticket.status as keyof typeof statusColors]}
                      >
                        {statusLabels[ticket.status] ?? ticket.status.replace('_', ' ')}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={priorityColors[ticket.priority as keyof typeof priorityColors]}
                      >
                        {priorityLabels[ticket.priority] ?? ticket.priority}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {ticket.replies_count} balasan
                      </span>
                    </div>
                  </div>
                ))}
                <Button variant="outline" className="w-full" size="sm">
                  Lihat Semua Tiket
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Need Help? */}
        <div className="bg-blue-50 rounded-lg p-6">
          <h3 className="text-blue-900 font-semibold mb-1">Butuh Bantuan?</h3>
          <p className="text-sm text-blue-700 mb-4">
            Tips untuk mendapatkan respon lebih cepat
          </p>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>• Periksa bagian FAQ terlebih dahulu - pertanyaan Anda mungkin sudah terjawab</li>
            <li>• Berikan informasi detail termasuk pesan error dan screenshot jika ada</li>
            <li>• Sertakan langkah-langkah untuk mereproduksi masalah jika bersifat teknis</li>
            <li>• Pilih prioritas yang sesuai agar kami dapat merespon lebih cepat</li>
          </ul>
        </div>
        </div>
      </div>
    </>
  );
}
