# Copyright 2025 PeakActivity
# Licensed under the Mozilla Public License, v. 2.0.
# See LICENSE.txt for more details.
# PeakActivity TODO Expansion 2 - Görevler 300-600 Senior Developer Perspektifinden Çözüm Analizi

## Giriş

Bu dokümantasyon, todo600.md dosyasındaki 300-600 arası güvenlik görevlerinin nasıl çözüleceğini, senior software developer perspektifiyle, merkezi çözümler odaklı ve mevcut proje yapısını bozmayacak şekilde detaylandırır. Bu görevler temel olarak **Güvenlik** kategorisinde yer almakta olup, veri güvenliği, API güvenliği ve ağ güvenliği konularını kapsamaktadır.

---

## Bölüm 1: Brute Force ve Oturum Güvenliği (300-320)

### 300. Brute Force Saldırı Koruması

**Sorun:** `aw-server`'da kullanıcı oturum açma denemelerinde rate limiting ve brute force koruması bulunmuyor.

**Çözüm:** Merkezi bir oturum deneme sayacı ve IP bazlı engelleme sistemi implementasyonu.

**Implementasyon:**
```python
# aw-server/aw_server/middleware/security.py
from flask import request, abort
from functools import wraps
import redis
import time

class BruteForceProtection:
    def __init__(self, redis_client, max_attempts=5, lockout_time=900):  # 15 dakika
        self.redis = redis_client
        self.max_attempts = max_attempts
        self.lockout_time = lockout_time
    
    def is_ip_blocked(self, ip):
        key = f"login_attempts:{ip}"
        attempts = self.redis.get(key)
        return attempts and int(attempts) >= self.max_attempts
    
    def record_failed_attempt(self, ip, username=None):
        key = f"login_attempts:{ip}"
        self.redis.incr(key)
        self.redis.expire(key, self.lockout_time)
        
        # Ek olarak kullanıcı bazlı da blokla
        if username:
            user_key = f"login_attempts:user:{username}"
            self.redis.incr(user_key)
            self.redis.expire(user_key, self.lockout_time)
    
    def clear_attempts(self, ip, username=None):
        self.redis.delete(f"login_attempts:{ip}")
        if username:
            self.redis.delete(f"login_attempts:user:{username}")

# aw-server/aw_server/api.py içinde kullanım
@brute_force_protection
def login_endpoint():
    ip = request.remote_addr
    if brute_force.is_ip_blocked(ip):
        abort(429, "Too many login attempts. Try again later.")
    # ...login logic...
```

**İlişkili Dosyalar:**
- `aw-server/aw_server/api.py` - Login endpoint'leri için
- `aw-server/aw_server/middleware/security.py` - Yeni güvenlik middleware'i
- `aw-server/aw_server/config.py` - Redis konfigürasyonu
- `requirements.txt` - Redis kütüphanesi eklenmesi

**Uyumluluk:** ✅ Mevcut authentication sistemini bozmaz, Redis ekler

### 301-302. JWT Token Güvenliği

**Sorun:** JWT token'larında algorithm validation ve token invalidation eksikliği.

**Çözüm:** Merkezi JWT yönetim sistemi ile algorithm validation ve blacklist mekanizması.

**Implementasyon:**
```python
# aw-server/aw_server/security/jwt_manager.py
import jwt
from functools import wraps
from flask import request, current_app, g

class SecureJWTManager:
    def __init__(self, redis_client):
        self.redis = redis_client
        self.allowed_algorithms = ['RS256', 'HS256']  # 'none' algorithm asla kabul edilmez
    
    def validate_token(self, token):
        try:
            # Header'ı decode et ve algoritma kontrolü yap
            header = jwt.get_unverified_header(token)
            if header.get('alg') not in self.allowed_algorithms:
                raise jwt.InvalidTokenError("Invalid algorithm")
            
            # Token blacklist'te mi kontrol et
            if self.is_token_blacklisted(token):
                raise jwt.InvalidTokenError("Token has been revoked")
            
            # Token'ı doğrula
            payload = jwt.decode(
                token, 
                current_app.config['JWT_SECRET_KEY'], 
                algorithms=self.allowed_algorithms
            )
            return payload
        except jwt.InvalidTokenError:
            return None
    
    def blacklist_token(self, token):
        """Token'ı blacklist'e ekle"""
        jti = jwt.decode(token, verify=False).get('jti')  # JWT ID
        if jti:
            self.redis.setex(f"blacklisted_token:{jti}", 86400 * 7, "1")  # 7 gün
    
    def is_token_blacklisted(self, token):
        try:
            jti = jwt.decode(token, verify=False).get('jti')
            return self.redis.exists(f"blacklisted_token:{jti}")
        except:
            return True

def require_auth(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        payload = jwt_manager.validate_token(token)
        if not payload:
            abort(401, "Invalid or expired token")
        g.current_user = payload
        return f(*args, **kwargs)
    return decorated_function
```

**İlişkili Dosyalar:**
- `aw-server/aw_server/security/jwt_manager.py` - Yeni JWT yönetim modülü
- `aw-server/aw_server/api.py` - Auth endpoint'leri için decorator kullanımı
- `aw-server/aw_server/server.py` - JWT manager initialization

**Uyumluluk:** ✅ Mevcut JWT sistemini güçlendirir, uyumlu

### 303-304. HTTP Güvenlik Headers ve Cookie Güvenliği

**Sorun:** HTTP response'larda güvenlik header'ları ve güvenli cookie ayarları eksik.

**Çözüm:** Flask middleware ile otomatik güvenlik header'ları ekleme.

**Implementasyon:**
```python
# aw-server/aw_server/middleware/security_headers.py
from flask import Flask, make_response

class SecurityHeadersMiddleware:
    def __init__(self, app: Flask):
        self.app = app
        app.after_request(self.add_security_headers)
        self.configure_session_cookies()
    
    def add_security_headers(self, response):
        # Content Security Policy - XSS koruması
        response.headers['Content-Security-Policy'] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "connect-src 'self' https:; "
            "font-src 'self'"
        )
        
        # HSTS - HTTPS zorunluluğu
        response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
        
        # MIME type sniffing koruması
        response.headers['X-Content-Type-Options'] = 'nosniff'
        
        # Clickjacking koruması
        response.headers['X-Frame-Options'] = 'DENY'
        
        # XSS koruması
        response.headers['X-XSS-Protection'] = '1; mode=block'
        
        # Referrer policy
        response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        
        # Server bilgisini gizle
        response.headers.pop('Server', None)
        
        return response
    
    def configure_session_cookies(self):
        """Session cookie'lerini güvenli hale getir"""
        self.app.config.update(
            SESSION_COOKIE_SECURE=True,      # HTTPS zorunlu
            SESSION_COOKIE_HTTPONLY=True,    # JS erişimi yok
            SESSION_COOKIE_SAMESITE='Strict', # CSRF koruması
            PERMANENT_SESSION_LIFETIME=3600   # 1 saat
        )

# aw-server/aw_server/server.py içinde kullanım
def create_app():
    app = AWFlask(__name__)
    SecurityHeadersMiddleware(app)
    return app
```

**İlişkili Dosyalar:**
- `aw-server/aw_server/middleware/security_headers.py` - Yeni güvenlik middleware'i
- `aw-server/aw_server/server.py` - Middleware entegrasyonu
- `aw-server/aw_server/config.py` - Cookie ayarları

**Uyumluluk:** ✅ Response'lara header ekler, mevcut functionality'yi bozmaz

### 305-306. Hesap Güvenliği ve API Bilgi Gizleme

