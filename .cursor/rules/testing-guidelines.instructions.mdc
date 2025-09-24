---
applyTo: "**/*.test.ts,**/*.spec.ts,tests/**/*"
description: "Testing strategies and quality assurance guidelines"
---

# Test ve Kalite Güvence Kılavuzu

Bu dosya, PeakActivity projesi için test stratejileri ve kalite güvence standartlarını tanımlar.

## Test Pyramid Strategy

### Unit Tests (Birim Testler)
```typescript
// tests/unit/services/ai-service.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EdgeAIService } from '@/services/ai/edge-ai-service';
import * as tf from '@tensorflow/tfjs';

describe('EdgeAIService', () => {
  let aiService: EdgeAIService;
  
  beforeEach(() => {
    aiService = new EdgeAIService();
    // Mock TensorFlow.js
    vi.spyOn(tf, 'loadLayersModel').mockResolvedValue({
      predict: vi.fn().mockReturnValue(tf.tensor([[0.8, 0.1, 0.1]]))
    } as any);
  });

  it('aktivite sınıflandırması doğru kategori döndürmeli', async () => {
    const result = await aiService.classifyActivity(
      'Stack Overflow - How to test TypeScript',
      'chrome.exe',
      1800
    );

    expect(result.category).toBe('development');
    expect(result.confidence).toBeGreaterThan(0.7);
  });

  it('düşük confidence durumunda fallback kullanmalı', async () => {
    vi.spyOn(tf, 'loadLayersModel').mockResolvedValue({
      predict: vi.fn().mockReturnValue(tf.tensor([[0.4, 0.3, 0.3]]))
    } as any);

    const result = await aiService.classifyActivity(
      'Unknown Application',
      'unknown.exe',
      300
    );

    expect(result.category).toBe('other');
    expect(result.usedFallback).toBe(true);
  });
});
```

### Integration Tests (Entegrasyon Testleri)
```typescript
// tests/integration/firebase-functions.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as firebase from '@firebase/testing';
import { generateInsightFlow } from '@/functions/src/ai/insight-generation';

describe('Firebase Functions Integration', () => {
  let testEnv: firebase.RulesTestEnvironment;
  
  beforeAll(async () => {
    testEnv = await firebase.initializeTestEnvironment({
      projectId: 'test-project',
      firestore: {
        rules: await fs.readFile('firestore.rules', 'utf8')
      }
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  it('insight generation flow çalışmalı', async () => {
    const testData = {
      activityData: [
        {
          timestamp: '2024-01-01T10:00:00Z',
          duration: 3600,
          category: 'development'
        }
      ]
    };

    const result = await generateInsightFlow(testData);

    expect(result.insights).toBeDefined();
    expect(result.insights.length).toBeGreaterThan(0);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it('Firestore güvenlik kuralları doğru çalışmalı', async () => {
    const authenticatedContext = testEnv.authenticatedContext('user123');
    const unauthenticatedContext = testEnv.unauthenticatedContext();

    // Authenticated user kendi verilerine erişebilmeli
    const userDoc = authenticatedContext.firestore()
      .collection('users').doc('user123');
    
    await expect(userDoc.get()).resolves.not.toThrow();

    // Unauthenticated user erişememeli
    const unauthorizedDoc = unauthenticatedContext.firestore()
      .collection('users').doc('user123');
    
    await expect(unauthorizedDoc.get()).rejects.toThrow();
  });
});
```

