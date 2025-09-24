import pytest
import asyncio
from datetime import datetime, timedelta, timezone
import os
from unittest.mock import patch, MagicMock


# Firebase Admin SDK ve Firestore'u test ortamında mock'la
@pytest.fixture(autouse=True, scope="module")
def mock_firebase():
    with patch("firebase_admin.initialize_app") as mock_init_app, patch(
        "firebase_admin.firestore.client"
    ) as mock_firestore_client:
        mock_init_app.return_value = MagicMock()
        mock_firestore_client.return_value = MagicMock()
        yield


# Test için Firebase emülatör URL'lerini kullan
FIRESTORE_EMULATOR_HOST = os.environ.get("FIRESTORE_EMULATOR_HOST", "localhost:8080")
FIREBASE_FUNCTIONS_URL = os.environ.get(
    "FIREBASE_FUNCTIONS_URL", "http://localhost:5001"
)

# Eğer Firebase Admin SDK zaten başlatılmadıysa başlat
if not firebase_admin._apps:
    # Firebase emülatörleri için kimlik bilgisi gerekmez
    # Gerçek bir proje için serviceAccountKey.json veya ApplicationDefault kimlik bilgileri kullanılır
    firebase_admin.initialize_app(credentials.ApplicationDefault())

# Firestore istemcisini al
# Firestore emülatörüne bağlanmak için ortam değişkeni ayarlı olmalıdır (FIRESTORE_EMULATOR_HOST)
firebase_db = firestore.client()

# Cloud Functions callable istemcisini al
# Functions emülatörüne bağlanmak için ortam değişkeni ayarlı olmalıdır (FIREBASE_FUNCTIONS_URL)
# Bu URL, httpCallable fonksiyonuna argüman olarak da verilebilir.


@pytest.fixture(scope="module")
def firebase_test_client(flask_client):
    """Firestore depolamasıyla testler için aw-server Flask istemcisini döndürür."""
    # Flask uygulaması zaten conftest.py içinde başlatıldığı için,
    # burada sadece client'ı kullanıyoruz ve aw-server'ın Firebase depolamasını kullandığından emin oluyoruz.
    # Bunun için aw-server'ı `--storage firestore` argümanıyla başlatmak gerekir.
    # Bu, test ortamı kurulumuna bağlıdır.
    yield flask_client


@pytest.mark.asyncio
async def test_firestore_bucket_create_and_delete(firebase_test_client):
    bucket_id = "test-firebase-bucket-create-delete"

    # 1. Kova oluştur
    r = firebase_test_client.post(
        f"/api/0/buckets/{bucket_id}",
        json={"client": "test", "type": "test", "hostname": "test"},
    )
    assert (
        r.status_code == 200 or r.status_code == 304
    )  # 200: created, 304: already exists

    # Firestore'da kovanın varlığını doğrula
    bucket_doc = firebase_db.collection("buckets").document(bucket_id).get()
    assert bucket_doc.exists
    assert bucket_doc.to_dict()["type"] == "test"

    # 2. Kova sil
    r = firebase_test_client.delete(f"/api/0/buckets/{bucket_id}?force=1")
    assert r.status_code == 200

    # Firestore'da kovanın silindiğini doğrula
    bucket_doc = firebase_db.collection("buckets").document(bucket_id).get()
    assert not bucket_doc.exists


