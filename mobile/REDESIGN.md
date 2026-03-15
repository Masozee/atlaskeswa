# OMMHA Mobile App — Redesign Reference

## App Overview

**Name:** OMMHA (Observasi & Monitoring Mental Health Access)
**Platform:** React Native (Expo managed workflow)
**Target users:** Field surveyors and verifiers working in Kabupaten Kebumen, Indonesia
**Purpose:** Collect, submit, and monitor mental health facility (DESDE-LTC) survey data in the field. Supports offline-first data entry with sync to central backend.

**Tech stack:**
- React Native + Expo
- TypeScript
- Inter font family (Regular, Medium, SemiBold, Bold)
- Material Icons (`@expo/vector-icons`)
- SQLite local database (offline queue)
- SettingsContext — provides `useTheme()`, `useFontScale()`, `useSettings()`
- Primary color: `#03979D` (teal)
- Dark mode + large text accessibility support

---

## Navigation Structure

State-based navigation (no React Navigation library). `App.tsx` holds `currentScreen` state and passes `onNavigate(screen)` down through props.

```
App.tsx
├── LoginScreen             (unauthenticated)
└── BaseLayout              (authenticated wrapper)
    ├── TopHeader           (persistent top bar)
    ├── [active screen]
    │   ├── HomePage
    │   ├── SurveyListScreen
    │   ├── SurveyDetailScreen
    │   ├── SurveyFormScreen (legacy)
    │   ├── DynamicSurveyFormScreen
    │   ├── ProfileScreen
    │   └── SettingsScreen
    └── BottomNavigation    (persistent tab bar)
```

---

## Shared Components

### `BaseLayout`
Wraps all authenticated screens. Provides consistent chrome (top header, bottom nav, status bar).

**Renders:**
- `SafeAreaView` with theme background color
- `StatusBar` styled for light/dark mode
- Slot for screen content (`children`)
- `BottomNavigation` pinned at bottom

---

### `TopHeader`
Persistent top bar shown on every authenticated screen.

**State:** `user` (profile data), `isOnline` (network status)

**Functions:**
- `fetchUser()` — fetches `/accounts/users/me/` on mount
- `getInitials()` — derives two-letter initials from name
- `getFullName()` — returns formatted full name
- `getRoleDisplay()` — capitalizes role string

**Renders:**
- Left: Avatar circle (teal, white initials) with online/offline status dot (green = online, red = offline)
- Left: Full name + role label below avatar
- Right: Notifications icon button
- Right: Menu icon button

---

### `BottomNavigation`
4-tab bottom bar for primary navigation.

**State:** `activeTab` ('home' | 'survey' | 'settings' | 'profile')

**Functions:**
- `handlePress(tab)` — updates active tab and calls `onNavigate()`

**Renders:**
- 4 tab items: Home (house), Survey (description), Settings (settings), Profile (person)
- Active tab: teal background pill, white icon + label
- Inactive tab: gray icon + label

---

## Screens

---

### 1. Login Screen
**Route key:** `login` (shown when unauthenticated)
**Purpose:** Authenticate the user and configure the backend server URL.

**State:**
- `email`, `password` — credential inputs
- `showPassword` — toggles password visibility
- `error` — inline error message
- `isLoading` — disables form during request
- `showServerConfig` — toggles advanced server panel
- `serverUrl` — API URL input
- `isSavedInDb` — whether current URL is persisted

**Functions:**
- `loadServerUrl()` — reads saved API URL from SQLite on mount
- `handleSaveServerUrl()` — validates and persists URL to SQLite
- `handleLogin()` — validates inputs → calls `apiClient.login()` → fetches user profile → calls `onLoginSuccess()`

**Layout:**
```
┌─────────────────────────────┐
│                             │
│   [App icon]                │
│   OMMHA                     │
│   Subtitle text             │
│                             │
│   Selamat Datang            │
│   ─────────────────────     │
│   [Advanced: Server URL]    │  ← collapsible
│                             │
│   Email input               │
│   Password input  [👁]      │
│   Forgot password link      │
│                             │
│   [    Masuk    ]           │  ← primary CTA
│                             │
│   Sign up link              │
└─────────────────────────────┘
```

