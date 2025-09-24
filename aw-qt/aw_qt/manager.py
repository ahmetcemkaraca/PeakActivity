"""ActivityWatch Module Manager.

This module provides automatic discovery and lifecycle management for ActivityWatch
modules (watchers and server). It handles both bundled modules (shipped with aw-qt)
and system-installed modules, with process management capabilities.

Key Features:
- Auto-discovery of aw-* executables in bundled and system paths
- Process lifecycle management (start/stop/status monitoring)
- Platform-specific executable detection and handling
- Testing mode support for all modules
- Unexpected shutdown detection and recovery

Module Types:
- bundled: Modules shipped with aw-qt distribution
- system: Modules installed separately in system PATH
"""

import os
import sys
import logging
import subprocess
import platform
import threading
from pathlib import Path
from glob import glob
from time import sleep
from typing import Optional, List, Hashable, Set, Iterable, Dict

import aw_core
from aw_core.log import setup_logging
from .exceptions import (  # Import Qt-specific exceptions
    AWQProcessException,
    AWQProcessStartupException,
    AWQProcessTerminationException,
    AWQProcessTimeoutException,
    AWManagerException,
    AWModuleStartException,
    AWModuleStopException,
    handle_qprocess_error,
)

logger = logging.getLogger(__name__)

# The path of aw_qt
_module_dir = os.path.dirname(os.path.realpath(__file__))

# The path of the aw-qt executable (when using PyInstaller)
_parent_dir = os.path.abspath(os.path.join(_module_dir, os.pardir))


def _log_modules(modules: List["Module"]) -> None:
    """Log discovered modules for debugging purposes.
    
    Args:
        modules: List of Module objects to log
    """
    for m in modules:
        logger.debug(f" - {m.name} at {m.path}")


ignored_filenames = ["aw-cli", "aw-client", "aw-qt", "aw-qt.desktop", "aw-qt.spec"]


def filter_modules(modules: Iterable["Module"]) -> Set["Module"]:
    """Filter out non-module executables from discovered files.
    
    Args:
        modules: Iterable of Module objects to filter
        
    Returns:
        Set of modules excluding utility programs like aw-qt itself or aw-cli
        
    Note:
        Removes programs that are not ActivityWatch modules but match the aw-* pattern.
    """
    # Remove things matching the pattern which is not a module
    # Like aw-qt itself, or aw-cli
    return {m for m in modules if m.name not in ignored_filenames}


def is_executable(path: str, filename: str) -> bool:
    """Check if a file is executable and should be considered as a module.
    
    Args:
        path: Full path to the file
        filename: Just the filename portion
        
    Returns:
        True if the file is executable and not filtered out
        
    Platform Behavior:
        - Windows: Files ending with .exe are considered executable
        - Unix/Linux: Files with executable permission, excluding .desktop files
    """
    if not os.path.isfile(path):
        return False
    # On windows all files ending with .exe are executables
    if platform.system() == "Windows":
        return filename.endswith(".exe")
    # On Unix platforms all files having executable permissions are executables
    # We do not however want to include .desktop files
    else:  # Assumes Unix
        if not os.access(path, os.X_OK):
            return False
        if filename.endswith(".desktop"):
            return False
        return True


def _discover_modules_in_directory(path: str) -> List["Module"]:
    """Look for modules in given directory path and recursively in subdirs matching aw-*.
    
    Args:
        path: Directory path to search for ActivityWatch modules
        
    Returns:
        List of Module objects found in the directory and its aw-* subdirectories
        
    Note:
        Recursively searches subdirectories that match the aw-* pattern.
        Warns about files that match the pattern but are not executable.
    """
    """Look for modules in given directory path and recursively in subdirs matching aw-*"""
    modules = []
    matches = glob(os.path.join(path, "aw-*"))
    for path in matches:
        basename = os.path.basename(path)
        if is_executable(path, basename) and basename.startswith("aw-"):
            name = _filename_to_name(basename)
            modules.append(Module(name, Path(path), "bundled"))
        elif os.path.isdir(path) and os.access(path, os.X_OK):
            modules.extend(_discover_modules_in_directory(path))
        else:
            logger.warning(f"Found matching file but was not executable: {path}")
    return modules


