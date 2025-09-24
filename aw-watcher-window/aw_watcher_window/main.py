"""ActivityWatch Window Watcher - Main Entry Point.

This module provides the main functionality for the ActivityWatch window watcher,
which monitors the currently active window and reports window changes to the
ActivityWatch server. It supports multiple platforms (Linux, macOS, Windows)
and provides various monitoring strategies and filtering options.

The window watcher continuously polls the active window information including:
- Window title
- Application name
- Process information
- Window class/category

Features:
- Cross-platform window monitoring
- Title filtering with regex patterns
- Privacy protection through title exclusion
- Multiple detection strategies per platform
- Graceful error handling and recovery
- Parent process monitoring for orphan detection

Example:
    Basic usage:
    $ python -m aw_watcher_window
    
    With custom polling interval:
    $ python -m aw_watcher_window --poll-time 2.0
    
    With title exclusion:
    $ python -m aw_watcher_window --exclude-title
"""

import logging
import os
import re
import signal
import subprocess
import sys
from datetime import datetime, timezone
from time import sleep

from aw_client import ActivityWatchClient
from aw_core.log import setup_logging
from aw_core.models import Event
from aw_core.exceptions import AWWindowException, AWPlatformException
from aw_core.error_handler import safe_execute, error_context

from .config import parse_args
from .exceptions import FatalError
from .lib import get_current_window
from .macos_permissions import background_ensure_permissions

logger = logging.getLogger(__name__)

# run with LOG_LEVEL=DEBUG
log_level = os.environ.get("LOG_LEVEL")
if log_level:
    logger.setLevel(logging.__getattribute__(log_level.upper()))


def kill_process(pid):
    """Terminates a process by its process ID.
    
    Attempts to gracefully terminate the process using SIGTERM signal.
    If the process is already dead, logs the information without raising an error.
    
    Args:
        pid: The process ID of the process to terminate.
        
    Note:
        Uses os.kill with SIGTERM signal for process termination.
        Handles ProcessLookupError when the process is already terminated.
    """
    logger.info("Killing process {}".format(pid))
    try:
        os.kill(pid, signal.SIGTERM)
    except ProcessLookupError:
        logger.info("Process {} already dead".format(pid))


def try_compile_title_regex(title):
    """Compiles a title string into a case-insensitive regular expression pattern.
    
    Attempts to create a regex pattern from the provided title string.
    If the pattern is invalid, logs an error and exits the program.
    
    Args:
        title: String pattern to compile into a regular expression.
        
    Returns:
        re.Pattern: Compiled regular expression pattern with IGNORECASE flag.
        
    Raises:
        SystemExit: If the regex pattern is invalid.
        
    Note:
        Uses re.IGNORECASE flag for case-insensitive matching.
        Invalid patterns cause immediate program termination with exit code 1.
    """
    try:
        return re.compile(title, re.IGNORECASE)
    except re.error:
        logger.error(f"Invalid regex pattern: {title}")
        exit(1)


