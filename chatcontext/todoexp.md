# Copyright 2025 PeakActivity
# Licensed under the Mozilla Public License, v. 2.0.
# See LICENSE.txt for more details.
# PeakActivity TODO Expansion - İlk 100 Görevin Senior Developer Perspektifinden Çözüm Analizi

## Giriş

Bu dokümantasyon, todo600.md dosyasındaki ilk 100 görevin nasıl çözüleceğini, senior software developer perspektifiyle, merkezi çözümler odaklı ve mevcut proje yapısını bozmayacak şekilde detaylandırır. Her görev için sorun-çözüm-implementasyon-ilişkili dosyalar formatında açıklama yapılmıştır.

---

## Bölüm 1: Python Kod Kalitesi ve Docstring'ler (1-20)

### 1. Python Modüllerinde Eksik Docstring'ler

**Sorun:** Proje genelinde modül, sınıf ve fonksiyon seviyesinde eksik veya yetersiz docstring'ler var.

**Çözüm:** Google Style Guide standardında docstring'ler eklenmesi. Merkezi bir docstring template'i oluşturarak tutarlılık sağlanması.

**Implementasyon:**
- `scripts/add_docstrings.py` - Otomatik docstring ekleme scripti
- `.vscode/snippets/python-docstrings.json` - VS Code snippet'leri
- `pyproject.toml` içine `pydocstyle` konfigürasyonu ekleme

**İlişkili Dosyalar:**
- `aw-server/aw_server/rest.py` - API endpoint'leri için
- `aw-server/aw_server/api.py` - ServerAPI sınıfı için
- `aw-core/aw_core/models.py` - Event/Bucket modelleri için

**Uyumluluk:** ✅ Mevcut kodu bozmaz, sadece dokümantasyon ekler

### 2. Karmaşık Kod Bloklarında Yorum Eksikliği

**Sorun:** Senkronizasyon ve algoritma mantıkları açıklanmamış.

**Çözüm:** Inline comment'ler ve algorithm explanation'lar eklenmesi.

**Implementasyon:**
```python
# aw-server/aw_server/sync.py
def full_sync(self):
    """
    Tam senkronizasyon işlemi - kaynak ve hedef arasında veri eşitleme
    
    Algorithm:
    1. Son sync timestamp'ini kontrol et
    2. Değişen event'leri çek (incremental sync)
    3. Conflict resolution uygula
    4. Hedef storage'a yaz
    """
    # Timestamp kontrolü - race condition'ı önlemek için
    last_sync = self._get_last_sync_timestamp()
    # ...
```

**İlişkili Dosyalar:**
- `aw-server/aw_server/sync.py`
- `aw-watcher-window/aw_watcher_window/macos_jxa.py`

**Uyumluluk:** ✅ Sadece açıklama ekler, işlevselliği değiştirmez

### 3-10. Query Transform, Manager, PeeweeStorage vb. Docstring'ler

**Merkezi Çözüm:** 
- `tools/docstring_generator.py` scripti tüm proje için otomatik docstring üretimi
- `.pre-commit-hooks.yaml` içine docstring kontrolü ekleme
- CI/CD pipeline'ına `pydocstyle` entegrasyonu

**İlişkili Dosyalar:**
- `aw-server/aw_server/query/transform.py`
- `aw-qt/aw_qt/manager.py`
- `aw-datastore/storages/peewee.py`
- `functions/src/services/ai/`

### 11-20. Çeşitli Modüllerde Docstring Ekleme

**Merkezi Implementasyon:**
```python
# tools/docstring_generator.py
import ast
import inspect
from typing import Dict, List

class DocstringGenerator:
    """Otomatik docstring üretici - Google Style Guide standardında"""
    
    def generate_for_module(self, module_path: str) -> str:
        """Modül için docstring'ler üret"""
        # AST parse ile fonksiyon/sınıfları bul
        # Mevcut signature'dan docstring template'i oluştur
        pass
```

**Uyumluluk:** ✅ Tüm modüller için uygulanabilir

---

## Bölüm 2: Kod Yapısı ve Standartlar (21-60)

### 21. Satır Uzunluğu Standardizasyonu

**Sorun:** Satır uzunluğu tutarsızlığı, okunabilirlik problemi.

**Çözüm:** Proje genelinde `ruff` veya `black` ile otomatik formatlama.

**Implementasyon:**
```toml
# pyproject.toml
[tool.black]
line-length = 99
target-version = ["py39"]
include = '\.pyi?$'

[tool.ruff]
line-length = 99
select = ["E", "F", "W", "C90", "I", "N", "D"]
```

**İlişkili Dosyalar:**
- Tüm `.py` dosyaları
- `.github/workflows/ci.yml` - CI entegrasyonu
- `pre-commit-config.yaml`

**Uyumluluk:** ✅ Sadece formatting değişikliği, mantık aynı

### 22. Mutable Default Arguments Sorunu

**Sorun:** `def func(items=[]):` gibi tehlikeli pattern'ler.

**Çözüm:** Merkezi linting rule'u ve otomatik fix.

**Implementasyon:**
```python
# tools/fix_mutable_defaults.py
import ast
import re

def fix_mutable_defaults(source_code: str) -> str:
    """Mutable default argument'ları otomatik olarak düzelt"""
    # AST ile fonksiyon parametrelerini parse et
    # [] -> None'a çevir, fonksiyon içinde if kontrolü ekle
    pass
```

**İlişkili Dosyalar:**
- `aw-server/aw_server/api.py`
- Tüm Python modülleri

