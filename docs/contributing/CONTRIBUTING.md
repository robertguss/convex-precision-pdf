# Contributing to Precision PDF

Thank you for your interest in contributing to Precision PDF! This guide will help you get started with contributing to our open-source document processing platform.

## 🚀 Quick Start for Contributors

### Prerequisites

- Node.js (Latest LTS)
- pnpm package manager
- Git
- GitHub account

### 1. Fork and Clone

```bash
# Fork the repository on GitHub, then clone your fork
git clone https://github.com/yourusername/precision-pdf.git
cd precision-pdf

# Add upstream remote
git remote add upstream https://github.com/robertguss/precision-pdf.git
```

### 2. Set Up Development Environment

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local

# Initialize Convex
npx convex dev

# Start development server (in another terminal)
pnpm run dev
```

### 3. Create a Feature Branch

```bash
# Create and switch to a new branch
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b fix/bug-description
```

## 🧭 Project Overview

### Architecture
- **Frontend**: Next.js 15 with React 19
- **Backend**: Convex (real-time database + serverless functions)  
- **Authentication**: Clerk (currently disabled for development)
- **Processing**: External FastAPI service with Landing AI
- **UI**: Tailwind CSS with shadcn/ui components

### Key Directories
```
precision-pdf/
├── app/                    # Next.js App Router pages & API routes
├── components/             # Reusable React components  
├── convex/                # Backend functions and database schema
├── docs/                  # Documentation (what you're reading!)
├── public/                # Static assets and example documents
├── utils/                 # Utility functions
└── hooks/                 # Custom React hooks
```

## 🎯 Ways to Contribute

### 1. Bug Fixes
- Check [GitHub Issues](https://github.com/robertguss/precision-pdf/issues) for bug reports
- Look for issues labeled `bug` or `good first issue`
- Reproduce the bug locally before fixing

### 2. Feature Development
- Check [GitHub Issues](https://github.com/robertguss/precision-pdf/issues) for feature requests
- Look for issues labeled `enhancement` or `feature request`
- Discuss large features in issues before implementing

### 3. Documentation
- Improve existing documentation
- Add missing documentation
- Fix typos and clarify instructions
- Translate documentation to other languages

### 4. Testing
- Add unit tests (Vitest)
- Add E2E tests (Playwright)
- Improve test coverage
- Test on different browsers/devices

### 5. UI/UX Improvements
- Improve existing components
- Add new shadcn/ui components
- Enhance accessibility
- Mobile responsiveness improvements

## 📝 Development Guidelines

### Code Style

We use ESLint and Prettier for code formatting:

```bash
# Check linting
pnpm run lint

# Fix linting issues
pnpm run lint --fix

# Format code (optional - should happen automatically)
pnpm run format
```

### Coding Standards

#### TypeScript
- Use TypeScript for all new code
- Prefer interfaces over types for object shapes
- Use proper typing, avoid `any`
- Add JSDoc comments for complex functions

#### React Components
- Use functional components with hooks
- Prefer composition over inheritance
- Follow the existing component structure
- Use `use client` directive only when necessary

#### File Naming
- Use kebab-case for file names: `document-viewer.tsx`
- Use PascalCase for component names: `DocumentViewer`
- Use camelCase for functions and variables

#### Example Component
```typescript
/**
 * DocumentViewer displays PDF documents with extracted data
 */
interface DocumentViewerProps {
  documentId: string;
  showMetadata?: boolean;
}

export function DocumentViewer({ 
  documentId, 
  showMetadata = true 
}: DocumentViewerProps) {
  const document = useQuery(api.documents.getDocument, { documentId });
  
  if (!document) {
    return <div>Loading...</div>;
  }
  
  return (
    <div className="document-viewer">
      {/* Component implementation */}
    </div>
  );
}
```

### Convex Functions

#### Queries (Read Operations)
```typescript
// convex/documents.ts
export const getDocument = query({
  args: { documentId: v.id("documents") },
  handler: async (ctx, { documentId }) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new ConvexError("User not authenticated");
    }
    
    const document = await ctx.db.get(documentId);
    if (!document || document.userId !== user._id) {
      return null;
    }
    
    return document;
  },
});
```

#### Mutations (Write Operations)  
```typescript
export const updateDocument = mutation({
  args: { 
    documentId: v.id("documents"),
    updates: v.object({
      title: v.optional(v.string()),
      status: v.optional(v.string()),
    })
  },
  handler: async (ctx, { documentId, updates }) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new ConvexError("User not authenticated");
    }
    
    await ctx.db.patch(documentId, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});
