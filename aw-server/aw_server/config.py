"""ActivityWatch Server Configuration Management.

This module handles configuration loading and default settings for the
ActivityWatch server. It defines the TOML configuration structure and
loads user-specific overrides.

Configuration structure:
- [server]: Production server settings
- [server-testing]: Testing server settings  
- [server.custom_static]: Custom static file serving (optional)
"""

from aw_core.config import load_config_toml

# Default TOML configuration for ActivityWatch server
# Bu yapılandırma dosyası sunucunun temel ayarlarını tanımlar
default_config = """
[server]
# Ana sunucu host adresi - güvenlik için localhost kullanılır
host = "localhost"
# Ana sunucu port numarası - standart ActivityWatch portu
port = "5600"
# Veri depolama backend'i - "peewee" (SQLite), "memory", "firestore" seçenekleri
storage = "peewee"
# CORS izin verilen origin'ler - güvenlik için boş bırakılmış (sadece localhost)
cors_origins = ""

[server.custom_static]
# Özel statik dosya yolları - isteğe bağlı ek web dosyaları için

[server-testing]
# Test sunucusu ayarları - production'dan farklı port kullanır
host = "localhost"
# Test sunucusu portu - production ile çakışmayı önler
port = "5666"
# Test için aynı storage backend
storage = "peewee"
# Test için CORS ayarları
cors_origins = ""

[server-testing.custom_static]
# Test sunucusu için özel statik dosya yolları
""".strip()

# Kullanıcı konfigürasyonunu yükle ve default ile birleştir
# ~/.config/activitywatch/aw-server/config.toml dosyasından okunur
config = load_config_toml("aw-server", default_config)
