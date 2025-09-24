# ActivityWatch Firebase Entegrasyon Dokümantasyonu

## 1. ActivityWatch Server Firebase Entegrasyonu

**Oluşturulma Tarihi:** 2025-01-21 05:10:00  
**Modül:** aw-server Firebase Integration  
**Amaç:** aw-server backend'inin Firebase Cloud Functions ve Firestore ile tam entegrasyonu

### 1.1 Mevcut aw-server Analizi

#### 1.1.1 Ana Bileşenler
```python
# Mevcut aw-server yapısı
- ServerAPI: Core business logic (bucket/event management)
- REST API: Flask-RESTful endpoints (/0/buckets, /0/events, etc.)
- Datastore Interface: Abstract storage layer (memory, peewee)
- Query Engine: Query2 processing system
- WebUI Hosting: Static file serving ve SPA routing
- Settings: Configuration management
```

#### 1.1.2 Temel Endpoint'ler
```python
# api.py - Core Server Operations
class ServerAPI:
    def get_info() -> server_info
    def get_buckets() -> Dict[bucket_id, bucket_metadata]
    def create_bucket(bucket_id, type, client, hostname)
    def get_events(bucket_id, limit, start, end) -> List[Event]
    def create_events(bucket_id, events) -> Event
    def heartbeat(bucket_id, event, pulsetime) -> Event
    def query2(name, query, timeperiods, cache)
    def export_all() / import_all() # Bulk operations
    
# rest.py - HTTP Endpoints
- GET /0/info
- GET/POST /0/buckets/{bucket_id}
- GET/POST /0/buckets/{bucket_id}/events
- POST /0/buckets/{bucket_id}/heartbeat
- POST /0/query/
- GET/POST /0/export, /0/import
```

### 1.2 Firebase Server Architecture

#### 1.2.1 Cloud Functions Mimarisi
```typescript
// Firebase Cloud Functions Structure
functions/
├── api/
│   ├── info.ts              // GET /api/info
│   ├── buckets.ts           // Bucket CRUD operations
│   ├── events.ts            // Event management
│   ├── heartbeat.ts         // Real-time heartbeat processing
│   ├── query.ts             // Query2 engine
│   └── settings.ts          // User settings
├── triggers/
│   ├── onBucketCreate.ts    // Firestore triggers
│   ├── onEventCreate.ts     // Real-time data processing
│   └── onUserCreate.ts      // User initialization
├── scheduled/
│   ├── aggregation.ts       // Daily/hourly aggregations
│   ├── cleanup.ts           // Data retention policies
│   └── analytics.ts         // Usage analytics
└── utils/
    ├── auth.ts              // Authentication helpers
    ├── firestore.ts         // Database utilities
    └── validation.ts        // Data validation
```

#### 1.2.2 Firebase Services Integration
```typescript
// Firebase Services Configuration
interface FirebaseServerConfig {
  // Authentication
  auth: {
    providers: ['google', 'email', 'anonymous'];
    customClaims: ['admin', 'premium', 'device_limit'];
  };
  
  // Firestore Database
  firestore: {
    collections: {
      users: '/users/{userId}';
      buckets: '/users/{userId}/buckets/{bucketId}';
      events: '/users/{userId}/buckets/{bucketId}/events/{eventId}';
      aggregations: '/users/{userId}/aggregations/{period}';
      settings: '/users/{userId}/settings';
    };
  };
  
  // Cloud Functions
  functions: {
    region: 'us-central1';
    timeout: '540s';
    memory: '2GB';
    maxInstances: 1000;
  };
  
  // Hosting
  hosting: {
    site: 'activitywatch-app';
    customDomain: 'app.activitywatch.net';
    headers: [
      {source: '/api/**', headers: [{key: 'Cache-Control', value: 'no-cache'}]}
    ];
  };
}
```

### 1.3 Authentication & Authorization

