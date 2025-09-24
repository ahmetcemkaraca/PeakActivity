# ArchBuilder.AI Website - AI Coding Agent Instructions

Project-wide instructions for ArchBuilder.AI website development. This is a **Next.js 15 + TypeScript** multilingual marketing site with **static export** capability. Keep answers concise; code complete and runnable.

## 📋 Project Architecture Overview

**Tech Stack**: Next.js 15.5.3 (App Router), React 19, TypeScript, Tailwind CSS 4, next-intl
**Deployment**: Static export (`output: 'export'`) for hosting flexibility
**Structure**: Monorepo website component of larger ArchBuilder.AI ecosystem

### Key Architecture Decisions
- **Static Export**: Uses `next export` for deployment to CDNs/static hosts
- **Multilingual**: 7 languages (EN default) with custom i18n system using React Context
- **Component Structure**: Sections-based architecture (hero, features, pricing, etc.)
- **Styling**: Tailwind CSS 4 with custom design system, dark/light theme support
- **Performance**: Turbopack for development, optimized for Lighthouse ≥90

### Critical File Structure
```
src/
├── app/                    # Next.js App Router
├── components/
│   ├── layout/            # Header, Footer components
│   ├── sections/          # Hero, Features, CTA, Technology, Pricing
│   └── ui/                # Reusable UI components
├── lib/
│   ├── api.ts             # API client configuration
│   └── i18n/              # Custom i18n system
│       ├── config.ts      # Supported locales, flags, names
│       ├── context.tsx    # React Context provider
│       ├── translations.ts # Translation helper functions
│       └── locales/       # Translation files per language
└── types/index.ts         # TypeScript definitions
```

### Development Commands
```powershell
npm run dev          # Start with Turbopack (faster)
npm run build        # Build for production
npm run export       # Static export after build
npm run lint         # ESLint check
```

## 🔧 MANDATORY DEVELOPMENT WORKFLOW

### 🌟 GIT BRANCH WORKFLOW
**ALWAYS** work with feature branches for every task/implementation:

#### Git Branch Strategy:
1. **Create Feature Branch**: Before starting any task, create a new branch from main
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/task-name-description
   ```

2. **Branch Naming Convention**:
   - `feature/component-implementation`
   - `feature/i18n-translations`
   - `feature/ui-enhancements`
   - `bugfix/issue-description`
   - `docs/update-instructions`

3. **Work on Feature Branch**: 
   - Make all commits to the feature branch
   - Use descriptive commit messages with conventional commits format
   - Push feature branch to origin regularly

4. **Submit for Review**:
   - When task is complete, push final branch to origin
   - DO NOT merge to main directly
   - Human reviewer will merge after approval

### Before ANY Implementation:
**ALWAYS** read the relevant `*.instructions.md` files from `.github/instructions/` directory before writing or modifying any code. This is **NON-NEGOTIABLE**.

#### Workflow Steps:
1. **Identify the task** - Understand what needs to be implemented or fixed
2. **Read relevant instruction files** - Based on file patterns and technologies involved
3. **Apply the guidelines** - Follow the specific patterns, standards, and best practices
4. **Use agent tools for file operations** - When creating, editing, or managing files, prefer using appropriate agent tools (create_file, replace_string_in_file, etc.) over manual approaches
5. **Preserve existing functionality** - Ensure that existing features are not removed or broken
6. **Update documentation** - Document all new modules in corresponding docs/ files
7. **Implement the code** - Write code that adheres to all applicable instructions
8. **Validate compliance** - Ensure the implementation follows all guidelines

## 🚨 CRITICAL: Next.js + i18n Specific Patterns

### Custom i18n System Usage
This project uses a **custom React Context-based i18n system** (NOT next-intl despite the dependency):

```typescript
// CORRECT: Use i18n context
import { useI18n } from '@/lib/i18n';

function MyComponent() {
  const { t } = useI18n();
  return <h1>{t('hero.title')}</h1>;
}

