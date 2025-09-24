"""
Listeners for aggregated keyboard and mouse events.

This is used for AFK detection on Linux, as well as used in aw-watcher-input to track input activity in general.

NOTE: Logging usage should be commented out before committed, for performance reasons.
"""

import logging
import threading
from abc import ABCMeta, abstractmethod
from collections import defaultdict
from typing import Dict, Any

logger = logging.getLogger(__name__)
# logger.setLevel(logging.DEBUG)


class EventFactory(metaclass=ABCMeta):
    """Abstract base class for creating input event listeners.
    
    Provides a common interface for keyboard and mouse event factories,
    implementing a thread-safe event generation pattern. Events are accumulated
    until retrieved via next_event().
    
    Thread Safety:
        Uses threading.Event for synchronization between listener threads
        and consumer threads.
    """
    def __init__(self) -> None:
        """Initialize the event factory with a threading event and reset data."""
        self.new_event = threading.Event()
        self._reset_data()

    @abstractmethod
    def _reset_data(self) -> None:
        """Reset the internal event data structure.
        
        Must be implemented by subclasses to define what constitutes
        a fresh event state.
        """
        self.event_data: Dict[str, Any] = {}

    def next_event(self) -> dict:
        """Returns an event and prepares the internal state so that it can start to build a new event.
        
        Returns:
            Dictionary containing the accumulated event data since last call
            
        Note:
            This method resets the internal state and clears the new_event flag,
            preparing for the next event accumulation cycle.
        """
        self.new_event.clear()
        data = self.event_data
        # self.logger.debug(f"Event: {data}")
        self._reset_data()
        return data

    def has_new_event(self) -> bool:
        """Check if a new event has been accumulated since last retrieval.
        
        Returns:
            True if new input events have been detected and are ready for retrieval
        """
        return self.new_event.is_set()


class KeyboardListener(EventFactory):
    """Keyboard event listener for tracking key press activity.
    
    Monitors keyboard activity using pynput library and accumulates
    key press counts for AFK detection. Only counts key presses,
    not releases, to avoid double-counting.
    
    Event Data Structure:
        {"presses": int} - Total number of key presses since last retrieval
    """
    def __init__(self):
        """Initialize keyboard listener with logging."""
        EventFactory.__init__(self)
        self.logger = logger.getChild("keyboard")

    def start(self):
        """Start the keyboard listener in a separate thread.
        
        Uses pynput.keyboard.Listener to monitor global keyboard events.
        The listener runs asynchronously and calls event handlers when
        keys are pressed or released.
        """
        from pynput import keyboard

        listener = keyboard.Listener(on_press=self.on_press, on_release=self.on_release)
        listener.start()

    def _reset_data(self):
        """Reset keyboard event data to initial state.
        
        Initializes the event data with zero key presses count.
        """
        self.event_data = {"presses": 0}

    def on_press(self, key):
        """Handle key press events.
        
        Args:
            key: The key that was pressed (from pynput.keyboard)
            
        Note:
            Increments the press counter and signals that a new event is available.
            Logging is commented out for performance reasons.
        """
        # self.logger.debug(f"Press: {key}")
        self.event_data["presses"] += 1
        self.new_event.set()

    def on_release(self, key):
        """Handle key release events.
        
        Args:
            key: The key that was released (from pynput.keyboard)
            
        Note:
            Currently does nothing - we only count presses to avoid double-counting.
            Key releases are ignored for AFK detection purposes.
        """
        # Don't count releases, only clicks
        # self.logger.debug(f"Release: {key}")
        pass


class MouseListener(EventFactory):
    """Mouse event listener for tracking mouse activity.
    
    Monitors mouse movements, clicks, and scroll events using pynput library.
    Accumulates activity data for AFK detection, including movement deltas,
    click counts, and scroll wheel activity.
    
    Event Data Structure:
        {
            "clicks": int,      # Number of mouse clicks (press events only)
            "deltaX": int,      # Absolute horizontal movement in pixels
            "deltaY": int,      # Absolute vertical movement in pixels  
            "scrollX": int,     # Absolute horizontal scroll amount
            "scrollY": int      # Absolute vertical scroll amount
        }
    """
    def __init__(self):
        """Initialize mouse listener with logging and position tracking."""
        EventFactory.__init__(self)
        self.logger = logger.getChild("mouse")
        self.pos = None

    def _reset_data(self):
        """Reset mouse event data to initial state.
        
        Initializes all mouse activity counters to zero using defaultdict
        for automatic initialization of missing keys.
        """
        self.event_data = defaultdict(int)
        self.event_data.update(
            {"clicks": 0, "deltaX": 0, "deltaY": 0, "scrollX": 0, "scrollY": 0}
        )

    def start(self):
        """Start the mouse listener in a separate thread.
        
        Uses pynput.mouse.Listener to monitor global mouse events including
        movements, clicks, and scroll wheel activity. The listener runs
        asynchronously and calls appropriate event handlers.
        """
        from pynput import mouse

        listener = mouse.Listener(
            on_move=self.on_move, on_click=self.on_click, on_scroll=self.on_scroll
        )
        listener.start()

    def on_move(self, x, y):
        """Handle mouse movement events.
        
        Args:
            x: Current X coordinate of mouse cursor
            y: Current Y coordinate of mouse cursor
            
        Note:
            Calculates movement delta from previous position and accumulates
            absolute movement distance for activity tracking.
        """
        newpos = (x, y)
        # self.logger.debug("Moved mouse to: {},{}".format(x, y))
        if not self.pos:
            self.pos = newpos

        delta = tuple(self.pos[i] - newpos[i] for i in range(2))
        self.event_data["deltaX"] += abs(delta[0])
        self.event_data["deltaY"] += abs(delta[1])

        self.pos = newpos
        self.new_event.set()

    def on_click(self, x, y, button, down):
        """Handle mouse click events.
        
        Args:
            x: X coordinate where click occurred
            y: Y coordinate where click occurred  
            button: Mouse button that was clicked (from pynput.mouse.Button)
            down: True for press, False for release
            
        Note:
            Only counts press events (down=True) to avoid double-counting.
            Click position and button type are currently ignored for AFK detection.
        """
        # self.logger.debug(f"Click: {button} at {(x, y)}")
        # Only count presses, not releases
        if down:
            self.event_data["clicks"] += 1
            self.new_event.set()

    def on_scroll(self, x, y, scrollx, scrolly):
        """Handle mouse scroll wheel events.
        
        Args:
            x: X coordinate where scroll occurred
            y: Y coordinate where scroll occurred
            scrollx: Horizontal scroll amount (positive=right, negative=left)
            scrolly: Vertical scroll amount (positive=up, negative=down)
            
        Note:
            Accumulates absolute scroll amounts for activity tracking.
            Position coordinates are currently ignored for AFK detection.
        """
        # self.logger.debug(f"Scroll: {scrollx}, {scrolly} at {(x, y)}")
        self.event_data["scrollX"] += abs(scrollx)
        self.event_data["scrollY"] += abs(scrolly)
        self.new_event.set()
