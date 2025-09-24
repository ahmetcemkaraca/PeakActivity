"""ActivityWatch Qt System Tray Icon and Menu Interface.

This module provides the system tray icon functionality for ActivityWatch,
including context menus for module management, quick access to web UI,
and system integration features.

Key Features:
- System tray icon with context menu
- Module start/stop control from tray menu
- Quick access to ActivityWatch dashboard and API browser
- Module status monitoring with failure detection
- Platform-specific optimizations (Windows, macOS, Linux)
- Automatic module restart dialogs for failed services

Platform Support:
- Windows: Native system tray with Windows-style icons
- macOS: Native menu bar icon with monochrome styling
- Linux: System tray via desktop environment (requires tray support)

Dependencies:
- PyQt6: GUI framework for tray icon and menus
- aw_core: Core ActivityWatch functionality
- Manager: Module lifecycle management
"""

import logging
import os
import signal
import subprocess
import sys
import webbrowser
from pathlib import Path
from typing import Any, Dict, Optional

import aw_core
from PyQt6 import QtCore
from PyQt6.QtGui import QIcon
from PyQt6.QtWidgets import (
    QApplication,
    QMenu,
    QMessageBox,
    QPushButton,
    QSystemTrayIcon,
    QWidget,
)

from .manager import Manager, Module
from .exceptions import (  # Import Qt-specific exceptions
    AWQProcessException,
    AWTrayException,
    AWGuiException,
)

logger = logging.getLogger(__name__)


def get_env() -> Dict[str, str]:
    """Get environment variables with PyInstaller LD_LIBRARY_PATH fix.
    
    PyInstaller modifies LD_LIBRARY_PATH which can break xdg-open on Linux.
    This function restores the original LD_LIBRARY_PATH value if it was
    preserved in LD_LIBRARY_PATH_ORIG.
    
    Returns:
        Dictionary of environment variables with corrected LD_LIBRARY_PATH
        
    Reference:
        https://github.com/ActivityWatch/activitywatch/issues/208#issuecomment-417346407
        
    Note:
        This fix is specific to GNU/Linux and *BSD systems where PyInstaller
        can interfere with dynamic library loading.
    """
    env = dict(os.environ)  # make a copy of the environment
    lp_key = "LD_LIBRARY_PATH"  # for GNU/Linux and *BSD.
    lp_orig = env.get(lp_key + "_ORIG")
    if lp_orig is not None:
        env[lp_key] = lp_orig  # restore the original, unmodified value
    else:
        # This happens when LD_LIBRARY_PATH was not set.
        # Remove the env var as a last resort:
        env.pop(lp_key, None)
    return env


def open_url(url: str) -> None:
    """Open a URL using the system's default browser.
    
    Args:
        url: URL to open in the default browser
        
    Platform Behavior:
        - Linux: Uses xdg-open with corrected environment variables
        - Other platforms: Uses Python's webbrowser module
        
    Note:
        On Linux, uses get_env() to fix PyInstaller LD_LIBRARY_PATH issues
        that can prevent xdg-open from working correctly.
    """
    if sys.platform == "linux":
        try:
            env = get_env()
            subprocess.Popen(["xdg-open", url], env=env)
        except (OSError, subprocess.SubprocessError) as e:
            logger.error("Failed to open URL with xdg-open: %s", e)
            # Fallback to webbrowser
            try:
                webbrowser.open(url)
            except Exception as fallback_error:
                logger.error("Fallback webbrowser.open also failed: %s", fallback_error)
                raise AWQProcessException(
                    f"Failed to open URL {url}: {e}",
                    command="xdg-open"
                ) from e
    else:
        try:
            webbrowser.open(url)
        except Exception as e:
            logger.error("Failed to open URL with webbrowser: %s", e)
            raise AWQProcessException(
                f"Failed to open URL {url}: {e}",
                command="webbrowser.open"
            ) from e


def open_webui(root_url: str) -> None:
    """Open the ActivityWatch web dashboard in the default browser.
    
    Args:
        root_url: Base URL of the ActivityWatch server (e.g., http://localhost:5600)
        
    Note:
        Opens the main dashboard interface for viewing activity data,
        timelines, and reports.
    """
    print("Opening dashboard")
    open_url(root_url)


def open_apibrowser(root_url: str) -> None:
    """Open the ActivityWatch API browser in the default browser.
    
    Args:
        root_url: Base URL of the ActivityWatch server
        
    Note:
        Opens the API documentation and testing interface at {root_url}/api,
        useful for developers and advanced users to explore the REST API.
    """
    print("Opening api browser")
    open_url(root_url + "/api")