**Uyumluluk:** ✅ Defensive programming, mevcut API'yi değiştirmez

### 23. Logging String Formatting

**Sorun:** Lazy formatting kullanılmıyor, performans kaybı.

**Çözüm:** Merkezi linting rule'u ile lazy formatting zorlanması.

**Implementasyon:**
```python
# .ruff.toml veya pyproject.toml
[tool.ruff.extend-per-file-ignores]
# Logging formatını kontrol et
"*.py" = ["G002"]  # ruff'ın logging format kontrolü

# Otomatik fix scripti
# tools/fix_logging.py
def fix_logging_calls(source: str) -> str:
    # logging.info(f"...") -> logging.info("...", ...)
    pattern = r'logging\.(debug|info|warning|error|critical)\(f"([^"]+)"\)'
    # ...
```

**İlişkili Dosyalar:**
- Tüm Python dosyaları (özellikle `aw-server/`)

**Uyumluluk:** ✅ Performans iyileştirmesi, API değişmiyor

### 24. File Encoding Standardizasyonu

**Sorun:** `open()` çağrılarında encoding belirtilmiyor.

**Çözüm:** Merkezi linting rule'u ve otomatik fix.

**Implementasyon:**
```python
# tools/add_encoding.py
import re

def add_encoding_to_open_calls(source: str) -> str:
    """open() çağrılarına encoding="utf-8" ekle"""
    pattern = r'open\(([^)]+)\)(?!\s*\.)'
    
    def replace_func(match):
        args = match.group(1)
        if 'encoding=' not in args:
            return f'open({args}, encoding="utf-8")'
        return match.group(0)
    
    return re.sub(pattern, replace_func, source)
```

**Uyumluluk:** ✅ Cross-platform uyumluluğu artırır

### 25-30. Import Sıralama, Unused Imports, Global Variables vs.

**Merkezi Çözüm:**
```toml
# pyproject.toml
[tool.ruff]
select = [
    "E",   # pycodestyle errors
    "W",   # pycodestyle warnings  
    "F",   # pyflakes
    "I",   # isort imports
    "N",   # pep8-naming
    "UP",  # pyupgrade
]

[tool.ruff.isort]
known-first-party = ["aw_core", "aw_server", "aw_client"]
```

**İlişkili Dosyalar:**
- Tüm Python modülleri
- `aw-core/constants.py` - Yeni sabitler dosyası

### 31-40. PathLib, Pydantic Settings, Function Decomposition vs.

**Merkezi Modernizasyon Yaklaşımı:**

```python
# aw-server/aw_server/settings.py - Modern yaklaşım
from pydantic_settings import BaseSettings
from pathlib import Path
from typing import Optional

class AWServerSettings(BaseSettings):
    """ActivityWatch Server ayarları - pydantic ile type-safe"""
    
    data_dir: Path = Path.home() / ".local" / "share" / "activitywatch"
    port: int = 5600
    host: str = "127.0.0.1"
    storage_method: str = "peewee"
    firestore_project_id: Optional[str] = None
    
    class Config:
        env_prefix = "AW_"
        env_file = ".env"
```

**Uyumluluk:** ✅ Backward compatibility ile mevcut config sistemini bozmaz

### 41-50. Exit Handling, Meta Tables, Event Models vs.

**Merkezi Data Architecture Yaklaşımı:**

```python
# aw-core/aw_core/models_v2.py - Enhanced models
from dataclasses import dataclass
from typing import Dict, Any, Union
from datetime import datetime
import uuid

@dataclass
class EventV2:
    """Enhanced Event model with validation"""
    id: str = None
    timestamp: datetime = None
    duration: float = 0
    data: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.id is None:
            self.id = str(uuid.uuid4())
        # Validation logic
```

**Uyumluluk:** ⚠️ Migration strategy gerekli, mevcut Event model ile coexist

### 51-60. QThread Refactoring, Input Listeners, Race Conditions vs.

**Merkezi Thread Safety ve State Management:**

```python
# aw-qt/aw_qt/core/thread_manager.py
from PyQt5.QtCore import QThread, QObject, pyqtSignal
import threading
from typing import Dict, Any

class ThreadSafeManager(QObject):
    """Thread-safe watcher yönetimi"""
    
    watcher_started = pyqtSignal(str)
    watcher_stopped = pyqtSignal(str)
    
    def __init__(self):
        super().__init__()
        self._lock = threading.RLock()
        self._watchers: Dict[str, QThread] = {}
```

**Uyumluluk:** ✅ Mevcut manager.py'ı extend eder

---

## Bölüm 3: Hata Yönetimi ve Sağlamlık (61-80)

### 61. Geniş Exception Handling

**Sorun:** `except Exception:` gibi geniş kapsamlı exception handling.

**Çözüm:** Merkezi exception hierarchy ve spesifik error handling.

**Implementasyon:**
```python
# aw-core/aw_core/exceptions.py
class AWException(Exception):
    """Base exception for ActivityWatch"""
    pass

class AWStorageException(AWException):
    """Storage related errors"""
    pass

class AWNetworkException(AWException):
    """Network related errors"""  
    pass

class AWValidationException(AWException):
    """Data validation errors"""
    pass

# aw-server/aw_server/error_handler.py
from typing import Type, Dict, Callable
import logging

class ErrorHandler:
    """Merkezi hata yönetimi"""
    
    _handlers: Dict[Type[Exception], Callable] = {}
    
    @classmethod
    def register_handler(cls, exception_type: Type[Exception], handler: Callable):
        cls._handlers[exception_type] = handler
    
    @classmethod
    def handle(cls, exception: Exception) -> Any:
        """Spesifik exception handler'ı çalıştır"""
        for exc_type, handler in cls._handlers.items():
            if isinstance(exception, exc_type):
                return handler(exception)
        # Default handler
        logging.error(f"Unhandled exception: {exception}")
        raise exception
```

