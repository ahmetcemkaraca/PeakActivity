"""ActivityWatch memory management and optimization utilities.

This module provides memory management tools for optimal resource usage
across ActivityWatch components, including memory monitoring, leak detection,
and optimization strategies.

Key Features:
- Memory usage monitoring and alerting
- Memory leak detection and prevention
- Object pool management for frequent allocations
- Garbage collection optimization
- Memory-efficient data structures
- Resource cleanup automation
"""

import gc
import logging
import os
import psutil
import threading
import time
import weakref
from contextlib import contextmanager
from dataclasses import dataclass
from typing import Any, Callable, Dict, Generator, List, Optional, Set, TypeVar
from collections import defaultdict, deque

logger = logging.getLogger(__name__)

T = TypeVar("T")


@dataclass
class MemoryStats:
    """Memory usage statistics."""

    rss_mb: float  # Resident Set Size in MB
    vms_mb: float  # Virtual Memory Size in MB
    percent: float  # Memory usage percentage
    available_mb: float  # Available memory in MB
    gc_objects: int  # Number of tracked objects
    gc_collections: Dict[int, int]  # GC collections per generation


class MemoryMonitor:
    """Real-time memory usage monitoring and alerting."""

    def __init__(
        self, warning_threshold: float = 80.0, critical_threshold: float = 90.0
    ):
        """Initialize memory monitor.

        Args:
            warning_threshold: Memory usage percentage to trigger warning
            critical_threshold: Memory usage percentage to trigger critical alert
        """
        self.warning_threshold = warning_threshold
        self.critical_threshold = critical_threshold
        self.process = psutil.Process(os.getpid())
        self._callbacks: Dict[str, List[Callable[[MemoryStats], None]]] = defaultdict(
            list
        )
        self._monitoring = False
        self._monitor_thread: Optional[threading.Thread] = None
        self._last_stats: Optional[MemoryStats] = None

    def start_monitoring(self, interval: float = 30.0) -> None:
        """Start memory monitoring in background thread.

        Args:
            interval: Monitoring interval in seconds
        """
        if self._monitoring:
            logger.warning("Memory monitoring already started")
            return

        self._monitoring = True
        self._monitor_thread = threading.Thread(
            target=self._monitor_loop, args=(interval,), daemon=True
        )
        self._monitor_thread.start()
        logger.info("Memory monitoring started (interval: %.1fs)", interval)

    def stop_monitoring(self) -> None:
        """Stop memory monitoring."""
        self._monitoring = False
        if self._monitor_thread:
            self._monitor_thread.join(timeout=5.0)
        logger.info("Memory monitoring stopped")

    def get_current_stats(self) -> MemoryStats:
        """Get current memory usage statistics."""
        memory_info = self.process.memory_info()
        system_memory = psutil.virtual_memory()

        # Get GC statistics
        gc_stats = gc.get_stats()
        gc_collections = {i: stat["collections"] for i, stat in enumerate(gc_stats)}

        return MemoryStats(
            rss_mb=memory_info.rss / 1024 / 1024,
            vms_mb=memory_info.vms / 1024 / 1024,
            percent=system_memory.percent,
            available_mb=system_memory.available / 1024 / 1024,
            gc_objects=len(gc.get_objects()),
            gc_collections=gc_collections,
        )

    def register_callback(
        self, level: str, callback: Callable[[MemoryStats], None]
    ) -> None:
        """Register callback for memory events.

        Args:
            level: Event level ('warning', 'critical', 'info')
            callback: Callback function to execute
        """
        self._callbacks[level].append(callback)

    def _monitor_loop(self, interval: float) -> None:
        """Main monitoring loop."""
        while self._monitoring:
            try:
                stats = self.get_current_stats()
                self._last_stats = stats

                # Check thresholds and trigger callbacks
                if stats.percent >= self.critical_threshold:
                    self._trigger_callbacks("critical", stats)
                elif stats.percent >= self.warning_threshold:
                    self._trigger_callbacks("warning", stats)
                else:
                    self._trigger_callbacks("info", stats)

                time.sleep(interval)
            except Exception as e:
                logger.error("Error in memory monitoring loop: %s", e)
                time.sleep(interval)

    def _trigger_callbacks(self, level: str, stats: MemoryStats) -> None:
        """Trigger callbacks for specific level."""
        for callback in self._callbacks[level]:
            try:
                callback(stats)
            except Exception as e:
                logger.error("Error in memory callback: %s", e)