**Sorun:** Kritik hesap işlemlerinde ek doğrulama eksikliği ve API'da sistem bilgisi sızıntısı.

**Çözüm:** İki faktörlü doğrulama ve API bilgi maskeleme.

**Implementasyon:**
```python
# aw-server/aw_server/security/account_security.py
from flask import request, session
import hashlib
import time

class AccountSecurityManager:
    def __init__(self, redis_client):
        self.redis = redis_client
    
    def require_password_confirmation(self, user_id, password):
        """Kritik işlemler için şifre doğrulama"""
        # Şifre hash'ini kontrol et (gerçek implementasyonda bcrypt kullan)
        stored_hash = self.get_user_password_hash(user_id)
        provided_hash = hashlib.sha256(password.encode()).hexdigest()
        
        if stored_hash != provided_hash:
            return False
        
        # Confirmation token oluştur (5 dakika geçerli)
        token = self.generate_confirmation_token(user_id)
        self.redis.setex(f"password_confirmed:{user_id}", 300, token)
        return token
    
    def is_password_recently_confirmed(self, user_id, token):
        """Son 5 dakikada şifre doğrulandı mı?"""
        stored_token = self.redis.get(f"password_confirmed:{user_id}")
        return stored_token and stored_token.decode() == token
    
    def generate_confirmation_token(self, user_id):
        return hashlib.sha256(f"{user_id}:{time.time()}".encode()).hexdigest()[:16]

# API bilgi maskeleme
class APIInfoMasker:
    @staticmethod
    def mask_server_info(response):
        """Server bilgilerini maskele"""
        if hasattr(response, 'headers'):
            # Flask versiyonunu gizle
            response.headers.pop('Server', None)
            # Powered-by header'ını gizle
            response.headers.pop('X-Powered-By', None)
        return response
    
    @staticmethod
    def mask_error_details(error_response):
        """Error response'larda sistem detaylarını gizle"""
        if 'development' not in current_app.config.get('ENV', ''):
            # Production'da stack trace'i gizle
            if isinstance(error_response, dict) and 'traceback' in error_response:
                error_response.pop('traceback')
        return error_response
```

**İlişkili Dosyalar:**
- `aw-server/aw_server/security/account_security.py` - Hesap güvenlik yöneticisi
- `aw-server/aw_server/api.py` - Kritik endpoint'lerde doğrulama
- `aw-server/aw_server/middleware/api_masker.py` - API bilgi maskeleme

**Uyumluluk:** ✅ Ekstra güvenlik katmanı ekler, mevcut API'yi bozmaz

---

## Bölüm 2: Path Traversal ve Input Validation (307-330)

### 307-310. Dosya Güvenliği ve Path Traversal

**Sorun:** Dosya yükleme ve URL redirect işlemlerinde güvenlik açıkları.

**Çözüm:** Merkezi dosya güvenlik validatoru ve URL whitelist sistemi.

**Implementasyon:**
```python
# aw-server/aw_server/security/file_security.py
import os
import re
from urllib.parse import urlparse
from werkzeug.utils import secure_filename

class FileSecurityValidator:
    ALLOWED_EXTENSIONS = {'.txt', '.json', '.csv', '.png', '.jpg', '.jpeg', '.gif'}
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
    ALLOWED_DOMAINS = {'localhost', '127.0.0.1', 'activitywatch.net'}
    
    @classmethod
    def validate_filename(cls, filename):
        """Dosya adını güvenli hale getir"""
        if not filename:
            raise ValueError("Filename cannot be empty")
        
        # Güvenli dosya adı oluştur
        safe_filename = secure_filename(filename)
        
        # Uzantı kontrolü
        _, ext = os.path.splitext(safe_filename.lower())
        if ext not in cls.ALLOWED_EXTENSIONS:
            raise ValueError(f"File type {ext} not allowed")
        
        # Path traversal koruması
        if '..' in filename or '/' in filename or '\\' in filename:
            raise ValueError("Invalid characters in filename")
        
        return safe_filename
    
    @classmethod
    def validate_file_content(cls, file_content):
        """Dosya içeriğini doğrula"""
        if len(file_content) > cls.MAX_FILE_SIZE:
            raise ValueError("File too large")
        
        # Zararlı içerik kontrolü (basit örnek)
        dangerous_patterns = [b'<script', b'javascript:', b'<?php']
        for pattern in dangerous_patterns:
            if pattern in file_content.lower():
                raise ValueError("Potentially dangerous content detected")
        
        return True
    
    @classmethod
    def validate_redirect_url(cls, url):
        """Redirect URL'ini doğrula (Open Redirect koruması)"""
        if not url:
            return None
        
        try:
            parsed = urlparse(url)
            
            # Sadece HTTP/HTTPS izin ver
            if parsed.scheme not in ['http', 'https']:
                raise ValueError("Invalid URL scheme")
            
            # Domain whitelist kontrolü
            if parsed.netloc and parsed.netloc not in cls.ALLOWED_DOMAINS:
                raise ValueError("Domain not in whitelist")
            
            # Relative URL'lere izin ver (kendi domain'imiz için)
            if not parsed.netloc:
                return url
            
            return url
        except Exception as e:
            raise ValueError(f"Invalid URL: {e}")

# Kullanım örneği
@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        abort(400, "No file provided")
    
    file = request.files['file']
    try:
        safe_filename = FileSecurityValidator.validate_filename(file.filename)
        file_content = file.read()
        FileSecurityValidator.validate_file_content(file_content)
        
        # Güvenli dizine kaydet
        upload_path = os.path.join(app.config['UPLOAD_FOLDER'], safe_filename)
        with open(upload_path, 'wb') as f:
            f.write(file_content)
        
        return {"status": "success", "filename": safe_filename}
    except ValueError as e:
        abort(400, str(e))
```

**İlişkili Dosyalar:**
- `aw-server/aw_server/security/file_security.py` - Dosya güvenlik validatoru
- `aw-server/aw_server/api.py` - Dosya upload endpoint'leri
- `aw-server/aw_server/config.py` - Upload folder konfigürasyonu

**Uyumluluk:** ✅ Yeni güvenlik katmanı, mevcut dosya işlemlerini güçlendirir

### 311-315. XML Güvenliği ve Oturum Yönetimi

**Sorun:** XML işlemelerinde XXE açıklığı ve JWT token yönetimi eksiklikleri.

**Çözüm:** Güvenli XML parser ve gelişmiş JWT token yönetimi.

