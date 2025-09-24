import structlog
from structlog import get_logger
from typing import Any, Dict

logger = get_logger("aw_server")

def log_error(message: str, **kwargs: Any) -> None:
    logger.error(message, **kwargs)

def log_info(message: str, **kwargs: Any) -> None:
    logger.info(message, **kwargs)

def log_debug(message: str, **kwargs: Any) -> None:
    logger.debug(message, **kwargs)

def log_warning(message: str, **kwargs: Any) -> None:
    logger.warning(message, **kwargs)
