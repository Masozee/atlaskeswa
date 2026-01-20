'use client';

import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';

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
    solutions: [
      'Enable location services in device settings',
      'Move to an open area with clear sky view',
      'Restart the GPS/location service',
      'Manually enter coordinates if GPS fails',
    ],
  },
  {
    issue: 'Service Not in Database',
    solutions: [
      'Use "Add New Service" form',
      'Provide detailed information about the service',
      'Document the service with photos',
      'Note why it wasn\'t previously registered',
    ],
  },
  {
    issue: 'Respondent Unavailable',
    solutions: [
      'Schedule a callback appointment',
      'Leave contact information',
      'Document the attempt in notes',
      'Try alternative contact methods',
    ],
  },
];

const breadcrumbs = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Help & Documentation', href: '/dashboard/help' },
  { label: 'Enumerator Handbook' },
];

export default function EnumeratorPage() {
  return (
    <>
      <PageHeader breadcrumbs={breadcrumbs} />

      <div className="flex flex-1 flex-col gap-6 p-8">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold">Enumerator Handbook</h1>
          <p className="text-muted-foreground">
            Quick reference guide for conducting mental health service surveys
          </p>
        </div>

        {/* Checklists */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="p-4 rounded-lg bg-muted/50">
            <h3 className="font-semibold text-base mb-3">Before Starting</h3>
            <ul className="space-y-2">
              {checklistItems.before.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <span className="text-muted-foreground">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-4 rounded-lg bg-muted/50">
            <h3 className="font-semibold text-base mb-3">During Survey</h3>
            <ul className="space-y-2">
              {checklistItems.during.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <span className="text-muted-foreground">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-4 rounded-lg bg-muted/50">
            <h3 className="font-semibold text-base mb-3">After Survey</h3>
            <ul className="space-y-2">
              {checklistItems.after.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <span className="text-muted-foreground">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Service Details Section */}
        <div className="p-4 rounded-lg bg-muted/50">
          <h2 className="text-lg font-semibold mb-4">Key Information to Collect</h2>
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
        </div>

        {/* Common Issues */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Common Issues & Solutions</h2>
          <div className="grid gap-4">
            {commonIssues.map((item, idx) => (
              <div key={idx} className="p-4 rounded-lg bg-muted/50">
                <h3 className="font-semibold mb-3">{item.issue}</h3>
                <ul className="space-y-2">
                  {item.solutions.map((solution, sidx) => (
                    <li key={sidx} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span>•</span>
                      <span>{solution}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Best Practices */}
        <div className="bg-blue-50 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-4">Best Practices</h2>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>• Always be professional and respectful with respondents</li>
            <li>• Verify information from multiple sources when possible</li>
            <li>• Take clear, well-lit photos for documentation</li>
            <li>• Submit surveys on the same day whenever possible</li>
            <li>• Keep detailed notes for any unusual situations</li>
          </ul>
        </div>
      </div>
    </>
  );
}
