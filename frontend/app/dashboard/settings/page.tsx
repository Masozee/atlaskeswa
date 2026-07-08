'use client';

import { useState } from 'react';
import { useSystemSettings, useUpdateSystemSettings, useResetSystemSettings } from '@/hooks/use-settings';
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { HugeiconsIcon } from "@hugeicons/react";
import { FloppyDiskIcon, RefreshIcon } from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import { Separator } from '@/components/ui/separator';

const breadcrumbs = [
  { label: 'Dasbor', href: '/dashboard' },
  { label: 'Pengaturan' },
];

export default function SettingsPage() {
  const { data: settings, isLoading } = useSystemSettings();
  const updateSettings = useUpdateSystemSettings();
  const resetSettings = useResetSystemSettings();

  const [formData, setFormData] = useState<Record<string, any>>({});

  // Initialize form data when settings load
  if (settings && Object.keys(formData).length === 0) {
    setFormData(settings);
  }

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync(formData);
      toast.success('Pengaturan berhasil diperbarui');
    } catch (error) {
      toast.error('Gagal memperbarui pengaturan');
    }
  };

  const handleReset = async () => {
    try {
      await resetSettings.mutateAsync();
      toast.success('Pengaturan disetel ulang ke nilai bawaan');
      setFormData({});
    } catch (error) {
      toast.error('Gagal menyetel ulang pengaturan');
    }
  };

  if (isLoading) {
    return (
      <>
        <PageHeader breadcrumbs={breadcrumbs} />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Memuat pengaturan...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader breadcrumbs={breadcrumbs} />

      <div className="flex flex-1 flex-col gap-4">

        <div className="px-8 pt-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Pengaturan Sistem</h1>
            <p className="text-muted-foreground">Kelola konfigurasi seluruh sistem</p>
          </div>
          <div className="flex gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" disabled={resetSettings.isPending}>
                  <HugeiconsIcon icon={RefreshIcon} size={16} className="mr-2" aria-hidden="true" />
                  {resetSettings.isPending ? 'Menyetel ulang...' : 'Setel Ulang ke Bawaan'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Setel Ulang Pengaturan</AlertDialogTitle>
                  <AlertDialogDescription>
                    Apakah Anda yakin ingin menyetel ulang semua pengaturan ke nilai bawaan? Tindakan ini tidak dapat dibatalkan.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction onClick={handleReset}>Setel Ulang</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button onClick={handleSave} disabled={updateSettings.isPending}>
              <HugeiconsIcon icon={FloppyDiskIcon} size={16} className="mr-2" aria-hidden="true" />
              {updateSettings.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </div>
        </div>

        <Separator />

        <div className="flex flex-col gap-4 px-8 pb-8">

        <Tabs defaultValue="general" className="w-full">
          <TabsList>
            <TabsTrigger value="general">Umum</TabsTrigger>
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="security">Keamanan</TabsTrigger>
            <TabsTrigger value="survey">Survei</TabsTrigger>
            <TabsTrigger value="advanced">Lanjutan</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <Card className="border-0 bg-white shadow-none">
              <CardHeader>
                <CardTitle>Pengaturan Aplikasi</CardTitle>
                <CardDescription>Konfigurasikan informasi dasar aplikasi</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="app_name">Nama Aplikasi</Label>
                  <Input
                    id="app_name"
                    value={formData.app_name || ''}
                    onChange={(e) => handleChange('app_name', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="app_description">Deskripsi Aplikasi</Label>
                  <Textarea
                    id="app_description"
                    value={formData.app_description || ''}
                    onChange={(e) => handleChange('app_description', e.target.value)}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-white shadow-none">
              <CardHeader>
                <CardTitle>Pengaturan Paginasi</CardTitle>
                <CardDescription>Konfigurasikan perilaku paginasi bawaan</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="default_page_size">Ukuran Halaman Bawaan</Label>
                  <Input
                    id="default_page_size"
                    type="number"
                    min="5"
                    max="100"
                    value={formData.default_page_size || 10}
                    onChange={(e) => handleChange('default_page_size', parseInt(e.target.value))}
                    aria-describedby="default_page_size_desc"
                  />
                  <p id="default_page_size_desc" className="text-sm text-muted-foreground">Jumlah item per halaman (5-100)</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_page_size">Ukuran Halaman Maksimum</Label>
                  <Input
                    id="max_page_size"
                    type="number"
                    min="10"
                    max="500"
                    value={formData.max_page_size || 100}
                    onChange={(e) => handleChange('max_page_size', parseInt(e.target.value))}
                    aria-describedby="max_page_size_desc"
                  />
                  <p id="max_page_size_desc" className="text-sm text-muted-foreground">Item maksimum per halaman (10-500)</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-white shadow-none">
              <CardHeader>
                <CardTitle>Mode Pemeliharaan</CardTitle>
                <CardDescription>Aktifkan mode pemeliharaan untuk mencegah akses pengguna</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="maintenance_mode">Mode Pemeliharaan</Label>
                    <p id="maintenance_mode_desc" className="text-sm text-muted-foreground">Sistem saat ini dalam pemeliharaan</p>
                  </div>
                  <Switch
                    id="maintenance_mode"
                    checked={formData.maintenance_mode || false}
                    onCheckedChange={(checked) => handleChange('maintenance_mode', checked)}
                    aria-describedby="maintenance_mode_desc"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maintenance_message">Pesan Pemeliharaan</Label>
                  <Textarea
                    id="maintenance_message"
                    value={formData.maintenance_message || ''}
                    onChange={(e) => handleChange('maintenance_message', e.target.value)}
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="email" className="space-y-4">
            <Card className="border-0 bg-white shadow-none">
              <CardHeader>
                <CardTitle>Konfigurasi Email</CardTitle>
                <CardDescription>Konfigurasikan pengaturan notifikasi email</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email_notifications_enabled">Notifikasi Email</Label>
                    <p id="email_notifications_desc" className="text-sm text-muted-foreground">Aktifkan notifikasi email sistem</p>
                  </div>
                  <Switch
                    id="email_notifications_enabled"
                    checked={formData.email_notifications_enabled || false}
                    onCheckedChange={(checked) => handleChange('email_notifications_enabled', checked)}
                    aria-describedby="email_notifications_desc"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email_from_address">Alamat Email Pengirim</Label>
                  <Input
                    id="email_from_address"
                    type="email"
                    value={formData.email_from_address || ''}
                    onChange={(e) => handleChange('email_from_address', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email_from_name">Nama Pengirim</Label>
                  <Input
                    id="email_from_name"
                    value={formData.email_from_name || ''}
                    onChange={(e) => handleChange('email_from_name', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <Card className="border-0 bg-white shadow-none">
              <CardHeader>
                <CardTitle>Pengaturan Keamanan</CardTitle>
                <CardDescription>Konfigurasikan pengaturan keamanan dan autentikasi</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="session_timeout">Batas Waktu Sesi (menit)</Label>
                  <Input
                    id="session_timeout"
                    type="number"
                    min="5"
                    max="1440"
                    value={formData.session_timeout || 30}
                    onChange={(e) => handleChange('session_timeout', parseInt(e.target.value))}
                    aria-describedby="session_timeout_desc"
                  />
                  <p id="session_timeout_desc" className="text-sm text-muted-foreground">Batas waktu sesi dalam menit (5-1440)</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password_min_length">Panjang Kata Sandi Minimum</Label>
                  <Input
                    id="password_min_length"
                    type="number"
                    min="6"
                    max="32"
                    value={formData.password_min_length || 8}
                    onChange={(e) => handleChange('password_min_length', parseInt(e.target.value))}
                    aria-describedby="password_min_length_desc"
                  />
                  <p id="password_min_length_desc" className="text-sm text-muted-foreground">Panjang kata sandi minimum (6-32)</p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="require_email_verification">Wajibkan Verifikasi Email</Label>
                    <p id="require_email_verification_desc" className="text-sm text-muted-foreground">Pengguna harus memverifikasi email sebelum masuk</p>
                  </div>
                  <Switch
                    id="require_email_verification"
                    checked={formData.require_email_verification || false}
                    onCheckedChange={(checked) => handleChange('require_email_verification', checked)}
                    aria-describedby="require_email_verification_desc"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="enable_two_factor_auth">Aktifkan Autentikasi Dua Faktor</Label>
                    <p id="enable_two_factor_auth_desc" className="text-sm text-muted-foreground">Wajibkan 2FA untuk akun pengguna</p>
                  </div>
                  <Switch
                    id="enable_two_factor_auth"
                    checked={formData.enable_two_factor_auth || false}
                    onCheckedChange={(checked) => handleChange('enable_two_factor_auth', checked)}
                    aria-describedby="enable_two_factor_auth_desc"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="survey" className="space-y-4">
            <Card className="border-0 bg-white shadow-none">
              <CardHeader>
                <CardTitle>Pengaturan Survei</CardTitle>
                <CardDescription>Konfigurasikan pengaturan terkait survei</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="survey_auto_approval">Setujui Survei Otomatis</Label>
                    <p id="survey_auto_approval_desc" className="text-sm text-muted-foreground">Lewati alur kerja verifikasi</p>
                  </div>
                  <Switch
                    id="survey_auto_approval"
                    checked={formData.survey_auto_approval || false}
                    onCheckedChange={(checked) => handleChange('survey_auto_approval', checked)}
                    aria-describedby="survey_auto_approval_desc"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="survey_draft_expiry_days">Hari Kedaluwarsa Draf</Label>
                  <Input
                    id="survey_draft_expiry_days"
                    type="number"
                    min="7"
                    max="180"
                    value={formData.survey_draft_expiry_days || 30}
                    onChange={(e) => handleChange('survey_draft_expiry_days', parseInt(e.target.value))}
                    aria-describedby="survey_draft_expiry_days_desc"
                  />
                  <p id="survey_draft_expiry_days_desc" className="text-sm text-muted-foreground">Hari sebelum draf survei kedaluwarsa (7-180)</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            <Card className="border-0 bg-white shadow-none">
              <CardHeader>
                <CardTitle>Data & Privasi</CardTitle>
                <CardDescription>Konfigurasikan pengaturan retensi data dan audit</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="data_retention_days">Hari Retensi Data</Label>
                  <Input
                    id="data_retention_days"
                    type="number"
                    min="30"
                    max="3650"
                    value={formData.data_retention_days || 365}
                    onChange={(e) => handleChange('data_retention_days', parseInt(e.target.value))}
                    aria-describedby="data_retention_days_desc"
                  />
                  <p id="data_retention_days_desc" className="text-sm text-muted-foreground">Hari untuk menyimpan data (30-3650)</p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="enable_audit_logs">Aktifkan Log Audit</Label>
                    <p id="enable_audit_logs_desc" className="text-sm text-muted-foreground">Lacak semua perubahan sistem</p>
                  </div>
                  <Switch
                    id="enable_audit_logs"
                    checked={formData.enable_audit_logs || false}
                    onCheckedChange={(checked) => handleChange('enable_audit_logs', checked)}
                    aria-describedby="enable_audit_logs_desc"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-white shadow-none">
              <CardHeader>
                <CardTitle>Metadata Pengaturan</CardTitle>
                <CardDescription>Informasi tentang pembaruan pengaturan terakhir</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Terakhir Diperbarui:</span>
                  <span>{settings?.updated_at ? new Date(settings.updated_at).toLocaleString() : 'Tidak pernah'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Diperbarui Oleh:</span>
                  <span>{settings?.updated_by_name || settings?.updated_by_email || 'Sistem'}</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
              </div>
        </div>
    </>
  );
}