**İlişkili Dosyalar:**
- `aw-watcher-input/src/aw_watcher_input/main.py`
- `aw-server/aw_server/rest.py`
- Tüm Python modülleri

**Uyumluluk:** ✅ Mevcut try-except blokları aşamalı olarak migrate edilir

### 62-70. Spesifik Error Handling, Database Errors, QProcess Errors vs.

**Merkezi Error Recovery Strategy:**

```python
# aw-server/aw_server/resilience/retry.py
import functools
import time
import logging
from typing import Type, Tuple, Callable

def with_retry(
    max_attempts: int = 3,
    backoff_factor: float = 1.0,
    exceptions: Tuple[Type[Exception], ...] = (Exception,)
):
    """Retry decorator with exponential backoff"""
    def decorator(func: Callable):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            last_exception = None
            for attempt in range(max_attempts):
                try:
                    return func(*args, **kwargs)
                except exceptions as e:
                    last_exception = e
                    if attempt < max_attempts - 1:
                        delay = backoff_factor * (2 ** attempt)
                        time.sleep(delay)
                        logging.warning(f"Retry {attempt + 1}/{max_attempts} for {func.__name__}: {e}")
            raise last_exception
        return wrapper
    return decorator
```

**Uyumluluk:** ✅ Decorator pattern, mevcut fonksiyonları sarmalamaya uygun

### 71-80. Global Exception Hooks, Query Validation, Config Parsing vs.

**Merkezi Validation ve Configuration Management:**

```python
# aw-core/aw_core/validation.py
from pydantic import BaseModel, validator
from typing import List, Optional
from datetime import datetime

class TimeperiodValidator(BaseModel):
    """Query timeperiod validation"""
    start: datetime
    end: datetime
    
    @validator('end')
    def end_after_start(cls, v, values):
        if 'start' in values and v <= values['start']:
            raise ValueError('End time must be after start time')
        return v

class EventDataValidator(BaseModel):
    """Event data validation"""
    title: Optional[str] = None
    app: Optional[str] = None
    url: Optional[str] = None
    
    class Config:
        extra = "allow"  # Allow additional fields
```

**Uyumluluk:** ✅ Mevcut query sistemi ile uyumlu, ek validasyon katmanı

---

## Bölüm 4: Performans ve Verimlilik (81-100)

### 81. String Concatenation Optimization

**Sorun:** Döngü içinde `+` ile string birleştirme.

**Çözüm:** Merkezi string building utility ve linting rule.

**Implementasyon:**
```python
# aw-core/aw_core/utils/string_utils.py
from typing import Iterable, Any

class StringBuilder:
    """Efficient string building utility"""
    
    def __init__(self):
        self._parts = []
    
    def append(self, text: Any) -> 'StringBuilder':
        self._parts.append(str(text))
        return self
    
    def extend(self, texts: Iterable[Any]) -> 'StringBuilder':
        self._parts.extend(str(t) for t in texts)
        return self
    
    def build(self, separator: str = "") -> str:
        return separator.join(self._parts)
```

**İlişkili Dosyalar:**
- Report generation kod'ları
- Log formatting
- Query result building

**Uyumluluk:** ✅ Utility class, mevcut kodu bozmaz

### 82-90. Data Processing Optimization, Memory Management, Caching vs.

**Merkezi Performance Strategy:**

```python
# aw-server/aw_server/performance/cache_manager.py
from cachetools import TTLCache, LRUCache
from typing import Any, Optional, Callable
import functools
import hashlib

class CacheManager:
    """Merkezi cache yönetimi"""
    
    def __init__(self):
        self.query_cache = TTLCache(maxsize=100, ttl=300)  # 5 min TTL
        self.event_cache = LRUCache(maxsize=1000)
        self.bucket_cache = TTLCache(maxsize=50, ttl=3600)  # 1 hour TTL
    
    def cached_query(self, ttl: int = 300):
        """Query result'larını cache'le"""
        def decorator(func: Callable):
            @functools.wraps(func)
            def wrapper(*args, **kwargs):
                # Cache key generation
                key = self._generate_cache_key(func.__name__, args, kwargs)
                
                if key in self.query_cache:
                    return self.query_cache[key]
                
                result = func(*args, **kwargs)
                self.query_cache[key] = result
                return result
            return wrapper
        return decorator
    
    def _generate_cache_key(self, func_name: str, args: tuple, kwargs: dict) -> str:
        """Deterministic cache key generation"""
        content = f"{func_name}:{args}:{sorted(kwargs.items())}"
        return hashlib.md5(content.encode()).hexdigest()
```

**Uyumluluk:** ✅ Decorator pattern, existing functions'a kolayca eklenebilir

### 91-95. Memory Optimization, Regex Caching, Dynamic Intervals vs.

**Memory ve CPU Optimization:**

```python
# aw-core/aw_core/models_optimized.py
from typing import Dict, Any
import re
from cachetools import LRUCache

class EventOptimized:
    """Memory-optimized Event model with __slots__"""
    
    __slots__ = ['id', 'timestamp', 'duration', 'data', '_cached_json']
    
    def __init__(self, id: str, timestamp, duration: float, data: Dict[str, Any]):
        self.id = id
        self.timestamp = timestamp
        self.duration = duration
        self.data = data
        self._cached_json = None

# Regex cache for categorization
REGEX_CACHE: LRUCache = LRUCache(maxsize=100)

def get_compiled_regex(pattern: str) -> re.Pattern:
    """Compiled regex'leri cache'le"""
    if pattern not in REGEX_CACHE:
        REGEX_CACHE[pattern] = re.compile(pattern)
    return REGEX_CACHE[pattern]
```

