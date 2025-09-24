---
applyTo: "**/*.py,**/requirements.txt,**/pyproject.toml"
description: "ActivityWatch ile uyumlu Python geliştirme standartları"
---

# ActivityWatch Python Geliştirme Standartları

Bu dosya, ActivityWatch ekosistemi ile uyumlu Python kod geliştirme standartlarını tanımlar.

## ActivityWatch Core Integration

### Event Data Structure
```python
from aw_core.models import Event
from datetime import datetime, timezone
from typing import Dict, Any, Optional

class ActivityEvent:
    """ActivityWatch uyumlu event yapısı"""
    
    def __init__(
        self,
        timestamp: Optional[datetime] = None,
        duration: float = 0,
        data: Optional[Dict[str, Any]] = None
    ):
        self.timestamp = timestamp or datetime.now(timezone.utc)
        self.duration = duration
        self.data = data or {}
    
    def to_aw_event(self) -> Event:
        """ActivityWatch Event formatına dönüştür"""
        return Event(
            timestamp=self.timestamp,
            duration=self.duration,
            data=self.data
        )
    
    @classmethod
    def from_aw_event(cls, aw_event: Event) -> 'ActivityEvent':
        """ActivityWatch Event'ten oluştur"""
        return cls(
            timestamp=aw_event.timestamp,
            duration=aw_event.duration,
            data=aw_event.data
        )
```

### Bucket Management
```python
from aw_core.models import Bucket
from aw_datastore import Datastore

class ActivityBucketManager:
    """ActivityWatch bucket yönetimi"""
    
    def __init__(self, datastore: Datastore):
        self.datastore = datastore
    
    def create_bucket(
        self,
        bucket_id: str,
        type_: str,
        client: str,
        hostname: str,
        **kwargs
    ) -> None:
        """Yeni bucket oluştur"""
        try:
            bucket = self.datastore.get_bucket(bucket_id)
            if bucket:
                logger.info(f"Bucket {bucket_id} zaten mevcut")
                return
        except Exception:
            pass
        
        self.datastore.create_bucket(
            bucket_id=bucket_id,
            type_=type_,
            client=client,
            hostname=hostname,
            **kwargs
        )
        logger.info(f"Bucket {bucket_id} oluşturuldu")
    
    def insert_events(self, bucket_id: str, events: List[Event]) -> None:
        """Events'leri bucket'a ekle"""
        bucket = self.datastore.get_bucket(bucket_id)
        inserted_count = bucket.insert(events)
        logger.info(f"{bucket_id} bucket'ına {inserted_count} event eklendi")
```

## Watcher Development Pattern

### Base Watcher Structure
```python
import logging
import time
from abc import ABC, abstractmethod
from typing import Optional, Dict, Any
from aw_client import ActivityWatchClient

logger = logging.getLogger(__name__)

class BaseWatcher(ABC):
    """Temel watcher implementasyonu"""
    
    def __init__(
        self,
        client_name: str,
        bucket_type: str,
        hostname: Optional[str] = None,
        testing: bool = False
    ):
        self.client_name = client_name
        self.bucket_type = bucket_type
        self.hostname = hostname
        self.testing = testing
        self.client = ActivityWatchClient(client_name, testing=testing)
        self.bucket_id = f"{client_name}_{hostname or 'unknown'}"
        
        # Bucket'ı oluştur
        self.client.create_bucket(
            bucket_id=self.bucket_id,
            type_=bucket_type,
            hostname=hostname
        )
        
    @abstractmethod
    def get_current_data(self) -> Optional[Dict[str, Any]]:
        """Mevcut aktivite verisini topla"""
        pass
    
    def heartbeat(self, data: Dict[str, Any], pulsetime: float = 10.0) -> None:
        """Heartbeat gönder"""
        now = datetime.now(timezone.utc)
        event = Event(timestamp=now, duration=0, data=data)
        
        self.client.heartbeat(
            bucket_id=self.bucket_id,
            event=event,
            pulsetime=pulsetime
        )
        
    def run(self, poll_time: float = 1.0, pulsetime: float = 10.0) -> None:
        """Ana watch döngüsü"""
        logger.info(f"{self.client_name} watcher başlatıldı")
        
        try:
            while True:
                data = self.get_current_data()
                if data:
                    self.heartbeat(data, pulsetime)
                
                time.sleep(poll_time)
                
        except KeyboardInterrupt:
            logger.info(f"{self.client_name} watcher durduruldu")
        except Exception as e:
            logger.error(f"Watcher hatası: {e}")
            raise
```

