# Known Issues

## Ad Blocker Conflicts

Some browser extensions (particularly ad blockers) may block certain analytics and monitoring services:

### Affected Services

1. **Sentry Error Monitoring**
   - Domain: `o4509412388175872.ingest.us.sentry.io`
   - Impact: Error tracking and monitoring will not work
   - User Impact: None - application functionality remains unaffected

2. **datafa.st Analytics**
   - Domain: `datafa.st`
   - Impact: Analytics data will not be collected
   - User Impact: None - application functionality remains unaffected

### Resolution

These are client-side blocks by browser extensions and cannot be fixed through server configuration. The application is designed to work correctly even when these services are blocked.

For users who want full functionality:
- Whitelist the domain `precisionpdf.com` in your ad blocker
- Or temporarily disable ad blockers when using the application

## Crisp Chat Warning

Crisp Chat may show a warning about JavaScript method shims. This is expected behavior when using certain React/Next.js features and does not affect functionality.

To suppress this warning in production, you can add:
```javascript
$crisp.push(["safe", true])
```

However, this is not recommended unless the warning is causing issues.