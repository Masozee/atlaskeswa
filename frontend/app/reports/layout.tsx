import { AuthGuard } from "@/components/auth-guard"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

export default function ReportsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "380px",
          } as React.CSSProperties
        }
      >
        <AppSidebar />
        <SidebarInset className="bg-muted/50">{children}</SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  )
}
