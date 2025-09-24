import functools
import json
import logging
import re
from datetime import datetime
from pathlib import Path
from socket import gethostname
from typing import (
    Any,
    Dict,
    List,
    Optional,
)
from uuid import uuid4

import iso8601
from cachetools import TTLCache
from aw_core.dirs import get_data_dir
from aw_core.log import get_log_file_path
from aw_core.models import Event
from aw_query import query2
from aw_transform import heartbeat_merge
from aw_core import MANUAL_ACTIVITY_EVENT_TYPE, MICROSURVEY_EVENT_TYPE

from .__about__ import __version__
from .exceptions import NotFound
from .settings import Settings
from aw_server.firebase_datastore.firestore import FirestoreStorage
from aw_server.sync import DataSynchronizer
from aw_server.data_anonymization.anonymizer import Anonymizer

# Performance optimization imports
from .performance import (
    cached_query,
    profile_execution,
    profile_database,
    get_cache_manager,
    get_performance_profiler,
)

logger = logging.getLogger(__name__)


def get_device_id() -> str:
    path = Path(get_data_dir("aw-server")) / "device_id"
    if path.exists():
        with open(path) as f:
            return f.read()
    else:
        uuid = str(uuid4())
        with open(path, "w") as f:
            f.write(uuid)
        return uuid


def check_bucket_exists(f):
    @functools.wraps(f)
    def g(self, bucket_id, *args, **kwargs):
        if bucket_id not in self.db.buckets():
            raise NotFound("NoSuchBucket", f"There's no bucket named {bucket_id}")
        return f(self, bucket_id, *args, **kwargs)

    return g