#### 1.3.1 Firebase Auth Integration
```typescript
// auth.ts - Authentication Middleware
import { auth } from 'firebase-admin';
import { CallableContext, HttpsError } from 'firebase-functions/v2/https';

interface AuthenticatedUser {
  uid: string;
  email?: string;
  customClaims?: {
    admin?: boolean;
    premium?: boolean;
    device_limit?: number;
  };
}

export async function authenticateUser(context: CallableContext): Promise<AuthenticatedUser> {
  if (!context.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }
  
  const user = await auth().getUser(context.auth.uid);
  return {
    uid: user.uid,
    email: user.email,
    customClaims: user.customClaims as any
  };
}

export function requireAuth(handler: Function) {
  return async (data: any, context: CallableContext) => {
    const user = await authenticateUser(context);
    return handler(data, context, user);
  };
}

// Multi-device authorization
export async function checkDeviceLimit(userId: string, deviceId: string): Promise<boolean> {
  const userDoc = await firestore().collection('users').doc(userId).get();
  const userData = userDoc.data();
  
  if (!userData) return false;
  
  const deviceLimit = userData.customClaims?.device_limit || 3;
  const registeredDevices = userData.devices || [];
  
  if (registeredDevices.includes(deviceId)) return true;
  if (registeredDevices.length < deviceLimit) {
    // Register new device
    await userDoc.ref.update({
      devices: [...registeredDevices, deviceId],
      lastSeen: new Date()
    });
    return true;
  }
  
  return false;
}
```

#### 1.3.2 User Management
```typescript
// triggers/onUserCreate.ts - User Initialization
export const onUserCreate = functions.auth.user().onCreate(async (user) => {
  const defaultSettings = {
    startOfDay: '06:00',
    startOfWeek: 'monday',
    timezone: 'UTC',
    dataRetention: '1year',
    privacyMode: false,
    createdAt: new Date(),
    lastActive: new Date()
  };
  
  await firestore().collection('users').doc(user.uid).set({
    email: user.email,
    devices: [],
    settings: defaultSettings,
    quota: {
      events: 0,
      buckets: 0,
      queries: 0
    },
    customClaims: {
      device_limit: 3,
      premium: false
    }
  });
});
```

### 1.4 Cloud Functions Endpoints

#### 1.4.1 Server Info Endpoint
```typescript
// api/info.ts
import { onCall } from 'firebase-functions/v2/https';
import { requireAuth } from '../utils/auth';

export const getServerInfo = onCall(requireAuth(async (data, context, user) => {
  const serverInfo = {
    version: '0.13.0-firebase',
    hostname: 'firebase-cloud',
    testing: false,
    device_id: await getOrCreateDeviceId(user.uid, data.deviceId),
    userId: user.uid,
    features: {
      realtime: true,
      multiDevice: true,
      cloudSync: true,
      analytics: true
    },
    limits: {
      events_per_day: user.customClaims?.premium ? 100000 : 10000,
      buckets_per_user: user.customClaims?.premium ? 50 : 10,
      queries_per_day: user.customClaims?.premium ? 1000 : 100
    }
  };
  
  return serverInfo;
}));

async function getOrCreateDeviceId(userId: string, clientDeviceId?: string): Promise<string> {
  if (clientDeviceId) {
    const canUseDevice = await checkDeviceLimit(userId, clientDeviceId);
    if (canUseDevice) return clientDeviceId;
  }
  
  // Generate new device ID
  const newDeviceId = `firebase-${userId}-${Date.now()}`;
  await checkDeviceLimit(userId, newDeviceId);
  return newDeviceId;
}
```

#### 1.4.2 Bucket Management
```typescript
// api/buckets.ts
import { onCall } from 'firebase-functions/v2/https';
import { firestore } from 'firebase-admin';
``` 

## 2. ActivityWatch Qt Firebase Entegrasyonu

**Oluşturulma Tarihi:** 2025-01-21 04:55:00
**Modül:** aw-qt Firebase Integration
**Amaç:** aw-qt tray icon ve module manager'ın Firebase ile tam entegrasyonu

### 2.1 Mevcut aw-qt Analizi

#### 2.1.1 Ana Bileşenler
```python
# Mevcut aw-qt yapısı
- TrayIcon: Sistem tray icon ve context menu
- Manager: Module discovery ve process management
- Module: Individual module representation ve control
- Config: autostart_modules ve diğer ayarlar
```

