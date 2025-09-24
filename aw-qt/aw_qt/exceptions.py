"""ActivityWatch Qt-specific exception handling module.

This module provides Qt-specific exception types for ActivityWatch Qt application,
including QProcess errors, GUI errors, and system tray related exceptions.

Exception Hierarchy:
- AWQtException (base)
  - AWQProcessException: Process management errors
  - AWGuiException: GUI and Qt widget errors  
  - AWTrayException: System tray related errors
  - AWManagerException: Module manager errors
"""

import logging
import subprocess
from typing import Any, Optional

logger = logging.getLogger(__name__)


class AWQtException(Exception):
    """Base exception for ActivityWatch Qt application errors."""
    
    def __init__(self, message: str, **context: Any):
        super().__init__(message)
        self.message = message
        self.context = context
        logger.error("Qt Exception: %s | Context: %s", message, context)


class AWQProcessException(AWQtException):
    """Exception for QProcess and subprocess related errors."""
    
    def __init__(
        self, 
        message: str, 
        process_name: Optional[str] = None,
        exit_code: Optional[int] = None,
        command: Optional[str] = None,
        **context: Any
    ):
        super().__init__(
            message, 
            process_name=process_name,
            exit_code=exit_code,
            command=command,
            **context
        )
        self.process_name = process_name
        self.exit_code = exit_code
        self.command = command


class AWQProcessStartupException(AWQProcessException):
    """Exception for process startup failures."""
    pass


class AWQProcessTerminationException(AWQProcessException):
    """Exception for process termination failures."""
    pass


class AWQProcessTimeoutException(AWQProcessException):
    """Exception for process timeout errors."""
    
    def __init__(
        self, 
        message: str, 
        timeout_seconds: Optional[float] = None,
        **context: Any
    ):
        super().__init__(message, timeout_seconds=timeout_seconds, **context)
        self.timeout_seconds = timeout_seconds


class AWGuiException(AWQtException):
    """Exception for GUI and Qt widget related errors."""
    
    def __init__(
        self, 
        message: str, 
        widget_name: Optional[str] = None,
        **context: Any
    ):
        super().__init__(message, widget_name=widget_name, **context)
        self.widget_name = widget_name


class AWTrayException(AWGuiException):
    """Exception for system tray related errors."""
    pass


class AWManagerException(AWQtException):
    """Exception for module manager related errors."""
    
    def __init__(
        self, 
        message: str, 
        module_name: Optional[str] = None,
        operation: Optional[str] = None,
        **context: Any
    ):
        super().__init__(
            message, 
            module_name=module_name,
            operation=operation,
            **context
        )
        self.module_name = module_name
        self.operation = operation


class AWModuleStartException(AWManagerException):
    """Exception for module start failures."""
    pass


class AWModuleStopException(AWManagerException):
    """Exception for module stop failures."""
    pass


def handle_qprocess_error(process_name: str, error_type: str = "general"):
    """Decorator for handling QProcess errors in Qt methods."""
    def decorator(func):
        def wrapper(*args, **kwargs):
            try:
                return func(*args, **kwargs)
            except (OSError, subprocess.SubprocessError) as e:
                logger.error("QProcess error in %s: %s", process_name, e)
                if error_type == "startup":
                    raise AWQProcessStartupException(
                        f"Failed to start process {process_name}: {e}",
                        process_name=process_name,
                        command=str(getattr(e, 'cmd', 'unknown'))
                    ) from e
                elif error_type == "termination":
                    raise AWQProcessTerminationException(
                        f"Failed to terminate process {process_name}: {e}",
                        process_name=process_name
                    ) from e
                else:
                    raise AWQProcessException(
                        f"Process error in {process_name}: {e}",
                        process_name=process_name
                    ) from e
            except Exception as e:
                logger.error("Unexpected error in %s: %s", process_name, e)
                raise AWQtException(
                    f"Unexpected error in {process_name}: {e}",
                    process_name=process_name
                ) from e
        return wrapper
    return decorator