def open_dir(d: str) -> None:
    """Open a directory in the system's default file manager.
    
    Args:
        d: Directory path to open
        
    Platform Behavior:
        - Windows: Uses os.startfile() for Explorer integration
        - macOS: Uses 'open' command for Finder integration  
        - Linux: Uses xdg-open with environment fix for file manager
        
    Reference:
        http://stackoverflow.com/a/1795849/965332
        
    Note:
        On Linux, uses get_env() to fix PyInstaller environment issues.
    """
    if sys.platform == "win32":
        try:
            os.startfile(d)
        except OSError as e:
            logger.error("Failed to open directory with startfile: %s", e)
            raise AWQProcessException(
                f"Failed to open directory {d}: {e}",
                command="os.startfile"
            ) from e
    elif sys.platform == "darwin":
        try:
            subprocess.Popen(["open", d])
        except (OSError, subprocess.SubprocessError) as e:
            logger.error("Failed to open directory with open command: %s", e)
            raise AWQProcessException(
                f"Failed to open directory {d}: {e}",
                command="open"
            ) from e
    else:
        try:
            env = get_env()
            subprocess.Popen(["xdg-open", d], env=env)
        except (OSError, subprocess.SubprocessError) as e:
            logger.error("Failed to open directory with xdg-open: %s", e)
            raise AWQProcessException(
                f"Failed to open directory {d}: {e}",
                command="xdg-open"
            ) from e


