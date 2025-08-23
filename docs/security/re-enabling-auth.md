# Re-enabling Authentication and Security Features

## 🚨 CRITICAL SECURITY WARNING

**This repository is currently configured for easy local development with ALL AUTHENTICATION AND SECURITY FEATURES COMPLETELY DISABLED.**

**Before deploying to production or testing with real user data, you MUST follow this guide to re-enable all security features.**

## Current Security Status

### What's Currently Disabled

1. **Authentication Middleware** - `middleware.ts` bypasses all auth checks
2. **API Route Authentication** - All API endpoints allow anonymous access
3. **User Authorization** - No ownership validation on resources
4. **Rate Limiting** - No request limits enforced
5. **CORS Restrictions** - Allows all origins
6. **Webhook Validation** - Webhook signatures not verified

### Files Modified for Local Development

The following files have been modified to disable security:

- `middleware.ts` - Complete authentication bypass
- `app/api/*/route.ts` - Auth checks commented out
- Various Convex functions - User validation disabled

## Step-by-Step Re-enablement Guide

### Step 1: Re-enable Middleware Authentication

**File:** `middleware.ts`

**Current State:**
```typescript
// Security disabled for local development
export default function middleware() {
  // Allow all routes without any restrictions for local development
  return NextResponse.next();
}
```

**Production State:**
```typescript
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/demo(.*)',
  '/privacy',
  '/terms',
  '/api/sync-user',
  '/api/examples/load',
]);

export default clerkMiddleware((auth, request) => {
  if (!isPublicRoute(request)) {
    auth().protect();
  }
  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
```

### Step 2: Re-enable API Route Authentication

**Files:** All files in `app/api/*/route.ts`

**Find and uncomment authentication checks:**

```typescript
// BEFORE (disabled):
// const { userId } = await auth();
// if (!userId) {
//   return NextResponse.json(
//     { error: "Unauthorized" },
//     { status: 401 }
//   );
// }

// AFTER (enabled):
const { userId } = await auth();
if (!userId) {
  return NextResponse.json(
    { error: "Unauthorized" },
    { status: 401 }
  );
}
```

**Files to update:**
- `app/api/upload-document/route.ts`
- `app/api/upload-document-progressive/route.ts`
- `app/api/process-document/route.ts`
- `app/api/export/*/route.ts` (all export endpoints)
- `app/api/documents/[id]/page-image/[page]/route.ts`

### Step 3: Configure Clerk Authentication

**3.1 Set up Clerk Account and Application**

