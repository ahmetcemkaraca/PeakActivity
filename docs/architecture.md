# PeakActivity Architecture

## Overview

PeakActivity is a hybrid application combining local ActivityWatch components with cloud-based AI services. The architecture follows a client-server model with real-time synchronization.

## High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   External      │
│   (Vue.js)      │    │   (Node.js)     │    │   Services      │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │ Dashboard    │◄──► │ │ API Routes  │◄──► │ │ │ Google AI   │ │
│ │ Analytics   │ │    │ │ Services    │ │    │ │ │ Firebase    │ │
│ │ Settings    │ │    │ │ Triggers    │ │    │ │ │ Auth        │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │ Local Storage         │ Firestore             │
         │ Service Workers       │ Real-time DB          │
         └───────────────────────┘                       │
              │                                          │
              │ ActivityWatch                            │
              │ Watchers (Window, AFK, Input)             │
              └──────────────────────────────────────────┘

Key:
◄──► = Real-time sync
│    = Data flow
```

## Component Breakdown

### 1. Client-Side (Vue.js + TypeScript)
- **UI Components**: Dashboard, charts, settings
- **State Management**: Pinia stores for activities, insights
- **Offline Support**: Service Workers for caching
- **Local Processing**: Edge AI with TensorFlow.js
- **Data Layer**: IndexedDB for local storage

### 2. Server-Side (Node.js + TypeScript)
- **Firebase Functions**: Serverless API endpoints
- **Services Layer**: AI services, data processing, encryption
- **Triggers**: Firestore event-driven logic
- **Security**: Authentication, authorization, encryption
- **Integration**: ActivityWatch data sync

### 3. Data Layer (Firebase)
- **Firestore**: Real-time database for events, users, insights
- **Storage**: File uploads (exports, models)
- **Auth**: User authentication and verification

### 4. External Services
- **Google AI (Gemini)**: Cloud AI for advanced analysis
- **ActivityWatch**: Local watchers for data collection

## Data Flow

1. **Data Collection**: ActivityWatch watchers collect local data
2. **Local Processing**: Edge AI classifies activities
3. **Sync**: Data synced to Firestore via API
4. **Cloud Processing**: Advanced AI analysis with Gemini
5. **Insights**: Results returned to client for display

## Security Architecture

- **Client-Side Encryption**: Sensitive data encrypted before sync
- **Auth**: Firebase Auth with JWT tokens
- **Authorization**: Role-based access control
- **Data Privacy**: GDPR compliance, data minimization
- **Audit Logging**: All actions logged for compliance

## Deployment Architecture

- **Development**: Local Firebase emulators + dev servers
- **Staging**: Separate Firebase project for testing
- **Production**: Firebase Hosting + Functions

## Scalability Considerations

- Serverless functions scale automatically
- Firestore handles high read/write throughput
- Edge AI reduces cloud costs
- Caching layer for frequent queries

For detailed diagrams, see [architecture.svg](architecture.svg).