// WRONG: Never hardcode UI text
function MyComponent() {
  return <h1>Welcome to ArchBuilder.AI</h1>; // ❌
}
```

### Translation File Structure
All UI text must be in locale files following this pattern:

```typescript
// src/lib/i18n/locales/en.ts
export const en = {
  hero: {
    title: "AI-Powered Architectural Design",
    subtitle: "Revolutionary automation for architects"
  },
  nav: {
    overview: "Overview",
    features: "Features"
  }
};
```

### Component Patterns
- **Sections**: Large page sections go in `src/components/sections/`
- **Layout**: Header/Footer in `src/components/layout/`
- **UI**: Reusable components in `src/components/ui/`
- **Providers**: Context providers in `src/components/providers/`

### Static Export Considerations
- NO `getServerSideProps` or server-side dynamic features
- Use `next/image` with `unoptimized: true` (already configured)
- Environment variables must be prefixed with `NEXT_PUBLIC_`
- All routes must be statically analyzable

## 📋 Instruction Files Reference Guide

### Web Development (.tsx, .jsx files)
- **Primary**: `.github/instructions/web-typescript-react.instructions.md`
- **UI/UX**: `.github/instructions/ux-ui-design.instructions.md`
- **Security**: `.github/instructions/security.instructions.md`

### Documentation & Registry
- **Registry**: `.github/instructions/registry-governance.instructions.md`
- **Architecture**: `.github/instructions/architecture-decisions.instructions.md`
- **Code Style**: `.github/instructions/code-style.instructions.md`

## Quality Gates
- TypeScript strict mode compliance
- ESLint + Prettier formatting
- All UI text via i18n (no hardcoded strings)
- Responsive design (mobile-first)
- Dark/light theme compatibility
- Lighthouse score ≥ 90

## Language & Output Policy

**CRITICAL**: This policy overrides any conflicting statements:
- **Code and identifiers**: English
- **In-code comments**: Turkish
- **UI text**: Via i18n system (English default, Turkish + 5 other languages)
- **Chat responses to user**: Turkish, concise and actionable

Example:
```typescript
// Kullanıcı dil seçimini kaydet
export function saveLanguagePreference(locale: Locale) {
  localStorage.setItem('preferred-locale', locale);
}
```

## Registry & Persistent Context

Maintain project registry and versioned context to prevent drift:

Required files:
- `docs/registry/identifiers.json` — modules, exports, variables, config keys
- `docs/registry/endpoints.json` — HTTP contracts (currently empty for static site)
- `docs/registry/schemas.json` — data models, form schemas

### Rules:
1. **After any change** that adds/renames/deletes functions, components, or schemas → update registry JSONs
2. **Before starting work** → read `docs/registry/*.json` and `docs/context/current-context.md`
3. **Never ship** code changes without updating registry and adding tests

### Registry Schema Examples:
```json
// identifiers.json
{
  "modules": [{
    "name": "i18n.context",
    "exports": ["useI18n", "I18nProvider"],
    "variables": ["defaultLocale"],
    "configKeys": ["NEXT_PUBLIC_DOMAIN"]
  }]
}
```

## Development Checklist

Before committing any code changes:

- [ ] All imports resolve correctly
- [ ] No hardcoded UI text (use i18n system)
- [ ] TypeScript compilation successful
- [ ] ESLint passes without warnings
- [ ] Component registered in `docs/registry/identifiers.json`
- [ ] Responsive design tested (mobile + desktop)
- [ ] Dark/light theme compatibility verified
- [ ] Translation keys added to all 7 locale files

## Common Patterns & Anti-Patterns

### ✅ Good Practices
```typescript
// Use absolute imports
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';

// Type-safe component props
interface HeroProps {
  className?: string;
}

// Proper i18n usage
const { t } = useI18n();
return <h1>{t('hero.title')}</h1>;
```

### ❌ Anti-Patterns
```typescript
// Relative imports
import { Button } from '../ui/button'; // ❌

// Hardcoded text
return <h1>Welcome</h1>; // ❌

// Missing TypeScript types
function MyComponent(props) { } // ❌
```

## Versioning & Context

- Update `version.md` every 2 development cycles
- Use PowerShell for timestamps: `Get-Date -Format 'yyyy-MM-dd HH:mm:ss'`
- Document key changes, features, and bug fixes
- Never delete previous version entries