import os
import json
import firebase_admin
from firebase_admin import credentials, firestore
from google.cloud import secretmanager

# Test ortamı için mock
import sys

if os.environ.get("TESTING") or "PYTEST_CURRENT_TEST" in os.environ:
    from unittest.mock import MagicMock

    firebase_admin.initialize_app = MagicMock()
    firestore.client = MagicMock(return_value=MagicMock())
    db = MagicMock()
else:

    def initialize_firebase():
        if not firebase_admin._apps:
            try:
                # Try to load credentials from Google Secret Manager
                project_id = os.environ.get("GCP_PROJECT")
                secret_name = os.environ.get("FIREBASE_SERVICE_ACCOUNT_SECRET_NAME")

                if project_id and secret_name:
                    client = secretmanager.SecretManagerServiceClient()
                    name = (
                        f"projects/{project_id}/secrets/{secret_name}/versions/latest"
                    )
                    response = client.access_secret_version(request={"name": name})
                    service_account_info = json.loads(
                        response.payload.data.decode("UTF-8")
                    )
                    cred = credentials.Certificate(service_account_info)
                    firebase_admin.initialize_app(cred)
                    print("Firebase Admin SDK başarıyla başlatıldı (Secret Manager).")
                else:
                    # Fallback to Application Default Credentials for local development/testing
                    cred = credentials.ApplicationDefault()
                    firebase_admin.initialize_app(cred)
                    print(
                        "Firebase Admin SDK başarıyla başlatıldı (Application Default)."
                    )

            except Exception as e:
                print(f"Firebase Admin SDK başlatılırken hata oluştu: {e}")
                print(
                    "Kimlik bilgileri yüklenemedi. Ortam değişkenlerini (GCP_PROJECT, FIREBASE_SERVICE_ACCOUNT_SECRET_NAME) veya serviceAccountKey.json dosyasını kontrol edin."
                )

        return firestore.client()

    db = initialize_firebase()
