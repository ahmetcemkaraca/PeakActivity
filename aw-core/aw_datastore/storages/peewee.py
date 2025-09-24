import json
import logging
import os
from datetime import datetime, timedelta, timezone
from typing import (
    Any,
    Dict,
    List,
    Optional,
)

import iso8601
from aw_core.dirs import get_data_dir
from aw_core.models import Event
from aw_core.exceptions import (
    AWDatabaseException,
    AWPeeweeException,
    AWDatabaseConnectionException,
    AWDatabaseIntegrityException,
    AWDatabaseMigrationException,
    AWFileException,
    AWPermissionException,
    AWDiskSpaceException,
)
from aw_core.error_handler import safe_execute, with_retry, error_context
from playhouse.migrate import SqliteMigrator, migrate
from playhouse.sqlite_ext import SqliteExtDatabase

import peewee
from peewee import (
    AutoField,
    CharField,
    DateTimeField,
    DecimalField,
    ForeignKeyField,
    IntegerField,
    Model,
)

from .abstract import AbstractStorage

logger = logging.getLogger(__name__)

# Prevent debug output from propagating
peewee_logger = logging.getLogger("peewee")
peewee_logger.setLevel(logging.INFO)

# Init'd later in the PeeweeStorage constructor.
#   See: http://docs.peewee-orm.com/en/latest/peewee/database.html#run-time-database-configuration
# Another option would be to use peewee's Proxy.
#   See: http://docs.peewee-orm.com/en/latest/peewee/database.html#dynamic-db
_db = SqliteExtDatabase(None)


LATEST_VERSION = 2


def auto_migrate(path: str) -> None:
    """Perform automatic database migration with error handling."""
    try:
        db = SqliteExtDatabase(path)
        migrator = SqliteMigrator(db)

        # check if bucketmodel has datastr field
        try:
            info = db.execute_sql("PRAGMA table_info(bucketmodel)")
            has_datastr = any(row[1] == "datastr" for row in info)
        except (peewee.DatabaseError, peewee.OperationalError) as e:
            logger.error("Failed to check table info during migration: %s", e)
            raise AWDatabaseMigrationException(
                f"Failed to query table structure: {e}",
                operation="table_info_check",
                table="bucketmodel",
            ) from e

        if not has_datastr:
            try:
                datastr_field = CharField(default="{}")
                with db.atomic():
                    migrate(
                        migrator.add_column("bucketmodel", "datastr", datastr_field)
                    )
                logger.info("Successfully added datastr column to bucketmodel")
            except peewee.DatabaseError as e:
                logger.error("Failed to add datastr column: %s", e)
                # Handle specific operational errors
                if "duplicate column name" in str(e).lower():
                    logger.warning("datastr column already exists, skipping migration")
                else:
                    raise AWDatabaseMigrationException(
                        f"Failed to add column: {e}",
                        operation="add_column",
                        table="bucketmodel",
                    ) from e

        try:
            db.close()
        except Exception as e:
            logger.warning("Failed to close database connection: %s", e)

    except PermissionError as e:
        logger.error("Permission error accessing database: %s", e)
        raise AWPermissionException(
            f"Permission denied: {e}", file_path=path, operation="migration"
        ) from e
    except (OSError, IOError) as e:
        logger.error("File I/O error during migration: %s", e)
        raise AWFileException(
            f"Database file error: {e}", file_path=path, operation="migration"
        ) from e


def chunks(ls, n):
    """Yield successive n-sized chunks from ls.
    From: https://stackoverflow.com/a/312464/965332"""
    for i in range(0, len(ls), n):
        yield ls[i : i + n]


def dt_plus_duration(dt, duration):
    # See peewee docs on datemath: https://docs.peewee-orm.com/en/latest/peewee/hacks.html#date-math
    return peewee.fn.strftime(
        "%Y-%m-%d %H:%M:%f+00:00",
        (peewee.fn.julianday(dt) - 2440587.5) * 86400.0 + duration,
        "unixepoch",
    )


class BaseModel(Model):
    class Meta:
        database = _db


class BucketModel(BaseModel):
    key = IntegerField(primary_key=True)
    id = CharField(unique=True)
    created = DateTimeField(default=datetime.now)
    name = CharField(null=True)
    type = CharField()
    client = CharField()
    hostname = CharField()
    datastr = CharField(null=True)  # JSON-encoded object

    def json(self):
        return {
            "id": int(self.id),  # Peewee AutoField değerini int'e çevir
            "created": str(self.created),  # DateTimeField değerini str'ye çevir
            "name": str(self.name),  # CharField değerini str'ye çevir
            "type": str(self.type),
            "client": str(self.client),
            "hostname": str(self.hostname),
            "data": (
                json.loads(str(self.datastr)) if self.datastr else {}
            ),  # CharField değerini str'ye çevir
        }