**Uyumluluk:** ⚠️ Migration strategy gerekli, performance critical paths için

### 96-100. Production Server, Compression, Connection Pooling vs.

**Production Readiness:**

```python
# aw-server/aw_server/production/wsgi_app.py
from werkzeug.middleware.proxy_fix import ProxyFix
from flask_compress import Compress
import gunicorn

def create_production_app():
    """Production için optimize edilmiş Flask app"""
    from aw_server.server import app
    
    # Reverse proxy arkasında çalışma desteği
    app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_prefix=1)
    
    # Response compression
    Compress(app)
    
    # Production configurations
    app.config.update(
        JSON_SORT_KEYS=False,  # Performance gain
        JSONIFY_PRETTYPRINT_REGULAR=False,
    )
    
    return app

# Database connection pooling
# aw-datastore/storages/peewee_optimized.py
from peewee import PostgresqlDatabase
from playhouse.pool import PooledPostgresqlDatabase

class OptimizedPeeweeStorage:
    """Connection pooling ile optimize edilmiş storage"""
    
    def __init__(self, connection_string: str):
        self.db = PooledPostgresqlDatabase(
            connection_string,
            max_connections=20,
            stale_timeout=300,
        )
```

**Uyumluluk:** ✅ Production deployment için ek layer, development'ı etkilemez

---

## Genel Implementasyon Stratejisi

### Merkezi Araçlar ve Utilities

1. **Code Quality Tools**
   - `tools/code_quality/` - Otomatik refactoring scripts
   - `scripts/setup_development.py` - Development environment setup
   - `.pre-commit-config.yaml` - Git hooks

2. **Performance Monitoring**
   - `aw-server/aw_server/monitoring/` - Performance metrics
   - `functions/src/performance/` - Firebase functions performance

3. **Migration Strategy**
   - `migrations/` - Database schema migrations  
   - `aw-core/aw_core/compatibility/` - Backward compatibility layer

### CI/CD Entegrasyonu

```yaml
# .github/workflows/code-quality.yml
name: Code Quality
on: [push, pull_request]

jobs:
  code-quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install Python
        uses: actions/setup-python@v4
        with:
          python-version: "3.9"
      - name: Install dependencies
        run: |
          pip install ruff black mypy pytest
      - name: Run ruff
        run: ruff check .
      - name: Run black
        run: black --check .
      - name: Run mypy
        run: mypy aw-server/ aw-core/
```

### Risk Assessment

| Görev Kategorisi | Risk Level | Mitigation Strategy |
|-----------------|------------|-------------------|
| Docstring'ler | Düşük ✅ | Sadece dokümantasyon, kod değişmiyor |
| Code formatting | Düşük ✅ | Otomatik tooling, review process |
| Error handling | Orta ⚠️ | Aşamalı migrate, comprehensive testing |
| Performance opt | Yüksek 🔴 | A/B testing, monitoring, rollback plan |
| Model changes | Yüksek 🔴 | Migration scripts, backward compatibility |

### Önerilen İmplementasyon Sırası

1. **Fase 1 (Güvenli)**: Docstring'ler, code formatting, linting (1-30)
2. **Fase 2 (Orta Risk)**: Error handling, validation (31-80) 
3. **Fase 3 (Yüksek Risk)**: Performance optimization, model changes (81-100)

Her fase için:
- Comprehensive testing
- Performance benchmarking
- Gradual rollout
- Monitoring ve rollback capability

Bu yaklaşım ile mevcut sistemin stabilitesini koruyarak, kod kalitesini sistematik olarak artırabiliriz.

---

## Bölüm 5: TypeScript/JavaScript Kod Kalitesi (101-150)

### TypeScript Tip Güvenliği (101-120)

### 101. TypeScript 'any' Tipi Eliminasyonu

**Sorun:** `aw-server/aw-webui` ve `functions/src` içinde yaygın `any` kullanımı tip güvenliğini ortadan kaldırıyor.

**Çözüm:** Merkezi tip tanımları sistemi ve strict TypeScript konfigürasyonu.

**Implementasyon:**
```typescript
// aw-server/aw-webui/src/types/core.ts
export interface AWEvent {
  id: string;
  timestamp: Date;
  duration: number;
  data: Record<string, unknown>;
}

export interface AWBucket {
  id: string;
  type: string;
  hostname: string;
  created: Date;
  last_updated?: Date;
}

// functions/src/types/firebase.ts
export interface UserDocument {
  uid: string;
  email: string;
  created_at: admin.firestore.FieldValue;
  preferences: UserPreferences;
}

// tsconfig.json güncelleme
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noImplicitReturns": true
  }
}
```

**İlişkili Dosyalar:**
- `aw-server/aw-webui/src/stores/views.ts`
- `functions/src/index.ts`
- `aw-server/aw-webui/src/util/edge-ai-service.ts`

**Uyumluluk:** ✅ Aşamalı migration ile mevcut kodu bozmaz

### 102-110. Null Safety ve Optional Chaining

