# 🌌 Student Developer Club (SDC) - Official Platform

A full-stack, production-grade web application built for the **Student Developer Club (SDC)**. Features interactive 3D WebGL scenes, a dynamic dark-mode user experience, full-stack REST API architecture, and real-time integration with **Supabase Cloud Database**.

---

## ⚡ Tech Stack

### **Frontend**
- **Framework**: React 19 + TypeScript + Vite
- **3D Graphics & Shaders**: Three.js, `@react-three/fiber`, `@react-three/drei`, GLSL Shaders
- **Styling & UI**: Tailwind CSS v4, Custom Specular Lighting Engine, Lucide Icons
- **Animations**: Framer Motion, GSAP
- **State & Router**: React Router v7, Zustand, Context API

### **Backend & Database**
- **Server**: Express.js (Node.js) with Modular Routing
- **Database**: Supabase (PostgreSQL)
- **Database Client**: `@supabase/supabase-js`
- **Environment**: Dotenv, CORS, TSX Watcher

---

## ✨ Features

- **🌀 Interactive 3D Black Hole Canvas**: Custom WebGL 3D particle visualizer running 60 FPS GLSL gravitational lensing shaders.
- **🚀 Dynamic Projects Showcase**: Submit open-source projects, filter by technology tags, and browse community repositories.
- **📅 Semester Events Calendar**: Browse upcoming workshops, hackathons, and talks with live spot reservation tracking.
- **📰 SDC Chronicle (Blog)**: Technical deep dives, Cloudflare Page deployment guides, and hackathon retrospectives.
- **👥 Member Roster & Faculty Coordinators**: Student lead directory and academic advisors.
- **🛡️ Unified Role-Based Dashboard (`#/dashboard`)**: 
  - Single, consolidated portal without separate or detached admin routes.
  - **When an Admin logs in**: The UI dynamically updates to reveal the **Admin Control Suite** (Pending member join applications review & one-click approval/rejection queue, Pending project review & one-click approval queue, Event manager with seat tracking, Broadcast announcement studio, Member roster directory, Live platform stats editor, and Content studio for blogs, student testimonials, and FAQs).
  - **Member Join Approval Flow**: New student registrations start in a `pending` state and display a dedicated **Application Under Review** screen with live status polling. Once approved by an administrator, full dashboard access, internal squads, and workshop repositories are unlocked immediately.
  - **Standard Member view**: Personalized workshop enrollment tracking, submitted project builds, profile photo upload with auto-scaling & monogram fallback, and a membership progression stepper.
  - Real-time PostgreSQL database synchronization status indicator (`DB Live` / `Syncing`).
- **📊 Real-time Stats & Community Testimonials**: Dynamic metric cards connected live to PostgreSQL database tables.

---

## 📁 Project Architecture

```text
sdc/
├── .env                       # Supabase credentials & server ports
├── index.html                 # App HTML entry point
├── package.json               # Dependencies & build scripts
├── vite.config.ts             # Vite configuration with React & Tailwind plugins
│
├── server/                    # Express Backend & Database Utilities
│   ├── index.ts               # Server entry point & API middleware
│   ├── db.ts                  # Supabase Client initialization
│   ├── schema.sql             # PostgreSQL Database Schema definition
│   ├── seed.ts                # Database seed script for Supabase
│   ├── check_supabase.ts      # Health & schema verification utility
│   └── routes/                # Modular API endpoints
│       ├── projects.ts        # GET, POST, PATCH, DELETE /api/projects
│       ├── events.ts          # GET, POST, PATCH, DELETE /api/events
│       ├── blogs.ts           # GET, POST, PATCH, DELETE /api/blogs
│       ├── members.ts         # GET, POST, PATCH, DELETE /api/members
│       ├── stats.ts           # GET, PATCH /api/stats
│       ├── voices.ts          # GET, POST, PATCH, DELETE /api/voices
│       ├── faqs.ts            # GET, POST, PATCH, DELETE /api/faqs
│       └── announcements.ts   # GET, POST, PATCH, DELETE /api/announcements
│
└── src/                       # React Frontend Application
    ├── main.tsx               # React DOM rendering
    ├── App.tsx                # Client Routing & Navigation layout
    ├── components/            # Reusable UI components & 3D Shaders
    │   ├── BlackHoleScene.tsx # R3F 3D Black Hole particle canvas
    │   ├── NavBar.tsx         # Floating glassmorphism navbar
    │   ├── Footer.tsx         # App footer
    │   └── ui/                # Custom UI primitives (SpecularButton)
    ├── context/               # AuthContext & global state providers
    ├── lib/                   # API Client & Projects Store helpers
    │   ├── api.ts             # Central REST API client
    │   ├── projectsStore.ts   # Projects state sync with Supabase
    │   └── CosmicAudio.ts     # Synthesizer audio engine
    └── pages/                 # Application Page Views
        ├── HomePage.tsx       # Landing page, hero, tracks, voices & FAQs
        ├── ProjectsPage.tsx   # Project gallery & submission modal
        ├── EventsPage.tsx     # Semester events calendar & registration
        ├── BlogPage.tsx       # Engineering articles & tutorials
        ├── AboutPage.tsx      # Club story, values, team & faculty
        └── DashboardPage.tsx  # Unified Member Portal & Admin Command Center (`#/dashboard`)
```

---

## 🛠️ Getting Started

### **1. Prerequisites**
- Node.js (v18 or higher)
- npm or yarn
- Supabase account & project

### **2. Environment Configuration**
Create a `.env` file in the root directory:

```env
# ── Supabase Credentials ───────────────────────────────────
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_KEY=your-secret-service-role-key

