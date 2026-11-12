'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Spinner } from '@/components/ui/spinner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AssetInput } from '@/components/publications/asset-input';
import { RichBodyEditor } from '@/components/publications/rich-body-editor';
import { useSavePublication, type PublicationInput } from '@/hooks/use-publications';
import {
  PUBLICATION_STATUSES,
  PUBLICATION_TYPES,
  type Block,
  type PublicationRecord,
  type PublicationStatus,
  type PublicationTypeCode,
} from '@/lib/publications';
import { HugeiconsIcon } from '@hugeicons/react';
import { FloppyDiskIcon, LinkSquare02Icon } from '@hugeicons/core-free-icons';

export function slugify(text: string) {
  return text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s-]+/g, '-')
    .slice(0, 120)
    .replace(/-+$/, '');
}

type FormState = Omit<PublicationInput, 'body'>;

function initialState(record?: PublicationRecord): FormState {
  return {
    slug: record?.slug ?? '',
    type: record?.type ?? 'SIARAN_PERS',
    status: record?.status ?? 'DRAFT',
    date: record?.date ?? new Date().toISOString().slice(0, 10),
    title: record?.title ?? '',
    excerpt: record?.excerpt ?? '',
    author: record?.author ?? 'Tim Peneliti OMMHA',
    period: record?.period ?? '',
    cover_src: record?.cover_src ?? '',
    cover_alt: record?.cover_alt ?? '',
    cover_credit: record?.cover_credit ?? '',
    file_href: record?.file_href ?? '',
    file_label: record?.file_label ?? '',
    file_size: record?.file_size ?? '',
    external_url: record?.external_url ?? '',
  };
}

/** First message of a DRF validation error payload. */
function firstError(error: unknown): string {
  const errors = (error as { errors?: Record<string, unknown> })?.errors;
  if (errors && typeof errors === 'object') {
    for (const [field, messages] of Object.entries(errors)) {
      const message = Array.isArray(messages) ? messages[0] : messages;
      if (typeof message === 'string') return field === 'non_field_errors' || field === 'detail' ? message : `${field}: ${message}`;
    }
  }
  return error instanceof Error ? error.message : 'Gagal menyimpan publikasi.';
}