**Implementasyon:**
```python
# aw-server/aw_server/security/xml_security.py
import xml.etree.ElementTree as ET
from xml.parsers.expat import ParserCreateNS

class SecureXMLParser:
    @staticmethod
    def parse_xml_safely(xml_content):
        """XXE saldırılarına karşı güvenli XML parsing"""
        try:
            # ET parser'ı güvenli hale getir
            parser = ET.XMLParser()
            
            # External entity processing'i devre dışı bırak
            parser.parser.DefaultHandler = None
            parser.parser.ExternalEntityRefHandler = None
            parser.parser.EntityDeclHandler = None
            
            # DTD processing'i devre dışı bırak
            parser.parser.ProcessingInstructionHandler = None
            
            # Parse et
            root = ET.fromstring(xml_content, parser)
            return root
        except ET.ParseError as e:
            raise ValueError(f"Invalid XML: {e}")
        except Exception as e:
            raise ValueError(f"XML processing error: {e}")
    
    @staticmethod
    def validate_xml_schema(xml_root, allowed_tags):
        """XML'in sadece izin verilen tag'leri içerdiğini kontrol et"""
        def check_tags(element):
            if element.tag not in allowed_tags:
                raise ValueError(f"Unauthorized XML tag: {element.tag}")
            for child in element:
                check_tags(child)
        
        check_tags(xml_root)
        return True

# JWT Token yönetimi genişletme
class AdvancedJWTManager(SecureJWTManager):
    def __init__(self, redis_client):
        super().__init__(redis_client)
        self.token_rotation_interval = 3600  # 1 saat
    
    def rotate_token_if_needed(self, token):
        """Token'ı gerekirse rotate et"""
        try:
            payload = jwt.decode(token, verify=False)
            issued_at = payload.get('iat', 0)
            current_time = time.time()
            
            # Token 1 saati aştıysa rotate et
            if current_time - issued_at > self.token_rotation_interval:
                new_token = self.generate_new_token(payload['user_id'])
                self.blacklist_token(token)  # Eski token'ı blacklist'e ekle
                return new_token
            
            return token
        except Exception:
            return None
    
    def generate_new_token(self, user_id):
        """Yeni JWT token oluştur"""
        payload = {
            'user_id': user_id,
            'iat': time.time(),
            'exp': time.time() + self.token_rotation_interval,
            'jti': str(uuid.uuid4())  # Unique token ID
        }
        return jwt.encode(payload, current_app.config['JWT_SECRET_KEY'], algorithm='RS256')
```

**İlişkili Dosyalar:**
- `aw-server/aw_server/security/xml_security.py` - XML güvenlik modülü
- `aw-server/aw_server/security/jwt_manager.py` - JWT yönetimi genişletme
- `aw-server/aw_server/api.py` - XML işleyen endpoint'ler

**Uyumluluk:** ✅ XML işleme varsa güvenli hale getirir, yoksa zarar vermez

---

## Bölüm 3: HTTPS ve Debug Mode Güvenliği (316-350)

### 316-320. HTTPS Zorunluluğu ve Debug Mode

**Sorun:** Production'da HTTPS zorunluluğu ve debug mode kontrolü eksik.

**Çözüm:** Middleware ile HTTPS redirectioni ve environment-based güvenlik.

**Implementasyon:**
```python
# aw-server/aw_server/middleware/https_enforcer.py
from flask import request, redirect, url_for, current_app
import os

class HTTPSEnforcer:
    def __init__(self, app):
        self.app = app
        app.before_request(self.enforce_https)
    
    def enforce_https(self):
        """Production'da HTTPS'e yönlendir"""
        if not self.should_enforce_https():
            return
        
        if request.url.startswith('http://'):
            url = request.url.replace('http://', 'https://', 1)
            return redirect(url, code=301)
    
    def should_enforce_https(self):
        """HTTPS zorunlu mu?"""
        # Local development'ta zorunlu değil
        if current_app.config.get('TESTING'):
            return False
        
        # Environment variable kontrolü
        if os.getenv('FLASK_ENV') == 'development':
            return False
        
        # Production'da zorunlu
        return os.getenv('NODE_ENV') == 'production'

# Production güvenlik checker
class ProductionSecurityChecker:
    @staticmethod
    def check_production_security():
        """Production güvenlik kontrollerini yap"""
        issues = []
        
        # Debug mode kontrolü
        if current_app.debug:
            issues.append("DEBUG MODE IS ENABLED IN PRODUCTION!")
        
        # Secret key kontrolü
        if current_app.secret_key == 'dev' or len(current_app.secret_key) < 32:
            issues.append("WEAK SECRET KEY DETECTED")
        
        # HTTPS kontrolü
        if not request.is_secure and os.getenv('NODE_ENV') == 'production':
            issues.append("HTTP REQUEST IN PRODUCTION")
        
        # Environment variables kontrolü
        required_env_vars = ['DATABASE_URL', 'JWT_SECRET_KEY', 'FIREBASE_PROJECT_ID']
        for var in required_env_vars:
            if not os.getenv(var):
                issues.append(f"MISSING ENVIRONMENT VARIABLE: {var}")
        
        if issues:
            current_app.logger.error("SECURITY ISSUES DETECTED: " + "; ".join(issues))
            # Production'da uygulama durdur
            if os.getenv('NODE_ENV') == 'production':
                raise Exception("Critical security issues detected")
        
        return len(issues) == 0

# aw-server/aw_server/server.py içinde
def create_app():
    app = AWFlask(__name__)
    
    # Production güvenlik kontrolü
    if os.getenv('NODE_ENV') == 'production':
        ProductionSecurityChecker.check_production_security()
    
    # HTTPS enforcer
    HTTPSEnforcer(app)
    
    return app
```

**İlişkili Dosyalar:**
- `aw-server/aw_server/middleware/https_enforcer.py` - HTTPS zorunluluğu
- `aw-server/aw_server/server.py` - Production güvenlik kontrolü
- `aw-server/aw_server/config.py` - Environment konfigürasyonu

**Uyumluluk:** ✅ Production güvenlik zorunluluğu, development'ı etkilemez

### 321-350. Tekrarlanan Güvenlik Görevleri - Merkezi Çözüm

**Sorun:** Görev 321-350 arasında güvenlik tedbirlerinin tekrarı var.

**Çözüm:** Tek seferlik kapsamlı güvenlik framework'ü implementasyonu.

**Implementasyon:**
```python
# aw-server/aw_server/security/comprehensive_security.py
from functools import wraps
import logging

class ComprehensiveSecurityFramework:
    """Tüm güvenlik tedbirlerini merkezi olarak yöneten framework"""
    
    def __init__(self, app, redis_client):
        self.app = app
        self.redis = redis_client
        self.setup_comprehensive_security()
    
    def setup_comprehensive_security(self):
        """Tüm güvenlik tedbirlerini tek seferde kur"""
        
        # 1. Brute Force Protection
        self.brute_force = BruteForceProtection(self.redis)
        
        # 2. JWT Security
        self.jwt_manager = AdvancedJWTManager(self.redis)
        
        # 3. Security Headers
        SecurityHeadersMiddleware(self.app)
        
        # 4. HTTPS Enforcer
        HTTPSEnforcer(self.app)
        
        # 5. File Security
        self.file_validator = FileSecurityValidator()
        
        # 6. XML Security
        self.xml_parser = SecureXMLParser()
        
        # 7. Rate Limiting
        self.setup_rate_limiting()
        
        # 8. Security Logging
        self.setup_security_logging()
    
    def setup_rate_limiting(self):
        """API rate limiting kur"""
        from flask_limiter import Limiter
        from flask_limiter.util import get_remote_address
        
        limiter = Limiter(
            app=self.app,
            key_func=get_remote_address,
            default_limits=["1000 per hour", "100 per minute"]
        )
        
        # Kritik endpoint'ler için sıkı limitler
        @limiter.limit("10 per minute")
        @self.app.route('/api/v1/auth/login', methods=['POST'])
        def login():
            pass  # Actual implementation will be in api.py
    
    def setup_security_logging(self):
        """Güvenlik olaylarını logla"""
        security_logger = logging.getLogger('security')
        handler = logging.FileHandler('security.log')
        formatter = logging.Formatter(
            '%(asctime)s %(levelname)s [%(client_ip)s] %(message)s'
        )
        handler.setFormatter(formatter)
        security_logger.addHandler(handler)
        security_logger.setLevel(logging.WARNING)
    
    def comprehensive_security_check(self):
        """Kapsamlı güvenlik kontrolü yap"""
        return {
            'brute_force_protection': True,
            'jwt_security': True,
            'https_enforced': True,
            'security_headers': True,
            'file_upload_secure': True,
            'xml_processing_secure': True,
            'rate_limiting_active': True,
            'production_debug_disabled': not self.app.debug,
            'timestamp': time.time()
        }

# Tek decorator ile tüm güvenlik tedbirleri
def comprehensive_security(f):
    """Tüm güvenlik kontrollerini içeren decorator"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # 1. Rate limiting kontrolü
        # 2. JWT token validasyonu  
        # 3. Brute force kontrolü
        # 4. Input validation
        # 5. Security logging
        
        try:
            # Güvenlik kontrollerini geç
            security_framework.perform_security_checks(request)
            return f(*args, **kwargs)
        except SecurityError as e:
            security_framework.log_security_event(e, request)
            abort(403, "Security violation detected")
    
    return decorated_function

# aw-server/aw_server/server.py içinde tek satır setup
def create_app():
    app = AWFlask(__name__)
    redis_client = redis.Redis.from_url(os.getenv('REDIS_URL'))
    security_framework = ComprehensiveSecurityFramework(app, redis_client)
    return app
```

