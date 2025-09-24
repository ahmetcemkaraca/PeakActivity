"""ActivityWatch Constants and Enums.

This module contains all constant values and enumerations used throughout
the ActivityWatch ecosystem. Centralizing constants here improves maintainability
and reduces the risk of typos in string literals.
"""

from enum import Enum


class AFKStatus(Enum):
    """AFK (Away From Keyboard) status constants."""

    AFK = "afk"
    NOT_AFK = "not-afk"


class EventType(Enum):
    """Standard event types used in ActivityWatch."""

    AFK_STATUS = "afkstatus"
    CURRENT_WINDOW = "currentwindow"
    APP_USAGE = "app.editor.activity"
    WEB_USAGE = "web.tab.current"
    INPUT_ACTIVITY = "input.keyboard"
    MOUSE_ACTIVITY = "input.mouse"


class BucketType(Enum):
    """Bucket types for different data sources."""

    AFK_WATCHER = "afkstatus"
    WINDOW_WATCHER = "currentwindow"
    WEB_WATCHER = "web.tab.current"
    EDITOR_WATCHER = "app.editor.activity"
    INPUT_WATCHER = "input"


class Platform(Enum):
    """Supported platforms."""

    WINDOWS = "win32"
    MACOS = "darwin"
    LINUX = "linux"


class DatabaseState(Enum):
    """Database/storage state constants."""

    TESTING = "testing"
    PRODUCTION = "production"


class LogLevel(Enum):
    """Logging level constants."""

    DEBUG = "DEBUG"
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    CRITICAL = "CRITICAL"


class NetworkProtocol(Enum):
    """Network protocol constants."""

    HTTP = "http"
    HTTPS = "https"


class ContentType(Enum):
    """HTTP content type constants."""

    JSON = "application/json"
    TEXT_PLAIN = "text/plain"
    TEXT_HTML = "text/html"


# Default values
DEFAULT_HOST = "localhost"
DEFAULT_PORT = 5600
DEFAULT_PORT_TESTING = 5666
DEFAULT_TIMEOUT = 30
DEFAULT_POLL_TIME = 1.0
DEFAULT_LOG_LEVEL = LogLevel.INFO.value

# File paths and extensions
LOG_FILE_EXTENSION = ".log"
CONFIG_FILE_EXTENSION = ".toml"
BACKUP_FILE_EXTENSION = ".backup"

# Time constants (in seconds)
SECONDS_IN_MINUTE = 60
SECONDS_IN_HOUR = 3600
SECONDS_IN_DAY = 86400
MILLISECONDS_IN_SECOND = 1000

# Data limits
MAX_EVENT_COUNT = 10000
MAX_BUCKET_NAME_LENGTH = 100
MAX_EVENT_DATA_SIZE = 1024 * 1024  # 1MB
DEFAULT_EVENT_LIMIT = 100

# Regular expressions
BUCKET_ID_PATTERN = r"^[a-zA-Z0-9._-]+$"
TIMEPERIOD_PATTERN = (
    r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$"
)

# HTTP status codes
HTTP_OK = 200
HTTP_CREATED = 201
HTTP_NO_CONTENT = 204
HTTP_BAD_REQUEST = 400
HTTP_UNAUTHORIZED = 401
HTTP_NOT_FOUND = 404
HTTP_INTERNAL_SERVER_ERROR = 500

# Cache settings
DEFAULT_CACHE_TTL = 300  # 5 minutes
MAX_CACHE_SIZE = 1000

# Firebase/Firestore constants
FIRESTORE_COLLECTION_USERS = "users"
FIRESTORE_COLLECTION_BUCKETS = "buckets"
FIRESTORE_COLLECTION_EVENTS = "events"
FIRESTORE_COLLECTION_ACTIVITIES = "activities"
FIRESTORE_COLLECTION_GOALS = "goals"
FIRESTORE_COLLECTION_REPORTS = "reports"

# PraisonAI constants
AGENT_GENERATION_INTERVAL_DAYS = 2
MAX_AGENT_CONFIG_SIZE = 10000
DEFAULT_AI_MODEL = "gemini-pro"

# Privacy constants
PRIVACY_MODE_EXCLUDE_TITLE = "excluded"
PRIVACY_MODE_BLUR_TITLE = "blurred"

# Event type constants
MANUAL_ACTIVITY_EVENT_TYPE = "manualactivity"
MICROSURVEY_EVENT_TYPE = "microsurvey"
