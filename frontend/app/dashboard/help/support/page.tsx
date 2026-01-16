'use client';

import { useState } from 'react';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { HugeiconsIcon } from "@hugeicons/react"
import {Mail01Icon,
  HelpCircleIcon,
  MailSend01Icon,
  CheckmarkCircle02Icon,
  Clock01Icon,} from "@hugeicons/core-free-icons";

const myTickets = [
  {
    id: 1,
    subject: 'Unable to upload survey documents',
    status: 'in_progress',
    priority: 'high',
    created_at: '2025-12-15 10:30:00',
    replies_count: 2,
  },
  {
    id: 2,
    subject: 'Question about DESDE-LTC classification',
    status: 'resolved',
    priority: 'medium',
    created_at: '2025-12-14 14:20:00',
    replies_count: 3,
  },
];

const statusColors = {
  open: 'bg-blue-100 text-blue-800 border-blue-200',
  in_progress: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  resolved: 'bg-green-100 text-green-800 border-green-200',
  closed: 'bg-gray-100 text-gray-800 border-gray-200',
};

const priorityColors = {
  low: 'bg-gray-100 text-gray-800 border-gray-200',
  medium: 'bg-blue-100 text-blue-800 border-blue-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  urgent: 'bg-red-100 text-red-800 border-red-200',
};

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
              <BreadcrumbLink href="/dashboard/help">Help & Documentation</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Contact Support</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="ml-auto">
          <DateTime />
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold">Contact Support</h1>
          <p className="text-muted-foreground">
            Get help from our support team
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {/* Left Column - New Ticket Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HugeiconsIcon icon={Mail01Icon} size={20} />
                  Submit a Support Request
                </CardTitle>
                <CardDescription>
                  Fill out the form below and our team will get back to you as soon as possible
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject *</Label>
                    <Input
                      id="subject"
                      placeholder="Brief description of your issue"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="category">Category *</Label>
                      <Select value={category} onValueChange={(value) => value && setCategory(value)} required>
                        <SelectTrigger id="category">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="technical">Technical Issue</SelectItem>
                          <SelectItem value="account">Account & Access</SelectItem>
                          <SelectItem value="survey">Survey Related</SelectItem>
                          <SelectItem value="data">Data & Reports</SelectItem>
                          <SelectItem value="classification">DESDE-LTC Classification</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="priority">Priority *</Label>
                      <Select value={priority} onValueChange={(value) => value && setPriority(value)} required>
                        <SelectTrigger id="priority">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      placeholder="Please provide as much detail as possible about your issue..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={6}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Include any error messages, steps to reproduce, or screenshots if applicable
                    </p>
                  </div>

                  <Button type="submit" className="w-full">
                    <HugeiconsIcon icon={MailSend01Icon} size={16} className="mr-2" />
                    Submit Request
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Contact Info & My Tickets */}
          <div className="space-y-4">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <div className="font-medium mb-1">Email</div>
                  <a href="mailto:support@atlaskeswa.id" className="text-primary hover:underline">
                    support@atlaskeswa.id
                  </a>
                </div>
                <div>
                  <div className="font-medium mb-1">Response Time</div>
                  <p className="text-muted-foreground">
                    We typically respond within 24 hours on business days
                  </p>
                </div>
                <div>
                  <div className="font-medium mb-1">Support Hours</div>
                  <p className="text-muted-foreground">
                    Monday - Friday<br />
                    9:00 AM - 5:00 PM (GMT+7)
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* My Tickets */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <HugeiconsIcon icon={HelpCircleIcon} size={16} />
                  My Recent Tickets
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {myTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-medium text-sm line-clamp-1">{ticket.subject}</h4>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant="outline"
                        className={statusColors[ticket.status as keyof typeof statusColors]}
                      >
                        {ticket.status === 'in_progress' ? (
                          <HugeiconsIcon icon={Clock01Icon} size={12} className="mr-1" />
                        ) : (
                          <HugeiconsIcon icon={CheckmarkCircle02Icon} size={12} className="mr-1" />
                        )}
                        {ticket.status.replace('_', ' ')}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={priorityColors[ticket.priority as keyof typeof priorityColors]}
                      >
                        {ticket.priority}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {ticket.replies_count} replies
                      </span>
                    </div>
                  </div>
                ))}
                <Button variant="outline" className="w-full" size="sm">
                  View All Tickets
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Need Help? */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900 text-base flex items-center gap-2">
              <HugeiconsIcon icon={HelpCircleIcon} size={20} />
              Butuh Bantuan?
            </CardTitle>
            <CardDescription className="text-blue-700">
              Tips untuk mendapatkan respon lebih cepat
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start gap-2">
                <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} className="shrink-0 mt-0.5" />
                <span>Periksa bagian FAQ terlebih dahulu - pertanyaan Anda mungkin sudah terjawab</span>
              </li>
              <li className="flex items-start gap-2">
                <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} className="shrink-0 mt-0.5" />
                <span>Berikan informasi detail termasuk pesan error dan screenshot jika ada</span>
              </li>
              <li className="flex items-start gap-2">
                <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} className="shrink-0 mt-0.5" />
                <span>Sertakan langkah-langkah untuk mereproduksi masalah jika bersifat teknis</span>
              </li>
              <li className="flex items-start gap-2">
                <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} className="shrink-0 mt-0.5" />
                <span>Pilih prioritas yang sesuai agar kami dapat merespon lebih cepat</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
