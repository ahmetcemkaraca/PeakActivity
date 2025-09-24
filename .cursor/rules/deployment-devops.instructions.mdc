---
applyTo: "**/deployment/**,**/docker/**,**/.github/workflows/**,**/firebase.json,**/docker-compose*.yml"
description: "Deployment ve DevOps işlemleri için standartlar"
---

# Deployment ve DevOps Standartları

Bu dosya, PeakActivity projesinin deployment ve DevOps süreçleri için standartları tanımlar.

## Firebase Deployment Strategy

### Environment Management
```json
// firebase.json
{
  "projects": {
    "default": "peakactivity-prod",
    "development": "peakactivity-dev",
    "testing": "peakactivity-test"
  },
  "functions": {
    "source": "functions",
    "runtime": "nodejs18",
    "predeploy": ["npm --prefix \"$RESOURCE_DIR\" run lint", "npm --prefix \"$RESOURCE_DIR\" run build"],
    "postdeploy": ["npm --prefix \"$RESOURCE_DIR\" run deploy:verify"]
  },
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "/api/**",
        "function": "api"
      },
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "/sw.js",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "no-cache"
          }
        ]
      }
    ]
  },
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "storage": {
    "rules": "storage.rules"
  },
  "emulators": {
    "functions": {
      "port": 5001
    },
    "firestore": {
      "port": 8080
    },
    "hosting": {
      "port": 5000
    },
    "storage": {
      "port": 9199
    },
    "ui": {
      "enabled": true,
      "port": 4000
    }
  }
}
```

### Deployment Scripts
```bash
# scripts/deploy.ps1
param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("development", "testing", "production")]
    [string]$Environment,
    
    [switch]$SkipTests,
    [switch]$FunctionsOnly,
    [switch]$HostingOnly
)

$ErrorActionPreference = "Stop"

Write-Host "Deploying to $Environment environment..." -ForegroundColor Green

# Environment setup
firebase use $Environment

# Pre-deployment checks
if (-not $SkipTests) {
    Write-Host "Running tests..." -ForegroundColor Yellow
    npm test
    if ($LASTEXITCODE -ne 0) {
        throw "Tests failed"
    }
}

# Build process
Write-Host "Building application..." -ForegroundColor Yellow
npm run build:$Environment

# Deploy components
if ($FunctionsOnly) {
    firebase deploy --only functions
} elseif ($HostingOnly) {
    firebase deploy --only hosting
} else {
    firebase deploy
}

# Post-deployment verification
Write-Host "Verifying deployment..." -ForegroundColor Yellow
npm run deploy:verify

Write-Host "Deployment completed successfully!" -ForegroundColor Green
```

## Docker Configuration

### Multi-Stage Dockerfile
```dockerfile
# Dockerfile.functions
FROM node:18-alpine AS builder

WORKDIR /app

# Dependencies
COPY package*.json ./
COPY functions/package*.json ./functions/
RUN npm ci

# Build
COPY . .
RUN npm run build

# Production image
FROM node:18-alpine AS production

WORKDIR /app

# Production dependencies only
COPY package*.json ./
COPY functions/package*.json ./functions/
RUN npm ci --only=production && npm cache clean --force

# Copy built application
COPY --from=builder /app/functions/lib ./functions/lib
COPY --from=builder /app/dist ./dist

# Security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S peakactivity -u 1001 && \
    chown -R peakactivity:nodejs /app
USER peakactivity

EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

CMD ["npm", "start"]
```

