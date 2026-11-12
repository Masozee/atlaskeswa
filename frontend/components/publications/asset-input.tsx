'use client';

import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { uploadPublicationAsset } from '@/hooks/use-publications';
import { HugeiconsIcon } from '@hugeicons/react';
import { Cancel01Icon, File01Icon, Upload01Icon } from '@hugeicons/core-free-icons';

export interface AssetMeta {
  size?: string;
  width?: number;
  height?: number;
}

function readImageSize(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * An image or document field: upload to the media store, or paste a URL or
 * site path (`/publikasi/foto.jpg`). Images preview and report their pixel size
 * so image blocks can reserve layout space.
 */
export function AssetInput({
  kind,
  value,
  onChange,
  id,
}: {
  kind: 'image' | 'file';
  value: string;
  onChange: (src: string, meta?: AssetMeta) => void;
  id?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const meta: AssetMeta = {};
      if (kind === 'image') {
        const local = URL.createObjectURL(file);
        try {
          Object.assign(meta, await readImageSize(local));
        } finally {
          URL.revokeObjectURL(local);
        }
      }
      const asset = await uploadPublicationAsset(file);
      onChange(asset.url, { ...meta, size: asset.size });
      toast.success(`${asset.name} diunggah`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal mengunggah berkas.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div className="space-y-2">
      {value && kind === 'image' && (
        // eslint-disable-next-line @next/next/no-img-element -- preview of arbitrary hosts
        <img
          src={value}
          alt=""
          className="max-h-48 w-auto rounded-md border bg-muted object-contain"
          onLoad={(event) => {
            const { naturalWidth: width, naturalHeight: height } = event.currentTarget;
            onChange(value, { width, height });
          }}
        />
      )}
      {value && kind === 'file' && (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-primary hover:underline underline-offset-4"
        >
          <HugeiconsIcon icon={File01Icon} size={16} />
          {decodeURIComponent(value.split('/').pop() || value)}
        </a>
      )}
      <div className="flex gap-2">
        <Input
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={kind === 'image' ? 'URL gambar atau unggah…' : 'URL berkas atau unggah…'}
        />
        <input
          ref={inputRef}
          type="file"
          hidden
          accept={kind === 'image' ? 'image/jpeg,image/png,image/webp,image/gif' : '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx'}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void handleFile(file);
          }}
        />
        <Button
          type="button"
          variant="outline"
          className="shrink-0 gap-2"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? <Spinner /> : <HugeiconsIcon icon={Upload01Icon} size={16} />}
          Unggah
        </Button>
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0"
            aria-label="Hapus"
            onClick={() => onChange('', { size: '' })}
          >
            <HugeiconsIcon icon={Cancel01Icon} size={16} />
          </Button>
        )}
      </div>
    </div>
  );
}
