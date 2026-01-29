# PeakActivity Geliştirici Kılavuzu

Bu kılavuz, PeakActivity projesinin mimarisi, kurulum, geliştirme ve katkıda bulunma süreçlerini kapsar.

## Mimari Genel Bakış

PeakActivity, ActivityWatch'in üzerine inşa edilmiş bir AI destekli verimlilik takip uygulamasıdır. Ana bileşenler:

### Frontend (Vue.js + TypeScript)
- **Dashboard**: Ana aktivite görselleştirmesi
- **Analytics**: AI içgörüleri ve raporlar
- **Settings**: Kullanıcı ayarları ve gizlilik
- **Authentication**: Firebase Auth entegrasyonu

### Backend (Node.js + TypeScript)
- **Firebase Functions**: Serverless API endpoints
- **Services**: AI servisleri, veri işleme, otomasyon
- **Triggers**: Firestore event-driven logic
- **Security**: Authentication, authorization, encryption

### Core Components
- **ActivityWatch Integration**: Local watchers (window, AFK, input)
- **AI Services**: Edge AI (TensorFlow.js), Cloud AI (Gemini)
- **Data Layer**: Firestore for real-time sync
- **Security Layer**: Client-side encryption, GDPR compliance

### Architecture Diagram
[Placeholder for architecture.svg - Create using draw.io and export as SVG]

## Kurulum

### Geliştirme Ortamı Kurulumu

1. **Prerequisites**
   - Node.js 18+
   - Python 3.9+
   - Git
   - Firebase CLI
   - Docker (opsiyonel)

2. **Repository Clone**
   ```
   git clone https://github.com/ackaraca/PeakActivity.git
   cd PeakActivity
   ```

3. **Dependencies**
   ```
   # Root level
   npm install

   # Functions
   cd functions
   npm install

   # AW Server
   cd ../aw-server
   poetry install

   # Web UI
   cd ../aw-server/aw-webui
   npm install
   ```

4. **Firebase Setup**
   - Firebase Console'da proje oluşturun
   - Service account key indirin: `functions/serviceAccountKey.json`
   - Environment variables güncelleyin: `.env`

5. **Local Development**
   ```
   # Functions serve
   cd functions
   npm run serve

   # Web UI dev server
   cd ../aw-server/aw-webui
   npm run dev

   # AW Server (Python)
   cd ../aw-server
   poetry run python -m aw_server
   ```

## Geliştirme

### Code Structure
- **src/services**: Business logic
- **src/api**: API routes and endpoints
- **src/utils**: Helper functions
- **tests**: Unit, integration, E2E tests

### Coding Standards
- TypeScript strict mode
- ESLint + Prettier for JS/TS
- Ruff + Black for Python
- Commit messages: English, conventional commits
- Branch naming: feature/branch-name

### Testing
- Unit tests: `npm run test:unit`
- Integration tests: `npm run test:integration`
- E2E tests: `npm run test:e2e`
- Coverage: >80%

### Contribution Workflow
1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-feature`
3. Implement and test
4. Commit with conventional messages
5. Push and create PR
6. Wait for 2 approvals
7. Merge to main

## Deployment

### Firebase Deployment
```
firebase deploy --only functions,hosting
```

### Docker Deployment
```
# Build
docker build -t peakactivity .

# Run
docker run -p 3000:3000 peakactivity
```

### Heroku Deployment
Create `heroku.yml`:
```
build:
  type: npm
  dockerfile: Dockerfile
run:
  type: npm
  cmd: npm start
```

## API Documentation

See [API Docs](swagger.json) for endpoint details.

## Troubleshooting

- **Auth Issues**: Check Firebase Console, verify service account
- **Sync Problems**: Verify Firestore rules, check network
- **AI Errors**: Monitor quota in Google AI Studio
- **Build Failures**: Clear node_modules, reinstall dependencies

For more details, see CHANGELOG.md and CONTRIBUTING.md.