### E2E Tests (Uçtan Uca Testler)
```typescript
// tests/e2e/user-workflow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Kullanıcı İş Akışı', () => {
  test.beforeEach(async ({ page }) => {
    // Test kullanıcısı ile giriş yap
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'testpass123');
    await page.click('[data-testid="login-button"]');
    
    // Dashboard'a yönlendirilmeyi bekle
    await expect(page).toHaveURL('/dashboard');
  });

  test('aktivite verilerini görüntüleyebilmeli', async ({ page }) => {
    // Activity chart yüklenmesini bekle
    await expect(page.locator('[data-testid="activity-chart"]')).toBeVisible();
    
    // Veri filtrelerini test et
    await page.selectOption('[data-testid="time-range"]', '7d');
    await expect(page.locator('[data-testid="chart-title"]'))
      .toContainText('Son 7 Gün');
    
    // Kategori filtresini test et
    await page.check('[data-testid="category-development"]');
    await expect(page.locator('[data-testid="filtered-events"]'))
      .toBeVisible();
  });

  test('AI önerilerini alabilmeli', async ({ page }) => {
    // AI insights bölümüne git
    await page.click('[data-testid="insights-tab"]');
    
    // Insight oluşturma butonuna tıkla
    await page.click('[data-testid="generate-insights"]');
    
    // Loading state'i kontrol et
    await expect(page.locator('[data-testid="insights-loading"]'))
      .toBeVisible();
    
    // Sonuçların yüklenmesini bekle
    await expect(page.locator('[data-testid="insights-results"]'))
      .toBeVisible({ timeout: 10000 });
    
    // En az bir öneri olmalı
    const recommendations = page.locator('[data-testid="recommendation-item"]');
    await expect(recommendations).toHaveCountGreaterThan(0);
  });

  test('ayarları değiştirebilmeli', async ({ page }) => {
    await page.click('[data-testid="settings-link"]');
    
    // Dil değiştirme
    await page.selectOption('[data-testid="language-select"]', 'en');
    await page.click('[data-testid="save-settings"]');
    
    // Sayfanın İngilizce olarak yüklenmesini bekle
    await expect(page.locator('[data-testid="page-title"]'))
      .toContainText('Settings');
    
    // Gizlilik ayarları
    await page.check('[data-testid="privacy-mode"]');
    await page.click('[data-testid="save-settings"]');
    
    // Başarı mesajını kontrol et
    await expect(page.locator('[data-testid="success-message"]'))
      .toBeVisible();
  });
});
```

## Test Data Management

### Test Fixtures
```typescript
// tests/fixtures/activity-data.ts
export const mockActivityEvents = [
  {
    id: 'event-1',
    timestamp: '2024-01-01T09:00:00Z',
    duration: 3600,
    data: {
      app: 'code.exe',
      title: 'TypeScript - PeakActivity',
      url: null
    }
  },
  {
    id: 'event-2', 
    timestamp: '2024-01-01T10:00:00Z',
    duration: 1800,
    data: {
      app: 'chrome.exe',
      title: 'Stack Overflow - TypeScript Testing',
      url: 'https://stackoverflow.com/questions/typescript-testing'
    }
  }
];

export const mockUserProfile = {
  id: 'user-123',
  email: 'test@example.com',
  settings: {
    timezone: 'Europe/Istanbul',
    language: 'tr',
    privacy_mode: false
  },
  subscription: 'premium'
};

export const mockBucket = {
  id: 'aw-watcher-window_test-pc',
  type: 'currentwindow',
  client: 'aw-watcher-window',
  hostname: 'test-pc',
  created: '2024-01-01T00:00:00Z'
};
```

### Factory Pattern for Test Data
```typescript
// tests/factories/activity-factory.ts
import { faker } from '@faker-js/faker';
import type { ActivityEvent, Bucket } from '@/types/activity';

export class ActivityFactory {
  static createEvent(overrides: Partial<ActivityEvent> = {}): ActivityEvent {
    return {
      id: faker.string.uuid(),
      timestamp: faker.date.recent().toISOString(),
      duration: faker.number.int({ min: 60, max: 7200 }),
      data: {
        app: faker.helpers.arrayElement(['code.exe', 'chrome.exe', 'slack.exe']),
        title: faker.lorem.sentence(),
        url: faker.internet.url()
      },
      ...overrides
    };
  }

  static createBucket(overrides: Partial<Bucket> = {}): Bucket {
    return {
      id: `${faker.lorem.word()}_${faker.internet.domainName()}`,
      type: faker.helpers.arrayElement(['currentwindow', 'afkstatus']),
      client: faker.lorem.word(),
      hostname: faker.internet.domainName(),
      created: faker.date.past().toISOString(),
      ...overrides
    };
  }

  static createActivityData(count: number = 10): ActivityEvent[] {
    return Array.from({ length: count }, () => this.createEvent());
  }
}
```

