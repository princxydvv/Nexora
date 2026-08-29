# Nexora AI SaaS

Transform any topic into a structured research report with verified sources, insights, risks, opportunities, and actionable recommendations.

## Features

- **AI-Powered Research**: Generate comprehensive research reports using advanced AI
- **Multiple Report Types**: Market, Tech, Competitive, Career, Policy, and Custom research
- **Verified Sources**: All reports include citations and source verification
- **Subscription Plans**: Free, Pro, and Team plans with different limits
- **Secure Payments**: Razorpay integration for seamless payments
- **Real-time Progress**: Live updates during research generation

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Frontend**: React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **AI Models**: Google Gemini, OpenRouter
- **Search**: Tavily API
- **Payments**: Razorpay
- **Animations**: Framer Motion
- **Error Tracking**: Sentry (configured)
- **Analytics**: Vercel Analytics

## Installation

### Prerequisites

- Node.js 18+ installed
- pnpm or npm package manager
- Supabase account
- Razorpay account (for payments)
- API keys for AI providers (Gemini/OpenRouter)
- Tavily API key (for web search)

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd nexora-ai-saas
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   # or
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` and add your credentials.

4. **Set up database**
   - Go to your Supabase project
   - Run the SQL migrations from `supabase/migrations/` folder

5. **Start development server**
   ```bash
   pnpm dev
   # or
   npm run dev
   ```

6. **Open browser**
   ```
   http://localhost:3000
   ```

## Documentation

All documentation has been moved to the `docs/` folder. See [docs/README.md](./docs/README.md) for the complete documentation index.

## Security Features

- Error Boundaries for graceful error handling
- Rate Limiting on all API routes
- Sentry error tracking (production)
- Authentication and Authorization
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CSRF protection
- Webhook signature verification

## Performance

- Server-Side Rendering
- Static Generation
- Code Splitting
- Image Optimization
- Bundle Optimization
- Rate Limiting
- Database Indexing


---

**Status**: Production Ready  
**Version**: 1.0.0  