### Docker Compose for Local Development
```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  # Firebase Emulators
  firebase-emulators:
    image: gcr.io/firebase-tools-docker/node:18
    ports:
      - "4000:4000"   # Emulator UI
      - "5000:5000"   # Hosting
      - "5001:5001"   # Functions
      - "8080:8080"   # Firestore
      - "9199:9199"   # Storage
    volumes:
      - .:/workspace
      - firebase-data:/opt/workspace/.firebase
    working_dir: /workspace
    command: firebase emulators:start --import=./seed-data --export-on-exit
    environment:
      - FIREBASE_TOKEN=${FIREBASE_TOKEN}
    networks:
      - peakactivity-dev

  # ActivityWatch Server
  aw-server:
    build:
      context: ./PeakActivityMain
      dockerfile: Dockerfile.aw-server
    ports:
      - "5600:5600"
    volumes:
      - aw-data:/home/user/.local/share/activitywatch
      - ./aw-server/config:/config
    environment:
      - AW_TESTING=false
      - AW_STORAGE_METHOD=peewee
      - AW_DATABASE_URL=sqlite:///data/aw-server.db
    networks:
      - peakactivity-dev
    depends_on:
      - firebase-emulators

  # PraisonAI Agents
  praisonai-agents:
    build:
      context: ./PeakActivityAgent
      dockerfile: Dockerfile.praisonaiagents
    ports:
      - "8000:8000"
    volumes:
      - ./PeakActivityAgent:/app
      - praisonai-data:/data
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - GEMINI_API_KEY=${GEMINI_API_KEY}
      - AW_SERVER_URL=http://aw-server:5600
      - FIREBASE_EMULATOR_HOST=firebase-emulators:8080
    networks:
      - peakactivity-dev
    depends_on:
      - aw-server
      - firebase-emulators

  # Frontend Development Server
  frontend-dev:
    build:
      context: .
      dockerfile: Dockerfile.frontend-dev
    ports:
      - "3000:3000"
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - VITE_FIREBASE_EMULATOR_HOST=firebase-emulators:5000
      - VITE_AW_SERVER_URL=http://localhost:5600
    networks:
      - peakactivity-dev
    depends_on:
      - firebase-emulators

volumes:
  firebase-data:
  aw-data:
  praisonai-data:

networks:
  peakactivity-dev:
    driver: bridge
```

## CI/CD Pipeline

### GitHub Actions Workflow
```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '18'
  PYTHON_VERSION: '3.9'

jobs:
  # Code Quality
  lint-and-test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: ${{ env.NODE_VERSION }}
        cache: 'npm'
    
    - name: Setup Python
      uses: actions/setup-python@v4
      with:
        python-version: ${{ env.PYTHON_VERSION }}
    
    - name: Install dependencies
      run: |
        npm ci
        pip install poetry
        cd PeakActivityMain && poetry install
        cd PeakActivityAgent && poetry install
    
    - name: Lint code
      run: |
        npm run lint
        npm run lint:functions
        cd PeakActivityMain && poetry run flake8
        cd PeakActivityAgent && poetry run flake8
    
    - name: Run tests
      run: |
        npm test
        npm run test:functions
        cd PeakActivityMain && poetry run pytest
        cd PeakActivityAgent && poetry run pytest
    
    - name: Build application
      run: npm run build
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3

  # Security Scan
  security-scan:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Run security audit
      run: |
        npm audit --audit-level high
        pip install safety
        safety check
    
    - name: Run CodeQL Analysis
      uses: github/codeql-action/analyze@v2

  # Deploy to Development
  deploy-dev:
    if: github.ref == 'refs/heads/develop'
    needs: [lint-and-test, security-scan]
    runs-on: ubuntu-latest
    environment: development
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: ${{ env.NODE_VERSION }}
        cache: 'npm'
    
    - name: Install Firebase CLI
      run: npm install -g firebase-tools
    
    - name: Build for development
      run: npm run build:development
    
    - name: Deploy to Firebase
      run: |
        firebase use development
        firebase deploy --token ${{ secrets.FIREBASE_TOKEN }}
      env:
        FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN }}

  # Deploy to Production
  deploy-prod:
    if: github.ref == 'refs/heads/main'
    needs: [lint-and-test, security-scan]
    runs-on: ubuntu-latest
    environment: production
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: ${{ env.NODE_VERSION }}
        cache: 'npm'
    
    - name: Install Firebase CLI
      run: npm install -g firebase-tools
    
    - name: Build for production
      run: npm run build:production
    
    - name: Deploy to Firebase
      run: |
        firebase use production
        firebase deploy --token ${{ secrets.FIREBASE_TOKEN }}
      env:
        FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN }}
    
    - name: Create release
      uses: actions/create-release@v1
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      with:
        tag_name: v${{ github.run_number }}
        release_name: Release v${{ github.run_number }}
        draft: false
        prerelease: false
```