#### 2.1.2 Temel İşlevler
```python
# manager.py - Module Management
def _discover_modules_bundled() -> List[Module]
def _discover_modules_system() -> List[Module]
class Manager:
    def autostart(self, autostart_modules: List[str])
    def start/stop/toggle module operations
    
# trayicon.py - UI Integration  
class TrayIcon:
    def _build_rootmenu() -> context menu
    def open_webui(root_url) -> localhost dashboard
```

### 2.2 Firebase Qt Integration Mimarisi

#### 2.2.1 Firebase SDK Integration
```python
# Firebase Qt Client
import firebase_admin
from firebase_admin import credentials, firestore, auth
from google.cloud.firestore_v1 import Client
from PyQt6.QtCore import QThread, pyqtSignal

class FirebaseQtClient(QObject):
    # Authentication signals
    auth_success = pyqtSignal(dict)  # user_info
    auth_failed = pyqtSignal(str)    # error_message
    
    # Module status signals  
    module_status_changed = pyqtSignal(str, bool)  # module_name, is_running
    config_updated = pyqtSignal(dict)              # new_config
    
    def __init__(self):
        self.db = firestore.client()
        self.current_user = None
        self.device_id = self._generate_device_id()
        
    def authenticate(self, email: str, password: str):
        # Firebase Auth integration
        
    def sync_module_status(self, module_name: str, status: bool):
        # Real-time module status sync
        
    def sync_configuration(self, config: dict):
        # Cross-device config synchronization
```

#### 2.2.2 Cloud-enabled Module Manager
```python
class FirebaseManager(Manager):
    def __init__(self, testing: bool = False):
        super().__init__(testing)
        self.firebase_client = FirebaseQtClient()
        self.cloud_modules = {}  # Firebase-enabled modules
        self.sync_enabled = True
        
        # Firebase listeners
        self.firebase_client.auth_success.connect(self.on_auth_success)
        self.firebase_client.module_status_changed.connect(self.on_remote_module_change)
        
    def discover_modules(self):
        # Hybrid discovery: local + cloud modules
        local_modules = super().discover_modules()
        cloud_modules = self._discover_cloud_modules()
        return self._merge_module_lists(local_modules, cloud_modules)
        
    def _discover_cloud_modules(self) -> List[CloudModule]:
        # Firebase-based module discovery
        if not self.firebase_client.current_user:
            return []
            
        user_config = self.firebase_client.get_user_config()
        enabled_cloud_modules = user_config.get('cloud_modules', [])
        
        cloud_modules = []
        for module_config in enabled_cloud_modules:
            module = CloudModule(
                name=module_config['name'],
                type='cloud',
                endpoint=module_config['endpoint'],
                region=module_config['region']
            )
            cloud_modules.append(module)
        return cloud_modules
        
    def start(self, module_name: str):
        module = self._get_module(module_name)
        if isinstance(module, CloudModule):
            # Start cloud module via Firebase Cloud Functions
            success = self._start_cloud_module(module)
        else:
            # Start local module
            success = super().start(module_name)
            
        if success and self.sync_enabled:
            # Sync status to Firebase
            self.firebase_client.sync_module_status(module_name, True)
```

### 2.3 Real-time Module Status Synchronization

#### 2.3.1 Firebase Realtime Listeners
```python
class ModuleStatusSync(QThread):
    status_changed = pyqtSignal(str, bool, str)  # module, status, device_id
    
    def __init__(self, firebase_client: FirebaseQtClient):
        super().__init__()
        self.firebase_client = firebase_client
        self.user_id = None
        
    def run(self):
        # Firestore real-time listener
        def on_snapshot(doc_snapshot, changes, read_time):
            for doc in doc_snapshot:
                module_data = doc.to_dict()
                self.status_changed.emit(
                    module_data['name'],
                    module_data['status'],
                    module_data['device_id']
                )
                
        # Listen to user's module status collection
        doc_ref = self.firebase_client.db.collection('users')\
                      .document(self.user_id)\
                      .collection('module_status')
        doc_watch = doc_ref.on_snapshot(on_snapshot)
        
    def sync_status(self, module_name: str, status: bool):
        doc_ref = self.firebase_client.db.collection('users')\
                      .document(self.user_id)\
                      .collection('module_status')\
                      .document(module_name)
        doc_ref.set({
            'name': module_name,
            'status': status,
            'device_id': self.firebase_client.device_id,
            'timestamp': firestore.SERVER_TIMESTAMP,
            'device_info': {
                'hostname': platform.node(),
                'platform': platform.system(),
                'python_version': platform.python_version()
            }
        })
```