### Custom Watcher Example
```python
class FocusWatcher(BaseWatcher):
    """Odaklanma kalitesi izleyicisi"""
    
    def __init__(self, **kwargs):
        super().__init__(
            client_name="aw-watcher-focus",
            bucket_type="focus.quality",
            **kwargs
        )
        self.last_app = None
        self.app_switch_count = 0
        self.session_start = time.time()
    
    def get_current_data(self) -> Optional[Dict[str, Any]]:
        """Mevcut odaklanma verisi"""
        try:
            # Aktif pencere bilgisini al (platform specific)
            current_app = self.get_active_window_app()
            
            # App değişikliği algıla
            if self.last_app and current_app != self.last_app:
                self.app_switch_count += 1
            
            self.last_app = current_app
            
            # Odaklanma skoru hesapla
            session_duration = time.time() - self.session_start
            focus_score = self.calculate_focus_score(
                session_duration, 
                self.app_switch_count
            )
            
            return {
                "current_app": current_app,
                "app_switches": self.app_switch_count,
                "session_duration": session_duration,
                "focus_score": focus_score
            }
            
        except Exception as e:
            logger.warning(f"Focus data toplanamadı: {e}")
            return None
    
    def calculate_focus_score(self, duration: float, switches: int) -> float:
        """Basit odaklanma skoru hesaplama"""
        if duration < 60:  # İlk dakika
            return 100.0
        
        # Switch rate penaltısı
        switch_rate = switches / (duration / 60)  # switches per minute
        penalty = min(switch_rate * 10, 50)  # Max %50 penalty
        
        return max(100 - penalty, 0)
```

## Firebase Integration Patterns

### Firestore Storage Backend
```python
from aw_datastore.storages.abstract import AbstractStorage
from google.cloud import firestore
from typing import List, Dict, Optional
import json

class FirestoreStorage(AbstractStorage):
    """ActivityWatch için Firestore storage backend"""
    
    def __init__(self, user_id: str, testing: bool = False):
        self.user_id = user_id
        self.testing = testing
        
        # Firestore client
        project_suffix = "-test" if testing else ""
        self.db = firestore.Client(project=f"peakactivity{project_suffix}")
        
        # Collection references
        self.buckets_ref = self.db.collection("users").document(user_id).collection("buckets")
        
    def create_bucket(
        self,
        bucket_id: str,
        type_: str,
        client: str,
        hostname: str,
        created: datetime,
        name: Optional[str] = None,
        data: Optional[Dict] = None
    ):
        """Firestore'da bucket oluştur"""
        bucket_doc = self.buckets_ref.document(bucket_id)
        
        bucket_data = {
            "id": bucket_id,
            "type": type_,
            "client": client, 
            "hostname": hostname,
            "created": created,
            "name": name,
            "data": data or {},
            "event_count": 0,
            "last_updated": datetime.now(timezone.utc)
        }
        
        bucket_doc.set(bucket_data)
        logger.info(f"Firestore bucket oluşturuldu: {bucket_id}")
        
    def insert_events(self, bucket_id: str, events: List[Event]) -> int:
        """Events'leri Firestore'a toplu ekle"""
        if not events:
            return 0
            
        events_ref = self.buckets_ref.document(bucket_id).collection("events")
        batch = self.db.batch()
        
        inserted_count = 0
        for event in events:
            # Event verilerini Firestore formatına dönüştür
            event_data = {
                "timestamp": event.timestamp,
                "duration": event.duration,
                "data": event.data,
                "bucket_id": bucket_id,
                "date_key": event.timestamp.strftime("%Y-%m-%d"),
                "hour_key": event.timestamp.strftime("%Y-%m-%d-%H"),
                "created_at": datetime.now(timezone.utc)
            }
            
            # Auto-generated document ID
            doc_ref = events_ref.document()
            batch.set(doc_ref, event_data)
            inserted_count += 1
        
        # Batch commit
        batch.commit()
        
        # Bucket event count güncelle
        self.buckets_ref.document(bucket_id).update({
            "event_count": firestore.Increment(inserted_count),
            "last_updated": datetime.now(timezone.utc)
        })
        
        logger.info(f"{bucket_id} bucket'ına {inserted_count} event eklendi")
        return inserted_count
```

## Error Handling ve Logging

