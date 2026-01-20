'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const mtcCategories = [
  {
    code: 'R',
    name: 'Residential Care',
    description: 'Services providing accommodation and 24-hour care',
    color: 'bg-blue-100 text-blue-800',
    examples: ['Psychiatric hospitals', 'Residential homes', 'Crisis residential care'],
  },
  {
    code: 'D',
    name: 'Day Care',
    description: 'Services providing structured daytime activities',
    color: 'bg-green-100 text-green-800',
    examples: ['Day centres', 'Day hospitals', 'Therapeutic workshops'],
  },
  {
    code: 'O',
    name: 'Outpatient Care',
    description: 'Services providing scheduled consultations and treatments',
    color: 'bg-purple-100 text-purple-800',
    examples: ['Outpatient clinics', 'Mental health centres', 'Primary care'],
  },
  {
    code: 'A',
    name: 'Accessibility to Care',
    description: 'Services facilitating access to care',
    color: 'bg-yellow-100 text-yellow-800',
    examples: ['Emergency services', 'Mobile teams', 'Hotlines'],
  },
  {
    code: 'I',
    name: 'Information',
    description: 'Services providing information about available care',
    color: 'bg-orange-100 text-orange-800',
    examples: ['Information services', 'Advocacy services', 'Registers'],
  },
  {
    code: 'W',
    name: 'Work and Training',
    description: 'Services for vocational rehabilitation',
    color: 'bg-cyan-100 text-cyan-800',
    examples: ['Sheltered workshops', 'Transitional employment', 'Job training'],
  },
  {
    code: 'S',
    name: 'Self-help and Voluntary Work',
    description: 'User-led and peer support services',
    color: 'bg-pink-100 text-pink-800',
    examples: ['Self-help groups', 'Peer support', 'User organizations'],
  },
];

const breadcrumbs = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Help & Documentation', href: '/dashboard/help' },
  { label: 'DESDE-LTC Classification' },
];

export default function DESDELTCPage() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <>
      <PageHeader breadcrumbs={breadcrumbs} />

      <div className="flex flex-1 flex-col gap-6 p-8">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold">DESDE-LTC Classification Reference</h1>
          <p className="text-muted-foreground">
            Description and Evaluation of Services and DirectoriEs for Long Term Care
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="mtc">Main Types of Care (MTC)</TabsTrigger>
            <TabsTrigger value="bsic">BSIC Codes</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">What is DESDE-LTC?</h2>
              <p className="text-sm text-muted-foreground">
                DESDE-LTC (Description and Evaluation of Services and DirectoriEs for Long Term Care) is a
                standardized instrument for describing and classifying services for mental health and long-term care.
              </p>
              <div className="space-y-2">
                <h4 className="font-medium">Key Features:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Standardized classification system</li>
                  <li>International comparability</li>
                  <li>Comprehensive service description</li>
                  <li>Evidence-based categorization</li>
                </ul>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Classification Structure</h2>
              <div className="space-y-2">
                <h4 className="font-medium">Service Code Format</h4>
                <div className="bg-muted p-4 rounded-lg font-mono text-sm">
                  <div className="mb-2">Example: <strong>R2.1</strong></div>
                  <div className="space-y-1 text-xs">
                    <div><strong>R</strong> = Main Type of Care (MTC)</div>
                    <div><strong>2.1</strong> = Basic Service Identification Code (BSIC)</div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="mtc" className="space-y-4 mt-6">
            <div className="grid gap-4">
              {mtcCategories.map((category) => (
                <div key={category.code} className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge className={`font-mono text-lg px-3 py-1 ${category.color}`}>
                      {category.code}
                    </Badge>
                    <h3 className="text-lg font-semibold">{category.name}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{category.description}</p>
                  <div>
                    <h4 className="text-sm font-medium mb-2">Examples:</h4>
                    <div className="flex flex-wrap gap-2">
                      {category.examples.map((example, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {example}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="bsic" className="space-y-6 mt-6">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Basic Service Identification Codes (BSIC)</h2>
              <p className="text-sm text-muted-foreground">
                BSIC codes provide detailed classification of services within each Main Type of Care.
                Each code consists of a number and decimal to indicate specific service types.
              </p>

              <div className="space-y-3">
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="font-medium mb-2">Example: Residential Care (R)</div>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex items-start gap-2">
                      <code className="bg-muted px-2 py-0.5 rounded text-xs">R1</code>
                      <span className="text-muted-foreground">Acute/crisis residential care</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <code className="bg-muted px-2 py-0.5 rounded text-xs">R2</code>
                      <span className="text-muted-foreground">Long-term residential care</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <code className="bg-muted px-2 py-0.5 rounded text-xs">R3</code>
                      <span className="text-muted-foreground">Supported housing</span>
                    </div>
                  </div>
                </div>

                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="font-medium mb-2">Example: Outpatient Care (O)</div>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex items-start gap-2">
                      <code className="bg-muted px-2 py-0.5 rounded text-xs">O1</code>
                      <span className="text-muted-foreground">Acute/crisis outpatient care</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <code className="bg-muted px-2 py-0.5 rounded text-xs">O2</code>
                      <span className="text-muted-foreground">Non-acute outpatient care</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <code className="bg-muted px-2 py-0.5 rounded text-xs">O3</code>
                      <span className="text-muted-foreground">Community mental health care</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-sm">
                  <p className="font-medium text-blue-900 mb-1">Need more details?</p>
                  <p className="text-blue-700">
                    For complete BSIC code listings and detailed definitions, please refer to the
                    official DESDE-LTC manual or contact your system administrator.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
