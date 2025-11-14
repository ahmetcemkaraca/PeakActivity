# PraisonAI Custom Tools for PeakActivity
# These tools allow AI agents to interact with ActivityWatch data and Firebase services

from .activitywatch_tools import (
    query_activity_data,
    get_user_buckets,
    get_focus_score,
    get_productivity_metrics
)

from .firestore_tools import (
    read_user_data,
    write_user_data,
    update_user_goals,
    create_automation_rule
)

from .notification_tools import (
    send_notification,
    send_ai_recommendation,
    schedule_reminder
)

from .analytics_tools import (
    generate_productivity_report,
    analyze_behavior_patterns,
    detect_anomalies,
    predict_task_completion
)

__all__ = [
    # ActivityWatch tools
    'query_activity_data',
    'get_user_buckets',
    'get_focus_score',
    'get_productivity_metrics',

    # Firestore tools
    'read_user_data',
    'write_user_data',
    'update_user_goals',
    'create_automation_rule',

    # Notification tools
    'send_notification',
    'send_ai_recommendation',
    'schedule_reminder',

    # Analytics tools
    'generate_productivity_report',
    'analyze_behavior_patterns',
    'detect_anomalies',
    'predict_task_completion'
]