---

### 2. Home Page
**Route key:** `home`
**Purpose:** Dashboard overview — greets the user, shows survey counts, and lists recent activity.

**State:**
- `stats` — `{ total_surveys, pending_surveys, recent_surveys[] }`
- `user` — current user profile
- `loading` — initial fetch state
- `refreshing` — pull-to-refresh state
- `error` — error message

**Functions:**
- `fetchData()` — parallel fetch of dashboard stats and user profile
- `onRefresh()` — triggers `fetchData()` with refresh flag
- `getFullName()` — derives display name
- `getStatusColor(status)` — maps status → color (green / amber / red / gray)
- `getStatusLabel(status)` — maps status → Indonesian label

**Layout:**
```
┌─────────────────────────────┐
│  TopHeader                  │
├─────────────────────────────┤
│  [Hero card]                │
│  Halo, {name}!              │
│  {N} survei aktif           │
├─────────────────────────────┤
│  Survei Terbaru   [Lihat →] │
│  ┌──────────────────────┐   │
│  │ Service name         │   │
│  │ Template · Date      │   │
│  │              [badge] │   │
│  └──────────────────────┘   │
│  (up to 5 cards)            │
├─────────────────────────────┤
│  BottomNavigation           │
└─────────────────────────────┘
```

---

### 3. Survey List Screen
**Route key:** `survey-list`
**Purpose:** Browse, manage, and delete all survey responses. Entry point for creating new surveys.

**State:**
- `surveys` — array of survey response objects
- `loading` — initial fetch state
- `refreshing` — pull-to-refresh state

**Functions:**
- `fetchSurveys()` — calls `/surveys/responses/?ordering=-created_at`
- `onRefresh()` — pulls fresh list
- `handleRequestDeletion(id)` — shows Alert confirmation → sends delete request to backend → updates local list state

**Layout:**
```
┌─────────────────────────────┐
│  TopHeader                  │
├─────────────────────────────┤
│  Daftar Survei              │
│  Semua survei Anda          │
│  [+ Survei Baru]            │
├─────────────────────────────┤
│  ┌──────────────────────┐   │
│  │ [●] Service name     │   │  ← initials avatar
│  │     Template name    │   │
│  │     [STATUS BADGE]   │   │
│  │  📅 date  📍 city    │   │
│  │  👤 surveyor name    │   │
│  │  [Edit]   [Hapus]    │   │
│  └──────────────────────┘   │
│  (paginated list)           │
├─────────────────────────────┤
│  BottomNavigation           │
└─────────────────────────────┘
```

**Status badge colors:**
- `DRAFT` → gray
- `SUBMITTED` → amber
- `VERIFIED` / `APPROVED` → teal/green
- `REJECTED` → red
- `deletion_requested` → shows "Pending Approval" state, hides action buttons

---

### 4. Survey Detail Screen
**Route key:** `survey-detail`
**Purpose:** Read-only view of a single survey response with all answers displayed.

**State:**
- `survey` — full survey detail object (includes nested answers array)
- `loading` — fetch state

**Functions:**
- `fetchSurveyDetail(id)` — fetches `/surveys/responses/{id}/`, normalizes nested `service` and `template` objects
- `getStatusColor(status)` — maps status to color
- `formatAnswerValue(answer)` — formats answer by type:
  - Arrays (multiple choice) → joined string
  - Boolean → Ya / Tidak
  - Number → localized string
  - Date/Time → formatted Indonesian date
  - GPS/Coordinates → Lat/Lng string
  - Table data → formatted key-value rows
  - Default → plain string