**Merkezi Çözüm:**
```typescript
// aw-server/aw-webui/src/utils/safe-access.ts
export function safeAccess<T, K extends keyof T>(
  obj: T | null | undefined, 
  key: K
): T[K] | undefined {
  return obj?.[key];
}

export function safeDeepAccess<T>(
  obj: unknown,
  path: string,
  defaultValue?: T
): T | undefined {
  return path.split('.').reduce((current, key) => current?.[key], obj) ?? defaultValue;
}

// Type guard utilities
export function isNotNull<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}
```

**Uyumluluk:** ✅ Utility functions, mevcut kodu genişletir

### 111-120. Firebase Functions Tip Güvenliği

**Merkezi Validation ve Type System:**
```typescript
// functions/src/types/validation.ts
import { z } from 'zod';

export const CreateActivitySchema = z.object({
  timestamp: z.string().datetime(),
  duration: z.number().positive(),
  data: z.record(z.unknown())
});

export type CreateActivityRequest = z.infer<typeof CreateActivitySchema>;

// functions/src/utils/validation.ts
export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Invalid request data',
      result.error.errors
    );
  }
  return result.data;
}
```

**İlişkili Dosyalar:**
- `functions/src/index.ts` - onCall validation
- `functions/src/types/` - Merkezi tip tanımları
- `functions/src/services/` - Servis tip tanımları

**Uyumluluk:** ✅ Runtime validation + compile-time safety

---

## Bölüm 6: Frontend Kod Yapısı (121-140)

### 121. ESLint/Prettier Standardizasyonu

**Sorun:** Tutarsız kod formatı ve linting kuralları.

**Çözüm:** Merkezi kod standardı ve otomatik formatlama.

**Implementasyon:**
```json
// .eslintrc.js (proje kök)
module.exports = {
  root: true,
  env: {
    node: true,
    browser: true,
  },
  extends: [
    '@vue/typescript/recommended',
    '@typescript-eslint/recommended',
    'prettier'
  ],
  plugins: ['@typescript-eslint'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/no-unused-vars': 'error'
  }
};

// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2
}
```

**CI Entegrasyonu:**
```yaml
# .github/workflows/frontend-quality.yml
- name: Run ESLint
  run: npm run lint:check
- name: Run Prettier
  run: npm run format:check
```

**Uyumluluk:** ✅ Formatting only, mantık değişmez

### 122-130. Modüler Yapı ve Kod Organizasyonu

**Merkezi Architecture Pattern:**
```typescript
// aw-server/aw-webui/src/core/index.ts - Barrel exports
export * from './types';
export * from './constants';
export * from './utils';

// aw-server/aw-webui/src/services/api/index.ts
export class APIService {
  private baseURL: string;
  
  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }
  
  async getEvents(bucketId: string): Promise<AWEvent[]> {
    // Merkezi API logic
  }
}

// aw-server/aw-webui/src/composables/useActivity.ts
export function useActivity() {
  const activities = ref<AWEvent[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  
  const fetchActivities = async (bucketId: string) => {
    try {
      loading.value = true;
      activities.value = await apiService.getEvents(bucketId);
    } catch (e) {
      error.value = e.message;
    } finally {
      loading.value = false;
    }
  };
  
  return { activities, loading, error, fetchActivities };
}
```

**İlişkili Dosyalar:**
- `aw-server/aw-webui/src/stores/` - Pinia store modülleri
- `aw-server/aw-webui/src/components/` - Bileşen parçalama
- `functions/src/services/` - Servis katmanı

**Uyumluluk:** ✅ Kademeli refactoring ile uyumlu

### 131-140. Asset Management ve Build Optimization

**Merkezi Asset Yönetimi:**
```typescript
// aw-server/aw-webui/src/assets/index.ts
export const IMAGES = {
  LOGO: '/assets/images/logo.png',
  PLACEHOLDER: '/assets/images/placeholder.svg'
} as const;

export const ROUTES = {
  DASHBOARD: '/dashboard',
  ACTIVITY: '/activity',
  SETTINGS: '/settings'
} as const;

// vite.config.ts optimizasyonu
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue', 'vue-router'],
          charts: ['d3', 'chart.js'],
          firebase: ['firebase/app', 'firebase/firestore']
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@types': path.resolve(__dirname, 'src/types'),
      '@utils': path.resolve(__dirname, 'src/utils')
    }
  }
});
```

**Uyumluluk:** ✅ Build optimization, mevcut kodu etkilemez

---

## Bölüm 7: Error Handling ve Async Operations (141-150)

### 141-145. Frontend Error Management

**Merkezi Error Handling System:**
```typescript
// aw-server/aw-webui/src/utils/error-handler.ts
export interface APIError {
  message: string;
  code: string;
  statusCode: number;
  details?: unknown;
}

export class ErrorHandler {
  static handleAPIError(error: unknown): APIError {
    if (error instanceof Response) {
      return {
        message: `HTTP ${error.status}: ${error.statusText}`,
        code: 'HTTP_ERROR',
        statusCode: error.status
      };
    }
    
    if (error instanceof Error) {
      return {
        message: error.message,
        code: 'GENERIC_ERROR',
        statusCode: 500
      };
    }
    
    return {
      message: 'Unknown error occurred',
      code: 'UNKNOWN_ERROR',
      statusCode: 500
    };
  }
  
  static async showUserFriendlyError(error: APIError) {
    // Toast notification veya modal göster
    console.error('API Error:', error);
  }
}

// Vue Error Boundary
// aw-server/aw-webui/src/components/ErrorBoundary.vue
<script setup lang="ts">
import { onErrorCaptured, ref } from 'vue';

const hasError = ref(false);
const errorMessage = ref('');

onErrorCaptured((error: Error) => {
  hasError.value = true;
  errorMessage.value = error.message;
  console.error('Component Error:', error);
  return false; // Propagate error
});
</script>
```