class ObjectPool:
    """Generic object pool for reusing expensive objects.

    Reduces memory allocation overhead by reusing objects instead of
    creating new ones repeatedly.
    """

    def __init__(self, factory: Callable[[], T], max_size: int = 100):
        """Initialize object pool.

        Args:
            factory: Function to create new objects
            max_size: Maximum pool size
        """
        self.factory = factory
        self.max_size = max_size
        self._pool: deque = deque()
        self._lock = threading.RLock()
        self._created_count = 0
        self._reused_count = 0

    def acquire(self) -> T:
        """Acquire object from pool or create new one."""
        with self._lock:
            if self._pool:
                obj = self._pool.popleft()
                self._reused_count += 1
                return obj
            else:
                obj = self.factory()
                self._created_count += 1
                return obj

    def release(self, obj: T) -> None:
        """Return object to pool."""
        with self._lock:
            if len(self._pool) < self.max_size:
                # Reset object if it has a reset method
                if hasattr(obj, "reset"):
                    obj.reset()  # type: ignore
                self._pool.append(obj)

    @contextmanager
    def get_object(self) -> Generator[T, None, None]:
        """Context manager for automatic acquire/release."""
        obj = self.acquire()
        try:
            yield obj
        finally:
            self.release(obj)

    def get_stats(self) -> Dict[str, int]:
        """Get pool usage statistics."""
        with self._lock:
            return {
                "pool_size": len(self._pool),
                "max_size": self.max_size,
                "created_count": self._created_count,
                "reused_count": self._reused_count,
                "reuse_rate": self._reused_count
                / max(1, self._created_count + self._reused_count),
            }


class MemoryLeakDetector:
    """Detect potential memory leaks by tracking object references."""

    def __init__(self):
        self._tracked_objects: Dict[str, Set[weakref.ref]] = defaultdict(set)
        self._snapshots: List[Dict[str, int]] = []
        self._lock = threading.RLock()

    def track_object(self, obj: Any, category: str = "default") -> None:
        """Track object for leak detection.

        Args:
            obj: Object to track
            category: Category for grouping objects
        """
        with self._lock:
            ref = weakref.ref(obj, lambda r: self._cleanup_ref(category, r))
            self._tracked_objects[category].add(ref)

    def take_snapshot(self) -> Dict[str, int]:
        """Take snapshot of current object counts.

        Returns:
            Dictionary of object counts by category
        """
        with self._lock:
            snapshot = {}
            for category, refs in self._tracked_objects.items():
                # Count live references
                live_refs = [ref for ref in refs if ref() is not None]
                self._tracked_objects[category] = set(live_refs)
                snapshot[category] = len(live_refs)

            self._snapshots.append(snapshot)
            return snapshot

    def detect_leaks(self, threshold: int = 100) -> Dict[str, List[int]]:
        """Detect potential memory leaks.

        Args:
            threshold: Minimum object count to consider as potential leak

        Returns:
            Dictionary of growing object counts by category
        """
        with self._lock:
            if len(self._snapshots) < 2:
                return {}

            leaks = {}
            for category in self._tracked_objects:
                counts = [snapshot.get(category, 0) for snapshot in self._snapshots]

                # Check if consistently growing and above threshold
                if len(counts) >= 3:
                    recent_counts = counts[-3:]
                    if (
                        all(
                            recent_counts[i] <= recent_counts[i + 1]
                            for i in range(len(recent_counts) - 1)
                        )
                        and recent_counts[-1] >= threshold
                    ):
                        leaks[category] = counts

            return leaks

    def _cleanup_ref(self, category: str, ref: weakref.ref) -> None:
        """Clean up dead reference."""
        with self._lock:
            self._tracked_objects[category].discard(ref)


class MemoryOptimizer:
    """Memory optimization utilities and strategies."""

    @staticmethod
    def optimize_gc() -> Dict[str, Any]:
        """Optimize garbage collection settings.

        Returns:
            GC optimization results
        """
        # Save original thresholds
        original_thresholds = gc.get_threshold()

        # Get current stats
        before_stats = gc.get_stats()
        before_objects = len(gc.get_objects())

        # Force collection of all generations
        collected = gc.collect()

        # Set more aggressive thresholds for better performance
        # Reduce gen0 threshold for frequent small collections
        # Increase gen1/gen2 thresholds to avoid expensive collections
        gc.set_threshold(700, 15, 15)

        after_stats = gc.get_stats()
        after_objects = len(gc.get_objects())

        result = {
            "collected_objects": collected,
            "objects_before": before_objects,
            "objects_after": after_objects,
            "objects_freed": before_objects - after_objects,
            "original_thresholds": original_thresholds,
            "new_thresholds": gc.get_threshold(),
            "stats_before": before_stats,
            "stats_after": after_stats,
        }

        logger.info(
            "GC optimization: freed %d objects, %d -> %d total objects",
            result["objects_freed"],
            before_objects,
            after_objects,
        )

        return result

    @staticmethod
    def memory_efficient_chunking(
        data: List[T], chunk_size: int = 1000
    ) -> Generator[List[T], None, None]:
        """Process data in memory-efficient chunks.

        Args:
            data: Data to process
            chunk_size: Size of each chunk

        Yields:
            Chunks of data
        """
        for i in range(0, len(data), chunk_size):
            chunk = data[i : i + chunk_size]
            yield chunk

            # Force garbage collection after each chunk
            if i % (chunk_size * 10) == 0:
                gc.collect()

    @staticmethod
    @contextmanager
    def memory_limit_context(limit_mb: float) -> Generator[None, None, None]:
        """Context manager to monitor memory usage and warn if exceeded.

        Args:
            limit_mb: Memory limit in megabytes
        """
        process = psutil.Process(os.getpid())
        start_memory = process.memory_info().rss / 1024 / 1024

        try:
            yield
        finally:
            end_memory = process.memory_info().rss / 1024 / 1024
            memory_used = end_memory - start_memory

            if memory_used > limit_mb:
                logger.warning(
                    "Memory usage exceeded limit: %.1f MB used (limit: %.1f MB)",
                    memory_used,
                    limit_mb,
                )
            else:
                logger.debug("Memory usage within limit: %.1f MB used", memory_used)


