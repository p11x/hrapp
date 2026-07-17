# 🌌 HRCore — Enterprise HR & Workforce Management

An advanced, modern, high-fidelity **HR & Workforce Management System** designed for high-performance organizations. Built with a full-stack architecture utilizing **React 18**, **TypeScript**, **Tailwind CSS**, and backed by **Firebase (Authentication, Realtime Database, Cloud Storage)**. 

HRCore provides a seamless workspace for both employees and administrators, offering real-time status updates, granular role-based access control, secure document validation, ticketing, and performance analytics.

---

## 🎨 Visual Identity & Design System

HRCore is crafted around an intentional, eye-safe, and high-contrast design system that provides a sleek, technical, yet deeply humane feel.

- **🎨 Colors**: Clean obsidian canvas (`bg-bg-app` / dark ink-950/900/800 backgrounds) contrasted by vibrant status-indicating accents (Signal Mint, Amber Pulse, Coral Warn) and elegant hairline borders.
- **✍️ Typography**:
  - **Display (Headings)**: **Space Grotesk** for tech-forward, high-contrast, modern aesthetics.
  - **Body (UI Elements)**: **Inter** for clean readability, compact spacing, and versatile legibility.
  - **Data / Status / Codes**: **JetBrains Mono** or **Fira Code** for technical metrics, serial numbers, and logs.
- **📈 Motion & Interactions**: Fully integrated with custom Framer Motion transitions, micro-interactions, responsive hover states, and smooth slide-ins.
- **⚡ Signature Component**: *Pulse Rail* — A beautiful vertical status indicator featuring live-calculating gradients and heartbeat-like animations.

---

## 🚀 Key Features & Modules

### 👑 Admin Workspace
- **📊 Unified Dashboard**: Real-time KPI charts, live attendance tracking, pending leave applications queue, and chronological activity feed.
- **🏢 Company Selection Dropdown**: Integrated dropdown showing all registered companies configured dynamically during employee creation.
- **👥 Employee CRUD Control**: Complete lifecyle management for team members, with dynamic profile setup, active/deactivated statuses, and position assignments.
- **📂 Document Center**: Fully-featured management panel allowing administrators to review, approve, download, or manually upload official credentials (Aadhaar, PAN, Resume, Photo, Signature) for every registered employee. Supports fallback mapping to Firebase UID and email profiles to guarantee data consistency.
- **📅 Leave Request Queue**: Real-time queue for approving or rejecting employee leaves with automated email-based or notification-based feedbacks.
- **📋 Reports & Analytics**: Deep operational insights built with **Recharts**, illustrating monthly attendance rates, active counts, and leave trends.
- **🎫 Support Tickets Manager**: Advanced centralized helpdesk to triage, respond, and resolve employee-submitted technical or HR queries in real time.
- **🔔 Announcements System**: Compose, prioritize, and broadcast organizational news instantly to all employee feeds.

### 💼 Employee Workspace
- **🏠 Personal Dashboard**: Live dial-meter showing day progress percentages, real-time check-in/out button, quick action buttons, and announcement widgets.
- **👤 Interactive Onboarding Profile**: Staggered bento-grid wizard displaying completion bars for personal details, academic credentials, bank details, and document uploads.
- **⏱️ Attendance Logger**: One-click clock-in and clock-out mechanisms backed by real-time geolocation validation or duration metrics.
- **📂 Document Repository**: Track submitted legal forms, upload new files dynamically, and download verified files directly.
- **📅 Holidays & Calendar**: Comprehensive view of regional holidays and scheduled organization events.
- **🎫 Help Desk Portal**: Open new support requests, category tagging, and live conversation streams with HR.

---

## 🏗️ Architecture & Tech Stack

```
               +--------------------------------------+
               |             React 18 SPA             |
               | (Vite, TypeScript, Tailwind, Recharts)|
               +------------------+-------------------+
                                  |
         +------------------------+------------------------+
         | (Mock Mode Check: VITE_USE_MOCK = true/false)   |
         v                                                 v
+--------+---------------+                        +--------+---------------+
| In-Memory Services     |                        | Firebase Services      |
| - mockAuth.ts          |                        | - Firebase Auth        |
| - mockDb.ts            |                        | - Realtime Database    |
| - mockStorage.ts       |                        | - Cloud Storage        |
+------------------------+                        +------------------------+
```

### Stack Details:
- **Frontend**: React 18 with Vite, React Router v6, Tailwind CSS v4, Lucide React, Framer Motion.
- **Backend/Database**: Firebase Suite (Authentication, Realtime Database, Cloud Storage).
- **Tooling**: TypeScript, Oxlint (ultra-fast linter), PostCSS.

---

## 🛠️ Environmental Modes

HRCore operates in two distinct execution modes, controlled by the environment variables:

### 1. Mock Sandbox Mode (`VITE_USE_MOCK=true`)
Designed for standalone local demonstration and zero-configuration setups:
- **Authentication**: Simulated with zero-network overhead via pre-seeded credentials.
- **Realtime Database**: Virtual database layers with background loops simulating live clock-ins and status modifications.
- **Cloud Storage**: Sandbox storage using in-memory Blob URL generation.

### 2. Live Cloud Mode (`VITE_USE_MOCK=false`)
Full production capabilities utilizing standard Firebase services:
- **Security Rules**: Enforced with secure `database.rules.json` and `storage.rules` verifying User UIDs and Admin custom claims.
- **Storage**: Highly durable persistence utilizing Firebase Cloud Storage buckets with signed download tokens.

---

## 🚀 Setup & Local Installation

### Prerequisites
- Node.js (v18+)
- Firebase CLI (for deployment)

### 1. Clone & Install Dependencies
```bash
git clone <repository-url>
cd hrcore
npm install
```

### 2. Configure Environment Variables
Copy the template and configure your parameters:
```bash
cp .env.example .env
```

Ensure your `.env` contains:
```env
VITE_USE_MOCK=true  # Set to 'false' to connect to live Firebase

# (Optional) If VITE_USE_MOCK=false, populate the following:
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
VITE_FIREBASE_DATABASE_URL=your-rtdb-url
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application in your browser.

---

## 🔒 Security Enforcements & Custom Claims

HRCore implements **Attribute-Based Access Control (ABAC)** leveraging Firebase Authentication custom user claims:
- Employees can only read and write data under their respective `users/{uid}`, `employees/{uid}`, and `Documents/{uid}` paths.
- Administrative roles (`admin: true`) possess global read and write keys over entire data trees.

### Admin Provisioning Script
To promote a user to administrator on a production environment:
```bash
# Set Application Default Credentials first
gcloud auth application-default login

# Run the promotion script with the target Firebase User UID
npx tsx scripts/seedAdmin.ts <UID>
```

---

## 🚀 Firebase Deployment

Ensure you are logged in to the Firebase CLI and build the static assets:

```bash
# 1. Compile the production bundle
npm run build

# 2. Login and initialize
firebase login

# 3. Select your production project
firebase use --add

# 4. Deploy rules, database, and hosting to Cloud
firebase deploy --only hosting,database,storage
```

---

## 🌌 Core Guidelines & Code Quality
- **Type Safety**: Absolute TypeScript typing with zero `any` usage in main layouts.
- **Modularity**: Separation of concerns with dedicated component files, custom presence hooks (`usePresence`), and modular context states.
- **Fast Build**: Validated using `oxlint` ensuring clean imports and optimal hook dependency arrays.
