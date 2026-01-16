'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { PDFDownloadLink } from '@react-pdf/renderer';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { DateTime } from '@/components/date-time';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { HugeiconsIcon } from "@hugeicons/react"
import {Download01Icon,
  FileDownloadIcon,
  Pdf01Icon,
  Xls01Icon,
  Csv01Icon,
  CheckmarkCircle02Icon,} from "@hugeicons/core-free-icons";
import { ServiceAvailabilityPDF } from '@/lib/pdf-generator';
import { apiClient } from '@/lib/api-client';

const REPORT_TYPES = [
  {
    id: 'service-availability',
    name: 'Service Availability Report',
    description: 'Comprehensive overview of mental health service availability',
    icon: FileDownloadIcon,
  },
  {
    id: 'mtc-distribution',
    name: 'MTC Distribution Report',
    description: 'Analysis of Main Type of Care categories',
    icon: FileDownloadIcon,
  },
  {
    id: 'regional-comparison',
    name: 'Regional Comparison Report',
    description: 'Compare metrics across provinces',
    icon: FileDownloadIcon,
  },
  {
    id: 'workforce-capacity',
    name: 'Workforce & Capacity Report',
    description: 'Workforce distribution and service capacity analysis',
    icon: FileDownloadIcon,
  },
  {
    id: 'facility-profiling',
    name: 'Facility Profiling Report',
    description: 'Detailed facility profiles and characteristics',
    icon: FileDownloadIcon,
  },
  {
    id: 'raw-data',
    name: 'Raw Service Data',
    description: 'Complete dataset of all services',
    icon: FileDownloadIcon,
  },
];

const EXPORT_FORMATS = [
  { id: 'pdf', name: 'PDF Document', icon: Pdf01Icon, color: 'text-red-600' },
  { id: 'excel', name: 'Excel Spreadsheet', icon: Xls01Icon, color: 'text-green-600' },
  { id: 'csv', name: 'CSV File', icon: Csv01Icon, color: 'text-blue-600' },
];

