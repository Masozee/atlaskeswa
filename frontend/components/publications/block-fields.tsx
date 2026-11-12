'use client';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AssetInput } from '@/components/publications/asset-input';
import type { Block, BlockType } from '@/lib/publications';
import { HugeiconsIcon } from '@hugeicons/react';
import { Add01Icon, Delete02Icon } from '@hugeicons/core-free-icons';

export const BLOCK_LABELS: Record<BlockType, string> = {
  p: 'Paragraf',
  h2: 'Subjudul',
  quote: 'Kutipan',
  list: 'Daftar',
  image: 'Gambar',
  table: 'Tabel',
  steps: 'Langkah proses',
  timeline: 'Linimasa',
  callout: 'Kotak sorotan',
  note: 'Catatan',
  diagram: 'Diagram OMMHA',
};

const DIAGRAM_LABELS = {
  'desde-adaptation': 'Adaptasi DESDE-LTC',
  'ommha-classification': 'Klasifikasi OMMHA',
} as const;

export function emptyBlock(type: BlockType): Block {
  switch (type) {
    case 'p':
    case 'h2':
    case 'note':
      return { type, text: '' };
    case 'quote':
      return { type, text: '', cite: '' };
    case 'list':
      return { type, items: [''] };
    case 'image':
      return { type, src: '', alt: '', width: 1600, height: 900, caption: '' };
    case 'table':
      return { type, caption: '', rows: [{ label: '', value: '' }] };
    case 'steps':
      return { type, caption: '', items: [''] };
    case 'timeline':
      return { type, caption: '', items: [{ title: '', period: '' }] };
    case 'callout':
      return { type, title: '', items: [''] };
    case 'diagram':
      return { type, diagram: 'ommha-classification', caption: '' };
  }
}

/* --------------------------------------------------------------- fields */

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[13px] text-muted-foreground font-normal">{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

const INLINE_HINT = 'Format: *miring*, **tebal**, [teks tautan](https://…).';

/** One item per line; blank lines are dropped on save. */
function LinesField({ label, items, onChange }: { label: string; items: string[]; onChange: (items: string[]) => void }) {
  return (
    <Field label={label} hint={`Satu butir per baris. ${INLINE_HINT}`}>
      <Textarea rows={Math.max(3, items.length + 1)} value={items.join('\n')} onChange={(e) => onChange(e.target.value.split('\n'))} />
    </Field>
  );
}

function RowButtons({ onRemove }: { onRemove: () => void }) {
  return (
    <Button type="button" variant="ghost" size="icon" className="shrink-0" aria-label="Hapus baris" onClick={onRemove}>
      <HugeiconsIcon icon={Delete02Icon} size={16} />
    </Button>
  );
}

