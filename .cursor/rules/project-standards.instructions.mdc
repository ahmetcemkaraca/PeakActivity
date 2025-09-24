---
applyTo: "**"
description: "Core development standards and project guidelines for PeakActivity"
---

# PeakActivity Geliştirme Standartları

Bu dosya, PeakActivity projesi için temel geliştirme standartlarını ve kod inceleme politikalarını tanımlar.

## Kod İnceleme Politikası

Tüm kodlar, birleştirilmeden önce akran değerlendirmesinden geçmelidir. Güvenlik, performans ve okunabilirlik için kontrol listeleri kullanılmalıdır.

### Kontrol Listesi
- [ ] Güvenlik açıkları kontrol edildi
- [ ] Performans impact değerlendirildi  
- [ ] Kod okunabilirliği standartlara uygun
- [ ] Test coverage yeterli
- [ ] Dokümantasyon güncellendi

## Mimari Karar Kayıtları (ADR)

Tüm önemli mimari kararlar ADR formatında belgelenmelidir:

```markdown
# ADR-001: Firebase Firestore Kullanımı
## Bağlam
Kullanıcı etkinliği için ölçeklenebilir, gerçek zamanlı veritabanına ihtiyaç var.
## Karar  
Firestore'u birincil veri deposu olarak benimseyin.
## Sonuçlar
Gerçek zamanlı senkronizasyonu etkinleştirir, bulut maliyetlerini artırır.
```

## Kullanıcı Geri Bildirimi Entegrasyonu

- Hem web hem de masaüstü uygulamalarında geri bildirim toplama sistemi
- Kategorizasyon: hata, özellik isteği, kullanılabilirlik, performans
- Merkezi izleme sistemi (GitHub Issues/Jira)
- Kullanıcı geri bildirimlerine dayalı sürüm notları

## Güvenlik Standartları

OWASP Top 10 ve Google Cloud güvenlik yönergelerine uyum:

- Tüm kullanıcı girişlerini doğrulayın ve temizleyin
- HTTPS kullanımı zorunlu
- Gizli bilgiler sadece ortam değişkenlerinde
- En az ayrıcalık ilkesi
- 2FA tüm admin hesapları için zorunlu
- Düzenli güvenlik denetimi

## Performans Kıyaslama

Ana özelliklerin performans kıyaslamaları ve gerileme testleri:

### Metrikler
- Response time < 200ms (API endpoints)
- Memory usage < 100MB (client apps)
- CPU usage < 5% (background processes)
- Disk I/O optimizasyonu
