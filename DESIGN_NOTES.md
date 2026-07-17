# HRCore Design Notes — Phase 6 Re-theme

## Token Swap Rationale

### Prior Dark Theme (Phase 1-5)
- **Purpose**: "Ops Rail" identity — high-contrast, developer-focused aesthetic
- **Colors**: ink-950/900/800 background, signal/pulse/warn status palette
- **Visual Style**: Dark sidebar (PulseRail), heavy shadows, high contrast

### New Light Theme (Phase 6)
- **Purpose**: SaaS dashboard — data-dense, professional, lighter aesthetic
- **Colors**: 
  - `bg-app: #F5F6FB` — soft neutral background (not pure white to reduce eye strain)
  - `surface: #FFFFFF` — card backgrounds for clean separation
  - `border-soft: #EAEBF3` — hairline borders, no heavy shadows
  - `primary: #4F46E5` — indigo for primary actions, active nav, chart accents
  - `primary-dim: #EEF0FD` — light tint for active state backgrounds
  - `accent-coral: #F472B6` — secondary chart, alerts
  - `accent-mint: #10B981` — success/present/approved states
  - `accent-amber: #F59E0B` — pending/warning/late states
  - `text-hi: #1E1B2E` — near-black for primary text
  - `text-mid: #6B7280` — secondary text
  - `text-low: #A0A3B1` — muted/disabled text

## Component Changes

### Login.tsx
- Added pill-style segmented toggle "Admin | Employee" above form
- Active segment: `bg-primary` (indigo), inactive: transparent with `border-soft`
- Role mismatch now shows inline error "This account doesn't have admin access"
- Card uses 16px radius, 1px border, subtle shadow
- Removed StatusDot logo in favor of simple colored circle

### PulseRail.tsx
- Background: `bg-white` with `border-r` on right edge
- Active nav icon: `text-primary` with `bg-primary-dim` background
- Inactive nav icon: `text-text-low`
- Rail dots: colored circles (mint/amber/coral) on white background
- Removed dark-only styling, retained GSAP pulse animation

### AdminDashboard.tsx (REF 2)
- 2-column layout: left (wide) for charts + availability tiles, right (narrow) for KPI hero card + upcoming reviews
- Header bar with search input, bell notification, avatar stack, profile chip
- AreaChart: indigo gradient fill for employee trend
- Availability tiles: 2x2 grid with emoji icons
- BarChart: Top Departments with indigo bars
- KPI hero: indigo-600/500 gradient with stat rows below

### AttendanceViewer.tsx (REF 7)
- Grid layout: sticky employee column + day-of-month columns (horizontal scroll)
- Legend row: mint dot (Present), amber outline (Half Day), coral dot (Absent)
- Cell content: small colored status circles
- Header: Edit Attendance (indigo pill), Filter (outline pill w/ chevron)

### LeaveQueue.tsx (REF 9)
- Table view with EMPLOYEE ID (mono/corral), avatar+name, leave type, dates, reason, actions
- Search input top-right, "Show 10 entries" dropdown top-left
- Pagination: "Showing X to Y of Z entries"
- Approve/reject: mint/coral circular icon buttons

### Tickets.tsx (REF 6)
- Two-column layout: LEFT = status/priority badges, title+description, attachments; RIGHT = chat panel
- Status pills: amber "In Progress", mint "Resolved", coral "High priority"
- Attachment sections: file-icon tile + filename + Download button
- Chat: textarea with toolbar icons, threaded comments with avatar+timestamp

### Employees.tsx (REF 10)
- Card grid (2-3 cols): circular colored avatar, Name, Role/Department, contact info
- Role badge chips: colored pills
- Action buttons: Message (indigo) / Profile (outline)
- Header: Add Employee button + Status filter dropdown

### Holidays.tsx / HolidayCalendar.tsx (REF 11)
- Full month grid with day-of-week headers
- Date cells with colored bar chips (mint/amber/coral by holiday type)
- Today highlight: primary-dim background
- Header: month/year label, Today + prev/next buttons, Add Event button

