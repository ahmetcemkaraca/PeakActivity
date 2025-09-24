# 20 Detaylı Prompt - Proje Tamamlama İçin (Geliştirilmiş Versiyon)

Bu dosya, adimlar.md'deki 100 adımı tamamlamak için 20 detaylı prompt tanımlar.
Her prompt, 5 adımı kapsar. Her prompt'a [ ] checkbox eklendi. Prompt'lar daha
detaylı hale getirildi (sub-steps dahil).

1. [ ] "Proje kök dizinini incele ve organize et: src (kaynak kod), tests
       (testler), docs (belgeler) klasörleri oluştur. .gitignore güncelle
       (node_modules, .env, \*.log ekle). Package.json ve pyproject.toml'de
       dependencies'i standartlaştır (exact versions kullan, e.g.,
       firebase-admin = 12.0.0). Tüm TODO/FIXME comment'lerini listele (grep
       ile) ve önceliklendir (kritik, orta, düşük). Commit et (git commit -m
       'Initial project organization')."

2. [ ] "Code linting kurallarını uygula (ESLint for JS/TS: install eslint
       --save-dev, .eslintrc.json oluştur; Ruff for Python: pip install ruff,
       ruff.toml oluştur). Tüm dosyaları formatla (Prettier for JS/TS: prettier
       --write .; Black for Python: black .). Unused imports ve variables'ı
       temizle (ESLint --fix; Python için deadcode tool'u çalıştır). Dead code
       detection tool'u çalıştır (deadcode for Python, ESLint for JS). Version
       control: Değişiklikleri commit et (git add . && git commit -m 'Code
       cleanup and linting'), 'cleanup' branch oluştur (git checkout -b
       cleanup)."

3. [ ] "Environment variables'ı .env.example ile tanımla (Firebase keys, API
       keys, DB_URL ekle). Config dosyalarını centralize et (config.ts for
       frontend: export const config = { apiKey: process.env.API_KEY };
       config.py for backend: from pydantic import BaseSettings). Logging'i
       standardize et (winston for Node: install winston, logger.ts oluştur;
       structlog for Python: pip install structlog, logger.py oluştur). Error
       handling'i tüm modüllere uygula (try-catch for JS, try-except for
       Python). TypeScript/Python type checking'i zorunlu kıl (tsconfig.json
       strict: true; mypy.ini ile mypy --strict)."

4. [ ] "License headers ekle tüm dosyalara (MPL-2.0: // Copyright 2025
       PeakActivity, Licensed under MPL-2.0). README.md'yi güncelle: Kurulum
       adımları (git clone, npm install, pip install -r requirements.txt),
       kullanım örnekleri (npm start), katkı rehberi (PR process). Contribution
       guidelines oluştur (CONTRIBUTING.md: branching strategy, code style).
       Security policy ekle (SECURITY.md: report vulnerabilities to
       security@peakactivity.com). Initial cleanup commit'i yap (git commit -m
       'Add licenses and docs' ve main'e merge: git checkout main && git merge
       cleanup)."

5. [ ] "Firebase Admin SDK entegrasyonunu tamamla (auth: install firebase-admin,
       initializeApp with cert; firestore: getFirestore setup). User
       authentication flow'u implement et (sign up: createUser with
       email/password; login: signInWithEmailAndLink, JWT token handling with
       verifyIdToken). Test et (unit tests for auth functions: vitest for JS,
       pytest for Python). User profile management ekle (preferences, settings
       endpoints: Firestore doc set/update). Bucket ve event CRUD operations'ı
       test et (integration tests: mock firestore, assert
       create/read/update/delete)."

6. [ ] "Real-time sync'i kur (Firestore onSnapshot listeners for
       events/buckets). Data migration script'i yaz (local SQLite to Firestore:
       read from SQLite, batch write to Firestore, handle errors). Multi-tenant
       support ekle (user isolation in queries: where('user_id', '==', uid)).
       Data validation schemas tanımla (Zod for TS: z.object({ name: z.string()
       }); Pydantic for Python: class User(BaseModel): name: str). API rate
       limiting implement et (express-rate-limit: app.use(rateLimit({ windowMs:
       15 _ 60 _ 1000, max: 100 }))."

7. [ ] "CORS settings'i configure et (cors middleware: app.use(cors({ origin:
       'https://app.peakactivity.com' }))). Database indexes ekle (Firestore
       composite indexes: for user_id + timestamp). Backup and recovery planı
       oluştur (cron job for backups: functions.pubsub.schedule('0 2 \* \*
       \*').onRun(backupAll)). Data retention policy uygula (cron job for
       deletion: delete docs older than 365 days). Audit logging ekle (user
       actions log to Firestore: logAction(uid, action, timestamp))."

8. [ ] "Input sanitization tüm API'lerde uygula (validator.js for JS:
       req.body.validate(); bleach for Python: clean(text)). SQL injection
       protection (parametrized queries: no raw SQL, use Firestore SDK). XSS
       protection (output encoding: helmet for Express: app.use(helmet());
       escape for Python). CSRF protection for web UI (csrf tokens: csurf
       middleware). Phase 1-2 test suite çalıştır (npm test; pytest; check
       coverage >80%)."

9. [ ] "TensorFlow.js model yükle (local classification for categories:
       tf.loadLayersModel('/models/classifier.json')). Gemini API entegrasyonu
       tamamla (cloud insights for recommendations: install @genkit-ai/googleai,
       defineFlow with inputSchema). Anomaly detection modülü implement et
       (Z-score algorithm in utils/math-utils: detectAnomalies function). Auto
       categorization service ekle (TF-IDF based: install tfjs-node,
       classifyEvents method). Focus quality score calculator geliştir
       (session-based scoring: calculateFocusScore function)."

