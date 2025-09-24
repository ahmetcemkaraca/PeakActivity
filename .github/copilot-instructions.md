# PeakActivity Development Guidelines

This project integrates **ActivityWatch** (time tracking) with **PraisonAI Agents** (AI automation) and **Firebase** (cloud infrastructure) to create an intelligent productivity and digital wellness coach.

## Project Architecture

### Hybrid Data Flow
- **Local**: ActivityWatch watchers collect data → aw-server stores in buckets/events
- **Cloud**: Firebase Functions process AI insights → Firestore stores aggregated data
- **Integration**: PraisonAI agents bridge local data with cloud AI services

### Key Directories
- `PeakActivityMain/`: ActivityWatch fork with Firebase integration
- `PeakActivityAgent/`: PraisonAI agents framework for AI automation
- `functions/src/`: Firebase Cloud Functions (TypeScript)
- `aw-server/`: Modified ActivityWatch server with Firestore support
- `.cursor/rules/`: Project-specific development guidelines

## Core Components

### ActivityWatch Integration
```python
# Storage method selection in aw-server/main.py
storage_methods = {
    "peewee": PeeweeStorage,      # Local SQLite/Postgres
    "memory": MemoryStorage,       # In-memory (testing)
    "firestore": FirestoreStorage  # Firebase cloud storage
}
```

Key data models from `aw-core`:
- **Event**: `{id, timestamp, duration, data}` - Core activity tracking unit
- **Bucket**: Named containers for events by type (`"afk.status"`, `"window.title"`)
- **Datastore**: Abstract interface for storage backends

### Firebase Cloud Functions Architecture
```typescript
// functions/src/index.ts structure
api/               // REST endpoints mimicking aw-server API
├── activity-api.ts     // Event CRUD operations
├── ai-insight-api.ts   // AI analysis endpoints
├── automation-rule-api.ts // User automation rules
└── goal-management-api.ts  // Goal tracking

services/          // Business logic
├── ai/            // Edge and cloud AI services
├── utils/         // Math, date utilities
└── community-rules-service.ts // Shared automation patterns
```

### Data Flow Patterns
1. **Local-First**: Watchers → aw-server → local buckets/events
2. **Cloud Sync**: Periodic sync to Firestore with user consent
3. **AI Processing**: Firebase Functions analyze patterns → generate insights
4. **Agent Automation**: PraisonAI agents execute based on insights

## Development Standards

### Step-by-Step Development Approach
When implementing features, follow this systematic approach:
1. **Architecture Planning**: Lay out core classes, functions, methods with purpose comments
2. **Entrypoint Analysis**: Start with main entry file, then follow import dependencies
3. **Fully Functional Code**: No placeholders - implement complete, working code
4. **Compatibility Check**: Ensure all files work together with proper imports/types
5. **Dependency Management**: Include all package manager files (package.json, pyproject.toml)
6. **Architecture Verification**: Double-check all architectural components are present

### Language Conventions (Critical)
- **Code/Files**: English only (functions, variables, classes, filenames)
- **Development Communication**: Turkish (comments, log messages, explanations to developer)
- **User Interface**: Multi-language support with i18n (internationalization)
- **Commits**: English commit messages
- **Collections**: Firestore uses `/users/{userId}/buckets/{bucketId}/events/{eventId}`
- **Command Preference**: Use `;` instead of `&&` for command chaining

### Internationalization (i18n) Guidelines
- Use i18n keys for all user-facing text: `t('dashboard.welcome')`
- Store translations in language files: `locales/en.json`, `locales/tr.json`, `locales/de.json`
- Never hardcode user-facing strings in components
- Support RTL languages where applicable
- Use ICU message format for complex pluralization

### Development Cycle Management
- **2-Prompt Cycle**: Update `version.md` and git repo every 2 development prompts
- **Time Tracking**: Use `Get-Date -Format 'yyyy-MM-dd HH:mm:ss'` for version timestamps
- **Version History**: Never delete previous versions, always append new entries
- **Change Documentation**: Summarize features added, bugs fixed, important changes

