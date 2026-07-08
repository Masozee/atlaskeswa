"use client"

import * as React from "react"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  DashboardSquare01Icon,
  ServiceIcon,
  ClipboardIcon,
  UserMultiple02Icon,
  Settings01Icon,
  Location01Icon,
  Analytics01Icon,
  HelpCircleIcon,
  Mail01Icon,
  BookOpen01Icon,
  ArrowRight01Icon,
  Search01Icon,
  // Dasbor submenus
  ChartLineData01Icon,
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
  File01Icon,
  Audit01Icon,
  CheckListIcon,
  // Manajemen Enumerator submenus
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
  Building01Icon,
  Pdf01Icon,
  Briefcase01Icon,
  // Konfigurasi Sistem submenus
  Settings02Icon,
  Edit01Icon,
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
      title: "Dasbor & Analitik",
      url: "/dashboard",
      icon: DashboardSquare01Icon,
      isActive: true,
      submenus: [
        { title: "Ringkasan", url: "/dashboard", icon: DashboardSquare01Icon },
        { title: "Indikator Utama", url: "/dashboard/indicators", icon: ChartLineData01Icon },
        { title: "Tabel Layanan", url: "/data/services", icon: GridTableIcon },
        { title: "Matriks MTC", url: "/data/mtc-matrix", icon: GridViewIcon },
        { title: "Analisis Cakupan Populasi", url: "/data/coverage", icon: PieChart01Icon },
        { title: "Kesenjangan Layanan", url: "/data/gaps", icon: AlertDiamondIcon },
        { title: "Laporan Ketersediaan", url: "/reports/availability", icon: FileSearchIcon },
        { title: "Laporan Tenaga Kerja", url: "/reports/workforce", icon: Briefcase01Icon },
        { title: "Profil Fasilitas", url: "/reports/facilities", icon: Building01Icon },
        { title: "Unduh & Ekspor", url: "/reports/export", icon: Pdf01Icon },
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
        { title: "Klasifikasi MTC", url: "/dashboard/services/mtc", icon: Hospital01Icon },
        { title: "Jenis Layanan", url: "/dashboard/services/service-types", icon: Tag01Icon },
        { title: "Wilayah Geografis", url: "/dashboard/services/geographic-units", icon: Location01Icon },
        { title: "Populasi Sasaran", url: "/dashboard/services/target-populations", icon: Target01Icon },
      ],
    },
    {
      title: "Manajemen Survei",
      url: "/dashboard/survey",
      icon: ClipboardIcon,
      isActive: false,
      submenus: [
        { title: "Semua Catatan Survei", url: "/dashboard/survey", icon: ClipboardIcon },
        { title: "Pengajuan Tertunda", url: "/dashboard/survey/pending", icon: Clock01Icon },
        { title: "Model Kuisioner", url: "/dashboard/survey/model-kuisioner", icon: CheckListIcon },
        { title: "Template Survei", url: "/dashboard/survey/templates", icon: File01Icon },
        { title: "Log Audit Survei", url: "/dashboard/survey/audit", icon: Audit01Icon },
      ],
    },
    {
      title: "Pengguna & Enumerator",
      url: "/dashboard/users",
      icon: UserMultiple02Icon,
      isActive: false,
      submenus: [
        { title: "Semua Pengguna", url: "/dashboard/users", icon: UserMultiple02Icon },
        { title: "Tambah Pengguna", url: "/dashboard/users/new", icon: UserAdd01Icon },
        { title: "Peran & Izin", url: "/dashboard/users/roles", icon: LockPasswordIcon },
        { title: "Penugasan Enumerator", url: "/enumerators/assignments", icon: AssignmentsIcon },
        { title: "Kinerja Enumerator", url: "/enumerators/performance", icon: ChartColumnIcon },
        { title: "Riwayat Login", url: "/dashboard/users/login-history", icon: Login01Icon },
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
        { title: "Lapisan MTC", url: "/map/mtc-layers", icon: Layers01Icon },
        { title: "Perbandingan Wilayah", url: "/map/regions", icon: Globe02Icon },
        { title: "Unggah Data Geospasial", url: "/map/upload", icon: Upload01Icon },
      ],
    },
    {
      title: "Sistem",
      url: "/dashboard/settings",
      icon: Settings01Icon,
      isActive: false,
      submenus: [
        { title: "Pengaturan Umum", url: "/dashboard/settings", icon: Settings02Icon },
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

  // Check if pathname starts with submenu URL (for dynamic routes like /dashboard/survey/123)
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
    if (item.title === 'Pengguna & Enumerator') {
      return userRole === 'ADMIN'
    }

    // System (Settings + Logs) - ADMIN only
    if (item.title === 'Sistem') {
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

        // Analytics/report subs (data + reports paths) - All except SURVEYOR
        if (submenu.url.startsWith('/data/') || submenu.url.startsWith('/reports/')) {
          return ['ADMIN', 'VERIFIER', 'VIEWER'].includes(userRole)
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
  const logoSrc = "/logo-white.png"

  return (
    <Sidebar collapsible="offcanvas" className="flex-1 bg-[#0a0a0a] text-white [&_[data-sidebar=sidebar]]:bg-[#0a0a0a]">
      <SidebarHeader className="border-b border-white/10 p-4 bg-[#0a0a0a]">
        <a href="/dashboard" className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg overflow-hidden relative">
            <Image
              src={logoSrc}
              alt="Logo OMMHA"
              fill
              className="object-contain"
            />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold text-base text-white">OMMHA</span>
            <span className="truncate text-xs text-zinc-400">One Map for Mental Health Atlas</span>
          </div>
        </a>
      </SidebarHeader>
      <SidebarContent className="overflow-y-auto bg-[#0a0a0a]">
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
                          className="w-full justify-between text-zinc-300 hover:bg-white/5 hover:text-white data-[active=true]:bg-white/5 data-[active=true]:text-white"
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
                        <SidebarMenuSub className="border-white/10">
                          {item.submenus?.map((submenu) => {
                            const active = isSubmenuActive(pathname, submenu.url, item.submenus)
                            return (
                              <SidebarMenuSubItem key={submenu.url}>
                                <SidebarMenuSubButton
                                  asChild
                                  isActive={active}
                                  className="text-zinc-400 hover:bg-white/5 hover:text-white data-[active=true]:bg-[#07579E]/15 data-[active=true]:text-white"
                                >
                                  <a href={submenu.url} className="flex items-center gap-2">
                                    {submenu.icon && <HugeiconsIcon icon={submenu.icon} size={14} />}
                                    {submenu.title}
                                  </a>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            )
                          })}
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
      <SidebarFooter className="border-t border-white/10 p-2 bg-[#0a0a0a]">
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
  const logoSrc = "/logo-white.png"

  // Utility menus pinned to the bottom of the icon rail
  const FOOTER_TITLES = ["Sistem", "Bantuan & Dokumentasi"]
  const topNav = filteredNavMain.filter((item) => !FOOTER_TITLES.includes(item.title))
  const footerNav = filteredNavMain.filter((item) => FOOTER_TITLES.includes(item.title))

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
        className="w-[3.75rem]! border-r border-white/10 bg-[#064a86] text-white"
      >
        <SidebarHeader className="bg-[#064a86] py-4">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild className="md:h-10 md:p-0 hover:bg-transparent">
                <a href="/dashboard" className="flex items-center justify-center">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg overflow-hidden relative">
                    <Image
                      src={logoSrc}
                      alt="Logo OMMHA"
                      fill
                      className="object-contain"
                    />
                  </div>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent className="bg-[#064a86]">
          <SidebarGroup className="px-0">
            <SidebarGroupContent className="flex flex-col items-center px-0">
              <SidebarMenu className="items-center gap-2">
                {topNav.map((item) => (
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
                      className="size-10 justify-center rounded-xl p-0 text-white/70 hover:bg-white/10 hover:text-white data-[active=true]:bg-white/20 data-[active=true]:text-white [&>svg]:size-5"
                    >
                      <HugeiconsIcon icon={item.icon} size={20} strokeWidth={2} />
                      <span className="sr-only">{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="bg-[#064a86] items-center">
          <SidebarMenu className="items-center gap-2">
            {footerNav.map((item) => (
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
                  className="size-11 justify-center rounded-xl p-0 text-white/70 hover:bg-white/15 hover:text-white data-[active=true]:bg-white data-[active=true]:text-[#07579E] [&>svg]:size-6"
                >
                  <HugeiconsIcon icon={item.icon} size={24} strokeWidth={2} />
                  <span className="sr-only">{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
          <NavUser compact />
        </SidebarFooter>
      </Sidebar>

      {/* This is the second sidebar */}
      {/* We disable collapsible and let it fill remaining space */}
      <Sidebar collapsible="none" className="hidden flex-1 md:flex bg-[#07579E] text-white border-r border-white/10">
        <SidebarHeader className="gap-3.5 border-b border-white/15 p-4 bg-[#07579E]">
          <div className="flex w-full items-center justify-between">
            <div className="text-white text-base font-semibold">
              {activeItem?.title}
            </div>
          </div>
          <button
            onClick={() => setCommandOpen(true)}
            className="flex h-9 w-full items-center gap-2 rounded-md border border-white/20 bg-white/10 px-3 text-sm text-white/70 hover:bg-white/20 hover:text-white transition-colors"
          >
            <HugeiconsIcon icon={Search01Icon} size={16} />
            <span>Cari submenu...</span>
            <kbd className="ml-auto pointer-events-none hidden h-5 select-none items-center gap-1 rounded border border-white/20 bg-white/10 px-1.5 font-mono text-[10px] font-medium text-white/70 opacity-100 sm:flex">
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
        <SidebarContent className="bg-[#07579E]">
          <SidebarGroup className="px-0">
            <SidebarGroupContent className="px-2">
              <SidebarMenu className="gap-0.5">
                {activeItem?.submenus?.map((submenu) => {
                  const active = isSubmenuActive(pathname, submenu.url, activeItem?.submenus)
                  return (
                    <SidebarMenuItem key={submenu.url}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        className={cn(
                          "relative rounded-md text-white/70 hover:bg-white/10 hover:text-white",
                          "data-[active=true]:bg-white/20 data-[active=true]:text-white",
                          active && "before:absolute before:left-0 before:top-1/2 before:h-5 before:w-[3px] before:-translate-y-1/2 before:rounded-r before:bg-white"
                        )}
                      >
                        <a
                          href={submenu.url}
                          className="flex items-center gap-2.5 px-3 py-2.5 text-sm"
                        >
                          {submenu.icon && <HugeiconsIcon icon={submenu.icon} size={16} className={cn(!active && "text-white/60")} />}
                          {submenu.title}
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="p-4 border-t border-white/15 bg-[#07579E]">
          <div className="rounded-lg border border-white/15 bg-white/10 p-4">
            <div className="mb-3">
              <h3 className="font-semibold text-sm mb-1 text-white">Butuh Bantuan?</h3>
              <p className="text-xs text-white/70">
                Dapatkan dukungan dan pelajari lebih lanjut tentang sistem
              </p>
            </div>
            <div className="space-y-2">
              <a
                href="/help/faq"
                className="block text-xs text-white/70 hover:text-white transition-colors"
              >
                Lihat FAQ
              </a>
              <a
                href="/help/support"
                className="block text-xs text-white/70 hover:text-white transition-colors"
              >
                Hubungi Dukungan
              </a>
            </div>
            <div className="mt-3 pt-3 border-t border-white/15 text-xs text-white/70">
              <span className="font-medium text-white/90">Email:</span> support@atlaskeswa.id
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
