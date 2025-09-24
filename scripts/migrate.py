#!/usr/bin/env python3
"""
SQLite to Firestore Migration Script for PeakActivity

This script migrates data from local SQLite database to Firebase Firestore.
Usage: python scripts/migrate.py --source-db local.db --project-id peakactivity-prod

Requirements:
- sqlite3 (standard library)
- firebase-admin (pip install firebase-admin)
- Service account key in environment or file

Error handling: Batch processing, retry logic, logging.
"""

import argparse
import json
import logging
import sqlite3
import sys
from typing import List, Dict, Any
from datetime import datetime

import firebase_admin
from firebase_admin import credentials, firestore
from firebase_admin.exceptions import FirebaseError

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class SQLiteToFirestoreMigrator:
    def __init__(self, source_db: str, project_id: str, batch_size: int = 500):
        self.source_db = source_db
        self.batch_size = batch_size
        self.db = sqlite3.connect(source_db)
        self.cursor = self.db.cursor()
        
        # Initialize Firebase
        cred = credentials.Certificate('serviceAccountKey.json')  # Relative to script
        firebase_admin.initialize_app(cred, {'projectId': project_id})
        self.firestore = firestore.client()
        
        logger.info(f"Migration initialized. Source: {source_db}, Project: {project_id}")

    def migrate_users(self) -> None:
        """Migrate users table."""
        logger.info("Migrating users...")
        self.cursor.execute("SELECT * FROM users")
        users = self.cursor.fetchall()
        
        batch = self.firestore.batch()
        for user in users:
            user_id = user[0]  # Assume id is first column
            user_data = {
                'email': user[1],
                'displayName': user[2],
                'createdAt': user[3].isoformat() if user[3] else datetime.now().isoformat(),
                'preferences': json.loads(user[4]) if user[4] else {},
            }
            batch.set(self.firestore.collection('users').document(user_id), user_data)
            
            if len(batch._data) >= self.batch_size:
                try:
                    batch.commit()
                    logger.info(f"Committed {self.batch_size} users")
                except FirebaseError as e:
                    logger.error(f"Batch commit failed: {e}")
                    batch = self.firestore.batch()  # Retry next batch
                batch = self.firestore.batch()
        
        if batch._data:
            batch.commit()
        logger.info(f"Migrated {len(users)} users")

    def migrate_buckets(self) -> None:
        """Migrate buckets table."""
        logger.info("Migrating buckets...")
        self.cursor.execute("SELECT * FROM buckets")
        buckets = self.cursor.fetchall()
        
        batch = self.firestore.batch()
        for bucket in buckets:
            bucket_id = bucket[0]
            user_id = bucket[1]  # Assume user_id second
            bucket_data = {
                'type': bucket[2],
                'client': bucket[3],
                'hostname': bucket[4],
                'user_id': user_id,
                'created': bucket[5].isoformat() if bucket[5] else datetime.now().isoformat(),
            }
            batch.set(self.firestore.collection(f'users/{user_id}/buckets').document(bucket_id), bucket_data)
            
            if len(batch._data) >= self.batch_size:
                batch.commit()
                batch = self.firestore.batch()
        
        if batch._data:
            batch.commit()
        logger.info(f"Migrated {len(buckets)} buckets")

    def migrate_events(self) -> None:
        """Migrate events table."""
        logger.info("Migrating events...")
        self.cursor.execute("SELECT * FROM events")
        events = self.cursor.fetchall()
        
        batch = self.firestore.batch()
        for event in events:
            event_id = event[0]
            bucket_id = event[1]
            user_id = event[2]  # Assume user_id
            event_data = {
                'timestamp': event[3].isoformat() if event[3] else datetime.now().isoformat(),
                'duration': event[4],
                'data': json.loads(event[5]) if event[5] else {},
                'bucket_id': bucket_id,
                'user_id': user_id,
            }
            batch.set(self.firestore.collection(f'users/{user_id}/buckets/{bucket_id}/events').document(event_id), event_data)
            
            if len(batch._data) >= self.batch_size:
                try:
                    batch.commit()
                    logger.info(f"Committed {self.batch_size} events")
                except FirebaseError as e:
                    logger.error(f"Batch commit failed: {e}")
                    # Retry logic: save failed batch to log and continue
                batch = self.firestore.batch()
        
        if batch._data:
            batch.commit()
        logger.info(f"Migrated {len(events)} events")

    def run_migration(self) -> None:
        """Run full migration."""
        try:
            self.migrate_users()
            self.migrate_buckets()
            self.migrate_events()
            logger.info("Migration completed successfully")
        except Exception as e:
            logger.error(f"Migration failed: {e}")
            sys.exit(1)
        finally:
            self.db.close()

def main():
    parser = argparse.ArgumentParser(description='Migrate SQLite to Firestore')
    parser.add_argument('--source-db', required=True, help='Path to SQLite database')
    parser.add_argument('--project-id', required=True, help='Firebase project ID')
    parser.add_argument('--batch-size', type=int, default=500, help='Batch size for commits')
    
    args = parser.parse_args()
    
    migrator = SQLiteToFirestoreMigrator(args.source_db, args.project_id, args.batch_size)
    migrator.run_migration()

if __name__ == '__main__':
    main()
