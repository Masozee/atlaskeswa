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
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HugeiconsIcon } from "@hugeicons/react"
import {FileAttachmentIcon, InformationCircleIcon} from "@hugeicons/core-free-icons";

const mtcCategories = [
  {
    code: 'R',
    name: 'Residential Care',
    description: 'Services providing accommodation and 24-hour care',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    examples: ['Psychiatric hospitals', 'Residential homes', 'Crisis residential care'],
  },
  {
    code: 'D',
    name: 'Day Care',
    description: 'Services providing structured daytime activities',
    color: 'bg-green-100 text-green-800 border-green-200',
    examples: ['Day centres', 'Day hospitals', 'Therapeutic workshops'],
  },
  {
    code: 'O',
    name: 'Outpatient Care',
    description: 'Services providing scheduled consultations and treatments',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    examples: ['Outpatient clinics', 'Mental health centres', 'Primary care'],
  },
  {
    code: 'A',
    name: 'Accessibility to Care',
    description: 'Services facilitating access to care',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    examples: ['Emergency services', 'Mobile teams', 'Hotlines'],
  },
  {
    code: 'I',
    name: 'Information',
    description: 'Services providing information about available care',
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    examples: ['Information services', 'Advocacy services', 'Registers'],
  },
  {
    code: 'W',
    name: 'Work and Training',
    description: 'Services for vocational rehabilitation',
    color: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    examples: ['Sheltered workshops', 'Transitional employment', 'Job training'],
  },
  {
    code: 'S',
    name: 'Self-help and Voluntary Work',
    description: 'User-led and peer support services',
    color: 'bg-pink-100 text-pink-800 border-pink-200',
    examples: ['Self-help groups', 'Peer support', 'User organizations'],
  },
];

export default function DESDELTCPage() {
  const [activeTab, setActiveTab] = useState('overview');

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
              <BreadcrumbPage>DESDE-LTC Classification</BreadcrumbPage>
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

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>What is DESDE-LTC?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Classification Structure</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mtc" className="space-y-4">
            <div className="grid gap-4">
              {mtcCategories.map((category) => (
                <Card key={category.code}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge className={`font-mono text-lg px-3 py-1 ${category.color}`}>
                            {category.code}
                          </Badge>
                          <CardTitle className="text-lg">{category.name}</CardTitle>
                        </div>
                        <CardDescription>{category.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
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
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="bsic" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <HugeiconsIcon icon={InformationCircleIcon} size={20} className="text-primary" />
                  <CardTitle>Basic Service Identification Codes (BSIC)</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  BSIC codes provide detailed classification of services within each Main Type of Care. 
                  Each code consists of a number and decimal to indicate specific service types.
                </p>

                <div className="space-y-3">
                  <div className="border rounded-lg p-3">
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

                  <div className="border rounded-lg p-3">
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

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <HugeiconsIcon icon={FileAttachmentIcon} size={20} className="text-blue-600 shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-blue-900 mb-1">Need more details?</p>
                      <p className="text-blue-700">
                        For complete BSIC code listings and detailed definitions, please refer to the 
                        official DESDE-LTC manual or contact your system administrator.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