1. Sign up at [clerk.com](https://clerk.com)
2. Create a new application
3. Configure your domain (localhost for dev, your domain for production)
4. Copy your API keys

**3.2 Update Environment Variables**

```bash
# Add to .env.local (development) or .env.production
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_your-key-here"
CLERK_SECRET_KEY="sk_test_your-secret-here"
CLERK_WEBHOOK_SECRET="whsec_your-webhook-secret"
```

**3.3 Configure Clerk-Convex Integration**

In Clerk Dashboard:
1. Go to JWT Templates
2. Create new template named "convex"
3. Set these claims:

```json
{
  "aud": "convex",
  "iat": "{{current_time}}",
  "iss": "https://your-clerk-domain.clerk.accounts.dev",
  "sub": "{{user.id}}"
}
```

4. Copy the Issuer URL

**3.4 Configure Convex Environment**

In Convex Dashboard → Settings → Environment Variables:
```
CLERK_JWT_ISSUER_DOMAIN=https://your-clerk-domain.clerk.accounts.dev
```

### Step 4: Re-enable Convex Function Authentication

**File:** `convex/auth.config.ts`

**Uncomment the Clerk configuration:**
```typescript
export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
      applicationID: "convex",
    },
  ]
};
```

### Step 5: Re-enable User Validation in Convex Functions

**Files:** All Convex functions in `convex/` directory

**Find and uncomment user validation:**

```typescript
// BEFORE (disabled):
// const user = await getCurrentUser(ctx);
// if (!user) {
//   throw new ConvexError("User not authenticated");
// }

// AFTER (enabled):
const user = await getCurrentUser(ctx);
if (!user) {
  throw new ConvexError("User not authenticated");
}
```

**Critical functions to update:**
- `convex/documents.ts` - All document operations
- `convex/users.ts` - User management functions
- `convex/subscriptions.ts` - Billing operations

### Step 6: Set up Clerk User Sync Webhook

**6.1 Configure Webhook in Clerk**

1. In Clerk Dashboard → Webhooks
2. Add endpoint: `https://your-domain.com/api/sync-user`
3. Select events: `user.created`, `user.updated`, `user.deleted`
4. Copy the webhook secret

**6.2 Verify Webhook Handler**

**File:** `app/api/sync-user/route.ts`

Ensure webhook validation is enabled:
```typescript
const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);
const evt = wh.verify(body, {
  "svix-id": svix_id,
  "svix-timestamp": svix_timestamp,
  "svix-signature": svix_signature,
}) as WebhookEvent;
```

### Step 7: Enable Rate Limiting

**File:** `middleware.ts` (add to the re-enabled middleware)

```typescript
import { rateLimit } from '@/lib/rate-limit';

// Add rate limiting for uploads
if (request.nextUrl.pathname.startsWith('/api/upload')) {
  const ip = request.ip ?? '127.0.0.1';
  const identifier = userId || ip;
  
  const { success } = await rateLimit.check(identifier, 10); // 10 per hour
  if (!success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429 }
    );
  }
}
```

### Step 8: Configure CORS for Production

**File:** `next.config.ts`

Update CORS headers:
```typescript
{
  key: 'Access-Control-Allow-Origin',
  value: process.env.NODE_ENV === 'development' 
    ? '*' 
    : process.env.NEXT_PUBLIC_APP_URL || 'https://your-domain.com'
}
```

### Step 9: Enable Stripe Webhook Validation

**File:** `convex/stripe.ts`

Uncomment webhook signature validation:
```typescript
const sig = request.headers.get('stripe-signature')!;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

try {
  const event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  // Process event...
} catch (err) {
  throw new ConvexError(`Webhook signature verification failed: ${err.message}`);
}
```

## Verification Checklist

After re-enabling security, verify everything works:

### Authentication Tests

- [ ] Unauthenticated users cannot access `/dashboard`
- [ ] Users are redirected to sign-in when accessing protected routes
- [ ] API endpoints return 401 for unauthenticated requests
- [ ] Users can successfully sign up and sign in
- [ ] User data is synced to Convex via webhook

### API Security Tests

- [ ] Document uploads require authentication
- [ ] Users can only access their own documents
- [ ] Export endpoints require authentication
- [ ] Rate limiting prevents abuse

### Webhook Tests

- [ ] Clerk webhooks successfully sync user data
- [ ] Stripe webhooks process payments correctly
- [ ] Webhook signature validation works

## Common Issues and Solutions

### "User not authenticated" Errors

**Symptoms:** API calls failing with 401 errors

**Solutions:**
1. Check environment variables are set correctly
2. Verify JWT template configuration in Clerk
3. Ensure Convex environment has correct `CLERK_JWT_ISSUER_DOMAIN`
4. Check browser network tab for authentication headers

### Webhook Failures

**Symptoms:** Webhooks returning 400/401 errors

**Solutions:**
1. Verify webhook secrets are correct
2. Check webhook URL configuration
3. Ensure webhook handler is not cached
4. Test webhook signature validation

### CORS Issues

**Symptoms:** Browser CORS errors in production

**Solutions:**
1. Update CORS configuration in `next.config.ts`
2. Ensure `NEXT_PUBLIC_APP_URL` is set correctly
3. Check domain configuration in Clerk

### Redirect Loops

**Symptoms:** Users stuck in authentication redirects

**Solutions:**
1. Check public route configuration in middleware
2. Verify Clerk domain configuration
3. Ensure redirect URLs are whitelisted

## Testing Security Configuration

### Automated Tests

Create tests to verify security is working:

```typescript
// Example test for API authentication
test('requires authentication for document upload', async () => {
  const response = await fetch('/api/upload-document', {
    method: 'POST',
    body: new FormData(),
  });
  
  expect(response.status).toBe(401);
});
```

### Manual Testing

1. **Open browser in incognito mode**
2. **Try to access `/dashboard`** - should redirect to sign-in
3. **Try API calls without auth** - should return 401
4. **Sign up new user** - should create user in Convex
5. **Upload document** - should require authentication

## Production Security Hardening

Additional security measures for production:

### 1. Environment Variable Security

```bash
# Use strong, unique secrets
JWT_SECRET=$(openssl rand -base64 64)
SESSION_SECRET=$(openssl rand -base64 32)
ENCRYPTION_KEY=$(openssl rand -base64 32)
```

### 2. Content Security Policy

Add to `next.config.ts`:
```typescript
const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline' *.clerk.com;
  style-src 'self' 'unsafe-inline' *.clerk.com;
  img-src 'self' blob: data: *.clerk.com *.convex.cloud;
  connect-src 'self' *.clerk.com *.convex.cloud;
`;
```

### 3. Security Headers

```typescript
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
];
```

## Emergency Security Disable

If you need to temporarily disable security (NOT recommended for production):

1. **Comment out middleware authentication**
2. **Comment out API route auth checks**
3. **Set environment variable:** `DISABLE_AUTH=true`
4. **Restart all services**

**Remember to re-enable security as soon as possible!**

---

## Next Steps

After re-enabling security:

1. **Test thoroughly** with the verification checklist
2. **Set up monitoring** to detect auth failures
3. **Configure alerts** for security events
4. **Review the [Security Overview](./security-overview.md)**
5. **Follow the [Production Deployment Guide](../developers/deployment-guide.md)**

**🔒 Your application is now properly secured!**