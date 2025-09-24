"""
ActivityWatch Exception Hierarchy

Bu modül, ActivityWatch projesi için merkezi exception tanımlarını içerir.
Geniş exception handling problemlerini çözmek için spesifik exception sınıfları sağlar.
"""

from typing import Optional, Any, Dict


class AWException(Exception):
    """ActivityWatch için base exception sınıfı"""

    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message)
        self.message = message
        self.details = details or {}


class AWStorageException(AWException):
    """Storage ve veritabanı işlemleri ile ilgili hatalar"""


class AWNetworkException(AWException):
    """Network ve API çağrıları ile ilgili hatalar"""


class AWValidationException(AWException):
    """Veri validasyonu ile ilgili hatalar"""


class AWWindowException(AWException):
    """Pencere bilgisi alma ile ilgili hatalar"""


class AWInputException(AWException):
    """Input device'ları ile ilgili hatalar"""


class AWQueryException(AWException):
    """Query işlemleri ile ilgili hatalar"""


class AWConfigException(AWException):
    """Konfigürasyon ile ilgili hatalar"""


class AWAuthenticationException(AWException):
    """Authentication ve authorization ile ilgili hatalar"""


class AWEncryptionException(AWException):
    """Encryption ve security ile ilgili hatalar"""


class AWFirebaseException(AWException):
    """Firebase integration ile ilgili hatalar"""


# Platform spesifik exception'lar
class AWPlatformException(AWException):
    """Platform spesifik işlemler ile ilgili hatalar"""


class AWMacOSException(AWPlatformException):
    """macOS spesifik hatalar"""


class AWWindowsException(AWPlatformException):
    """Windows spesifik hatalar"""


class AWLinuxException(AWPlatformException):
    """Linux spesifik hatalar"""


# Database ve Storage spesifik exception'lar
class AWDatabaseException(AWStorageException):
    """Database işlemleri ile ilgili hatalar"""

    def __init__(
        self,
        message: str,
        operation: str = "",
        table: str = "",
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(message, details)
        self.operation = operation
        self.table = table


class AWPeeweeException(AWDatabaseException):
    """Peewee ORM ile ilgili hatalar"""

    pass


class AWDatabaseConnectionException(AWDatabaseException):
    """Database bağlantı hataları"""

    pass


class AWDatabaseIntegrityException(AWDatabaseException):
    """Database integrity ve constraint hataları"""

    pass


class AWDatabaseMigrationException(AWDatabaseException):
    """Database migration hataları"""

    pass


# Qt ve Process spesifik exception'lar
class AWQtException(AWException):
    """Qt framework ile ilgili hatalar"""

    pass


class AWQProcessException(AWQtException):
    """QProcess ile ilgili hatalar"""

    def __init__(
        self,
        message: str,
        process_name: str = "",
        exit_code: Optional[int] = None,
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(message, details)
        self.process_name = process_name
        self.exit_code = exit_code


class AWQTimerException(AWQtException):
    """QTimer ile ilgili hatalar"""

    pass


class AWQSystemTrayException(AWQtException):
    """QSystemTray ile ilgili hatalar"""

    pass


# Network ve Connection spesifik exception'lar
class AWConnectionException(AWNetworkException):
    """Connection spesifik hataları"""

    def __init__(
        self,
        message: str,
        host: str = "",
        port: Optional[int] = None,
        timeout: Optional[float] = None,
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(message, details)
        self.host = host
        self.port = port
        self.timeout = timeout


class AWTimeoutException(AWConnectionException):
    """Timeout hataları"""

    pass


class AWDNSException(AWConnectionException):
    """DNS çözümleme hataları"""

    pass


class AWSSLException(AWConnectionException):
    """SSL/TLS bağlantı hataları"""

    pass


# X11 ve Display spesifik exception'lar
class AWDisplayException(AWPlatformException):
    """Display ve X11 ile ilgili hatalar"""

    pass


class AWX11Exception(AWDisplayException):
    """X11 spesifik hatalar"""

    def __init__(
        self,
        message: str,
        display_name: str = "",
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(message, details)
        self.display_name = display_name


class AWXlibException(AWX11Exception):
    """Xlib kütüphanesi ile ilgili hatalar"""

    pass


# File ve I/O spesifik exception'lar
class AWFileException(AWException):
    """Dosya işlemleri ile ilgili hatalar"""

    def __init__(
        self,
        message: str,
        file_path: str = "",
        operation: str = "",
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(message, details)
        self.file_path = file_path
        self.operation = operation


class AWPermissionException(AWFileException):
    """Dosya izinleri ile ilgili hatalar"""

    pass


class AWDiskSpaceException(AWFileException):
    """Disk alanı ile ilgili hatalar"""

    pass


# Configuration ve Setup spesifik exception'lar
class AWSetupException(AWConfigException):
    """Setup ve initialization hataları"""

    pass


class AWDependencyException(AWSetupException):
    """Bağımlılık hataları"""

    def __init__(
        self,
        message: str,
        dependency_name: str = "",
        required_version: str = "",
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(message, details)
        self.dependency_name = dependency_name
        self.required_version = required_version