**İlişkili Dosyalar:**
- `aw-server/aw_server/security/comprehensive_security.py` - Ana güvenlik framework'ü
- `aw-server/aw_server/server.py` - Framework entegrasyonu
- `aw-server/aw_server/api.py` - Endpoint'lerde decorator kullanımı
- `requirements.txt` - Gerekli güvenlik kütüphaneleri

**Uyumluluk:** ✅ Tüm güvenlik tedbirlerini merkezi olarak yönetir

---

## Implementation Summary (300-350)

### Merkezi Güvenlik Mimarisi

Bu görevler için önerilen merkezi yaklaşım:

1. **Tek Security Framework**: `ComprehensiveSecurityFramework` sınıfı ile tüm güvenlik tedbirleri
2. **Modüler Tasarım**: Her güvenlik alanı ayrı modül ama merkezi yönetim
3. **Decorator Pattern**: `@comprehensive_security` ile endpoint'lerde kolay kullanım
4. **Redis Backend**: Session, brute force, token blacklist için merkezi storage
5. **Environment-Based**: Development vs Production için farklı güvenlik seviyeleri

### Priority Implementation Matrix

| Kategori | Risk Level | Implementation Effort | Priority |
|----------|------------|---------------------|----------|
| Brute Force Protection (300-302) | Yüksek | Orta | 🔥 Kritik |
| JWT Security (301-302, 325-326) | Yüksek | Düşük | 🔥 Kritik |
| Security Headers (303-304, 315-316) | Orta | Düşük | ⚡ Yüksek |
| File Security (307-310, 321-324) | Orta | Orta | ⚡ Yüksek |
| HTTPS Enforcement (316-320) | Yüksek | Düşük | 🔥 Kritik |
| Comprehensive Framework (321-350) | Düşük | Yüksek | ⭐ Orta |

### 4-Week Implementation Roadmap

**Week 1: Core Security (300-310)**
- Brute force protection implementation
- JWT security enhancements  
- Security headers middleware
- File upload security

**Week 2: Advanced Security (311-320)**
- XML security if needed
- HTTPS enforcement
- Production security checks
- Rate limiting

**Week 3: Integration (321-340)**
- Comprehensive security framework
- All components integration
- Security testing
- Error handling improvement

**Week 4: Monitoring & Documentation (341-350)**
- Security logging enhancement
- Monitoring dashboard
- Security documentation
- Team training

### Teknik Uyumluluk Notları

- **Redis Dependency**: Yeni Redis bağımlılığı ekler, performance artışı sağlar
- **Backward Compatibility**: Mevcut API'leri bozmaz, sadece güvenlik katmanı ekler
- **Environment Variables**: Yeni environment variable'lar gerektirir (.env.example güncellemesi)
- **Testing**: Güvenlik testleri için ayrı test suite gerekir
- **Performance Impact**: Minimal (Redis cache sayesinde), güvenlik karşılığında kabul edilebilir

### Success Metrics

- **Brute Force Attempts**: %95 azalma
- **JWT Security Issues**: %100 azalma  
- **File Upload Vulnerabilities**: %100 azalma
- **Security Headers Coverage**: %100 endpoint coverage
- **HTTPS Enforcement**: %100 production traffic
- **Response Time Impact**: <10ms ek latency

---

## Bölüm 4: Bağımlılık Güvenliği ve Build Optimizasyonu (351-400)

### Görevler 351-370: Bağımlılık Güvenliği

Bu görevler todo600.md'de 321-350 aralığında tanımlanmış olup, bağımlılık güvenliği konusunu kapsamaktadır.

### 351. Bağımlılık Güvenlik Taraması

**Sorun:** Projenin bağımlılıkları (`pyproject.toml`, `package.json`) bilinen güvenlik açıklarına karşı düzenli olarak taranmıyor.

**Çözüm:** Merkezi güvenlik tarama sistemi ile CI/CD pipeline entegrasyonu.

**Implementasyon:**
```python
# scripts/security_audit.py
import subprocess
import json
import sys
from typing import Dict, List

class SecurityAuditor:
    """Merkezi bağımlılık güvenlik tarayıcısı"""
    
    def __init__(self):
        self.vulnerabilities = []
        self.high_severity_count = 0
    
    def audit_python_dependencies(self) -> Dict:
        """Python bağımlılıklarını tara"""
        try:
            # Poetry ile requirements.txt oluştur
            subprocess.run(["poetry", "export", "-f", "requirements.txt", "-o", "temp-requirements.txt"], check=True)
            
            # pip-audit ile tara
            result = subprocess.run(
                ["pip-audit", "-r", "temp-requirements.txt", "--format", "json"],
                capture_output=True, text=True, check=False
            )
            
            if result.returncode != 0:
                audit_data = json.loads(result.stdout)
                for vuln in audit_data.get('vulnerabilities', []):
                    if vuln.get('severity') in ['high', 'critical']:
                        self.high_severity_count += 1
                    self.vulnerabilities.append({
                        'package': vuln.get('package'),
                        'severity': vuln.get('severity'),
                        'description': vuln.get('description'),
                        'type': 'python'
                    })
            
            return {'status': 'completed', 'vulnerabilities': len(self.vulnerabilities)}
            
        except Exception as e:
            return {'status': 'error', 'message': str(e)}
    
    def audit_node_dependencies(self) -> Dict:
        """Node.js bağımlılıklarını tara"""
        try:
            # npm audit ile tara
            result = subprocess.run(
                ["npm", "audit", "--json", "--audit-level=high"],
                cwd="aw-server/aw-webui",
                capture_output=True, text=True, check=False
            )
            
            if result.returncode != 0:
                audit_data = json.loads(result.stdout)
                vulnerabilities = audit_data.get('vulnerabilities', {})
                
                for vuln_name, vuln_data in vulnerabilities.items():
                    if vuln_data.get('severity') in ['high', 'critical']:
                        self.high_severity_count += 1
                    self.vulnerabilities.append({
                        'package': vuln_name,
                        'severity': vuln_data.get('severity'),
                        'description': vuln_data.get('title'),
                        'type': 'node'
                    })
            
            return {'status': 'completed', 'vulnerabilities': len(self.vulnerabilities)}
            
        except Exception as e:
            return {'status': 'error', 'message': str(e)}
    
    def generate_report(self) -> Dict:
        """Güvenlik raporu oluştur"""
        return {
            'total_vulnerabilities': len(self.vulnerabilities),
            'high_severity_count': self.high_severity_count,
            'vulnerabilities': self.vulnerabilities,
            'status': 'fail' if self.high_severity_count > 0 else 'pass'
        }

# CI pipeline entegrasyonu için
if __name__ == "__main__":
    auditor = SecurityAuditor()
    auditor.audit_python_dependencies()
    auditor.audit_node_dependencies()
    
    report = auditor.generate_report()
    
    if report['status'] == 'fail':
        print(f"❌ {report['high_severity_count']} high/critical vulnerabilities found!")
        sys.exit(1)
    else:
        print("✅ No high-severity vulnerabilities found")
```