class TrayIcon(QSystemTrayIcon):
    """ActivityWatch system tray icon with context menu and module management.
    
    Provides a persistent system tray presence for ActivityWatch with quick access
    to common functions and real-time module status monitoring. Integrates with
    the Manager class to provide GUI control over ActivityWatch modules.
    
    Features:
        - Double-click to open dashboard
        - Context menu with module start/stop controls
        - Automatic detection of failed modules with restart dialogs
        - Quick access to logs and configuration directories
        - Visual indication of testing vs production mode
        - Platform-appropriate icon styling
        
    Menu Structure:
        - Open Dashboard / API Browser
        - Modules submenu (bundled and system modules)
        - Open log/config folder shortcuts
        - Quit ActivityWatch option
        
    Module Monitoring:
        - Polls module status every 2 seconds
        - Shows warning dialogs for unexpected module failures
        - Provides one-click restart functionality
        - Displays module logs in failure dialogs
    """
    def __init__(
        self,
        manager: Manager,
        icon: QIcon,
        parent: Optional[QWidget] = None,
        testing: bool = False,
    ) -> None:
        """Initialize the system tray icon with ActivityWatch branding.
        
        Args:
            manager: Manager instance for module lifecycle control
            icon: QIcon to display in the system tray
            parent: Optional parent widget for Qt object hierarchy
            testing: Whether running in testing mode (affects port and tooltip)
            
        Setup:
            - Configures tooltip with mode indication
            - Sets up double-click handler for dashboard access
            - Builds context menu with all available actions
            - Determines server URL based on testing mode
        """
        QSystemTrayIcon.__init__(self, icon, parent)
        self._parent = parent  # QSystemTrayIcon also tries to save parent info but it screws up the type info
        self.setToolTip("ActivityWatch" + (" (testing)" if testing else ""))

        self.manager = manager
        self.testing = testing

        self.root_url = f"http://localhost:{5666 if self.testing else 5600}"
        self.activated.connect(self.on_activated)

        self._build_rootmenu()

    def on_activated(self, reason: QSystemTrayIcon.ActivationReason) -> None:
        """Handle system tray icon activation events.
        
        Args:
            reason: The type of activation that occurred
            
        Behavior:
            - Double-click: Opens the ActivityWatch web dashboard
            - Other activations: Currently ignored (single-click shows menu automatically)
            
        Note:
            Single-click behavior is handled automatically by Qt to show the context menu.
        """
        if reason == QSystemTrayIcon.ActivationReason.DoubleClick:
            open_webui(self.root_url)

    def _build_rootmenu(self) -> None:
        """Build the main context menu for the system tray icon.
        
        Creates a comprehensive menu with the following sections:
        1. Testing mode indicator (if applicable)
        2. Quick access: Dashboard and API Browser
        3. Modules submenu: All available ActivityWatch modules
        4. Utilities: Log and config folder access
        5. Exit: Quit ActivityWatch option
        
        Menu Features:
            - Dynamic module status updates every 2 seconds
            - Automatic module failure detection and restart dialogs
            - Platform-appropriate icons when available
            - Graceful handling of missing icons
            
        Background Tasks:
            Sets up recurring timers for:
            - Module status monitoring and menu updates
            - Failed module detection and user notification
        """
        menu = QMenu(self._parent)

        if self.testing:
            menu.addAction("Running in testing mode")  # .setEnabled(False)
            menu.addSeparator()

        # openWebUIIcon = QIcon.fromTheme("open")
        menu.addAction("Open Dashboard", lambda: open_webui(self.root_url))
        menu.addAction("Open API Browser", lambda: open_apibrowser(self.root_url))

        menu.addSeparator()

        modulesMenu = menu.addMenu("Modules")
        self._build_modulemenu(modulesMenu)

        menu.addSeparator()
        menu.addAction(
            "Open log folder", lambda: open_dir(aw_core.dirs.get_log_dir(None))
        )
        menu.addAction(
            "Open config folder", lambda: open_dir(aw_core.dirs.get_config_dir(None))
        )
        menu.addSeparator()

        exitIcon = QIcon.fromTheme(
            "application-exit", QIcon("media/application_exit.png")
        )
        # This check is an attempted solution to: https://github.com/ActivityWatch/activitywatch/issues/62
        # Seems to be in agreement with: https://github.com/OtterBrowser/otter-browser/issues/1313
        #   "it seems that the bug is also triggered when creating a QIcon with an invalid path"
        if exitIcon.availableSizes():
            menu.addAction(exitIcon, "Quit ActivityWatch", lambda: exit(self.manager))
        else:
            menu.addAction("Quit ActivityWatch", lambda: exit(self.manager))

        self.setContextMenu(menu)

        def show_module_failed_dialog(module: Module) -> None:
            box = QMessageBox(self._parent)
            box.setIcon(QMessageBox.Icon.Warning)
            box.setText(f"Module {module.name} quit unexpectedly")
            box.setDetailedText(module.read_log(self.testing))

            restart_button = QPushButton("Restart", box)
            restart_button.clicked.connect(module.start)
            box.addButton(restart_button, QMessageBox.ButtonRole.AcceptRole)
            box.setStandardButtons(QMessageBox.StandardButton.Cancel)

            box.show()

        def rebuild_modules_menu() -> None:
            for action in modulesMenu.actions():
                if action.isEnabled():
                    module: Module = action.data()
                    alive = module.is_alive()
                    action.setChecked(alive)
                    # print(module.text(), alive)

            # TODO: Do it in a better way, singleShot isn't pretty...
            QtCore.QTimer.singleShot(2000, rebuild_modules_menu)

        QtCore.QTimer.singleShot(2000, rebuild_modules_menu)

        def check_module_status() -> None:
            unexpected_exits = self.manager.get_unexpected_stops()
            if unexpected_exits:
                for module in unexpected_exits:
                    show_module_failed_dialog(module)
                    module.stop()

            # TODO: Do it in a better way, singleShot isn't pretty...
            QtCore.QTimer.singleShot(2000, rebuild_modules_menu)

        QtCore.QTimer.singleShot(2000, check_module_status)

    def _build_modulemenu(self, moduleMenu: QMenu) -> None:
        """Build the modules submenu with current module status.
        
        Args:
            moduleMenu: QMenu instance to populate with module controls
            
        Menu Structure:
            - "bundled" header (disabled, for visual grouping)
            - Bundled module toggles (checkable, show current status)
            - "system" header (disabled, for visual grouping)  
            - System module toggles (checkable, show current status)
            
        Module Items:
            - Checkable actions that reflect current module status
            - Click toggles module start/stop state
            - Sorted alphabetically within each group
            - Each action stores the Module object as data for easy access
            
        Note:
            Clears existing menu items before rebuilding to ensure
            current state is always displayed.
        """
        moduleMenu.clear()

        def add_module_menuitem(module: Module) -> None:
            title = module.name
            ac = moduleMenu.addAction(title, lambda: module.toggle(self.testing))

            ac.setData(module)
            ac.setCheckable(True)
            ac.setChecked(module.is_alive())

        for location, modules in [
            ("bundled", self.manager.modules_bundled),
            ("system", self.manager.modules_system),
        ]:
            header = moduleMenu.addAction(location)
            header.setEnabled(False)

            for module in sorted(modules, key=lambda m: m.name):
                add_module_menuitem(module)


