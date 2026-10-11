'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { HugeiconsIcon } from '@hugeicons/react';
import { Pdf01Icon, Xls01Icon } from '@hugeicons/core-free-icons';
import { Button } from '@/components/ui/button';
import { type SurveyLocationDetail } from '@/hooks/use-survey-responses';
import { buildLocationReport, reportFileName } from '@/lib/location-report';

type Format = 'pdf' | 'xlsx';

function saveBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/**
 * Downloads the location report as PDF or XLSX. Both are built in the browser
 * from the same report the page renders; the generators are imported on click
 * so the profile does not carry them.
 */
export function LocationReportDownloads({ location }: { location: SurveyLocationDetail }) {
  const [busy, setBusy] = useState<Format | null>(null);

  async function download(format: Format) {
    setBusy(format);
    try {
      const report = buildLocationReport(location);
      const origin = window.location.origin;
      const blob =
        format === 'pdf'
          ? await (await import('@/lib/location-report-pdf')).locationReportPdf(report, {
              assetBase: origin,
              url: `${origin}/lokasi/${location.id}`,
            })
          : await (await import('@/lib/location-report-xlsx')).locationReportXlsx(report);
      saveBlob(blob, reportFileName(report, format));
    } catch (error) {
      console.error(error);
      toast.error('Laporan gagal dibuat. Coba lagi.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" className="gap-2" disabled={busy !== null} onClick={() => download('pdf')}>
        <HugeiconsIcon icon={Pdf01Icon} size={16} />
        {busy === 'pdf' ? 'Menyiapkan…' : 'Unduh PDF'}
      </Button>
      <Button variant="outline" size="sm" className="gap-2" disabled={busy !== null} onClick={() => download('xlsx')}>
        <HugeiconsIcon icon={Xls01Icon} size={16} />
        {busy === 'xlsx' ? 'Menyiapkan…' : 'Unduh XLSX'}
      </Button>
    </div>
  );
}