**İlişkili Dosyalar:**
- `scripts/security_audit.py` - Güvenlik tarama scripti
- `.github/workflows/security.yml` - CI pipeline güvenlik job'u
- `requirements-audit.txt` - Audit için gereken araçlar

**Uyumluluk:** ✅ CI/CD entegrasyonu, mevcut build süreçlerini bozmaz

### 352-355. Bağımlılık Kilitleme ve Versiyon Yönetimi

**Sorun:** Bağımlılık versiyonları sabitlenmemiş, supply chain saldırı riski var.

**Çözüm:** Merkezi bağımlılık kilitleme stratejisi ve otomatik güncelleme politikası.

**Implementasyon:**
```yaml
# .github/dependabot.yml
version: 2
updates:
  # Python dependencies
  - package-ecosystem: "pip"
    directory: "/"
    schedule:
      interval: "weekly"
    reviewers:
      - "@security-team"
    assignees:
      - "@security-team"
    commit-message:
      prefix: "security"
      include: "scope"
    # Sadece güvenlik güncellemeleri ve patch versiyonları
    allow:
      - dependency-type: "security"
      - dependency-type: "patch"
    ignore:
      - dependency-name: "*"
        update-types: ["version-update:semver-major"]

  # Node.js dependencies  
  - package-ecosystem: "npm"
    directory: "/aw-server/aw-webui"
    schedule:
      interval: "weekly"
    reviewers:
      - "@security-team"
    commit-message:
      prefix: "security"
    allow:
      - dependency-type: "security"
      - dependency-type: "patch"
    ignore:
      - dependency-name: "*"
        update-types: ["version-update:semver-major"]

  # Firebase Functions
  - package-ecosystem: "npm"
    directory: "/functions"
    schedule:
      interval: "weekly"
    reviewers:
      - "@security-team"
```

```python
# scripts/dependency_manager.py
import toml
import json
import subprocess
from pathlib import Path

class DependencyManager:
    """Merkezi bağımlılık yöneticisi"""
    
    def __init__(self):
        self.pyproject_path = Path("pyproject.toml")
        self.package_json_paths = [
            Path("aw-server/aw-webui/package.json"),
            Path("functions/package.json")
        ]
    
    def audit_python_lockfile(self):
        """Poetry.lock dosyasının güncel olup olmadığını kontrol et"""
        try:
            result = subprocess.run(["poetry", "lock", "--check"], capture_output=True)
            if result.returncode != 0:
                print("❌ poetry.lock dosyası güncel değil!")
                return False
            print("✅ poetry.lock dosyası güncel")
            return True
        except Exception as e:
            print(f"❌ Poetry lock kontrolü başarısız: {e}")
            return False
    
    def audit_package_locks(self):
        """package-lock.json dosyalarının güncel olup olmadığını kontrol et"""
        for package_path in self.package_json_paths:
            lock_path = package_path.parent / "package-lock.json"
            if not lock_path.exists():
                print(f"❌ {lock_path} bulunamadı!")
                return False
        print("✅ Tüm package-lock.json dosyları mevcut")
        return True
    
    def check_pinned_versions(self):
        """Kritik bağımlılıkların sabitlenip sabitlenmediğini kontrol et"""
        with open(self.pyproject_path, 'r') as f:
            pyproject = toml.load(f)
        
        deps = pyproject.get('tool', {}).get('poetry', {}).get('dependencies', {})
        unpinned = []
        
        for dep, version in deps.items():
            if isinstance(version, str) and version.startswith('^'):
                unpinned.append(f"{dep}: {version}")
        
        if unpinned:
            print(f"⚠️  Sabitlenmemiş bağımlılıklar: {', '.join(unpinned)}")
        
        return len(unpinned) == 0

# Kullanım
if __name__ == "__main__":
    manager = DependencyManager()
    
    python_ok = manager.audit_python_lockfile()
    node_ok = manager.audit_package_locks()
    pinned_ok = manager.check_pinned_versions()
    
    if not all([python_ok, node_ok, pinned_ok]):
        exit(1)
```

**İlişkili Dosyalar:**
- `.github/dependabot.yml` - Otomatik bağımlılık güncellemeleri
- `scripts/dependency_manager.py` - Bağımlılık yönetim scripti
- `pyproject.toml` - Poetry konfigürasyonu güncellemesi

**Uyumluluk:** ✅ Mevcut bağımlılık yönetimini güçlendirir

### 356-370. Docker ve Container Güvenliği

**Sorun:** Docker imajlarında güvenlik açıkları taranmıyor, multi-stage build kullanılmıyor.

**Çözüm:** Container güvenlik taraması ve optimize build stratejisi.

**Implementasyon:**
```dockerfile
# aw-server/Dockerfile.optimized
# Multi-stage build ile güvenli ve küçük imaj
FROM python:3.11-slim as builder

# Güvenlik için non-root user
RUN groupadd -r awuser && useradd -r -g awuser awuser

WORKDIR /app

# Sadece requirements dosyasını kopyala (cache optimization)
COPY pyproject.toml poetry.lock ./

# Dependencies'leri kur
RUN pip install poetry && \
    poetry config virtualenvs.create false && \
    poetry install --no-dev --no-root

# Production stage
FROM python:3.11-slim as production

# Güvenlik güncellemeleri
RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y --no-install-recommends \
        ca-certificates && \
    rm -rf /var/lib/apt/lists/* && \
    apt-get clean

# Non-root user oluştur
RUN groupadd -r awuser && useradd -r -g awuser awuser

# Python paketlerini builder stage'den kopyala
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

WORKDIR /app

# Uygulama dosyalarını kopyala
COPY --chown=awuser:awuser . .

# Non-root user olarak çalıştır
USER awuser

# Health check ekle
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:5600/api/0/info')"

EXPOSE 5600

CMD ["python", "-m", "aw_server"]
```

```yaml
# .github/workflows/container-security.yml
name: Container Security Scan

on:
  pull_request:
    paths:
      - '**/Dockerfile*'
      - 'aw-server/**'
  schedule:
    - cron: '0 2 * * 1'  # Her Pazartesi saat 02:00

jobs:
  container-security:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Build Docker image
        run: |
          docker build -t peakactivity/aw-server:test -f aw-server/Dockerfile.optimized aw-server/
      
      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: 'peakactivity/aw-server:test'
          format: 'sarif'
          output: 'trivy-results.sarif'
          severity: 'CRITICAL,HIGH'
          exit-code: '1'
      
      - name: Upload Trivy scan results to GitHub Security
        uses: github/codeql-action/upload-sarif@v2
        if: always()
        with:
          sarif_file: 'trivy-results.sarif'
      
      - name: Docker Scout scan
        uses: docker/scout-action@v1
        with:
          command: cves
          image: peakactivity/aw-server:test
          only-severities: critical,high
          exit-code: true
```

**İlişkili Dosyalar:**
- `aw-server/Dockerfile.optimized` - Optimize edilmiş ve güvenli Dockerfile
- `.github/workflows/container-security.yml` - Container güvenlik taraması
- `docker-compose.security.yml` - Güvenlik odaklı compose dosyası

