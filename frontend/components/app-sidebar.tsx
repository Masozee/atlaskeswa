"use client"

import * as React from "react"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  DashboardSquare01Icon,
  ServiceIcon,
  ClipboardIcon,
  ShieldUserIcon,
  UserIcon,
  UserMultiple02Icon,
  Settings01Icon,
  Database01Icon,
  Location01Icon,
  Analytics01Icon,
  FileAttachmentIcon,
  HelpCircleIcon,
  Mail01Icon,
  BookOpen01Icon,
  ArrowRight01Icon,
  Search01Icon,
  // Dasbor submenus
  ChartLineData01Icon,
  MapsCircle01Icon,
  InboxIcon,
  Queue01Icon,
  // Manajemen Layanan submenus
  Folder01Icon,
  AddCircleIcon,
  GridTableIcon,
  Hospital01Icon,
  Target01Icon,
  Tag01Icon,
  // Manajemen Survei submenus
  FileSearchIcon,
  Clock01Icon,
  CheckmarkCircle01Icon,
  CancelCircleIcon,
  File01Icon,
  Audit01Icon,
  // Verifikasi & QC submenus
  CheckListIcon,
  SearchAreaIcon,
  CheckmarkBadge01Icon,
  Camera01Icon,
  AlertCircleIcon,
  Time01Icon,
  // Manajemen Enumerator submenus
  UserGroupIcon,
  UserAdd01Icon,
  Activity01Icon,
  AssignmentsIcon,
  ChartColumnIcon,
  // Pengguna & Peran submenus
  LockPasswordIcon,
  Login01Icon,
  // Penjelajah Data submenus
  GridViewIcon,
  PieChart01Icon,
  AlertDiamondIcon,
  Download01Icon,
  // Peta & Geospasial submenus
  MapPinIcon,
  FireIcon,
  Layers01Icon,
  Globe02Icon,
  Upload01Icon,
  // Laporan & Analitik submenus
  BarChartIcon,
  Building01Icon,
  Pdf01Icon,
  Briefcase01Icon,
  // Konfigurasi Sistem submenus
  Settings02Icon,
  Edit01Icon,
  DocumentValidationIcon,
  Key01Icon,
  CloudUploadIcon,
  Notification01Icon,
  // Log & Pemantauan submenus
  SecurityCheckIcon,
  Bug01Icon,
  ArrowDataTransferHorizontalIcon,
  // Bantuan & Dokumentasi submenus
  Book01Icon,
  MessageQuestionIcon,
} from "@hugeicons/core-free-icons"

import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { useStore } from "@tanstack/react-store"
import { authStore } from "@/store/auth-store"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"