def _filename_to_name(filename: str) -> str:
    """Convert executable filename to module name.
    
    Args:
        filename: The executable filename (e.g., 'aw-server.exe')
        
    Returns:
        Module name with .exe extension removed (e.g., 'aw-server')
    """
    return filename.replace(".exe", "")


def _discover_modules_bundled() -> List["Module"]:
    """Use ``_discover_modules_in_directory`` to find all bundled modules.
    
    Returns:
        List of bundled Module objects found in the application directory
        
    Search Paths:
        - Module directory (where aw_qt is located)
        - Parent directory (PyInstaller bundle location)
        - MacOS: Additional MacOS bundle directory
        
    Note:
        Bundled modules are those shipped with the aw-qt distribution.
    """
    """Use ``_discover_modules_in_directory`` to find all bundled modules"""
    search_paths = [_module_dir, _parent_dir]
    if platform.system() == "Darwin":
        macos_dir = os.path.abspath(os.path.join(_parent_dir, os.pardir, "MacOS"))
        search_paths.append(macos_dir)
    # logger.debug(f"Searching for bundled modules in: {search_paths}")

    modules: List[Module] = []
    for path in search_paths:
        modules += _discover_modules_in_directory(path)

    modules = list(filter_modules(modules))
    logger.info(f"Found {len(modules)} bundled modules")
    _log_modules(modules)
    return modules


def _discover_modules_system() -> List["Module"]:
    """Find all aw- modules in PATH.
    
    Returns:
        List of system-installed Module objects found in PATH directories
        
    Note:
        - Excludes PyInstaller bundle directory to avoid duplicates
        - Respects PATH priority (first match wins)
        - Handles permission errors gracefully when accessing directories
        - System modules are those installed separately from aw-qt
    """
    """Find all aw- modules in PATH"""
    search_paths = os.get_exec_path()

    # Needed because PyInstaller adds the executable dir to the PATH
    if _parent_dir in search_paths:
        search_paths.remove(_parent_dir)

    # logger.debug(f"Searching for system modules in PATH: {search_paths}")
    modules: List["Module"] = []
    paths = [p for p in search_paths if os.path.isdir(p)]
    for path in paths:
        try:
            ls = os.listdir(path)
        except PermissionError:
            logger.warning(f"PermissionError while listing {path}, skipping")
            continue

        for basename in ls:
            if not basename.startswith("aw-"):
                continue
            if not is_executable(os.path.join(path, basename), basename):
                continue
            name = _filename_to_name(basename)
            # Only pick the first match (to respect PATH priority)
            if name not in [m.name for m in modules]:
                modules.append(Module(name, Path(path) / basename, "system"))

    modules = list(filter_modules(modules))
    logger.info(f"Found {len(modules)} system modules")
    _log_modules(modules)
    return modules


