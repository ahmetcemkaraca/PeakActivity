# Copyright 2025 PeakActivity
# Licensed under the Mozilla Public License, v. 2.0.
# See LICENSE.txt for more details.
# Bir Sonraki Adımlar – 2025-07-13 00:00

Aşağıdaki liste, mevcut **PeakActivityMain** projesinde yüksek öncelikli olarak ele alınması gereken konuları özetler. Daha ayrıntılı alt görevler için `remaining_tasks.md` ve `checklist.md` dosyalarına başvurabilirsiniz.

## 1. Güvenlik ve Altyapı

1. ✅ **Firestore Güvenlik Kuralları**  
   * `firestore.rules` dosyasını güncelleyerek tüm koleksiyonlar için ayrıntılı kural seti tanımla.  
   * CI/CD’de kuralların test edilmesi için otomatik birim testleri ekle.
2. ✅ **Storage Güvenlik Kuralları**  
   * `storage.rules` dosyasında dosya erişim izinlerini sıkılaştır.
3. ✅ **Gizli Anahtar Yönetimi**  
   * Üretim ortamında Google Service Account anahtarlarını Secret Manager üzerinden yükle.
4. ✅ **Hata Yönetimi & Loglama**  
   * Python tarafında `logging` modülüne geç; Firebase/Cloud Logging entegrasyonu ekle.

## 2. Veri Anonimleştirme ve Performans

1. ✅ **Anonimleştirme Servisi**  
   * `aw_server/firebase_datastore` içindeki geçici maskeleri modüler hash-tabanlı servise dönüştür.  
   * Kullanıcı tercihlerine göre anonimleştirilecek alanları yapılandırılabilir kıl.
2. ✅ **Firestore Sorgu Optimizasyonu**  
   * Büyük koleksiyonlar için toplu sayım (aggregation) fonksiyonları oluştur.

## 3. PraisonAI Agent Entegrasyonu

1. **Web UI Bileşenleri**  
   * Ajan yapılandırma formu, tetikleme butonu ve çıktı paneli Vue bileşenleri olarak ekle.  
   * Pinia store entegrasyonu ile ajan durumunu yönet.
2. **Firebase Functions > aw-server Köprüsü**  
   * `generateAgent` fonksiyonunu prod ortamına dağıt, güvenlik kurallarını test et.
3. ✅ **API Anahtar Akışı**  
   * Gemini API anahtarının yalnızca Backend hattında taşındığını doğrula.

## 4. Check-list’teki Eksik Özellikler

* **IDE İçi Kod Yazma / Hata Ayıklama Ayrımı** (1.3)  
  Klavye-mouse analizi, debug mode tespiti ve grafik bileşenleri.
* **“Düşünme Süresi” Etiketi** (1.4)  
  Pasif aktivite analizi ve UI entegrasyonu.
* **Gelişmiş Analitik & NLP Modülleri**  
  Odak skoru trend analizi, çoklu metrik anomali, gelişmiş kategorizasyon.

## 5. DevOps

1. ✅ **CI/CD Pipeline Geliştirmesi**  
   * Otomatik test, linter ve güvenlik taraması adımlarını tamamla.
2. **Çoklu Ortam Desteği**  
   * Staging & Production ortam değişkenlerini ayrıştır.

---
Bu dosya her sprint başında güncellenmelidir. Tamamlanan maddeleri **işaretleyip** yeni görevleri eklemeyi unutmayın. 