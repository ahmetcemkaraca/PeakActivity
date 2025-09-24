# Kullanıcı Gizlilik Kılavuzu

## 1. Giriş
Bu kılavuz, ActivityWatch'un verilerinizi nasıl topladığını, işlediğini ve koruduğunu anlamanıza yardımcı olmak için tasarlanmıştır. Gizliliğiniz bizim için en yüksek önceliktir ve verileriniz üzerinde tam kontrole sahip olmanızı sağlamak için şeffaf politikalar ve güçlü şifreleme kullanıyoruz.

## 2. Veri Toplama ve Kullanım İlkeleri

### 2.1. Açık Onay
- Verileriniz toplanmadan veya işlenmeden önce her zaman açık izninizi isteriz.
- Hangi verilerin toplandığı, neden toplandığı ve nasıl kullanıldığı hakkında size net bilgi veririz.

### 2.2. Veri Minimalizasyonu
- Yalnızca uygulamanın temel işlevleri için kesinlikle gerekli olan verileri toplarız.
- Toplanan verileri anonimleştirme veya takma ad kullanma yöntemleriyle koruruz.

### 2.3. Veri Saklama Süreleri
- Verileriniz, yalnızca belirtilen amaçlar için gerektiği kadar saklanır. Belirli bir süre sonra otomatik olarak silinir veya anonimleştirilir.

## 3. Veri Sınıflandırması ve Gizlilik Seviyeleri

ActivityWatch, veri gizliliğini tercihlerinize göre yönetmeniz için üç farklı seviye sunar:

### 3.1. Seviye 1 - Anonim Sistem Verileri (Otomatik Toplanır)
- **Kapsam:** Uygulama performansı, hata raporları ve temel kullanım istatistikleri gibi anonimleştirilmiş teknik veriler.
- **Amaç:** Uygulamanın kararlılığını ve performansını artırmak.
- **Gizlilik Notu:** Bu veriler sizi doğrudan tanımlamaz ve varsayılan olarak toplanır. İsterseniz bu toplamayı kapatabilirsiniz.

### 3.2. Seviye 2 - Anonimleştirilmiş Kullanım Verileri (Onay Gerektirir)
- **Kapsam:** Belirli uygulamalarda veya kategorilerde geçirilen süre gibi daha ayrıntılı, ancak kişisel olarak tanımlayıcı olmayan kullanım verileri. Örneğin, bir web sitesinde ne kadar zaman geçirdiğiniz kaydedilir, ancak ziyaret ettiğiniz belirli sayfaların başlıkları veya URL'leri anonimleştirilir.
- **Amaç:** Genel kullanım eğilimlerini analiz etmek ve AI destekli özellikler için toplanmış verileri kullanmak.
- **Gizlilik Notu:** Bu veriler sizi doğrudan tanımlamaz ve yalnızca açık izninizle toplanır. İstediğiniz zaman bu onayı geri çekebilirsiniz.

### 3.3. Seviye 3 - Hassas Kişisel Veriler (Özel Onay ve Şifreleme Gerektirir)
- **Kapsam:** Pencere başlıkları, detaylı aktivite günlükleri veya AI işleme için ham metin verileri gibi hassas veriler.
- **Amaç:** Tamamen kişiselleştirilmiş analizler ve AI destekli içgörüler sunmak.
- **Gizlilik Notu:** Bu veriler özel onayınızı ve istemci tarafı şifrelemesini gerektirir. Verileriniz şifreli olarak saklanır ve işlenir. Sunucularımız, sizin ana parolanız olmadan bu verileri asla düz metin olarak göremez.

## 4. Verileriniz Nasıl Korunur (Şifreleme)

Verilerinizin güvenliğini sağlamak için endüstri lideri şifreleme standartlarını kullanıyoruz:

### 4.1. Uçtan Uca Şifreleme
- Hassas verileriniz cihazınızda şifrelenir ve yalnızca sizin ana parolanızla erişilebilir. Sunucularımız bu verilerin şifresini çözemez.

### 4.2. Güçlü Şifreleme Algoritmaları
- Verileriniz AES-256-GCM gibi güçlü şifreleme algoritmalarıyla korunur.

### 4.3. Güvenli Anahtar Yönetimi
- Ana parolanızdan türetilen şifreleme anahtarlarınız, işletim sisteminizin güvenli anahtarlığına (örneğin, Windows Kimlik Bilgileri Deposu, macOS Anahtarlık) entegre edilerek saklanır.
- Anahtarlarınız düzenli olarak otomatik olarak döndürülür (değiştirilir) ve bu süreç tüm şifreli verilerinizin yeni anahtarla yeniden şifrelenmesini içerir.

### 4.4. Anahtar Kurtarma Seçenekleri
- Ana parolanızı kaybetmeniz durumunda, güvenlik soruları, yedek kodlar veya e-posta tabanlı kurtarma gibi seçeneklerle anahtarınıza erişimi yeniden sağlayabilirsiniz.

## 5. Veri Paylaşımı ve Üçüncü Taraflar

- Verilerinizi, açık izniniz olmadan üçüncü taraflarla asla paylaşmayız.
- Eğer üçüncü taraf entegrasyonlarını (örneğin, Google Takvim, Trello) etkinleştirirseniz, ilgili kimlik bilgileriniz ve token'larınız her zaman şifreli olarak saklanır.

## 6. Haklarınız

Verileriniz üzerinde aşağıdaki haklara sahipsiniz:
- **Erişim Hakkı:** Hangi verilerinizin toplandığını bilme ve onlara erişme.
- **Düzeltme Hakkı:** Yanlış veya eksik verilerinizi düzeltme.
- **Silme Hakkı (Unutulma Hakkı):** Verilerinizin silinmesini talep etme.
- **Veri Taşınabilirliği Hakkı:** Verilerinizi başka bir hizmete taşıma.
- **İşlemeyi Kısıtlama Hakkı:** Belirli veri işleme faaliyetlerini kısıtlama.

Bu haklarınızı kullanmak için lütfen destek ekibimizle iletişime geçin.

## 7. İletişim
Gizlilik uygulamalarımız hakkında herhangi bir sorunuz varsa, lütfen [destek@peakactivity.com](mailto:destek@peakactivity.com) adresinden bizimle iletişime geçin. 