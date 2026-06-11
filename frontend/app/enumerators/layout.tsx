import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AuthGuard } from "@/components/auth-guard"

export default function EnumeratorsLayout({
  children,
}: {
  children: React.ReactNode;
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
        <SidebarInset className="bg-muted/50">
          {children}
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  );
}
