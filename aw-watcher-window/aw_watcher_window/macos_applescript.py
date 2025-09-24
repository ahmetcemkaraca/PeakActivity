from typing import Dict, Optional

from Foundation import NSAppleScript

# the applescript version of the macos strategy is kept here until the jxa
# approach is proven out in production environments
# https://github.com/ActivityWatch/aw-watcher-window/pull/52


class MacOSAppleScriptWindowWatcher:
    """MacOS window watcher using AppleScript for getting active window information."""

    def __init__(self):
        """Initialize the watcher with AppleScript source."""
        self._script: Optional[NSAppleScript] = None
        self._source = """
global frontApp, frontAppName, windowTitle

set windowTitle to ""
tell application "System Events"
    set frontApp to first application process whose frontmost is true
    set frontAppName to name of frontApp
    tell process frontAppName
        try
            tell (1st window whose value of attribute "AXMain" is true)
                set windowTitle to value of attribute "AXTitle"
            end tell
        end try
    end tell
end tell

return frontAppName & "
" & windowTitle
"""

    def get_info(self) -> Dict[str, str]:
        """Get information about the current active window.

        Returns:
            Dict with 'app' and 'title' keys containing application name and window title.

        Raises:
            Exception: If AppleScript execution fails.
        """
        # Cache compiled script for performance
        if self._script is None:
            self._script = NSAppleScript.alloc().initWithSource_(self._source)

        # Execute script
        result, errorinfo = self._script.executeAndReturnError_(None)
        if errorinfo:
            raise Exception(errorinfo)
        output = result.stringValue()

        # Ensure there's no extra newlines in the output
        assert len(output.split("\n")) == 2

        app = self._get_app(output)
        title = self._get_title(output)

        return {"app": app, "title": title}

    def _get_app(self, info: str) -> str:
        """Extract application name from AppleScript output."""
        return info.split("\n")[0]

    def _get_title(self, info: str) -> str:
        """Extract window title from AppleScript output."""
        return info.split("\n")[1]


# Global instance for backwards compatibility
_watcher_instance = MacOSAppleScriptWindowWatcher()


def getInfo() -> Dict[str, str]:
    """Get window information using global watcher instance.

    This function is kept for backwards compatibility.
    Consider using MacOSAppleScriptWindowWatcher class directly.
    """
    return _watcher_instance.get_info()


def getApp(info: str) -> str:
    """Extract application name from info string (backwards compatibility)."""
    return info.split("\n")[0]


def getTitle(info: str) -> str:
    """Extract window title from info string (backwards compatibility)."""
    return info.split("\n")[1]


if __name__ == "__main__":
    info = getInfo()
    print(info)