**İlişkili Dosyalar:**
- `aw-server/aw-webui/src/util/awclient.ts`
- `functions/src/index.ts` - Firebase Functions error handling

**Uyumluluk:** ✅ Error wrapper, mevcut sistemi geliştirir

### 146-150. Async State Management

**Merkezi Async Utilities:**
```typescript
// aw-server/aw-webui/src/composables/useAsync.ts
export function useAsync<T>(
  asyncFn: () => Promise<T>,
  immediate = true
) {
  const data = ref<T | null>(null);
  const loading = ref(false);
  const error = ref<Error | null>(null);
  
  const execute = async () => {
    try {
      loading.value = true;
      error.value = null;
      data.value = await asyncFn();
    } catch (e) {
      error.value = e instanceof Error ? e : new Error(String(e));
    } finally {
      loading.value = false;
    }
  };
  
  if (immediate) {
    execute();
  }
  
  onUnmounted(() => {
    // Cleanup pending promises
    loading.value = false;
  });
  
  return { data, loading, error, execute };
}

// functions/src/utils/async-helpers.ts
export function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  backoffMs = 1000
): Promise<T> {
  return new Promise(async (resolve, reject) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await fn();
        resolve(result);
        return;
      } catch (error) {
        if (attempt === maxRetries) {
          reject(error);
          return;
        }
        await new Promise(r => setTimeout(r, backoffMs * Math.pow(2, attempt - 1)));
      }
    }
  });
}
```

**Uyumluluk:** ✅ Utility composables, mevcut async kod'u geliştirir

---

## Bölüm 8: Test Altyapısı (151-200)

### 151. Test Coverage Strategy

**Sorun:** Proje genelinde çok düşük test coverage, kritik business logic testlerinin eksikliği.

**Çözüm:** Katmanlı test stratejisi ve otomatik coverage enforcement.

**Implementasyon:**
```python
# aw-server/tests/conftest.py
import pytest
from unittest.mock import Mock
from aw_server.api import ServerAPI
from aw_datastore.storages.memory import MemoryStorage

@pytest.fixture
def memory_storage():
    """In-memory storage for testing"""
    return MemoryStorage()

@pytest.fixture  
def test_api(memory_storage):
    """Test API instance with mocked storage"""
    api = ServerAPI(storage=memory_storage)
    return api

@pytest.fixture
def sample_events():
    """Sample test data"""
    return [
        {
            "id": "test-1",
            "timestamp": "2024-01-01T00:00:00Z",
            "duration": 60,
            "data": {"title": "Test Activity"}
        }
    ]

# aw-server/tests/test_api_integration.py
def test_heartbeat_creates_events(test_api, sample_events):
    """Test heartbeat functionality"""
    bucket_id = "test-bucket"
    test_api.create_bucket(bucket_id, type="test")
    
    # Test heartbeat
    result = test_api.heartbeat(bucket_id, sample_events[0])
    
    # Verify event creation
    events = test_api.get_events(bucket_id)
    assert len(events) == 1
    assert events[0]["data"]["title"] == "Test Activity"
```

**İlişkili Dosyalar:**
- `aw-server/tests/` - API testleri
- `aw-watcher-afk/tests/` - Watcher testleri  
- `aw-core/tests/` - Core model testleri

**Uyumluluk:** ✅ Test-only kod, production sistemini etkilemez

### 152-200. Comprehensive Testing Strategy

**Frontend Test Infrastructure:**
```typescript
// aw-server/aw-webui/tests/setup.ts
import { config } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { createI18n } from 'vue-i18n';

// Global test configuration
const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: { test: 'Test message' }
  }
});

config.global.plugins = [createPinia(), i18n];
config.global.stubs = {
  'router-link': true,
  'router-view': true
};

// aw-server/aw-webui/vitest.config.ts
import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import path from 'path';

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    setupFiles: ['tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      threshold: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  }
});

// aw-server/aw-webui/tests/stores/activity.spec.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useActivityStore } from '@/stores/activity';

describe('Activity Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('should fetch activities successfully', async () => {
    const store = useActivityStore();
    
    // Mock API response
    const mockEvents = [
      { id: '1', timestamp: new Date(), duration: 60, data: { app: 'test' } }
    ];
    
    vi.mock('@/utils/awclient', () => ({
      getEvents: vi.fn().mockResolvedValue(mockEvents)
    }));
    
    await store.fetchActivities('test-bucket');
    
    expect(store.activities).toEqual(mockEvents);
    expect(store.loading).toBe(false);
  });
});
```

**Database Testing Strategy:**
```python
# aw-datastore/tests/test_storage_compatibility.py
class TestStorageContract:
    """Test that all storage implementations follow the same contract"""
    
    @pytest.fixture(params=[
        MemoryStorage,
        lambda: PeeweeStorage("sqlite:///:memory:"),
    ])
    def storage(self, request):
        return request.param()
    
    def test_bucket_creation(self, storage):
        bucket_id = "test-bucket"
        bucket_type = "test"
        
        storage.create_bucket(bucket_id, type=bucket_type)
        buckets = storage.get_buckets()
        
        assert bucket_id in buckets
        assert buckets[bucket_id]["type"] == bucket_type
```

**Uyumluluk:** ✅ Comprehensive test coverage, production logic unchanged

---

## Bölüm 9: CI/CD Pipeline (201-250)

### 201. Comprehensive CI/CD Strategy

**Sorun:** Fragmented build process, manual quality checks, deployment inconsistencies.

