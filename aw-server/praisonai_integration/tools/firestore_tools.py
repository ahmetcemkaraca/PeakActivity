"""
Firestore Data Tools for PraisonAI Agents
These tools allow agents to read and write user data in Firestore
"""

from typing import Dict, List, Any, Optional
from datetime import datetime
from firebase_admin import firestore


def read_user_data(
    user_id: str,
    collection: str,
    document_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Read user data from Firestore.

    Args:
        user_id: Firebase Auth user ID
        collection: Collection path (e.g., "goals", "automation_rules")
        document_id: Specific document ID (optional, returns all if None)

    Returns:
        Dictionary containing the requested data
    """
    try:
        db = firestore.client()

        if document_id:
            # Get specific document
            doc_ref = db.collection(f"users/{user_id}/{collection}").document(document_id)
            doc = doc_ref.get()

            if doc.exists:
                data = doc.to_dict()
                data['id'] = doc.id
                return {
                    "success": True,
                    "user_id": user_id,
                    "collection": collection,
                    "document_id": document_id,
                    "data": data
                }
            else:
                return {
                    "success": False,
                    "error": "Document not found",
                    "user_id": user_id,
                    "collection": collection,
                    "document_id": document_id
                }
        else:
            # Get all documents in collection
            collection_ref = db.collection(f"users/{user_id}/{collection}")
            docs = []
            for doc in collection_ref.stream():
                data = doc.to_dict()
                data['id'] = doc.id
                docs.append(data)

            return {
                "success": True,
                "user_id": user_id,
                "collection": collection,
                "document_count": len(docs),
                "data": docs
            }

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "user_id": user_id,
            "collection": collection
        }


def write_user_data(
    user_id: str,
    collection: str,
    data: Dict[str, Any],
    document_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Write user data to Firestore.

    Args:
        user_id: Firebase Auth user ID
        collection: Collection path
        data: Data to write
        document_id: Specific document ID (optional, creates new if None)

    Returns:
        Dictionary containing operation result
    """
    try:
        db = firestore.client()

        # Add timestamp
        data['updatedAt'] = firestore.SERVER_TIMESTAMP

        if document_id:
            # Update existing document
            doc_ref = db.collection(f"users/{user_id}/{collection}").document(document_id)
            doc_ref.set(data, merge=True)
            return {
                "success": True,
                "user_id": user_id,
                "collection": collection,
                "document_id": document_id,
                "operation": "update"
            }
        else:
            # Create new document
            data['createdAt'] = firestore.SERVER_TIMESTAMP
            doc_ref = db.collection(f"users/{user_id}/{collection}").document()
            doc_ref.set(data)
            return {
                "success": True,
                "user_id": user_id,
                "collection": collection,
                "document_id": doc_ref.id,
                "operation": "create"
            }

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "user_id": user_id,
            "collection": collection
        }


def update_user_goals(
    user_id: str,
    goal_id: str,
    updates: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Update a user's goal.

    Args:
        user_id: Firebase Auth user ID
        goal_id: Goal document ID
        updates: Fields to update

    Returns:
        Dictionary containing operation result
    """
    try:
        db = firestore.client()
        goal_ref = db.collection(f"users/{user_id}/goals").document(goal_id)

        # Verify goal exists
        goal_doc = goal_ref.get()
        if not goal_doc.exists:
            return {
                "success": False,
                "error": "Goal not found",
                "user_id": user_id,
                "goal_id": goal_id
            }

        # Update goal
        updates['updatedAt'] = firestore.SERVER_TIMESTAMP
        goal_ref.update(updates)

        # Get updated data
        updated_goal = goal_ref.get().to_dict()
        updated_goal['id'] = goal_id

        return {
            "success": True,
            "user_id": user_id,
            "goal_id": goal_id,
            "updated_fields": list(updates.keys()),
            "goal": updated_goal
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "user_id": user_id,
            "goal_id": goal_id
        }


def create_automation_rule(
    user_id: str,
    rule_name: str,
    trigger_type: str,
    trigger_conditions: Dict[str, Any],
    action_type: str,
    action_params: Dict[str, Any],
    enabled: bool = True
) -> Dict[str, Any]:
    """
    Create a new automation rule for the user.

    Args:
        user_id: Firebase Auth user ID
        rule_name: Descriptive name for the rule
        trigger_type: Type of trigger (e.g., "time_based", "activity_based")
        trigger_conditions: Conditions that activate the rule
        action_type: Type of action (e.g., "notification", "focus_mode")
        action_params: Parameters for the action
        enabled: Whether the rule is active

    Returns:
        Dictionary containing operation result
    """
    try:
        db = firestore.client()

        rule_data = {
            "name": rule_name,
            "triggerType": trigger_type,
            "triggerConditions": trigger_conditions,
            "actionType": action_type,
            "actionParams": action_params,
            "enabled": enabled,
            "createdAt": firestore.SERVER_TIMESTAMP,
            "updatedAt": firestore.SERVER_TIMESTAMP,
            "executionCount": 0
        }

        rule_ref = db.collection(f"users/{user_id}/automation_rules").document()
        rule_ref.set(rule_data)

        return {
            "success": True,
            "user_id": user_id,
            "rule_id": rule_ref.id,
            "rule": {**rule_data, "id": rule_ref.id}
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "user_id": user_id,
            "rule_name": rule_name
        }
