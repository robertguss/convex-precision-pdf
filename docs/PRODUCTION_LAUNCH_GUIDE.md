# Precision PDF Production Launch Guide

This comprehensive guide walks through every step needed to launch Precision PDF
to production. Follow each section carefully and check off items as you complete
them.

## Table of Contents

1. [Pre-Launch Checklist](#pre-launch-checklist)
2. [Environment Variables](#environment-variables)
3. [Service Configuration](#service-configuration)
4. [Code Updates](#code-updates)
5. [Deployment](#deployment)
6. [Post-Launch](#post-launch)
7. [Troubleshooting](#troubleshooting)

## Pre-Launch Checklist

### Accounts Needed

- [ ] Production Clerk account
- [ ] Production Convex deployment
- [ ] Production Stripe account
- [ ] Vercel account (connected to GitHub)
- [ ] Render account (for Fast API)
- [ ] Resend account
- [ ] Sentry account
- [ ] PostHog account
- [ ] Crisp account
- [ ] Domain configured (precisionpdf.com)

### Security Preparation

- [ ] Generate all new production API keys
- [ ] Create strong webhook secrets (use `openssl rand -base64 32`)
- [ ] Remove all test credentials from codebase
- [ ] Review and update CORS policies

### CORS Configuration

The application uses a secure CORS policy that:

- Allows all origins in development for easier testing
- Restricts to your specific domain in production
- Properly handles preflight requests
- Sets appropriate security headers

**Important**: Ensure `NEXT_PUBLIC_APP_URL` is set to your production domain (e.g., `https://precisionpdf.com`) in your production environment variables.

The CORS configuration is implemented in `next.config.ts` and applies to all `/api/*` routes. Convex handles its own CORS internally and doesn't require additional configuration.

## Environment Variables

### Production Environment Variables Checklist

Create a `.env.production` file with these variables:

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
CLERK_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_CLERK_FRONTEND_API_URL=https://your-prod-clerk-frontend-api.clerk.accounts.dev

# Convex Database
NEXT_PUBLIC_CONVEX_URL=https://your-production-deployment.convex.cloud
# Note: CONVEX_DEPLOYMENT is set automatically by Convex CLI

# Stripe Payments
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Fast API Service
FAST_API_URL=https://your-fast-api-service.onrender.com
FAST_API_SECRET_KEY=<generate-strong-secret>
LANDING_AI_API_KEY=<your-landing-ai-key>

# Application URLs
NEXT_PUBLIC_APP_URL=https://www.precisionpdf.com
SITE_URL=https://www.precisionpdf.com

# Email Service (Resend)
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=hello@precisionpdf.com

# Error Monitoring (Sentry)
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
SENTRY_AUTH_TOKEN=...
SENTRY_ORG=your-org
SENTRY_PROJECT=precision-pdf

# Analytics (PostHog)
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# Customer Support (Crisp)
NEXT_PUBLIC_CRISP_WEBSITE_ID=...
```

## Service Configuration

### 1. Clerk (Authentication) Setup

#### A. Create Production Instance

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Create new application: "Precision PDF Production"
3. Configure production domain:
   - Primary domain: `precisionpdf.com`
   - Add `www.precisionpdf.com` as well

#### B. Configure Authentication Methods

1. Enable Email/Password authentication
2. Configure OAuth providers if needed (Google, GitHub, etc.)
3. Set up passwordless options if desired

#### C. Create JWT Template for Convex

1. Navigate to "JWT Templates" in Clerk dashboard
2. Create new template named "convex"
3. Set the following claims:

```json
{
  "aud": "convex",
  "iat": "{{current_time}}",
  "iss": "https://clerk.precisionpdf.com",
  "sub": "{{user.id}}"
}
```

4. Copy the Issuer URL for Convex configuration

#### D. Configure Webhooks

1. Add webhook endpoint: `https://www.precisionpdf.com/api/sync-user`
2. Select events:
   - user.created
   - user.updated
   - user.deleted
3. Copy the webhook secret

#### E. Update Redirect URLs

1. Set allowed redirect URLs:
   - `https://www.precisionpdf.com/*`
   - `https://precisionpdf.com/*`
2. Set default redirect URLs for after sign-in/up: `/dashboard`

### 2. Convex (Database) Setup

#### A. Create Production Deployment

```bash
# In your project directory
npx convex deploy --prod
```

#### B. Set Environment Variables

1. Go to Convex Dashboard > Settings > Environment Variables
2. Add:
   - `CLERK_JWT_ISSUER_DOMAIN`: (from Clerk JWT template)
   - `STRIPE_SECRET_KEY`: (production Stripe key)
   - `SITE_URL`: https://www.precisionpdf.com

#### C. Initialize Production Data

```bash
# Run migrations and seed plans
npx convex run --prod plans:seedPlans
```

### 3. Stripe (Payments) Setup

#### A. Configure Products and Prices

1. Create products in Stripe Dashboard:

   - **Free Plan**: $0/month (if you want to track free users)
   - **Starter Plan**: $9.99/month - 75 pages
   - **Pro Plan**: $24.99/month - 250 pages

2. Copy the price IDs and update in `convex/plans.ts`

#### B. Configure Webhooks

1. Add webhook endpoint:
   `https://www.precisionpdf.com/.convex/http/stripe/webhook`
2. Select events:
   - checkout.session.completed
   - customer.subscription.created
   - customer.subscription.updated
   - customer.subscription.deleted
   - invoice.payment_succeeded
   - invoice.payment_failed
3. Copy the webhook secret

#### C. Configure Customer Portal

1. Go to Stripe Dashboard > Settings > Billing > Customer portal
2. Enable customer portal
3. Configure allowed actions:
   - Cancel subscriptions
   - Update payment methods
   - View invoices
4. Set portal link to: `https://www.precisionpdf.com/dashboard/account`

#### D. Set Up Tax Settings

1. Go to Settings > Tax
2. Enable tax calculation if needed
3. Configure tax rates for your jurisdictions

### 4. Fast API (Render) Setup

#### A. Deploy to Render

1. Create new Web Service on Render
2. Connect your Fast API repository
3. Configure build settings:
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

#### B. Set Environment Variables

```bash
LANDING_AI_API_KEY=<your-key>
API_KEY=<same-as-FAST_API_SECRET_KEY>
ENVIRONMENT=production
```

#### C. Configure Health Checks

1. Set health check path to `/health`
2. Configure auto-deploy from main branch

### 5. Resend (Email) Setup

#### A. Create Account and Verify Domain

1. Sign up at [Resend](https://resend.com)
2. Add and verify domain: `precisionpdf.com`
3. Configure DNS records as instructed

#### B. Create API Key

1. Generate production API key
2. Name it "Precision PDF Production"

### 6. Sentry (Error Monitoring) Setup

#### A. Create Project

1. Create new project: "precision-pdf"
2. Select Next.js platform
3. Copy DSN

#### B. Install and Configure

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

### 7. PostHog (Analytics) Setup

#### A. Create Project

1. Sign up at [PostHog](https://posthog.com)
2. Create project: "Precision PDF"
3. Copy project API key

### 8. Crisp (Customer Support) Setup

#### A. Create Account

1. Sign up at [Crisp](https://crisp.chat)
2. Create website: "Precision PDF"
3. Copy website ID

#### B. Configure Widget

1. Customize appearance to match brand
2. Set up office hours
3. Configure auto-reply messages

## Code Updates

### 1. Create Production Configuration Files

#### A. Create `lib/config.ts`

```typescript
export const config = {
  app: {
    name: "Precision PDF",
    url: process.env.NEXT_PUBLIC_APP_URL || "https://www.precisionpdf.com",
    domain: "precisionpdf.com",
  },
  email: {
    from: "Precision PDF <hello@precisionpdf.com>",
    support: "support@precisionpdf.com",
  },
  stripe: {
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY!,
    plans: {
      free: { priceId: null, pages: 10 },
      starter: { priceId: "price_...", pages: 75 },
      pro: { priceId: "price_...", pages: 250 },
    },
  },
};
```

#### B. Create Email Service (`lib/email.ts`)

```typescript
import { Resend } from "resend";
import { config } from "./config";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendWelcomeEmail(email: string, name: string) {
  await resend.emails.send({
    from: config.email.from,
    to: email,
    subject: "Welcome to Precision PDF!",
    html: `
      <h1>Welcome ${name}!</h1>
      <p>Thanks for signing up for Precision PDF.</p>
      <p>You can start extracting data from your PDFs right away with your free plan.</p>
      <a href="${config.app.url}/dashboard">Go to Dashboard</a>
    `,
  });
}

export async function sendPaymentConfirmation(email: string, planName: string) {
  await resend.emails.send({
    from: config.email.from,
    to: email,
    subject: "Payment Confirmation - Precision PDF",
    html: `
      <h1>Payment Confirmed!</h1>
      <p>Your subscription to the ${planName} plan is now active.</p>
      <a href="${config.app.url}/dashboard">Start Processing PDFs</a>
    `,
  });
}

export async function sendUsageLimitWarning(
  email: string,
  used: number,
  limit: number,
) {
  const percentage = Math.round((used / limit) * 100);
  await resend.emails.send({
    from: config.email.from,
    to: email,
    subject: "Usage Limit Warning - Precision PDF",
    html: `
      <h1>You've used ${percentage}% of your monthly pages</h1>
      <p>You've processed ${used} out of ${limit} pages this month.</p>
      <p>Consider upgrading your plan for more pages.</p>
      <a href="${config.app.url}/dashboard/upgrade">View Plans</a>
    `,
  });
}
```

#### C. Add Analytics Tracking (`lib/analytics.ts`)

```typescript
import posthog from "posthog-js";

export function initAnalytics() {
  if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      api_host:
        process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com",
      loaded: (posthog) => {
        if (process.env.NODE_ENV === "development") posthog.opt_out_capturing();
      },
    });
  }
}

export function trackEvent(event: string, properties?: Record<string, any>) {
  if (typeof window !== "undefined") {
    posthog.capture(event, properties);
  }
}

export function identifyUser(userId: string, properties?: Record<string, any>) {
  if (typeof window !== "undefined") {
    posthog.identify(userId, properties);
  }
}
```

#### D. Add Rate Limiting (`middleware.ts` updates)

```typescript
import { rateLimit } from "@/lib/rate-limit";

// Add to existing middleware
const uploadLimiter = rateLimit({
  interval: 60 * 60 * 1000, // 1 hour
  uniqueTokenPerInterval: 500,
});

// In middleware function
if (req.nextUrl.pathname.startsWith("/api/upload")) {
  const identifier = userId || ip;
  const { success, limit, remaining } = await uploadLimiter.check(
    identifier,
    isFreePlan ? 10 : 50,
  );

  if (!success) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": limit.toString(),
          "X-RateLimit-Remaining": remaining.toString(),
        },
      },
    );
  }
}
```

#### E. Add Crisp Widget (`app/layout.tsx`)

```typescript
// Add before closing </body> tag
{
  process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID && (
    <script
      type="text/javascript"
      dangerouslySetInnerHTML={{
        __html: `
        window.$crisp=[];window.CRISP_WEBSITE_ID="${process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID}";
        (function(){d=document;s=d.createElement("script");s.src="https://client.crisp.chat/l.js";
        s.async=1;d.getElementsByTagName("head")[0].appendChild(s);})();
      `,
      }}
    />
  );
}
```

### 2. Create Legal Pages

#### A. Terms of Service (`app/(marketing)/terms/page.tsx`)

```typescript
export default function TermsOfService() {
  return (
    <div className="prose max-w-4xl mx-auto py-16 px-4">
      <h1>Terms of Service</h1>
      <p>Last updated: {new Date().toLocaleDateString()}</p>

      <h2>1. Acceptance of Terms</h2>
      <p>
        By accessing and using Precision PDF, you agree to be bound by these
        Terms of Service...
      </p>

      <h2>2. Description of Service</h2>
      <p>Precision PDF provides AI-powered PDF data extraction services...</p>

      <h2>3. User Accounts</h2>
      <p>You are responsible for maintaining the security of your account...</p>

      <h2>4. Payment Terms</h2>
      <p>Paid subscriptions are billed monthly via Stripe...</p>

      <h2>5. Usage Limits</h2>
      <p>Each plan includes a specific number of pages per month...</p>

      <h2>6. Data Privacy</h2>
      <p>
        We process your documents securely and delete them after processing...
      </p>

      <h2>7. Prohibited Uses</h2>
      <p>You may not use the service for illegal purposes...</p>

      <h2>8. Limitation of Liability</h2>
      <p>We are not liable for any indirect damages...</p>

      <h2>9. Contact Information</h2>
      <p>
        For questions about these terms, contact us at legal@precisionpdf.com
      </p>
    </div>
  );
}
```

#### B. Privacy Policy (`app/(marketing)/privacy/page.tsx`)

```typescript
export default function PrivacyPolicy() {
  return (
    <div className="prose max-w-4xl mx-auto py-16 px-4">
      <h1>Privacy Policy</h1>
      <p>Last updated: {new Date().toLocaleDateString()}</p>

      <h2>1. Information We Collect</h2>
      <p>We collect information you provide directly to us, such as:</p>
      <ul>
        <li>Account information (name, email)</li>
        <li>Payment information (processed by Stripe)</li>
        <li>Documents you upload for processing</li>
      </ul>

      <h2>2. How We Use Your Information</h2>
      <p>We use the information to:</p>
      <ul>
        <li>Provide and improve our services</li>
        <li>Process your documents</li>
        <li>Send transactional emails</li>
        <li>Handle customer support</li>
      </ul>

      <h2>3. Data Security</h2>
      <p>We implement appropriate security measures to protect your data...</p>

      <h2>4. Data Retention</h2>
      <p>Uploaded documents are deleted within 24 hours of processing...</p>

      <h2>5. Third-Party Services</h2>
      <p>We use the following third-party services:</p>
      <ul>
        <li>Clerk (Authentication)</li>
        <li>Stripe (Payments)</li>
        <li>Convex (Database)</li>
        <li>Landing AI (Document Processing)</li>
      </ul>

      <h2>6. Your Rights</h2>
      <p>
        You have the right to access, update, or delete your personal
        information...
      </p>

      <h2>7. Contact Us</h2>
      <p>For privacy concerns, contact us at privacy@precisionpdf.com</p>
    </div>
  );
}
```

### 3. Add Security Headers (`next.config.ts`)

```typescript
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  },
  {
    key: 'Content-Security-Policy',
    value: ContentSecurityPolicy.replace(/\s{2,}/g, ' ').trim()
  }
];

const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline' *.clerk.com *.crisp.chat *.posthog.com;
  style-src 'self' 'unsafe-inline' *.clerk.com;
  img-src 'self' blob: data: *.clerk.com *.convex.cloud;
  font-src 'self';
  connect-src 'self' *.clerk.com *.convex.cloud *.posthog.com *.crisp.chat wss://*.crisp.chat;
  frame-src 'self' *.clerk.com *.stripe.com;
`;

// Add to nextConfig
async headers() {
  return [
    {
      source: '/:path*',
      headers: securityHeaders,
    },
    {
      // CORS configuration for API routes
      source: '/api/:path*',
      headers: [
        {
          key: 'Access-Control-Allow-Credentials',
          value: 'true'
        },
        {
          key: 'Access-Control-Allow-Origin',
          value: process.env.NODE_ENV === 'development' ? '*' : process.env.NEXT_PUBLIC_APP_URL || ''
        },
        {
          key: 'Access-Control-Allow-Methods',
          value: 'GET,DELETE,PATCH,POST,PUT'
        },
        {
          key: 'Access-Control-Allow-Headers',
          value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
        },
        {
          key: 'Access-Control-Max-Age',
          value: '86400'
        }
      ]
    }
  ];
}
```

## Deployment

### 1. Vercel Deployment

#### A. Connect Repository

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Select the main/production branch

#### B. Configure Build Settings

- Framework Preset: Next.js
- Build Command: `npm run build` (or `pnpm build`)
- Output Directory: `.next`
- Install Command: `npm install` (or `pnpm install`)

#### C. Add Environment Variables

1. Go to Project Settings > Environment Variables
2. Add all production environment variables from `.env.production`
3. Ensure variables are scoped to "Production" environment

#### D. Configure Domain

1. Go to Project Settings > Domains
2. Add `precisionpdf.com` and `www.precisionpdf.com`
3. Configure DNS:
   ```
   A Record: @ -> 76.76.21.21
   CNAME: www -> cname.vercel-dns.com
   ```

### 2. Convex Production Deployment

```bash
# Deploy Convex to production
npx convex deploy --prod

# Run any data migrations
npx convex run --prod plans:seedPlans
```

### 3. Fast API Deployment

1. Push changes to your Fast API repository
2. Render will auto-deploy if configured
3. Verify health endpoint: `https://your-api.onrender.com/health`

## Post-Launch

### 1. Verification Checklist

- [ ] Homepage loads correctly
- [ ] User can sign up and receive welcome email
- [ ] User can upload and process a document
- [ ] Free plan limits are enforced (10 pages)
- [ ] User can upgrade to paid plan
- [ ] Stripe checkout works correctly
- [ ] Subscription appears in user account
- [ ] Customer portal link works
- [ ] Rate limiting is active
- [ ] Error tracking is working (trigger test error)
- [ ] Analytics events are being recorded
- [ ] Crisp chat widget appears
- [ ] All environment variables are set correctly

### 2. Monitoring Setup

#### A. Create Status Page

Use a service like BetterUptime or create a simple status page:

- Monitor main website
- Monitor API endpoints
- Monitor Fast API service
- Monitor Convex availability

#### B. Set Up Alerts

1. **Sentry Alerts**:

   - Error rate spike
   - New error types
   - Performance degradation

2. **Vercel Alerts**:

   - Build failures
   - Function errors
   - Performance issues

3. **Stripe Alerts**:
   - Failed payments
   - Dispute notifications
   - Unusual activity

### 3. DNS Configuration for Email

Add these records for Resend:

```
MX: @ -> mx1.improvmx.com (10)
MX: @ -> mx2.improvmx.com (20)
TXT: _dmarc -> v=DMARC1; p=none; rua=mailto:dmarc@precisionpdf.com
TXT: @ -> v=spf1 include:_spf.improvmx.com include:amazonses.com ~all
```

## Troubleshooting

### Common Issues

#### 1. Clerk Authentication Issues

- **Issue**: Users can't sign in
- **Fix**: Verify CLERK_JWT_ISSUER_DOMAIN matches in both Clerk and Convex
- **Fix**: Check redirect URLs are properly configured

#### 2. Stripe Webhook Failures

- **Issue**: Webhooks returning 400/401
- **Fix**: Verify webhook secret is correctly set
- **Fix**: Check endpoint URL is correct (includes /.convex/http)

#### 3. Document Processing Failures

- **Issue**: PDF processing times out
- **Fix**: Check Fast API service is running
- **Fix**: Verify API keys are correct
- **Fix**: Check CORS settings

#### 4. Email Delivery Issues

- **Issue**: Emails not being received
- **Fix**: Verify DNS records for domain
- **Fix**: Check Resend API key is valid
- **Fix**: Look for bounces in Resend dashboard

#### 5. Rate Limiting Issues

- **Issue**: Users hitting limits too early
- **Fix**: Verify timezone handling in rate limit logic
- **Fix**: Check Redis/memory store is persisting

### Debug Commands

```bash
# Check Vercel deployment
vercel logs

# Check Convex functions
npx convex logs --prod

# Test Stripe webhook locally
stripe listen --forward-to localhost:3000/.convex/http/stripe/webhook

# Test email sending
curl -X POST https://api.resend.com/emails \
  -H "Authorization: Bearer $RESEND_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"from":"hello@precisionpdf.com","to":"test@example.com","subject":"Test","text":"Test email"}'
```

## Launch Day Checklist

### Morning of Launch

- [ ] Final testing of all critical paths
- [ ] Verify all monitoring is active
- [ ] Team is ready for support
- [ ] Social media posts scheduled
- [ ] Email announcement ready

### Launch Steps

1. [ ] Deploy to production
2. [ ] Verify deployment successful
3. [ ] Send launch announcement
4. [ ] Monitor error rates
5. [ ] Be ready to rollback if needed

### Post-Launch Monitoring (First 24 Hours)

- [ ] Check error rates every hour
- [ ] Monitor sign-up flow
- [ ] Watch payment processing
- [ ] Respond to customer inquiries
- [ ] Track performance metrics

## Support Contacts

- **Vercel Support**: support@vercel.com
- **Convex Support**: support@convex.dev
- **Clerk Support**: support@clerk.dev
- **Stripe Support**: Via dashboard
- **Render Support**: Via dashboard

## Final Notes

1. **Backup Strategy**: Convex automatically handles backups, but consider
   exporting critical data regularly
2. **Scaling**: Monitor usage and be ready to upgrade plans as needed
3. **Security**: Regularly review and rotate API keys
4. **Updates**: Plan for regular maintenance windows

Remember: Launch is just the beginning. Plan for ongoing monitoring, updates,
and improvements based on user feedback.

Good luck with your launch! 🚀
