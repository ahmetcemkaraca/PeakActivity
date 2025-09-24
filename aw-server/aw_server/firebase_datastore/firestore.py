"""Firebase Firestore integration for ActivityWatch storage.

This module provides Firestore-based implementations of EventDB and Storage
abstractions, enabling cloud-based data storage with optional data anonymization.

The module implements:
- FirestoreEventDB: Handles event CRUD operations in Firestore collections
- FirestoreStorage: Manages bucket operations and provides EventDB instances

Collections structure:
/users/{user_id}/buckets/{bucket_id}/events/{event_id}
/users/{user_id}/buckets/{bucket_id} (bucket metadata)
"""

from datetime import datetime
from typing import Any, Dict, List, Optional

from aw_core.models import Event
from aw_datastore.storages.abstract import Storage, EventDB
from aw_server.data_anonymization.anonymizer import Anonymizer # Anonymizer sınıfını içe aktar

from .__init__ import db as firestore_db
# import hashlib # Yeni eklenen import kaldırıldı

class FirestoreEventDB(EventDB):
    """Firestore-based EventDB implementation for ActivityWatch events.
    
    Handles CRUD operations for events stored in Firestore, with support for
    data anonymization and automatic timestamp conversion between Python
    datetime objects and Firestore timestamps.
    
    Collection path: /users/{user_id}/buckets/{bucket_id}/events/{event_id}
    """
    def __init__(self, user_id: str, bucket_id: str, anonymize_data: bool = False):
        """Initialize Firestore EventDB for a specific user bucket.
        
        Args:
            user_id: Unique identifier for the user
            bucket_id: Unique identifier for the bucket within user's data
            anonymize_data: Whether to anonymize sensitive data before storage
        """
        self.user_id = user_id
        self.bucket_id = bucket_id
        self.collection_ref = firestore_db.collection(u'users').document(user_id).collection(u'buckets').document(bucket_id).collection(u'events')
        self.anonymize_data = anonymize_data # anonymize_data eklendi
        self.anonymizer = Anonymizer() # Anonymizer örneği oluşturuldu

    def get(self, limit: int = -1, start: Optional[datetime] = None, end: Optional[datetime] = None) -> List[Event]:
        """Retrieve events from Firestore with optional filtering and limiting.
        
        Args:
            limit: Maximum number of events to return (-1 for unlimited)
            start: Start datetime for filtering (inclusive)
            end: End datetime for filtering (exclusive)
            
        Returns:
            List of Event objects ordered by timestamp
            
        Note:
            Automatically converts Firestore timestamps to Python datetime objects
            and removes timezone information for compatibility.
        """
        query = self.collection_ref.order_by(u'timestamp')
        if start:
            query = query.where(u'timestamp', u'>=', start)
        if end:
            query = query.where(u'timestamp', u'<', end)
        if limit != -1:
            query = query.limit(limit)
        
        docs = query.stream()
        events = []
        for doc in docs:
            data = doc.to_dict()
            # Firestore'dan gelen timestamp'i datetime objesine çevir
            if 'timestamp' in data and hasattr(data['timestamp'], 'replace'):
                data['timestamp'] = data['timestamp'].replace(tzinfo=None) # remove timezone info
            events.append(Event(**data))
        return events

    def get_by_id(self, event_id: int) -> Optional[Event]:
        """Retrieve a specific event by its ID.
        
        Args:
            event_id: Unique identifier for the event
            
        Returns:
            Event object if found, None otherwise
            
        Note:
            Handles Firestore timestamp conversion automatically.
        """
        doc_ref = self.collection_ref.document(str(event_id))
        doc = doc_ref.get()
        if doc.exists:
            data = doc.to_dict()
            if 'timestamp' in data and hasattr(data['timestamp'], 'replace'):
                data['timestamp'] = data['timestamp'].replace(tzinfo=None)
            return Event(**data)
        return None

    def insert(self, events: List[Event]) -> Optional[Event]:
        """Insert multiple events into Firestore using batch operations.
        
        Args:
            events: List of Event objects to insert
            
        Returns:
            The last inserted event, or None if no events were provided
            
        Note:
            - Uses Firestore batch operations for atomic writes
            - Converts datetime objects to ISO format strings for storage
            - Applies data anonymization if enabled
            - Uses event.id as the document ID in Firestore
        """
        batch = firestore_db.batch()
        inserted_event = None
        for event in events:
            doc_ref = self.collection_ref.document(str(event.id))
            event_dict = event.to_json_dict()
            # Firestore'a kaydetmeden önce datetime objesini timestamp'e çevir
            if 'timestamp' in event_dict and isinstance(event_dict['timestamp'], datetime):
                event_dict['timestamp'] = event_dict['timestamp'].isoformat()

            # İsteğe bağlı veri anonimleştirme
            if self.anonymize_data:
                event_dict = self.anonymizer.anonymize_event(event_dict)
                # Eski anonimleştirme mantığı kaldırıldı
                # if 'title' in event_dict:
                #     event_dict['title'] = '[Anonimleştirilmiş Başlık]'
                # if 'app' in event_dict:
                #     event_dict['app'] = '[Anonimleştirilmiş Uygulama]'
                # Daha gelişmiş anonimleştirme (örn. hashleme)
                # if 'title' in event_dict:
                #     event_dict['title'] = hashlib.sha256(event_dict['title'].encode()).hexdigest()
                # if 'app' in event_dict:
                #     event_dict['app'] = hashlib.sha256(event_dict['app'].encode()).hexdigest()

            batch.set(doc_ref, event_dict)
            inserted_event = event
        batch.commit()
        return inserted_event

    def delete(self, event_id: int) -> bool:
        """Delete an event from Firestore by its ID.
        
        Args:
            event_id: Unique identifier for the event to delete
            
        Returns:
            True if deletion was successful (Firestore doesn't report failure
            for non-existent documents)
        """
        doc_ref = self.collection_ref.document(str(event_id))
        doc_ref.delete()
        return True

    def replace_last(self, event: Event) -> None:
        """Replace/update an existing event in Firestore.
        
        Args:
            event: Event object to update (uses event.id for document targeting)
            
        Note:
            - Uses event.id as the document identifier
            - Converts datetime to ISO format for storage
            - Applies data anonymization if enabled
            - Overwrites the entire document (not a partial update)
        """
        # Firestore'da 'last' kavramı yok, bu yüzden mevcut belgeyi güncelleyeceğiz
        # Bunun için son olayı alıp onun ID'sini kullanmamız gerekir.
        # Daha sağlam bir çözüm için event.id'yi kullanabiliriz.
        doc_ref = self.collection_ref.document(str(event.id))
        event_dict = event.to_json_dict()
        if 'timestamp' in event_dict and isinstance(event_dict['timestamp'], datetime):
            event_dict['timestamp'] = event_dict['timestamp'].isoformat()

        # İsteğe bağlı veri anonimleştirme
        if self.anonymize_data:
            event_dict = self.anonymizer.anonymize_event(event_dict)
            # Eski anonimleştirme mantığı kaldırıldı
            # if 'title' in event_dict:
            #     event_dict['title'] = '[Anonimleştirilmiş Başlık]'
            # if 'app' in event_dict:
            #     event_dict['app'] = '[Anonimleştirilmiş Uygulama]'
            # Daha gelişmiş anonimleştirme (örn. hashleme)
            # if 'title' in event_dict:
            #     event_dict['title'] = hashlib.sha256(event_dict['title'].encode()).hexdigest()
            # if 'app' in event_dict:
            #     event_dict['app'] = hashlib.sha256(event_dict['app'].encode()).hexdigest()

        doc_ref.set(event_dict)

    def get_eventcount(self, start: Optional[datetime] = None, end: Optional[datetime] = None) -> int:
        """Get the total count of events in the collection using Firestore aggregation.
        
        Args:
            start: Start datetime for filtering (inclusive)
            end: End datetime for filtering (exclusive)
            
        Returns:
            Total number of events matching the time range
            
        Note:
            Uses Firestore's native aggregation query for efficient counting
            without downloading all documents.
        """
        # Firestore'un yerel aggregation sorgusunu kullanarak event sayısını al
        query = self.collection_ref
        if start:
            query = query.where(u'timestamp', u'>=', start)
        if end:
            query = query.where(u'timestamp', u'<', end)
        
        # aggregation modülünü import et
        from google.cloud.firestore_v1 import aggregation

        aggregate_query = aggregation.AggregationQuery(query)
        aggregate_query.count(alias="total_events")

        results = aggregate_query.get()
        for result in results:
            if result[0].alias == "total_events":
                return result[0].value
        return 0

    def get_total_duration(self, start: Optional[datetime] = None, end: Optional[datetime] = None) -> float:
        """Calculate total duration of all events using Firestore aggregation.
        
        Args:
            start: Start datetime for filtering (inclusive)
            end: End datetime for filtering (exclusive)
            
        Returns:
            Sum of all event durations in seconds
            
        Note:
            Uses Firestore's SUM aggregation for server-side calculation,
            avoiding the need to download all events.
        """
        query = self.collection_ref
        if start:
            query = query.where(u'timestamp', u'>=', start)
        if end:
            query = query.where(u'timestamp', u'<', end)

        from google.cloud.firestore_v1 import aggregation

        aggregate_query = aggregation.AggregationQuery(query)
        aggregate_query.sum(u'duration', alias="total_duration")

        results = aggregate_query.get()
        for result in results:
            if result[0].alias == "total_duration":
                return result[0].value if result[0].value is not None else 0.0
        return 0.0

    def get_average_duration(self, start: Optional[datetime] = None, end: Optional[datetime] = None) -> float:
        """Calculate average duration of events using Firestore aggregation.
        
        Args:
            start: Start datetime for filtering (inclusive)
            end: End datetime for filtering (exclusive)
            
        Returns:
            Average duration of events in seconds, 0.0 if no events found
            
        Note:
            Uses Firestore's AVG aggregation for server-side calculation.
        """
        query = self.collection_ref
        if start:
            query = query.where(u'timestamp', u'>=', start)
        if end:
            query = query.where(u'timestamp', u'<', end)

        from google.cloud.firestore_v1 import aggregation

        aggregate_query = aggregation.AggregationQuery(query)
        aggregate_query.avg(u'duration', alias="average_duration")

        results = aggregate_query.get()
        for result in results:
            if result[0].alias == "average_duration":
                return result[0].value if result[0].value is not None else 0.0
        return 0.0

