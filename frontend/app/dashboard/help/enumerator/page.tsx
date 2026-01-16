'use client';

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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HugeiconsIcon } from "@hugeicons/react"
import {ClipboardIcon,
  CheckmarkCircle02Icon,
  AlertCircleIcon,
  Location01Icon,
  UserIcon,
  FileAttachmentIcon,} from "@hugeicons/core-free-icons";

const checklistItems = {
  before: [
    'Review the survey form thoroughly',
    'Prepare necessary documents and ID',
    'Charge your device fully',
    'Test internet connection',
    'Download offline survey forms (if needed)',
  ],
  during: [
    'Introduce yourself professionally',
    'Explain the purpose of the survey',
    'Request and obtain consent',
    'Follow the survey flow systematically',
    'Ask clarifying questions when needed',
    'Document evidence (photos, documents)',
    'Verify all information provided',
  ],
  after: [
    'Submit the survey promptly',
    'Upload all supporting documents',
    'Note any issues or concerns',
    'Follow up if additional information needed',
    'Review for completeness',
  ],
};

const commonIssues = [
  {
    issue: 'GPS Not Working',
    icon: Location01Icon,
    solutions: [
      'Enable location services in device settings',
      'Move to an open area with clear sky view',
      'Restart the GPS/location service',
      'Manually enter coordinates if GPS fails',
    ],
  },
  {
    issue: 'Service Not in Database',
    icon: FileAttachmentIcon,
    solutions: [
      'Use "Add New Service" form',
      'Provide detailed information about the service',
      'Document the service with photos',
      'Note why it wasn\'t previously registered',
    ],
  },
  {
    issue: 'Respondent Unavailable',
    icon: UserIcon,
    solutions: [
      'Schedule a callback appointment',
      'Leave contact information',
      'Document the attempt in notes',
      'Try alternative contact methods',
    ],
  },
];

export default function EnumeratorPage() {
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
              <BreadcrumbPage>Enumerator Handbook</BreadcrumbPage>
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
          <h1 className="text-2xl font-bold">Enumerator Handbook</h1>
          <p className="text-muted-foreground">
            Quick reference guide for conducting mental health service surveys
          </p>
        </div>

        {/* Checklists */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <HugeiconsIcon icon={ClipboardIcon} size={20} className="text-blue-600" />
                Before Starting
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {checklistItems.before.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} className="text-blue-600 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <HugeiconsIcon icon={ClipboardIcon} size={20} className="text-green-600" />
                During Survey
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {checklistItems.during.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} className="text-green-600 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <HugeiconsIcon icon={ClipboardIcon} size={20} className="text-purple-600" />
                After Survey
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {checklistItems.after.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} className="text-purple-600 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Service Details Section */}
        <Card>
          <CardHeader>
            <CardTitle>Key Information to Collect</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Basic Information</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Service name and type</li>
                  <li>• Complete address and location</li>
                  <li>• Contact information (phone, email)</li>
                  <li>• GPS coordinates</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Service Details</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Services provided (MTC/BSIC classification)</li>
                  <li>• Operating hours and schedule</li>
                  <li>• Available resources and capacity</li>
                  <li>• Target populations served</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Quality Checks</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Verify GPS coordinates accuracy</li>
                  <li>• Validate contact details</li>
                  <li>• Confirm service classifications</li>
                  <li>• Ensure all required fields complete</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Documentation</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Photos of facility (exterior/interior)</li>
                  <li>• Supporting documents</li>
                  <li>• License or certification copies</li>
                  <li>• Contact person details</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Common Issues */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Common Issues & Solutions</h2>
          <div className="grid gap-4">
            {commonIssues.map((item, idx) => {
              return (
                <Card key={idx}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-orange-100">
                        <HugeiconsIcon icon={item.icon} size={16} className="text-orange-600" />
                      </div>
                      {item.issue}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {item.solutions.map((solution, sidx) => (
                        <li key={sidx} className="flex items-start gap-2 text-sm">
                          <HugeiconsIcon icon={AlertCircleIcon} size={16} className="text-orange-600 shrink-0 mt-0.5" />
                          <span>{solution}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Best Practices */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">Best Practices</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start gap-2">
                <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} className="shrink-0 mt-0.5" />
                <span>Always be professional and respectful with respondents</span>
              </li>
              <li className="flex items-start gap-2">
                <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} className="shrink-0 mt-0.5" />
                <span>Verify information from multiple sources when possible</span>
              </li>
              <li className="flex items-start gap-2">
                <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} className="shrink-0 mt-0.5" />
                <span>Take clear, well-lit photos for documentation</span>
              </li>
              <li className="flex items-start gap-2">
                <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} className="shrink-0 mt-0.5" />
                <span>Submit surveys on the same day whenever possible</span>
              </li>
              <li className="flex items-start gap-2">
                <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} className="shrink-0 mt-0.5" />
                <span>Keep detailed notes for any unusual situations</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
