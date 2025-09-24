"""
Merkezi Error Handler

Bu modül, ActivityWatch projesi genelinde tutarlı error handling sağlar.
Exception handling best practices'i uygular ve graceful degradation'ı destekler.
"""

import logging
import functools
import time
import traceback
from typing import Type, Dict, Callable, Any, Optional, Tuple, Union
from contextlib import contextmanager

from .exceptions import (
    AWException, AWStorageException, AWNetworkException, 
    AWValidationException, AWWindowException, AWInputException,
    AWQueryException, AWConfigException, AWAuthenticationException,
    AWEncryptionException, AWFirebaseException, AWPlatformException,
    AWDatabaseException, AWPeeweeException, AWDatabaseConnectionException,
    AWDatabaseIntegrityException, AWDatabaseMigrationException,
    AWQtException, AWQProcessException, AWQTimerException, AWQSystemTrayException,
    AWConnectionException, AWTimeoutException, AWDNSException, AWSSLException,
    AWDisplayException, AWX11Exception, AWXlibException,
    AWFileException, AWPermissionException, AWDiskSpaceException,
    AWSetupException, AWDependencyException
)


logger = logging.getLogger(__name__)


class ErrorHandler:
    """Merkezi hata yönetimi sistemi"""
    
    _handlers: Dict[Type[Exception], Callable] = {}
    _recovery_strategies: Dict[Type[Exception], Callable] = {}
    
    @classmethod
    def register_handler(cls, exception_type: Type[Exception], handler: Callable):
        """Spesifik exception türü için handler kaydet"""
        cls._handlers[exception_type] = handler
    
    @classmethod
    def register_recovery_strategy(cls, exception_type: Type[Exception], strategy: Callable):
        """Exception recovery strategy kaydet"""
        cls._recovery_strategies[exception_type] = strategy
    
    @classmethod
    def handle(cls, exception: Exception, context: Optional[str] = None) -> Any:
        """Exception'ı uygun handler ile işle"""
        exception_type = type(exception)
        
        # Önce exact match ara
        if exception_type in cls._handlers:
            return cls._handlers[exception_type](exception, context)
        
        # Sonra parent class'ları kontrol et
        for exc_type, handler in cls._handlers.items():
            if isinstance(exception, exc_type):
                return handler(exception, context)
        
        # Default handling
        logger.error(f"Unhandled exception in {context or 'unknown context'}: {exception}")
        logger.debug(traceback.format_exc())
        raise exception
    
    @classmethod
    def recover(cls, exception: Exception, context: Optional[str] = None) -> Any:
        """Exception recovery strategy uygula"""
        exception_type = type(exception)
        
        if exception_type in cls._recovery_strategies:
            return cls._recovery_strategies[exception_type](exception, context)
        
        for exc_type, strategy in cls._recovery_strategies.items():
            if isinstance(exception, exc_type):
                return strategy(exception, context)
        
        # No recovery possible
        return None


def with_retry(
    max_attempts: int = 3,
    backoff_factor: float = 1.0,
    exceptions: Tuple[Type[Exception], ...] = (Exception,),
    recovery_value: Any = None
):
    """
    Retry decorator with exponential backoff
    
    Args:
        max_attempts: Maksimum deneme sayısı
        backoff_factor: Backoff çarpanı
        exceptions: Retry edilecek exception türleri
        recovery_value: Retry başarısız olursa dönülecek değer
    """
    def decorator(func: Callable):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            last_exception = None
            
            for attempt in range(max_attempts):
                try:
                    return func(*args, **kwargs)
                except exceptions as e:
                    last_exception = e
                    
                    if attempt < max_attempts - 1:
                        delay = backoff_factor * (2 ** attempt)
                        logger.warning(
                            f"Retry {attempt + 1}/{max_attempts} for {func.__name__}: {e}. "
                            f"Waiting {delay}s before retry."
                        )
                        time.sleep(delay)
                    else:
                        logger.error(f"All {max_attempts} attempts failed for {func.__name__}: {e}")
            
            # Eğer recovery_value belirtilmişse onu döndür
            if recovery_value is not None:
                logger.warning(f"Returning recovery value for {func.__name__}: {recovery_value}")
                return recovery_value
            
            # Son exception'ı re-raise et
            raise last_exception
        
        return wrapper
    return decorator


def safe_execute(
    func: Callable,
    *args,
    default_value: Any = None,
    exception_types: Tuple[Type[Exception], ...] = (Exception,),
    log_errors: bool = True,
    context: Optional[str] = None,
    **kwargs
) -> Any:
    """
    Güvenli fonksiyon çalıştırma
    
    Args:
        func: Çalıştırılacak fonksiyon
        default_value: Hata durumunda dönülecek değer
        exception_types: Yakalanacak exception türleri
        log_errors: Hataları log'la
        context: Error log'u için context bilgisi
    """
    try:
        return func(*args, **kwargs)
    except exception_types as e:
        if log_errors:
            context_str = f" in {context}" if context else ""
            logger.warning(f"Safe execution failed{context_str}: {e}")
            logger.debug(traceback.format_exc())
        
        return default_value


