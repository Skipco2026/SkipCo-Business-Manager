# SkipCo Business Manager

A modern SaaS web application for **DDW Consolidate (Pty) Ltd t/a SkipCo Solutions** — an all-in-one business management platform for skip hire, waste removal, and field service operations.

## Tech Stack

- **Next.js 15** — App Router, Server Components, Middleware
- **TypeScript** — Full type safety
- **Tailwind CSS 4** — Utility-first styling with custom design tokens
- **Supabase** — Authentication and database (ready for integration)
- **Framer Motion** — Smooth animations and transitions
- **next-themes** — Dark and light mode support

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- npm, yarn, or pnpm
- A [Supabase](https://supabase.com) project (for authentication)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd SkipCo-Business-Manager

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Add your Supabase credentials to .env.local
# NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Supabase Setup

1. Create a project at [supabase.com/dashboard](https://supabase.com/dashboard)
2. Go to **Settings → API** and copy your Project URL and anon key
3. Paste them into `.env.local`
4. Enable Email auth under **Authentication → Providers**
5. Create a user under **Authentication → Users** for testing

## Project Structure

```
src/
├── app/
│   ├── (app)/              # Protected app routes
│   │   ├── dashboard/      # Main dashboard
│   │   ├── customers/      # Customer management
│   │   ├── quotes/         # Quote management
│   │   ├── invoices/       # Invoice management
│   │   ├── statements/     # Account statements
│   │   ├── pos/            # Point of sale
│   │   ├── products/       # Products & services
│   │   ├── jobs/           # Job scheduling
│   │   ├── calendar/       # Calendar view
│   │   ├── reports/        # Business reports
│   │   └── settings/       # System settings
│   ├── auth/callback/      # Supabase auth callback
│   ├── login/              # Login page
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Landing page
│   └── globals.css         # Global styles
├── components/
│   ├── dashboard/          # Dashboard-specific components
│   ├── layout/             # Sidebar, TopNav, shells
│   ├── marketing/          # Landing page components
│   ├── providers/          # Context providers
│   └── ui/                 # Reusable UI components
├── config/
│   ├── navigation.ts       # Sidebar menu configuration
│   └── site.ts             # Company and site metadata
├── lib/
│   ├── data/               # Mock data (replace with Supabase queries)
│   ├── supabase/           # Supabase client utilities
│   └── utils.ts            # Shared utilities
├── types/                  # TypeScript type definitions
└── middleware.ts           # Auth route protection
```

## Features

- **Landing Page** — Professional marketing page with company branding
- **Authentication** — Supabase email/password login with route protection
- **Dashboard** — KPI cards for revenue, invoices, quotes, customers, and jobs
- **Sidebar Navigation** — Full menu with 11 modules
- **Dark/Light Mode** — System-aware theme toggle
- **Responsive Design** — Mobile-first with collapsible sidebar
- **Premium UI** — Rounded cards, shadows, animations, and professional spacing

## Company Details

| Field | Value |
|-------|-------|
| Legal Name | DDW Consolidate (Pty) Ltd t/a SkipCo Solutions |
| Registration | 2025/216609/07 |
| Email | ddw.trading@outlook.com |
| Phone | 0627379728 |
| Location | Bloemfontein, Free State, South Africa |

## Brand Colours

| Token | Hex |
|-------|-----|
| Primary (Teal) | `#0F8B8D` |
| Secondary (Charcoal) | `#2B2B2B` |
| Background | `#FFFFFF` |
| Accent | `#000000` |

## Scripts

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

## License

Proprietary — DDW Consolidate (Pty) Ltd t/a SkipCo Solutions. All rights reserved.