class EventModel(BaseModel):
    id = AutoField()
    bucket = ForeignKeyField(BucketModel, backref="events", index=True)
    timestamp = DateTimeField(index=True, default=datetime.now)
    duration = DecimalField()
    datastr = CharField()

    @classmethod
    def from_event(cls, bucket_key, event: Event):
        return cls(
            bucket=bucket_key,
            id=event.id,
            timestamp=event.timestamp,
            duration=event.duration.total_seconds(),
            datastr=json.dumps(event.data),
        )

    def json(self):
        try:
            return {
                "id": self.id,
                "timestamp": self.timestamp,
                "duration": float(self.duration),
                "data": (
                    json.loads(str(self.datastr)) if self.datastr else {}
                ),  # CharField değerini str'ye çevir
            }
        except (json.JSONDecodeError, ValueError) as e:
            logger.error("Error parsing event data: %s", e)
            raise AWDataFormatException(
                f"Invalid JSON data in event: {e}",
                data=str(self.datastr),
                event_id=str(self.id),
            ) from e


class PeeweeStorage(AbstractStorage):
    sid = "peewee"

    def __init__(self, testing: bool = True, filepath: Optional[str] = None) -> None:
        data_dir = get_data_dir("aw-server")

        if not filepath:
            filename = (
                "peewee-sqlite"
                + ("-testing" if testing else "")
                + f".v{LATEST_VERSION}"
                + ".db"
            )
            filepath = os.path.join(data_dir, filename)
        self.db = _db
        self.db.init(filepath)
        logger.info(f"Using database file: {filepath}")
        self.db.connect()

        self.bucket_keys: Dict[str, int] = {}
        BucketModel.create_table(safe=True)
        EventModel.create_table(safe=True)

        # Migrate database if needed, requires closing the connection first
        self.db.close()
        auto_migrate(filepath)
        self.db.connect()

        # Update bucket keys
        self.update_bucket_keys()

    def update_bucket_keys(self) -> None:
        buckets = BucketModel.select()
        self.bucket_keys = {bucket.id: bucket.key for bucket in buckets}

    def buckets(self) -> Dict[str, Dict[str, Any]]:
        return {bucket.id: bucket.json() for bucket in BucketModel.select()}

    def create_bucket(
        self,
        bucket_id: str,
        type_id: str,
        client: str,
        hostname: str,
        created: str,
        name: Optional[str] = None,
        data: Optional[Dict[str, Any]] = None,
    ):
        BucketModel.create(
            id=bucket_id,
            type=type_id,
            client=client,
            hostname=hostname,
            created=created,
            name=name,
            datastr=json.dumps(data or {}),
        )
        self.update_bucket_keys()

    def update_bucket(
        self,
        bucket_id: str,
        type_id: Optional[str] = None,
        client: Optional[str] = None,
        hostname: Optional[str] = None,
        name: Optional[str] = None,
        data: Optional[dict] = None,
    ) -> None:
        if bucket_id in self.bucket_keys:
            bucket = BucketModel.get(BucketModel.key == self.bucket_keys[bucket_id])

            if type_id is not None:
                bucket.type = type_id
            if client is not None:
                bucket.client = client
            if hostname is not None:
                bucket.hostname = hostname
            if name is not None:
                bucket.name = name
            if data is not None:
                bucket.datastr = json.dumps(data)  # Encoding data dictionary to JSON

            bucket.save()
        else:
            raise ValueError("Bucket did not exist, could not update")

    def delete_bucket(self, bucket_id: str) -> None:
        if bucket_id in self.bucket_keys:
            EventModel.delete().where(
                EventModel.bucket == self.bucket_keys[bucket_id]
            ).execute()
            BucketModel.delete().where(
                BucketModel.key == self.bucket_keys[bucket_id]
            ).execute()
            self.update_bucket_keys()
        else:
            raise ValueError("Bucket did not exist, could not delete")

    def get_metadata(self, bucket_id: str):
        if bucket_id in self.bucket_keys:
            bucket = BucketModel.get(
                BucketModel.key == self.bucket_keys[bucket_id]
            ).json()
            return bucket
        else:
            raise ValueError("Bucket did not exist, could not get metadata")

    def insert_one(self, bucket_id: str, event: Event) -> Event:
        e = EventModel.from_event(self.bucket_keys[bucket_id], event)
        e.save()
        event.id = e.id
        return event

    def insert_many(self, bucket_id, events: List[Event]) -> None:
        # NOTE: Events need to be handled differently depending on
        #       if they're upserts or inserts (have id's or not).

        # These events are updates which need to be applied one by one
        events_updates = [e for e in events if e.id is not None]
        for e in events_updates:
            self.insert_one(bucket_id, e)

        # These events can be inserted with insert_many
        events_dictlist = [
            {
                "bucket": self.bucket_keys[bucket_id],
                "timestamp": event.timestamp,
                "duration": event.duration.total_seconds(),
                "datastr": json.dumps(event.data),
            }
            for event in events
            if event.id is None
        ]

        # Chunking into lists of length 100 is needed here due to SQLITE_MAX_COMPOUND_SELECT
        # and SQLITE_LIMIT_VARIABLE_NUMBER under Windows.
        # See: https://github.com/coleifer/peewee/issues/948
        for chunk in chunks(events_dictlist, 100):
            EventModel.insert_many(chunk).execute()

    def _get_event(self, bucket_id, event_id) -> Optional[EventModel]:
        try:
            return (
                EventModel.select()
                .where(EventModel.id == event_id)
                .where(EventModel.bucket == self.bucket_keys[bucket_id])
                .get()
            )
        except peewee.DoesNotExist:
            return None

    def _get_last(self, bucket_id) -> EventModel:
        return (
            EventModel.select()
            .where(EventModel.bucket == self.bucket_keys[bucket_id])
            .order_by(EventModel.timestamp.desc())
            .get()
        )

    def replace_last(self, bucket_id, event):
        e = self._get_last(bucket_id)
        e.timestamp = event.timestamp
        e.duration = event.duration.total_seconds()
        e.datastr = json.dumps(event.data)
        e.save()
        event.id = e.id
        return event

    def delete(self, bucket_id, event_id):
        return (
            EventModel.delete()
            .where(EventModel.id == event_id)
            .where(EventModel.bucket == self.bucket_keys[bucket_id])
            .execute()
        )

    def replace(self, bucket_id, event_id, event):
        e = self._get_event(bucket_id, event_id)
        e.timestamp = event.timestamp
        e.duration = event.duration.total_seconds()
        e.datastr = json.dumps(event.data)
        e.save()
        event.id = e.id
        return event

    def get_event(
        self,
        bucket_id: str,
        event_id: int,
    ) -> Optional[Event]:
        """
        Fetch a single event from a bucket.
        """
        res = self._get_event(bucket_id, event_id)
        return Event(**EventModel.json(res)) if res else None

    def get_events(
        self,
        bucket_id: str,
        limit: int,
        starttime: Optional[datetime] = None,
        endtime: Optional[datetime] = None,
    ):
        """
        Fetch events from a certain bucket, optionally from a given range of time.

        Example raw query:

            SELECT strftime(
              "%Y-%m-%d %H:%M:%f+00:00",
              ((julianday(timestamp) - 2440587.5) * 86400),
              'unixepoch'
            )
            FROM eventmodel
            WHERE eventmodel.timestamp > '2021-06-20'
            LIMIT 10;

        """
        if limit == 0:
            return []
        q = (
            EventModel.select()
            .where(EventModel.bucket == self.bucket_keys[bucket_id])
            .order_by(EventModel.timestamp.desc())
            .limit(limit)
        )

        q = self._where_range(q, starttime, endtime)

        res = q.execute()
        events = [Event(**e) for e in list(map(EventModel.json, res))]

        # Trim events that are out of range (as done in aw-server-rust)
        # TODO: Do the same for the other storage methods
        for e in events:
            if starttime:
                if e.timestamp < starttime:
                    e_end = e.timestamp + e.duration
                    e.timestamp = starttime
                    e.duration = e_end - e.timestamp
            if endtime:
                if e.timestamp + e.duration > endtime:
                    e.duration = endtime - e.timestamp

        return events

    def get_eventcount(
        self,
        bucket_id: str,
        starttime: Optional[datetime] = None,
        endtime: Optional[datetime] = None,
    ) -> int:
        q = EventModel.select().where(EventModel.bucket == self.bucket_keys[bucket_id])
        q = self._where_range(q, starttime, endtime)
        return q.count()

    def _where_range(
        self,
        q,
        starttime: Optional[datetime] = None,
        endtime: Optional[datetime] = None,
    ):
        # Important to normalize datetimes to UTC, otherwise any UTC offset will be ignored
        if starttime:
            starttime = starttime.astimezone(timezone.utc)
        if endtime:
            endtime = endtime.astimezone(timezone.utc)

        if starttime:
            # Faster WHERE to speed up slow query below, leads to ~2-3x speedup
            # We'll assume events aren't >24h
            q = q.where(starttime - timedelta(hours=24) <= EventModel.timestamp)

            # This can be slow on large databases...
            # Tried creating various indexes and using SQLite's unlikely() function, but it had no effect
            q = q.where(
                starttime <= dt_plus_duration(EventModel.timestamp, EventModel.duration)
            )
        if endtime:
            q = q.where(EventModel.timestamp <= endtime)

        return q