@contextmanager
def error_context(context_name: str, suppress_errors: bool = False):
    """
    Error context manager - belirli bir context içindeki hataları yönet
    
    Args:
        context_name: Context adı
        suppress_errors: Hataları suppress et (True) veya re-raise et (False)
    """
    try:
        yield
    except Exception as e:
        logger.error(f"Error in {context_name}: {e}")
        logger.debug(traceback.format_exc())
        
        if not suppress_errors:
            raise


def graceful_fallback(fallback_func: Callable):
    """
    Graceful fallback decorator
    Ana fonksiyon başarısız olursa fallback fonksiyonunu çalıştır
    """
    def decorator(main_func: Callable):
        @functools.wraps(main_func)
        def wrapper(*args, **kwargs):
            try:
                return main_func(*args, **kwargs)
            except Exception as e:
                logger.warning(f"Main function {main_func.__name__} failed: {e}, using fallback")
                try:
                    return fallback_func(*args, **kwargs)
                except Exception as fallback_e:
                    logger.error(f"Fallback function also failed: {fallback_e}")
                    raise e  # Original exception'ı raise et
        
        return wrapper
    return decorator


# Önceden tanımlı error handler'lar
def handle_storage_error(exception: AWStorageException, context: Optional[str] = None) -> None:
    """Storage error handler"""
    logger.error(f"Storage error{' in ' + context if context else ''}: {exception.message}")
    if exception.details:
        logger.debug(f"Storage error details: {exception.details}")


def handle_network_error(exception: AWNetworkException, context: Optional[str] = None) -> None:
    """Network error handler"""
    logger.warning(f"Network error{' in ' + context if context else ''}: {exception.message}")
    if exception.details:
        logger.debug(f"Network error details: {exception.details}")


def handle_window_error(exception: AWWindowException, context: Optional[str] = None) -> Optional[Dict[str, str]]:
    """Window error handler - unknown window bilgisi döndür"""
    logger.warning(f"Window error{' in ' + context if context else ''}: {exception.message}")
    return {"app": "unknown", "title": "unknown"}


def handle_input_error(exception: AWInputException, context: Optional[str] = None) -> Dict[str, int]:
    """Input error handler - sıfır input döndür"""
    logger.warning(f"Input error{' in ' + context if context else ''}: {exception.message}")
    return {"keyboard_events": 0, "mouse_events": 0}


# Database specific error handlers
def handle_database_error(exception: AWDatabaseException, context: Optional[str] = None) -> None:
    """Database error handler"""
    logger.error(f"Database error{' in ' + context if context else ''}: {exception.message}")
    logger.error(f"Operation: {exception.operation}, Table: {exception.table}")
    if exception.details:
        logger.debug(f"Database error details: {exception.details}")


def handle_peewee_error(exception: AWPeeweeException, context: Optional[str] = None) -> None:
    """Peewee ORM error handler"""
    logger.error(f"Peewee ORM error{' in ' + context if context else ''}: {exception.message}")
    logger.error(f"Operation: {exception.operation}, Table: {exception.table}")
    if exception.details:
        logger.debug(f"Peewee error details: {exception.details}")


def handle_database_connection_error(exception: AWDatabaseConnectionException, context: Optional[str] = None) -> None:
    """Database connection error handler"""
    logger.error(f"Database connection error{' in ' + context if context else ''}: {exception.message}")
    logger.error(f"Operation: {exception.operation}")
    # Otomatik reconnection deneme stratejisi
    logger.info("Attempting database reconnection strategy...")


def handle_database_integrity_error(exception: AWDatabaseIntegrityException, context: Optional[str] = None) -> None:
    """Database integrity error handler"""
    logger.error(f"Database integrity error{' in ' + context if context else ''}: {exception.message}")
    logger.error(f"Operation: {exception.operation}, Table: {exception.table}")
    # Data corruption recovery stratejisi
    logger.warning("Data integrity violation detected - consider database repair")


# QProcess specific error handlers  
def handle_qprocess_error(exception: AWQProcessException, context: Optional[str] = None) -> None:
    """QProcess error handler"""
    logger.error(f"QProcess error{' in ' + context if context else ''}: {exception.message}")
    logger.error(f"Process: {exception.process_name}, Exit code: {exception.exit_code}")
    if exception.details:
        logger.debug(f"QProcess error details: {exception.details}")


def handle_qt_error(exception: AWQtException, context: Optional[str] = None) -> None:
    """Qt framework error handler"""
    logger.error(f"Qt error{' in ' + context if context else ''}: {exception.message}")
    if exception.details:
        logger.debug(f"Qt error details: {exception.details}")