def main():
    """Main entry point for the ActivityWatch window watcher.
    
    Initializes the window watcher, sets up logging, creates the ActivityWatch client,
    and starts the appropriate monitoring strategy based on the platform and arguments.
    
    Raises:
        Exception: If DISPLAY environment variable is not set on Linux systems.
        
    Note:
        - On Linux, requires DISPLAY environment variable to be set
        - On macOS, ensures permissions and optionally uses Swift-based monitoring
        - Creates ActivityWatch bucket for storing window events
        - Handles platform-specific monitoring strategies
        - Sets up signal handlers for graceful termination
    """
    args = parse_args()

    if sys.platform.startswith("linux") and (
        "DISPLAY" not in os.environ or not os.environ["DISPLAY"]
    ):
        raise Exception("DISPLAY environment variable not set")

    setup_logging(
        name="aw-watcher-window",
        testing=args.testing,
        verbose=args.verbose,
        log_stderr=True,
        log_file=True,
    )

    if sys.platform == "darwin":
        background_ensure_permissions()

    client = ActivityWatchClient(
        "aw-watcher-window", host=args.host, port=args.port, testing=args.testing
    )

    bucket_id = f"{client.client_name}_{client.client_hostname}"
    event_type = "currentwindow"

    client.create_bucket(bucket_id, event_type, queued=True)

    logger.info("aw-watcher-window started")
    client.wait_for_start()

    with client:
        if sys.platform == "darwin" and args.strategy == "swift":
            logger.info("Using swift strategy, calling out to swift binary")
            binpath = os.path.join(
                os.path.dirname(os.path.realpath(__file__)), "aw-watcher-window-macos"
            )

            try:
                p = subprocess.Popen(
                    [
                        binpath,
                        client.server_address,
                        bucket_id,
                        client.client_hostname,
                        client.client_name,
                    ]
                )
                # terminate swift process when this process dies
                signal.signal(signal.SIGTERM, lambda *_: kill_process(p.pid))
                p.wait()
            except KeyboardInterrupt:
                print("KeyboardInterrupt")
                kill_process(p.pid)
        else:
            heartbeat_loop(
                client,
                bucket_id,
                poll_time=args.poll_time,
                strategy=args.strategy,
                exclude_title=args.exclude_title,
                exclude_titles=[
                    try_compile_title_regex(title)
                    for title in args.exclude_titles
                    if title is not None
                ],
            )


def heartbeat_loop(
    client, bucket_id, poll_time, strategy, exclude_title=False, exclude_titles=[]
):
    """Main monitoring loop that continuously captures and reports window information.
    
    Runs an infinite loop that polls the current active window at regular intervals,
    applies filtering rules, and sends the data to ActivityWatch server as heartbeat events.
    
    Args:
        client: ActivityWatch client instance for server communication.
        bucket_id: String identifier for the data storage bucket.
        poll_time: Float representing seconds between window polls.
        strategy: String specifying the window detection strategy to use.
        exclude_title: Boolean indicating whether to exclude all window titles.
        exclude_titles: List of compiled regex patterns for title exclusion.
        
    Note:
        - Monitors parent process and exits if parent dies (orphan detection)
        - Handles both fatal and non-fatal exceptions gracefully
        - Applies title filtering using regex patterns
        - Uses heartbeat mechanism with pulsetime = poll_time + 1 second
        - Sleeps for poll_time duration between iterations
        - Sets excluded titles to "excluded" string for privacy
    """
    while True:
        if os.getppid() == 1:
            logger.info("window-watcher stopped because parent process died")
            break

        current_window = None
        try:
            current_window = get_current_window(strategy)
            logger.debug(current_window)
        except (FatalError, OSError) as e:
            # Fatal exceptions should quit the program
            with error_context("fatal_window_error", suppress_errors=True):
                logger.exception(f"Fatal error, stopping: {e}")
            break
        except (ImportError, AttributeError) as e:
            # Platform-specific module import errors
            logger.error(f"Platform compatibility error: {e}")
            # Try to get window info with fallback method
            current_window = safe_execute(
                get_current_window, None, 
                default_value={"app": "unknown", "title": "unknown"},
                exception_types=(Exception,),
                context="window_info_fallback"
            )
        except PermissionError as e:
            # Permission-related errors (e.g., accessibility permissions on macOS)
            logger.warning(f"Permission error getting window info: {e}")
            current_window = {"app": "unknown", "title": "permission_denied"}
        except Exception as e:
            # Non-fatal exceptions should be logged but not crash the watcher
            with error_context("window_polling_error", suppress_errors=True):
                logger.warning(f"Exception while getting active window: {e}")
            # Continue with None - will be handled below

        if current_window is None:
            logger.debug("Unable to fetch window, trying again on next poll")
        else:
            for pattern in exclude_titles:
                if pattern.search(current_window["title"]):
                    current_window["title"] = "excluded"

            if exclude_title:
                current_window["title"] = "excluded"

            now = datetime.now(timezone.utc)
            current_window_event = Event(timestamp=now, data=current_window)

            # Set pulsetime to 1 second more than the poll_time
            # This since the loop takes more time than poll_time
            # due to sleep(poll_time).
            client.heartbeat(
                bucket_id, current_window_event, pulsetime=poll_time + 1.0, queued=True
            )

        sleep(poll_time)
