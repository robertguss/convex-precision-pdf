# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Installing Dependencies

- You must always use `pnpm` to install dependencies.
- You must install all dependencies with their @latest version.

### Running the Application

```bash
pnpm run dev        # Runs both Next.js frontend and Convex backend in parallel
pnpm run dev:frontend  # Next.js development server only (port 3000)
pnpm run dev:backend   # Convex development server only
```

### Building and Production

```bash
pnpm run build      # Production build
pnpm run start      # Start production server
pnpm run lint       # Run ESLint
```

### Convex-Specific Commands

```bash
npx convex dev     # Start Convex development server
npx convex deploy  # Deploy to production
npx convex dashboard # Open Convex dashboard in browser
```

## Architecture Overview

This is a Next.js 15 application with Convex backend and Clerk authentication.

### Frontend Structure

- **App Router**: Uses Next.js App Router (not Pages Router)
- **Authentication**: Clerk handles all auth flows via modals, no custom auth pages
- **Providers**: App wrapped in ClerkProvider → ConvexProviderWithClerk → ConvexClientProvider
- **Server Components**: Default, with explicit 'use client' for client components

### Backend Structure

- **Convex Functions**: Located in `/convex/` directory
  - `schema.ts`: Database schema definitions
  - `myFunctions.ts`: Server functions (queries, mutations, actions)
  - `auth.config.ts`: Clerk authentication configuration
- **Real-time**: All Convex queries are reactive by default
- **Type Safety**: Generated types in `convex/_generated/`

### Key Implementation Patterns

1. **Authenticated API Calls**:

   ```typescript
   const user = await ctx.auth.getUserIdentity();
   if (!user) throw new ConvexError("User not authenticated");
   ```

2. **Server Component Data Loading**:

   ```typescript
   const preloadedData = await preloadQuery(api.myFunctions.listNumbers);
   ```

3. **Client Hooks**:

   ```typescript
   const data = useQuery(api.myFunctions.listNumbers);
   const mutate = useMutation(api.myFunctions.addNumber);
   ```

### Environment Variables

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Clerk public key
- `CLERK_SECRET_KEY`: Clerk secret key
- `NEXT_PUBLIC_CONVEX_URL`: Convex deployment URL (auto-set by Convex CLI)

### Testing Approach

Currently no test framework is configured. When adding tests:

- Use Jest + React Testing Library for frontend
- Use Convex's testing utilities for backend functions
- Test files should follow `*.test.ts(x)` or `*.spec.ts(x)` naming

### Fast API PDF Processing Service

For PDF processing, use the Fast API service. The OpenAPI spec is in `docs/fast-api/openapi.json`.

### Notes

Do not create comments in files like this:

```ts
// ABOUTME: This file handles document uploads, processing, and management
```

Instead you should create thorough and robust documentation in the file using JSDoc and follow best practices for documentation.