export default function ExportReportPage() {
  const [selectedReports, setSelectedReports] = useState<string[]>(['service-availability']);
  const [exportFormat, setExportFormat] = useState<string>('pdf');
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeSummary, setIncludeSummary] = useState(true);
  const [includeRawData, setIncludeRawData] = useState(false);
  const [dateRange, setDateRange] = useState<string>('all');
  const [province, setProvince] = useState<string>('all');
  const [isExporting, setIsExporting] = useState(false);

  const toggleReport = (reportId: string) => {
    setSelectedReports((prev) =>
      prev.includes(reportId) ? prev.filter((id) => id !== reportId) : [...prev, reportId]
    );
  };

  const handleExport = async () => {
    setIsExporting(true);

    try {
      if (exportFormat === 'excel') {
        // Download Excel from backend
        const params = new URLSearchParams({
          province: province !== 'all' ? province : '',
          mtc: 'all',
          status: 'all',
        });

        // Use fetch to download file
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/analytics/export/services/excel/?${params}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('access_token')}`,
            },
          }
        );

        if (!response.ok) throw new Error('Export failed');

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `atlaskeswa-services-export-${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else if (exportFormat === 'csv') {
        // Download CSV from backend
        const params = new URLSearchParams({
          province: province !== 'all' ? province : '',
          mtc: 'all',
          status: 'all',
        });

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/analytics/export/services/csv/?${params}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('access_token')}`,
            },
          }
        );

        if (!response.ok) throw new Error('Export failed');

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `atlaskeswa-services-export-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
      // PDF is handled by PDFDownloadLink component
    } catch (error) {
      console.error('Export error:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const provinces = [
    'all',
    'DKI Jakarta',
    'Jawa Barat',
    'Jawa Tengah',
    'Jawa Timur',
    'Sumatera Utara',
    'Sumatera Barat',
    'Sulawesi Selatan',
    'Bali',
  ];

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/reports">Reports & Analytics</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Export & Download</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="ml-auto">
          <DateTime />
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-6">
        <div>
          <h1 className="text-2xl font-bold">Export & Download Reports</h1>
          <p className="text-muted-foreground">
            Generate and download comprehensive reports in various formats
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Left Column - Report Selection */}
          <div className="lg:col-span-2 space-y-4">
            {/* Select Reports */}
            <Card>
              <CardHeader>
                <CardTitle>Select Reports to Export</CardTitle>
                <CardDescription>Choose one or more reports to include in your export</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {REPORT_TYPES.map((report) => (
                    <div
                      key={report.id}
                      className={`flex items-start gap-3 rounded-lg border p-4 cursor-pointer transition-colors ${
                        selectedReports.includes(report.id) ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                      }`}
                      onClick={() => toggleReport(report.id)}
                    >
                      <Checkbox
                        checked={selectedReports.includes(report.id)}
                        onCheckedChange={() => toggleReport(report.id)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <HugeiconsIcon icon={report.icon} size={16} className="text-muted-foreground" />
                          <span className="font-semibold">{report.name}</span>
                          {selectedReports.includes(report.id) && (
                            <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} className="text-primary ml-auto" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{report.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Export Options */}
            <Card>
              <CardHeader>
                <CardTitle>Export Options</CardTitle>
                <CardDescription>Customize your report export</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Include Options */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">Include in Report</Label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="include-charts"
                        checked={includeCharts}
                        onCheckedChange={(checked) => setIncludeCharts(checked as boolean)}
                      />
                      <Label htmlFor="include-charts" className="font-normal cursor-pointer">
                        Charts and visualizations
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="include-summary"
                        checked={includeSummary}
                        onCheckedChange={(checked) => setIncludeSummary(checked as boolean)}
                      />
                      <Label htmlFor="include-summary" className="font-normal cursor-pointer">
                        Executive summary
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="include-raw-data"
                        checked={includeRawData}
                        onCheckedChange={(checked) => setIncludeRawData(checked as boolean)}
                      />
                      <Label htmlFor="include-raw-data" className="font-normal cursor-pointer">
                        Raw data tables
                      </Label>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Filters */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">Data Filters</Label>

                  <div className="space-y-2">
                    <Label htmlFor="date-range" className="text-sm">Date Range</Label>
                    <Select value={dateRange} onValueChange={setDateRange}>
                      <SelectTrigger id="date-range">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Time</SelectItem>
                        <SelectItem value="last-30">Last 30 Days</SelectItem>
                        <SelectItem value="last-90">Last 90 Days</SelectItem>
                        <SelectItem value="last-year">Last Year</SelectItem>
                        <SelectItem value="ytd">Year to Date</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="province" className="text-sm">Province</Label>
                    <Select value={province} onValueChange={setProvince}>
                      <SelectTrigger id="province">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Provinces</SelectItem>
                        {provinces.slice(1).map((prov) => (
                          <SelectItem key={prov} value={prov}>
                            {prov}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Format Selection & Export */}
          <div className="space-y-4">
            {/* Export Format */}
            <Card>
              <CardHeader>
                <CardTitle>Export Format</CardTitle>
                <CardDescription>Choose your preferred file format</CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup value={exportFormat} onValueChange={setExportFormat}>
                  <div className="space-y-3">
                    {EXPORT_FORMATS.map((format) => (
                      <div
                        key={format.id}
                        className={`flex items-center gap-3 rounded-lg border p-4 cursor-pointer transition-colors ${
                          exportFormat === format.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                        }`}
                        onClick={() => setExportFormat(format.id)}
                      >
                        <RadioGroupItem value={format.id} id={format.id} />
                        <Label htmlFor={format.id} className="flex items-center gap-2 cursor-pointer flex-1">
                          <HugeiconsIcon icon={format.icon} size={20} className={format.color} />
                          <span className="font-medium">{format.name}</span>
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Export Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Export Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Selected Reports</span>
                  <Badge variant="outline">{selectedReports.length}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Export Format</span>
                  <Badge variant="outline">{exportFormat.toUpperCase()}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Include Charts</span>
                  <Badge variant={includeCharts ? 'default' : 'secondary'}>
                    {includeCharts ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Include Summary</span>
                  <Badge variant={includeSummary ? 'default' : 'secondary'}>
                    {includeSummary ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <Separator />
                {exportFormat === 'pdf' ? (
                  <PDFDownloadLink
                    document={
                      <ServiceAvailabilityPDF
                        filters={{
                          province: province !== 'all' ? province : null,
                          mtc: null,
                        }}
                      />
                    }
                    fileName={`atlaskeswa-report-${new Date().toISOString().split('T')[0]}.pdf`}
                    className="w-full"
                  >
                    {({ loading }) => (
                      <Button
                        disabled={selectedReports.length === 0 || loading}
                        className="w-full"
                        size="lg"
                      >
                        {loading ? (
                          <>
                            <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            Generating PDF...
                          </>
                        ) : (
                          <>
                            <HugeiconsIcon icon={Download01Icon} size={16} className="mr-2" />
                            Export Reports
                          </>
                        )}
                      </Button>
                    )}
                  </PDFDownloadLink>
                ) : (
                  <Button
                    onClick={handleExport}
                    disabled={selectedReports.length === 0 || isExporting}
                    className="w-full"
                    size="lg"
                  >
                    {isExporting ? (
                      <>
                        <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Generating Report...
                      </>
                    ) : (
                      <>
                        <HugeiconsIcon icon={Download01Icon} size={16} className="mr-2" />
                        Export Reports
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Quick Export Shortcuts */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Export</CardTitle>
                <CardDescription>Pre-configured exports for common needs</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    setSelectedReports(['service-availability']);
                    setExportFormat('pdf');
                    setIncludeCharts(true);
                    setIncludeSummary(true);
                  }}
                >
                  <HugeiconsIcon icon={FileDownloadIcon} size={16} className="mr-2" />
                  Executive Summary (PDF)
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    setSelectedReports(['raw-data']);
                    setExportFormat('excel');
                    setIncludeCharts(false);
                    setIncludeRawData(true);
                  }}
                >
                  <HugeiconsIcon icon={Xls01Icon} size={16} className="mr-2 text-green-600" />
                  Data Export (Excel)
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    setSelectedReports(REPORT_TYPES.map((r) => r.id));
                    setExportFormat('pdf');
                    setIncludeCharts(true);
                    setIncludeSummary(true);
                  }}
                >
                  <HugeiconsIcon icon={Pdf01Icon} size={16} className="mr-2 text-red-600" />
                  Complete Report Package
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