class Module:
    """Represents an ActivityWatch module with process lifecycle management.
    
    A Module encapsulates an executable ActivityWatch component (server or watcher)
    with its metadata and provides methods to start, stop, and monitor the process.
    
    Attributes:
        name: Module name (e.g., 'aw-server', 'aw-watcher-window')
        path: Path to the executable file
        type: Either 'system' or 'bundled' indicating installation source
        started: True if module is supposed to be running, else False
        
    Process Management:
        - Handles platform-specific startup configurations
        - Supports testing mode flag for all modules
        - Manages process lifecycle with proper cleanup
        - Tracks unexpected process termination
    """
    def __init__(self, name: str, path: Path, type: str) -> None:
        """Initialize a Module instance.
        
        Args:
            name: Module name (executable name without extension)
            path: Path to the executable file
            type: Either 'system' or 'bundled'
            
        Raises:
            AssertionError: If type is not 'system' or 'bundled'
        """
        self.name = name
        self.path = path
        assert type in ["system", "bundled"]
        self.type = type
        self.started = (
            False  # Should be True if module is supposed to be running, else False
        )
        # assert location in ["system", "bundled"]
        # self.location = "system" if _is_system_module(name) else "bundled"
        self._process: Optional[subprocess.Popen[str]] = None
        self._last_process: Optional[subprocess.Popen[str]] = None

    def __hash__(self) -> int:
        return hash((self.name, self.path))

    def __eq__(self, other: Hashable) -> bool:
        return hash(self) == hash(other)

    def __repr__(self) -> str:
        return f"<Module {self.name} at {self.path}>"

    def start(self, testing: bool) -> None:
        """Start the module process.
        
        Args:
            testing: If True, adds --testing flag to the command line
            
        Platform-Specific Behavior:
            - Windows: Hides console window to prevent UI clutter
            - macOS: Disables dock icon for background operation
            - Unix: Standard process creation
            
        Note:
            stdout and stderr are not piped to prevent subprocess hanging
            issues. See: https://github.com/ActivityWatch/aw-server/issues/27
        """
        logger.info(f"Starting module {self.name}")

        exec_cmd = [str(self.path)]
        if testing:
            exec_cmd.append("--testing")
        # logger.debug("Running: {}".format(exec_cmd))

        # Don't display a console window on Windows
        # See: https://github.com/ActivityWatch/activitywatch/issues/212
        startupinfo = None
        if sys.platform == "win32" or sys.platform == "cygwin":
            startupinfo = subprocess.STARTUPINFO()
            startupinfo.dwFlags |= subprocess.STARTF_USESHOWWINDOW
        elif sys.platform == "darwin":
            logger.info("macOS: Disable dock icon")
            import AppKit

            AppKit.NSBundle.mainBundle().infoDictionary()["LSBackgroundOnly"] = "1"

        # There is a very good reason stdout and stderr is not PIPE here
        # See: https://github.com/ActivityWatch/aw-server/issues/27
        try:
            self._process = subprocess.Popen(
                exec_cmd, universal_newlines=True, startupinfo=startupinfo
            )
            self.started = True
            logger.info(f"Successfully started module {self.name}")
        except PermissionError as e:
            logger.error("Permission denied starting module %s: %s", self.name, e)
            raise AWModuleStartException(
                f"Permission denied starting module {self.name}: {e}",
                module_name=self.name,
                operation="start"
            ) from e
        except FileNotFoundError as e:
            logger.error("Module executable not found %s: %s", self.name, e)
            raise AWModuleStartException(
                f"Module executable not found {self.name}: {e}",
                module_name=self.name,
                operation="start"
            ) from e
        except (OSError, subprocess.SubprocessError) as e:
            logger.error("Failed to start module %s: %s", self.name, e)
            raise AWQProcessStartupException(
                f"Failed to start module {self.name}: {e}",
                process_name=self.name,
                command=" ".join(exec_cmd)
            ) from e

    def stop(self) -> None:
        """Stop the module process and wait for termination.
        
        Performs graceful shutdown by sending SIGTERM and waiting for
        the process to exit. Updates internal state tracking.
        
        Warning:
            Currently does not implement timeout for process termination.
            A hanging module could block this method indefinitely.
            
        TODO: Add timeout to p.wait() and use p.kill() if timeout is reached.
        """
        """
        Stops a module, and waits until it terminates.
        """
        # TODO: What if a module doesn't stop? Add timeout to p.wait() and then do a p.kill() if timeout is hit
        if not self.started:
            logger.warning(
                f"Tried to stop module {self.name}, but it hasn't been started"
            )
            return
        elif not self.is_alive():
            logger.warning(f"Tried to stop module {self.name}, but it wasn't running")
        else:
            if not self._process:
                logger.error("No reference to process object")
                raise AWModuleStopException(
                    f"No process reference for module {self.name}",
                    module_name=self.name,
                    operation="stop"
                )
            
            logger.debug(f"Stopping module {self.name}")
            try:
                if self._process:
                    self._process.terminate()
                logger.debug(f"Waiting for module {self.name} to shut down")
                if self._process:
                    # TODO: Add timeout to prevent hanging
                    self._process.wait()
                logger.info(f"Stopped module {self.name}")
            except (OSError, subprocess.SubprocessError) as e:
                logger.error("Error stopping module %s: %s", self.name, e)
                # Try force killing the process
                try:
                    if self._process:
                        self._process.kill()
                        self._process.wait()
                    logger.warning("Force killed module %s", self.name)
                except Exception as kill_error:
                    logger.error("Failed to force kill module %s: %s", self.name, kill_error)
                    raise AWQProcessTerminationException(
                        f"Failed to stop module {self.name}: {e}",
                        process_name=self.name,
                        exit_code=getattr(self._process, 'returncode', None)
                    ) from e
            except Exception as e:
                logger.error("Unexpected error stopping module %s: %s", self.name, e)
                raise AWModuleStopException(
                    f"Unexpected error stopping module {self.name}: {e}",
                    module_name=self.name,
                    operation="stop"
                ) from e

        assert not self.is_alive()
        self._last_process = self._process
        self._process = None
        self.started = False

    def toggle(self, testing: bool) -> None:
        """Toggle the module's running state.
        
        Args:
            testing: Testing mode flag passed to start() if starting
            
        Note:
            If module is running, stops it. If stopped, starts it.
        """
        if self.started:
            self.stop()
        else:
            self.start(testing)

    def is_alive(self) -> bool:
        """Check if the module process is currently running.
        
        Returns:
            True if the process is alive, False otherwise
            
        Note:
            Uses poll() to check process status without blocking.
            A None returncode indicates the process is still running.
        """
        if self._process is None:
            return False

        self._process.poll()
        # If returncode is none after p.poll(), module is still running
        return True if self._process.returncode is None else False

    def read_log(self, testing: bool) -> str:
        """Retrieve the latest log contents for this module.
        
        Args:
            testing: Whether to look for testing or production logs
            
        Returns:
            String containing the full log file contents, or error message
            if no log file is found
            
        Note:
            Uses aw_core.log.get_latest_log_file() to locate the most recent
            log file for this module.
        """
        """Useful if you want to retrieve the logs of a module"""
        log_path = aw_core.log.get_latest_log_file(self.name, testing)
        if log_path:
            with open(log_path) as f:
                return f.read()
        else:
            return "No log file found"


