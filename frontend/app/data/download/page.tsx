'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { PageHeader, BreadcrumbItemType } from '@/components/page-header';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { HugeiconsIcon } from "@hugeicons/react"
import {Download01Icon,
  FileExportIcon,
  Table01Icon,
  File02Icon,} from "@hugeicons/core-free-icons";

const breadcrumbs: BreadcrumbItemType[] = [
  { label: 'Data Explorer', href: '/data' },
  { label: 'Download Data' },
];

export default function DataDownloadPage() {
  const [dataType, setDataType] = useState('services');
  const [fileFormat, setFileFormat] = useState('csv');
  const [includeInactive, setIncludeInactive] = useState(false);
  const [includeUnverified, setIncludeUnverified] = useState(false);

  const { data: servicesData } = useQuery({
    queryKey: ['services-count'],
    queryFn: () =>
      apiClient.get<{ count: number }>('/directory/services/', {
        page_size: 1,
      }),
  });

  const { data: surveysData } = useQuery({
    queryKey: ['surveys-count'],
    queryFn: () =>
      apiClient.get<{ count: number }>('/surveys/surveys/', {
        page_size: 1,
      }),
  });

  const handleDownload = () => {
    // In a real implementation, this would trigger an API call to generate and download the file
    alert(
      `Downloading ${dataType} data as ${fileFormat.toUpperCase()}\n\nOptions:\n- Include inactive: ${includeInactive}\n- Include unverified: ${includeUnverified}`
    );
  };

  return (
    <div className="flex flex-col">
      <PageHeader breadcrumbs={breadcrumbs} />

      <div className="flex-1 p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Download Data</h1>
          <p className="text-muted-foreground mt-1">
            Export data for offline analysis and reporting
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm text-muted-foreground">Total Services</div>
            <div className="text-2xl font-bold">{servicesData?.count || 0}</div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm text-muted-foreground">Total Surveys</div>
            <div className="text-2xl font-bold">{surveysData?.count || 0}</div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm text-muted-foreground">Export Formats</div>
            <div className="text-2xl font-bold">3</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Export Configuration</CardTitle>
              <CardDescription>Select data and format options</CardDescription>
            </CardHeader>
            <Separator />
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="dataType">Data Type</Label>
                <Select value={dataType} onValueChange={setDataType}>
                  <SelectTrigger id="dataType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="services">
                      <div className="flex items-center gap-2">
                        <HugeiconsIcon icon={Table01Icon} size={16} />
                        Services Directory
                      </div>
                    </SelectItem>
                    <SelectItem value="surveys">
                      <div className="flex items-center gap-2">
                        <HugeiconsIcon icon={File02Icon} size={16} />
                        Survey Data
                      </div>
                    </SelectItem>
                    <SelectItem value="mtc-matrix">
                      <div className="flex items-center gap-2">
                        <HugeiconsIcon icon={Table01Icon} size={16} />
                        MTC Matrix
                      </div>
                    </SelectItem>
                    <SelectItem value="coverage">
                      <div className="flex items-center gap-2">
                        <HugeiconsIcon icon={FileExportIcon} size={16} />
                        Coverage Analysis
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fileFormat">File Format</Label>
                <Select value={fileFormat} onValueChange={setFileFormat}>
                  <SelectTrigger id="fileFormat">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV (Comma Separated)</SelectItem>
                    <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <Label>Filter Options</Label>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeInactive"
                    checked={includeInactive}
                    onCheckedChange={(checked) =>
                      setIncludeInactive(checked === true)
                    }
                  />
                  <label
                    htmlFor="includeInactive"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Include inactive services
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeUnverified"
                    checked={includeUnverified}
                    onCheckedChange={(checked) =>
                      setIncludeUnverified(checked === true)
                    }
                  />
                  <label
                    htmlFor="includeUnverified"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Include unverified data
                  </label>
                </div>
              </div>

              <Button onClick={handleDownload} className="w-full" size="lg">
                <HugeiconsIcon icon={Download01Icon} size={20} className="mr-2" />
                Download Data
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Available Datasets</CardTitle>
              <CardDescription>Quick download options</CardDescription>
            </CardHeader>
            <Separator />
            <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="h-auto py-4 justify-start bg-blue-50 hover:bg-blue-100 border-blue-200"
                    onClick={() => {
                      setDataType('services');
                      setFileFormat('csv');
                    }}
                  >
                    <HugeiconsIcon icon={Table01Icon} size={20} className="mr-2 text-blue-600" />
                    <div className="flex-1 text-left">
                      <div className="font-medium">All Services</div>
                      <div className="text-xs text-muted-foreground">
                        Complete service directory
                      </div>
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    className="h-auto py-4 justify-start bg-green-50 hover:bg-green-100 border-green-200"
                    onClick={() => {
                      setDataType('surveys');
                      setFileFormat('xlsx');
                    }}
                  >
                    <HugeiconsIcon icon={File02Icon} size={20} className="mr-2 text-green-600" />
                    <div className="flex-1 text-left">
                      <div className="font-medium">Survey Results</div>
                      <div className="text-xs text-muted-foreground">
                        All survey responses and data
                      </div>
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    className="h-auto py-4 justify-start bg-purple-50 hover:bg-purple-100 border-purple-200"
                    onClick={() => {
                      setDataType('mtc-matrix');
                      setFileFormat('xlsx');
                    }}
                  >
                    <HugeiconsIcon icon={Table01Icon} size={20} className="mr-2 text-purple-600" />
                    <div className="flex-1 text-left">
                      <div className="font-medium">MTC Classification Matrix</div>
                      <div className="text-xs text-muted-foreground">
                        MTC × BSIC distribution
                      </div>
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    className="h-auto py-4 justify-start bg-orange-50 hover:bg-orange-100 border-orange-200"
                    onClick={() => {
                      setDataType('coverage');
                      setFileFormat('csv');
                    }}
                  >
                    <HugeiconsIcon icon={FileExportIcon} size={20} className="mr-2 text-orange-600" />
                    <div className="flex-1 text-left">
                      <div className="font-medium">Geographic Coverage</div>
                      <div className="text-xs text-muted-foreground">
                        Province and city analysis
                      </div>
                    </div>
                  </Button>
                </div>

                <div className="pt-4 mt-4 border-t">
                  <h4 className="text-sm font-semibold mb-2">Data Usage Guidelines</h4>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Data is exported as of current date</li>
                    <li>• Verify data accuracy before official use</li>
                    <li>• Respect data privacy and security policies</li>
                    <li>• Attribution required for public reports</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