class ServerAPI:
    def __init__(self, db, testing) -> None:
        self.db = db
        self.settings = Settings(testing)
        self.testing = testing
        # Önbellek: 1024 öğe, 300 saniye (5 dakika) TTL
        self.last_event_cache = TTLCache(maxsize=1024, ttl=300)
        self.firebase_db = FirestoreStorage(testing=testing) # Firestore depolamasını başlat
        self.synchronizer = DataSynchronizer(local_db=self.db, firebase_db=self.firebase_db) # Senkronizasyon nesnesini başlat
        self.anonymizer = Anonymizer() # Anonymizer başlat

    def get_info(self) -> Dict[str, Any]:
        """Get server info"""
        payload = {
            "hostname": gethostname(),
            "version": __version__,
            "testing": self.testing,
            "device_id": get_device_id(),
        }
        return payload

    def get_buckets(self) -> Dict[str, Dict]:
        """Get dict {bucket_name: Bucket} of all buckets"""
        logger.debug("Received get request for buckets")
        buckets = self.db.buckets()
        for b in buckets:
            # TODO: Move this code to aw-core?
            last_events = self.db[b].get(limit=1)
            if len(last_events) > 0:
                last_event = last_events[0]
                last_updated = last_event.timestamp + last_event.duration
                buckets[b]["last_updated"] = last_updated.isoformat()
        return buckets

    @check_bucket_exists
    def get_bucket_metadata(self, bucket_id: str) -> Dict[str, Any]:
        """Get metadata about bucket."""
        bucket = self.db[bucket_id]
        return bucket.metadata()

    @check_bucket_exists
    def export_bucket(self, bucket_id: str) -> Dict[str, Any]:
        """Export a bucket to a dataformat consistent across versions, including all events in it."""
        bucket = self.get_bucket_metadata(bucket_id)
        bucket["events"] = self.get_events(bucket_id, limit=-1)
        # Scrub event IDs
        for event in bucket["events"]:
            del event["id"]
        return bucket

    def export_all(self) -> Dict[str, Any]:
        """Exports all buckets and their events to a format consistent across versions"""
        buckets = self.get_buckets()
        exported_buckets = {}
        for bid in buckets.keys():
            exported_buckets[bid] = self.export_bucket(bid)
        return exported_buckets

    def import_bucket(self, bucket_data: Any):
        bucket_id = bucket_data["id"]
        logger.info(f"Importing bucket {bucket_id}")

        # TODO: Check that bucket doesn't already exist
        self.db.create_bucket(
            bucket_id,
            type=bucket_data["type"],
            client=bucket_data["client"],
            hostname=bucket_data["hostname"],
            created=(
                bucket_data["created"]
                if isinstance(bucket_data["created"], datetime)
                else iso8601.parse_date(bucket_data["created"])
            ),
        )

        # scrub IDs from events
        # (otherwise causes weird bugs with no events seemingly imported when importing events exported from aw-server-rust, which contains IDs)
        for event in bucket_data["events"]:
            if "id" in event:
                del event["id"]

        self.create_events(
            bucket_id,
            [Event(**e) if isinstance(e, dict) else e for e in bucket_data["events"]],
        )

    def import_all(self, buckets: Dict[str, Any]):
        for bid, bucket in buckets.items():
            self.import_bucket(bucket)

    def create_bucket(
        self,
        bucket_id: str,
        event_type: str,
        client: str,
        hostname: str,
        created: Optional[datetime] = None,
        data: Optional[Dict[str, Any]] = None,
    ) -> bool:
        """
        Create a bucket.

        If hostname is "!local", the hostname and device_id will be set from the server info.
        This is useful for watchers which are known/assumed to run locally but might not know their hostname (like aw-watcher-web).

        Returns True if successful, otherwise false if a bucket with the given ID already existed.
        """
        if created is None:
            created = datetime.now()
        if bucket_id in self.db.buckets():
            return False
        if hostname == "!local":
            info = self.get_info()
            if data is None:
                data = {}
            hostname = info["hostname"]
            data["device_id"] = info["device_id"]
        self.db.create_bucket(
            bucket_id,
            type=event_type,
            client=client,
            hostname=hostname,
            created=created,
            data=data,
        )
        return True

    @check_bucket_exists
    def update_bucket(
        self,
        bucket_id: str,
        event_type: Optional[str] = None,
        client: Optional[str] = None,
        hostname: Optional[str] = None,
        data: Optional[Dict[str, Any]] = None,
    ) -> None:
        """Update bucket metadata"""
        self.db.update_bucket(
            bucket_id,
            type=event_type,
            client=client,
            hostname=hostname,
            data=data,
        )
        return None

    @check_bucket_exists
    def delete_bucket(self, bucket_id: str) -> None:
        """Delete a bucket"""
        self.db.delete_bucket(bucket_id)
        logger.debug(f"Deleted bucket '{bucket_id}'")
        return None

    @check_bucket_exists
    def get_event(
        self,
        bucket_id: str,
        event_id: int,
    ) -> Optional[Event]:
        """Get a single event from a bucket"""
        logger.debug(
            f"Received get request for event {event_id} in bucket '{bucket_id}'"
        )
        event = self.db[bucket_id].get_by_id(event_id)
        return event.to_json_dict() if event else None

    @check_bucket_exists
    @cached_query(ttl=60)  # Cache query results for 1 minute
    @profile_database("select")  # Profile database query performance
    def get_events(
        self,
        bucket_id: str,
        limit: int = 500,
        start: Optional[datetime] = None,
        end: Optional[datetime] = None,
    ) -> List[Event]:
        """Get events from a bucket with performance optimization"""
        logger.debug(f"Received get request for events in bucket '{bucket_id}'")
        if limit is None or limit < 0:
            limit = 500  # Varsayılan limiti ayarla
        # Üst bir limit belirleyerek kontrolsüz veri çekmeyi önle
        if limit > 5000:
            limit = 5000

        events = [
            event.to_json_dict() for event in self.db[bucket_id].get(limit, start, end)
        ]
        return events

    @check_bucket_exists
    def create_events(self, bucket_id: str, events: List[Event]) -> Optional[Event]:
        """Create events for a bucket. Can handle both single events and multiple ones.

        Returns the inserted event when a single event was inserted, otherwise None."""
        return self.db[bucket_id].insert(events)

    @check_bucket_exists
    def create_raw_events(self, bucket_id: str, events: List[Event]) -> Optional[Event]:
        """Create raw events for a bucket, with optional anonymization.

        Returns the inserted event when a single event was inserted, otherwise None."""
        anonymized_events = []
        for event in events:
            anonymized_events.append(self.anonymizer.anonymize_event(event.to_json_dict()))

        # Convert back to Event objects after anonymization
        events_to_insert = [Event(**e) for e in anonymized_events]

        return self.db[bucket_id].insert(events_to_insert)

    @check_bucket_exists
    def create_encrypted_ai_events(self, bucket_id: str, encrypted_events: List[Dict[str, Any]]) -> Optional[Event]:
        """Create encrypted and AI-enabled events for a bucket.

        This method will decrypt the events (placeholder for now) and prepare them for AI processing.
        Returns the inserted event when a single event was inserted, otherwise None."""
        # TODO: Şifreli veriyi çözme (Decryption service henüz implemente edilmedi)
        decrypted_events_data = []
        for event_data in encrypted_events:
            # Şifreli verinin metadata'sını al (örneğin, iv, salt, algorithm)
            # encrypted_payload = event_data["payload"]
            # metadata = event_data["metadata"]
            
            # Şimdilik sadece payload'u alıp Event objesine dönüştürüyoruz
            # Gerçekte burada şifre çözme işlemi olacak
            decrypted_events_data.append(event_data.get("payload", {})) 

        # Verify and convert to Event objects (similar to create_raw_events)
        events_to_insert = []
        for event_data in decrypted_events_data:
            try:
                event_obj = Event(**event_data)
                events_to_insert.append(event_obj)
            except Exception as e:
                logger.error(f"Şifresi çözülmüş olay verisi doğrulanamadı: {e}")
                raise ValueError("Geçersiz şifresi çözülmüş olay verisi")

        # AI işleme adımları (sonraki görevlerde implemente edilecek)
        # self.ai_processor.process_events(events_to_insert)

        return self.db[bucket_id].insert(events_to_insert)

    @check_bucket_exists
    def create_encrypted_noai_events(self, bucket_id: str, encrypted_events: List[Dict[str, Any]]) -> Optional[Event]:
        """Create encrypted events for a bucket without AI processing.

        This method will decrypt the events (placeholder for now) and store them directly.
        Returns the inserted event when a single event was inserted, otherwise None."""
        # TODO: Şifreli veriyi çözme (Decryption service henüz implemente edilmedi)
        decrypted_events_data = []
        for event_data in encrypted_events:
            # Şifreli verinin metadata'sını al (örneğin, iv, salt, algorithm)
            # encrypted_payload = event_data["payload"]
            # metadata = event_data["metadata"]

            # Şimdilik sadece payload'u alıp Event objesine dönüştürüyoruz
            # Gerçekte burada şifre çözme işlemi olacak
            decrypted_events_data.append(event_data.get("payload", {}))

        # Verify and convert to Event objects (similar to create_raw_events)
        events_to_insert = []
        for event_data in decrypted_events_data:
            try:
                event_obj = Event(**event_data)
                events_to_insert.append(event_obj)
            except Exception as e:
                logger.error(f"Şifresi çözülmüş olay verisi doğrulanamadı: {e}")
                raise ValueError("Geçersiz şifresi çözülmüş olay verisi")

        return self.db[bucket_id].insert(events_to_insert)

    @check_bucket_exists
    def get_eventcount(
        self,
        bucket_id: str,
        start: Optional[datetime] = None,
        end: Optional[datetime] = None,
    ) -> int:
        """Get eventcount from a bucket"""
        logger.debug(f"Received get request for eventcount in bucket '{bucket_id}'")
        return self.db[bucket_id].get_eventcount(start, end)

    @check_bucket_exists
    def delete_event(self, bucket_id: str, event_id) -> bool:
        """Delete a single event from a bucket"""
        return self.db[bucket_id].delete(event_id)

    @check_bucket_exists
    def _get_last_event(self, bucket_id: str) -> Event | None:
        """Get the last event from cache or database for a given bucket."""
        last_event = self.last_event_cache.get(bucket_id)
        
        if not last_event:
            last_events = self.db[bucket_id].get(limit=1)
            if len(last_events) > 0:
                last_event = last_events[0]
        
        return last_event
    
    def _try_merge_heartbeat(self, bucket_id: str, last_event: Event, heartbeat: Event, pulsetime: float) -> Event | None:
        """
        Try to merge heartbeat with last event if data matches.
        Returns merged event if successful, None if merge failed.
        """
        if last_event.data != heartbeat.data:
            logger.debug(
                "Received heartbeat with differing data, inserting as new event. (bucket: {})".format(
                    bucket_id
                )
            )
            return None
        
        merged = heartbeat_merge(last_event, heartbeat, pulsetime)
        if merged is not None:
            # Heartbeat was merged into last_event
            logger.debug(
                "Received valid heartbeat, merging. (bucket: {})".format(
                    bucket_id
                )
            )
            self.last_event_cache[bucket_id] = merged
            self.db[bucket_id].replace_last(merged)
            return merged
        else:
            logger.info(
                "Received heartbeat after pulse window, inserting as new event. (bucket: {})".format(
                    bucket_id
                )
            )
            return None
    
    def _insert_new_heartbeat(self, bucket_id: str, heartbeat: Event, reason: str) -> Event:
        """Insert heartbeat as a new event and update cache."""
        if reason == "empty_bucket":
            logger.info(
                "Received heartbeat, but bucket was previously empty, inserting as new event. (bucket: {})".format(
                    bucket_id
                )
            )
        elif reason == "different_data":
            logger.debug(
                "Received heartbeat with differing data, inserting as new event. (bucket: {})".format(
                    bucket_id
                )
            )
        elif reason == "pulse_window_expired":
            logger.info(
                "Received heartbeat after pulse window, inserting as new event. (bucket: {})".format(
                    bucket_id
                )
            )
        
        self.db[bucket_id].insert(heartbeat)
        self.last_event_cache[bucket_id] = heartbeat
        return heartbeat
    
    def _log_heartbeat_received(self, bucket_id: str, heartbeat: Event, pulsetime: float) -> None:
        """Log the received heartbeat details."""
        logger.debug(
            "Received heartbeat in bucket '{}'\n\ttimestamp: {}, duration: {}, pulsetime: {}\n\tdata: {}".format(
                bucket_id,
                heartbeat.timestamp,
                heartbeat.duration,
                pulsetime,
                heartbeat.data,
            )
        )

    def heartbeat(self, bucket_id: str, heartbeat: Event, pulsetime: float) -> Event:
        """
        Heartbeats are useful when implementing watchers that simply keep
        track of a state, how long it's in that state and when it changes.
        A single heartbeat always has a duration of zero.

        If the heartbeat was identical to the last (apart from timestamp), then the last event has its duration updated.
        If the heartbeat differed, then a new event is created.

        Such as:
         - Active application and window title
           - Example: aw-watcher-window
         - Currently open document/browser tab/playing song
           - Example: wakatime
           - Example: aw-watcher-web
           - Example: aw-watcher-spotify
         - Is the user active/inactive?
           Send an event on some interval indicating if the user is active or not.
           - Example: aw-watcher-afk

        Inspired by: https://wakatime.com/developers#heartbeats
        """
        self._log_heartbeat_received(bucket_id, heartbeat, pulsetime)
        
        last_event = self._get_last_event(bucket_id)
        
        if last_event:
            merged_event = self._try_merge_heartbeat(bucket_id, last_event, heartbeat, pulsetime)
            if merged_event:
                return merged_event
            
            # If merge failed, insert as new event
            return self._insert_new_heartbeat(bucket_id, heartbeat, "pulse_window_expired")
        else:
            # No last event, insert as new event
            return self._insert_new_heartbeat(bucket_id, heartbeat, "empty_bucket")

    def query2(self, name, query, timeperiods, cache):
        result = []
        for timeperiod in timeperiods:
            period = timeperiod.split("/")[
                :2
            ]  # iso8601 timeperiods are separated by a slash
            starttime = iso8601.parse_date(period[0])
            endtime = iso8601.parse_date(period[1])
            query = "".join(query)
            result.append(query2.query(name, query, starttime, endtime, self.db))
        return result

    # TODO: Right now the log format on disk has to be JSON, this is hard to read by humans...
    def get_log(self):
        """Get the server log in json format"""
        payload = []
        with open(get_log_file_path()) as log_file:
            for line in log_file.readlines()[::-1]:
                payload.append(json.loads(line))
        return payload, 200

    def get_setting(self, key):
        """Get a setting"""
        return self.settings.get(key, None)

    def set_setting(self, key, value):
        """Set a setting"""
        self.settings[key] = value
        return value

    def log_manual_activity(self, event_data: Any, bucket_id: Optional[str] = None,
                           client: str = "manual", hostname: str = "!local") -> Optional[Event]:
        """Create (if needed) a bucket of type 'manualactivity' and insert the provided event(s).

        If *bucket_id* is omitted, a default bucket id of the form
        ``manual_<hostname>`` will be used where *hostname* is resolved in the
        same way as in :py:meth:`create_bucket` using the server info when the
        special value ``"!local"`` is provided.

        The *event_data* payload can either be a single event object or a list
        of event objects adhering to the ``manualactivity`` schema.
        Returns the inserted event when a single event was given, otherwise
        ``None``.
        """
        # Determine hostname if special flag is used
        if hostname == "!local":
            info = self.get_info()
            hostname = info["hostname"]

        # Determine bucket id if not provided
        if bucket_id is None:
            bucket_id = f"manual_{hostname}"

        # Ensure bucket exists
        if bucket_id not in self.db.buckets():
            self.create_bucket(
                bucket_id,
                event_type=MANUAL_ACTIVITY_EVENT_TYPE,
                client=client,
                hostname=hostname,
            )

        # Normalize event_data to list[Event]
        if isinstance(event_data, dict):
            events = [Event(**event_data)]
        elif isinstance(event_data, list):
            events = [Event(**e) if isinstance(e, dict) else e for e in event_data]
        else:
            raise TypeError("event_data must be dict or list of dicts/events")

        # Insert and return result following create_events semantics
        return self.create_events(bucket_id, events)

    def log_microsurvey(self, event_data: Any, bucket_id: Optional[str] = None,
                        client: str = "survey", hostname: str = "!local") -> Optional[Event]:
        """Create bucket (if required) for microsurvey and insert event(s)."""
        if hostname == "!local":
            info = self.get_info()
            hostname = info["hostname"]
        if bucket_id is None:
            bucket_id = f"microsurvey_{hostname}"
        if bucket_id not in self.db.buckets():
            self.create_bucket(bucket_id, event_type=MICROSURVEY_EVENT_TYPE, client=client, hostname=hostname)
        if isinstance(event_data, dict):
            events = [Event(**event_data)]
        elif isinstance(event_data, list):
            events = [Event(**e) if isinstance(e, dict) else e for e in event_data]
        else:
            raise TypeError("event_data must be dict or list")
        return self.create_events(bucket_id, events)

    async def sync_data(self, sync_type: str = "full", bucket_id: Optional[str] = None) -> Dict[str, str]:
        """Initiates a data synchronization with Firebase."""
        if sync_type == "full":
            await self.synchronizer.full_sync()
            return {"status": "success", "message": "Tam senkronizasyon başlatıldı."}
        elif sync_type == "upload" and bucket_id:
            await self.synchronizer.sync_events_to_firebase(bucket_id)
            return {"status": "success", "message": f"Kova {bucket_id} Firebase'e yüklendi."}
        elif sync_type == "download":
            await self.synchronizer.sync_from_firebase()
            return {"status": "success", "message": "Firebase'den veriler indirildi."}
        else:
            return {"status": "error", "message": "Geçersiz senkronizasyon türü veya eksik kova ID'si."}

    async def get_anomaly_detection_insight(self, userId: str, startDate: str, endDate: str) -> Dict[str, Any]:
        """Fetches anomaly detection insights from Firebase Cloud Functions."""
        from firebase_admin import functions
        callable_func = functions.https_callable(functions.get_app(), 'detectAnomaly')
        result = await callable_func({"userId": userId, "startDate": startDate, "endDate": endDate})
        return result.data

    async def get_behavioral_trends_insight(self, userId: str, startDate: str, endDate: str) -> Dict[str, Any]:
        """Fetches behavioral trends insights from Firebase Cloud Functions."""
        from firebase_admin import functions
        callable_func = functions.https_callable(functions.get_app(), 'analyzeBehavioralPatterns')
        result = await callable_func({"userId": userId, "startDate": startDate, "endDate": endDate})
        return result.data

    async def get_focus_quality_score_insight(self, userId: str, startDate: str, endDate: str) -> Dict[str, Any]:
        """Fetches focus quality score insights from Firebase Cloud Functions."""
        from firebase_admin import functions
        callable_func = functions.https_callable(functions.get_app(), 'calculateFocusQualityScore')
        result = await callable_func({"userId": userId, "startDate": startDate, "endDate": endDate})
        return result.data