@pytest.mark.asyncio
async def test_firebase_event_create_and_get(firebase_test_client):
    bucket_id = "test-firebase-event-create-get"

    # Kovayı oluştur
    firebase_test_client.post(
        f"/api/0/buckets/{bucket_id}",
        json={"client": "test", "type": "test", "hostname": "test"},
    )

    # Olay oluştur
    now = datetime.now(timezone.utc)
    event_data = {
        "timestamp": now.isoformat(),
        "duration": 10,
        "data": {"app": "test-app"},
    }
    r = firebase_test_client.post(
        f"/api/0/buckets/{bucket_id}/events",
        json=[event_data],
    )
    assert r.status_code == 200

    # Firestore'da olayın varlığını doğrula
    events_collection_ref = (
        firebase_db.collection("buckets").document(bucket_id).collection("events")
    )
    docs = events_collection_ref.stream()
    event_ids = [doc.id for doc in docs]
    assert len(event_ids) == 1

    # Olayı geri al
    r = firebase_test_client.get(f"/api/0/buckets/{bucket_id}/events")
    assert r.status_code == 200
    assert len(r.json) == 1
    assert r.json[0]["data"]["app"] == "test-app"

    # Kovayı sil
    firebase_test_client.delete(f"/api/0/buckets/{bucket_id}?force=1")


@pytest.mark.asyncio
async def test_data_synchronization(firebase_test_client):
    # Bu test, hem yerel hem de Firebase veritabanının çalıştığını varsayar.
    # `aw-server`'ı iki depolama yöntemiyle birlikte başlatmak gerekir.
    # Bu testin gerçekçi olması için, farklı bir depolama yöntemiyle başlatılan
    # bir Flask uygulamasını kullanmak daha iyi olur.

    # Tam senkronizasyonu tetikle (yerelden Firebase'e ve tersi)
    r = await firebase_test_client.post(f"/api/0/sync", json={"sync_type": "full"})
    assert r.status_code == 200
    assert r.json["status"] == "success"
    assert "Tam senkronizasyon" in r.json["message"]

    # Belirli bir kovanın yüklenmesini tetikle
    bucket_id = "test-sync-upload-bucket"
    firebase_test_client.post(
        f"/api/0/buckets/{bucket_id}",
        json={"client": "test", "type": "test", "hostname": "test"},
    )
    r = await firebase_test_client.post(
        f"/api/0/sync", json={"sync_type": "upload", "bucket_id": bucket_id}
    )
    assert r.status_code == 200
    assert r.json["status"] == "success"
    assert f"Kova {bucket_id} Firebase'e yüklendi." in r.json["message"]

    # Firebase'den indirmeyi tetikle
    r = await firebase_test_client.post(f"/api/0/sync", json={"sync_type": "download"})
    assert r.status_code == 200
    assert r.json["status"] == "success"
    assert "Firebase'den veriler indirildi." in r.json["message"]

    # Kovayı sil
    firebase_test_client.delete(f"/api/0/buckets/{bucket_id}?force=1")


@pytest.mark.asyncio
async def test_ai_insights_endpoints(firebase_test_client):
    user_id = "test-user-id-123"
    start_date = "2023-01-01"
    end_date = "2023-01-31"

    # Anomaly Detection Testi
    r = await firebase_test_client.post(
        f"/api/0/ai/anomaly-detection",
        json={"userId": user_id, "startDate": start_date, "endDate": end_date},
    )
    assert r.status_code == 200
    assert "anomalies" in r.json  # Örnek bir çıktı beklentisi
    assert r.json["anomalies"] == [
        "Simulated Anomaly for test-user-id-123 from 2023-01-01 to 2023-01-31"
    ]

    # Behavioral Trends Testi
    r = await firebase_test_client.post(
        f"/api/0/ai/behavioral-trends",
        json={"userId": user_id, "startDate": start_date, "endDate": end_date},
    )
    assert r.status_code == 200
    assert "trends" in r.json  # Örnek bir çıktı beklentisi
    assert r.json["trends"] == [
        "Simulated Behavioral Trend for test-user-id-123 from 2023-01-01 to 2023-01-31"
    ]

    # Focus Quality Score Testi
    r = await firebase_test_client.post(
        f"/api/0/ai/focus-quality-score",
        json={"userId": user_id, "startDate": start_date, "endDate": end_date},
    )
    assert r.status_code == 200
    assert "score" in r.json  # Örnek bir çıktı beklentisi
    assert r.json["score"] == 85.0  # Simüle edilmiş bir puan