# ── Express Server ────────────────────────────────────────
SERVER_PORT=4000

# ── Vite Frontend ─────────────────────────────────────────
VITE_API_URL=http://localhost:4000
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-publishable-key
```

### **3. Database Setup & Seeding**
1. Run `server/schema.sql` in your **Supabase Dashboard → SQL Editor** to create database tables (`projects`, `events`, `blogs`, `members`, `stats`, `voices`, `faqs`, `announcements`).
2. Run the seed script to populate initial club data into Supabase:
   ```bash
   npm run server:seed
   ```
3. Seed default demo accounts into Supabase Auth (`admin@sdc.club`, `member@sdc.club`):
   ```bash
   npx tsx server/seed_auth.ts
   ```

> **Demo Credentials:**
> - **Admin**: `admin@sdc.club` / `Admin@SDC2026!`
> - **Member**: `member@sdc.club` / `Member@SDC2026!`

### **4. Running locally**

Run both the Express server and Vite frontend concurrently:

```bash
npm run dev:all
```

Or start them individually in separate terminals:

```bash
# Terminal 1: Start Express API server (port 4000)
npm run server:dev

# Terminal 2: Start Vite Dev Server (port 5173)
npm run dev
```

---

## 🧪 Building & Verification

- **Type Check**:
  ```bash
  npx tsc --noEmit
  ```
- **Linting**:
  ```bash
  npx oxlint
  ```
- **Production Build**:
  ```bash
  npm run build
  ```

---

## 🔒 Security & Authentication Architecture

The SDC platform implements enterprise-grade authentication, row-level database security, and bot prevention:

### 1. 🎓 University vs External Member Classification
- **University Emails** (strictly `@goa.paruluniversity.ac.in`):
  - Eligible for **University Member** status.
  - Verified student / faculty access to member dashboard, event registrations, and project submissions.
- **External Emails** (`@gmail.com`, other college domains, etc.):
  - Automatically classified as **External Members**.
  - Permitted to join the community, browse repositories, and submit projects.
  - Restricted from claiming university member privileges.

### 2. 🛡️ Row-Level Security (RLS) on Every Table
All 8 Supabase PostgreSQL tables have RLS strictly enabled:
- `projects`, `events`, `blogs`, `members`, `stats`, `voices`, `faqs`, `announcements`.
- **Public Read Access**: Approved projects, public events, active announcements, published blogs, and FAQs are readable by public clients.
- **Protected Mutations**: Updates and deletions require authenticated sessions or verified administrator privileges.
- Execute `server/schema.sql` in your Supabase SQL editor to apply all policies.

### 3. ✉️ Email Confirmation Requirement
- New registrations require email confirmation before account sign-in.
- When an unconfirmed user attempts to sign in, the system alerts them with `EMAIL_NOT_CONFIRMED` and provides an instant **Resend Verification Email** action.
- Confirmation redirects are routed securely back to the SDC application.

### 4. 🔑 Minimum Password Length (8+ Characters)
- Enforced on both frontend forms and backend API endpoints (`/api/auth/register` and `/api/auth/login`).
- Real-time password meter provides visual feedback (`X/8 chars` / `✓ 8+ chars`).

### 5. 🛡️ Sliding Window Rate Limits & Interactive CAPTCHA
- **Backend Rate Limiting** (`server/middleware/rateLimiter.ts`):
  - Sign-in: Max 5 attempts per 15 minutes per IP.
  - Registration: Max 5 attempts per 60 minutes per IP.
  - Confirmation resends: Max 3 requests per 15 minutes per IP.
- **Interactive Anti-Bot CAPTCHA** (`CaptchaChallenge.tsx`):
  - Canvas-rendered distorted alphanumeric code with random noise, lines, and rotation.
  - Required for all registration, sign-in, and modal authorization flows.

### 6. 📧 Custom SMTP Configuration (Supabase)
To avoid Supabase's default email rate limits (3 emails/hour on free tier) and ensure emails arrive reliably from the club's domain:

1. Open your **[Supabase Dashboard](https://supabase.com/dashboard)**.
2. Select your project → **Project Settings** → **Authentication** (under Configuration).
3. Scroll to **SMTP Settings** and toggle **Enable Custom SMTP** to **ON**.
4. Configure your SMTP provider (e.g. Gmail App Password, Resend, SendGrid, Amazon SES):
   - **Sender Email**: `sdc@paruluniversity.ac.in` (or your verified domain email)
   - **Sender Name**: `SDC Parul University`
   - **Host**: e.g., `smtp.gmail.com` or `smtp.resend.com`
   - **Port**: `587` (TLS) or `465` (SSL)
   - **Username**: Your SMTP username / email
   - **Password**: Your SMTP password / API token
5. Click **Save** and use the **Send Test Email** button to verify deliverability.
6. Under **Authentication → URL Configuration**, confirm that **Site URL** is set to your frontend domain (e.g. `http://localhost:5173` or `https://sdc-parul.edu`).

### 7. 🔐 Zero Service Role Exposure on Frontend
- `SUPABASE_SERVICE_KEY` resides strictly in `server/` behind Node.js environment variables.
- The Vite frontend (`src/`) only uses `VITE_SUPABASE_ANON_KEY`, ensuring RLS and permissions are always evaluated against user context.

---

## 📜 License

Distributed under the MIT License. Built with ❤️ by the **Student Developer Club**.