**Layout:**
```
┌─────────────────────────────┐
│  TopHeader                  │
├─────────────────────────────┤
│  ← Back          [Edit]     │
│  [● STATUS BADGE]           │
│  Service Name               │
├─────────────────────────────┤
│  Info Card                  │
│  Template: ...              │
│  Tanggal: ...               │
│  Lokasi: ...                │
│  Surveyor: ...              │
├─────────────────────────────┤
│  Jawaban                    │
│  ┌──────────────────────┐   │
│  │ [CODE] Question text │   │
│  │ Answer value         │   │
│  └──────────────────────┘   │
│  (one card per answer)      │
├─────────────────────────────┤
│  Catatan Surveyor (if any)  │
├─────────────────────────────┤
│  BottomNavigation           │
└─────────────────────────────┘
```

---

### 5. Survey Form Screen *(Legacy)*
**Route key:** `survey-form`
**Purpose:** Manual form for creating/editing old-style (non-template) surveys with structured fields for capacity, staff, patients, and finances.

**State:**
- `loading`, `saving` — async states
- `services` — service directory list for picker
- `showServicePicker` — modal visibility
- `capturingLocation` — GPS capture state
- `formData` — 40+ field object:
  - Service, dates (survey_date, period_start, period_end)
  - Bed capacity, staff count, psychiatrist/psychologist/nurse/social worker counts
  - Total patients, male/female split, age groups (0–17, 18–64, 65+)
  - Finances: BPJS, private insurance, out-of-pocket, monthly budget
  - Quality: compliance rate, patient satisfaction
  - Notes: general, referral, challenges, recommendations
  - GPS: latitude, longitude, accuracy
- `selectedServiceName` — display name of chosen service

**Functions:**
- `fetchServices()` — loads service list for picker
- `fetchSurveyData(id)` — loads existing survey for edit mode
- `handleSave(isDraft)` — validates → saves to SQLite → if online, syncs to backend
- `selectService(service)` — sets selected service, closes picker
- `captureLocation()` — requests permission → captures GPS via Expo Location

**Layout:**
```
┌─────────────────────────────┐
│  TopHeader                  │
├─────────────────────────────┤
│  ← Back  Survei Baru        │
├─────────────────────────────┤
│  [Service picker modal]     │
│  Pilih Layanan              │
│  ─────────────────────────  │
│  Tanggal Survei             │
│  Periode (start – end)      │
│  ─────────────────────────  │
│  Kapasitas & Staf           │
│  (6 numeric inputs)         │
│  ─────────────────────────  │
│  Statistik Pasien           │
│  (11 numeric inputs)        │
│  ─────────────────────────  │
│  Keuangan & Asuransi        │
│  (4 numeric + 1 budget)     │
│  ─────────────────────────  │
│  Metrik Kualitas (2 inputs) │
│  ─────────────────────────  │
│  Catatan (4 text areas)     │
│  ─────────────────────────  │
│  [📍 Dapatkan Lokasi]       │
├─────────────────────────────┤
│  [Simpan Draft]             │
│  [Submit Verifikasi]        │
│  [Batal]                    │
├─────────────────────────────┤
│  BottomNavigation           │
└─────────────────────────────┘
```

---

### 6. Dynamic Survey Form Screen
**Route key:** `survey-form` (dynamic variant)
**Purpose:** Template-driven questionnaire. Renders questions conditionally based on skip logic and section flow. The primary survey entry screen used in production.

**State:**
- `template` — full survey template with sections and questions
- `answers` — `Record<string, any>` keyed by question code (or `context|code` for MTC detail questions)
- `currentSectionIndex` — active wizard step
- `currentMtcContext` / `currentMtcLabel` — active MTC classification context for detail loops
- `errors` — validation errors keyed by storage key
- `otherTexts` — "other" free-text inputs keyed by question code
- `saving` — async save/submit state
- `capturingLocation` / `showKecamatanPicker` — location field UI state
- `speakingCode` — code of question currently being spoken via TTS
- `setupComplete` — whether form initialization is done

