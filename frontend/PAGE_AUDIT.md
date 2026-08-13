# Dashboard Page Design Audit

Audited all ~37 dashboard pages against 3 references:
- **Cards** → `app/dashboard/page.tsx`
- **Table** → `app/dashboard/survey/page.tsx`
- **Detail** → `app/dashboard/survey/[id]/page.tsx`

Best-aligned existing pages: `survey/audit`, `users/page.tsx`, `survey/[id]/edit` (use as secondary examples).

---

## HIGH severity

### English UI labels (violates Indonesian-label rule)
Breadcrumb "Dashboard" should be "Dasbor"; all titles/headers/buttons/empty-states Indonesian.
- `services/categories`, `services/mtc`, `services/service-types`, `services/target-populations`, `services/new`
- `survey/pending`, `survey/bulk-upload`
- `logs/activity`, `logs/changes`, `logs/errors`, `logs/import-export`, `logs/verification` (all breadcrumbs/titles/headers)
- `users/new`, `users/roles`, `users/login-history`
- `help/*` (all 5), `indicators`, `settings`, `submissions`, `submissions/[id]`

### Structural rule violations
- **Table wrapped in `<Card>`** (forbidden): `logs/activity`, `logs/changes`, `logs/errors`, `logs/import-export`, `logs/verification`, `users/roles`
- **Raw HTML `<table>`** instead of shadcn Table: `submissions/page.tsx:296-344`
- **Non-hugeicons**: `users/roles` imports `Check, X` from lucide-react
- **hugeicons bare imports** (`hugeicons-react`) vs reference wrapper (`@hugeicons/react` + `@hugeicons/core-free-icons`): `services/categories`, `services/mtc`, `services/geographic-units`, `survey/model-kuisioner`, `survey/templates/[id]`

---

## MED severity — systemic table drift (every table page)
- Container `rounded-lg`/`rounded-md` → should be `rounded-sm border bg-white overflow-hidden`
- Header row missing `bg-muted/50` and `TableHead border-r last:border-r-0`
- Rows missing `even:bg-muted` striping
- Title block uses card padding (`px-8 pt-8`, `text-2xl`) instead of table (`px-6 pt-6`, `text-xl`, `gap-3`): `survey/approved`, `survey/rejected`, `users/page`, `users/login-history`, all `logs/*`
- Stat cards default-bordered → should be `border-0 bg-white shadow-none`
- Filter heights `h-10` (logs) → should be `h-9`/`min-h-9`
- Filter layout inverted (search left / filters right) — spec: filters LEFT, sort+search RIGHT: `services/categories`, `services/geographic-units`, `survey/model-kuisioner`

## MED severity — card / detail drift
- Default bordered `<Card>` instead of `border-0 bg-white shadow-none`: `indicators`, `map`, `settings`, `help/*`, `logs/*` stat cards
- `map`: title/content padding `px-4` not `px-8`
- `submissions/[id]:31-36` status badge variants INVERTED — VERIFIED=outline should be strongest (`default`); DRAFT should be `outline`, SUBMITTED `secondary`, REJECTED `destructive`
- `settings` loading state: small icon spinner + no PageHeader; should be centered `h-16 w-16` spinner
- Wrong gap on help pages: `gap-6` → `gap-4`

## Color inconsistency (project-wide)
- CLAUDE.md primary = `#00979D` but dashboard charts + map use `#07579E`; map also has `#007A80` stroke and a 3rd legend teal. Pick one primary teal and align.

---

## Recommended fix order (highest leverage)
1. **logs/* template** — one shared fix pattern fixes 5 near-identical pages (unwrap Card, table styling, px-6/text-xl, Indonesian, stat cards border-0).
2. **Indonesian labels sweep** — mechanical, touches most HIGH items.
3. **services/* table pages** — categories/mtc/geographic-units share the `border-b` title + bare-icon + English pattern.
4. **submissions/page.tsx** — convert raw `<table>` to shadcn Table.
5. **Table styling helper** — consider a shared table shell component so `rounded-sm bg-white overflow-hidden` + `bg-muted/50` header + `even:bg-muted` + `border-r` are applied once.
6. **submissions/[id] badge variants** + **color token unification**.
