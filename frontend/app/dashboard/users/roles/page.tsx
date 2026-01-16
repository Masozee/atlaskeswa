'use client';

import { DateTime } from "@/components/date-time";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Check, X } from "lucide-react";

const roles = [
  {
    name: 'Admin',
    description: 'Full system access with all permissions',
    userCount: 2,
    permissions: {
      'User Management': true,
      'Create Users': true,
      'Edit Users': true,
      'Delete Users': true,
      'View Users': true,
      'Service Management': true,
      'Create Services': true,
      'Edit Services': true,
      'Delete Services': true,
      'View Services': true,
      'Survey Management': true,
      'Create Surveys': true,
      'Edit Surveys': true,
      'Delete Surveys': true,
      'View Surveys': true,
      'Verify Surveys': true,
      'Analytics Access': true,
      'View Analytics': true,
      'Export Data': true,
    },
  },
  {
    name: 'Staff',
    description: 'Can manage services and surveys',
    userCount: 5,
    permissions: {
      'User Management': false,
      'Create Users': false,
      'Edit Users': false,
      'Delete Users': false,
      'View Users': true,
      'Service Management': true,
      'Create Services': true,
      'Edit Services': true,
      'Delete Services': false,
      'View Services': true,
      'Survey Management': true,
      'Create Surveys': true,
      'Edit Surveys': true,
      'Delete Surveys': false,
      'View Surveys': true,
      'Verify Surveys': false,
      'Analytics Access': true,
      'View Analytics': true,
      'Export Data': false,
    },
  },
  {
    name: 'Viewer',
    description: 'Read-only access to view data',
    userCount: 12,
    permissions: {
      'User Management': false,
      'Create Users': false,
      'Edit Users': false,
      'Delete Users': false,
      'View Users': false,
      'Service Management': false,
      'Create Services': false,
      'Edit Services': false,
      'Delete Services': false,
      'View Services': true,
      'Survey Management': false,
      'Create Surveys': false,
      'Edit Surveys': false,
      'Delete Surveys': false,
      'View Surveys': true,
      'Verify Surveys': false,
      'Analytics Access': true,
      'View Analytics': true,
      'Export Data': false,
    },
  },
];

const permissionCategories = [
  { name: 'User Management', permissions: ['Create Users', 'Edit Users', 'Delete Users', 'View Users'] },
  { name: 'Service Management', permissions: ['Create Services', 'Edit Services', 'Delete Services', 'View Services'] },
  { name: 'Survey Management', permissions: ['Create Surveys', 'Edit Surveys', 'Delete Surveys', 'View Surveys', 'Verify Surveys'] },
  { name: 'Analytics Access', permissions: ['View Analytics', 'Export Data'] },
];

export default function RolesPermissionsPage() {
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
              <BreadcrumbPage>Roles & Permissions</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="ml-auto">
          <DateTime />
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4">
        <div>
          <h1 className="text-2xl font-bold">Roles & Permissions</h1>
          <p className="text-muted-foreground">Manage user roles and their permissions</p>
        </div>

        {/* Role Overview Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          {roles.map((role) => (
            <Card key={role.name}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{role.name}</CardTitle>
                    <CardDescription className="mt-1">{role.description}</CardDescription>
                  </div>
                  <Badge variant="secondary">{role.userCount} users</Badge>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>

        {/* Permissions Matrix */}
        <Card>
          <CardHeader>
            <CardTitle>Permission Matrix</CardTitle>
            <CardDescription>Detailed breakdown of permissions for each role</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px]">Permission</TableHead>
                    {roles.map((role) => (
                      <TableHead key={role.name} className="text-center">
                        {role.name}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {permissionCategories.map((category) => (
                    <>
                      <TableRow key={category.name} className="bg-muted/50">
                        <TableCell colSpan={4} className="font-semibold">
                          {category.name}
                        </TableCell>
                      </TableRow>
                      {category.permissions.map((permission) => (
                        <TableRow key={permission}>
                          <TableCell className="pl-8">{permission}</TableCell>
                          {roles.map((role) => (
                            <TableCell key={role.name} className="text-center">
                              {role.permissions[permission as keyof typeof role.permissions] ? (
                                <Check className="h-5 w-5 text-green-600 mx-auto" />
                              ) : (
                                <X className="h-5 w-5 text-muted-foreground/50 mx-auto" />
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