**Çözüm:** Unified CI/CD pipeline with quality gates and automated deployment.

**Implementasyon:**
```yaml
# .github/workflows/ci.yml
name: Continuous Integration

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  quality-gate:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        python-version: [3.9, 3.10, 3.11]
        node-version: [18, 20]
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Python ${{ matrix.python-version }}
        uses: actions/setup-python@v4
        with:
          python-version: ${{ matrix.python-version }}
          
      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
          
      - name: Python tests with coverage
        run: |
          poetry run pytest --cov=aw_server --cov=aw_core --cov-report=xml
          
      - name: Frontend tests
        run: |
          npm run test:unit
          npm run test:e2e:ci
          
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage.xml
```

**İlişkili Dosyalar:**
- `.github/workflows/` - CI/CD definitions
- `pyproject.toml` - Python build config
- `package.json` - Node.js build config

**Uyumluluk:** ✅ CI/CD infrastructure, development workflow enhancement

### 202-210. Deployment Automation

**Continuous Deployment Pipeline:**
```yaml
# .github/workflows/deploy.yml
name: Continuous Deployment

on:
  push:
    branches: [main]
    tags: ['v*']
  workflow_dispatch:
    inputs:
      environment:
        description: 'Target environment'
        required: true
        default: 'staging'
        type: choice
        options:
          - staging
          - production

env:
  FIREBASE_PROJECT_STAGING: "peakactivity-staging"
  FIREBASE_PROJECT_PROD: "peakactivity-prod"

jobs:
  deploy-staging:
    if: github.ref == 'refs/heads/main' || github.event.inputs.environment == 'staging'
    runs-on: ubuntu-latest
    environment: staging
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: 'npm'
          
      - name: Install Firebase CLI
        run: npm install -g firebase-tools
        
      - name: Build functions
        working-directory: functions
        run: |
          npm ci
          npm run build
          
      - name: Build web UI
        working-directory: aw-server/aw-webui
        run: |
          npm ci
          npm run build
          
      - name: Deploy to Firebase Staging
        env:
          FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN }}
        run: |
          firebase use ${{ env.FIREBASE_PROJECT_STAGING }}
          firebase deploy --only functions,hosting
          
      - name: Run smoke tests
        run: |
          curl -f https://staging.peakactivity.com/health || exit 1
          curl -f https://staging.peakactivity.com/api/0/info || exit 1
          
      - name: Run E2E tests against staging
        working-directory: aw-server/aw-webui
        run: |
          npm run test:e2e:staging
          
      - name: Notify deployment
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          channel: '#deployments'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}

  deploy-production:
    if: startsWith(github.ref, 'refs/tags/v') || github.event.inputs.environment == 'production'
    needs: [deploy-staging]
    runs-on: ubuntu-latest
    environment: production
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: 'npm'
          
      - name: Install Firebase CLI
        run: npm install -g firebase-tools
        
      - name: Build and deploy to production
        env:
          FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN }}
        run: |
          firebase use ${{ env.FIREBASE_PROJECT_PROD }}
          
          # Build functions with production config
          cd functions
          npm ci --production
          npm run build
          cd ..
          
          # Build frontend with production optimizations
          cd aw-server/aw-webui
          npm ci --production
          NODE_ENV=production npm run build
          cd ../..
          
          # Deploy with backup strategy
          firebase deploy --only functions,hosting
          
      - name: Health check
        run: |
          sleep 30  # Wait for deployment to propagate
          curl -f https://app.peakactivity.com/health || exit 1
          curl -f https://app.peakactivity.com/api/0/info || exit 1
          
      - name: Create release
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: ${{ github.ref }}
          release_name: Release ${{ github.ref }}
          draft: false
          prerelease: false

  desktop-release:
    if: startsWith(github.ref, 'refs/tags/v')
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
        include:
          - os: ubuntu-latest
            artifact_name: peakactivity-linux
          - os: windows-latest
            artifact_name: peakactivity-windows.exe
          - os: macos-latest
            artifact_name: peakactivity-macos
    
    runs-on: ${{ matrix.os }}
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: "3.11"
          
      - name: Build desktop app
        run: |
          pip install poetry
          poetry install
          poetry run pyinstaller aw-qt/aw-qt.spec
          
      - name: Sign macOS app (macOS only)
        if: matrix.os == 'macos-latest'
        run: |
          # macOS signing and notarization
          codesign --force --deep --sign "${{ secrets.MACOS_SIGNING_IDENTITY }}" dist/aw-qt.app
          
      - name: Upload release asset
        uses: actions/upload-release-asset@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          upload_url: ${{ github.event.release.upload_url }}
          asset_path: ./dist/${{ matrix.artifact_name }}
          asset_name: ${{ matrix.artifact_name }}
          asset_content_type: application/octet-stream
```

**İlişkili Dosyalar:**
- `firebase.json` - Firebase deployment configuration
- `aw-qt/aw-qt.spec` - PyInstaller specification
- `.github/workflows/deploy.yml` - Deployment pipeline

**Uyumluluk:** ✅ Deployment automation, manual process elimination

### 211-250. Advanced CI/CD Features

