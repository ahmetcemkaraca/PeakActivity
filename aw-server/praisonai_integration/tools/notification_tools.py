"""
Notification Tools for PraisonAI Agents
These tools allow agents to send notifications and reminders to users
"""

from typing import Dict, List, Any, Optional
from datetime import datetime
from firebase_admin import firestore, messaging


def send_notification(
    user_id: str,
    title: str,
    body: str,
    notification_type: str = "info",
    action_url: Optional[str] = None,
    data: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Send a notification to the user.

    Args:
        user_id: Firebase Auth user ID
        title: Notification title
        body: Notification body text
        notification_type: Type ("info", "warning", "success", "error", "ai_recommendation")
        action_url: Optional URL for notification action
        data: Additional data to include

    Returns:
        Dictionary containing operation result
    """
    try:
        db = firestore.client()

        notification_data = {
            "userId": user_id,
            "title": title,
            "body": body,
            "type": notification_type,
            "actionUrl": action_url,
            "data": data or {},
            "read": False,
            "dismissed": False,
            "createdAt": firestore.SERVER_TIMESTAMP
        }

        # Store in Firestore
        notif_ref = db.collection(f"users/{user_id}/notifications").document()
        notif_ref.set(notification_data)

        # TODO: Also send via FCM if user has device tokens
        # Get user's FCM tokens and send push notification

        return {
            "success": True,
            "user_id": user_id,
            "notification_id": notif_ref.id,
            "title": title,
            "type": notification_type
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "user_id": user_id,
            "title": title
        }


def send_ai_recommendation(
    user_id: str,
    recommendation: str,
    category: str,
    confidence_score: float,
    reasoning: Optional[str] = None,
    action_items: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    Send an AI-generated recommendation to the user.

    Args:
        user_id: Firebase Auth user ID
        recommendation: The recommendation text
        category: Category ("productivity", "health", "focus", "schedule")
        confidence_score: AI confidence (0.0 to 1.0)
        reasoning: Optional explanation of the recommendation
        action_items: Optional list of actionable steps

    Returns:
        Dictionary containing operation result
    """
    try:
        title = f"AI Recommendation: {category.capitalize()}"
        body = recommendation

        data = {
            "category": category,
            "confidence_score": confidence_score,
            "reasoning": reasoning,
            "action_items": action_items or [],
            "source": "ai_agent"
        }

        return send_notification(
            user_id=user_id,
            title=title,
            body=body,
            notification_type="ai_recommendation",
            data=data
        )

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "user_id": user_id
        }


def schedule_reminder(
    user_id: str,
    reminder_text: str,
    scheduled_time: str,  # ISO format datetime
    reminder_type: str = "general",
    recurrence: Optional[str] = None
) -> Dict[str, Any]:
    """
    Schedule a reminder for the user.

    Args:
        user_id: Firebase Auth user ID
        reminder_text: Reminder message
        scheduled_time: When to send the reminder (ISO format)
        reminder_type: Type of reminder ("general", "break", "focus", "goal")
        recurrence: Optional recurrence pattern ("daily", "weekly", "monthly")

    Returns:
        Dictionary containing operation result
    """
    try:
        db = firestore.client()

        # Parse scheduled time
        scheduled_dt = datetime.fromisoformat(scheduled_time)

        reminder_data = {
            "userId": user_id,
            "text": reminder_text,
            "type": reminder_type,
            "scheduledTime": scheduled_dt,
            "recurrence": recurrence,
            "sent": False,
            "createdAt": firestore.SERVER_TIMESTAMP
        }

        # Store reminder
        reminder_ref = db.collection(f"users/{user_id}/reminders").document()
        reminder_ref.set(reminder_data)

        # TODO: Set up Cloud Scheduler or Cloud Tasks to trigger at scheduled time

        return {
            "success": True,
            "user_id": user_id,
            "reminder_id": reminder_ref.id,
            "scheduled_time": scheduled_time,
            "type": reminder_type
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "user_id": user_id,
            "scheduled_time": scheduled_time
        }