#### 2.3.2 Cross-device Status Handling
```python
class DeviceStatusManager:
    def __init__(self, firebase_manager: FirebaseManager):
        self.manager = firebase_manager
        self.device_conflicts = {}
        
    def handle_remote_status_change(self, module_name: str, status: bool, source_device: str):
        local_module = self.manager._get_module(module_name)
        if not local_module:
            return
            
        current_local_status = local_module.is_alive()
        
        if current_local_status != status:
            # Status conflict between devices
            self._handle_status_conflict(module_name, status, source_device)
            
    def _handle_status_conflict(self, module_name: str, remote_status: bool, source_device: str):
        # Conflict resolution strategies:
        # 1. Last-write-wins
        # 2. Master device priority  
        # 3. User confirmation dialog
        
        conflict_resolution = self.manager.config.get('conflict_resolution', 'user_confirm')
        
        if conflict_resolution == 'user_confirm':
            self._show_conflict_dialog(module_name, remote_status, source_device)
        elif conflict_resolution == 'last_write_wins':
            self._apply_remote_status(module_name, remote_status)
        elif conflict_resolution == 'master_device':
            self._apply_master_device_logic(module_name, remote_status, source_device)
```

### 2.4 Firebase-hosted Web UI Integration

#### 2.4.1 Dynamic URL Configuration
```python
class FirebaseWebUIManager:
    def __init__(self, firebase_client: FirebaseQtClient):
        self.firebase_client = firebase_client
        self.web_ui_urls = {
            'local': 'http://localhost:5600',
            'cloud': None  # Will be fetched from Firebase config
        }
        
    def get_dashboard_url(self) -> str:
        if self.firebase_client.current_user:
            # Get user's Firebase-hosted dashboard URL
            user_config = self.firebase_client.get_user_config()
            cloud_dashboard = user_config.get('web_ui_endpoint')
            
            if cloud_dashboard and self._is_cloud_dashboard_available(cloud_dashboard):
                return f"{cloud_dashboard}/dashboard"
        
        # Fallback to local dashboard
        return f"{self.web_ui_urls['local']}/dashboard"
        
    def get_api_browser_url(self) -> str:
        base_url = self.get_dashboard_url().replace('/dashboard', '')
        return f"{base_url}/api"
        
    def _is_cloud_dashboard_available(self, url: str) -> bool:
        try:
            response = requests.head(url, timeout=3)
            return response.status_code == 200
        except:
            return False
```

#### 2.4.2 Enhanced Tray Icon Menu
```python
class FirebaseTrayIcon(TrayIcon):
    def __init__(self, manager: FirebaseManager, icon: QIcon, parent=None, testing=False):
        super().__init__(manager, icon, parent, testing)
        self.firebase_manager = manager
        self.web_ui_manager = FirebaseWebUIManager(manager.firebase_client)
        
        # Connect Firebase signals
        manager.firebase_client.auth_success.connect(self._on_firebase_auth)
        manager.firebase_client.auth_failed.connect(self._on_firebase_auth_failed)
        
    def _build_rootmenu(self):
        menu = QMenu(self._parent)
        
``` 

## 3. ActivityWatch Notifications Firebase Entegrasyonu

**Oluşturulma Tarihi:** 2025-01-21 04:45:00
**Modül:** aw-notify Firebase Integration
**Amaç:** aw-notify modülünün Firebase ile tam entegrasyonu

### 3.1 Mevcut aw-notify Analizi

#### 3.1.1 Temel Özellikler
```python
# Mevcut ana özellikler
- Kategori bazlı zaman takibi
- Threshold-based alerts (15min, 30min, 1h, 2h, 4h, 6h, 8h)
- Günlük/saatlik check-in bildirimleri
- Server durumu monitoring
- Cache sistemi (TTL-based in-memory)
- macOS/Windows/Linux desktop notifications
```

