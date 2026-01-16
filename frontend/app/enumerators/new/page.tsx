'use client';

import { useRouter } from 'next/navigation';
import { useForm } from '@tanstack/react-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { DateTime } from '@/components/date-time';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { HugeiconsIcon } from "@hugeicons/react"
import {UserAdd02Icon} from "@hugeicons/core-free-icons";

export default function NewEnumeratorPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const createUser = useMutation({
    mutationFn: (data: any) => apiClient.post('/accounts/users/', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enumerators'] });
      router.push('/enumerators');
    },
  });

  const form = useForm({
    defaultValues: {
      email: '',
      username: '',
      password: '',
      first_name: '',
      last_name: '',
      phone_number: '',
      organization: '',
      role: 'SURVEYOR',
      is_active: true,
    },
    onSubmit: async ({ value }) => {
      try {
        await createUser.mutateAsync(value);
      } catch (error) {
        console.error('Failed to create enumerator:', error);
      }
    },
  });

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/enumerators">Enumerators</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Add Enumerator</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="ml-auto">
          <DateTime />
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-6">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <HugeiconsIcon icon={UserAdd02Icon} size={24} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Add New Enumerator</h1>
            <p className="text-muted-foreground">Create a new field surveyor account</p>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <div className="grid gap-4 max-w-3xl">
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>
                  Login credentials and basic account details
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <form.Field name="email">
                    {(field) => (
                      <div className="space-y-2">
                        <Label htmlFor="email">
                          Email Address <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="surveyor@atlaskeswa.id"
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          required
                        />
                      </div>
                    )}
                  </form.Field>

                  <form.Field name="username">
                    {(field) => (
                      <div className="space-y-2">
                        <Label htmlFor="username">
                          Username <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="username"
                          type="text"
                          placeholder="surveyor1"
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          required
                        />
                      </div>
                    )}
                  </form.Field>
                </div>

                <form.Field name="password">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor="password">
                        Password <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter secure password"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Minimum 8 characters recommended
                      </p>
                    </div>
                  )}
                </form.Field>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Enumerator's personal details</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <form.Field name="first_name">
                    {(field) => (
                      <div className="space-y-2">
                        <Label htmlFor="first_name">First Name</Label>
                        <Input
                          id="first_name"
                          type="text"
                          placeholder="Ahmad"
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                        />
                      </div>
                    )}
                  </form.Field>

                  <form.Field name="last_name">
                    {(field) => (
                      <div className="space-y-2">
                        <Label htmlFor="last_name">Last Name</Label>
                        <Input
                          id="last_name"
                          type="text"
                          placeholder="Wijaya"
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                        />
                      </div>
                    )}
                  </form.Field>
                </div>

                <form.Field name="phone_number">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor="phone_number">Phone Number</Label>
                      <Input
                        id="phone_number"
                        type="tel"
                        placeholder="+62 812 3456 7890"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                      />
                    </div>
                  )}
                </form.Field>

                <form.Field name="organization">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor="organization">Team/Organization</Label>
                      <Input
                        id="organization"
                        type="text"
                        placeholder="Jakarta Survey Team"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                      />
                    </div>
                  )}
                </form.Field>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>Role and account status</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <form.Field name="role">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Select
                        value={field.state.value}
                        onValueChange={(value) => field.handleChange(value)}
                      >
                        <SelectTrigger id="role">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SURVEYOR">Surveyor/Enumerator</SelectItem>
                          <SelectItem value="VERIFIER">Verifier</SelectItem>
                          <SelectItem value="VIEWER">Viewer/Analyst</SelectItem>
                          <SelectItem value="ADMIN">Administrator</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </form.Field>

                <form.Field name="is_active">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor="is_active">Account Status</Label>
                      <Select
                        value={field.state.value ? 'active' : 'inactive'}
                        onValueChange={(value) =>
                          field.handleChange(value === 'active')
                        }
                      >
                        <SelectTrigger id="is_active">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </form.Field>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={createUser.isPending}
              >
                {createUser.isPending ? 'Creating...' : 'Create Enumerator'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/enumerators')}
              >
                Cancel
              </Button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}