### Firebase Integration Patterns
```typescript
// Authentication middleware pattern
export const requireAuth = (handler: Function) => {
  return async (data: any, context: CallableContext) => {
    const user = await authenticateUser(context);
    return handler(data, context, user);
  };
};

// Data model conversion (ActivityWatch ↔ Firebase)
function convertAWEventToFirebase(event: AWEvent, bucketId: string) {
  return {
    ...event,
    bucket_id: bucketId,
    date_key: format(event.timestamp, 'yyyy-MM-dd'),
    hour_key: format(event.timestamp, 'yyyy-MM-dd-HH')
  };
}
```

### AI Service Integration
Edge AI (TensorFlow.js) for privacy-sensitive classification:
```typescript
// Local activity classification
await EdgeAIService.classifyActivity(windowTitle, appName, duration);
```

Cloud AI (Gemini/OpenAI) for advanced insights:
```typescript
// GenKit flow for AI insights
export const generateInsightFlow = ai.defineFlow({
  name: 'generateInsight',
  inputSchema: ActivityDataSchema,
  outputSchema: InsightSchema
}, async (activityData) => {
  // Process with Gemini
});
```

## Key Development Workflows



### Build & Deploy
```bash
# Firebase deployment
npm run build && firebase deploy --only functions
firebase deploy --only hosting   # Deploy web UI

```

### Debug Patterns
- Use `firebase emulators:start` for local Firebase development
- Check `.cursor/rules/` files for project-specific constraints
- Monitor Firestore rules in `firestore.rules` for security policies
- Test AI models with edge cases in `functions/src/services/ai/`

## Integration Points

### PraisonAI Agent Integration
```python
# Example agent for productivity automation
from praisonaiagents import Agent

productivity_agent = Agent(
    instructions="Monitor focus patterns and suggest optimizations",
    tools=[activitywatch_tools, calendar_tools, notification_tools]
)
```

### Data Privacy Architecture
- **Sensitive Data**: Processed locally (window titles, app names)
- **Aggregated Data**: Synced to cloud (daily summaries, categories)
- **AI Models**: Hybrid approach - edge for classification, cloud for insights

### Cross-Platform Considerations
- **Desktop**: Tauri app wraps aw-qt + Vue.js frontend
- **Web**: Firebase Hosting serves Vue.js SPA
- **Mobile**: Future React Native app consuming Firebase APIs

## Common Gotchas

1. **Firebase Rules**: Always check `firestore.rules` before modifying data structures
2. **ActivityWatch Compatibility**: Maintain compatibility with original AW bucket/event schemas
3. **AI Model Loading**: TensorFlow.js models require CORS headers for local development
4. **Time Zones**: Use `date-fns-tz` for consistent timezone handling across components
5. **Memory Management**: aw-server can accumulate large datasets - implement retention policies
6. **Authentication**: Firebase Auth tokens expire - implement refresh logic in long-running processes
7. **No Placeholders**: Never use TODO comments or throw 'Not implemented' - write functional code
8. **Language Mixing**: Code must be English, use i18n for user interface, Turkish for developer communication
9. **Import Compatibility**: Ensure all files have proper imports and type definitions
10. **Version Tracking**: Update `version.md` every 2 prompts with timestamp and changes

##Development Cycle Management
- **2-Prompt Cycle**: Update `version.md` and git repo every 2 development prompts
- **Time Tracking**: Use `Get-Date -Format 'yyyy-MM-dd HH:mm:ss'` for version timestamps
- **Version History**: Never delete previous versions, always append new entries
- **Change Documentation**: Summarize features added, bugs fixed, important changes

## File Organization Priorities

When adding features:
1. Follow `.cursor/rules/` guidelines for each domain (Firebase, AI, etc.)
2. Update `version.md` every 2 development cycles
3. Maintain ADRs in `/docs/adr/` for architectural decisions
4. Add integration tests in `functions/src/tests/` for cloud functions
5. Document AI model changes in `.cursor/rules/ai-feature-documentation.md`

## Implementation Guidelines