#### 3.1.2 Mevcut Veri Akışı
```python
# aw-notify/aw_notify/main.py - get_time() fonksiyonu
canonicalQuery = aw_client.queries.canonicalEvents(
    aw_client.queries.DesktopQueryParams(
        bid_window=f"aw-watcher-window_{hostname}",
        bid_afk=f"aw-watcher-afk_{hostname}",
    )
)
query = f"""
{canonicalQuery}
duration = sum_durations(events);
cat_events = sort_by_duration(merge_events_by_keys(events, ["$category"]));
RETURN = {{"events": events, "duration": duration, "cat_events": cat_events}};
"""
```

#### 3.1.3 CategoryAlert Sınıfı
```python
class CategoryAlert:
    def __init__(self, category: str, thresholds: list[timedelta], label: str, positive=False):
        self.category = category
        self.thresholds = thresholds
        self.max_triggered = timedelta()
        self.time_spent = timedelta()
        self.positive = positive
```

### 3.2 Firebase Veri Modeli

#### 3.2.1 Notification Collections
```typescript
// Firestore Collections Structure
/users/{userId}/notification_preferences
  - categories: CategoryConfig[]
  - general_settings: NotificationSettings
  - device_tokens: string[]          // FCM tokens
  - timezone: string
  - created_at: timestamp
  - updated_at: timestamp

/users/{userId}/notification_history/{notificationId}
  - type: string                     // "threshold", "checkin", "goal"
  - category: string
  - threshold_reached: number        // seconds
  - time_spent: number              // seconds
  - message: string
  - sent_at: timestamp
  - device_id: string
  - acknowledged: boolean

/users/{userId}/category_stats/{date}
  - date: string                    // "2025-01-21"
  - categories: CategoryStats[]
  - last_updated: timestamp
  - device_id: string

/global/notification_templates
  - threshold_reached: MessageTemplate
  - goal_achieved: MessageTemplate
  - daily_checkin: MessageTemplate
  - weekly_summary: MessageTemplate
```

#### 3.2.2 TypeScript Interfaces
```typescript
interface CategoryConfig {
  name: string;                     // "Work", "Twitter", "Youtube", etc.
  label: string;                    // Display name with emoji
  thresholds: number[];             // [900, 1800, 3600, 7200] seconds
  positive: boolean;                // Goal vs limit
  enabled: boolean;
  color?: string;                   // For UI
  icon?: string;                    // Emoji or icon name
}

interface NotificationSettings {
  enabled: boolean;
  quiet_hours: {
    enabled: boolean;
    start: string;                  // "22:00"
    end: string;                    // "08:00"
  };
  daily_checkin: {
    enabled: boolean;
    time: string;                   // "17:00"
  };
  hourly_checkin: {
    enabled: boolean;
    only_when_active: boolean;
  };
  new_day_notification: boolean;
  server_status_alerts: boolean;
  sound_enabled: boolean;
  vibration_enabled: boolean;
}

interface CategoryStats {
  name: string;
  time_spent: number;               // seconds
  max_triggered: number;            // highest threshold reached today
  last_triggered: timestamp;
  sessions: ActivitySession[];
}

interface ActivitySession {
  start: timestamp;
  end: timestamp;
  duration: number;                 // seconds
  events_count: number;
}

interface MessageTemplate {
  title: string;
  body: string;
  variables: string[];              // ["category", "time", "threshold"]
  localization: Record<string, {title: string, body: string}>;
}
```

### 3.3 Firebase Client Integration

#### 3.3.1 Firebase Configuration
```typescript
// firebase-config.ts
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getMessaging } from 'firebase/messaging';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  // Firebase project configuration
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const messaging = getMessaging(app);
export const auth = getAuth(app);
```