def exit(manager: Manager) -> None:
    """Gracefully shutdown ActivityWatch and all its modules.
    
    Args:
        manager: Manager instance to stop all modules
        
    Shutdown Process:
        1. Logs shutdown initiation
        2. Stops all running modules via manager.stop_all()
        3. Quits the Qt application
        
    Note:
        Process group termination (os.killpg) is commented out as it's
        too aggressive. The current approach allows modules to shut down
        gracefully before terminating the main application.
        
    TODO:
        - Implement state saving for module resume on next startup
        - Add cleanup actions for temporary files or connections
    """
    # TODO: Do cleanup actions
    # TODO: Save state for resume
    print("Shutdown initiated, stopping all services...")
    manager.stop_all()
    # Terminate entire process group, just in case.
    # os.killpg(0, signal.SIGINT)

    QApplication.quit()


def run(manager: Manager, testing: bool = False) -> Any:
    """Initialize and run the ActivityWatch Qt tray application.
    
    Args:
        manager: Manager instance for module control
        testing: Whether to run in testing mode (affects ports and branding)
        
    Returns:
        Exit code from the Qt application event loop
        
    Setup Process:
        1. Creates QApplication instance
        2. Configures icon search paths for PyInstaller compatibility
        3. Sets up signal handlers for graceful shutdown (Ctrl+C, SIGTERM)
        4. Verifies system tray availability
        5. Creates and shows TrayIcon with platform-appropriate styling
        6. Starts Qt event loop
        
    Platform-Specific Features:
        - macOS: Uses monochrome icon with mask for system theme integration
        - Other platforms: Uses color logo icon
        - Linux: Requires desktop environment with system tray support
        
    Error Handling:
        - Exits with error if no system tray is available
        - Provides user guidance for systems without tray support
        
    Signal Handling:
        - SIGINT (Ctrl+C): Triggers graceful shutdown
        - SIGTERM: Triggers graceful shutdown
        - Timer tick every 100ms: Allows Python signal processing
        
    Note:
        QApplication.setQuitOnLastWindowClosed(False) ensures the app
        continues running even if all windows are closed, as is appropriate
        for a system tray application.
    """
    logger.info("Creating trayicon...")
    # print(QIcon.themeSearchPaths())

    app = QApplication(sys.argv)

    # This is needed for the icons to get picked up with PyInstaller
    scriptdir = Path(__file__).parent

    # When run from source:
    #   __file__ is aw_qt/trayicon.py
    #   scriptdir is ./aw_qt
    #   logodir is ./media/logo
    QtCore.QDir.addSearchPath("icons", str(scriptdir.parent / "media/logo/"))

    # When run from .app:
    #   __file__ is ./Contents/MacOS/aw-qt
    #   scriptdir is ./Contents/MacOS
    #   logodir is ./Contents/Resources/aw_qt/media/logo
    QtCore.QDir.addSearchPath(
        "icons", str(scriptdir.parent.parent / "Resources/aw_qt/media/logo/")
    )

    # logger.info(f"search paths: {QtCore.QDir.searchPaths('icons')}")

    # Without this, Ctrl+C will have no effect
    signal.signal(signal.SIGINT, lambda *args: exit(manager))
    # Ensure cleanup happens on SIGTERM
    signal.signal(signal.SIGTERM, lambda *args: exit(manager))

    timer = QtCore.QTimer()
    timer.start(100)  # You may change this if you wish.
    timer.timeout.connect(lambda: None)  # Let the interpreter run each 500 ms.

    # root widget
    widget = QWidget()

    if not QSystemTrayIcon.isSystemTrayAvailable():
        QMessageBox.critical(
            widget,
            "Systray",
            "I couldn't detect any system tray on this system. Either get one or run the ActivityWatch modules from the console.",
        )
        sys.exit(1)

    if sys.platform == "darwin":
        icon = QIcon("icons:black-monochrome-logo.png")
        # Allow macOS to use filters for changing the icon's color
        icon.setIsMask(True)
    else:
        icon = QIcon("icons:logo.png")

    trayIcon = TrayIcon(manager, icon, widget, testing=testing)
    trayIcon.show()

    QApplication.setQuitOnLastWindowClosed(False)

    logger.info("Initialized aw-qt and trayicon successfully")
    # Run the application, blocks until quit
    return app.exec()