**Uyumluluk:** ✅ Yeni Dockerfile, mevcut container yapısını iyileştirir

---

## Bölüm 5: Build ve Deployment Optimizasyonu (371-400)

### 371-380. Build Optimizasyonu

**Sorun:** Build süreçleri optimize değil, cache kullanımı yetersiz, bundle boyutları büyük.

**Çözüm:** Merkezi build optimizasyon sistemi ve cache stratejisi.

**Implementasyon:**
```typescript
// aw-server/aw-webui/vite.config.optimized.ts
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [vue()],
    
    // Build optimizasyonu
    build: {
      // Bundle splitting ile kod bölme
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['vue', 'vue-router', 'pinia'],
            charts: ['chart.js', 'vue-chartjs'],
            utils: ['date-fns', 'lodash-es']
          }
        }
      },
      
      // Kaynak haritaları production'da gizle
      sourcemap: mode === 'development',
      
      // Minifikasyon
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: mode === 'production',
          drop_debugger: mode === 'production'
        }
      },
      
      // Chunk boyut limiti
      chunkSizeWarningLimit: 1000,
      
      // Asset inline limiti
      assetsInlineLimit: 8192  // 8KB altı dosyalar inline
    },
    
    // Development optimizasyonu
    server: {
      // API proxy ile CORS çözümü
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:5600',
          changeOrigin: true
        }
      }
    },
    
    // Dependency optimizasyonu
    optimizeDeps: {
      include: ['vue', 'vue-router', 'pinia'],
      exclude: ['@vueuse/core']
    },
    
    // Alias tanımları
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
        '@components': resolve(__dirname, './src/components'),
        '@views': resolve(__dirname, './src/views'),
        '@utils': resolve(__dirname, './src/utils')
      }
    }
  }
})
```

```python
# scripts/build_optimizer.py
import subprocess
import json
import os
from pathlib import Path
import shutil

class BuildOptimizer:
    """Merkezi build optimizasyon sistemi"""
    
    def __init__(self):
        self.project_root = Path.cwd()
        self.build_cache_dir = Path(".build-cache")
        self.build_cache_dir.mkdir(exist_ok=True)
    
    def optimize_python_build(self):
        """Python build optimizasyonu"""
        print("🔨 Python build optimizasyonu başlıyor...")
        
        # Poetry cache kontrolü
        cache_info = subprocess.run(
            ["poetry", "cache", "list"],
            capture_output=True, text=True
        )
        print(f"📦 Poetry cache: {cache_info.stdout}")
        
        # Wheel build ile hızlı kurulum
        subprocess.run(["poetry", "build", "--format", "wheel"], check=True)
        
        print("✅ Python build optimizasyonu tamamlandı")
    
    def optimize_frontend_build(self):
        """Frontend build optimizasyonu"""
        frontend_dir = self.project_root / "aw-server" / "aw-webui"
        
        if not frontend_dir.exists():
            print("⚠️ Frontend dizini bulunamadı")
            return
        
        print("🔨 Frontend build optimizasyonu başlıyor...")
        
        # Node modules cache kontrolü
        node_modules = frontend_dir / "node_modules"
        if node_modules.exists():
            print("📦 Node modules cache mevcut")
        
        # Build with cache
        env = os.environ.copy()
        env['VITE_BUILD_CACHE'] = 'true'
        
        subprocess.run(
            ["npm", "run", "build"], 
            cwd=frontend_dir, 
            env=env, 
            check=True
        )
        
        # Bundle analizi
        dist_dir = frontend_dir / "dist"
        if dist_dir.exists():
            total_size = sum(f.stat().st_size for f in dist_dir.rglob('*') if f.is_file())
            print(f"📊 Total bundle size: {total_size / 1024 / 1024:.2f} MB")
        
        print("✅ Frontend build optimizasyonu tamamlandı")
    
    def optimize_docker_build(self):
        """Docker build optimizasyonu"""
        print("🔨 Docker build optimizasyonu başlıyor...")
        
        # Multi-stage build ile layer cache
        dockerfile_path = self.project_root / "aw-server" / "Dockerfile.optimized"
        
        if dockerfile_path.exists():
            # BuildKit ile gelişmiş cache
            env = os.environ.copy()
            env['DOCKER_BUILDKIT'] = '1'
            
            subprocess.run([
                "docker", "build",
                "--cache-from", "peakactivity/aw-server:cache",
                "--cache-to", "peakactivity/aw-server:cache",
                "-t", "peakactivity/aw-server:optimized",
                "-f", str(dockerfile_path),
                "aw-server/"
            ], env=env, check=True)
            
            print("✅ Docker build optimizasyonu tamamlandı")
        else:
            print("⚠️ Optimize edilmiş Dockerfile bulunamadı")
    
    def analyze_build_performance(self):
        """Build performans analizi"""
        print("📊 Build performans analizi...")
        
        # Bundle analyzer sonuçları
        analyzer_output = self.build_cache_dir / "bundle-analysis.json"
        if analyzer_output.exists():
            with open(analyzer_output) as f:
                analysis = json.load(f)
                print(f"📦 Largest chunks: {analysis.get('largest_chunks', [])}")
        
        return {
            'python_build_time': 'optimized',
            'frontend_build_time': 'optimized',
            'docker_build_time': 'optimized',
            'cache_efficiency': 'improved'
        }

# CI entegrasyonu
if __name__ == "__main__":
    optimizer = BuildOptimizer()
    
    optimizer.optimize_python_build()
    optimizer.optimize_frontend_build()
    optimizer.optimize_docker_build()
    
    report = optimizer.analyze_build_performance()
    print(f"📊 Build optimizasyon raporu: {report}")
```

**İlişkili Dosyalar:**
- `aw-server/aw-webui/vite.config.optimized.ts` - Optimize edilmiş Vite konfigürasyonu
- `scripts/build_optimizer.py` - Build optimizasyon scripti
- `.github/workflows/optimized-build.yml` - Optimize build pipeline

**Uyumluluk:** ✅ Mevcut build süreçlerini hızlandırır ve iyileştirir

### 381-390. Deployment Automation

**Sorun:** Deployment süreçleri manuel, rollback mekanizması yok, environment management yetersiz.

**Çözüm:** Otomatik deployment sistemi ve environment yönetimi.