### Code Quality Standards
```typescript
// ✅ Good: Fully functional implementation
export class ActivityProcessor {
  private firestore: Firestore;
  private aiService: EdgeAIService;
  
  constructor(firestore: Firestore, aiService: EdgeAIService) {
    this.firestore = firestore;
    this.aiService = aiService;
  }
  
  async processActivity(event: AWEvent): Promise<ProcessedActivity> {
    // Tam implementasyon - placeholder yok
    const classification = await this.aiService.classifyActivity(event);
    const stored = await this.firestore.collection('activities').add(event);
    return { classification, stored };
  }
}

// ❌ Bad: Placeholder implementation
export class ActivityProcessor {
  async processActivity(event: AWEvent): Promise<ProcessedActivity> {
    // TODO: Implement this
    throw new Error('Not implemented');
  }
}
```

### File Naming Best Practices
```
services/
├── ai-service.ts              # Kebab-case for services
├── activity-processor.ts      # Descriptive, action-oriented
├── firebase-adapter.ts        # Integration adapters
└── utils/
    ├── date-utils.ts          # Utility functions
    └── validation-utils.ts    # Input validation
    
models/
├── activity-event.ts          # Domain models
├── user-profile.ts           # Data structures
└── ai-insight.ts             # AI-specific models
```

### Dependency Management Patterns
```json
// package.json - Always include all dependencies
{
  "dependencies": {
    "firebase": "^10.5.0",
    "@tensorflow/tfjs": "^4.22.0",
    "date-fns": "^2.30.0"
  },
  "devDependencies": {
    "typescript": "^5.2.2",
    "@types/node": "^20.0.0"
  }
}
```

```toml
# pyproject.toml - Python dependencies
[tool.poetry.dependencies]
python = "^3.9"
firebase-admin = "^6.0.0"
praisonaiagents = "^0.1.0"
tensorflow = "^2.13.0"
```

### TODO List Creation Template
When starting implementation:
1. **Analiz Aşaması**: Mevcut kod yapısını incele, entegrasyon noktalarını belirle
2. **Mimari Tasarım**: Core sınıfları ve metotları planla, bağımlılıkları haritalandır
3. **Entry Point**: Ana giriş dosyasından başla (index.ts, main.py, vs.)
4. **Modül Hiyerarşisi**: Import zincirini takip et, alt modülleri sırayla implement et
5. **Veri Akışı**: ActivityWatch → Firebase → AI servisleri veri akışını doğrula
6. **Test Entegrasyonu**: Her modül için temel test senaryolarını yazın
7. **Hata Yönetimi**: Comprehensive error handling ve logging ekle
8. **Performans Optimizasyonu**: Memory leaks ve bottleneck'leri kontrol et
9. **Güvenlik Kontrolü**: Authentication ve authorization katmanlarını doğrula
10. **Dokümantasyon**: Türkçe kullanıcı mesajları ve İngilizce kod comments

## Quick Reference

**Development Commands:**
```bash
Get-Date -Format 'yyyy-MM-dd HH:mm:ss'  # Version timestamp
firebase emulators:start                 # Firebase services
npm run start                           # aw-server
npm run start:watcher-afk               # Activity watchers
```

**Implementation Checklist:**
- [ ] Plan core classes/functions with purpose comments
- [ ] Start from entrypoint file, follow import chain
- [ ] Write fully functional code (no placeholders)
- [ ] Add all imports and type definitions
- [ ] Include package manager dependencies
- [ ] Verify architectural completeness
- [ ] Use English for code, Turkish for developer communication, i18n for user interface
- [ ] Update version.md every 2 prompts

**Key Config Files:**
- `firebase.json` - Firebase project configuration
- `firestore.rules` - Database security rules
- `aw-server/aw_server/config.py` - ActivityWatch configuration
- `functions/src/index.ts` - Cloud Functions entry point
- `version.md` - Development cycle tracking

**Debug Endpoints:**
- http://localhost:5000 - Firebase Hosting (Web UI)
- http://localhost:5001 - Cloud Functions
- http://localhost:8080 - Firestore Emulator
- http://localhost:5600 - ActivityWatch Web UI

Focus on understanding the data flow between ActivityWatch's local event collection and Firebase's cloud processing when implementing new features. Always implement complete, working solutions rather than placeholder code.
