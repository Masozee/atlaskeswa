'use client';

import { useState } from 'react';
import { useSystemSettings, useUpdateSystemSettings, useResetSystemSettings } from '@/hooks/use-settings';
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const breadcrumbs = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Settings' },
];

export default function SettingsPage() {
  const { data: settings, isLoading } = useSystemSettings();
  const updateSettings = useUpdateSystemSettings();
  const resetSettings = useResetSystemSettings();

  const [formData, setFormData] = useState<Record<string, any>>({});

  // Initialize form data when settings load
  if (settings && Object.keys(formData).length === 0) {
    setFormData(settings);
  }

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync(formData);
      toast.success('Settings updated successfully');
    } catch (error) {
      toast.error('Failed to update settings');
    }
  };

  const handleReset = async () => {
    if (confirm('Are you sure you want to reset all settings to default values?')) {
      try {
        await resetSettings.mutateAsync();
        toast.success('Settings reset to defaults');
        setFormData({});
      } catch (error) {
        toast.error('Failed to reset settings');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading settings...</div>
      </div>
    );
  }

  return (
    <>
      <PageHeader breadcrumbs={breadcrumbs} />

      <div className="flex flex-1 flex-col gap-4 p-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">System Settings</h1>
            <p className="text-muted-foreground">Manage system-wide configuration</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReset}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset to Defaults
            </Button>
            <Button onClick={handleSave} disabled={updateSettings.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {updateSettings.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="general" className="w-full">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="survey">Survey</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Application Settings</CardTitle>
                <CardDescription>Configure basic application information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="app_name">Application Name</Label>
                  <Input
                    id="app_name"
                    value={formData.app_name || ''}
                    onChange={(e) => handleChange('app_name', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="app_description">Application Description</Label>
                  <Textarea
                    id="app_description"
                    value={formData.app_description || ''}
                    onChange={(e) => handleChange('app_description', e.target.value)}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pagination Settings</CardTitle>
                <CardDescription>Configure default pagination behavior</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="default_page_size">Default Page Size</Label>
                  <Input
                    id="default_page_size"
                    type="number"
                    min="5"
                    max="100"
                    value={formData.default_page_size || 10}
                    onChange={(e) => handleChange('default_page_size', parseInt(e.target.value))}
                  />
                  <p className="text-sm text-muted-foreground">Number of items per page (5-100)</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_page_size">Maximum Page Size</Label>
                  <Input
                    id="max_page_size"
                    type="number"
                    min="10"
                    max="500"
                    value={formData.max_page_size || 100}
                    onChange={(e) => handleChange('max_page_size', parseInt(e.target.value))}
                  />
                  <p className="text-sm text-muted-foreground">Maximum items per page (10-500)</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Maintenance Mode</CardTitle>
                <CardDescription>Enable maintenance mode to prevent user access</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Maintenance Mode</Label>
                    <p className="text-sm text-muted-foreground">System is currently in maintenance</p>
                  </div>
                  <Switch
                    checked={formData.maintenance_mode || false}
                    onCheckedChange={(checked) => handleChange('maintenance_mode', checked)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maintenance_message">Maintenance Message</Label>
                  <Textarea
                    id="maintenance_message"
                    value={formData.maintenance_message || ''}
                    onChange={(e) => handleChange('maintenance_message', e.target.value)}
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="email" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Email Configuration</CardTitle>
                <CardDescription>Configure email notification settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Enable system email notifications</p>
                  </div>
                  <Switch
                    checked={formData.email_notifications_enabled || false}
                    onCheckedChange={(checked) => handleChange('email_notifications_enabled', checked)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email_from_address">From Email Address</Label>
                  <Input
                    id="email_from_address"
                    type="email"
                    value={formData.email_from_address || ''}
                    onChange={(e) => handleChange('email_from_address', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email_from_name">From Name</Label>
                  <Input
                    id="email_from_name"
                    value={formData.email_from_name || ''}
                    onChange={(e) => handleChange('email_from_name', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Configure security and authentication settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="session_timeout">Session Timeout (minutes)</Label>
                  <Input
                    id="session_timeout"
                    type="number"
                    min="5"
                    max="1440"
                    value={formData.session_timeout || 30}
                    onChange={(e) => handleChange('session_timeout', parseInt(e.target.value))}
                  />
                  <p className="text-sm text-muted-foreground">Session timeout in minutes (5-1440)</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password_min_length">Minimum Password Length</Label>
                  <Input
                    id="password_min_length"
                    type="number"
                    min="6"
                    max="32"
                    value={formData.password_min_length || 8}
                    onChange={(e) => handleChange('password_min_length', parseInt(e.target.value))}
                  />
                  <p className="text-sm text-muted-foreground">Minimum password length (6-32)</p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Require Email Verification</Label>
                    <p className="text-sm text-muted-foreground">Users must verify email before login</p>
                  </div>
                  <Switch
                    checked={formData.require_email_verification || false}
                    onCheckedChange={(checked) => handleChange('require_email_verification', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">Require 2FA for user accounts</p>
                  </div>
                  <Switch
                    checked={formData.enable_two_factor_auth || false}
                    onCheckedChange={(checked) => handleChange('enable_two_factor_auth', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="survey" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Survey Settings</CardTitle>
                <CardDescription>Configure survey-related settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto-Approve Surveys</Label>
                    <p className="text-sm text-muted-foreground">Skip verification workflow</p>
                  </div>
                  <Switch
                    checked={formData.survey_auto_approval || false}
                    onCheckedChange={(checked) => handleChange('survey_auto_approval', checked)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="survey_draft_expiry_days">Draft Expiry Days</Label>
                  <Input
                    id="survey_draft_expiry_days"
                    type="number"
                    min="7"
                    max="180"
                    value={formData.survey_draft_expiry_days || 30}
                    onChange={(e) => handleChange('survey_draft_expiry_days', parseInt(e.target.value))}
                  />
                  <p className="text-sm text-muted-foreground">Days before draft surveys expire (7-180)</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Data & Privacy</CardTitle>
                <CardDescription>Configure data retention and audit settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="data_retention_days">Data Retention Days</Label>
                  <Input
                    id="data_retention_days"
                    type="number"
                    min="30"
                    max="3650"
                    value={formData.data_retention_days || 365}
                    onChange={(e) => handleChange('data_retention_days', parseInt(e.target.value))}
                  />
                  <p className="text-sm text-muted-foreground">Days to retain data (30-3650)</p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Audit Logs</Label>
                    <p className="text-sm text-muted-foreground">Track all system changes</p>
                  </div>
                  <Switch
                    checked={formData.enable_audit_logs || false}
                    onCheckedChange={(checked) => handleChange('enable_audit_logs', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Settings Metadata</CardTitle>
                <CardDescription>Information about last settings update</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Last Updated:</span>
                  <span>{settings?.updated_at ? new Date(settings.updated_at).toLocaleString() : 'Never'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Updated By:</span>
                  <span>{settings?.updated_by_name || settings?.updated_by_email || 'System'}</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
