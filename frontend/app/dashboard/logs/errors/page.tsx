'use client';

import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { HugeiconsIcon } from "@hugeicons/react"
import {AlertCircleIcon,
  Alert02Icon,
  InformationCircleIcon,
  Search01Icon,
  Download01Icon,
  CodeIcon,
  RefreshIcon,
  MoreHorizontalIcon,
  Tick02Icon,
  Copy01Icon,
  Delete01Icon,} from "@hugeicons/core-free-icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';

// Mock error logs
const mockErrorLogs = [
  {
    id: 1,
    timestamp: '2025-12-15 14:32:15',
    level: 'ERROR',
    source: 'Backend API',
    endpoint: '/api/directory/services/',
    errorCode: '500',
    message: 'Database connection timeout',
    stackTrace: 'psycopg2.OperationalError: could not connect to server: Connection timed out',
    user: 'Ahmad Rizki',
    ipAddress: '192.168.1.105',
    resolved: false,
  },
  {
    id: 2,
    timestamp: '2025-12-15 14:28:30',
    level: 'WARNING',
    source: 'Frontend',
    endpoint: '/dashboard/survey',
    errorCode: '429',
    message: 'Rate limit exceeded',
    stackTrace: 'Too many requests from IP 192.168.1.100',
    user: 'Dr. Siti Nurhaliza',
    ipAddress: '192.168.1.100',
    resolved: true,
  },
  {
    id: 3,
    timestamp: '2025-12-15 14:15:45',
    level: 'ERROR',
    source: 'Authentication',
    endpoint: '/api/accounts/auth/login/',
    errorCode: '401',
    message: 'Invalid credentials',
    stackTrace: 'AuthenticationError: Invalid email or password',
    user: 'eko.prasetyo@atlaskeswa.id',
    ipAddress: '192.168.1.120',
    resolved: false,
  },
  {
    id: 4,
    timestamp: '2025-12-15 14:10:20',
    level: 'ERROR',
    source: 'File Upload',
    endpoint: '/api/survey/upload/',
    errorCode: '413',
    message: 'File size exceeds limit',
    stackTrace: 'FileUploadError: File size 15MB exceeds maximum allowed size of 10MB',
    user: 'Budi Santoso',
    ipAddress: '192.168.1.108',
    resolved: true,
  },
  {
    id: 5,
    timestamp: '2025-12-15 13:55:10',
    level: 'WARNING',
    source: 'Data Validation',
    endpoint: '/api/directory/services/1247/',
    errorCode: '400',
    message: 'Invalid coordinate format',
    stackTrace: 'ValidationError: Latitude must be between -90 and 90',
    user: 'Dewi Lestari',
    ipAddress: '192.168.1.112',
    resolved: true,
  },
  {
    id: 6,
    timestamp: '2025-12-15 13:45:00',
    level: 'ERROR',
    source: 'Backend API',
    endpoint: '/api/analytics/dashboard/',
    errorCode: '500',
    message: 'Unhandled exception in view',
    stackTrace: 'TypeError: \'NoneType\' object is not iterable at views.py:142',
    user: 'System',
    ipAddress: '127.0.0.1',
    resolved: false,
  },
  {
    id: 7,
    timestamp: '2025-12-15 13:30:25',
    level: 'INFO',
    source: 'Scheduled Task',
    endpoint: '/api/system/backup/',
    errorCode: '200',
    message: 'Backup task completed with warnings',
    stackTrace: 'Some files skipped due to permissions',
    user: 'System Cron',
    ipAddress: '127.0.0.1',
    resolved: true,
  },
  {
    id: 8,
    timestamp: '2025-12-15 13:15:50',
    level: 'ERROR',
    source: 'Email Service',
    endpoint: '/api/notifications/send/',
    errorCode: '503',
    message: 'SMTP server unavailable',
    stackTrace: 'SMTPException: Unable to connect to smtp.gmail.com:587',
    user: 'System',
    ipAddress: '127.0.0.1',
    resolved: false,
  },
];

const levelColors = {
  ERROR: 'bg-red-100 text-red-800 border-red-200',
  WARNING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  INFO: 'bg-blue-100 text-blue-800 border-blue-200',
};

const levelIcons = {
  ERROR: AlertCircleIcon,
  WARNING: Alert02Icon,
  INFO: InformationCircleIcon,
};

const breadcrumbs = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Logs & Monitoring', href: '/dashboard/logs' },
  { label: 'System Errors' },
];