## Infrastructure as Code

### Terraform Configuration
```hcl
# infrastructure/main.tf
terraform {
  required_version = ">= 1.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 4.0"
    }
  }
  
  backend "gcs" {
    bucket = "peakactivity-terraform-state"
    prefix = "terraform/state"
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# Firebase project
resource "google_firebase_project" "default" {
  provider = google-beta
  project  = var.project_id
}

# Firestore database
resource "google_firestore_database" "database" {
  project     = var.project_id
  name        = "(default)"
  location_id = var.firestore_location
  type        = "FIRESTORE_NATIVE"
  
  depends_on = [google_firebase_project.default]
}

# Firebase hosting
resource "google_firebase_hosting_site" "default" {
  provider = google-beta
  project  = var.project_id
  site_id  = var.hosting_site_id
}

# Cloud Functions
resource "google_cloudfunctions2_function" "api" {
  name        = "api"
  location    = var.region
  description = "PeakActivity API functions"
  
  build_config {
    runtime     = "nodejs18"
    entry_point = "api"
    source {
      storage_source {
        bucket = google_storage_bucket.source.name
        object = google_storage_bucket_object.source.name
      }
    }
  }
  
  service_config {
    max_instance_count = var.max_instances
    available_memory   = "512Mi"
    timeout_seconds    = 300
    
    environment_variables = {
      FIREBASE_CONFIG = jsonencode({
        projectId = var.project_id
      })
    }
  }
}

# Storage bucket for source code
resource "google_storage_bucket" "source" {
  name     = "${var.project_id}-functions-source"
  location = var.region
}

# Variables
variable "project_id" {
  description = "Firebase project ID"
  type        = string
}

variable "region" {
  description = "GCP region"
  type        = string
  default     = "us-central1"
}

variable "firestore_location" {
  description = "Firestore location"
  type        = string
  default     = "nam5"
}

variable "hosting_site_id" {
  description = "Firebase hosting site ID"
  type        = string
}

variable "max_instances" {
  description = "Maximum function instances"
  type        = number
  default     = 100
}
```

## Monitoring ve Alerting

### Health Check Implementation
```typescript
// functions/src/monitoring/health-check.ts
import { Request, Response } from 'express';
import { getFirestore } from 'firebase-admin/firestore';

interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  version: string;
  checks: {
    firestore: boolean;
    functions: boolean;
    storage: boolean;
  };
  uptime: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
}

const startTime = Date.now();

export const healthCheck = async (req: Request, res: Response) => {
  try {
    const checks = await performHealthChecks();
    const memoryUsage = process.memoryUsage();
    
    const health: HealthStatus = {
      status: allChecksPass(checks) ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.APP_VERSION || '1.0.0',
      checks,
      uptime: Date.now() - startTime,
      memory: {
        used: memoryUsage.heapUsed,
        total: memoryUsage.heapTotal,
        percentage: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100
      }
    };
    
    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
    
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
};

async function performHealthChecks() {
  const [firestoreOk, functionsOk, storageOk] = await Promise.allSettled([
    checkFirestore(),
    checkFunctions(),
    checkStorage()
  ]);
  
  return {
    firestore: firestoreOk.status === 'fulfilled' && firestoreOk.value,
    functions: functionsOk.status === 'fulfilled' && functionsOk.value,
    storage: storageOk.status === 'fulfilled' && storageOk.value
  };
}

async function checkFirestore(): Promise<boolean> {
  try {
    const db = getFirestore();
    await db.collection('health').doc('check').get();
    return true;
  } catch {
    return false;
  }
}
```