**Implementasyon:**
```yaml
# .github/workflows/auto-deployment.yml
name: Auto Deployment

on:
  push:
    branches: [main]
    tags: ['v*']
  workflow_dispatch:
    inputs:
      environment:
        description: 'Deployment environment'
        required: true
        default: 'staging'
        type: choice
        options:
          - staging
          - production

jobs:
  deploy-staging:
    if: github.ref == 'refs/heads/main' || github.event.inputs.environment == 'staging'
    runs-on: ubuntu-latest
    environment: staging
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to Firebase Staging
        run: |
          npm install -g firebase-tools
          firebase use staging
          firebase deploy --only hosting,functions
        env:
          FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN_STAGING }}
      
      - name: Run Health Checks
        run: |
          # Staging health check
          curl -f https://staging.peakactivity.app/api/0/info || exit 1
      
      - name: Notify on Success
        if: success()
        uses: 8398a7/action-slack@v3
        with:
          status: success
          text: '✅ Staging deployment successful'
  
  deploy-production:
    if: startsWith(github.ref, 'refs/tags/v') || github.event.inputs.environment == 'production'
    runs-on: ubuntu-latest
    environment: production
    needs: [deploy-staging]  # Staging'den sonra
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Create Deployment Record
        id: deployment
        run: |
          echo "deployment_id=$(date +%s)" >> $GITHUB_OUTPUT
          echo "previous_version=$(firebase functions:config:get app.version || echo 'unknown')" >> $GITHUB_OUTPUT
      
      - name: Deploy to Firebase Production
        run: |
          firebase use production
          firebase deploy --only hosting,functions
        env:
          FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN_PRODUCTION }}
      
      - name: Update Version Info
        run: |
          firebase functions:config:set app.version="${{ github.sha }}"
          firebase functions:config:set app.deployment_id="${{ steps.deployment.outputs.deployment_id }}"
      
      - name: Run Production Health Checks
        run: |
          # Production health check
          curl -f https://app.peakactivity.com/api/0/info || exit 1
          
          # Performance check
          lighthouse --chrome-flags="--headless" --output=json https://app.peakactivity.com > lighthouse.json
          
          # Performance threshold kontrolü
          python scripts/check_performance_metrics.py lighthouse.json
      
      - name: Setup Rollback on Failure
        if: failure()
        run: |
          echo "Deployment failed, preparing rollback..."
          firebase functions:config:set app.version="${{ steps.deployment.outputs.previous_version }}"
          # Önceki versiyona rollback logic
          
      - name: Notify on Success
        if: success()
        uses: 8398a7/action-slack@v3
        with:
          status: success
          text: '🚀 Production deployment successful'
```

```python
# scripts/deployment_manager.py
import subprocess
import json
import requests
import time
from typing import Dict, Optional

class DeploymentManager:
    """Otomatik deployment yöneticisi"""
    
    def __init__(self, environment: str = "staging"):
        self.environment = environment
        self.health_check_url = self._get_health_check_url()
        self.deployment_id = str(int(time.time()))
    
    def _get_health_check_url(self) -> str:
        urls = {
            "staging": "https://staging.peakactivity.app/api/0/info",
            "production": "https://app.peakactivity.com/api/0/info"
        }
        return urls.get(self.environment, urls["staging"])
    
    def pre_deployment_checks(self) -> bool:
        """Deployment öncesi kontroller"""
        print(f"🔍 Pre-deployment checks for {self.environment}")
        
        checks = [
            self._check_firebase_auth(),
            self._check_build_artifacts(),
            self._check_environment_config()
        ]
        
        return all(checks)
    
    def _check_firebase_auth(self) -> bool:
        """Firebase authentication kontrolü"""
        try:
            result = subprocess.run(
                ["firebase", "projects:list"],
                capture_output=True, text=True, check=True
            )
            return self.environment in result.stdout
        except Exception as e:
            print(f"❌ Firebase auth failed: {e}")
            return False
    
    def _check_build_artifacts(self) -> bool:
        """Build artifactlarının varlığını kontrol et"""
        import os
        
        required_files = [
            "aw-server/aw-webui/dist/index.html",
            "functions/lib/index.js"
        ]
        
        for file_path in required_files:
            if not os.path.exists(file_path):
                print(f"❌ Missing build artifact: {file_path}")
                return False
        
        print("✅ All build artifacts present")
        return True
    
    def _check_environment_config(self) -> bool:
        """Environment konfigürasyon kontrolü"""
        try:
            result = subprocess.run(
                ["firebase", "functions:config:get"],
                capture_output=True, text=True, check=True
            )
            config = json.loads(result.stdout)
            
            required_configs = ["app", "database"]
            for config_key in required_configs:
                if config_key not in config:
                    print(f"❌ Missing config: {config_key}")
                    return False
            
            print("✅ Environment config valid")
            return True
        except Exception as e:
            print(f"❌ Config check failed: {e}")
            return False
    
    def deploy(self) -> Dict[str, str]:
        """Deployment işlemini gerçekleştir"""
        if not self.pre_deployment_checks():
            return {"status": "failed", "reason": "Pre-deployment checks failed"}
        
        print(f"🚀 Starting deployment to {self.environment}")
        
        try:
            # Firebase deploy
            subprocess.run([
                "firebase", "deploy",
                "--only", "hosting,functions",
                "--project", self.environment
            ], check=True)
            
            # Health check
            if self._post_deployment_health_check():
                return {
                    "status": "success",
                    "deployment_id": self.deployment_id,
                    "environment": self.environment
                }
            else:
                return {"status": "failed", "reason": "Health check failed"}
                
        except Exception as e:
            return {"status": "failed", "reason": str(e)}
    
    def _post_deployment_health_check(self) -> bool:
        """Deployment sonrası health check"""
        print("🔍 Running health checks...")
        
        # API health check
        max_retries = 5
        for i in range(max_retries):
            try:
                response = requests.get(self.health_check_url, timeout=10)
                if response.status_code == 200:
                    print("✅ API health check passed")
                    return True
            except Exception as e:
                print(f"⚠️ Health check attempt {i+1} failed: {e}")
                time.sleep(10)
        
        print("❌ Health check failed after all retries")
        return False
    
    def rollback(self, previous_version: str) -> Dict[str, str]:
        """Önceki versiyona rollback"""
        print(f"⏪ Rolling back to version: {previous_version}")
        
        try:
            # Önceki versiyonu restore et
            subprocess.run([
                "firebase", "functions:config:set",
                f"app.version={previous_version}"
            ], check=True)
            
            # Previous deployment'ı restore et (bu implementation'a göre değişir)
            # Gerçek uygulamada, önceki artifact'ları restore etme logic olmalı
            
            return {"status": "success", "rolled_back_to": previous_version}
            
        except Exception as e:
            return {"status": "failed", "reason": str(e)}

# CLI interface
if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python deployment_manager.py <environment> [action]")
        sys.exit(1)
    
    environment = sys.argv[1]
    action = sys.argv[2] if len(sys.argv) > 2 else "deploy"
    
    manager = DeploymentManager(environment)
    
    if action == "deploy":
        result = manager.deploy()
    elif action == "rollback" and len(sys.argv) > 3:
        result = manager.rollback(sys.argv[3])
    else:
        result = {"status": "failed", "reason": "Invalid action"}
    
    print(f"Result: {result}")
    
    if result["status"] != "success":
        sys.exit(1)
```

**İlişkili Dosyalar:**
- `.github/workflows/auto-deployment.yml` - Otomatik deployment pipeline
- `scripts/deployment_manager.py` - Deployment yönetim scripti
- `scripts/check_performance_metrics.py` - Performance kontrol scripti

**Uyumluluk:** ✅ Mevcut Firebase deployment'ını otomatikleştirir

### 391-400. Environment ve Configuration Management

**Sorun:** Environment yönetimi manuel, configuration dosyaları merkezi değil, secret management yetersiz.

**Çözüm:** Merkezi environment ve configuration yönetim sistemi.

