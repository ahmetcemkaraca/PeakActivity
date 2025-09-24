import logging
import os
import sys
from datetime import datetime
from logging.handlers import RotatingFileHandler
from typing import List, Optional

from . import dirs
from .decorators import deprecated

# NOTE: Will be removed in a future version since it's not compatible
#       with running a multi-service process.
# TODO: prefix with `_`
log_file_path = None


@deprecated
def get_log_file_path() -> Optional[str]:  # pragma: no cover
    """DEPRECATED: Use get_latest_log_file instead."""
    return log_file_path


def setup_logging(
    name: str,
    testing=False,
    verbose=False,
    log_stderr=True,
    log_file=False,
):  # pragma: no cover
    """Set up comprehensive logging configuration for ActivityWatch components.
    
    Configures the root logger with appropriate handlers for console output and/or
    file logging. Also sets up global exception handling to capture unhandled exceptions.
    
    Args:
        name: Component name used for log file naming (e.g., 'aw-server', 'aw-watcher-window')
        testing: If True, uses testing namespace and includes 'testing' in log filenames
        verbose: If True, sets log level to DEBUG; otherwise uses INFO level
        log_stderr: If True, adds console output handler to stderr
        log_file: If True, adds rotating file handler with timestamped filename
        
    Environment Variables:
        LOG_LEVEL: Override log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        
    Note:
        - Clears any existing handlers on the root logger
        - File logs use rotating handler (10MB max, 3 backup files)
        - Console and file logs use human-readable timestamp format
        - Sets up sys.excepthook to log unhandled exceptions
        - LOG_LEVEL environment variable takes precedence over verbose parameter
    """
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.DEBUG if verbose else logging.INFO)
    root_logger.handlers = []

    # run with LOG_LEVEL=DEBUG to customize log level across all AW components
    log_level = os.environ.get("LOG_LEVEL")
    if log_level:
        if hasattr(logging, log_level.upper()):
            root_logger.setLevel(getattr(logging, log_level.upper()))
        else:
            root_logger.warning(
                f"No logging level called {log_level} (as specified in env var)"
            )

    if log_stderr:
        root_logger.addHandler(_create_stderr_handler())
    if log_file:
        root_logger.addHandler(_create_file_handler(name, testing=testing))

    def excepthook(type_, value, traceback):
        root_logger.exception("Unhandled exception", exc_info=(type_, value, traceback))
        # call the default excepthook if log_stderr isn't true
        # (otherwise it'll just get duplicated)
        if not log_stderr:
            sys.__excepthook__(type_, value, traceback)

    sys.excepthook = excepthook


def _get_latest_log_files(name, testing=False) -> List[str]:  # pragma: no cover
    """Retrieve paths to all available log files for a component, sorted by recency.
    
    Args:
        name: Component name to filter log files (e.g., 'aw-server')
        testing: If True, only return testing log files; if False, exclude testing logs
        
    Returns:
        List of absolute file paths sorted by modification time (newest first)
        
    Note:
        - Filters files in the log directory by component name
        - Separates testing and production logs based on filename patterns
        - Returns empty list if no matching log files found
    """
    log_dir = dirs.get_log_dir(name)
    files = filter(lambda filename: name in filename, os.listdir(log_dir))
    files = filter(
        lambda filename: "testing" in filename
        if testing
        else "testing" not in filename,
        files,
    )
    return [os.path.join(log_dir, filename) for filename in sorted(files, reverse=True)]


def get_latest_log_file(name, testing=False) -> Optional[str]:  # pragma: no cover
    """Get the path to the most recent log file for a component.
    
    Args:
        name: Component name to find log file for (e.g., 'aw-server', 'aw-watcher-afk')
        testing: If True, find testing log file; if False, find production log file
        
    Returns:
        Absolute path to the most recent log file, or None if no log files exist
        
    Use cases:
        - Reading logs from another ActivityWatch service
        - Log analysis and debugging tools
        - Monitoring and alerting systems
        - Log rotation and cleanup scripts
    """
    last_logs = _get_latest_log_files(name, testing=testing)
    return last_logs[0] if last_logs else None


def _create_stderr_handler() -> logging.Handler:  # pragma: no cover
    """Create a console logging handler for stderr output.
    
    Returns:
        Configured StreamHandler that outputs to stderr with human-readable formatting
        
    Note:
        - Uses stderr instead of stdout to avoid interfering with program output
        - Applies human-readable timestamp format with logger name and line number
        - Suitable for development and debugging scenarios
    """
    stderr_handler = logging.StreamHandler(stream=sys.stderr)
    stderr_handler.setFormatter(_create_human_formatter())

    return stderr_handler


def _create_file_handler(
    name, testing=False, log_json=False
) -> logging.Handler:  # pragma: no cover
    """Create a rotating file logging handler with timestamped filename.
    
    Args:
        name: Component name for log file naming
        testing: If True, includes 'testing' in filename for namespace separation
        log_json: If True, uses .log.json extension (currently unused)
        
    Returns:
        Configured RotatingFileHandler with automatic file rotation
        
    File naming pattern:
        {name}_{testing_}{timestamp}.log
        Example: aw-server_testing_2023-12-15T10-30-45.log
        
    Rotation settings:
        - Maximum file size: 10MB
        - Backup count: 3 files
        - Prevents disk space issues from runaway logging
        
    Note:
        - Creates log directory if it doesn't exist
        - Updates global log_file_path variable (deprecated)
        - Uses human-readable formatter with timestamps and line numbers
    """
    log_dir = dirs.get_log_dir(name)

    # Set logfile path and name
    global log_file_path

    # Should result in something like:
    # $LOG_DIR/aw-server_testing_2017-01-05T00:21:39.log
    file_ext = ".log.json" if log_json else ".log"
    now_str = str(datetime.now().replace(microsecond=0).isoformat()).replace(":", "-")
    log_name = name + "_" + ("testing_" if testing else "") + now_str + file_ext
    log_file_path = os.path.join(log_dir, log_name)

    # Create rotating logfile handler, max 10MB per file, 3 files max
    # Prevents logfile from growing too large, like in:
    #  - https://github.com/ActivityWatch/activitywatch/issues/815#issue-1423555466
    #  - https://github.com/ActivityWatch/activitywatch/issues/756#issuecomment-1266662861
    fh = RotatingFileHandler(
        log_file_path, mode="a", maxBytes=10 * 1024 * 1024, backupCount=3
    )
    fh.setFormatter(_create_human_formatter())

    return fh


def _create_human_formatter() -> logging.Formatter:  # pragma: no cover
    """Create a human-readable log message formatter.
    
    Returns:
        Logging formatter with timestamp, level, message, logger name, and line number
        
    Format pattern:
        YYYY-MM-DD HH:MM:SS [LEVEL]: message (logger_name:line_number)
        
    Example:
        2023-12-15 10:30:45 [INFO ]: Server started successfully (aw_server.server:42)
        
    Note:
        - Uses 24-hour time format for consistency
        - Fixed-width level field for aligned output
        - Includes source location for debugging
    """
    return logging.Formatter(
        "%(asctime)s [%(levelname)-5s]: %(message)s  (%(name)s:%(lineno)s)",
        "%Y-%m-%d %H:%M:%S",
    )
