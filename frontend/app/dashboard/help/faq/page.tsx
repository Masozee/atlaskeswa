'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { HugeiconsIcon } from "@hugeicons/react"
import { Search01Icon } from "@hugeicons/core-free-icons";

const faqs = [
  {
    id: 1,
    category: 'General',
    question: 'How do I reset my password?',
    answer: 'To reset your password:\n\n1. Click on "Forgot Password" on the login page\n2. Enter your email address\n3. Check your email for a reset link\n4. Click the link and enter your new password\n\nIf you don\'t receive the email within 5 minutes, check your spam folder or contact support.',
  },
  {
    id: 2,
    category: 'General',
    question: 'What are the different user roles?',
    answer: '**Administrator**: Full system access, can manage all users and settings\n\n**Data Manager**: Can manage services, surveys, and perform verification\n\n**Verifier**: Can verify and approve/reject survey submissions\n\n**Enumerator**: Can submit surveys and manage own submissions\n\n**Viewer**: Read-only access to view data and reports',
  },
  {
    id: 3,
    category: 'DESDE-LTC',
    question: 'How do I classify a service using DESDE-LTC?',
    answer: 'To classify a service:\n\n1. Identify the **Main Type of Care (MTC)**:\n   - R: Residential\n   - D: Day care\n   - O: Outpatient\n   - A: Accessibility\n   - I: Information\n   - W: Work/training\n   - S: Self-help\n\n2. Determine the **specific service type** using the BSIC code\n\n3. Combine them (e.g., R2.1 for psychiatric hospital)\n\nRefer to the DESDE-LTC Reference guide for detailed codes.',
  },
  {
    id: 4,
    category: 'General',
    question: 'How long does the verification process take?',
    answer: 'The verification process typically takes:\n\n- **Standard submissions**: 2-3 business days\n- **Complex submissions**: 5-7 business days\n- **Submissions with issues**: Until issues are resolved\n\nYou\'ll receive email notifications about the status of your submission.',
  },
  {
    id: 5,
    category: 'General',
    question: 'Can I export data from the system?',
    answer: 'Yes! You can export data in several formats:\n\n**Available formats**:\n- PDF reports\n- Excel spreadsheets (.xlsx)\n- CSV files\n\n**To export**:\n1. Navigate to the data you want to export\n2. Click the "Export" button\n3. Select your preferred format\n4. Choose the data range and filters\n5. Click "Download"\n\nExport permissions depend on your user role.',
  },
  {
    id: 6,
    category: 'Services',
    question: 'How do I add a new service to the directory?',
    answer: '1. Navigate to **Services Management** > **Add New Service**\n2. Fill in the required information:\n   - Service name and type\n   - Location and contact details\n   - MTC/BSIC classification\n   - Operating hours\n   - Available resources\n3. Upload supporting documents\n4. Click "Save" or "Submit for Verification"',
  },
  {
    id: 7,
    category: 'Services',
    question: 'What is the difference between MTC and BSIC?',
    answer: '**MTC (Main Types of Care)** is the broad category:\n- R (Residential), D (Day care), O (Outpatient), etc.\n\n**BSIC (Basic Service Identification Code)** is the specific service type:\n- Numbers like 1, 2.1, 3.2 that provide detailed classification within each MTC\n\n**Example**: R2.1 means:\n- R = Residential care (MTC)\n- 2.1 = Specific type of residential facility (BSIC)',
  },
  {
    id: 8,
    category: 'Surveys',
    question: 'What happens if my survey is rejected?',
    answer: 'If your survey is rejected:\n\n1. You\'ll receive an email notification\n2. Check the rejection reason in the system\n3. Review the feedback from the verifier\n4. Make necessary corrections\n5. Resubmit the survey\n\nCommon rejection reasons:\n- Incomplete information\n- Invalid GPS coordinates\n- Missing documentation\n- Incorrect service classification',
  },
  {
    id: 9,
    category: 'Surveys',
    question: 'Can I edit a submitted survey?',
    answer: 'It depends on the survey status:\n\n- **Draft**: Can be edited freely\n- **Submitted/Pending**: Cannot be edited (must be withdrawn first)\n- **Rejected**: Can be edited and resubmitted\n- **Approved**: Cannot be edited (create a new survey for updates)\n\nTo withdraw a pending survey, contact your data manager or admin.',
  },
  {
    id: 10,
    category: 'Technical',
    question: 'Why is the system running slowly?',
    answer: 'Common causes and solutions:\n\n**Slow internet connection**:\n- Check your internet speed\n- Try refreshing the page\n\n**Browser cache**:\n- Clear your browser cache and cookies\n- Try using incognito/private mode\n\n**Large datasets**:\n- Use filters to limit data displayed\n- Export large datasets instead of viewing\n\nIf issues persist, contact technical support.',
  },
  {
    id: 11,
    category: 'Technical',
    question: 'Which browsers are supported?',
    answer: 'Atlas Keswa supports modern browsers:\n\n**Recommended**:\n- Google Chrome (latest version)\n- Mozilla Firefox (latest version)\n- Microsoft Edge (latest version)\n- Safari (latest version)\n\n**Minimum requirements**:\n- JavaScript enabled\n- Cookies enabled\n- Screen resolution: 1024x768 or higher',
  },
];

const breadcrumbs = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Help & Documentation', href: '/dashboard/help' },
  { label: 'FAQ' },
];

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = ['all', ...Array.from(new Set(faqs.map((faq) => faq.category)))];

  const filteredFAQs = faqs.filter((faq) => {
    const matchesSearch =
      searchQuery === '' ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <>
      <PageHeader breadcrumbs={breadcrumbs} />

      <div className="flex flex-1 flex-col gap-6 p-8">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold">Frequently Asked Questions</h1>
          <p className="text-muted-foreground">
            Find answers to common questions about using Atlas Keswa
          </p>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <HugeiconsIcon icon={Search01Icon} size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {categories.map((category) => (
              <Badge
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setSelectedCategory(category)}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </Badge>
            ))}
          </div>
        </div>

        {/* FAQs */}
        {filteredFAQs.length > 0 ? (
          <Accordion type="single" collapsible className="w-full">
            {filteredFAQs.map((faq) => (
              <AccordionItem key={faq.id} value={`faq-${faq.id}`}>
                <AccordionTrigger className="text-left">
                  <span>{faq.question}</span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="pt-2 space-y-2">
                    <Badge variant="outline" className="mb-2">
                      {faq.category}
                    </Badge>
                    <div className="text-sm text-muted-foreground whitespace-pre-line">
                      {faq.answer}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No FAQs found matching your search.
            </p>
          </div>
        )}

        {/* Still have questions */}
        <div className="bg-blue-50 rounded-lg p-6">
          <div className="text-center">
            <h3 className="font-semibold text-blue-900 mb-2">Still have questions?</h3>
            <p className="text-sm text-blue-700 mb-4">
              Can't find what you're looking for? Contact our support team for assistance.
            </p>
            <a
              href="/dashboard/help/support"
              className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Contact Support
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
