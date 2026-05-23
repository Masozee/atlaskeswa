# Sidebar Menu Restructure Proposal

Status: **Deferred** — capture only, no code change yet.

Source plan: `/Users/pro/.claude/plans/i-ll-do-it-later-resilient-seahorse.md`

## Why

Frontend [components/app-sidebar.tsx](frontend/components/app-sidebar.tsx) uses dual-panel desktop (icon rail + expandable panel) with 12 top-level groups, ~70 submenu items. Mobile uses single collapsible. Inconsistency, bloat, several duplicates and broken RBAC filter. Goal: tidy, unified single-sidebar pattern, dedupe.

## Issues in Current Menu

1. **Duplicate** "Antrian Verifikasi" — `/dashboard/queue` (Dasbor) AND `/verification/queue` (Verifikasi & QC)
2. **Duplicate** "Jenis Layanan" twice in Manajemen Layanan (`/services/mtc` line 151 + `/services/service-types` line 154)
3. **Broken RBAC filter** — line 321 checks title `"Manajemen Pengguna"` but actual title is `"Pengguna & Peran"` → filter never fires
4. **Overlap** — Penjelajah Data + Laporan & Analitik + Peta & Geospasial all data-viewing
5. **Overlap** — Verifikasi & QC duplicates Manajemen Survei verification states
6. **Misplaced** — Wilayah Geografis, Populasi Sasaran, BSIC, MTC are reference data, not service ops
7. **Too deep** — 12 top-level groups exceed scan capacity (5±2)
8. **Dual-sidebar** desktop pattern inconsistent with mobile

## Proposed Structure (8 groups)

```
Beranda                    /dashboard
├─ Ringkasan
├─ Indikator Utama
├─ Peta Distribusi
└─ Pengajuan Terbaru

Survei                     /dashboard/survey                    [SURVEYOR/VERIFIER/ADMIN]
├─ Semua Catatan
├─ Entri Baru
├─ Antrian Verifikasi      (consolidated)
├─ Tertunda                [VERIFIER/ADMIN]
├─ Disetujui
├─ Ditolak                 [VERIFIER/ADMIN]
├─ Bukti & Diskrepansi     (merged from QC)
├─ Riwayat Verifikasi      (merged from QC)
├─ Template                [ADMIN]
├─ Model Kuisioner         [ADMIN]
└─ Log Audit               [VERIFIER/ADMIN]

Layanan                    /dashboard/services
├─ Semua Layanan
├─ Tambah Baru             [SURVEYOR/ADMIN]
└─ Verifikasi Detail       (moved from QC)

Data Master                /dashboard/master                    [ADMIN]
├─ Kategori (BSIC)
├─ Jenis Layanan (MTC)
├─ Populasi Sasaran
└─ Wilayah Geografis

Enumerator                 /dashboard/enumerators
├─ Semua
├─ Tambah                  [ADMIN]
├─ Penugasan
├─ Aktivitas
└─ Kinerja

Analitik                   /dashboard/analytics                 [ADMIN/VERIFIER/VIEWER]
├─ Peta Lokasi
├─ Heatmap
├─ Lapisan MTC
├─ Perbandingan Wilayah
├─ Tabel & Matriks
├─ Cakupan Populasi
├─ Kesenjangan Layanan
├─ Laporan Ketersediaan
├─ Distribusi MTC
├─ Tenaga Kerja
├─ Profil Fasilitas
└─ Ekspor / Unduh

Sistem                     /dashboard/system                    [ADMIN]
├─ Pengguna
├─ Peran & Izin
├─ Riwayat Login
├─ Pengaturan Umum
├─ Form Builder
├─ Validasi Data
├─ API Keys
├─ Backup
├─ Notifikasi
└─ Log (aktivitas/verifikasi/perubahan/error/impor-ekspor)

Bantuan                    /dashboard/help
├─ Panduan
├─ Referensi DESDE-LTC
├─ Buku Enumerator
├─ FAQ
└─ Dukungan
```

## Key Changes

| Change | Reason |
|--------|--------|
| 12 → 8 groups | Reduce cognitive load |
| Merge Verifikasi & QC into Survei | Same workflow, split was artificial |
| Merge Penjelajah Data + Laporan + Peta → Analitik | All data-viewing |
| Merge Pengguna + Konfigurasi + Log → Sistem | Single admin space |
| Extract Data Master from Layanan | Reference data ≠ service ops |
| Single sidebar everywhere | Drop dual-panel desktop |
| Dedupe Jenis Layanan + Antrian Verifikasi | Single source |
| Fix RBAC filter title | `Manajemen Pengguna` → `Sistem` |

## Files to Modify (when resumed)

- [frontend/components/app-sidebar.tsx](frontend/components/app-sidebar.tsx) — replace `data.navMain`; collapse `DesktopSidebar` + `MobileSidebar` into one component using mobile-style collapsible pattern (`collapsible="icon"` desktop, `collapsible="offcanvas"` mobile via `useIsMobile`)
- [frontend/components/nav-user.tsx](frontend/components/nav-user.tsx) — keep, no change
- New stub pages or redirects for any proposed URL not yet present

## Routes Audit Before Implementation

```bash
find frontend/app -name "page.tsx" | sed 's|frontend/app||;s|/page.tsx||' | sort
```
Cross-check existing routes vs proposed URL list. Missing → stub or redirect.

## RBAC Migration

Replace title-based checks in `filterMenuByRole` (lines 316-373) with explicit `requiredRoles?: string[]` field on each `navMain` item and submenu. Generic filter eliminates string-title coupling and the current broken `"Manajemen Pengguna"` mismatch.

## Implementation Steps

1. Audit routes (cmd above)
2. Refactor `app-sidebar.tsx` per proposal
3. Add stub pages / redirects for missing routes
4. Update `CLAUDE.md` "Sidebar Active Menu Color" if pattern changes

## Verification

- Login as ADMIN, SURVEYOR, VERIFIER, VIEWER. Confirm correct groups visible per RBAC
- Mobile + desktop visual check
- Click every submenu — confirm 200 (no 404)
- Active highlight tracks current path correctly (existing `isSubmenuActive` logic preserved)
- Cmd+K command palette searches across all submenus (currently scoped to `activeItem` only — broaden)