### Alerting Configuration
```typescript
// functions/src/monitoring/alerts.ts
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { logger } from 'firebase-functions/v2';

export const monitorSystemHealth = onSchedule('every 5 minutes', async () => {
  try {
    const metrics = await collectSystemMetrics();
    
    // Check thresholds
    const alerts = [];
    
    if (metrics.errorRate > 0.05) {
      alerts.push({
        type: 'error_rate',
        severity: 'high',
        message: `Error rate ${(metrics.errorRate * 100).toFixed(2)}% exceeds threshold`
      });
    }
    
    if (metrics.responseTime > 2000) {
      alerts.push({
        type: 'response_time',
        severity: 'medium', 
        message: `Average response time ${metrics.responseTime}ms exceeds threshold`
      });
    }
    
    if (metrics.memoryUsage > 0.8) {
      alerts.push({
        type: 'memory_usage',
        severity: 'high',
        message: `Memory usage ${(metrics.memoryUsage * 100).toFixed(2)}% exceeds threshold`
      });
    }
    
    // Send alerts
    for (const alert of alerts) {
      await sendAlert(alert);
    }
    
  } catch (error) {
    logger.error('System monitoring failed:', error);
  }
});

async function sendAlert(alert: any) {
  // Slack notification
  await fetch(process.env.SLACK_WEBHOOK_URL!, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: `🚨 ${alert.severity.toUpperCase()}: ${alert.message}`,
      channel: '#alerts'
    })
  });
  
  // Email notification for high severity
  if (alert.severity === 'high') {
    // Send email via SendGrid/Firebase Extensions
  }
}
```

## Backup ve Recovery

### Automated Backup Strategy
```bash
#!/bin/bash
# scripts/backup.sh

set -e

BACKUP_DATE=$(date +%Y-%m-%d-%H%M%S)
BACKUP_BUCKET="peakactivity-backups"

echo "Starting backup process for $BACKUP_DATE"

# Firestore export
gcloud firestore export gs://$BACKUP_BUCKET/firestore/$BACKUP_DATE \
  --project=$FIREBASE_PROJECT_ID

# Storage backup
gsutil -m rsync -r -d gs://$FIREBASE_PROJECT_ID.appspot.com \
  gs://$BACKUP_BUCKET/storage/$BACKUP_DATE

# Database schema backup
firebase firestore:rules get > firestore-rules-$BACKUP_DATE.txt
firebase storage:rules get > storage-rules-$BACKUP_DATE.txt

# Upload configs to backup bucket
gsutil cp firestore-rules-$BACKUP_DATE.txt gs://$BACKUP_BUCKET/configs/
gsutil cp storage-rules-$BACKUP_DATE.txt gs://$BACKUP_BUCKET/configs/

echo "Backup completed: $BACKUP_DATE"

# Cleanup old backups (keep last 30 days)
CLEANUP_DATE=$(date -d '30 days ago' +%Y-%m-%d)
gsutil -m rm -r gs://$BACKUP_BUCKET/firestore/$CLEANUP_DATE* || true
gsutil -m rm -r gs://$BACKUP_BUCKET/storage/$CLEANUP_DATE* || true

echo "Backup cleanup completed"
```

## Performance Optimization

### Bundle Analysis ve Optimization
```javascript
// vite.config.ts
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig(({ mode }) => ({
  plugins: [
    vue(),
    // Bundle analiz için
    mode === 'analyze' && visualizer({
      filename: 'dist/bundle-analysis.html',
      open: true
    })
  ].filter(Boolean),
  
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue', 'vue-router'],
          firebase: ['firebase/app', 'firebase/firestore'],
          ai: ['@tensorflow/tfjs'],
          charts: ['chart.js', 'vue-chartjs']
        }
      }
    },
    
    // Build optimization
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: mode === 'production',
        drop_debugger: mode === 'production'
      }
    }
  },
  
  // Development optimization
  server: {
    hmr: true,
    cors: true
  }
}));
```

Bu deployment standartları ile production-ready bir sistem kurabilir ve sürdürülebilir bir DevOps süreci oluşturabilirsiniz.