```

### API Routes

Follow the existing pattern for API routes:

```typescript
// app/api/example/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function GET(request: NextRequest) {
  try {
    // Authentication (currently disabled for development)
    // const { userId } = await auth();
    // if (!userId) {
    //   return NextResponse.json(
    //     { error: "Unauthorized" },
    //     { status: 401 }
    //   );
    // }
    
    // Implementation here
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

## 🧪 Testing

### Running Tests

```bash
# Unit tests with Vitest
pnpm run test            # Run once
pnpm run test:watch      # Watch mode  
pnpm run test:ui         # UI interface

# E2E tests with Playwright
pnpm run pw:test         # Headless
pnpm run pw:test:ui      # UI mode
pnpm run pw:test:debug   # Debug mode
```

### Writing Tests

#### Unit Test Example
```typescript
// utils/documentUtils.test.ts
import { describe, it, expect } from 'vitest';
import { extractDocumentTitle } from './documentUtils';

describe('documentUtils', () => {
  it('should extract title from document data', () => {
    const mockDocument = {
      markdown: '# Invoice INV-001\n\nCompany: Acme Corp',
      chunks: []
    };
    
    const title = extractDocumentTitle(mockDocument);
    expect(title).toBe('Invoice INV-001');
  });
});
```

#### E2E Test Example
```typescript
// tests/upload.spec.ts
import { test, expect } from '@playwright/test';

test('should upload and process document', async ({ page }) => {
  await page.goto('/dashboard');
  
  // Upload file
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles('test-files/sample.pdf');
  
  // Wait for processing
  await expect(page.locator('[data-testid="processing-status"]'))
    .toContainText('completed', { timeout: 30000 });
    
  // Verify results
  await expect(page.locator('[data-testid="extracted-content"]'))
    .toBeVisible();
});
```

## 📋 Pull Request Process

### Before Submitting

1. **Sync with upstream**
   ```bash
   git fetch upstream
   git checkout main
   git merge upstream/main
   ```

2. **Run tests and linting**
   ```bash
   pnpm run lint
   pnpm run test
   pnpm run build
   ```

3. **Update documentation** if needed

### PR Requirements

- ✅ **Clear title and description**
- ✅ **Reference related issues** (`Fixes #123`)
- ✅ **Tests pass** locally
- ✅ **No linting errors**
- ✅ **Documentation updated** if needed
- ✅ **No breaking changes** (or clearly documented)

### PR Template

When creating a PR, use this template:

```markdown
## Description
Brief description of changes made.

## Type of Change
- [ ] Bug fix
- [ ] New feature  
- [ ] Documentation update
- [ ] Refactoring
- [ ] Performance improvement

## Related Issues
Fixes #123

## How Has This Been Tested?
- [ ] Unit tests
- [ ] E2E tests
- [ ] Manual testing

## Screenshots (if applicable)
Add screenshots for UI changes.

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No breaking changes
```

### Review Process

1. **Automated checks** run on PR creation
2. **Maintainer review** (usually within 48 hours)
3. **Address feedback** if requested
4. **Approval and merge** by maintainers

## 🎨 UI Component Guidelines

We use shadcn/ui components. Here's how to add new ones:

### Adding New Components

```bash
# Add a new shadcn component
npx shadcn@latest add button

# Or add multiple components
npx shadcn@latest add button input label
```

### Custom Components

Create custom components in the `components/` directory:

```typescript
// components/custom/DocumentCard.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface DocumentCardProps {
  document: {
    title: string;
    status: string;
    pageCount: number;
  };
}

export function DocumentCard({ document }: DocumentCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="truncate">{document.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center">
          <Badge variant={document.status === 'completed' ? 'default' : 'secondary'}>
            {document.status}
          </Badge>
          <span className="text-sm text-muted-foreground">
            {document.pageCount} pages
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
```

### Styling Guidelines

- Use Tailwind CSS classes
- Follow the existing design system
- Ensure components are responsive
- Test in both light and dark modes (if applicable)
- Add proper accessibility attributes

## 🔒 Security Considerations

### Current Security Status
The project has authentication **disabled** for easy development. When contributing:

1. **Don't commit real API keys** or secrets
2. **Use placeholder values** in documentation
3. **Follow security best practices** in new code
4. **Be aware** that auth is disabled in development

### Adding Security-Related Code

When adding features that will require authentication:

```typescript
// Add TODO comments for production security
export async function sensitiveOperation() {
  // TODO: Re-enable authentication for production
  // const { userId } = await auth();
  // if (!userId) {
  //   throw new Error("Unauthorized");
  // }
  
  // Implementation here
}
```

## 🐛 Reporting Issues

### Bug Reports

Use the bug report template:

```markdown
**Describe the bug**
A clear description of the bug.

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What should happen.

**Screenshots**
Add screenshots if applicable.

**Environment:**
- OS: [e.g. macOS, Windows, Linux]
- Browser: [e.g. Chrome, Safari, Firefox]
- Node.js version: [e.g. 18.17.0]
- pnpm version: [e.g. 8.6.0]

**Additional context**
Any other context about the problem.
```

### Feature Requests

Use the feature request template:

```markdown
**Is your feature request related to a problem?**
A clear description of the problem.

**Describe the solution you'd like**
A clear description of what you want to happen.

**Describe alternatives you've considered**
Alternative solutions or features you've considered.

**Additional context**
Screenshots, mockups, or examples.
```

## 🏷️ Issue Labels

Understanding our label system:

### Type Labels
- `bug` - Something isn't working
- `enhancement` - New feature or improvement
- `documentation` - Documentation improvements
- `question` - Further information is requested

### Priority Labels
- `priority: high` - Critical issues
- `priority: medium` - Important but not critical
- `priority: low` - Nice to have

### Status Labels  
- `good first issue` - Good for newcomers
- `help wanted` - Extra attention needed
- `in progress` - Someone is working on this
- `blocked` - Blocked by dependencies

### Area Labels
- `area: frontend` - Frontend/UI related
- `area: backend` - Convex functions/API
- `area: docs` - Documentation related
- `area: testing` - Test related

## 🚀 Release Process

### Versioning

We follow [Semantic Versioning](https://semver.org/):
- `MAJOR.MINOR.PATCH`
- `MAJOR`: Breaking changes
- `MINOR`: New features (backward compatible)  
- `PATCH`: Bug fixes (backward compatible)

### Release Workflow

1. **Feature freeze** for upcoming release
2. **Testing period** with release candidates
3. **Update CHANGELOG.md**
4. **Create release** with tags
5. **Deploy to production**

## 📞 Getting Help

### Communication Channels

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: Questions and general discussion
- **Email**: robert@precisionpdf.com for private matters

### Before Asking

1. **Check existing issues** and discussions
2. **Read the documentation** thoroughly  
3. **Try reproducing** the issue locally
4. **Gather relevant information** (error messages, screenshots, etc.)

## 🙏 Recognition

### Contributors

All contributors will be:
- **Listed** in the Contributors section
- **Thanked** in release notes for significant contributions
- **Invited** to our contributors channel

### Types of Contributions Recognized

- Code contributions (features, bug fixes)
- Documentation improvements
- Bug reports with detailed reproduction steps
- Feature suggestions and feedback
- Community support and helping others

## 📜 Code of Conduct

### Our Standards

- **Be respectful** and inclusive
- **Be constructive** in feedback
- **Be patient** with newcomers
- **Be professional** in all interactions

### Unacceptable Behavior

- Harassment or discrimination
- Trolling or insulting comments
- Spam or off-topic discussions
- Sharing private information without permission

### Enforcement

- First offense: Warning
- Second offense: Temporary ban
- Third offense: Permanent ban

Report issues to: conduct@precisionpdf.com

## 📚 Additional Resources

### Learning Resources

- **Next.js Documentation**: https://nextjs.org/docs
- **Convex Documentation**: https://docs.convex.dev
- **React Documentation**: https://react.dev
- **Tailwind CSS**: https://tailwindcss.com/docs
- **shadcn/ui**: https://ui.shadcn.com

### Development Tools

- **VS Code Extensions**: 
  - ES7+ React/Redux/React-Native snippets
  - Tailwind CSS IntelliSense
  - TypeScript Importer
- **Browser Extensions**:
  - React Developer Tools
  - Redux DevTools (if applicable)

---

Thank you for contributing to Precision PDF! 🎉

Your contributions help make document processing more accessible and powerful for everyone.