# Connection specific error handlers
def handle_connection_error(exception: AWConnectionException, context: Optional[str] = None) -> None:
    """Connection error handler"""
    logger.warning(f"Connection error{' in ' + context if context else ''}: {exception.message}")
    logger.warning(f"Host: {exception.host}, Port: {exception.port}, Timeout: {exception.timeout}")


def handle_timeout_error(exception: AWTimeoutException, context: Optional[str] = None) -> None:
    """Timeout error handler"""
    logger.warning(f"Timeout error{' in ' + context if context else ''}: {exception.message}")
    logger.warning(f"Host: {exception.host}, Port: {exception.port}, Timeout: {exception.timeout}")
    # Retry stratejisi öner
    logger.info("Consider increasing timeout or implementing retry mechanism")


def handle_dns_error(exception: AWDNSException, context: Optional[str] = None) -> None:
    """DNS error handler"""
    logger.error(f"DNS resolution error{' in ' + context if context else ''}: {exception.message}")
    logger.error(f"Host: {exception.host}")
    # DNS fallback stratejisi
    logger.info("Consider using alternative DNS servers or IP addresses")


# X11 specific error handlers
def handle_x11_error(exception: AWX11Exception, context: Optional[str] = None) -> None:
    """X11 error handler"""
    logger.error(f"X11 error{' in ' + context if context else ''}: {exception.message}")
    logger.error(f"Display: {exception.display_name}")
    # X11 fallback stratejisi
    logger.info("Consider checking DISPLAY environment variable or X11 server status")


def handle_xlib_error(exception: AWXlibException, context: Optional[str] = None) -> None:
    """Xlib error handler"""
    logger.error(f"Xlib error{' in ' + context if context else ''}: {exception.message}")
    logger.error(f"Display: {exception.display_name}")
    # Connection recovery stratejisi
    logger.info("X server connection may be closed, attempting graceful exit")


# File specific error handlers
def handle_file_error(exception: AWFileException, context: Optional[str] = None) -> None:
    """File operation error handler"""
    logger.error(f"File error{' in ' + context if context else ''}: {exception.message}")
    logger.error(f"File: {exception.file_path}, Operation: {exception.operation}")


def handle_permission_error(exception: AWPermissionException, context: Optional[str] = None) -> None:
    """Permission error handler"""
    logger.error(f"Permission error{' in ' + context if context else ''}: {exception.message}")
    logger.error(f"File: {exception.file_path}, Operation: {exception.operation}")
    # Permission fix önerileri
    logger.info("Consider checking file permissions or running with appropriate privileges")


def handle_disk_space_error(exception: AWDiskSpaceException, context: Optional[str] = None) -> None:
    """Disk space error handler"""
    logger.error(f"Disk space error{' in ' + context if context else ''}: {exception.message}")
    logger.error(f"File: {exception.file_path}, Operation: {exception.operation}")
    # Disk space cleanup önerileri
    logger.warning("Insufficient disk space - consider cleaning up old data or increasing storage")


# Setup specific error handlers
def handle_dependency_error(exception: AWDependencyException, context: Optional[str] = None) -> None:
    """Dependency error handler"""
    logger.error(f"Dependency error{' in ' + context if context else ''}: {exception.message}")
    logger.error(f"Dependency: {exception.dependency_name}, Required version: {exception.required_version}")
    # Dependency resolution önerileri
    logger.info(f"Consider installing {exception.dependency_name} version {exception.required_version} or higher")


# Default handler'ları kaydet
ErrorHandler.register_handler(AWStorageException, handle_storage_error)
ErrorHandler.register_handler(AWNetworkException, handle_network_error)
ErrorHandler.register_handler(AWWindowException, handle_window_error)
ErrorHandler.register_handler(AWInputException, handle_input_error)

# Database specific handlers
ErrorHandler.register_handler(AWDatabaseException, handle_database_error)
ErrorHandler.register_handler(AWPeeweeException, handle_peewee_error)
ErrorHandler.register_handler(AWDatabaseConnectionException, handle_database_connection_error)
ErrorHandler.register_handler(AWDatabaseIntegrityException, handle_database_integrity_error)

# Qt specific handlers
ErrorHandler.register_handler(AWQtException, handle_qt_error)
ErrorHandler.register_handler(AWQProcessException, handle_qprocess_error)

# Connection specific handlers
ErrorHandler.register_handler(AWConnectionException, handle_connection_error)
ErrorHandler.register_handler(AWTimeoutException, handle_timeout_error)
ErrorHandler.register_handler(AWDNSException, handle_dns_error)

# X11 specific handlers
ErrorHandler.register_handler(AWX11Exception, handle_x11_error)
ErrorHandler.register_handler(AWXlibException, handle_xlib_error)

# File specific handlers
ErrorHandler.register_handler(AWFileException, handle_file_error)
ErrorHandler.register_handler(AWPermissionException, handle_permission_error)
ErrorHandler.register_handler(AWDiskSpaceException, handle_disk_space_error)

# Setup specific handlers
ErrorHandler.register_handler(AWDependencyException, handle_dependency_error)
