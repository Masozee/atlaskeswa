'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  useCreateService,
  useMainTypesOfCare,
  useBasicStableInputsOfCare,
  useServiceTypes,
  useTargetPopulations
} from '@/hooks/use-services';
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const breadcrumbs = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'All Services', href: '/dashboard/services' },
  { label: 'Add New Service' },
];

export default function AddServicePage() {
  const router = useRouter();
  const createService = useCreateService();

  const { data: mtcList } = useMainTypesOfCare();
  const { data: bsicList } = useBasicStableInputsOfCare();
  const { data: serviceTypes } = useServiceTypes();
  const { data: targetPopulations } = useTargetPopulations();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    mtc: '',
    bsic: '',
    service_type: '',
    phone_number: '',
    email: '',
    website: '',
    address: '',
    city: '',
    province: '',
    postal_code: '',
    latitude: '',
    longitude: '',
    bed_capacity: '',
    staff_count: '',
    psychiatrist_count: '0',
    psychologist_count: '0',
    nurse_count: '0',
    social_worker_count: '0',
    operating_hours: '',
    is_24_7: false,
    accepts_emergency: false,
    accepts_bpjs: false,
    accepts_private_insurance: false,
    funding_sources: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      const payload: any = {
        name: formData.name,
        description: formData.description,
        mtc: parseInt(formData.mtc),
        bsic: parseInt(formData.bsic),
        service_type: parseInt(formData.service_type),
        city: formData.city,
        province: formData.province,
        phone_number: formData.phone_number,
        email: formData.email,
        website: formData.website,
        address: formData.address,
        postal_code: formData.postal_code,
        latitude: formData.latitude || undefined,
        longitude: formData.longitude || undefined,
        bed_capacity: formData.bed_capacity ? parseInt(formData.bed_capacity) : undefined,
        staff_count: formData.staff_count ? parseInt(formData.staff_count) : undefined,
        psychiatrist_count: parseInt(formData.psychiatrist_count),
        psychologist_count: parseInt(formData.psychologist_count),
        nurse_count: parseInt(formData.nurse_count),
        social_worker_count: parseInt(formData.social_worker_count),
        operating_hours: formData.operating_hours,
        is_24_7: formData.is_24_7,
        accepts_emergency: formData.accepts_emergency,
        accepts_bpjs: formData.accepts_bpjs,
        accepts_private_insurance: formData.accepts_private_insurance,
        funding_sources: formData.funding_sources,
      };

      await createService.mutateAsync(payload);
      router.push('/dashboard/services');
    } catch (error: any) {
      if (error.errors) {
        setErrors(error.errors);
      } else {
        setErrors({ general: error.message || 'Failed to create service' });
      }
    }
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <>
      <PageHeader breadcrumbs={breadcrumbs} />

      <div className="flex flex-1 flex-col gap-4 p-8">
        <div>
          <h1 className="text-2xl font-bold">Add New Service</h1>
          <p className="text-muted-foreground">Register a new mental health service</p>
        </div>

        <div className="max-w-4xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {errors.general && (
              <div className="rounded-lg bg-destructive/15 p-3 text-sm text-destructive">
                {errors.general}
              </div>
            )}

            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Core service details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Service Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    required
                  />
                  {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="mtc">Main Type of Care *</Label>
                    <Select value={formData.mtc} onValueChange={(value) => handleChange('mtc', value)}>
                      <SelectTrigger id="mtc">
                        <SelectValue placeholder="Select MTC" />
                      </SelectTrigger>
                      <SelectContent>
                        {mtcList?.map((mtc: any) => (
                          <SelectItem key={mtc.id} value={mtc.id.toString()}>
                            {mtc.code} - {mtc.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.mtc && <p className="text-sm text-destructive">{errors.mtc}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bsic">BSIC Type *</Label>
                    <Select value={formData.bsic} onValueChange={(value) => handleChange('bsic', value)}>
                      <SelectTrigger id="bsic">
                        <SelectValue placeholder="Select BSIC" />
                      </SelectTrigger>
                      <SelectContent>
                        {bsicList?.map((bsic: any) => (
                          <SelectItem key={bsic.id} value={bsic.id.toString()}>
                            {bsic.code} - {bsic.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.bsic && <p className="text-sm text-destructive">{errors.bsic}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="service_type">Service Type *</Label>
                    <Select value={formData.service_type} onValueChange={(value) => handleChange('service_type', value)}>
                      <SelectTrigger id="service_type">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {serviceTypes?.map((type: any) => (
                          <SelectItem key={type.id} value={type.id.toString()}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.service_type && <p className="text-sm text-destructive">{errors.service_type}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Location Information */}
            <Card>
              <CardHeader>
                <CardTitle>Location</CardTitle>
                <CardDescription>Service address and location details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    rows={2}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleChange('city', e.target.value)}
                      required
                    />
                    {errors.city && <p className="text-sm text-destructive">{errors.city}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="province">Province *</Label>
                    <Input
                      id="province"
                      value={formData.province}
                      onChange={(e) => handleChange('province', e.target.value)}
                      required
                    />
                    {errors.province && <p className="text-sm text-destructive">{errors.province}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="postal_code">Postal Code</Label>
                    <Input
                      id="postal_code"
                      value={formData.postal_code}
                      onChange={(e) => handleChange('postal_code', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="latitude">Latitude</Label>
                    <Input
                      id="latitude"
                      value={formData.latitude}
                      onChange={(e) => handleChange('latitude', e.target.value)}
                      placeholder="-6.2088"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="longitude">Longitude</Label>
                    <Input
                      id="longitude"
                      value={formData.longitude}
                      onChange={(e) => handleChange('longitude', e.target.value)}
                      placeholder="106.8456"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="phone_number">Phone Number</Label>
                    <Input
                      id="phone_number"
                      value={formData.phone_number}
                      onChange={(e) => handleChange('phone_number', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      type="url"
                      value={formData.website}
                      onChange={(e) => handleChange('website', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Capacity & Staffing */}
            <Card>
              <CardHeader>
                <CardTitle>Capacity & Staffing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="bed_capacity">Bed Capacity</Label>
                    <Input
                      id="bed_capacity"
                      type="number"
                      min="0"
                      value={formData.bed_capacity}
                      onChange={(e) => handleChange('bed_capacity', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="staff_count">Total Staff</Label>
                    <Input
                      id="staff_count"
                      type="number"
                      min="0"
                      value={formData.staff_count}
                      onChange={(e) => handleChange('staff_count', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-4">
                  <div className="space-y-2">
                    <Label htmlFor="psychiatrist_count">Psychiatrists</Label>
                    <Input
                      id="psychiatrist_count"
                      type="number"
                      min="0"
                      value={formData.psychiatrist_count}
                      onChange={(e) => handleChange('psychiatrist_count', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="psychologist_count">Psychologists</Label>
                    <Input
                      id="psychologist_count"
                      type="number"
                      min="0"
                      value={formData.psychologist_count}
                      onChange={(e) => handleChange('psychologist_count', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nurse_count">Nurses</Label>
                    <Input
                      id="nurse_count"
                      type="number"
                      min="0"
                      value={formData.nurse_count}
                      onChange={(e) => handleChange('nurse_count', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="social_worker_count">Social Workers</Label>
                    <Input
                      id="social_worker_count"
                      type="number"
                      min="0"
                      value={formData.social_worker_count}
                      onChange={(e) => handleChange('social_worker_count', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Service Features */}
            <Card>
              <CardHeader>
                <CardTitle>Service Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="operating_hours">Operating Hours</Label>
                  <Input
                    id="operating_hours"
                    value={formData.operating_hours}
                    onChange={(e) => handleChange('operating_hours', e.target.value)}
                    placeholder="e.g., Mon-Fri 8AM-5PM"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="is_24_7"
                      checked={formData.is_24_7}
                      onCheckedChange={(checked) => handleChange('is_24_7', !!checked)}
                    />
                    <Label htmlFor="is_24_7" className="cursor-pointer">24/7 Service</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="accepts_emergency"
                      checked={formData.accepts_emergency}
                      onCheckedChange={(checked) => handleChange('accepts_emergency', !!checked)}
                    />
                    <Label htmlFor="accepts_emergency" className="cursor-pointer">Accepts Emergency Cases</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="accepts_bpjs"
                      checked={formData.accepts_bpjs}
                      onCheckedChange={(checked) => handleChange('accepts_bpjs', !!checked)}
                    />
                    <Label htmlFor="accepts_bpjs" className="cursor-pointer">Accepts BPJS</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="accepts_private_insurance"
                      checked={formData.accepts_private_insurance}
                      onCheckedChange={(checked) => handleChange('accepts_private_insurance', !!checked)}
                    />
                    <Label htmlFor="accepts_private_insurance" className="cursor-pointer">Accepts Private Insurance</Label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="funding_sources">Funding Sources</Label>
                  <Input
                    id="funding_sources"
                    value={formData.funding_sources}
                    onChange={(e) => handleChange('funding_sources', e.target.value)}
                    placeholder="Comma-separated funding sources"
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button type="submit" disabled={createService.isPending}>
                {createService.isPending ? 'Creating...' : 'Create Service'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/dashboard/services')}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
