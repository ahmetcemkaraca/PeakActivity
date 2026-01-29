# PeakActivity Onboarding Guide

This guide outlines the onboarding process for new users of PeakActivity. The goal is to provide a smooth introduction to the app's features while ensuring privacy and user consent.

## Onboarding Flow

### Step 1: Welcome Screen
- Display app logo and tagline: "Track your productivity with AI-powered insights"
- Brief description: "PeakActivity helps you understand how you spend your time and provides actionable recommendations."
- Call-to-action: "Get Started" button

### Step 2: Account Creation
- Option 1: Sign up with email/password
- Option 2: Continue with Google (OAuth)
- Option 3: Use demo mode (no account required for trial)
- Privacy notice: "We respect your privacy. Your data stays on your device unless you choose to sync."

### Step 3: Privacy and Consent
- Explain data collection: "We collect activity data locally using ActivityWatch. Cloud sync is optional."
- Consent checkboxes:
  - [ ] Allow local activity tracking
  - [ ] Enable AI insights (requires cloud sync)
  - [ ] Share anonymized data for model improvement (optional)
- Clear language: "You can change these settings anytime in Settings > Privacy."

### Step 4: Initial Setup
- Install ActivityWatch watchers (guided installation)
- Configure sync preferences (local only, cloud sync)
- Set timezone and language
- Quick tour: 30-second video or interactive walkthrough

### Step 5: First Activity
- Prompt to start tracking: "Start your first activity or let it run in background"
- Show sample dashboard with demo data
- Explain key features: Dashboard, Insights, Settings

### Step 6: Goal Setting
- Optional: Set first productivity goal (e.g., "Track 2 hours of work today")
- AI suggestion: "Based on your setup, we recommend tracking coding sessions"
- Success message: "Great! Your first goal is set. Check back in Insights."

## User Experience Principles

### Personalization
- Use user's name and preferences from onboarding
- Adaptive UI based on language and timezone

### Privacy Focus
- Transparent data flow diagram
- Easy opt-out at every step
- No data collection without explicit consent

### Progressive Disclosure
- Start simple: Basic tracking
- Unlock features gradually: AI insights after first sync
- Tooltips and help icons throughout

## Technical Implementation

### Frontend Flow
```typescript
// Onboarding store
const onboardingStore = useOnboardingStore();
await onboardingStore.completeStep('welcome');
await onboardingStore.completeStep('privacy');
await router.push('/dashboard');
```

### Backend Tracking
- Log onboarding completion to Firestore
- Track drop-off points for analytics
- Send welcome email with setup tips

### A/B Testing
- Variant A: Standard onboarding
- Variant B: Video walkthrough
- Metrics: Completion rate, time to first insight, retention after 7 days

## Metrics to Track

- Onboarding completion rate
- Time to first activity
- Consent acceptance rates
- Drop-off points
- First goal setting rate

## Support During Onboarding

- Help center link
- Contact support button
- FAQ section for common issues
- Progress indicator (e.g., "Step 2 of 5")

This onboarding flow ensures users understand the value quickly while respecting their privacy choices.
