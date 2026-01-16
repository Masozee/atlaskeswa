"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"
import {
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { HugeiconsIcon } from "@hugeicons/react"
import {Upload01Icon,
  FileValidationIcon,
  Location01Icon,
  CheckmarkCircle02Icon,
  AlertCircleIcon,
  File02Icon,} from "@hugeicons/core-free-icons"

type UploadStatus = "idle" | "validating" | "uploading" | "success" | "error"

interface UploadResult {
  success: boolean
  message: string
  recordsProcessed?: number
  errors?: string[]
}

export default function GeospatialDataUploadPage() {
  const { open } = useSidebar()
  const queryClient = useQueryClient()

  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [dataType, setDataType] = useState<string>("")
  const [notes, setNotes] = useState("")
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null)

  // Mock upload mutation (in production, implement actual file upload)
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      // Simulate upload delay
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Mock success response
      return {
        success: true,
        message: "Geospatial data uploaded successfully",
        recordsProcessed: Math.floor(Math.random() * 100) + 50,
      }
    },
    onSuccess: (data) => {
      setUploadStatus("success")
      setUploadResult(data)
      queryClient.invalidateQueries({ queryKey: ["services"] })
    },
    onError: (error: any) => {
      setUploadStatus("error")
      setUploadResult({
        success: false,
        message: error.message || "Failed to upload file",
        errors: ["Network error", "Please try again"],
      })
    },
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setUploadStatus("idle")
      setUploadResult(null)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile || !dataType) return

    setUploadStatus("validating")

    // Simulate validation
    await new Promise((resolve) => setTimeout(resolve, 1000))

    setUploadStatus("uploading")

    const formData = new FormData()
    formData.append("file", selectedFile)
    formData.append("data_type", dataType)
    formData.append("notes", notes)

    uploadMutation.mutate(formData)
  }

  const resetForm = () => {
    setSelectedFile(null)
    setDataType("")
    setNotes("")
    setUploadStatus("idle")
    setUploadResult(null)
  }

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/map">Map</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Geospatial Data Upload</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="grid gap-4 md:grid-cols-2">
          {/* Upload Form */}
          <Card>
            <CardHeader>
              <CardTitle>Upload Geospatial Data</CardTitle>
              <CardDescription>
                Import geographic coordinates and location data for mental health services
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Data Type */}
              <div className="space-y-2">
                <Label htmlFor="data-type">Data Type</Label>
                <Select value={dataType} onValueChange={setDataType}>
                  <SelectTrigger id="data-type">
                    <SelectValue placeholder="Select data type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="coordinates">Service Coordinates (Lat/Lng)</SelectItem>
                    <SelectItem value="geojson">GeoJSON Features</SelectItem>
                    <SelectItem value="kml">KML (Google Earth)</SelectItem>
                    <SelectItem value="shapefile">Shapefile</SelectItem>
                    <SelectItem value="gpx">GPX (GPS Exchange)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* File Upload */}
              <div className="space-y-2">
                <Label htmlFor="file-upload">Upload File</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="file-upload"
                    type="file"
                    accept=".csv,.json,.kml,.shp,.gpx,.geojson"
                    onChange={handleFileChange}
                    disabled={uploadStatus === "uploading" || uploadStatus === "validating"}
                  />
                </div>
                {selectedFile && (
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <HugeiconsIcon icon={File02Icon} size={16} />
                    {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                  </p>
                )}
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any notes about this upload..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  disabled={uploadStatus === "uploading" || uploadStatus === "validating"}
                />
              </div>

              {/* Upload Status */}
              {uploadStatus === "validating" && (
                <Alert>
                  <HugeiconsIcon icon={FileValidationIcon} size={16} />
                  <AlertDescription>Validating file format and structure...</AlertDescription>
                </Alert>
              )}

              {uploadStatus === "uploading" && (
                <Alert>
                  <HugeiconsIcon icon={Upload01Icon} size={16} className="animate-pulse" />
                  <AlertDescription>Uploading geospatial data...</AlertDescription>
                </Alert>
              )}

              {uploadStatus === "success" && uploadResult && (
                <Alert className="border-green-500 bg-green-50">
                  <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} className="text-green-600" />
                  <AlertDescription className="text-green-800">
                    {uploadResult.message}
                    {uploadResult.recordsProcessed && (
                      <span className="block mt-1">
                        Successfully processed {uploadResult.recordsProcessed} records
                      </span>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {uploadStatus === "error" && uploadResult && (
                <Alert variant="destructive">
                  <HugeiconsIcon icon={AlertCircleIcon} size={16} />
                  <AlertDescription>
                    {uploadResult.message}
                    {uploadResult.errors && (
                      <ul className="mt-2 list-disc list-inside text-sm">
                        {uploadResult.errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={handleUpload}
                  disabled={
                    !selectedFile ||
                    !dataType ||
                    uploadStatus === "uploading" ||
                    uploadStatus === "validating"
                  }
                  className="flex-1"
                >
                  {uploadStatus === "uploading" || uploadStatus === "validating" ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <HugeiconsIcon icon={Upload01Icon} size={16} className="mr-2" />
                      Upload Data
                    </>
                  )}
                </Button>
                {uploadStatus === "success" && (
                  <Button variant="outline" onClick={resetForm}>
                    Upload Another
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Instructions and Guidelines */}
          <Card>
            <CardHeader>
              <CardTitle>Upload Guidelines</CardTitle>
              <CardDescription>File format requirements and best practices</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <HugeiconsIcon icon={Location01Icon} size={16} className="text-primary" />
                  Supported Formats
                </h3>
                <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
                  <li>
                    <strong>CSV:</strong> Must include latitude, longitude, and service ID columns
                  </li>
                  <li>
                    <strong>GeoJSON:</strong> Standard GeoJSON format with Feature Collection
                  </li>
                  <li>
                    <strong>KML:</strong> Google Earth format with Placemark features
                  </li>
                  <li>
                    <strong>Shapefile:</strong> Upload as ZIP containing .shp, .shx, .dbf files
                  </li>
                  <li>
                    <strong>GPX:</strong> GPS Exchange format with waypoints
                  </li>
                </ul>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <HugeiconsIcon icon={FileValidationIcon} size={16} className="text-primary" />
                  CSV Format Requirements
                </h3>
                <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
                  <li>Headers: service_id, latitude, longitude</li>
                  <li>Latitude range: -90 to 90 (decimal degrees)</li>
                  <li>Longitude range: -180 to 180 (decimal degrees)</li>
                  <li>UTF-8 encoding required</li>
                  <li>Maximum file size: 10 MB</li>
                </ul>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold text-sm mb-2">CSV Example:</h3>
                <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto">
                  {`service_id,latitude,longitude
1,-7.797068,110.370529
2,-6.200000,106.816666
3,-7.250445,112.768845`}
                </pre>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold text-sm mb-2">Best Practices:</h3>
                <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
                  <li>Validate coordinates before upload</li>
                  <li>Remove duplicate entries</li>
                  <li>Use decimal degrees (not DMS format)</li>
                  <li>Backup existing data before bulk updates</li>
                  <li>Test with small sample first</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Uploads */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Uploads</CardTitle>
            <CardDescription>History of geospatial data imports</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                {
                  date: "2025-12-15 10:30",
                  type: "CSV - Coordinates",
                  records: 127,
                  status: "success",
                  user: "admin@atlaskeswa.id",
                },
                {
                  date: "2025-12-14 15:45",
                  type: "GeoJSON",
                  records: 89,
                  status: "success",
                  user: "admin@atlaskeswa.id",
                },
                {
                  date: "2025-12-13 09:20",
                  type: "KML",
                  records: 45,
                  status: "partial",
                  user: "admin@atlaskeswa.id",
                },
              ].map((upload, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent"
                >
                  <div className="flex items-center gap-3">
                    {upload.status === "success" ? (
                      <HugeiconsIcon icon={CheckmarkCircle02Icon} size={20} className="text-green-600" />
                    ) : (
                      <HugeiconsIcon icon={AlertCircleIcon} size={20} className="text-yello" />
                    )}
                    <div>
                      <p className="font-medium text-sm">{upload.type}</p>
                      <p className="text-xs text-muted-foreground">
                        {upload.date} • {upload.records} records • {upload.user}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    View Details
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