**Functions:**
- `fetchTemplateAndResponse()` — loads template and (in edit mode) existing answers
- `buildAnswersMap(responses)` — converts flat response array to keyed answer map
- `isDetailQuestion(code)` — returns true if code ends in uppercase letter (e.g. RQA, DQB)
- `handleAnswerChange(code, value, ctx?)` — stores answer with correct storage key, updates MTC context state
- `validateSection()` — checks all active questions for required answers, runs LOCATION field validation
- `handleNext()` — validates current section → advances section index
- `handlePrevious()` — moves to previous section
- `handleSave(isDraft)` — saves/submits survey to backend
- `captureGPS(code, ctx?)` — captures GPS coordinates via Expo Location
- `speakQuestion(code, text)` — speaks question via Expo Speech
- `renderQuestion(question, idx)` — renders a single question card
- `renderQuestionInput(question, type, value, ctx?)` — renders the correct input widget for the question type
- `renderSingleChoice(question, value, ctx?)` — renders radio-style choice list
- `renderMultipleChoice(question, value, ctx?)` — renders checkbox choice list
- `renderKecamatanPicker(question, value, ctx?)` — renders searchable kecamatan dropdown
- `renderLocationInput(question, value, ctx?)` — renders full location widget (province/kabupaten fixed, kecamatan picker, desa input, GPS button)
- `renderGPSInput(question, value, ctx?)` — renders standalone GPS capture widget
- `renderCoverageLevel(question, value, ctx?)` — renders coverage level radio list
- `renderTable(question, value, rows, ctx?)` — renders staff/diagnosis table (L/P columns)
- `renderStaffTable` / `renderDiagnosisTable` — wrappers for `renderTable`
- `renderRepeatingTable(question, value, ctx?)` — renders dynamic add-row table

**Question types supported:**
`TEXT`, `PHONE`, `EMAIL`, `URL`, `TEXTAREA`, `NUMBER`, `INTEGER`, `DATE`, `TIME`, `BOOLEAN`, `SINGLE_CHOICE`, `MULTIPLE_CHOICE`, `GEO_PROVINSI`, `GEO_KABUPATEN`, `GEO_KECAMATAN`, `GEO_DESA`, `LOCATION`, `GPS`, `COVERAGE_LEVEL`, `STAFF_TABLE`, `DIAGNOSIS_TABLE`, `REPEATING_TABLE`

**Conditional logic:**
- Uses `getFlowBasedQuestions()` from `lib/question-logic.ts`
- `rawAnswers` (prefixed MTC keys) passed for inline FASKSES → DETAIL loop resolution
- `questionContexts[]` — parallel array tracking per-question MTC context for correct storage key
- `getActiveSections()` — hides sections whose `show_condition` is not met

**Layout:**
```
┌─────────────────────────────┐
│  TopHeader                  │
├─────────────────────────────┤
│  ████████░░░░░░  75%        │  ← progress bar
│  Bagian 3 dari 5            │
├─────────────────────────────┤
│  Section title              │
│  Section description        │
│  [Intro text callout]       │
├─────────────────────────────┤
│  [MTC context banner]       │  ← shown during detail loops
├─────────────────────────────┤
│  ┌──────────────────────┐   │
│  │ Q01  Question text * │   │
│  │ [🔊 TTS button]      │   │
│  │ [Input widget]       │   │
│  │ Error message        │   │
│  └──────────────────────┘   │
│  (one card per question)    │
├─────────────────────────────┤
│  [← Sebelumnya]             │
│  [Simpan Draft]             │
│  [Selanjutnya →] / [Selesai]│
├─────────────────────────────┤
│  BottomNavigation           │
└─────────────────────────────┘
```

---

### 7. Profile Screen
**Route key:** `profile`
**Purpose:** View and edit the current user's personal profile information.

**State:**
- `profile` — user profile object from API
- `loading` — initial fetch state
- `isEditing` — toggles edit mode
- `saving` — save request state
- `firstName`, `lastName`, `phone`, `organization` — controlled edit inputs

**Functions:**
- `fetchProfile()` — calls `/accounts/users/me/`
- `handleEdit()` — enters edit mode, copies profile to form fields
- `handleCancel()` — exits edit mode, resets inputs
- `handleSave()` — validates first/last name → PUT to API → updates profile state
- `getRoleDisplay()` — capitalizes role string

