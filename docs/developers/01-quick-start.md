# Quick Start Guide

Get Precision PDF running locally in 5 minutes! This guide will have you processing PDFs with visual verification in no time.

## 🚨 Important Security Notice

**This repository is currently configured for easy local development with ALL AUTHENTICATION AND SECURITY FEATURES DISABLED.**

This means:

- No user authentication required
- No API key validation
- All endpoints are public
- No rate limiting

**Before production deployment**, you MUST follow the [Security Configuration Guide](./04-security-configuration.md) to re-enable all security features.

## Prerequisites

### Required Software

- **Node.js** (Latest LTS version recommended)
- **pnpm** package manager
- **Git** for version control

### Install Prerequisites

```bash
# Install Node.js (if not already installed)
# Download from https://nodejs.org or use a version manager like nvm

# Install pnpm globally
npm install -g pnpm

# Install Convex CLI globally
npm install -g convex
```

### Verify Installation

```bash
# Check versions
node --version    # Should be v18+ or v20+
pnpm --version    # Should be v8+
npx convex --version  # Should be latest
```

## 5-Minute Setup

### Step 1: Clone the Repository

```bash
# Clone the repository
git clone https://github.com/yourusername/precision-pdf.git
cd precision-pdf

# Or if you forked it:
git clone https://github.com/yourusername/precision-pdf.git
cd precision-pdf
```

### Step 2: Install Dependencies

```bash
# Install all dependencies
pnpm install
```

This will install:

- Next.js and React
- Convex client libraries
- UI components (shadcn/ui)
- All development tools

### Step 3: Set Up Environment Variables

```bash
# Copy the example environment file
cp .env.example .env.local

# Edit the environment variables (optional for basic setup)
# The default values will work for local development
```

**Minimal required setup:** Only `NEXT_PUBLIC_CONVEX_URL` is needed, which will be set automatically in the next step.

### Step 4: Initialize Convex Backend

```bash
# Initialize Convex (creates a new deployment)
npx convex dev
```

This will:

1. Create a new Convex deployment
2. Set `NEXT_PUBLIC_CONVEX_URL` in your `.env.local`
3. Deploy the database schema
4. Set up real-time functions
5. Open the Convex dashboard

**Keep this terminal running** - it watches for backend changes.

### Step 5: Start the Development Server

In a **new terminal window:**

```bash
# Start the Next.js development server
pnpm run dev:frontend
```

Or start both frontend and backend together:

```bash
# Start both services in parallel
pnpm run dev
```

## 🎉 You're Ready!

Open your browser and navigate to: **http://localhost:3000**

You should see:

- The Precision PDF homepage
- Example documents you can explore
- Upload functionality (works with example processing)

## What Works Out of the Box

### ✅ Fully Functional

- **Homepage and navigation**
- **Example document exploration** (8 pre-processed documents)
- **Upload interface** (files are stored, but processing requires FastAPI)
- **Export functionality** (requires FastAPI service)
- **Real-time updates** via Convex
- **Responsive UI** with Tailwind CSS

### ⚠️ Limited Functionality (Without FastAPI)

- **PDF Processing** - Files upload but won't be processed without FastAPI service
- **Export Features** - Require FastAPI service for format conversion

### 🚫 Disabled for Local Development

- **Authentication** - No login required (security disabled)
- **Payment processing** - Stripe integration disabled
- **Rate limiting** - No limits enforced
- **User management** - No user restrictions

## Next Steps

### For Basic Exploration

You're all set! Explore the example documents and UI.

### For Full PDF Processing

Set up the FastAPI service by following the [FastAPI Integration Guide](./fastapi-integration.md).

### For Production Deployment

**CRITICAL:** Follow the [Security Configuration Guide](./04-security-configuration.md) to re-enable authentication.

### For Development

Continue with the [Local Development Guide](./03-local-development.md).

## Common Issues

### Port Already in Use

```bash
# If port 3000 is busy, use a different port
pnpm run dev:frontend -- -p 3001
```

### Convex Connection Issues

```bash
# Restart Convex dev server
npx convex dev --reset
```

### Package Installation Issues

```bash
# Clear cache and reinstall
pnpm store prune
rm -rf node_modules
pnpm install
```

### Environment Variables Not Loading

```bash
# Ensure .env.local exists and has correct format
cp .env.example .env.local

# Check Convex URL is set
cat .env.local | grep CONVEX_URL
```

## Development Scripts Reference

```bash
# Development servers
pnpm run dev                  # Both frontend and backend
pnpm run dev:frontend         # Next.js only (port 3000)
pnpm run dev:backend          # Convex only

# Building and production
pnpm run build               # Production build
pnpm run start               # Start production server
pnpm run lint                # Run ESLint

# Testing (infrastructure ready, no tests yet)
pnpm run test                # Unit tests with Vitest
pnpm run pw:test             # E2E tests with Playwright
```

## Project Structure Overview

```
precision-pdf/
├── app/                     # Next.js App Router pages
│   ├── dashboard/           # Main application UI
│   ├── api/                 # API routes
│   └── (marketing)/         # Landing pages
├── components/              # Reusable React components
├── convex/                  # Backend functions and schema
├── docs/                    # Documentation (this file!)
├── public/                  # Static assets and examples
├── utils/                   # Utility functions
└── package.json             # Dependencies and scripts
```

## Getting Help

- **Documentation**: Browse the `/docs` folder
- **Issues**: [GitHub Issues](https://github.com/yourusername/precision-pdf/issues)
- **Convex Help**: [Convex Documentation](https://docs.convex.dev)
- **Next.js Help**: [Next.js Documentation](https://nextjs.org/docs)

## What's Next?

1. **Explore the codebase** - Check out the components and Convex functions
2. **Set up FastAPI** - For full PDF processing capabilities
3. **Read the architecture docs** - Understand the system design
4. **Configure security** - When ready for production
5. **Start contributing** - See the contributing guide

---

**⭐ Star the repository if you find it useful!**

Continue to: [Installation Guide](./02-installation.md) →