function Field({
  label,
  htmlFor,
  hint,
  required,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>
        {label}
        {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 rounded-lg border p-4">
      <h2 className="text-sm font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export function PublicationForm({ record }: { record?: PublicationRecord }) {
  const router = useRouter();
  const save = useSavePublication(record?.slug);
  const [form, setForm] = useState<FormState>(() => initialState(record));
  const [body, setBody] = useState<Block[]>(() => record?.body ?? []);
  // A new piece follows its title until someone edits the slug by hand.
  const [slugTouched, setSlugTouched] = useState(!!record);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((prev) => ({ ...prev, [key]: value }));
  const isExternal = form.external_url.trim() !== '';

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const missing = (['title', 'slug', 'date', 'excerpt', 'author'] as const).filter((key) => !form[key].trim());
    if (missing.length) {
      toast.error('Lengkapi judul, slug, tanggal, ringkasan, dan penulis.');
      return;
    }
    try {
      const saved = await save.mutateAsync({
        ...form,
        body: isExternal ? [] : body,
      });
      toast.success(record ? 'Publikasi diperbarui' : 'Publikasi dibuat');
      if (!record || saved.slug !== record.slug) router.replace(`/dashboard/publikasi/${saved.slug}`);
    } catch (error) {
      toast.error(firstError(error));
    }
  }

  const publicUrl = isExternal ? form.external_url : `/publikasi/${record?.slug}`;

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="space-y-6 min-w-0">
        <Panel title="Konten">
          <Field label="Judul" htmlFor="title" required>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => {
                const title = e.target.value;
                setForm((prev) => ({ ...prev, title, slug: slugTouched ? prev.slug : slugify(title) }));
              }}
            />
          </Field>
          <Field label="Slug" htmlFor="slug" required hint={`Alamat halaman: /publikasi/${form.slug || '…'}`}>
            <Input
              id="slug"
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true);
                set('slug', e.target.value.toLowerCase().replace(/\s+/g, '-'));
              }}
              onBlur={() => set('slug', slugify(form.slug))}
            />
          </Field>
          <Field label="Ringkasan" htmlFor="excerpt" required hint="Tampil di kartu publikasi dan di bawah judul.">
            <Textarea id="excerpt" rows={3} value={form.excerpt} onChange={(e) => set('excerpt', e.target.value)} />
          </Field>
          <Field
            label="Tautan eksternal"
            htmlFor="external_url"
            hint="Isi jika artikel terbit di situs lain (mis. pryakkum.org). Kartu akan menautkan ke sana dan tidak ada halaman detail."
          >
            <Input
              id="external_url"
              type="url"
              placeholder="https://"
              value={form.external_url}
              onChange={(e) => set('external_url', e.target.value)}
            />
          </Field>
        </Panel>

        <Panel title="Isi halaman">
          {isExternal ? (
            <p className="text-sm text-muted-foreground">
              Publikasi eksternal tidak memiliki halaman detail, jadi isi tidak diperlukan.
            </p>
          ) : (
            <RichBodyEditor initialBlocks={body} onChange={setBody} />
          )}
        </Panel>
      </div>

      <aside className="space-y-6 lg:sticky lg:top-4 lg:self-start">
        <Panel title="Terbitan">
          <Field label="Status">
            <Select value={form.status} onValueChange={(v) => set('status', v as PublicationStatus)}>
              <SelectTrigger className="w-full !h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PUBLICATION_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Jenis">
            <Select value={form.type} onValueChange={(v) => set('type', v as PublicationTypeCode)}>
              <SelectTrigger className="w-full !h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PUBLICATION_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Tanggal" htmlFor="date" required>
            <Input id="date" type="date" value={form.date} onChange={(e) => set('date', e.target.value)} />
          </Field>
          <Field label="Penulis" htmlFor="author" required>
            <Input id="author" value={form.author} onChange={(e) => set('author', e.target.value)} />
          </Field>
          <Field label="Periode penelitian" htmlFor="period" hint="Opsional, untuk laporan.">
            <Input
              id="period"
              placeholder="Oktober 2025 – Agustus 2026"
              value={form.period}
              onChange={(e) => set('period', e.target.value)}
            />
          </Field>

          <div className="flex flex-col gap-2 pt-2">
            <Button type="submit" disabled={save.isPending} className="gap-2">
              {save.isPending ? <Spinner /> : <HugeiconsIcon icon={FloppyDiskIcon} size={16} />}
              {record ? 'Simpan perubahan' : 'Simpan publikasi'}
            </Button>
            {record?.status === 'PUBLISHED' && (
              <Button asChild variant="outline" className="gap-2">
                <Link href={publicUrl} target="_blank" rel="noopener noreferrer">
                  <HugeiconsIcon icon={LinkSquare02Icon} size={16} />
                  Lihat halaman publik
                </Link>
              </Button>
            )}
          </div>
          {record && (
            <p className="text-xs text-muted-foreground">
              Terakhir diubah {new Date(record.updated_at).toLocaleString('id-ID')}
              {record.updated_by_name ? ` oleh ${record.updated_by_name}` : ''}.
            </p>
          )}
        </Panel>

        <Panel title="Gambar sampul">
          <AssetInput kind="image" value={form.cover_src} onChange={(src) => set('cover_src', src)} />
          <Field label="Teks alternatif" htmlFor="cover_alt">
            <Input id="cover_alt" value={form.cover_alt} onChange={(e) => set('cover_alt', e.target.value)} />
          </Field>
          <Field label="Kredit foto" htmlFor="cover_credit">
            <Input id="cover_credit" value={form.cover_credit} onChange={(e) => set('cover_credit', e.target.value)} />
          </Field>
        </Panel>

        <Panel title="Berkas unduhan">
          <AssetInput
            kind="file"
            value={form.file_href}
            onChange={(href, meta) =>
              setForm((prev) => ({
                ...prev,
                file_href: href,
                file_size: meta?.size !== undefined ? meta.size : prev.file_size,
                file_label: href && !prev.file_label ? 'Unduh dokumen (PDF)' : prev.file_label,
              }))
            }
          />
          <Field label="Label tombol" htmlFor="file_label">
            <Input id="file_label" value={form.file_label} onChange={(e) => set('file_label', e.target.value)} />
          </Field>
          <Field label="Ukuran berkas" htmlFor="file_size" hint="Terisi otomatis saat mengunggah.">
            <Input id="file_size" value={form.file_size} onChange={(e) => set('file_size', e.target.value)} />
          </Field>
        </Panel>
      </aside>
    </form>
  );
}