**Layout:**
```
┌─────────────────────────────┐
│  TopHeader                  │
├─────────────────────────────┤
│  Profil                     │
├─────────────────────────────┤
│  [Avatar circle — initials] │
│  Full Name                  │
│  [ROLE BADGE]     [Edit]    │
├─────────────────────────────┤
│  Informasi Pribadi          │
│  First name  (editable)     │
│  Last name   (editable)     │
│  Email       (read-only)    │
│  Phone       (editable)     │
│  Organization (editable)    │
├─────────────────────────────┤
│  Informasi Akun             │
│  Role (read-only)           │
│  User ID (read-only)        │
├─────────────────────────────┤
│  [Batal]    [Simpan]        │  ← visible when editing
├─────────────────────────────┤
│  BottomNavigation           │
└─────────────────────────────┘
```

---

### 8. Settings Screen
**Route key:** `settings`
**Purpose:** App preferences, accessibility options, data sync, and server configuration.

**State:**
- `syncing` — sync operation in progress
- `lastSyncTime` — ISO timestamp of last sync
- `lastSyncStatus` — status string ('success' | 'failed' | null)
- `serverUrl` — API URL input value
- `isSavedInDb` — whether current URL is persisted

**Functions:**
- `loadServerUrl()` — reads URL from SQLite or falls back to `apiClient` default
- `handleSaveServerUrl()` — validates URL, saves to SQLite
- `loadLastSyncTime()` — reads sync metadata from SQLite
- `formatLastSyncTime()` — converts timestamp to relative string ("2 jam lalu")
- `handleSyncData()` — runs `syncQueue.processQueue()` → shows success/failure alert
- `handleLogout()` — confirmation alert → `apiClient.logout()` → `onLogout()`

**Settings controlled via `useSettings()`:**
- `darkMode` — toggles dark/light theme
- `largeText` — scales all font sizes ×1.3
- `ttsEnabled` — enables text-to-speech on form questions
- `ttsAutoPlay` — auto-plays TTS when section changes (visible only if `ttsEnabled`)

**Layout:**
```
┌─────────────────────────────┐
│  TopHeader                  │
├─────────────────────────────┤
│  Pengaturan                 │
├─────────────────────────────┤
│  Tampilan                   │
│  Dark Mode          [toggle]│
├─────────────────────────────┤
│  Aksesibilitas              │
│  Teks Besar         [toggle]│
│  Text-to-Speech     [toggle]│
│  Auto-play TTS      [toggle]│  ← if TTS on
├─────────────────────────────┤
│  Manajemen Data             │
│  Sinkronisasi Terakhir: ... │
│  [⟳ Sinkronkan Data]       │
├─────────────────────────────┤
│  Konfigurasi Server         │
│  URL saat ini: ...          │
│  [URL input]  [Simpan]      │
├─────────────────────────────┤
│  Tentang                    │
│  Versi: 1.0.0               │
├─────────────────────────────┤
│  [     Keluar     ]         │  ← destructive red
├─────────────────────────────┤
│  BottomNavigation           │
└─────────────────────────────┘
```

---

## Design Tokens

```
Primary:        #03979D
Background:     #F5F6F7  (light) / #121212 (dark)
Surface:        #FFFFFF  (light) / #1E1E1E (dark)
Card:           #FFFFFF  (light) / #2A2A2A (dark)
Text:           #1A1A1A  (light) / #E0E0E0 (dark)
TextSecondary:  #374151  (light) / #A0A0A0 (dark)
TextMuted:      #6B7280  (light) / #707070 (dark)
Border:         #E5E7EB  (light) / #333333 (dark)
InputBg:        #FFFFFF  (light) / #2A2A2A (dark)
Danger:         #DC2626

Status colors:
  DRAFT:      #6B7280 (gray)
  SUBMITTED:  #D97706 (amber)
  VERIFIED:   #16A34A (green)
  REJECTED:   #DC2626 (red)

Font: Inter (400, 500, 600, 700)
Icons: Material Icons (@expo/vector-icons)
```