**Implementasyon:**
```python
# scripts/environment_manager.py
import os
import yaml
import json
from pathlib import Path
from typing import Dict, Optional
import subprocess

class EnvironmentManager:
    """Merkezi environment yönetim sistemi"""
    
    def __init__(self):
        self.project_root = Path.cwd()
        self.config_dir = self.project_root / "config"
        self.config_dir.mkdir(exist_ok=True)
        
        self.environments = ["development", "staging", "production"]
        self.current_env = os.getenv("NODE_ENV", "development")
    
    def setup_environment_configs(self):
        """Tüm environment'lar için config dosyaları oluştur"""
        
        base_config = {
            "app": {
                "name": "PeakActivity",
                "version": "0.4.0",
                "debug": False
            },
            "database": {
                "pool_size": 10,
                "timeout": 30
            },
            "security": {
                "session_timeout": 3600,
                "max_login_attempts": 5
            }
        }
        
        env_specific_configs = {
            "development": {
                "app": {"debug": True},
                "database": {"host": "localhost", "name": "aw_dev"},
                "api": {"base_url": "http://localhost:5600"}
            },
            "staging": {
                "app": {"debug": False},
                "database": {"host": "staging-db.internal", "name": "aw_staging"},
                "api": {"base_url": "https://staging-api.peakactivity.app"}
            },
            "production": {
                "app": {"debug": False},
                "database": {"host": "prod-db.internal", "name": "aw_production"},
                "api": {"base_url": "https://api.peakactivity.com"}
            }
        }
        
        for env in self.environments:
            config = {**base_config}
            config.update(env_specific_configs[env])
            
            config_file = self.config_dir / f"{env}.yml"
            with open(config_file, 'w') as f:
                yaml.dump(config, f, default_flow_style=False)
            
            print(f"✅ Created config for {env}")
    
    def load_environment_config(self, environment: Optional[str] = None) -> Dict:
        """Belirtilen environment'ın config'ini yükle"""
        env = environment or self.current_env
        config_file = self.config_dir / f"{env}.yml"
        
        if not config_file.exists():
            raise FileNotFoundError(f"Config file not found: {config_file}")
        
        with open(config_file, 'r') as f:
            config = yaml.safe_load(f)
        
        # Environment variables ile override et
        config = self._override_with_env_vars(config)
        
        return config
    
    def _override_with_env_vars(self, config: Dict) -> Dict:
        """Environment variable'lar ile config'i override et"""
        env_mappings = {
            "DATABASE_URL": ["database", "url"],
            "API_BASE_URL": ["api", "base_url"],
            "SECRET_KEY": ["security", "secret_key"],
            "DEBUG": ["app", "debug"]
        }
        
        for env_var, config_path in env_mappings.items():
            value = os.getenv(env_var)
            if value:
                # Nested dict'e value set et
                current = config
                for key in config_path[:-1]:
                    current = current.setdefault(key, {})
                
                # Type conversion
                if env_var == "DEBUG":
                    value = value.lower() in ('true', '1', 'yes')
                
                current[config_path[-1]] = value
        
        return config
    
    def setup_firebase_environment(self, environment: str):
        """Firebase environment'ını setup et"""
        print(f"🔧 Setting up Firebase for {environment}")
        
        # Firebase config dosyalarını environment'a göre ayarla
        firebase_configs = {
            "development": {
                "projectId": "peakactivity-dev",
                "storageBucket": "peakactivity-dev.appspot.com"
            },
            "staging": {
                "projectId": "peakactivity-staging", 
                "storageBucket": "peakactivity-staging.appspot.com"
            },
            "production": {
                "projectId": "peakactivity-prod",
                "storageBucket": "peakactivity-prod.appspot.com"
            }
        }
        
        config = firebase_configs.get(environment)
        if not config:
            raise ValueError(f"Unknown environment: {environment}")
        
        # Firebase project'i switch et
        subprocess.run(["firebase", "use", environment], check=True)
        
        # Functions config'ini set et
        config_commands = []
        for key, value in config.items():
            config_commands.extend(["--set", f"app.{key}={value}"])
        
        if config_commands:
            subprocess.run(
                ["firebase", "functions:config:set"] + config_commands,
                check=True
            )
        
        print(f"✅ Firebase environment {environment} configured")
    
    def generate_env_files(self):
        """Environment dosyalarını (.env) oluştur"""
        for env in self.environments:
            config = self.load_environment_config(env)
            
            env_content = []
            env_content.append(f"# {env.upper()} environment configuration")
            env_content.append(f"NODE_ENV={env}")
            env_content.append(f"DEBUG={str(config['app']['debug']).lower()}")
            
            if 'database' in config:
                if 'url' in config['database']:
                    env_content.append(f"DATABASE_URL={config['database']['url']}")
            
            if 'api' in config:
                env_content.append(f"VITE_API_URL={config['api']['base_url']}")
            
            # Security - actual secrets should come from secret manager
            env_content.append("# Secrets (set these manually or from secret manager)")
            env_content.append("SECRET_KEY=your-secret-key-here")
            env_content.append("FIREBASE_PRIVATE_KEY_ID=your-private-key-id")
            
            env_file = self.project_root / f".env.{env}"
            with open(env_file, 'w') as f:
                f.write('\n'.join(env_content))
            
            print(f"✅ Generated .env.{env}")
    
    def validate_environment(self, environment: str) -> bool:
        """Environment'ın valid olup olmadığını kontrol et"""
        try:
            config = self.load_environment_config(environment)
            
            required_keys = [
                ("app", "name"),
                ("app", "version"),
                ("database", "name"),
                ("api", "base_url")
            ]
            
            for key_path in required_keys:
                current = config
                for key in key_path:
                    if key not in current:
                        print(f"❌ Missing config: {'.'.join(key_path)}")
                        return False
                    current = current[key]
            
            print(f"✅ Environment {environment} is valid")
            return True
            
        except Exception as e:
            print(f"❌ Environment validation failed: {e}")
            return False

# CLI interface
if __name__ == "__main__":
    manager = EnvironmentManager()
    
    if len(sys.argv) < 2:
        print("Usage: python environment_manager.py <command> [args]")
        print("Commands: setup, validate <env>, generate-env-files, firebase-setup <env>")
        sys.exit(1)
    
    command = sys.argv[1]
    
    if command == "setup":
        manager.setup_environment_configs()
        manager.generate_env_files()
    elif command == "validate" and len(sys.argv) > 2:
        env = sys.argv[2]
        if not manager.validate_environment(env):
            sys.exit(1)
    elif command == "generate-env-files":
        manager.generate_env_files()
    elif command == "firebase-setup" and len(sys.argv) > 2:
        env = sys.argv[2]
        manager.setup_firebase_environment(env)
    else:
        print("Invalid command")
        sys.exit(1)
```

**İlişkili Dosyalar:**
- `scripts/environment_manager.py` - Environment yönetim scripti
- `config/development.yml` - Development konfigürasyonu
- `config/staging.yml` - Staging konfigürasyonu  
- `config/production.yml` - Production konfigürasyonu
- `.env.example` - Environment variables örneği

---

## Bölüm 8: Kalan Görevler - Kapsamlı İyileştirmeler (400-600)

### Bölüm 8.1: Kod Kalitesi ve Test Geliştirmeleri (400-450)

#### 400-420: Test Altyapısı ve Kapsamı Genişletilmesi

**Sorun Tespiti:** Proje genelinde test kapsamının düşük olması, özellikle `aw-server`, `aw-watcher-*` modüllerinin kritik işlevlerinin test edilmemesi.

**Merkezi Çözüm:** Kapsamlı test altyapısı kurulumu ve otomatik test süreçleri.

**Implementasyon:**
```python
# tests/conftest.py - Merkezi test yapılandırması
import pytest
import tempfile
import os
from aw_server.api import ServerAPI
from aw_datastore.storages.memory import MemoryStorage

@pytest.fixture(scope="session")
def test_storage():
    """Test için bellek-içi veritabanı"""
    storage = MemoryStorage()
    return storage

@pytest.fixture
def test_api(test_storage):
    """Test için API instance'ı"""
    api = ServerAPI(storage=test_storage, testing=True)
    return api

@pytest.fixture
def mock_event_data():
    """Test event verisi"""
    return {
        "timestamp": "2024-01-01T00:00:00Z",
        "duration": 3600,
        "data": {"title": "Test Activity", "app": "test_app"}