**Dependency Management Automation:**
```yaml
# .github/workflows/dependency-updates.yml
name: Dependency Updates

on:
  schedule:
    - cron: '0 2 * * 1'  # Weekly on Monday
  workflow_dispatch:

jobs:
  update-python-deps:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          
      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: "3.11"
          
      - name: Install Poetry
        uses: snok/install-poetry@v1
        with:
          version: ${{ env.POETRY_VERSION }}
          virtualenvs-create: true
          virtualenvs-in-project: true
          
      - name: Update dependencies
        run: |
          poetry update
          poetry export -f requirements.txt --output requirements.txt
          
      - name: Run tests with updated dependencies
        run: |
          poetry run pytest --tb=short
          
      - name: Create Pull Request
        uses: peter-evans/create-pull-request@v5
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          commit-message: "chore: update Python dependencies"
          title: "🔄 Update Python dependencies"
          body: |
            Automated dependency update
            
            - Poetry dependencies updated
            - All tests passing
            
            Please review the changes before merging.
          branch: "automated/update-python-deps"

  update-node-deps:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: 'npm'
          
      - name: Update frontend dependencies
        working-directory: aw-server/aw-webui
        run: |
          npm update
          npm audit fix --audit-level moderate
          
      - name: Update Firebase Functions dependencies
        working-directory: functions
        run: |
          npm update
          npm audit fix --audit-level moderate
          
      - name: Run tests
        run: |
          cd aw-server/aw-webui && npm run test:unit
          cd ../../functions && npm run test
          
      - name: Create Pull Request
        uses: peter-evans/create-pull-request@v5
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          commit-message: "chore: update Node.js dependencies"
          title: "🔄 Update Node.js dependencies"
          body: |
            Automated dependency update
            
            - Frontend dependencies updated
            - Firebase Functions dependencies updated
            - Security vulnerabilities fixed
            - All tests passing
          branch: "automated/update-node-deps"

# .github/workflows/security-monitoring.yml
name: Security Monitoring

on:
  schedule:
    - cron: '0 6 * * *'  # Daily at 6 AM
  workflow_dispatch:

jobs:
  security-audit:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Python security scan
        run: |
          pip install bandit safety
          bandit -r . -f json -o bandit-report.json
          safety check --json > safety-report.json
          
      - name: JavaScript security audit
        run: |
          cd aw-server/aw-webui && npm audit --json > ../../npm-audit-frontend.json
          cd functions && npm audit --json > ../npm-audit-functions.json
          
      - name: CodeQL Analysis
        uses: github/codeql-action/analyze@v2
        with:
          languages: python, javascript, typescript
          
      - name: Upload security reports
        uses: actions/upload-artifact@v3
        with:
          name: security-reports-${{ github.run_number }}
          path: |
            bandit-report.json
            safety-report.json
            npm-audit-*.json
            
      - name: Notify security team
        if: failure()
        uses: 8398a7/action-slack@v3
        with:
          status: 'failure'
          channel: '#security-alerts'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
          message: 'Security vulnerabilities detected in daily scan'
```

**Performance Monitoring Integration:**
```yaml
# .github/workflows/performance-monitoring.yml
name: Performance Monitoring

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lighthouse-ci:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          
      - name: Build application
        working-directory: aw-server/aw-webui
        run: |
          npm ci
          npm run build
          
      - name: Run Lighthouse CI
        uses: treosh/lighthouse-ci-action@v9
        with:
          configPath: './lighthouserc.json'
          uploadArtifacts: true
          temporaryPublicStorage: true

  bundle-analysis:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Analyze bundle size
        uses: preactjs/compressed-size-action@v2
        with:
          repo-token: "${{ secrets.GITHUB_TOKEN }}"
          pattern: "./aw-server/aw-webui/dist/**/*.{js,css}"
          
  python-performance:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: "3.11"
          
      - name: Install dependencies
        run: |
          pip install poetry pytest-benchmark
          poetry install
          
      - name: Run performance benchmarks
        run: |
          poetry run pytest aw-server/tests/benchmarks/ --benchmark-json=benchmark-results.json
          
      - name: Upload benchmark results
        uses: actions/upload-artifact@v3
        with:
          name: performance-benchmarks
          path: benchmark-results.json
```

**Uyumluluk:** ✅ Advanced automation, comprehensive monitoring

---

## Implementation Summary (251-300)

### Priority Implementation Matrix

| Kategori | Tasks | Risk | Impact | Effort | Priority |
|----------|-------|------|--------|--------|----------|
| Test Infrastructure | 151-200 | Düşük | Çok Yüksek | Yüksek | 🔥 Kritik |
| CI/CD Pipeline | 201-250 | Düşük | Çok Yüksek | Orta | 🔥 Kritik |
| Security Automation | 222-233 | Orta | Yüksek | Orta | ⚡ Yüksek |
| Performance Monitoring | 234-250 | Düşük | Orta | Düşük | ⚡ Yüksek |

### 8-Week Implementation Roadmap

**Week 1-2: Test Foundation**
- Test infrastructure setup (151-160)
- Basic pytest configuration
- Frontend test setup (Vitest/Jest)
- Mock strategies implementation

**Week 3-4: CI/CD Core**  
- Basic CI pipeline (201-210)
- Multi-platform testing
- Coverage enforcement
- Build automation

**Week 5-6: Advanced Testing**
- E2E test suites (181-200)
- Security testing integration (191-193)
- Performance benchmarks
- Cross-platform compatibility

**Week 7-8: Production Readiness**
- Deployment automation (211-230)
- Security monitoring (231-240)
- Performance optimization (241-250)
- Documentation and training

### Success Metrics

- **Test Coverage**: >85% for all modules
- **Build Success Rate**: >95% 
- **Deployment Frequency**: Daily to staging, 2x/week to production
- **Lead Time**: <4 hours commit to production
- **Mean Time to Recovery**: <1 hour
- **Security Scan Coverage**: 100% automated
- **Performance Regression Detection**: <5% threshold