#### 3.3.2 Firebase Client Class
```typescript
// firebase-notify-client.ts
import { 
  collection, 
  doc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  Timestamp,
  updateDoc,
  setDoc,
  getDoc
} from 'firebase/firestore';
import { onMessage, getToken } from 'firebase/messaging';

class FirebaseNotifyClient {
  private userId: string;
  private deviceId: string;
  private unsubscribers: (() => void)[] = [];

  constructor(userId: string, deviceId: string) {
    this.userId = userId;
    this.deviceId = deviceId;
  }

  async initialize(): Promise<void> {
    await this.setupFCM();
    this.startRealTimeListeners();
  }

  async setupFCM(): Promise<void> {
    try {
      const token = await getToken(messaging, {
        vapidKey: process.env.FIREBASE_VAPID_KEY
      });
      
      if (token) {
        await this.updateDeviceToken(token);
      }
    } catch (error) {
      console.error('FCM setup failed:', error);
    }

    // Listen for foreground messages
    onMessage(messaging, (payload) => {
      this.handleForegroundMessage(payload);
    });
  }

  async updateDeviceToken(token: string): Promise<void> {
    const userRef = doc(db, `users/${this.userId}/notification_preferences/main`);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const data = userDoc.data();
      const tokens = data.device_tokens || [];
      
      if (!tokens.includes(token)) {
        await updateDoc(userRef, {
          device_tokens: [...tokens, token],
          updated_at: Timestamp.now()
        });
      }
    }
  }

  startRealTimeListeners(): void {
    // Listen to category stats changes
    const statsQuery = query(
      collection(db, `users/${this.userId}/category_stats`),
      where('date', '==', this.getTodayDateKey()),
      orderBy('last_updated', 'desc')
    );

    const unsubStats = onSnapshot(statsQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added' || change.type === 'modified') {
          this.handleCategoryStatsUpdate(change.doc.data());
        }
      });
    });

    this.unsubscribers.push(unsubStats);

    // Listen to notification preferences changes
    const prefsRef = doc(db, `users/${this.userId}/notification_preferences/main`);
    const unsubPrefs = onSnapshot(prefsRef, (doc) => {
      if (doc.exists()) {
        this.handlePreferencesUpdate(doc.data());
``` 

## 4. ActivityWatch Core Firebase Entegrasyonu

Tarih: 2025-07-09 15:18:57

### 4.1 Genel Bakış

Bu doküman ActivityWatch core yapısının Firebase ile entegrasyonu için endpoint tasarımı, veri modelleri ve mimari yaklaşımı tanımlar. Mevcut ActivityWatch altyapısıyla uyumlu, gelecekteki geliştirmeler için esnek bir yapı sunar.

### 4.2 ActivityWatch Core Yapısı Analizi

#### 4.2.1 Ana Bileşenler

1.  **Event Model** (`aw_core.models.Event`)
    *   `id`: Olay benzersiz kimliği
    *   `timestamp`: Zaman damgası (UTC)
    *   `duration`: Süre (timedelta)
    *   `data`: Olay verisi (dict)

2.  **Datastore** (`aw_datastore.Datastore`)
    *   Bucket yönetimi
    *   Event CRUD işlemleri
    *   Zaman tabanlı sorgular

3.  **Query Engine** (`aw_query`)
    *   Query fonksiyonları
    *   Transform işlemleri
    *   Analitik hesaplamalar

4.  **Transform Operations** (`aw_transform`)
    *   Veri dönüşümleri
    *   Filtreleme işlemleri
    *   Gruplama ve birleştirme

### 4.3 Firebase Entegrasyon Stratejisi

#### 4.3.1 Veri Modeli Uyumluluk

##### ActivityWatch Event → Firebase Document
```typescript
interface FirebaseEvent {
  // ActivityWatch Core uyumlu
  id: string;                    // Event.id
  timestamp: number;             // Event.timestamp (milliseconds)
  duration: number;              // Event.duration (seconds)
  data: Record<string, any>;     // Event.data
  
  // Firebase özel alanlar
  user_id: string;               // Kullanıcı kimliği
  bucket_id: string;             // Bucket kimliği
  device_id: string;             // Cihaz kimliği
  
  // Metadata
  created_at: number;            // Firestore creation time
  updated_at: number;            // Last update time
  version: number;               // Version control
}
```

#### 4.3.2 Bucket Structure

ActivityWatch bucket yapısı Firebase collection yapısına dönüştürülür:

```
users/{userId}/buckets/{bucketId}/events/{eventId}
```

##### Bucket Metadata
```typescript
interface BucketMetadata {
  id: string;                    // Bucket ID
  name: string;                  // Bucket name
  type: string;                  // Bucket type (aw-watcher-window, aw-watcher-afk, etc.)
  client: string;                // Client name
  hostname: string;              // Device hostname
  created: string;               // Creation timestamp (ISO string)
  data: Record<string, any>;     // Additional metadata
  
  // Firebase extensions
  user_id: string;
  device_info: {
    platform: string;
    version: string;
  };
  sync_status: 'active' | 'paused' | 'disabled';
  last_sync: number;
}
```

