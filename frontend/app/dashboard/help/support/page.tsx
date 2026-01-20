'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
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
  open: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  resolved: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-800',
};

const priorityColors = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
};

const breadcrumbs = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Help & Documentation', href: '/dashboard/help' },
  { label: 'Contact Support' },
];

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
      <PageHeader breadcrumbs={breadcrumbs} />

      <div className="flex flex-1 flex-col gap-6 p-8">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold">Contact Support</h1>
          <p className="text-muted-foreground">
            Get help from our support team
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - New Ticket Form */}
          <div className="lg:col-span-2">
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold mb-1">Submit a Support Request</h2>
                <p className="text-sm text-muted-foreground">
                  Fill out the form below and our team will get back to you as soon as possible
                </p>
              </div>

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
                  Submit Request
                </Button>
              </form>
            </div>
          </div>

          {/* Right Column - Contact Info & My Tickets */}
          <div className="space-y-6">
            {/* Contact Information */}
            <div className="space-y-3">
              <h2 className="text-lg font-semibold">Contact Information</h2>
              <div className="space-y-3 text-sm">
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
              </div>
            </div>

            {/* My Tickets */}
            <div className="space-y-3">
              <h2 className="text-lg font-semibold">My Recent Tickets</h2>
              <div className="space-y-3">
                {myTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-medium text-sm line-clamp-1">{ticket.subject}</h4>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant="outline"
                        className={statusColors[ticket.status as keyof typeof statusColors]}
                      >
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
              </div>
            </div>
          </div>
        </div>

        {/* Need Help? */}
        <div className="bg-blue-50 rounded-lg p-6">
          <h3 className="text-blue-900 font-semibold mb-1">Butuh Bantuan?</h3>
          <p className="text-sm text-blue-700 mb-4">
            Tips untuk mendapatkan respon lebih cepat
          </p>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>• Periksa bagian FAQ terlebih dahulu - pertanyaan Anda mungkin sudah terjawab</li>
            <li>• Berikan informasi detail termasuk pesan error dan screenshot jika ada</li>
            <li>• Sertakan langkah-langkah untuk mereproduksi masalah jika bersifat teknis</li>
            <li>• Pilih prioritas yang sesuai agar kami dapat merespon lebih cepat</li>
          </ul>
        </div>
      </div>
    </>
  );
}