class FirestoreStorage(Storage):
    """Firestore-based Storage implementation for ActivityWatch buckets.
    
    Manages bucket operations and provides FirestoreEventDB instances for
    event operations. Supports optional data anonymization across all
    operations.
    
    Collections structure:
    - /users/{user_id}/buckets/{bucket_id} (bucket metadata)
    - /users/{user_id}/buckets/{bucket_id}/events/{event_id} (events)
    """
    def __init__(self, user_id: str, testing: bool = False, anonymize_data: bool = False):
        """Initialize Firestore Storage for a specific user.
        
        Args:
            user_id: Unique identifier for the user
            testing: Whether this is a testing instance (passed to parent)
            anonymize_data: Whether to enable data anonymization for all operations
        """
        super().__init__(testing)
        self.user_id = user_id
        self.buckets_collection_ref = firestore_db.collection(u'users').document(user_id).collection(u'buckets')
        self.anonymize_data = anonymize_data # anonymize_data eklendi

    def buckets(self) -> Dict[str, Dict[str, Any]]:
        """Retrieve all buckets for the user.
        
        Returns:
            Dictionary mapping bucket IDs to their metadata dictionaries
            
        Note:
            Returns the raw Firestore document data as dictionaries.
        """
        docs = self.buckets_collection_ref.stream()
        _buckets = {}
        for doc in docs:
            _buckets[doc.id] = doc.to_dict()
        return _buckets

    def create_bucket(self, bucket_id: str, type: str, client: str, hostname: str, created: datetime, data: Optional[Dict[str, Any]] = None) -> None:
        """Create a new bucket in Firestore.
        
        Args:
            bucket_id: Unique identifier for the bucket
            type: Type of the bucket (e.g., 'afk', 'window', 'currentwindow')
            client: Name of the client application creating the bucket
            hostname: Hostname where the bucket is created
            created: Creation timestamp
            data: Optional additional metadata for the bucket
            
        Note:
            Automatically adds a 'last_updated' timestamp field.
        """
        bucket_data = {
            u'type': type,
            u'client': client,
            u'hostname': hostname,
            u'created': created,
            u'data': data if data is not None else {},
            u'last_updated': datetime.now() # Yeni eklenen alan
        }
        self.buckets_collection_ref.document(bucket_id).set(bucket_data)

    def update_bucket(self, bucket_id: str, type: Optional[str] = None, client: Optional[str] = None, hostname: Optional[str] = None, data: Optional[Dict[str, Any]] = None) -> None:
        """Update an existing bucket's metadata.
        
        Args:
            bucket_id: Unique identifier for the bucket to update
            type: New type for the bucket (optional)
            client: New client name (optional)
            hostname: New hostname (optional)
            data: New metadata dictionary (optional)
            
        Note:
            Only updates provided fields, automatically updates 'last_updated' timestamp.
        """
        updates = {}
        if type is not None:
            updates[u'type'] = type
        if client is not None:
            updates[u'client'] = client
        if hostname is not None:
            updates[u'hostname'] = hostname
        if data is not None:
            updates[u'data'] = data
        updates[u'last_updated'] = datetime.now() # Güncelleme zamanı
        self.buckets_collection_ref.document(bucket_id).update(updates)

    def delete_bucket(self, bucket_id: str) -> None:
        """Delete a bucket and all its events from Firestore.
        
        Args:
            bucket_id: Unique identifier for the bucket to delete
            
        Warning:
            This only deletes the bucket metadata. Events in the bucket's
            subcollection need to be deleted separately to avoid orphaned data.
        """
        self.buckets_collection_ref.document(bucket_id).delete()

    def __getitem__(self, bucket_id: str) -> FirestoreEventDB:
        """Get a FirestoreEventDB instance for the specified bucket.
        
        Args:
            bucket_id: Unique identifier for the bucket
            
        Returns:
            FirestoreEventDB instance configured for the bucket with the same
            anonymization settings as this storage instance
        """
        return FirestoreEventDB(self.user_id, bucket_id, self.anonymize_data) 