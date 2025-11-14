"""
ActivityWatch Data Query Tools for PraisonAI Agents
These tools allow agents to query and analyze user activity data
"""

import os
import sys
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import json

# Add aw-server to path to import modules
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

from aw_server.firebase_datastore.firestore import FirestoreStorage
from firebase_admin import firestore


def query_activity_data(
    user_id: str,
    bucket_id: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    limit: int = 100
) -> Dict[str, Any]:
    """
    Query activity events from a specific bucket for a user.

    Args:
        user_id: Firebase Auth user ID
        bucket_id: ActivityWatch bucket identifier
        start_date: ISO format start date (optional, defaults to 7 days ago)
        end_date: ISO format end date (optional, defaults to now)
        limit: Maximum number of events to return (default: 100)

    Returns:
        Dictionary containing events and metadata
    """
    try:
        # Parse dates or use defaults
        if end_date is None:
            end_dt = datetime.now()
        else:
            end_dt = datetime.fromisoformat(end_date)

        if start_date is None:
            start_dt = end_dt - timedelta(days=7)
        else:
            start_dt = datetime.fromisoformat(start_date)

        # Query Firestore
        db = firestore.client()
        events_ref = (
            db.collection(f"users/{user_id}/buckets/{bucket_id}/events")
            .where("timestamp", ">=", start_dt)
            .where("timestamp", "<=", end_dt)
            .order_by("timestamp", direction=firestore.Query.DESCENDING)
            .limit(limit)
        )

        events = []
        for doc in events_ref.stream():
            event_data = doc.to_dict()
            event_data['id'] = doc.id
            events.append(event_data)

        return {
            "success": True,
            "user_id": user_id,
            "bucket_id": bucket_id,
            "start_date": start_dt.isoformat(),
            "end_date": end_dt.isoformat(),
            "event_count": len(events),
            "events": events
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "user_id": user_id,
            "bucket_id": bucket_id
        }


def get_user_buckets(user_id: str) -> Dict[str, Any]:
    """
    Get all ActivityWatch buckets for a user.

    Args:
        user_id: Firebase Auth user ID

    Returns:
        Dictionary containing bucket information
    """
    try:
        db = firestore.client()
        buckets_ref = db.collection(f"users/{user_id}/buckets")

        buckets = []
        for doc in buckets_ref.stream():
            bucket_data = doc.to_dict()
            bucket_data['id'] = doc.id
            buckets.append(bucket_data)

        return {
            "success": True,
            "user_id": user_id,
            "bucket_count": len(buckets),
            "buckets": buckets
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "user_id": user_id
        }


def get_focus_score(user_id: str, date: Optional[str] = None) -> Dict[str, Any]:
    """
    Get focus quality score for a specific date.

    Args:
        user_id: Firebase Auth user ID
        date: ISO format date (optional, defaults to today)

    Returns:
        Dictionary containing focus score and metrics
    """
    try:
        if date is None:
            target_date = datetime.now().date()
        else:
            target_date = datetime.fromisoformat(date).date()

        # This would typically call the focus quality score service
        # For now, return a placeholder structure
        return {
            "success": True,
            "user_id": user_id,
            "date": target_date.isoformat(),
            "focus_score": 75,  # Placeholder
            "metrics": {
                "context_switches": 45,
                "deep_work_hours": 4.5,
                "distraction_count": 12,
                "productive_time_percentage": 68
            },
            "note": "This is a placeholder. Integrate with FocusQualityScoreService for real data."
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "user_id": user_id
        }


def get_productivity_metrics(
    user_id: str,
    period: str = "week"
) -> Dict[str, Any]:
    """
    Get comprehensive productivity metrics for a period.

    Args:
        user_id: Firebase Auth user ID
        period: "day", "week", or "month"

    Returns:
        Dictionary containing productivity metrics
    """
    try:
        # Calculate date range based on period
        end_date = datetime.now()
        if period == "day":
            start_date = end_date - timedelta(days=1)
        elif period == "week":
            start_date = end_date - timedelta(days=7)
        elif period == "month":
            start_date = end_date - timedelta(days=30)
        else:
            raise ValueError(f"Invalid period: {period}")

        # Query activity data
        db = firestore.client()

        # This is a simplified version - should integrate with actual analytics services
        return {
            "success": True,
            "user_id": user_id,
            "period": period,
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "metrics": {
                "total_active_time_hours": 45.5,
                "productive_time_hours": 32.3,
                "focus_sessions": 18,
                "average_focus_score": 72,
                "top_categories": [
                    {"name": "Development", "hours": 22.5},
                    {"name": "Communication", "hours": 8.2},
                    {"name": "Learning", "hours": 5.6}
                ],
                "productivity_trend": "increasing"
            },
            "note": "Integrate with actual analytics services for real-time data"
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "user_id": user_id,
            "period": period
        }