class ResourceManager:
    """Automatic resource cleanup and management."""

    def __init__(self):
        self._cleanup_handlers: List[Callable[[], None]] = []
        self._periodic_tasks: List[Tuple[Callable[[], None], float]] = []
        self._running = False
        self._cleanup_thread: Optional[threading.Thread] = None

    def register_cleanup(self, handler: Callable[[], None]) -> None:
        """Register cleanup handler.

        Args:
            handler: Function to call for cleanup
        """
        self._cleanup_handlers.append(handler)

    def register_periodic_task(self, task: Callable[[], None], interval: float) -> None:
        """Register periodic cleanup task.

        Args:
            task: Task to execute periodically
            interval: Interval in seconds
        """
        self._periodic_tasks.append((task, interval))

    def start(self) -> None:
        """Start resource management."""
        if self._running:
            return

        self._running = True
        self._cleanup_thread = threading.Thread(target=self._cleanup_loop, daemon=True)
        self._cleanup_thread.start()
        logger.info("Resource manager started")

    def stop(self) -> None:
        """Stop resource management and run cleanup."""
        self._running = False
        if self._cleanup_thread:
            self._cleanup_thread.join(timeout=5.0)

        self.cleanup_now()
        logger.info("Resource manager stopped")

    def cleanup_now(self) -> None:
        """Execute all cleanup handlers immediately."""
        for handler in self._cleanup_handlers:
            try:
                handler()
            except Exception as e:
                logger.error("Error in cleanup handler: %s", e)

    def _cleanup_loop(self) -> None:
        """Main cleanup loop for periodic tasks."""
        last_run_times = {i: 0.0 for i in range(len(self._periodic_tasks))}

        while self._running:
            current_time = time.time()

            for i, (task, interval) in enumerate(self._periodic_tasks):
                if current_time - last_run_times[i] >= interval:
                    try:
                        task()
                        last_run_times[i] = current_time
                    except Exception as e:
                        logger.error("Error in periodic task: %s", e)

            time.sleep(1.0)  # Check every second


# Global instances
_memory_monitor: Optional[MemoryMonitor] = None
_resource_manager: Optional[ResourceManager] = None
_leak_detector: Optional[MemoryLeakDetector] = None


def get_memory_monitor() -> MemoryMonitor:
    """Get global memory monitor instance."""
    global _memory_monitor
    if _memory_monitor is None:
        _memory_monitor = MemoryMonitor()
    return _memory_monitor


def get_resource_manager() -> ResourceManager:
    """Get global resource manager instance."""
    global _resource_manager
    if _resource_manager is None:
        _resource_manager = ResourceManager()
    return _resource_manager


def get_leak_detector() -> MemoryLeakDetector:
    """Get global leak detector instance."""
    global _leak_detector
    if _leak_detector is None:
        _leak_detector = MemoryLeakDetector()
    return _leak_detector


def setup_memory_optimization() -> None:
    """Set up memory optimization for ActivityWatch."""
    # Start memory monitoring
    monitor = get_memory_monitor()
    monitor.register_callback(
        "warning",
        lambda stats: logger.warning(
            "Memory usage high: %.1f%% (%.1f MB)", stats.percent, stats.rss_mb
        ),
    )
    monitor.register_callback(
        "critical",
        lambda stats: logger.critical(
            "Memory usage critical: %.1f%% (%.1f MB)", stats.percent, stats.rss_mb
        ),
    )
    monitor.start_monitoring()

    # Start resource management
    resource_manager = get_resource_manager()
    resource_manager.register_periodic_task(
        lambda: gc.collect(), 60.0
    )  # GC every minute
    resource_manager.start()

    # Optimize GC settings
    MemoryOptimizer.optimize_gc()

    logger.info("Memory optimization setup completed")


def memory_profile(func: Callable[..., T]) -> Callable[..., T]:
    """Decorator to profile memory usage of a function.

    Args:
        func: Function to profile

    Returns:
        Decorated function with memory profiling
    """

    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        process = psutil.Process(os.getpid())
        start_memory = process.memory_info().rss / 1024 / 1024
        start_time = time.time()

        try:
            result = func(*args, **kwargs)
            return result
        finally:
            end_memory = process.memory_info().rss / 1024 / 1024
            end_time = time.time()
            memory_delta = end_memory - start_memory
            time_delta = end_time - start_time

            logger.info(
                "Memory profile %s: %.1f MB delta, %.3fs execution time",
                func.__name__,
                memory_delta,
                time_delta,
            )

    return wrapper