## Performance Testing

### Load Testing with Artillery
```yaml
# tests/performance/load-test.yml
config:
  target: 'http://localhost:5001'
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 120
      arrivalRate: 50
      name: "Ramp up load"
    - duration: 300
      arrivalRate: 100
      name: "Sustained load"
  processor: "./test-functions.js"

scenarios:
  - name: "Activity API Load Test"
    weight: 70
    flow:
      - post:
          url: "/api/v1/events"
          headers:
            Authorization: "Bearer {{ $randomString() }}"
          json:
            timestamp: "{{ $randomISO() }}"
            duration: "{{ $randomInt(60, 3600) }}"
            data:
              app: "test.exe"
              title: "Load Test Activity"
      - think: 1

  - name: "AI Insights Load Test"
    weight: 30
    flow:
      - post:
          url: "/api/v1/insights/generate"
          headers:
            Authorization: "Bearer {{ $randomString() }}"
          json:
            timeRange: "24h"
            categories: ["development", "communication"]
      - think: 5
```

### Memory Leak Detection
```typescript
// tests/performance/memory-leak.test.ts
import { describe, it, expect } from 'vitest';
import { EdgeAIService } from '@/services/ai/edge-ai-service';

describe('Memory Leak Detection', () => {
  it('AI service bellek sızıntısı yapmamalı', async () => {
    const aiService = new EdgeAIService();
    const initialMemory = process.memoryUsage().heapUsed;
    
    // 1000 kez sınıflandırma yap
    for (let i = 0; i < 1000; i++) {
      await aiService.classifyActivity(
        `Test Activity ${i}`,
        'test.exe',
        Math.random() * 3600
      );
    }
    
    // Garbage collection'ı zorla
    if (global.gc) {
      global.gc();
    }
    
    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = finalMemory - initialMemory;
    
    // Bellek artışı 10MB'dan az olmalı
    expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
  });
});
```

## Test Automation ve CI/CD

### GitHub Actions Workflow
```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:unit
      
      - name: Upload coverage reports
        uses: codecov/codecov-action@v3

  integration-tests:
    runs-on: ubuntu-latest
    services:
      firebase-emulator:
        image: firebase/emulators
        ports:
          - 8080:8080
          - 5001:5001
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Start Firebase Emulators
        run: |
          npm install -g firebase-tools
          firebase emulators:start --only firestore,functions &
          sleep 10
      
      - name: Run integration tests
        run: npm run test:integration
        env:
          FIRESTORE_EMULATOR_HOST: localhost:8080
          FUNCTIONS_EMULATOR_HOST: localhost:5001

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install Playwright
        run: npx playwright install
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

## Quality Gates ve Metrics

### Coverage Requirements
```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 70,
        statements: 80
      },
      exclude: [
        'tests/**',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/types/**'
      ]
    }
  }
});
```

### Code Quality Checks
```json
// .eslintrc.json
{
  "extends": [
    "@typescript-eslint/recommended",
    "plugin:vue/vue3-recommended"
  ],
  "rules": {
    "complexity": ["error", 10],
    "max-lines": ["error", 300],
    "max-params": ["error", 4],
    "no-console": "error",
    "@typescript-eslint/no-unused-vars": "error"
  }
}
```

### SonarQube Integration
```yaml
# sonar-project.properties
sonar.projectKey=peakactivity
sonar.organization=peakactivity-org
sonar.sources=src
sonar.tests=tests
sonar.exclusions=**/*.test.ts,**/*.spec.ts
sonar.typescript.lcov.reportPaths=coverage/lcov.info
sonar.coverage.exclusions=tests/**,**/*.test.ts,**/*.spec.ts
```
