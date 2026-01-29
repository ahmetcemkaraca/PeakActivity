# PeakActivity Kullanıcı Kılavuzu

Bu kılavuz, PeakActivity uygulamasının kurulumu, kullanımı ve sorun giderme adımlarını kapsar. Uygulama, aktivite takibi, AI destekli içgörüler ve otomasyon kuralları gibi özellikler sunar.

## Kurulum

### Ön Koşullar
- Node.js 18+ yüklü olmalı
- Python 3.9+ yüklü olmalı
- Firebase hesabı ve proje ayarları gerekli
- Git yüklü olmalı

### Adım Adım Kurulum

1. **Proje Klonlama**
   ```
   git clone https://github.com/ackaraca/PeakActivity.git
   cd PeakActivity
   ```

2. **Bağımlılıkları Yükleme**
   ```
   # Frontend ve Functions için
   npm install

   # Backend için
   cd aw-server
   poetry install
   ```

3. **Firebase Yapılandırması**
   - Firebase Console'da yeni proje oluşturun
   - Service account key indirin ve `functions/serviceAccountKey.json` olarak kaydedin
   - `.env` dosyasını `.env.example`'dan kopyalayın ve değerleri güncelleyin

4. **Uygulamayı Başlatma**
   ```
   # Functions (Backend)
   cd functions
   npm run serve

   # Web UI
   cd aw-server/aw-webui
   npm run dev
   ```

5. **İlk Giriş**
   - Tarayıcıda `http://localhost:3000` adresine gidin
   - E-posta ve şifre ile kaydolun veya giriş yapın

## Kullanım

### Dashboard
- Ana sayfada günlük aktivite özetini görün
- Grafikler ile zaman bazlı analiz yapın
- AI içgörülerini görüntüleyin

### Aktivite Takibi
- Yeni aktivite ekleyin: "Add Activity" butonuna tıklayın
- Kategorileri seçin ve süre girin
- Otomatik kategorizasyon AI tarafından yapılır

### AI Özellikleri
- **İçgörüler**: AI tabanlı öneriler ve analizler
- **Anomali Tespiti**: Olağandışı aktivite günlerini tespit edin
- **Otomasyon Kuralları**: Bildirimler ve mola önerileri ayarlayın

### Ayarlar
- Dil seçimi (Türkçe/English)
- Gizlilik ayarları
- Bildirim tercihleri

## Sorun Giderme

### Yaygın Sorunlar

**Giriş Yapamıyorum**
- E-posta doğrulamasını kontrol edin
- Şifreyi sıfırlayın

**Veri Senkronizasyonu Sorunu**
- İnternet bağlantısını kontrol edin
- Firebase Console'da kuralları kontrol edin

**AI Özellikleri Çalışmıyor**
- API anahtarlarını kontrol edin
- Quota limitlerini kontrol edin

**Uygulama Yüklenmiyor**
- Tarayıcı konsolunu kontrol edin
- Node.js versiyonunu doğrulayın

### Destek
- GitHub Issues: https://github.com/ackaraca/PeakActivity/issues
- E-posta: support@peakactivity.com

## Geliştirici Notları

Bu kılavuz v1.0.0 için geçerlidir. Güncellemeler için CHANGELOG.md'yi kontrol edin.

---

# PeakActivity User Manual

This guide covers installation, usage, and troubleshooting for the PeakActivity application. The app provides activity tracking, AI-powered insights, and automation rules.

## Installation

### Prerequisites
- Node.js 18+ installed
- Python 3.9+ installed
- Firebase account and project setup required
- Git installed

### Step-by-Step Installation

1. **Clone the Project**
   ```
   git clone https://github.com/ackaraca/PeakActivity.git
   cd PeakActivity
   ```

2. **Install Dependencies**
   ```
   # For frontend and functions
   npm install

   # For backend
   cd aw-server
   poetry install
   ```

3. **Firebase Configuration**
   - Create a new project in Firebase Console
   - Download service account key and save as `functions/serviceAccountKey.json`
   - Copy `.env.example` to `.env` and update values

4. **Start the Application**
   ```
   # Functions (Backend)
   cd functions
   npm run serve

   # Web UI
   cd aw-server/aw-webui
   npm run dev
   ```

5. **First Login**
   - Go to `http://localhost:3000` in your browser
   - Sign up or login with email and password

## Usage

### Dashboard
- View daily activity summary on the main page
- Analyze time-based data with charts
- View AI insights

### Activity Tracking
- Add new activity: Click "Add Activity" button
- Select categories and enter duration
- Automatic categorization done by AI

### AI Features
- **Insights**: AI-based recommendations and analysis
- **Anomaly Detection**: Detect unusual activity days
- **Automation Rules**: Set up notifications and break suggestions

### Settings
- Language selection (Turkish/English)
- Privacy settings
- Notification preferences

## Troubleshooting

### Common Issues

**Cannot Login**
- Check email verification
- Reset password

**Data Sync Issues**
- Check internet connection
- Verify Firebase rules in Console

**AI Features Not Working**
- Check API keys
- Verify quota limits

**Application Not Loading**
- Check browser console
- Verify Node.js version

### Support
- GitHub Issues: https://github.com/ackaraca/PeakActivity/issues
- Email: support@peakactivity.com

## Developer Notes

This manual is for v1.0.0. Check CHANGELOG.md for updates.
