'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Papa from 'papaparse';
import { PageHeader } from '@/components/page-header';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { useCreateSurvey } from '@/hooks/use-surveys';
import { HugeiconsIcon } from "@hugeicons/react"
import {Upload01Icon, File02Icon, AlertCircleIcon, Tick02Icon, Cancel01Icon} from "@hugeicons/core-free-icons";

const breadcrumbs = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Survey Management', href: '/dashboard/survey' },
  { label: 'Bulk Upload' },
];

interface ParsedSurvey {
  service_id: string;
  survey_date: string;
  survey_period_start: string;
  survey_period_end: string;
  surveyor_id: string;
  current_bed_capacity?: string;
  beds_occupied?: string;
  current_staff_count?: string;
  current_psychiatrist_count?: string;
  current_psychologist_count?: string;
  current_nurse_count?: string;
  current_social_worker_count?: string;
  total_patients_served?: string;
  new_patients?: string;
  returning_patients?: string;
  patients_male?: string;
  patients_female?: string;
  patients_age_0_17?: string;
  patients_age_18_64?: string;
  patients_age_65_plus?: string;
  patient_satisfaction_score?: string;
  average_wait_time_days?: string;
  monthly_budget?: string;
  bpjs_patients?: string;
  private_insurance_patients?: string;
  self_pay_patients?: string;
  surveyor_notes?: string;
  challenges_faced?: string;
  improvements_needed?: string;
  additional_notes?: string;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

interface UploadResult {
  row: number;
  status: 'success' | 'error';
  message: string;
}

export default function BulkUploadPage() {
  const router = useRouter();
  const createSurvey = useCreateSurvey();

  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedSurvey[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState<UploadResult[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const validateRow = (row: ParsedSurvey, index: number): ValidationError[] => {
    const errors: ValidationError[] = [];
    const rowNum = index + 2; // +2 because index is 0-based and CSV has header row

    // Required fields
    if (!row.service_id) {
      errors.push({ row: rowNum, field: 'service_id', message: 'Service ID is required' });
    }
    if (!row.survey_date) {
      errors.push({ row: rowNum, field: 'survey_date', message: 'Survey date is required' });
    }
    if (!row.survey_period_start) {
      errors.push({ row: rowNum, field: 'survey_period_start', message: 'Survey period start is required' });
    }
    if (!row.survey_period_end) {
      errors.push({ row: rowNum, field: 'survey_period_end', message: 'Survey period end is required' });
    }
    if (!row.surveyor_id) {
      errors.push({ row: rowNum, field: 'surveyor_id', message: 'Surveyor ID is required' });
    }

    // Validate date formats
    const dateFields = ['survey_date', 'survey_period_start', 'survey_period_end'];
    dateFields.forEach(field => {
      const value = row[field as keyof ParsedSurvey];
      if (value && !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        errors.push({ row: rowNum, field, message: `${field} must be in YYYY-MM-DD format` });
      }
    });

    // Validate numeric fields
    const numericFields = [
      'current_bed_capacity', 'beds_occupied', 'current_staff_count',
      'current_psychiatrist_count', 'current_psychologist_count',
      'current_nurse_count', 'current_social_worker_count',
      'total_patients_served', 'new_patients', 'returning_patients',
      'patients_male', 'patients_female', 'patients_age_0_17',
      'patients_age_18_64', 'patients_age_65_plus', 'average_wait_time_days',
      'bpjs_patients', 'private_insurance_patients', 'self_pay_patients'
    ];

    numericFields.forEach(field => {
      const value = row[field as keyof ParsedSurvey];
      if (value && (isNaN(Number(value)) || Number(value) < 0)) {
        errors.push({ row: rowNum, field, message: `${field} must be a positive number` });
      }
    });

    // Validate decimal fields
    const decimalFields = ['patient_satisfaction_score', 'monthly_budget'];
    decimalFields.forEach(field => {
      const value = row[field as keyof ParsedSurvey];
      if (value && isNaN(Number(value))) {
        errors.push({ row: rowNum, field, message: `${field} must be a valid number` });
      }
    });

    // Validate patient_satisfaction_score range (0-5)
    if (row.patient_satisfaction_score) {
      const score = Number(row.patient_satisfaction_score);
      if (score < 0 || score > 5) {
        errors.push({ row: rowNum, field: 'patient_satisfaction_score', message: 'Must be between 0 and 5' });
      }
    }

    return errors;
  };

  const handleFileChange = (selectedFile: File | null) => {
    if (!selectedFile) return;

    setFile(selectedFile);
    setIsValidating(true);
    setParsedData([]);
    setValidationErrors([]);
    setUploadResults([]);
    setUploadProgress(0);

    Papa.parse<ParsedSurvey>(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data;
        setParsedData(data);

        // Validate all rows
        const allErrors: ValidationError[] = [];
        data.forEach((row, index) => {
          const errors = validateRow(row, index);
          allErrors.push(...errors);
        });

        setValidationErrors(allErrors);
        setIsValidating(false);
      },
      error: (error) => {
        setValidationErrors([{ row: 0, field: 'file', message: `Parse error: ${error.message}` }]);
        setIsValidating(false);
      }
    });
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.type === 'text/csv' || droppedFile.name.endsWith('.csv'))) {
      handleFileChange(droppedFile);
    }
  }, []);

  const handleUpload = async () => {
    if (validationErrors.length > 0) return;

    setIsUploading(true);
    const results: UploadResult[] = [];

    for (let i = 0; i < parsedData.length; i++) {
      const row = parsedData[i];
      const rowNum = i + 2;

      try {
        const payload = {
          service: parseInt(row.service_id),
          survey_date: row.survey_date,
          survey_period_start: row.survey_period_start,
          survey_period_end: row.survey_period_end,
          surveyor: parseInt(row.surveyor_id),
          current_bed_capacity: row.current_bed_capacity ? parseInt(row.current_bed_capacity) : null,
          beds_occupied: row.beds_occupied ? parseInt(row.beds_occupied) : null,
          current_staff_count: row.current_staff_count ? parseInt(row.current_staff_count) : null,
          current_psychiatrist_count: row.current_psychiatrist_count ? parseInt(row.current_psychiatrist_count) : 0,
          current_psychologist_count: row.current_psychologist_count ? parseInt(row.current_psychologist_count) : 0,
          current_nurse_count: row.current_nurse_count ? parseInt(row.current_nurse_count) : 0,
          current_social_worker_count: row.current_social_worker_count ? parseInt(row.current_social_worker_count) : 0,
          total_patients_served: row.total_patients_served ? parseInt(row.total_patients_served) : 0,
          new_patients: row.new_patients ? parseInt(row.new_patients) : 0,
          returning_patients: row.returning_patients ? parseInt(row.returning_patients) : 0,
          patients_male: row.patients_male ? parseInt(row.patients_male) : 0,
          patients_female: row.patients_female ? parseInt(row.patients_female) : 0,
          patients_age_0_17: row.patients_age_0_17 ? parseInt(row.patients_age_0_17) : 0,
          patients_age_18_64: row.patients_age_18_64 ? parseInt(row.patients_age_18_64) : 0,
          patients_age_65_plus: row.patients_age_65_plus ? parseInt(row.patients_age_65_plus) : 0,
          patient_satisfaction_score: row.patient_satisfaction_score ? parseFloat(row.patient_satisfaction_score) : null,
          average_wait_time_days: row.average_wait_time_days ? parseInt(row.average_wait_time_days) : null,
          monthly_budget: row.monthly_budget || undefined,
          bpjs_patients: row.bpjs_patients ? parseInt(row.bpjs_patients) : 0,
          private_insurance_patients: row.private_insurance_patients ? parseInt(row.private_insurance_patients) : 0,
          self_pay_patients: row.self_pay_patients ? parseInt(row.self_pay_patients) : 0,
          surveyor_notes: row.surveyor_notes || '',
          challenges_faced: row.challenges_faced || '',
          improvements_needed: row.improvements_needed || '',
          additional_notes: row.additional_notes || '',
        };

        await createSurvey.mutateAsync(payload);
        results.push({ row: rowNum, status: 'success', message: 'Survey created successfully' });
      } catch (error: any) {
        results.push({
          row: rowNum,
          status: 'error',
          message: error?.message || 'Failed to create survey'
        });
      }

      setUploadProgress(((i + 1) / parsedData.length) * 100);
      setUploadResults([...results]);
    }

    setIsUploading(false);
  };

  const downloadTemplate = () => {
    const template = `service_id,survey_date,survey_period_start,survey_period_end,surveyor_id,current_bed_capacity,beds_occupied,current_staff_count,current_psychiatrist_count,current_psychologist_count,current_nurse_count,current_social_worker_count,total_patients_served,new_patients,returning_patients,patients_male,patients_female,patients_age_0_17,patients_age_18_64,patients_age_65_plus,patient_satisfaction_score,average_wait_time_days,monthly_budget,bpjs_patients,private_insurance_patients,self_pay_patients,surveyor_notes,challenges_faced,improvements_needed,additional_notes
1,2024-01-15,2024-01-01,2024-01-31,2,50,45,25,3,2,15,5,150,30,120,80,70,20,100,30,4.5,7,50000000,80,40,30,Regular survey,Staff shortage,Need more nurses,Good cooperation`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'survey_bulk_upload_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const successCount = useMemo(() => uploadResults.filter(r => r.status === 'success').length, [uploadResults]);
  const errorCount = useMemo(() => uploadResults.filter(r => r.status === 'error').length, [uploadResults]);

  return (
    <>
      <PageHeader breadcrumbs={breadcrumbs} />

      <div className="flex flex-1 flex-col gap-4 p-8">
        <div>
          <h1 className="text-3xl font-bold">Bulk Upload Surveys</h1>
          <p className="text-muted-foreground mt-1">
            Upload multiple survey records at once using a CSV file
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Upload CSV File</CardTitle>
              <CardDescription>
                Upload a CSV file containing survey data. Download the template to see the required format.
              </CardDescription>
            </CardHeader>
            <Separator />
            <CardContent className="space-y-4">
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragging
                    ? 'border-primary bg-primary/5'
                    : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <HugeiconsIcon icon={Upload01Icon} size={24} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {file ? file.name : 'Drag and drop your CSV file here'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">or click to browse</p>
                  </div>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload">
                    <Button type="button" variant="outline" size="sm" asChild>
                      <span>Choose File</span>
                    </Button>
                  </label>
                </div>
              </div>

              <Button onClick={downloadTemplate} variant="outline" className="w-full">
                <HugeiconsIcon icon={File02Icon} size={16} className="mr-2" />
                Download CSV Template
              </Button>

              {isValidating && (
                <Alert>
                  <HugeiconsIcon icon={AlertCircleIcon} size={16} />
                  <AlertDescription>Validating CSV file...</AlertDescription>
                </Alert>
              )}

              {parsedData.length > 0 && validationErrors.length === 0 && !isUploading && (
                <Alert>
                  <HugeiconsIcon icon={Tick02Icon} size={16} className="text-green-600" />
                  <AlertDescription className="text-green-600">
                    ✓ File validated successfully. {parsedData.length} surveys ready to upload.
                  </AlertDescription>
                </Alert>
              )}

              {validationErrors.length > 0 && (
                <Alert variant="destructive">
                  <HugeiconsIcon icon={AlertCircleIcon} size={16} />
                  <AlertDescription>
                    Found {validationErrors.length} validation error(s). Please fix them before uploading.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Upload Status</CardTitle>
              <CardDescription>
                Track the progress of your bulk upload
              </CardDescription>
            </CardHeader>
            <Separator />
            <CardContent className="space-y-4">
              {parsedData.length > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total surveys</span>
                    <span className="font-medium">{parsedData.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Validation errors</span>
                    <Badge variant={validationErrors.length > 0 ? 'destructive' : 'default'}>
                      {validationErrors.length}
                    </Badge>
                  </div>
                </div>
              )}

              {isUploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Upload progress</span>
                    <span className="font-medium">{Math.round(uploadProgress)}%</span>
                  </div>
                  <Progress value={uploadProgress} />
                </div>
              )}

              {uploadResults.length > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Successful</span>
                    <Badge variant="default" className="bg-green-600">
                      {successCount}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Failed</span>
                    <Badge variant="destructive">{errorCount}</Badge>
                  </div>
                </div>
              )}

              <div className="pt-4 space-y-2">
                <Button
                  onClick={handleUpload}
                  disabled={parsedData.length === 0 || validationErrors.length > 0 || isUploading}
                  className="w-full"
                >
                  {isUploading ? 'Uploading...' : 'Upload Surveys'}
                </Button>

                {uploadResults.length > 0 && !isUploading && (
                  <Button
                    onClick={() => router.push('/dashboard/survey')}
                    variant="outline"
                    className="w-full"
                  >
                    View All Surveys
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {validationErrors.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Validation Errors</CardTitle>
              <CardDescription>
                Fix these errors before uploading
              </CardDescription>
            </CardHeader>
            <Separator />
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Row</TableHead>
                    <TableHead>Field</TableHead>
                    <TableHead>Error</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {validationErrors.map((error, index) => (
                    <TableRow key={index}>
                      <TableCell>{error.row}</TableCell>
                      <TableCell className="font-mono text-sm">{error.field}</TableCell>
                      <TableCell className="text-destructive">{error.message}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {parsedData.length > 0 && validationErrors.length === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Preview Data ({parsedData.length} surveys)</CardTitle>
              <CardDescription>
                Review the data before uploading
              </CardDescription>
            </CardHeader>
            <Separator />
            <CardContent>
              <div className="max-h-96 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Row</TableHead>
                      <TableHead>Service ID</TableHead>
                      <TableHead>Survey Date</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Surveyor ID</TableHead>
                      <TableHead>Patients</TableHead>
                      <TableHead>Beds</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedData.slice(0, 10).map((row, index) => (
                      <TableRow key={index}>
                        <TableCell>{index + 2}</TableCell>
                        <TableCell>{row.service_id}</TableCell>
                        <TableCell>{row.survey_date}</TableCell>
                        <TableCell className="text-xs">
                          {row.survey_period_start} to {row.survey_period_end}
                        </TableCell>
                        <TableCell>{row.surveyor_id}</TableCell>
                        <TableCell>{row.total_patients_served || 0}</TableCell>
                        <TableCell>{row.current_bed_capacity || 'N/A'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {parsedData.length > 10 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Showing 10 of {parsedData.length} surveys
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {uploadResults.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Upload Results</CardTitle>
              <CardDescription>
                Detailed results for each survey upload
              </CardDescription>
            </CardHeader>
            <Separator />
            <CardContent>
              <div className="max-h-96 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Row</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Message</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {uploadResults.map((result, index) => (
                      <TableRow key={index}>
                        <TableCell>{result.row}</TableCell>
                        <TableCell>
                          {result.status === 'success' ? (
                            <Badge variant="default" className="bg-green-600">
                              <HugeiconsIcon icon={Tick02Icon} size={12} className="mr-1" />
                              Success
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              <HugeiconsIcon icon={Cancel01Icon} size={12} className="mr-1" />
                              Error
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className={result.status === 'error' ? 'text-destructive' : ''}>
                          {result.message}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