### Structured Logging
```python
import logging
import json
from datetime import datetime
from typing import Dict, Any

class ActivityWatchLogger:
    """ActivityWatch için structured logging"""
    
    def __init__(self, component: str):
        self.logger = logging.getLogger(f"aw.{component}")
        self.component = component
        
    def log_event(self, level: str, message: str, **kwargs):
        """Structured log entry"""
        log_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "component": self.component,
            "message": message,
            **kwargs
        }
        
        getattr(self.logger, level)(json.dumps(log_data))
    
    def log_watcher_error(self, error: Exception, context: Dict[str, Any] = None):
        """Watcher hata logging"""
        self.log_event(
            "error",
            "Watcher hatası oluştu",
            error_type=type(error).__name__,
            error_message=str(error),
            context=context or {}
        )
    
    def log_data_sync(self, bucket_id: str, event_count: int, success: bool):
        """Veri senkronizasyon logging"""
        self.log_event(
            "info" if success else "error",
            "Veri senkronizasyonu tamamlandı" if success else "Veri senkronizasyonu başarısız",
            bucket_id=bucket_id,
            event_count=event_count,
            success=success
        )

# Usage
logger = ActivityWatchLogger("focus-watcher")
logger.log_watcher_error(Exception("Connection failed"), {"retry_count": 3})
```

## Configuration Management

### Settings Pattern
```python
from pathlib import Path
import configparser
from typing import Dict, Any, Optional

class ActivityWatchConfig:
    """ActivityWatch konfigürasyon yönetimi"""
    
    def __init__(self, config_dir: Optional[Path] = None):
        self.config_dir = config_dir or self.get_default_config_dir()
        self.config_file = self.config_dir / "aw-config.ini"
        self.config = configparser.ConfigParser()
        
        # Default configuration
        self.defaults = {
            "server": {
                "host": "localhost",
                "port": "5600",
                "storage": "peewee"
            },
            "client": {
                "commit_interval": "10",
                "hostname": "",
                "testing": "false"
            },
            "firebase": {
                "project_id": "",
                "user_id": "",
                "sync_enabled": "false"
            }
        }
        
        self.load_config()
    
    def load_config(self):
        """Konfigürasyonu yükle"""
        # Defaults'ları set et
        for section, options in self.defaults.items():
            self.config.add_section(section)
            for key, value in options.items():
                self.config.set(section, key, value)
        
        # Dosyadan yükle
        if self.config_file.exists():
            self.config.read(self.config_file)
        else:
            self.save_config()
    
    def save_config(self):
        """Konfigürasyonu kaydet"""
        self.config_dir.mkdir(parents=True, exist_ok=True)
        with open(self.config_file, 'w') as f:
            self.config.write(f)
    
    def get(self, section: str, key: str, fallback: Any = None) -> str:
        """Konfigürasyon değeri al"""
        return self.config.get(section, key, fallback=fallback)
    
    def set(self, section: str, key: str, value: str):
        """Konfigürasyon değeri set et"""
        self.config.set(section, key, value)
        self.save_config()
    
    @staticmethod
    def get_default_config_dir() -> Path:
        """Platform-specific config directory"""
        import platform
        
        if platform.system() == "Windows":
            return Path.home() / "AppData" / "Local" / "PeakActivity"
        elif platform.system() == "Darwin":
            return Path.home() / "Library" / "Application Support" / "PeakActivity"
        else:
            return Path.home() / ".config" / "peakactivity"
```

## Testing Patterns

### Watcher Testing
```python
import unittest
from unittest.mock import Mock, patch
from datetime import datetime, timezone

class TestFocusWatcher(unittest.TestCase):
    """Focus watcher test suite"""
    
    def setUp(self):
        self.watcher = FocusWatcher(testing=True)
        self.watcher.client = Mock()
    
    def test_focus_score_calculation(self):
        """Odaklanma skoru hesaplama testi"""
        # Yüksek focus (az switch)
        score = self.watcher.calculate_focus_score(3600, 2)  # 1 saat, 2 switch
        self.assertGreater(score, 80)
        
        # Düşük focus (çok switch)
        score = self.watcher.calculate_focus_score(3600, 30)  # 1 saat, 30 switch
        self.assertLess(score, 50)
    
    @patch('time.time', return_value=1000)
    def test_session_tracking(self, mock_time):
        """Session takip testi"""
        self.watcher.session_start = 500
        
        data = self.watcher.get_current_data()
        
        self.assertEqual(data["session_duration"], 500)
    
    def test_heartbeat_integration(self):
        """Heartbeat entegrasyon testi"""
        test_data = {"test": "data"}
        
        self.watcher.heartbeat(test_data)
        
        self.watcher.client.heartbeat.assert_called_once()

if __name__ == '__main__':
    unittest.main()
```