export default function SystemErrorsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('today');

  const filteredLogs = useMemo(() => {
    return mockErrorLogs.filter((log) => {
      const matchesSearch =
        searchQuery === '' ||
        log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.endpoint.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesLevel = levelFilter === 'all' || log.level === levelFilter;
      const matchesSource = sourceFilter === 'all' || log.source === sourceFilter;
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'resolved' && log.resolved) ||
        (statusFilter === 'unresolved' && !log.resolved);

      return matchesSearch && matchesLevel && matchesSource && matchesStatus;
    });
  }, [searchQuery, levelFilter, sourceFilter, statusFilter]);

  const stats = {
    total: mockErrorLogs.length,
    errors: mockErrorLogs.filter((l) => l.level === 'ERROR').length,
    warnings: mockErrorLogs.filter((l) => l.level === 'WARNING').length,
    resolved: mockErrorLogs.filter((l) => l.resolved).length,
    unresolved: mockErrorLogs.filter((l) => !l.resolved).length,
  };

  return (
    <>
      <PageHeader breadcrumbs={breadcrumbs} />

      <div className="flex flex-1 flex-col gap-4">

        <div className="px-8 pt-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">System Errors</h1>
            <p className="text-muted-foreground">
              Monitor error dan warning dalam sistem
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <HugeiconsIcon icon={RefreshIcon} size={16} className="mr-2" />
              Refresh
            </Button>
            <Button>
              <HugeiconsIcon icon={Download01Icon} size={16} className="mr-2" />
              Export Logs
            </Button>
          </div>
        </div>

        <Separator />

        <div className="flex flex-col gap-4 px-8 pb-8">

        {/* Statistics */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Logs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground mt-1">Hari ini</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-red-600">Errors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.errors}</div>
              <p className="text-xs text-muted-foreground mt-1">Perlu penanganan</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-yellow-600">Warnings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.warnings}</div>
              <p className="text-xs text-muted-foreground mt-1">Perlu perhatian</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-green-600">Resolved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
              <p className="text-xs text-muted-foreground mt-1">Sudah ditangani</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-orange-600">Unresolved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.unresolved}</div>
              <p className="text-xs text-muted-foreground mt-1">Belum ditangani</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-md border">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="h-10 w-44 border-0 rounded-r-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Hari Ini</SelectItem>
                <SelectItem value="yesterday">Kemarin</SelectItem>
                <SelectItem value="week">7 Hari Terakhir</SelectItem>
                <SelectItem value="month">30 Hari Terakhir</SelectItem>
              </SelectContent>
            </Select>
            <div className="w-px h-5 bg-border" />
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="h-10 w-36 border-0 rounded-none">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="ERROR">Error</SelectItem>
                <SelectItem value="WARNING">Warning</SelectItem>
                <SelectItem value="INFO">Info</SelectItem>
              </SelectContent>
            </Select>
            <div className="w-px h-5 bg-border" />
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="h-10 w-40 border-0 rounded-none">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="Backend API">Backend API</SelectItem>
                <SelectItem value="Frontend">Frontend</SelectItem>
                <SelectItem value="Authentication">Authentication</SelectItem>
                <SelectItem value="File Upload">File Upload</SelectItem>
                <SelectItem value="Email Service">Email Service</SelectItem>
              </SelectContent>
            </Select>
            <div className="w-px h-5 bg-border" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-10 w-36 border-0 rounded-l-none">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="unresolved">Unresolved</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-px h-5 bg-border" />
          <div className="relative flex-1 max-w-md">
            <HugeiconsIcon icon={Search01Icon} size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari error, endpoint..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10"
            />
          </div>
        </div>

        {/* Error Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle>System Error Logs</CardTitle>
            <CardDescription>
              Menampilkan {filteredLogs.length} dari {stats.total} error logs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Waktu</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Error Message</TableHead>
                  <TableHead>Endpoint</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => {
                  const levelIcon = levelIcons[log.level as keyof typeof levelIcons];
                  return (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-xs">{log.timestamp}</TableCell>
                      <TableCell>
                        <div
                          className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium ${
                            levelColors[log.level as keyof typeof levelColors]
                          }`}
                        >
                          <HugeiconsIcon icon={levelIcon} size={12} />
                          {log.level}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{log.source}</TableCell>
                      <TableCell className="max-w-xs">
                        <div className="font-medium">{log.message}</div>
                        <div className="text-xs text-muted-foreground mt-1 truncate">{log.stackTrace}</div>
                      </TableCell>
                      <TableCell className="font-mono text-xs max-w-[200px] truncate">
                        {log.endpoint}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.errorCode}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{log.user}</TableCell>
                      <TableCell>
                        {log.resolved ? (
                          <Badge variant="outline-success">
                            Resolved
                          </Badge>
                        ) : (
                          <Badge variant="outline-danger">
                            Unresolved
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              <HugeiconsIcon icon={MoreHorizontalIcon} size={16} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <HugeiconsIcon icon={CodeIcon} size={16} className="mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <HugeiconsIcon icon={Tick02Icon} size={16} className="mr-2" />
                              Mark as Resolved
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <HugeiconsIcon icon={Copy01Icon} size={16} className="mr-2" />
                              Copy Error Message
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              <HugeiconsIcon icon={Delete01Icon} size={16} className="mr-2" />
                              Delete Log
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
              </div>
        </div>
    </>
  );
}
