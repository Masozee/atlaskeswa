'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { PageHeader, BreadcrumbItemType } from '@/components/page-header';
import { Separator } from '@/components/ui/separator';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Service {
  id: number;
  name: string;
  city: string;
  province: string;
  mtc_code: string;
  mtc_name: string;
  bsic_code: string;
  bsic_name: string;
  bed_capacity: number;
  total_professional_staff: number;
}

const breadcrumbs: BreadcrumbItemType[] = [
  { label: 'Data Explorer', href: '/data' },
  { label: 'MTC Matrix View' },
];

export default function MTCMatrixPage() {
  const { data: servicesData } = useQuery({
    queryKey: ['mtc-matrix-services'],
    queryFn: () =>
      apiClient.get<{ count: number; results: Service[] }>(
        '/directory/services/',
        {
          page_size: 500,
        }
      ),
  });

  const { data: mtcData } = useQuery({
    queryKey: ['mtc-list'],
    queryFn: () =>
      apiClient.get<{ count: number; results: any[] }>('/directory/mtc/', {
        page_size: 100,
      }),
  });

  const { data: bsicData } = useQuery({
    queryKey: ['bsic-list'],
    queryFn: () =>
      apiClient.get<{ count: number; results: any[] }>('/directory/bsic/', {
        page_size: 100,
      }),
  });

  // Create MTC x BSIC matrix
  const matrix = useMemo(() => {
    if (!servicesData?.results || !mtcData?.results || !bsicData?.results)
      return null;

    const mtcCodes = mtcData.results.map((m) => ({
      code: m.code,
      name: m.name,
    }));
    const bsicCodes = bsicData.results.map((b) => ({
      code: b.code,
      name: b.name,
    }));

    // Count services for each MTC x BSIC combination
    const counts: Record<string, number> = {};
    servicesData.results.forEach((service) => {
      const key = `${service.mtc_code}-${service.bsic_code}`;
      counts[key] = (counts[key] || 0) + 1;
    });

    return {
      mtcCodes,
      bsicCodes,
      counts,
    };
  }, [servicesData, mtcData, bsicData]);

  // Province distribution
  const provinceDistribution = useMemo(() => {
    if (!servicesData?.results) return [];

    const distribution: Record<string, any> = {};
    servicesData.results.forEach((service) => {
      if (!distribution[service.province]) {
        distribution[service.province] = {
          province: service.province,
          total: 0,
          withBeds: 0,
          totalBeds: 0,
          totalStaff: 0,
        };
      }

      distribution[service.province].total++;
      if (service.bed_capacity > 0) {
        distribution[service.province].withBeds++;
      }
      distribution[service.province].totalBeds += service.bed_capacity;
      distribution[service.province].totalStaff += service.total_professional_staff;
    });

    return Object.values(distribution).sort(
      (a: any, b: any) => b.total - a.total
    );
  }, [servicesData]);

  const getCellColor = (count: number) => {
    if (count === 0) return 'bg-gray-50';
    if (count <= 2) return 'bg-blue-100';
    if (count <= 5) return 'bg-blue-300';
    if (count <= 10) return 'bg-blue-500 text-white';
    return 'bg-blue-700 text-white';
  };

  return (
    <div className="flex flex-col">
      <PageHeader breadcrumbs={breadcrumbs} />

      <div className="flex-1 p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">MTC Matrix View</h1>
          <p className="text-muted-foreground mt-1">
            Service distribution across Main Type of Care and Basic Service
            Implementation Categories
          </p>
        </div>

        {matrix && (
          <Card>
            <CardHeader>
              <CardTitle>MTC × BSIC Matrix</CardTitle>
              <CardDescription>
                Number of services by classification (darker = more services)
              </CardDescription>
            </CardHeader>
            <Separator />
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-bold">MTC \ BSIC</TableHead>
                      {matrix.bsicCodes.map((bsic) => (
                        <TableHead
                          key={bsic.code}
                          className="text-center font-bold"
                        >
                          <div>{bsic.code}</div>
                          <div className="text-xs font-normal text-muted-foreground">
                            {bsic.name}
                          </div>
                        </TableHead>
                      ))}
                      <TableHead className="text-center font-bold">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {matrix.mtcCodes.map((mtc) => {
                      const rowTotal = matrix.bsicCodes.reduce(
                        (sum, bsic) =>
                          sum + (matrix.counts[`${mtc.code}-${bsic.code}`] || 0),
                        0
                      );

                      return (
                        <TableRow key={mtc.code}>
                          <TableCell className="font-semibold">
                            <div>{mtc.code}</div>
                            <div className="text-xs font-normal text-muted-foreground">
                              {mtc.name}
                            </div>
                          </TableCell>
                          {matrix.bsicCodes.map((bsic) => {
                            const count =
                              matrix.counts[`${mtc.code}-${bsic.code}`] || 0;
                            return (
                              <TableCell
                                key={bsic.code}
                                className={`text-center font-bold ${getCellColor(
                                  count
                                )}`}
                              >
                                {count || '-'}
                              </TableCell>
                            );
                          })}
                          <TableCell className="text-center font-bold bg-gray-100">
                            {rowTotal}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    <TableRow className="bg-gray-100 font-bold">
                      <TableCell>Total</TableCell>
                      {matrix.bsicCodes.map((bsic) => {
                        const colTotal = matrix.mtcCodes.reduce(
                          (sum, mtc) =>
                            sum +
                            (matrix.counts[`${mtc.code}-${bsic.code}`] || 0),
                          0
                        );
                        return (
                          <TableCell key={bsic.code} className="text-center">
                            {colTotal}
                          </TableCell>
                        );
                      })}
                      <TableCell className="text-center bg-gray-200">
                        {servicesData?.count || 0}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Service Distribution by Province</CardTitle>
            <CardDescription>
              Overview of mental health services across provinces
            </CardDescription>
          </CardHeader>
          <Separator />
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Province</TableHead>
                  <TableHead className="text-right">Total Services</TableHead>
                  <TableHead className="text-right">With Beds</TableHead>
                  <TableHead className="text-right">Total Beds</TableHead>
                  <TableHead className="text-right">Total Staff</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {provinceDistribution.map((item: any) => (
                  <TableRow key={item.province}>
                    <TableCell className="font-medium">{item.province}</TableCell>
                    <TableCell className="text-right">{item.total}</TableCell>
                    <TableCell className="text-right">{item.withBeds}</TableCell>
                    <TableCell className="text-right">{item.totalBeds}</TableCell>
                    <TableCell className="text-right">{item.totalStaff}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
