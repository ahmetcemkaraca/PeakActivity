import logging
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Any

from aw_core.models import Event
from aw_datastore.storages.abstract import Storage

from aw_server.firebase_datastore.firestore import FirestoreStorage
from aw_server.api import ServerAPI

logger = logging.getLogger(__name__)


class DataSynchronizer:
    def __init__(self, local_db: Storage, firebase_db: FirestoreStorage):
        self.local_db = local_db
        self.firebase_db = firebase_db
        self.server_api = ServerAPI(
            db=local_db, testing=False
        )  # ServerAPI'yi local_db ile başlat

    async def sync_buckets_to_firebase(self):
        logger.info("Kova verileri Firebase'e senkronize ediliyor...")
        local_buckets = self.local_db.buckets()
        for bucket_id, bucket_data in local_buckets.items():
            try:
                # Check if bucket exists in Firebase, if not, create it
                firebase_bucket_doc = self.firebase_db.buckets_collection_ref.document(
                    bucket_id
                ).get()
                if not firebase_bucket_doc.exists:
                    self.firebase_db.create_bucket(
                        bucket_id,
                        type=bucket_data["type"],
                        client=bucket_data["client"],
                        hostname=bucket_data["hostname"],
                        created=bucket_data["created"],
                        data=bucket_data["data"],
                    )
                    logger.info(f"Firebase'de yeni kova oluşturuldu: {bucket_id}")
                else:
                    # Update existing bucket metadata if necessary
                    firebase_data = firebase_bucket_doc.to_dict()
                    local_last_updated = local_buckets[bucket_id].get(
                        "last_updated", datetime.min.replace(tzinfo=timezone.utc)
                    )
                    firebase_last_updated = firebase_data.get(
                        "last_updated", datetime.min.replace(tzinfo=timezone.utc)
                    )

                    if local_last_updated > firebase_last_updated:
                        self.firebase_db.update_bucket(
                            bucket_id,
                            type=bucket_data["type"],
                            client=bucket_data["client"],
                            hostname=bucket_data["hostname"],
                            data=bucket_data["data"],
                        )
                        logger.info(f"Firebase kovası güncellendi: {bucket_id}")

            except Exception as e:
                logger.error(
                    f"Kova {bucket_id} Firebase'e senkronize edilirken hata oluştu: {e}"
                )

    async def sync_events_to_firebase(self, bucket_id: str):
        logger.info(f"Kova {bucket_id} olayları Firebase'e senkronize ediliyor...")
        try:
            local_events = self.server_api.get_events(
                bucket_id, limit=-1
            )  # Tüm yerel olayları al
            firebase_events_db = self.firebase_db[bucket_id]

            for event_data in local_events:
                event = Event(**event_data)  # Dict'i Event objesine çevir
                # Firebase'de event'in varlığını kontrol et
                firebase_event_doc = firebase_events_db.collection_ref.document(
                    str(event.id)
                ).get()

                if not firebase_event_doc.exists:
                    # Olay Firebase'de yoksa ekle
                    firebase_events_db.insert([event])
                    # logger.debug(f"Firebase'e yeni olay eklendi: {event.id} ({bucket_id})")
                else:
                    # Olay Firebase'de varsa ve yerel daha yeniyse güncelle (Last Write Wins)
                    firebase_event = Event(**firebase_event_doc.to_dict())
                    if event.timestamp > firebase_event.timestamp:
                        firebase_events_db.replace_last(
                            event
                        )  # replace_last burada güncellemeyi ifade eder
                        # logger.debug(f"Firebase olayı güncellendi: {event.id} ({bucket_id})")

        except Exception as e:
            logger.error(
                f"Kova {bucket_id} olayları Firebase'e senkronize edilirken hata oluştu: {e}"
            )

    async def sync_from_firebase(self):
        logger.info("Firebase'den yerel veritabanına senkronize ediliyor...")
        try:
            firebase_buckets = self.firebase_db.buckets()
            for bucket_id, firebase_bucket_data in firebase_buckets.items():
                # Yerelde kova yoksa oluştur
                if bucket_id not in self.local_db.buckets():
                    self.local_db.create_bucket(
                        bucket_id,
                        type=firebase_bucket_data["type"],
                        client=firebase_bucket_data["client"],
                        hostname=firebase_bucket_data["hostname"],
                        created=firebase_bucket_data["created"],
                        data=firebase_bucket_data["data"],
                    )
                    logger.info(f"Yerelde yeni kova oluşturuldu: {bucket_id}")

                # Olayları senkronize et
                firebase_events_db = self.firebase_db[bucket_id]
                firebase_events = firebase_events_db.get(
                    limit=-1
                )  # Tüm Firebase olaylarını al

                for event in firebase_events:
                    local_event = self.local_db[bucket_id].get_by_id(event.id)
                    if not local_event:
                        # Yerelde olay yoksa ekle
                        self.local_db[bucket_id].insert([event])
                        # logger.debug(f"Yerelde yeni olay eklendi: {event.id} ({bucket_id})")
                    else:
                        # Yerelde olay varsa ve Firebase daha yeniyse güncelle (Last Write Wins)
                        if event.timestamp > local_event.timestamp:
                            self.local_db[bucket_id].replace_last(
                                event
                            )  # replace_last burada güncellemeyi ifade eder
                            # logger.debug(f"Yerel olay güncellendi: {event.id} ({bucket_id})")
        except Exception as e:
            logger.error(f"Firebase'den senkronize edilirken hata oluştu: {e}")

    async def full_sync(self):
        logger.info("Tam senkronizasyon başlatıldı (Firebase <-> Yerel)...")
        await self.sync_buckets_to_firebase()
        # Tüm kovaların olaylarını senkronize et
        local_buckets = self.local_db.buckets()
        for bucket_id in local_buckets.keys():
            await self.sync_events_to_firebase(bucket_id)
        await self.sync_from_firebase()
        logger.info("Tam senkronizasyon tamamlandı.")