// Application data
const data = {
  navMain: [
    {
      title: "Dasbor",
      url: "/dashboard",
      icon: DashboardSquare01Icon,
      isActive: true,
      submenus: [
        { title: "Ringkasan", url: "/dashboard", icon: DashboardSquare01Icon },
        { title: "Indikator Utama", url: "/dashboard/indicators", icon: ChartLineData01Icon },
        { title: "Peta Distribusi Layanan", url: "/dashboard/map", icon: MapsCircle01Icon },
        { title: "Pengajuan Terbaru", url: "/dashboard/submissions", icon: InboxIcon },
        { title: "Antrian Verifikasi", url: "/dashboard/queue", icon: Queue01Icon },
      ],
    },
    {
      title: "Manajemen Layanan",
      url: "/dashboard/services",
      icon: ServiceIcon,
      isActive: false,
      submenus: [
        { title: "Semua Layanan", url: "/dashboard/services", icon: Folder01Icon },
        { title: "Tambah Layanan Baru", url: "/dashboard/services/new", icon: AddCircleIcon },
        { title: "Kategori Layanan (BSIC)", url: "/dashboard/services/categories", icon: GridTableIcon },
        { title: "Jenis Layanan", url: "/dashboard/services/mtc", icon: Hospital01Icon },
        { title: "Populasi Sasaran", url: "/dashboard/services/target-populations", icon: Target01Icon },
        { title: "Jenis Layanan", url: "/dashboard/services/service-types", icon: Tag01Icon },
      ],
    },
    {
      title: "Manajemen Survei",
      url: "/dashboard/survey",
      icon: ClipboardIcon,
      isActive: false,
      submenus: [
        { title: "Semua Catatan Survei", url: "/dashboard/survey", icon: ClipboardIcon },
        { title: "Entri Survei Baru", url: "/survey/new", icon: AddCircleIcon },
        { title: "Pengajuan Tertunda", url: "/dashboard/survey/pending", icon: Clock01Icon },
        { title: "Survei Disetujui", url: "/dashboard/survey/approved", icon: CheckmarkCircle01Icon },
        { title: "Survei Ditolak", url: "/dashboard/survey/rejected", icon: CancelCircleIcon },
        { title: "Model Kuisioner", url: "/dashboard/survey/model-kuisioner", icon: CheckListIcon },
        { title: "Template Survei", url: "/dashboard/survey/templates", icon: File01Icon },
        { title: "Log Audit Survei", url: "/dashboard/survey/audit", icon: Audit01Icon },
      ],
    },
    {
      title: "Verifikasi & QC",
      url: "/verification",
      icon: ShieldUserIcon,
      isActive: false,
      submenus: [
        { title: "Antrian Verifikasi", url: "/verification/queue", icon: CheckListIcon },
        { title: "Verifikasi Detail Layanan", url: "/verification/services", icon: SearchAreaIcon },
        { title: "Validasi MTC", url: "/verification/mtc", icon: CheckmarkBadge01Icon },
        { title: "Tinjauan Bukti Lapangan", url: "/verification/evidence", icon: Camera01Icon },
        { title: "Laporan Ketidaksesuaian", url: "/verification/discrepancies", icon: AlertCircleIcon },
        { title: "Riwayat Verifikasi", url: "/verification/history", icon: Time01Icon },
      ],
    },
    {
      title: "Manajemen Enumerator",
      url: "/enumerators",
      icon: UserIcon,
      isActive: false,
      submenus: [
        { title: "Semua Enumerator", url: "/enumerators", icon: UserGroupIcon },
        { title: "Tambah Enumerator", url: "/enumerators/new", icon: UserAdd01Icon },
        { title: "Log Aktivitas Enumerator", url: "/enumerators/activity", icon: Activity01Icon },
        { title: "Daftar Penugasan", url: "/enumerators/assignments", icon: AssignmentsIcon },
        { title: "Laporan Kinerja", url: "/enumerators/performance", icon: ChartColumnIcon },
      ],
    },
    {
      title: "Pengguna & Peran",
      url: "/dashboard/users",
      icon: UserMultiple02Icon,
      isActive: false,
      submenus: [
        { title: "Semua Pengguna", url: "/dashboard/users", icon: UserMultiple02Icon },
        { title: "Tambah Pengguna", url: "/dashboard/users/new", icon: UserAdd01Icon },
        { title: "Peran & Izin", url: "/dashboard/users/roles", icon: LockPasswordIcon },
        { title: "Riwayat Login", url: "/dashboard/users/login-history", icon: Login01Icon },
      ],
    },
    {
      title: "Penjelajah Data",
      url: "/data",
      icon: Database01Icon,
      isActive: false,
      submenus: [
        { title: "Tabel Layanan", url: "/data/services", icon: GridTableIcon },
        { title: "Tampilan Matriks MTC", url: "/data/mtc-matrix", icon: GridViewIcon },
        { title: "Analisis Cakupan Populasi", url: "/data/coverage", icon: PieChart01Icon },
        { title: "Kesenjangan & Kebutuhan Layanan", url: "/data/gaps", icon: AlertDiamondIcon },
        { title: "Unduh Data", url: "/data/download", icon: Download01Icon },
      ],
    },
    {
      title: "Peta & Geospasial",
      url: "/map",
      icon: Location01Icon,
      isActive: false,
      submenus: [
        { title: "Peta Lokasi Layanan", url: "/map", icon: MapPinIcon },
        { title: "Peta Panas", url: "/map/heatmap", icon: FireIcon },
        { title: "Tampilan Lapisan MTC", url: "/map/mtc-layers", icon: Layers01Icon },
        { title: "Perbandingan Wilayah", url: "/map/regions", icon: Globe02Icon },
        { title: "Unggah Data Geospasial", url: "/map/upload", icon: Upload01Icon },
      ],
    },
    {
      title: "Laporan & Analitik",
      url: "/reports",
      icon: Analytics01Icon,
      isActive: false,
      submenus: [
        { title: "Laporan Ketersediaan Layanan", url: "/reports/availability", icon: FileSearchIcon },
        { title: "Distribusi MTC", url: "/reports/mtc", icon: BarChartIcon },
        { title: "Perbandingan Regional", url: "/reports/regions", icon: Globe02Icon },
        { title: "Laporan Tenaga Kerja & Kapasitas", url: "/reports/workforce", icon: Briefcase01Icon },
        { title: "Laporan Profil Fasilitas", url: "/reports/facilities", icon: Building01Icon },
        { title: "Ekspor PDF / Unduh", url: "/reports/export", icon: Pdf01Icon },
      ],
    },
    {
      title: "Konfigurasi Sistem",
      url: "/dashboard/settings",
      icon: Settings01Icon,
      isActive: false,
      submenus: [
        { title: "Pengaturan Umum", url: "/dashboard/settings", icon: Settings02Icon },
        { title: "Pembangun Formulir Survei", url: "/settings/form-builder", icon: Edit01Icon },
        { title: "Aturan Validasi Data", url: "/settings/validation", icon: DocumentValidationIcon },
        { title: "Kunci API", url: "/settings/api-keys", icon: Key01Icon },
        { title: "Cadangan & Pemulihan", url: "/settings/backup", icon: CloudUploadIcon },
        { title: "Notifikasi Email", url: "/settings/notifications", icon: Notification01Icon },
      ],
    },
    {
      title: "Log & Pemantauan",
      url: "/dashboard/logs",
      icon: FileAttachmentIcon,
      isActive: false,
      submenus: [
        { title: "Log Aktivitas", url: "/dashboard/logs/activity", icon: Activity01Icon },
        { title: "Log Verifikasi", url: "/dashboard/logs/verification", icon: SecurityCheckIcon },
        { title: "Log Perubahan Data", url: "/dashboard/logs/changes", icon: Edit01Icon },
        { title: "Error Sistem", url: "/dashboard/logs/errors", icon: Bug01Icon },
        { title: "Log Impor/Ekspor", url: "/dashboard/logs/import-export", icon: ArrowDataTransferHorizontalIcon },
      ],
    },
    {
      title: "Bantuan & Dokumentasi",
      url: "/dashboard/help",
      icon: HelpCircleIcon,
      isActive: false,
      submenus: [
        { title: "Panduan Pengguna", url: "/dashboard/help/user-guide", icon: BookOpen01Icon },
        { title: "Referensi Klasifikasi DESDE-LTC", url: "/dashboard/help/desde-ltc", icon: FileSearchIcon },
        { title: "Buku Panduan Enumerator", url: "/dashboard/help/enumerator", icon: Book01Icon },
        { title: "FAQ", url: "/dashboard/help/faq", icon: MessageQuestionIcon },
        { title: "Hubungi Dukungan", url: "/dashboard/help/support", icon: Mail01Icon },
      ],
    },
  ],
}

