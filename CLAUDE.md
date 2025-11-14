# CLAUDE.md - AI Assistant Guide for PeakActivity

**Last Updated:** 2025-11-14
**Version:** 0.3.0
**Purpose:** Comprehensive guide for AI assistants working on PeakActivity codebase

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture & Tech Stack](#architecture--tech-stack)
3. [Directory Structure](#directory-structure)
4. [Development Workflows](#development-workflows)
5. [Code Conventions & Standards](#code-conventions--standards)
6. [Key Files & Their Purpose](#key-files--their-purpose)
7. [Recent Implementations](#recent-implementations)
8. [Git Workflow](#git-workflow)
9. [Firebase & Cloud Functions](#firebase--cloud-functions)
10. [Common Tasks & Patterns](#common-tasks--patterns)
11. [AI Assistant Guidelines](#ai-assistant-guidelines)
12. [Troubleshooting](#troubleshooting)

---

## Project Overview

### What is PeakActivity?

PeakActivity is an **AI-powered productivity and time tracking SaaS application** built on top of ActivityWatch. It transforms raw activity data into actionable insights using advanced AI techniques.

**Key Differentiators:**
- ✅ Privacy-first architecture (client-side AI, Edge ML)
- ✅ Hybrid cloud/local processing
- ✅ Agentic AI workflows (PraisonAI integration)
- ✅ Multi-provider LLM support (OpenAI, Anthropic, Google, Local)
- ✅ Real-time TensorFlow.js models in browser
- ✅ Scheduled automation (cron-like agent execution)

**Vision:** Help users maximize productivity while maintaining privacy and control over their data.

---

## Architecture & Tech Stack

### Core Technologies

**Frontend:**
- **Desktop App:** Tauri (Rust) + Vue 3 + TypeScript
- **Web Dashboard:** Vue 3 + Composition API + TypeScript + Pug templates
- **Styling:** SCSS + CSS Grid/Flexbox

**Backend:**
- **Cloud Functions:** Firebase Functions v2 (TypeScript)
- **Database:** Cloud Firestore (NoSQL)
- **Auth:** Firebase Authentication
- **Storage:** Firebase Storage
- **Hosting:** Firebase Hosting

**Python Services:**
- **ActivityWatch Server:** Python 3.8+ (Flask)
- **Agentic AI:** PraisonAI framework
- **Data Processing:** Pandas, NumPy

**AI/ML Stack:**
- **Client-side LLM:** OpenAI API, Anthropic Claude, Google Gemini, Ollama
- **Edge AI:** TensorFlow.js (browser-based ML models)
- **Server AI:** Google Gemini (via GenKit)
- **Agentic AI:** PraisonAI + custom tools

### Architecture Patterns

```
┌─────────────────────────────────────────────────────────┐
│                     User Devices                        │
│  Desktop (Tauri) │ Browser Extension │ Mobile (Future)  │
└────────────┬────────────────────────────────────────────┘
             │
             ├─────────────┬─────────────┬─────────────┐
             │             │             │             │
        ┌────▼────┐   ┌───▼───┐    ┌───▼───┐    ┌───▼───┐
        │ Edge AI │   │ Local │    │Client │    │Tauri  │
        │ (TF.js) │   │Storage│    │ LLM   │    │Core   │
        └────┬────┘   └───┬───┘    └───┬───┘    └───┬───┘
             │            │            │            │
             └────────────┴────────────┴────────────┘
                          │
                ┌─────────▼──────────┐
                │  ActivityWatch     │
                │  Python Server     │
                │  (aw-server)       │
                └─────────┬──────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
   ┌────▼────┐      ┌────▼────┐      ┌────▼────┐
   │PraisonAI│      │Firebase │      │External │
   │ Agents  │      │Functions│      │ APIs    │
   └────┬────┘      └────┬────┘      └─────────┘
        │                │
        └────────┬───────┘
                 │
        ┌────────▼────────┐
        │   Cloud Firestore│
        │   Firebase Auth  │
        │   Firebase Storage│
        └──────────────────┘
```

---

## Directory Structure

### Root Level

```
PeakActivity/
├── aw-server/              # ActivityWatch server (Python/Flask)
│   ├── aw-webui/          # Vue 3 web dashboard
│   ├── aw_server/         # Python server code
│   ├── praisonai_integration/ # Agentic AI system
│   └── tests/
├── aw-qt/                  # Tauri desktop app
│   ├── src-tauri/         # Rust backend
│   └── src/               # Frontend code
├── aw-watcher-*/          # Activity watchers (window, afk, input)
├── functions/              # Firebase Cloud Functions
│   ├── src/
│   │   ├── api/           # API endpoints
│   │   ├── services/      # Business logic
│   │   ├── middlewares/   # Auth, error handling
│   │   └── triggers/      # Firestore/Scheduler triggers
│   ├── package.json
│   └── tsconfig.json
├── public-md/             # Project documentation
├── scripts/               # Build & deployment scripts
├── .github/               # GitHub Actions & instructions
│   └── instructions/      # Development guidelines
├── firestore.rules        # Firestore security rules
├── storage.rules          # Storage security rules
├── .env.example           # Environment template
└── *.md                   # Documentation files
```

### Frontend Structure (aw-webui)

```
aw-server/aw-webui/src/
├── components/
│   ├── settings/          # Settings pages
│   │   ├── LLMProviderSettings.vue
│   │   ├── EdgeAISettings.vue
│   │   └── AgentSchedules.vue
│   └── ...                # Other components
├── composables/           # Vue composables (reusable logic)
│   ├── useClientAI.ts    # Client LLM integration
│   └── useEdgeAI.ts      # TensorFlow.js ML models
├── services/
│   ├── llm/              # LLM provider services
│   │   ├── llm-providers.ts
│   │   ├── client-llm-service.ts
│   │   └── user-api-key-service.ts
│   ├── edge-ai/          # Edge AI models
│   │   └── tfjs-models.ts
│   └── ...
├── views/                # Page components
├── router/               # Vue Router config
├── stores/               # Pinia stores (state management)
└── firebase.ts           # Firebase SDK initialization
```

### Backend Structure (functions)

```
functions/src/
├── api/                   # API endpoints (Callable Functions)
│   ├── agent-api.ts      # Agent generation
│   ├── agent-run-api.ts  # Agent execution tracking
│   ├── agent-schedule-api.ts # Scheduled agents
│   └── ai-analysis-api.ts # AI analysis (server fallback)
├── services/              # Business logic
│   ├── agent-execution-service.ts
│   ├── agent-scheduler-service.ts
│   └── ...
├── middlewares/
│   ├── requireAuth.ts    # Authentication check
│   └── errorHandler.ts   # Global error handling
├── triggers/
│   ├── firestore-triggers.ts
│   ├── scheduler-triggers.ts
│   └── backup-triggers.ts
└── index.ts              # Function exports
```

### PraisonAI Integration

```
aw-server/praisonai_integration/
├── agent_service.py       # Agent lifecycle management
├── tools/                 # Custom tools for agents
│   ├── __init__.py
│   ├── activitywatch_tools.py  # AW data access
│   ├── firestore_tools.py      # Firestore operations
│   ├── notification_tools.py   # Notifications
│   └── analytics_tools.py      # Analytics functions
└── tests/
```

---

## Development Workflows

### Initial Setup

```bash
# Clone repository
git clone https://github.com/ahmetcemkaraca/PeakActivity.git
cd PeakActivity

# Install dependencies
# Frontend (aw-webui)
cd aw-server/aw-webui
npm install

# Backend (Firebase Functions)
cd ../../functions
npm install

# Python server
cd ../aw-server
pip install -r requirements.txt

# PraisonAI integration
cd praisonai_integration
pip install -r requirements.txt
```

### Environment Configuration

**Create `.env` files from templates:**

```bash
# Root
cp .env.example .env

# Firebase Functions
cp functions/.env.example functions/.env

# Frontend
cp aw-server/aw-webui/.env.example aw-server/aw-webui/.env
```

**Required Environment Variables:**

```env
# Firebase Functions (.env or via Secrets)
GEMINI_API_KEY=your_google_ai_key
AW_SERVER_URL=http://localhost:5600

# Frontend (aw-webui/.env)
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123:web:abc
```

### Running Development Servers

```bash
# 1. Start ActivityWatch Python server
cd aw-server
python -m aw_server

# 2. Start Frontend (aw-webui)
cd aw-webui
npm run dev
# Access: http://localhost:5666

# 3. Start Firebase Functions locally
cd functions
npm run serve
# Emulator: http://localhost:4000

# 4. Start Desktop App (Tauri)
cd aw-qt
npm run tauri dev
```

### Building for Production

```bash
# Frontend
cd aw-server/aw-webui
npm run build

# Firebase Functions
cd functions
npm run build

# Deploy to Firebase
firebase deploy --only functions,hosting,firestore,storage
```

---

## Code Conventions & Standards

### TypeScript/JavaScript

**Style:**
- ✅ Use TypeScript for all new code
- ✅ Strict mode enabled (`tsconfig.json`)
- ✅ ESLint + Prettier for formatting
- ✅ Prefer `const` over `let`, avoid `var`
- ✅ Use async/await over Promises chains
- ✅ Functional programming patterns where appropriate

**Naming:**
```typescript
// Files: kebab-case
agent-scheduler-service.ts

// Classes: PascalCase
class AgentExecutionService {}

// Functions/Variables: camelCase
const calculateFocusScore = () => {}

// Constants: UPPER_SNAKE_CASE
const MAX_RETRY_COUNT = 3;

// Interfaces: PascalCase with 'I' prefix (optional)
interface AgentSchedule {}

// Types: PascalCase
type LLMProvider = 'openai' | 'anthropic' | 'google';
```

**Function Documentation:**
```typescript
/**
 * Calculate next run time based on cron schedule
 * @param expression - Cron expression (e.g., "0 9 * * *")
 * @param from - Starting date
 * @returns Timestamp for next execution
 */
private parseNextCronTime(expression: string, from: Date): Timestamp {
  // Implementation
}
```

### Vue 3 Conventions

**Component Structure:**
```vue
<template lang="pug">
.component-name
  .header
    h2 Title
  .content
    // Component content
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

// Props
interface Props {
  modelValue: string;
}
const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

// State
const isLoading = ref(false);

// Computed
const formattedValue = computed(() => props.modelValue.toUpperCase());

// Lifecycle
onMounted(() => {
  // Init logic
});

// Methods
const handleClick = () => {
  // Handler
};
</script>

<style scoped lang="scss">
.component-name {
  padding: 1rem;

  .header {
    margin-bottom: 1rem;
  }
}
</style>
```

**Composables Pattern:**
```typescript
// composables/useFeature.ts
export function useFeature() {
  const state = ref(null);
  const isLoading = ref(false);

  async function doSomething() {
    isLoading.value = true;
    try {
      // Logic
    } finally {
      isLoading.value = false;
    }
  }

  return {
    state,
    isLoading,
    doSomething
  };
}
```

### Python Conventions

**Style:**
- ✅ PEP 8 compliance
- ✅ Type hints for function signatures
- ✅ Docstrings (Google style)
- ✅ Black formatter
- ✅ 4 spaces indentation

**Example:**
```python
from typing import Dict, List, Optional

def process_activity_data(
    user_id: str,
    bucket_id: str,
    start_date: Optional[str] = None
) -> Dict[str, Any]:
    """
    Process activity data for a user.

    Args:
        user_id: User identifier
        bucket_id: Bucket identifier
        start_date: Optional start date (ISO format)

    Returns:
        Dict containing processed activity data

    Raises:
        ValueError: If bucket_id is invalid
    """
    # Implementation
    pass
```

### Firebase Functions Conventions

**Callable Functions:**
```typescript
export const functionName = onCall(
  {
    enforceAppCheck: true,
    secrets: [secretName],
    timeoutSeconds: 300,
    memory: '512MiB'
  },
  async (request) => {
    // Always require auth for sensitive operations
    requireAuth(request);

    const userId = request.auth!.uid;
    const data = request.data;

    // Validate input
    if (!data.requiredField) {
      throw new HttpsError('invalid-argument', 'requiredField is required');
    }

    try {
      // Business logic
      const result = await someService.doSomething(userId, data);

      return {
        success: true,
        result
      };
    } catch (error: any) {
      throw new HttpsError('internal', error.message);
    }
  }
);
```

**Scheduled Functions:**
```typescript
export const scheduledTask = onSchedule(
  {
    schedule: 'every 5 minutes',
    timeZone: 'UTC',
    retryCount: 3
  },
  async (event) => {
    // Task logic
  }
);
```

### File Naming Conventions

```
// Services
user-service.ts
agent-execution-service.ts

// API endpoints
agent-api.ts
agent-schedule-api.ts

// Components
LLMProviderSettings.vue
EdgeAISettings.vue

// Composables
useClientAI.ts
useEdgeAI.ts

// Types/Interfaces
types.ts
interfaces.ts
```

---

## Key Files & Their Purpose

### Configuration Files

| File | Purpose |
|------|---------|
| `firebase.json` | Firebase project configuration |
| `firestore.rules` | Firestore security rules (user data isolation) |
| `storage.rules` | Cloud Storage security rules |
| `functions/tsconfig.json` | TypeScript config for Cloud Functions |
| `functions/package.json` | Dependencies for Cloud Functions |
| `aw-server/aw-webui/vite.config.ts` | Vite build configuration |
| `.env.example` | Environment variables template |

### Core Application Files

| File | Purpose |
|------|---------|
| `functions/src/index.ts` | **Main entry point** - exports all Cloud Functions |
| `aw-server/aw-webui/src/firebase.ts` | Firebase SDK initialization (frontend) |
| `aw-server/aw-webui/src/main.ts` | Vue app entry point |
| `aw-server/aw_server/__init__.py` | ActivityWatch server main |
| `aw-server/praisonai_integration/agent_service.py` | **Agentic AI core** |

### Documentation Files

| File | Purpose |
|------|---------|
| `README.md` | Project overview |
| `CLAUDE.md` | **This file** - AI assistant guide |
| `IMPLEMENTATION_SUMMARY.md` | Agentic AI infrastructure summary |
| `CLIENT_SIDE_AI_IMPLEMENTATION.md` | Client-side LLM integration |
| `EDGE_AI_IMPLEMENTATION.md` | TensorFlow.js ML models |
| `FUTURE_FEATURES_SUGGESTIONS.md` | 60+ feature ideas with priorities |
| `public-md/project_summary.md` | Comprehensive project analysis |

---

## Recent Implementations

### 1. Client-Side AI (LLM Integration)

**Status:** ✅ Complete (Nov 14, 2025)

**Key Components:**
```
services/llm/
├── llm-providers.ts         # 5 providers, 16 models
├── client-llm-service.ts    # Multi-provider LLM service
└── user-api-key-service.ts  # Encrypted API key storage

composables/useClientAI.ts   # 6 pre-built analysis functions
components/settings/LLMProviderSettings.vue  # UI
functions/src/api/ai-analysis-api.ts  # Server fallback
```

**Features:**
- Multi-provider: OpenAI, Anthropic (Claude), Google (Gemini), Local (Ollama), Server
- 3 modes: Client-only, Server-only, Hybrid (auto-fallback)
- Encrypted API keys in localStorage (XOR + Base64)
- Cost tracking per analysis
- Privacy: ★★★★★ (data never touches server in client mode)

**Usage:**
```typescript
const { analyzeFocus, isAnalyzing } = useClientAI();

const result = await analyzeFocus(activityData);
// => { insights, suggestions, focusScore }
```

### 2. Edge AI (TensorFlow.js ML Models)

**Status:** ✅ Complete (Nov 14, 2025)

**4 ML Models:**

1. **Activity Classifier** - Binary classification (productive vs distraction)
   ```typescript
   const result = await classifyActivity('VS Code', 'main.ts', 1800);
   // => { isProductive: true, confidence: 0.92 }
   ```

2. **Focus Pattern Detector** (LSTM) - Predicts next focus level
   ```typescript
   const prediction = await detectFocusPattern(last60MinutesData);
   // => { nextFocusScore: 0.68, confidence: 0.75 }
   ```

3. **Anomaly Detector** (Autoencoder) - Detects unusual behavior
   ```typescript
   const anomaly = await detectAnomalies(dailyActivityPattern);
   // => { isAnomaly: true, anomalyScore: 0.85 }
   ```

4. **Time Series Predictor** - 7-day productivity forecast
   ```typescript
   const forecast = await predictProductivity(last14Days);
   // => { predictions: [72, 78, 82...], confidence: [0.9, 0.85...] }
   ```

**Performance:**
- Init: ~1.6s, Inference: ~45ms
- Memory: ~6MB total
- Privacy: ★★★★★★ (100% local, no server communication)

### 3. Agent Scheduling System

**Status:** ✅ Complete (Nov 14, 2025)

**Key Components:**
```
services/agent-scheduler-service.ts  # Core scheduling logic
api/agent-schedule-api.ts            # 8 API endpoints
components/settings/AgentSchedules.vue  # Management UI
```

**Schedule Types:**
```typescript
// Cron expression
{ type: 'cron', expression: '0 9 * * *' }  // Daily at 9 AM

// Interval
{ type: 'interval', intervalMs: 3600000 }  // Every hour

// One-time
{ type: 'once', runAt: specificTimestamp }
```

**Features:**
- Enable/disable schedules
- Manual trigger (run now)
- Execution tracking (success/failure counts, last run, next run)
- Cloud Scheduler integration (auto-runs every 5 minutes)
- Error handling with retry logic

**API Endpoints:**
- `createAgentSchedule`
- `updateAgentSchedule`
- `deleteAgentSchedule`
- `getAgentSchedule`
- `listAgentSchedules`
- `getAgentScheduleStats`
- `triggerAgentSchedule`
- `processAgentSchedules` (Cloud Scheduler)

---

## Git Workflow

### Branch Naming Convention

```bash
# Feature branches
feature/add-voice-assistant
feature/mobile-app-ios

# Bug fixes
fix/auth-token-refresh
fix/anomaly-detection-threshold

# AI-generated branches (Claude)
claude/<feature-name>-<session-id>
# Example: claude/activitywatch-ai-complete-01N1JFAbRs77gtgTHABCt4Za
```

### Commit Message Format

**Structure:**
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting, no code change
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance

**Examples:**
```bash
feat(edge-ai): Add TensorFlow.js anomaly detector

Implements autoencoder-based anomaly detection for daily activity patterns.
- Encoder: 24 → 16 → 8 → 4
- Decoder: 4 → 8 → 16 → 24
- Auto-threshold calculation (95th percentile)

Closes #123

---

fix(auth): Handle expired token refresh

Fixes issue where users were logged out unexpectedly.
```

### Git Commands Workflow

```bash
# Create feature branch
git checkout -b feature/my-feature

# Stage changes
git add -A

# Commit with detailed message
git commit -m "feat(scope): description"

# Push to remote
git push -u origin feature/my-feature

# For AI branches (Claude), use specific naming
git checkout -b claude/feature-name-sessionid
git push -u origin claude/feature-name-sessionid
```

### Pull Request Process

1. **Create PR** from feature branch to `main`
2. **PR Title:** Same format as commit message
3. **PR Description:**
   - What changed
   - Why (problem/motivation)
   - How (implementation approach)
   - Testing done
   - Screenshots (if UI changes)
4. **Review:** Wait for code review
5. **Merge:** Squash and merge to main

---

## Firebase & Cloud Functions

### Firebase Configuration

**Project Structure:**
```json
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "functions": {
    "source": "functions",
    "runtime": "nodejs18"
  },
  "hosting": {
    "public": "aw-server/aw-webui/dist",
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  },
  "storage": {
    "rules": "storage.rules"
  }
}
```

### Firestore Security Rules

**Key Patterns:**

```javascript
// User data isolation
match /users/{userId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;

  // Nested collections
  match /agent_runs/{runId} {
    allow read: if request.auth.uid == userId;
    allow create: if request.auth.uid == userId && hasValidSubscription(userId);
    allow write: if false; // Only backend can update
  }
}

// Helper functions
function hasValidSubscription(userId) {
  let user = get(/databases/$(database)/documents/users/$(userId));
  return user.data.subscriptionStatus == 'active';
}
```

### Cloud Functions Best Practices

**1. Authentication:**
```typescript
import { requireAuth } from '../middlewares/requireAuth';

export const protectedFunction = onCall(
  { enforceAppCheck: true },
  async (request) => {
    requireAuth(request);  // Throws if not authenticated
    const userId = request.auth!.uid;
    // ...
  }
);
```

**2. Error Handling:**
```typescript
try {
  const result = await someOperation();
  return { success: true, result };
} catch (error: any) {
  logger.error('Operation failed', { error: error.message, userId });
  throw new HttpsError('internal', error.message);
}
```

**3. Secrets Management:**
```typescript
import { defineSecret } from 'firebase-functions/params';

const apiKey = defineSecret('GEMINI_API_KEY');

export const myFunction = onCall(
  { secrets: [apiKey] },
  async (request) => {
    const key = apiKey.value();
    // Use key
  }
);
```

**Set secrets:**
```bash
firebase functions:secrets:set GEMINI_API_KEY
```

**4. Timeout & Memory:**
```typescript
export const longRunningTask = onCall(
  {
    timeoutSeconds: 300,  // 5 minutes
    memory: '512MiB'
  },
  async (request) => {
    // Heavy computation
  }
);
```

### Deployment

```bash
# Deploy everything
firebase deploy

# Deploy specific targets
firebase deploy --only functions
firebase deploy --only hosting
firebase deploy --only firestore:rules
firebase deploy --only storage:rules

# Deploy specific function
firebase deploy --only functions:functionName

# Use emulator for testing
firebase emulators:start
```

---

## Common Tasks & Patterns

### Adding a New API Endpoint

**1. Create API file:**
```typescript
// functions/src/api/my-feature-api.ts
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { requireAuth } from '../middlewares/requireAuth';

export const myFeatureFunction = onCall(
  { enforceAppCheck: true },
  async (request) => {
    requireAuth(request);

    const userId = request.auth!.uid;
    const { param1, param2 } = request.data;

    // Validation
    if (!param1) {
      throw new HttpsError('invalid-argument', 'param1 is required');
    }

    // Logic
    const result = await doSomething(userId, param1, param2);

    return {
      success: true,
      result
    };
  }
);
```

**2. Export in index.ts:**
```typescript
// functions/src/index.ts
import { myFeatureFunction } from './api/my-feature-api';

export {
  // ... existing exports
  myFeatureFunction
};
```

**3. Call from frontend:**
```typescript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const myFeature = httpsCallable(functions, 'myFeatureFunction');

const result = await myFeature({ param1: 'value', param2: 123 });
```

### Adding a New Vue Component

**1. Create component:**
```vue
<!-- components/MyComponent.vue -->
<template lang="pug">
.my-component
  h2 {{ title }}
  button(@click="handleClick") Click Me
</template>

<script setup lang="ts">
import { ref } from 'vue';

interface Props {
  title: string;
}

const props = defineProps<Props>();
const count = ref(0);

const handleClick = () => {
  count.value++;
};
</script>

<style scoped lang="scss">
.my-component {
  padding: 1rem;
}
</style>
```

**2. Use in parent:**
```vue
<template lang="pug">
div
  MyComponent(:title="'Hello World'")
</template>

<script setup lang="ts">
import MyComponent from './MyComponent.vue';
</script>
```

### Adding a New PraisonAI Tool

**1. Create tool function:**
```python
# aw-server/praisonai_integration/tools/my_tools.py
from typing import Dict, Any
from firebase_admin import firestore

def my_custom_tool(user_id: str, param: str) -> Dict[str, Any]:
    """
    Description of what this tool does.

    Args:
        user_id: User identifier
        param: Parameter description

    Returns:
        Dict with operation result
    """
    db = firestore.client()

    # Tool logic
    result = db.collection(f'users/{user_id}/data').document(param).get()

    return {
        'success': True,
        'data': result.to_dict()
    }
```

**2. Export in __init__.py:**
```python
# tools/__init__.py
from .my_tools import my_custom_tool

__all__ = ['my_custom_tool']
```

**3. Register in agent_service.py:**
```python
# agent_service.py
from .tools import my_custom_tool

def get_builtin_tools(self) -> Dict[str, Callable]:
    return {
        # ... existing tools
        'my_custom_tool': my_custom_tool
    }
```

**4. Use in agent config:**
```yaml
framework: praisonai
topic: My Analysis
roles:
  data_analyst:
    tools:
      - my_custom_tool
    tasks:
      - Use my_custom_tool to fetch user data
```

### Adding a New ML Model (TensorFlow.js)

**1. Define model class:**
```typescript
// services/edge-ai/tfjs-models.ts
export class MyMLModel {
  private model: tf.LayersModel | null = null;

  async initialize(): Promise<void> {
    try {
      this.model = await tf.loadLayersModel('localstorage://my-model');
    } catch {
      this.model = this.createModel();
    }
  }

  private createModel(): tf.LayersModel {
    const model = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [10], units: 64, activation: 'relu' }),
        tf.layers.dense({ units: 32, activation: 'relu' }),
        tf.layers.dense({ units: 1, activation: 'sigmoid' })
      ]
    });

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'binaryCrossentropy',
      metrics: ['accuracy']
    });

    return model;
  }

  async predict(input: number[]): Promise<number> {
    if (!this.model) await this.initialize();

    const inputTensor = tf.tensor2d([input], [1, 10]);
    const prediction = this.model!.predict(inputTensor) as tf.Tensor;
    const result = (await prediction.data())[0];

    inputTensor.dispose();
    prediction.dispose();

    return result;
  }

  async save(): Promise<void> {
    if (this.model) {
      await this.model.save('localstorage://my-model');
    }
  }
}
```

**2. Add to ModelManager:**
```typescript
export class EdgeAIModelManager {
  private myModel: MyMLModel;

  constructor() {
    this.myModel = new MyMLModel();
    // ... other models
  }

  async initializeAll(): Promise<void> {
    await Promise.all([
      this.myModel.initialize(),
      // ... other models
    ]);
  }

  getMyModel(): MyMLModel {
    return this.myModel;
  }
}
```

**3. Expose in composable:**
```typescript
// composables/useEdgeAI.ts
export function useEdgeAI() {
  // ... existing code

  const predictWithMyModel = async (input: number[]): Promise<number | null> => {
    if (!isInitialized.value) return null;

    isProcessing.value = true;
    try {
      const result = await modelManager.getMyModel().predict(input);
      return result;
    } catch (error: any) {
      console.error('Prediction error:', error);
      return null;
    } finally {
      isProcessing.value = false;
    }
  };

  return {
    // ... existing returns
    predictWithMyModel
  };
}
```

---

## AI Assistant Guidelines

### General Principles

**1. Privacy First**
- ✅ **ALWAYS** consider privacy implications
- ✅ Default to client-side processing when possible
- ✅ Encrypt sensitive data (API keys, user data)
- ✅ Document privacy level of each feature (★★★★★)
- ❌ Never send user activity data to external services without explicit opt-in

**2. Code Quality**
- ✅ Write TypeScript with strict types
- ✅ Add JSDoc comments for complex functions
- ✅ Follow existing patterns in codebase
- ✅ Handle errors gracefully with try/catch
- ✅ Log errors for debugging

**3. User Experience**
- ✅ Show loading states during async operations
- ✅ Provide clear error messages
- ✅ Add confirmation for destructive actions
- ✅ Make UI responsive and accessible

**4. Security**
- ✅ Always use `requireAuth()` for protected endpoints
- ✅ Validate all user input
- ✅ Use Firebase security rules for Firestore/Storage
- ✅ Never trust client-side data
- ✅ Use `enforceAppCheck: true` for sensitive operations

### When Adding New Features

**Checklist:**

1. **Research Phase**
   - [ ] Read relevant documentation files
   - [ ] Check existing similar implementations
   - [ ] Identify reusable components/services

2. **Design Phase**
   - [ ] Sketch architecture (backend, frontend, data flow)
   - [ ] Consider privacy implications
   - [ ] Plan error handling
   - [ ] Think about edge cases

3. **Implementation Phase**
   - [ ] Follow code conventions
   - [ ] Write types/interfaces first
   - [ ] Implement business logic
   - [ ] Add error handling
   - [ ] Add loading states

4. **Testing Phase**
   - [ ] Test happy path
   - [ ] Test error scenarios
   - [ ] Test edge cases
   - [ ] Manual testing in browser/emulator

5. **Documentation Phase**
   - [ ] Add JSDoc comments
   - [ ] Update relevant .md files
   - [ ] Add usage examples
   - [ ] Document API endpoints

6. **Git Phase**
   - [ ] Stage files: `git add -A`
   - [ ] Write descriptive commit message
   - [ ] Push to feature branch
   - [ ] Create PR with description

### Common Pitfalls to Avoid

**1. Firebase Functions**
- ❌ Don't forget to export new functions in `index.ts`
- ❌ Don't use blocking operations (use async/await)
- ❌ Don't exceed timeout limits (default: 60s, max: 540s)
- ❌ Don't forget to set memory limit for heavy operations

**2. Firestore**
- ❌ Don't use subcollections without security rules
- ❌ Don't do client-side queries without indexes
- ❌ Don't forget pagination for large datasets
- ❌ Don't use arrays for large collections (use maps)

**3. Vue Components**
- ❌ Don't mutate props directly
- ❌ Don't forget to dispose TensorFlow tensors
- ❌ Don't create memory leaks (unsubscribed listeners)
- ❌ Don't use inline styles (use scoped SCSS)

**4. TensorFlow.js**
- ❌ Don't forget to call `tensor.dispose()` after use
- ❌ Don't load large models without loading state
- ❌ Don't run inference on every keystroke (debounce)
- ❌ Don't forget to save models after training

### File Modification Guidelines

**When modifying `functions/src/index.ts`:**
- This file is a central registry for all Cloud Functions
- Always add imports at the top
- Export new functions in the main export block
- Group related functions together (comments)
- Don't remove existing exports without checking dependencies

**When modifying Firestore rules:**
- Test rules in Firebase Console before deploying
- Use helper functions for reusable logic
- Document complex rules with comments
- Always require authentication for user data
- Use field-level validation

**When modifying Vue components:**
- Keep components focused (single responsibility)
- Extract reusable logic to composables
- Use TypeScript interfaces for props/emits
- Keep template logic simple (move to computed/methods)
- Use Pug for templates (existing convention)

### Debugging Tips

**1. Firebase Functions Logs:**
```bash
# View logs
firebase functions:log

# Tail logs in real-time
firebase functions:log --only functionName

# View logs in Firebase Console
# https://console.firebase.google.com/project/YOUR_PROJECT/functions/logs
```

**2. Frontend Console:**
```typescript
// Enable verbose logging
localStorage.setItem('debug', 'peak:*');

// Log TensorFlow.js operations
import * as tf from '@tensorflow/tfjs';
tf.enableProdMode();  // Disable in production
```

**3. Python Server:**
```python
import logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

logger.debug('Debug message')
logger.info('Info message')
logger.error('Error message')
```

**4. Network Debugging:**
```bash
# Chrome DevTools -> Network tab
# Filter: XHR, Fetch
# Look for failed requests (red)
# Check request/response headers
```

---

## Troubleshooting

### Common Issues

**1. "Module not found" errors in Firebase Functions**

**Problem:** TypeScript can't find module after adding new file

**Solution:**
```bash
cd functions
npm run build
# Check for compilation errors
```

**2. "Permission denied" Firestore errors**

**Problem:** Security rules blocking legitimate access

**Solution:**
1. Check `firestore.rules`
2. Verify user is authenticated
3. Check userId matches document owner
4. Test rules in Firebase Console

**3. TensorFlow.js "Out of memory" errors**

**Problem:** Not disposing tensors after use

**Solution:**
```typescript
// Always dispose tensors
const tensor = tf.tensor2d([[1, 2, 3]]);
const result = model.predict(tensor);
// ... use result
tensor.dispose();
result.dispose();

// Or use tf.tidy()
const result = tf.tidy(() => {
  const tensor = tf.tensor2d([[1, 2, 3]]);
  return model.predict(tensor);
});
```

**4. "Firebase API key exposed" warning**

**Problem:** API key in source code

**Solution:**
- API keys in `.env` files are gitignored ✅
- Never commit `.env` to git
- Use environment variables (`import.meta.env.VITE_*`)

**5. Agent scheduling not triggering**

**Problem:** `processAgentSchedules` not running

**Solution:**
1. Check Cloud Scheduler in Firebase Console
2. Verify schedule is enabled in Firestore
3. Check `nextRun` timestamp is in past
4. View function logs for errors

**6. CORS errors when calling Firebase Functions**

**Problem:** Cross-origin requests blocked

**Solution:**
```typescript
// Use Firebase SDK (httpsCallable) instead of fetch()
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const myFunction = httpsCallable(functions, 'functionName');
const result = await myFunction(data);
```

### Getting Help

**Resources:**
- 📚 Project Docs: `/public-md/` directory
- 📖 Implementation Guides: `*_IMPLEMENTATION.md` files
- 🔧 Firebase Docs: https://firebase.google.com/docs
- 🧠 TensorFlow.js Docs: https://www.tensorflow.org/js
- 🤖 PraisonAI Docs: https://docs.praison.ai

**Debugging Workflow:**
1. Check logs (browser console, Firebase Functions logs)
2. Verify authentication (user logged in?)
3. Check security rules (Firestore/Storage)
4. Test in emulator (local development)
5. Search existing code for similar patterns
6. Check Git history for recent changes

---

## Quick Reference

### Essential Commands

```bash
# Development
npm run dev              # Start frontend dev server
npm run serve            # Start Firebase Functions emulator
firebase emulators:start # Start all Firebase emulators

# Build
npm run build            # Build frontend
npm run build            # Build functions (in functions/)

# Deploy
firebase deploy                    # Deploy everything
firebase deploy --only functions  # Deploy only functions
firebase deploy --only hosting    # Deploy only hosting

# Logs
firebase functions:log            # View function logs
firebase functions:log --only myFunction  # Specific function

# Git
git status                        # Check changes
git add -A                        # Stage all
git commit -m "feat: message"    # Commit
git push                         # Push to remote
```

### Key Directories Quick Access

```bash
# Frontend
cd aw-server/aw-webui

# Backend Functions
cd functions

# Python Server
cd aw-server

# PraisonAI
cd aw-server/praisonai_integration

# Documentation
cd public-md
```

### Environment Variables Quick Check

```bash
# Check if .env files exist
ls -la .env functions/.env aw-server/aw-webui/.env

# View (without exposing secrets)
cat .env.example
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 0.3.0 | 2025-11-14 | Added Edge AI, Agent Scheduling, Client-side LLM |
| 0.2.0 | 2025-xx-xx | Added PraisonAI integration, Agentic AI |
| 0.1.0 | 2025-xx-xx | Initial PeakActivity fork from ActivityWatch |

---

## Contact & Support

**Project Owner:** Ahmet Cem Karaca (@ackaraca)

**Repository:** https://github.com/ahmetcemkaraca/PeakActivity

**Issues:** https://github.com/ahmetcemkaraca/PeakActivity/issues

---

**Last Updated:** 2025-11-14
**Maintained By:** AI Assistants + Human Developers
**Next Review:** When significant changes occur