### 4.4 API Endpoint Tasarımı

#### 4.4.1 Core CRUD Operations

##### Bucket Management
```typescript
// GET /api/v1/buckets
// POST /api/v1/buckets
// PUT /api/v1/buckets/{bucketId}
// DELETE /api/v1/buckets/{bucketId}
```

##### Event Management
```typescript
// GET /api/v1/buckets/{bucketId}/events
// POST /api/v1/buckets/{bucketId}/events
// PUT /api/v1/buckets/{bucketId}/events/{eventId}
// DELETE /api/v1/buckets/{bucketId}/events/{eventId}
```

#### 4.4.2 Query Engine Endpoints

##### Query Execution
```typescript
// POST /api/v1/query
{
  "name": "query_name",
  "query": "events = query_bucket('bucket_id'); RETURN = events;",
  "starttime": "2025-07-09T00:00:00Z",
  "endtime": "2025-07-09T23:59:59Z"
}
```

##### Transform Operations
```typescript
// POST /api/v1/transform/filter_keyvals
// POST /api/v1/transform/merge_events_by_keys
// POST /api/v1/transform/categorize
// POST /api/v1/transform/flood
```

#### 4.4.3 Analytics Endpoints

##### Focus Score Calculation
```typescript
// POST /api/v1/analytics/focus_score
{
  "activities": ActivityEvent[],
  "timeWindow": {
    "start": "2025-07-09T09:00:00Z",
    "end": "2025-07-09T17:00:00Z"
  }
}
```

##### Daily Summary
```typescript
// GET /api/v1/analytics/daily_summary
// Query parameters: date, timezone
```

### 4.5 Cloud Functions Architecture

#### 4.5.1 HTTP Triggers (RESTful API)

```typescript
// src/api/buckets-api.ts
export const bucketsApi = onRequest({
  cors: { origin: true },
  rateLimits: { maxConcurrentRequests: 100 }
}, async (req, res) => {
  // Bucket CRUD operations
});

// src/api/events-api.ts
export const eventsApi = onRequest({
  cors: { origin: true },
  rateLimits: { maxConcurrentRequests: 200 }
}, async (req, res) => {
  // Event CRUD operations
});

// src/api/query-api.ts
export const queryApi = onRequest({
  cors: { origin: true },
  memory: '1GiB',
  timeoutSeconds: 300
}, async (req, res) => {
  // Query execution
});
```

#### 4.5.2 Callable Functions

```typescript
// src/functions/analytics.ts
export const calculateFocusScore = onCall({
  memory: '512MiB',
  timeoutSeconds: 120
}, async (request) => {
  // ActivityWatch transform operations
});

export const processActivityBatch = onCall({
  memory: '1GiB',
  timeoutSeconds: 300
}, async (request) => {
  // Batch activity processing
});
```

#### 4.5.3 Firestore Triggers

```typescript
// src/triggers/event-triggers.ts
export const onEventCreated = onDocumentCreated(
  'users/{userId}/buckets/{bucketId}/events/{eventId}',
  async (event) => {
    // Real-time analytics update
    // Category analysis
    // Focus score calculation
  }
);
```

### 4.6 Query Engine Port

#### 4.6.1 Query Functions Implementation

ActivityWatch query fonksiyonları Firebase Cloud Functions olarak port edilir:

```typescript
// src/services/query-service.ts
export class QueryService {
  static async executeQuery(
    userId: string,
    query: string,
    starttime: string,
    endtime: string
  ) {
    const namespace = {
      STARTTIME: starttime,
      ENDTIME: endtime,
      userId: userId
    };
    
    // Parse and execute query
    return await this.interpretQuery(query, namespace);
  }
  
  static async queryBucket(
    userId: string, 
    bucketId: string, 
    starttime?: Date, 
    endtime?: Date
  ): Promise<ActivityEvent[]> {
    // Firestore query implementation
  }
}
```

#### 4.6.2 Transform Operations
``` 