// Helper function to check if a submenu is active
// Handles the case where one submenu URL is a prefix of another (e.g., /dashboard vs /dashboard/indicators)
function isSubmenuActive(pathname: string, submenuUrl: string, allSubmenus?: { url: string }[]): boolean {
  // Exact match is always active
  if (pathname === submenuUrl) return true

  // Check if pathname starts with submenu URL (for dynamic routes like /dashboard/submissions/123)
  if (pathname.startsWith(submenuUrl + '/')) {
    // But make sure no other sibling submenu is a better (longer) match
    const hasBetterMatch = allSubmenus?.some(other =>
      other.url !== submenuUrl &&
      other.url.startsWith(submenuUrl + '/') &&
      (pathname === other.url || pathname.startsWith(other.url + '/'))
    )
    return !hasBetterMatch
  }

  return false
}

// Filter menu items based on user role
function filterMenuByRole(menuItems: typeof data.navMain, userRole?: string) {
  if (!userRole) return []

  return menuItems.filter(item => {
    // User Management - ADMIN only
    if (item.title === 'Manajemen Pengguna') {
      return userRole === 'ADMIN'
    }

    // Verification & QC - ADMIN and VERIFIER only
    if (item.title === 'Verifikasi & QC') {
      return ['ADMIN', 'VERIFIER'].includes(userRole)
    }

    // Reports & Analytics - All except SURVEYOR
    if (item.title === 'Laporan & Analitik' || item.title === 'Penjelajah Data') {
      return ['ADMIN', 'VERIFIER', 'VIEWER'].includes(userRole)
    }

    // Logs & Monitoring - ADMIN only
    if (item.title === 'Log & Pemantauan') {
      return userRole === 'ADMIN'
    }

    // System Configuration - ADMIN only
    if (item.title === 'Konfigurasi Sistem') {
      return userRole === 'ADMIN'
    }

    // Filter submenus based on role
    if (item.submenus) {
      const filteredSubmenus = item.submenus.filter(submenu => {
        // Add New Service/Survey - ADMIN and SURVEYOR only
        if (submenu.title.includes('Tambah') || submenu.title.includes('Baru')) {
          return ['ADMIN', 'SURVEYOR'].includes(userRole)
        }

        // Survey Templates and Model Kuisioner - ADMIN only
        if (submenu.title.includes('Template Survei') || submenu.title.includes('Model Kuisioner')) {
          return userRole === 'ADMIN'
        }

        // Pending/Rejected/Audit - ADMIN and VERIFIER only
        if (submenu.title.includes('Tertunda') || submenu.title.includes('Ditolak') || submenu.title.includes('Audit')) {
          return ['ADMIN', 'VERIFIER'].includes(userRole)
        }

        return true
      })

      if (filteredSubmenus.length === 0) return false

      item.submenus = filteredSubmenus
    }

    return true
  })
}

