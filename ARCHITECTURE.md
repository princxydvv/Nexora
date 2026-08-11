# Nexora AI SaaS - Project Architecture

This document explains the project structure and how to navigate the codebase.

## Overview

Nexora is a Next.js 16 App Router SaaS application that transforms any topic into a structured AI research report. The codebase follows a **feature-based clean architecture** with clear separation of concerns.

## Directory Structure

```
.
├── app/                          # Next.js App Router (Routes / Controllers)
│   ├── (public)/                 # Public marketing pages (no auth required)
│   │   ├── page.tsx              # Homepage
│   │   ├── pricing/page.tsx
│   │   ├── privacy/page.tsx
│   │   ├── terms/page.tsx
│   │   ├── payment-success/page.tsx
│   │   └── payment-failed/page.tsx
│   ├── (auth)/                   # Authentication pages
│   │   ├── signin/page.tsx
│   │   ├── signup/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   └── callback/page.tsx
│   ├── (app)/                    # Protected application pages
│   │   ├── dashboard/page.tsx
│   │   ├── workspace/page.tsx
│   │   ├── workspace/new/page.tsx
│   │   ├── report/[id]/page.tsx
│   │   ├── billing/page.tsx
│   │   ├── profile/page.tsx
│   │   └── settings/page.tsx
│   ├── api/                      # API Routes (Controllers)
│   │   ├── research/
│   │   ├── billing/
│   │   └── billing/razorpay/
│   ├── layout.tsx                # Root layout
│   ├── page.tsx
│   ├── error.tsx
│   ├── loading.tsx
│   ├── not-found.tsx
│   └── globals.css
│
├── components/                   # Reusable UI Components (Views)
│   ├── ui/                       # Base UI primitives
│   ├── layout/                   # Navbar, Footer, CosmicBackground
│   ├── marketing/                # Hero, Features, Pricing, FAQ
│   ├── auth/                     # SignIn, SignUp forms
│   ├── research/                 # Research UI components
│   └── billing/                  # CheckoutButton, PricingCard
│
├── features/                     # Feature Modules (Domain Logic)
│   ├── auth/                     # Authentication feature
│   │   ├── contexts/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── types/
│   ├── research/                 # Research feature
│   │   ├── api/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── lib/
│   │   └── types/
│   └── billing/                  # Billing/subscription feature
│       ├── api/
│       ├── hooks/
│       ├── services/
│       └── types/
│
├── lib/                          # Core Integrations & Utilities
│   ├── supabase/                 # Supabase clients
│   ├── ai/                       # AI provider integrations
│   ├── search/                   # Search integrations
│   ├── razorpay.ts
│   ├── route-intent.ts
│   └── utils.ts
│
├── hooks/                        # Global custom hooks
├── middleware.ts
├── providers.tsx
├── public/
├── scripts/
├── supabase/
├── package.json
└── tsconfig.json
```

## Architecture Pattern

**Feature-Based Clean Architecture** adapted for Next.js App Router.

### Layers

1. **Routes** (`app/`) - Next.js file-system routing
2. **Features** (`features/`) - Domain modules, self-contained
3. **Components** (`components/`) - Presentation layer
4. **Integrations** (`lib/`) - External services, no business logic
5. **Services** (`features/*/services/`) - Business logic, pure functions

### Data Flow

```
User Action → Page Component → Custom Hook → Service → Integration → External API
```

## Key Concepts

### Route Groups
Route groups like `(public)`, `(auth)`, `(app)` organize routes without affecting URLs. They enable shared layouts within each group.

### Feature Modules
Each feature in `features/` is self-contained:
- `api/` - API route handlers
- `hooks/` - React hooks
- `services/` - Business logic
- `types/` - TypeScript interfaces
- `lib/` - Feature utilities

### Path Aliases
- `@/` → project root
- Example: `import { useAuth } from '@/features/auth/contexts/auth-context'`

## Deployment

### Vercel (Recommended)
```bash
vercel --prod
```

### Manual
```bash
pnpm install
pnpm build
pnpm start
```

## Environment Variables

Required in `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
OPENROUTER_API_KEY=
TAVILY_API_KEY=
NEXT_PUBLIC_RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
```

## Adding a New Feature

1. Create `features/my-feature/` with subdirectories
2. Add API routes in `app/api/my-feature/`
3. Add pages in appropriate route group
4. Import and use in components

## Common Tasks

```bash
pnpm dev        # Start dev server
pnpm build      # Build for production
pnpm start      # Start production server
pnpm typecheck  # TypeScript check
pnpm lint       # Run ESLint
```

## Troubleshooting

### Import errors
```bash
pnpm typecheck
```

### Build fails
```bash
Remove-Item -Recurse -Force .next
pnpm build
```