class Manager:
    """Central manager for all ActivityWatch modules.
    
    Provides high-level interface for discovering, starting, stopping, and monitoring
    ActivityWatch modules. Handles both bundled and system-installed modules with
    preference for bundled versions.
    
    Key Features:
        - Automatic module discovery on initialization
        - Bulk operations (autostart, stop_all)
        - Status monitoring and reporting
        - Unexpected shutdown detection
        - Testing mode support
        
    Module Priority:
        Bundled modules are preferred over system modules when both exist
        with the same name.
    """
    def __init__(self, testing: bool = False) -> None:
        """Initialize the Manager and discover all available modules.
        
        Args:
            testing: Whether to operate in testing mode
            
        Note:
            Automatically runs module discovery during initialization.
        """
        self.modules: List[Module] = []
        self.testing = testing

        self.discover_modules()

    @property
    def modules_system(self) -> List[Module]:
        """Get all system-installed modules.
        
        Returns:
            List of modules with type='system'
        """
        return [m for m in self.modules if m.type == "system"]

    @property
    def modules_bundled(self) -> List[Module]:
        """Get all bundled modules.
        
        Returns:
            List of modules with type='bundled'
        """
        return [m for m in self.modules if m.type == "bundled"]

    def discover_modules(self) -> None:
        """Discover and update the list of available modules.
        
        Searches for both bundled and system modules, filters out non-modules,
        and updates the internal module list. Existing modules are preserved
        to maintain their state.
        
        Note:
            Can be called multiple times to refresh the module list.
        """
        # These should always be bundled with aw-qt
        modules = set(_discover_modules_bundled())
        modules |= set(_discover_modules_system())
        modules = filter_modules(modules)

        # update one by one
        for m in modules:
            if m not in self.modules:
                self.modules.append(m)

    def get_unexpected_stops(self) -> List[Module]:
        """Find modules that should be running but have stopped unexpectedly.
        
        Returns:
            List of modules where started=True but is_alive()=False
            
        Note:
            Useful for detecting crashed modules that need to be restarted.
        """
        return list(filter(lambda x: x.started and not x.is_alive(), self.modules))

    def start(self, module_name: str) -> None:
        """Start a specific module by name.
        
        Args:
            module_name: Name of the module to start (e.g., 'aw-server')
            
        Priority:
            Always prefers bundled version over system version if both exist.
            
        Note:
            This will not affect the aw-qt menu since it directly calls
            the module's start() method.
        """
        # NOTE: Will always prefer a bundled version, if available. This will not affect the
        #       aw-qt menu since it directly calls the module's start() method.
        bundled = [m for m in self.modules_bundled if m.name == module_name]
        system = [m for m in self.modules_system if m.name == module_name]
        if bundled:
            bundled[0].start(self.testing)
        elif system:
            system[0].start(self.testing)
        else:
            logger.error(f"Manager tried to start nonexistent module {module_name}")

    def autostart(self, autostart_modules: List[str]) -> None:
        """Start multiple modules in the correct order.
        
        Args:
            autostart_modules: List of module names to start automatically
            
        Startup Order:
            1. aw-server-rust (if present) or aw-server (fallback)
            2. All other modules in the provided list
            
        Note:
            Currently impossible to autostart a system module if a bundled
            module with the same name exists. Removes duplicates from the list.
        """
        # NOTE: Currently impossible to autostart a system module if a bundled module with the same name exists

        # We only want to autostart modules that are both in found modules and are asked to autostart.
        for name in autostart_modules:
            if name not in [m.name for m in self.modules]:
                logger.error(f"Module {name} not found")
        autostart_modules = list(set(autostart_modules))

        # Start aw-server-rust first
        if "aw-server-rust" in autostart_modules:
            self.start("aw-server-rust")
        elif "aw-server" in autostart_modules:
            self.start("aw-server")

        autostart_modules = list(
            set(autostart_modules) - {"aw-server", "aw-server-rust"}
        )
        for name in autostart_modules:
            self.start(name)

    def stop(self, module_name: str) -> None:
        """Stop a specific module by name.
        
        Args:
            module_name: Name of the module to stop
            
        Note:
            Stops the first module found with the given name, regardless
            of whether it's bundled or system.
        """
        for m in self.modules:
            if m.name == module_name:
                m.stop()
                break
        else:
            logger.error(f"Manager tried to stop nonexistent module {module_name}")

    def stop_all(self) -> None:
        """Stop all currently running modules.
        
        Iterates through all modules and stops those that are alive.
        Useful for clean shutdown of the entire ActivityWatch system.
        """
        for module in filter(lambda m: m.is_alive(), self.modules):
            module.stop()

    def print_status(self, module_name: Optional[str] = None) -> None:
        """Print status information for modules.
        
        Args:
            module_name: If provided, show status only for this module.
                        If None, show status for all modules.
                        
        Output Format:
            Logs a formatted table showing module name, status (running/stopped),
            and type (bundled/system).
        """
        header = "name                status      type"
        if module_name:
            # find module
            module = next((m for m in self.modules if m.name == module_name), None)
            if module:
                logger.info(header)
                self._print_status_module(module)
            else:
                logger.error(f"Module {module_name} not found")
        else:
            logger.info(header)
            for module in self.modules:
                self._print_status_module(module)

    def _print_status_module(self, module: Module) -> None:
        """Print formatted status line for a single module.
        
        Args:
            module: Module object to print status for
            
        Output Format:
            "{name:18}  {status:10}  {type}"
        """
        logger.info(
            f"{module.name:18}  {'running' if module.is_alive() else 'stopped' :10}  {module.type}"
        )


def main_test():
    manager = Manager()
    for module in manager.modules:
        module.start(testing=True)
        sleep(2)
        assert module.is_alive()
        module.stop()


if __name__ == "__main__":
    main_test()