/** The form for one structured block (table, timeline, …), shown inside the editor. */
export function BlockFields({ block, onChange }: { block: Block; onChange: (block: Block) => void }) {
  switch (block.type) {
    case 'p':
    case 'note':
      return (
        <Field label="Teks" hint={INLINE_HINT}>
          <Textarea rows={4} value={block.text} onChange={(e) => onChange({ ...block, text: e.target.value })} />
        </Field>
      );
    case 'h2':
      return (
        <Field label="Subjudul" hint="Muncul di daftar isi halaman.">
          <Input value={block.text} onChange={(e) => onChange({ ...block, text: e.target.value })} />
        </Field>
      );
    case 'quote':
      return (
        <div className="space-y-3">
          <Field label="Kutipan">
            <Textarea rows={3} value={block.text} onChange={(e) => onChange({ ...block, text: e.target.value })} />
          </Field>
          <Field label="Sumber kutipan">
            <Input value={block.cite} onChange={(e) => onChange({ ...block, cite: e.target.value })} />
          </Field>
        </div>
      );
    case 'list':
      return (
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={!!block.ordered} onCheckedChange={(ordered) => onChange({ ...block, ordered })} />
            Bernomor
          </label>
          <LinesField label="Butir" items={block.items} onChange={(items) => onChange({ ...block, items })} />
        </div>
      );
    case 'callout':
      return (
        <div className="space-y-3">
          <Field label="Judul">
            <Input value={block.title} onChange={(e) => onChange({ ...block, title: e.target.value })} />
          </Field>
          <LinesField label="Butir" items={block.items} onChange={(items) => onChange({ ...block, items })} />
        </div>
      );
    case 'steps':
      return (
        <div className="space-y-3">
          <Field label="Keterangan gambar">
            <Input value={block.caption} onChange={(e) => onChange({ ...block, caption: e.target.value })} />
          </Field>
          <LinesField label="Langkah" items={block.items} onChange={(items) => onChange({ ...block, items })} />
        </div>
      );
    case 'image':
      return (
        <div className="space-y-3">
          <AssetInput
            kind="image"
            value={block.src}
            onChange={(src, meta) => {
              const width = meta?.width ?? block.width;
              const height = meta?.height ?? block.height;
              if (src === block.src && width === block.width && height === block.height) return;
              onChange({ ...block, src, width, height });
            }}
          />
          <Field label="Teks alternatif" hint="Deskripsi gambar untuk pembaca layar.">
            <Input value={block.alt} onChange={(e) => onChange({ ...block, alt: e.target.value })} />
          </Field>
          <Field label="Keterangan (opsional)">
            <Input value={block.caption ?? ''} onChange={(e) => onChange({ ...block, caption: e.target.value })} />
          </Field>
          <p className="text-xs text-muted-foreground">
            Ukuran: {block.width} × {block.height} px
          </p>
        </div>
      );
    case 'diagram':
      return (
        <div className="space-y-3">
          <Field label="Diagram">
            <Select
              value={block.diagram}
              onValueChange={(diagram) => onChange({ ...block, diagram: diagram as keyof typeof DIAGRAM_LABELS })}
            >
              <SelectTrigger className="w-64 !h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(DIAGRAM_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Keterangan">
            <Input value={block.caption} onChange={(e) => onChange({ ...block, caption: e.target.value })} />
          </Field>
        </div>
      );
    case 'timeline':
      return (
        <div className="space-y-3">
          <Field label="Keterangan gambar">
            <Input value={block.caption} onChange={(e) => onChange({ ...block, caption: e.target.value })} />
          </Field>
          <Field label="Tahapan">
            <div className="space-y-2">
              {block.items.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder="Kegiatan"
                    value={item.title}
                    onChange={(e) =>
                      onChange({ ...block, items: block.items.map((it, i) => (i === index ? { ...it, title: e.target.value } : it)) })
                    }
                  />
                  <Input
                    placeholder="Periode"
                    className="w-48"
                    value={item.period}
                    onChange={(e) =>
                      onChange({ ...block, items: block.items.map((it, i) => (i === index ? { ...it, period: e.target.value } : it)) })
                    }
                  />
                  <RowButtons onRemove={() => onChange({ ...block, items: block.items.filter((_, i) => i !== index) })} />
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onChange({ ...block, items: [...block.items, { title: '', period: '' }] })}
              >
                <HugeiconsIcon icon={Add01Icon} size={14} /> Tambah tahapan
              </Button>
            </div>
          </Field>
        </div>
      );
    case 'table': {
      const head = block.head ?? ['', ''];
      return (
        <div className="space-y-3">
          <Field label="Keterangan tabel">
            <Input value={block.caption} onChange={(e) => onChange({ ...block, caption: e.target.value })} />
          </Field>
          <Field label="Kepala kolom (opsional)">
            <div className="flex gap-2">
              <Input placeholder="Kolom kiri" value={head[0]} onChange={(e) => onChange({ ...block, head: [e.target.value, head[1]] })} />
              <Input placeholder="Kolom kanan" className="w-48" value={head[1]} onChange={(e) => onChange({ ...block, head: [head[0], e.target.value] })} />
              <div className="w-9 shrink-0" />
            </div>
          </Field>
          <Field label="Baris" hint="Menjorok: rincian dari baris di atasnya. Tebal: baris total.">
            <div className="space-y-2">
              {block.rows.map((row, index) => {
                const update = (patch: Partial<typeof row>) =>
                  onChange({ ...block, rows: block.rows.map((r, i) => (i === index ? { ...r, ...patch } : r)) });
                return (
                  <div key={index} className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
                    <Input placeholder="Label" value={row.label} onChange={(e) => update({ label: e.target.value })} />
                    <Input placeholder="Nilai" className="w-48" value={row.value} onChange={(e) => update({ value: e.target.value })} />
                    <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Checkbox checked={!!row.indent} onCheckedChange={(v) => update({ indent: v === true || undefined })} />
                      Menjorok
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Checkbox checked={!!row.strong} onCheckedChange={(v) => update({ strong: v === true || undefined })} />
                      Tebal
                    </label>
                    <RowButtons onRemove={() => onChange({ ...block, rows: block.rows.filter((_, i) => i !== index) })} />
                  </div>
                );
              })}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onChange({ ...block, rows: [...block.rows, { label: '', value: '' }] })}
              >
                <HugeiconsIcon icon={Add01Icon} size={14} /> Tambah baris
              </Button>
            </div>
          </Field>
        </div>
      );
    }
  }
}