10. [ ] "Behavioral trends analysis ekle (linear regression for patterns:
        implement linearRegression in utils/math-utils). Recommendation engine
        kur (rule-based + AI hybrid: if confidence < 0.8, fallback to cloud).
        Edge AI fallback to cloud logic implement et (if local confidence < 0.8,
        call Gemini API). AI model versioning ekle (model metadata in Firestore:
        doc with version, upload date). Privacy controls for AI data
        (anonymization pipeline: anonymizeEvent function before cloud send)."

11. [ ] "AI response caching ekle (Redis or Firestore TTL: cache.set(key,
        result, 3600)). Model performance monitoring (metrics logging: log
        accuracy, latency to Firestore). A/B testing for AI features (Firebase
        A/B testing: install firebase-ab-testing, setup experiments). Bias
        detection in AI outputs (fairness checks: implement biasCheck function
        for categories). AI ethics guidelines uygula (consent flows:
        showConsentDialog before AI use; data minimization: only send anonymized
        data)."

12. [ ] "API for AI services oluştur (endpoints with auth: /api/ai/classify,
        /api/ai/insights; use onCall with auth). Integration tests for AI flows
        yaz (vitest: test classifyActivity, mock tfjs). AI data anonymization
        pipeline kur (before cloud send: anonymize and log). Cost monitoring for
        cloud AI calls (budget alerts: use Firebase Budget Alerts). Phase 3 test
        suite çalıştır (npm run test:ai; check AI endpoints)."

13. [ ] "Unit test coverage %80'e çıkar (vitest --coverage: add tests for
        services/utils). Integration tests for Firebase + AW yaz (mock services:
        vi.mock('firebase-admin')). E2E tests with Playwright (user flows:
        login, dashboard, insights: test.describe('User Flow', () => {
        test('login and view insights', async ({ page }) => { ... }); })). Load
        testing with Artillery (API endpoints: 100 RPS: artillery run
        load-test.yml). Security scanning (SAST with ESLint: npm run lint; DAST
        with OWASP ZAP: zap-baseline.py)."

14. [ ] "Performance benchmarks tanımla (response time < 200ms: implement
        benchmark.js). Cross-browser testing for web UI (Chrome, Firefox,
        Safari: playwright test --project=chrome). Mobile responsiveness test
        (Playwright mobile emulation: test.use({ viewport: { width: 375, height:
        667 } })). Accessibility audit (WCAG with axe-core: install axe-core,
        run axe.run()). Error recovery tests (offline/online switch: test
        offline mode with service workers)."

15. [ ] "Offline mode tests implement et (service workers: register SW, cache
        API responses). Multi-device sync tests (concurrent updates: test two
        browsers updating same data). Data integrity tests (checksums: implement
        md5 hash for events, validate on sync). Regression test suite kur
        (snapshot testing: vitest --update=false). Mock services for external
        APIs (msw for JS: setup msw for Firebase mocks)."

16. [ ] "Test data factories genişlet (faker.js for JS: add more mock events;
        factory-boy for Python: create factories for User, Event). CI/CD
        pipeline'a testleri entegre et (GitHub Actions matrix: strategy: matrix:
        os: [ubuntu, windows], node: [18, 20]). Test reporting dashboard kur
        (Allure: allure serve after tests). Flaky test detection (retry failed
        tests: vitest --retry=3). Phase 4 test suite çalıştır (npm run test:all;
        coverage >90%)."

17. [ ] "API docs (Swagger/OpenAPI) oluştur (swagger-jsdoc: install
        swagger-ui-express, annotate endpoints). User manual yaz
        (Türkçe/English, Markdown: sections for install, usage,
        troubleshooting). Developer guide güncelle (architecture: add diagrams;
        setup: step-by-step). Architecture diagram ekle (draw.io: export SVG for
        docs/architecture.md). Deployment guide yaz (Firebase: firebase deploy;
        Docker: Dockerfile with multi-stage build; Heroku: heroku.yml)."

18. [ ] "Monitoring setup (Sentry for errors: install @sentry/node, init in
        main.ts; Cloud Logging for logs: use logger in functions). CI/CD full
        pipeline deploy et (GitHub Actions with environments: staging/prod
        approval). Staging environment kur (Firebase project copy: firebase
        projects:create staging). Production deployment script yaz (firebase
        deploy script: bash deploy.sh with env checks). Rollback procedures
        tanımla (versioned deploys: use Firebase release channels)."

19. [ ] "Monitoring alerts configure et (Sentry thresholds: error rate >5%;
        Cloud Monitoring budgets: alert if >80% quota). User onboarding flow
        document (step-by-step guide: welcome screen, consent, first sync). FAQ
        and troubleshooting guide yaz (common issues: auth errors, sync
        failures, AI quota exceeded). Contribution workflow document (branching:
        feature branches; PR process: review checklist). License and legal docs
        güncelle (MPL-2.0 compliance: add LICENSE file, update README)."

20. [ ] "Changelog güncelle (keep a changelog format: add entries for v0.1.0).
        Release candidate build yap (npm run build:prod: minify, tree-shake).
        Beta testing plan oluştur (testers: recruit 10 users; feedback loop:
        Google Forms + Slack channel). Final review and audit (code review: PR
        with 2 approvals; security scan: npm audit && safety check). Project
        complete: Release v1.0.0 (tag: git tag v1.0.0; publish: npm publish;
        announce on social)."
