

# Plan: Full Production Build — "Nails by Kristina"

This is a massive transformation from a mock-data demo into a fully functional, Russian-language, production-ready app with real database operations, new modules, and enhanced UI.

---

## Summary of Changes

The app currently uses hardcoded mock data everywhere, English UI text, and "Coming soon" toast placeholders. This plan replaces ALL of that with real Supabase CRUD, complete Russian localization, a new Timer module, enhanced calendar/time pickers, liquid glass UI upgrades, and theme switching.

---

## Phase 1: Database Migration

Add new tables and indexes via a single migration:

- **`timer_sessions`** table: `id`, `owner_id`, `client_id` (nullable FK to clients), `appointment_id` (nullable FK to appointments), `started_at`, `ended_at`, `duration_seconds`, `status` (enum: `running`, `paused`, `completed`), `note`, `created_at`
- **Create enum** `timer_status`: `running`, `paused`, `completed`
- **Add indexes** on frequently queried columns: `clients(owner_id, lifecycle_status)`, `appointments(owner_id, start_time)`, `visits(owner_id, client_id)`, `incomes(owner_id, received_at)`, `expenses(owner_id, spent_at)`, `reminders(owner_id, status, reminder_date)`, `timer_sessions(owner_id)`
- **Add `updated_at` trigger** to `timer_sessions`
- **RLS policy** on `timer_sessions`: owner access via `auth.uid() = owner_id`
- **Storage policy** on `visit-photos` bucket for authenticated owner uploads/reads/deletes

---

## Phase 2: Shared Hooks & Utilities Layer

Create reusable data hooks in `src/hooks/` using `@tanstack/react-query` + Supabase client:

- **`useClients`** — list, create, update, delete clients; search/filter by name, phone, lifecycle, loyalty
- **`useClient(id)`** — single client with visits, photos, reminders
- **`useAppointments`** — CRUD, filter by date range, status changes, completion flow (auto-create visit + income)
- **`useServices`** — list active services for appointment builder
- **`useVisits`** — list by client, create from completed appointment
- **`usePhotos`** — upload to Storage, save metadata, toggle favorite, delete (both storage + DB)
- **`useIncomes` / `useExpenses`** — CRUD, filter by month/year
- **`useReminders`** — CRUD, filter by status, mark as sent
- **`useTimerSessions`** — CRUD, link to client/appointment
- **`useMessageTemplates`** — CRUD
- **`useTags`** — list/create tags
- **`useDashboardStats`** — aggregated queries for home page
- **`useTheme`** — light/dark/system toggle, persisted to localStorage

Each hook handles `owner_id` injection from `useAuth().user.id`.

---

## Phase 3: Complete Russian Localization

Every single page, component, label, placeholder, toast, empty state, error message, button — translated to Russian. Examples:

- Bottom nav: Главная, Календарь, Клиенты, Галерея, Таймер, Финансы
- Auth: "Войти", "Создать аккаунт", "Электронная почта", "Пароль"
- Dashboard greeting: dynamic based on `new Date().getHours()` — Доброе утро / Добрый день / Добрый вечер / Доброй ночи
- All form labels, validation errors, success toasts in Russian
- Calendar day names, month names in Russian (use `date-fns/locale/ru`)

---

## Phase 4: Page-by-Page Rewrites

### 4.1 Auth Page (`AuthPage.tsx`)
- Russian labels, Google OAuth button, password reset flow
- Premium liquid glass card container

### 4.2 Home / Dashboard (`HomePage.tsx`)
- Real data from `useDashboardStats` — revenue, expenses, profit, appointment count, avg check, repeat rate
- Real upcoming appointments from DB
- Real overdue/today reminders from DB
- Dynamic time-based greeting in Russian
- Quick actions that open real forms (not "coming soon")
- Period filter (Сегодня / Эта неделя / Этот месяц) queries real data

### 4.3 Clients (`ClientsPage.tsx`)
- Real client list from `useClients`
- Working search by name/phone/telegram
- Working filters by lifecycle/loyalty
- FAB opens a bottom sheet form to create client with chips for colors, shapes, lengths
- Delete with confirmation dialog

### 4.4 Client Profile (`ClientProfilePage.tsx`)
- Real client data from `useClient(id)`
- Real visit timeline from `useVisits`
- Real gallery from `usePhotos`
- Working "Remind" button opens reminder creation bottom sheet
- Working "Book" button opens appointment creation
- Edit client, archive client
- Loyalty/retention badges from real data

### 4.5 Calendar (`CalendarPage.tsx`)
- Real appointments from `useAppointments` for selected date
- Expandable month calendar (collapsible to week strip) with Russian locale
- Create appointment: bottom sheet with client picker, service multi-select (chips), iOS-style wheel time picker, auto-price calculation
- Edit/reschedule/cancel appointment
- Complete appointment flow: mark complete → auto-create visit record → optionally record payment (creates income)
- Status change buttons on each appointment card

