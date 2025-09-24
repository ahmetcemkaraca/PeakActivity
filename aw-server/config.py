from pydantic import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Firebase Configuration
    firebase_api_key: Optional[str] = None
    firebase_auth_domain: Optional[str] = None
    firebase_project_id: Optional[str] = None
    firebase_storage_bucket: Optional[str] = None
    firebase_messaging_sender_id: Optional[str] = None
    firebase_app_id: Optional[str] = None

    # Database
    db_url: str = "sqlite:///data/activitywatch.db"
    firestore_emulator_host: Optional[str] = None

    # API Keys
    gemini_api_key: Optional[str] = None
    openai_api_key: Optional[str] = None
    google_calendar_api_key: Optional[str] = None

    # External Services
    trello_api_key: Optional[str] = None
    jira_api_token: Optional[str] = None

    # Development
    node_env: str = "development"
    debug: bool = False

    # Security
    jwt_secret: Optional[str] = None
    encryption_key: Optional[str] = None

    class Config:
        env_file = ".env"

settings = Settings()