// Mobile Sidebar Component
function MobileSidebar({ filteredNavMain, pathname }: { filteredNavMain: typeof data.navMain, pathname: string }) {
  return (
    <Sidebar collapsible="offcanvas" className="flex-1">
      <SidebarHeader className="border-b p-4">
        <a href="/dashboard" className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg overflow-hidden relative">
            <Image
              src="/logo.png"
              alt="Logo Atlas Keswa"
              fill
              className="object-contain"
            />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold text-base">Atlas Keswa</span>
            <span className="truncate text-xs text-muted-foreground">DESDE-LTC</span>
          </div>
        </a>
      </SidebarHeader>
      <SidebarContent className="overflow-y-auto">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredNavMain.map((item) => {
                const isActive = pathname === item.url || pathname.startsWith(item.url + '/')
                const hasActiveSubmenu = item.submenus?.some(
                  submenu => pathname === submenu.url || pathname.startsWith(submenu.url + '/')
                )

                return (
                  <Collapsible
                    key={item.title}
                    asChild
                    defaultOpen={isActive || hasActiveSubmenu}
                    className="group/collapsible"
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                          isActive={isActive || hasActiveSubmenu}
                          className="w-full justify-between"
                        >
                          <span className="flex items-center gap-3">
                            <HugeiconsIcon icon={item.icon} size={20} />
                            <span>{item.title}</span>
                          </span>
                          <HugeiconsIcon
                            icon={ArrowRight01Icon}
                            size={16}
                            className="transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"
                          />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.submenus?.map((submenu) => (
                            <SidebarMenuSubItem key={submenu.url}>
                              <SidebarMenuSubButton asChild isActive={isSubmenuActive(pathname, submenu.url, item.submenus)}>
                                <a href={submenu.url} className="flex items-center gap-2">
                                  {submenu.icon && <HugeiconsIcon icon={submenu.icon} size={14} />}
                                  {submenu.title}
                                </a>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t p-2">
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}

// Desktop Sidebar Component (dual panel)
function DesktopSidebar({
  filteredNavMain,
  pathname,
  activeItem,
  setManualActiveItem,
  setOpen
}: {
  filteredNavMain: typeof data.navMain
  pathname: string
  activeItem: typeof data.navMain[0] | undefined
  setManualActiveItem: (item: typeof data.navMain[0] | null) => void
  setOpen: (open: boolean) => void
}) {
  const [commandOpen, setCommandOpen] = React.useState(false)

  // Keyboard shortcut for command palette (Cmd+K / Ctrl+K)
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setCommandOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  return (
    <Sidebar
      collapsible="icon"
      className="overflow-hidden *:data-[sidebar=sidebar]:flex-row"
    >
      {/* This is the first sidebar */}
      {/* We disable collapsible and adjust width to icon. */}
      {/* This will make the sidebar appear as icons. */}
      <Sidebar
        collapsible="none"
        className="w-[calc(var(--sidebar-width-icon)+1px)]! border-r bg-sidebar"
      >
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild className="md:h-8 md:p-0">
                <a href="/dashboard" className="flex items-center gap-2">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg overflow-hidden relative">
                    <Image
                      src="/logo.png"
                      alt="Logo Atlas Keswa"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">Atlas Keswa</span>
                    <span className="truncate text-xs">DESDE-LTC</span>
                  </div>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent className="px-1.5 md:px-0">
              <SidebarMenu>
                {filteredNavMain.slice(0, 9).map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      tooltip={{
                        children: item.title,
                        hidden: false,
                      }}
                      onClick={() => {
                        setManualActiveItem(item)
                        setOpen(true)
                      }}
                      isActive={activeItem?.title === item.title}
                      className="px-2.5 md:px-2"
                    >
                      <HugeiconsIcon icon={item.icon} size={20} />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            {filteredNavMain.slice(9).map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  tooltip={{
                    children: item.title,
                    hidden: false,
                  }}
                  onClick={() => {
                    setManualActiveItem(item)
                    setOpen(true)
                  }}
                  isActive={activeItem?.title === item.title}
                  className="px-2.5 md:px-2"
                >
                  <HugeiconsIcon icon={item.icon} size={20} />
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
          <NavUser />
        </SidebarFooter>
      </Sidebar>

      {/* This is the second sidebar */}
      {/* We disable collapsible and let it fill remaining space */}
      <Sidebar collapsible="none" className="hidden flex-1 md:flex bg-background text-foreground">
        <SidebarHeader className="gap-3.5 border-b p-4">
          <div className="flex w-full items-center justify-between">
            <div className="text-foreground text-base font-medium">
              {activeItem?.title}
            </div>
          </div>
          <button
            onClick={() => setCommandOpen(true)}
            className="flex h-9 w-full items-center gap-2 rounded-md border border-input bg-background px-3 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            <HugeiconsIcon icon={Search01Icon} size={16} />
            <span>Cari submenu...</span>
            <kbd className="ml-auto pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
              <span className="text-xs">⌘</span>K
            </kbd>
          </button>
          <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
            <CommandInput placeholder="Cari submenu..." />
            <CommandList>
              <CommandEmpty>Tidak ada hasil.</CommandEmpty>
              <CommandGroup heading={activeItem?.title}>
                {activeItem?.submenus?.map((submenu) => (
                  <CommandItem
                    key={submenu.url}
                    value={submenu.title}
                    onSelect={() => {
                      setCommandOpen(false)
                      window.location.href = submenu.url
                    }}
                  >
                    {submenu.icon && <HugeiconsIcon icon={submenu.icon} size={16} />}
                    {submenu.title}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </CommandDialog>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup className="px-0">
            <SidebarGroupContent className="px-2">
              <SidebarMenu>
                {activeItem?.submenus?.map((submenu) => (
                  <SidebarMenuItem key={submenu.url}>
                    <SidebarMenuButton asChild isActive={isSubmenuActive(pathname, submenu.url, activeItem?.submenus)}>
                      <a
                        href={submenu.url}
                        className="flex items-center gap-2 px-3 py-2.5 text-sm"
                      >
                        {submenu.icon && <HugeiconsIcon icon={submenu.icon} size={16} />}
                        {submenu.title}
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="p-4 border-t">
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-start gap-3 mb-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <HugeiconsIcon icon={HelpCircleIcon} size={20} className="text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-sm mb-1">Butuh Bantuan?</h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Dapatkan dukungan dan pelajari lebih lanjut tentang sistem
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <a
                href="/help/faq"
                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <HugeiconsIcon icon={BookOpen01Icon} size={14} />
                <span>Lihat FAQ</span>
              </a>
              <a
                href="/help/support"
                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <HugeiconsIcon icon={Mail01Icon} size={14} />
                <span>Hubungi Dukungan</span>
              </a>
            </div>
            <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
              <span className="font-medium">Email:</span> support@atlaskeswa.id
            </div>
          </div>
        </SidebarFooter>
      </Sidebar>
    </Sidebar>
  )
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const { setOpen } = useSidebar()
  const authState = useStore(authStore, (state) => state)
  const isMobile = useIsMobile()

  // Filter menu items based on user role
  const filteredNavMain = React.useMemo(() => {
    return filterMenuByRole(data.navMain, authState.user?.role)
  }, [authState.user?.role])

  // Determine active item based on current pathname
  const defaultActiveItem = React.useMemo(() => {
    // Collect all submenus from all menu items to find the best match
    const allSubmenus = filteredNavMain.flatMap(item =>
      item.submenus?.map(sub => ({ ...sub, parent: item })) || []
    )

    // Find the submenu that best matches the current pathname
    // Prefer longer/more specific URL matches
    let bestMatch: { url: string; parent: typeof filteredNavMain[0] } | null = null

    for (const submenu of allSubmenus) {
      if (pathname === submenu.url || pathname.startsWith(submenu.url + '/')) {
        if (!bestMatch || submenu.url.length > bestMatch.url.length) {
          bestMatch = submenu
        }
      }
    }

    if (bestMatch) return bestMatch.parent

    // Fallback: try to match the main url
    let bestMainMatch: typeof filteredNavMain[0] | null = null

    for (const item of filteredNavMain) {
      if (pathname === item.url || pathname.startsWith(item.url + '/')) {
        if (!bestMainMatch || item.url.length > bestMainMatch.url.length) {
          bestMainMatch = item
        }
      }
    }

    return bestMainMatch || filteredNavMain[0]
  }, [pathname, filteredNavMain])

  const [manualActiveItem, setManualActiveItem] = React.useState<typeof data.navMain[0] | null>(null)
  const activeItem = manualActiveItem || defaultActiveItem

  // Reset manual selection when pathname changes
  React.useEffect(() => {
    setManualActiveItem(null)
  }, [pathname])

  // Render mobile or desktop sidebar based on screen size
  if (isMobile) {
    return <MobileSidebar filteredNavMain={filteredNavMain} pathname={pathname} {...props} />
  }

  return (
    <DesktopSidebar
      filteredNavMain={filteredNavMain}
      pathname={pathname}
      activeItem={activeItem}
      setManualActiveItem={setManualActiveItem}
      setOpen={setOpen}
      {...props}
    />
  )
}