### employee/Attendance.tsx (REF 8)
- Two-column: LEFT = circular progress ring (70%), punch time, Punch Out button, legend rows, recent activity; RIGHT = ComposedChart (indigo bars + coral line)
- Progress ring: SVG with indigo stroke, center-percentage label
- Bottom row: 3 horizontal progress bars with mono percentage labels
- Recent Activity list: colored dot + icon + label + time

## Retained Elements

- **Typography**: Space Grotesk (display), Inter (body), JetBrains Mono (data/timestamps) — maintains brand distinction
- **Focus Rings**: Visible outline with `focus-ring` utility class
- **GSAP Pulse Animation**: Retained on rail dots as signature element
- **All functionality**: Approve/reject, CSV export, CRUD, presence, command palette unchanged

## Reference Layout Mapping

| Reference Element | HRCore Implementation |
|---|---|
| Light card-based layout | `bg-white` + `border-soft` + `shadow-sm` |
| Segmented role selector | Admin/Employee pill toggle on Login |
| White sidebar nav | Light PulseRail with colored dots |
| Data-dense dashboards | KPI cards, AreaChart/Donut/Bar charts |
| Clean form styling | White inputs with soft borders |

## Mock Mode File Handling Limitations

### Blob URL Persistence
- Uploaded file URLs (via `URL.createObjectURL`) are **session-only** in mock mode
- Blob URLs become invalid after page refresh since they're not persisted in mockDb
- This is acceptable for demo purposes; production would use Firebase Storage with permanent download URLs

### File Size Considerations
- mockStorage.ts stores files in a Map for the session duration
- Maximum practical file size: ~5MB (browser memory limit for blob URLs)
- Large files (>10MB) may fail silently in mock mode

### Demo Data Attachments
- Seed ticket attachments (Phase 2 data) have no real files behind them
- Download buttons for seed attachments show disabled state with tooltip "Demo data — no file attached"
- Only user-uploaded files (Documents, OfferLetters, Payslips) have working download functionality

## Phase 7: Sidebar + New Modules (2026-07-13)

### Sidebar.tsx
- Fixed 260px width (desktop), collapses to 80px, hamburger on mobile (<768px)
- Logo/brand "HRCore" at top with "H" indigo circle
- Scrollable nav with 12 items: Dashboard, Employees View, Attendance Detail, Leave Request, Projects Management, Task Management, Project Timesheet, Tickets Detail, Clients List, Calendar Events, Chat List, Contact
- Active item: primary-dim background, indigo icon+text, dot indicator on rail-enabled items
- Retained mobile bottom nav (first 5 items)

### New Pages
- **EmployeesView.tsx**: Donut chart (time utilisation), ComposedChart (yearly status), 3 progress bars, recent activity list
- **Projects.tsx**: Status tabs, project card grid with colored icon, name, stats row, progress bar + days left pill
- **TaskManagement.tsx**: 3-column kanban, task progress bars, recent activity, allocated members with remove pill
- **ProjectTimesheet.tsx**: Table with MON-SUN time inputs, total badge, pagination
- **Clients.tsx**: Card grid with avatar, name, title, description, status badge, chat/profile buttons, filter dropdown
- **ChatList.tsx**: Two-column chat UI with tabs, thread list, message bubbles, send input
- **Contact.tsx**: Split view with form (photo upload, name, birthdate, email, phone) and grid/list view toggle

### Mock Data Extensions (seedData.ts)
- `projects`: 8 seeded projects across UI/UX, Web Dev, App Dev, Backend, QA
- `tasks`: 4 tasks with status field for kanban
- `timesheets`: 3 timesheet entries
- `clients`: 5 sample clients
- `contacts`: 2 sample contacts
- `messages_Chat`: 3 chat threads with mock messages