### 4.6 Gallery (`GalleryPage.tsx`)
- Real photos from `usePhotos` (join with visits/clients)
- Upload photos via Supabase Storage
- Working favorite toggle (persisted to DB)
- Working delete with confirmation (removes from Storage + DB)
- Download/save photo button (generates signed URL, triggers download)
- Filter by client, favorites
- Fullscreen viewer with swipe navigation

### 4.7 Timer (`TimerPage.tsx`) — NEW PAGE
- Add to bottom nav between Gallery and Finances
- Beautiful circular/glass timer display with large digits
- Start / Pause / Resume / Stop / Reset controls
- Link to client (dropdown) and appointment (optional)
- Save session to `timer_sessions` table on stop
- Session history list below timer
- Russian labels throughout

### 4.8 Finances (`FinancesPage.tsx`)
- Real income/expense data from hooks
- Add Income bottom sheet: amount, client picker, payment method chips, note
- Add Expense bottom sheet: amount, category picker, note
- Month/year filter selectors
- Totals for selected period (income, expenses, profit)
- Transaction list with real data
- Delete transaction with confirmation

### 4.9 Settings Page — NEW
- Route: `/settings` (accessible from home page gear icon or profile area)
- Theme toggle (Светлая / Тёмная / Системная)
- Owner profile display
- Sign out button
- Service management (list, add, edit, deactivate services)
- Expense categories management
- Message templates management

---

## Phase 5: Bottom Navigation Update

Update `BottomNav.tsx` to 6 tabs in Russian:
Главная | Календарь | Клиенты | Галерея | Таймер | Финансы

Add Timer icon (e.g., `Timer` from lucide-react). Adjust icon sizes for 6-tab layout.

---

## Phase 6: UI Enhancements

- **Liquid Glass**: Enhance `glass-card` CSS with inner soft gradients, light reflections via pseudo-elements, stronger backdrop blur
- **Theme system**: `useTheme` hook toggles `dark` class on `<html>`, persists to localStorage, supports "system" via `matchMedia`
- **Cyrillic font check**: Inter and Playfair Display both support Cyrillic — keep them
- **Bottom sheet pattern**: Create reusable `BottomSheet` component using `@radix-ui/react-dialog` or Drawer for all create/edit forms
- **iOS-style time picker**: Build a custom wheel-scroll time picker component with hour/minute columns
- **Expandable calendar**: Month grid that collapses to week strip, Russian day/month names

---

## Phase 7: Business Logic

- **Appointment completion flow**: When status changed to "completed", prompt to create visit + income. Auto-populate services, price, client from appointment.
- **Client stat refresh**: After creating a visit, update client's `total_visits`, `total_spent`, `average_check`, `last_visit_date`, `days_since_last_visit` via a Supabase DB function or client-side recalculation.
- **Loyalty calculation**: Based on total_visits (Bronze <5, Silver 5-14, Gold 15-29, VIP 30+) or manual override.
- **Retention status**: Based on days_since_last_visit (active <21d, inactive 21-60d, lost >60d, new = 0 visits).

---

## Technical Details

### Files to Create (~15 new files)
- `src/hooks/useClients.ts`, `useAppointments.ts`, `useServices.ts`, `useVisits.ts`, `usePhotos.ts`, `useIncomes.ts`, `useExpenses.ts`, `useReminders.ts`, `useTimerSessions.ts`, `useMessageTemplates.ts`, `useTags.ts`, `useDashboardStats.ts`, `useTheme.ts`
- `src/pages/TimerPage.tsx`, `src/pages/SettingsPage.tsx`
- `src/components/BottomSheet.tsx`, `src/components/WheelTimePicker.tsx`, `src/components/MonthCalendar.tsx`
- 1 new migration file for `timer_sessions` table + indexes + storage policies

### Files to Heavily Rewrite (~12 files)
- All 6 existing page files (HomePage, CalendarPage, ClientsPage, ClientProfilePage, GalleryPage, FinancesPage)
- AuthPage.tsx
- BottomNav.tsx
- App.tsx (add Timer + Settings routes)
- index.css (liquid glass enhancements, theme transitions)
- PageHeader.tsx (Russian, settings access)

### Dependencies
- `date-fns` (already installed) — use `locale/ru` for Russian calendar
- No new npm packages needed — existing stack covers everything

---

## Estimated Scope

This is a very large change touching ~30 files with ~5000+ lines of new/modified code. The migration adds 1 new table, indexes, and storage policies. Every page transforms from mock data to real Supabase queries with full CRUD forms.

