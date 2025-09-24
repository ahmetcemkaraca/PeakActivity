"""ActivityWatch performance profiling and monitoring utilities.

This module provides comprehensive performance profiling tools for ActivityWatch
components including execution time profiling, query performance analysis,
and system resource monitoring.

Key Features:
- Function execution time profiling
- Database query performance analysis  
- System resource usage monitoring
- Performance regression detection
- Automated performance reporting
- Bottleneck identification
"""

import cProfile
import functools
import io
import logging
import pstats
import time
import threading
from contextlib import contextmanager
from dataclasses import dataclass, field
from typing import Any, Callable, Dict, List, Optional, TypeVar
from collections import defaultdict, deque
import sys

try:
    import psutil
    PSUTIL_AVAILABLE = True
except ImportError:
    PSUTIL_AVAILABLE = False

try:
    # Try to import pyinstrument for better profiling
    from pyinstrument import Profiler as PyInstrumentProfiler
    PYINSTRUMENT_AVAILABLE = True
except ImportError:
    PYINSTRUMENT_AVAILABLE = False

logger = logging.getLogger(__name__)

F = TypeVar('F', bound=Callable[..., Any])


@dataclass
class PerformanceMetrics:
    """Performance metrics for a function or operation."""
    name: str
    total_time: float = 0.0
    call_count: int = 0
    avg_time: float = 0.0
    min_time: float = float('inf')
    max_time: float = 0.0
    last_call_time: float = 0.0
    errors: int = 0
    
    def update(self, execution_time: float, error: bool = False) -> None:
        """Update metrics with new execution time."""
        self.total_time += execution_time
        self.call_count += 1
        self.avg_time = self.total_time / self.call_count
        self.min_time = min(self.min_time, execution_time)
        self.max_time = max(self.max_time, execution_time)
        self.last_call_time = execution_time
        
        if error:
            self.errors += 1


@dataclass
class SystemMetrics:
    """System resource usage metrics."""
    cpu_percent: float = 0.0
    memory_percent: float = 0.0
    memory_rss_mb: float = 0.0
    disk_io_read_mb: float = 0.0
    disk_io_write_mb: float = 0.0
    network_sent_mb: float = 0.0
    network_recv_mb: float = 0.0
    timestamp: float = field(default_factory=time.time)


class PerformanceProfiler:
    """Comprehensive performance profiler for ActivityWatch components."""
    
    def __init__(self, max_history: int = 1000):
        """Initialize performance profiler.
        
        Args:
            max_history: Maximum number of metrics to keep in history
        """
        self.max_history = max_history
        self._metrics: Dict[str, PerformanceMetrics] = {}
        self._history: Dict[str, deque] = defaultdict(lambda: deque(maxlen=max_history))
        self._system_metrics: deque = deque(maxlen=max_history)
        self._lock = threading.RLock()
        self._profiling_enabled = True
        
        # System monitoring
        self._system_monitor_thread: Optional[threading.Thread] = None
        self._monitoring_system = False
    
    def enable_profiling(self, enabled: bool = True) -> None:
        """Enable or disable profiling.
        
        Args:
            enabled: Whether to enable profiling
        """
        self._profiling_enabled = enabled
        logger.info("Performance profiling %s", "enabled" if enabled else "disabled")
    
    def profile_function(self, name: Optional[str] = None, include_args: bool = False):
        """Decorator to profile function execution time.
        
        Args:
            name: Custom name for the function (defaults to function name)
            include_args: Whether to include function arguments in metrics
            
        Returns:
            Decorated function with profiling
        """
        def decorator(func: F) -> F:
            profile_name = name or func.__name__
            
            @functools.wraps(func)
            def wrapper(*args, **kwargs):
                if not self._profiling_enabled:
                    return func(*args, **kwargs)
                
                start_time = time.perf_counter()
                error_occurred = False
                
                try:
                    result = func(*args, **kwargs)
                    return result
                except Exception as e:
                    error_occurred = True
                    raise
                finally:
                    end_time = time.perf_counter()
                    execution_time = end_time - start_time
                    
                    # Generate unique name if including args
                    metric_name = profile_name
                    if include_args and args:
                        arg_signature = f"_args{len(args)}"
                        metric_name = f"{profile_name}{arg_signature}"
                    
                    self._update_metrics(metric_name, execution_time, error_occurred)
            
            return wrapper  # type: ignore
        return decorator
    
    def profile_database_query(self, query_type: str = "query"):
        """Decorator specifically for database query profiling.
        
        Args:
            query_type: Type of database query (select, insert, update, delete)
            
        Returns:
            Decorated function with database query profiling
        """
        def decorator(func: F) -> F:
            @functools.wraps(func)
            def wrapper(*args, **kwargs):
                if not self._profiling_enabled:
                    return func(*args, **kwargs)
                
                start_time = time.perf_counter()
                error_occurred = False
                result_count = 0
                
                try:
                    result = func(*args, **kwargs)
                    
                    # Try to determine result count
                    if hasattr(result, '__len__'):
                        result_count = len(result)
                    elif hasattr(result, 'rowcount'):
                        result_count = result.rowcount
                    
                    return result
                except Exception as e:
                    error_occurred = True
                    raise
                finally:
                    end_time = time.perf_counter()
                    execution_time = end_time - start_time
                    
                    metric_name = f"db_{query_type}_{func.__name__}"
                    self._update_metrics(metric_name, execution_time, error_occurred)
                    
                    # Log slow queries
                    if execution_time > 1.0:  # Log queries taking more than 1 second
                        logger.warning(
                            "Slow database query: %s took %.3fs (result count: %d)",
                            metric_name, execution_time, result_count
                        )
            
            return wrapper  # type: ignore
        return decorator
    
    @contextmanager
    def profile_block(self, name: str):
        """Context manager for profiling code blocks.
        
        Args:
            name: Name for the profiled block
        """
        if not self._profiling_enabled:
            yield
            return
        
        start_time = time.perf_counter()
        error_occurred = False
        
        try:
            yield
        except Exception:
            error_occurred = True
            raise
        finally:
            end_time = time.perf_counter()
            execution_time = end_time - start_time
            self._update_metrics(name, execution_time, error_occurred)
    
    def start_system_monitoring(self, interval: float = 30.0) -> None:
        """Start system resource monitoring.
        
        Args:
            interval: Monitoring interval in seconds
        """
        if not PSUTIL_AVAILABLE:
            logger.warning("psutil not available, system monitoring disabled")
            return
        
        if self._monitoring_system:
            logger.warning("System monitoring already started")
            return
        
        self._monitoring_system = True
        self._system_monitor_thread = threading.Thread(
            target=self._system_monitor_loop,
            args=(interval,),
            daemon=True
        )
        self._system_monitor_thread.start()
        logger.info("System monitoring started (interval: %.1fs)", interval)
    
    def stop_system_monitoring(self) -> None:
        """Stop system resource monitoring."""
        self._monitoring_system = False
        if self._system_monitor_thread:
            self._system_monitor_thread.join(timeout=5.0)
        logger.info("System monitoring stopped")
    
    def get_metrics(self, name: Optional[str] = None) -> Dict[str, PerformanceMetrics]:
        """Get performance metrics.
        
        Args:
            name: Specific metric name to get (None for all metrics)
            
        Returns:
            Dictionary of performance metrics
        """
        with self._lock:
            if name:
                return {name: self._metrics.get(name, PerformanceMetrics(name))}
            return self._metrics.copy()
    
    def get_top_slowest(self, count: int = 10) -> List[PerformanceMetrics]:
        """Get top slowest operations by average time.
        
        Args:
            count: Number of top operations to return
            
        Returns:
            List of slowest operations
        """
        with self._lock:
            sorted_metrics = sorted(
                self._metrics.values(),
                key=lambda m: m.avg_time,
                reverse=True
            )
            return sorted_metrics[:count]
    
    def get_most_called(self, count: int = 10) -> List[PerformanceMetrics]:
        """Get most frequently called operations.
        
        Args:
            count: Number of top operations to return
            
        Returns:
            List of most called operations
        """
        with self._lock:
            sorted_metrics = sorted(
                self._metrics.values(),
                key=lambda m: m.call_count,
                reverse=True
            )
            return sorted_metrics[:count]
    
    def get_system_metrics(self) -> List[SystemMetrics]:
        """Get system resource metrics history.
        
        Returns:
            List of system metrics over time
        """
        with self._lock:
            return list(self._system_metrics)
    
    def generate_report(self, include_system: bool = True) -> str:
        """Generate comprehensive performance report.
        
        Args:
            include_system: Whether to include system metrics
            
        Returns:
            Formatted performance report
        """
        from ..utils.string_utils import ReportBuilder
        
        report = ReportBuilder()
        report.add_header("ActivityWatch Performance Report")
        
        # Function performance metrics
        report.add_header("Function Performance", 2)
        
        slowest = self.get_top_slowest(10)
        if slowest:
            report.add_header("Slowest Operations (by average time)", 3)
            for metric in slowest:
                report.add_bullet(
                    f"{metric.name}: avg {metric.avg_time:.3f}s "
                    f"(calls: {metric.call_count}, total: {metric.total_time:.3f}s)"
                )
        
        most_called = self.get_most_called(10)
        if most_called:
            report.add_header("Most Called Operations", 3)
            for metric in most_called:
                report.add_bullet(
                    f"{metric.name}: {metric.call_count} calls "
                    f"(avg: {metric.avg_time:.3f}s, total: {metric.total_time:.3f}s)"
                )
        
        # System metrics
        if include_system and PSUTIL_AVAILABLE:
            system_metrics = self.get_system_metrics()
            if system_metrics:
                report.add_header("System Resource Usage", 2)
                
                latest = system_metrics[-1]
                report.add_bullet(f"CPU Usage: {latest.cpu_percent:.1f}%")
                report.add_bullet(f"Memory Usage: {latest.memory_percent:.1f}% ({latest.memory_rss_mb:.1f} MB)")
                report.add_bullet(f"Disk I/O: {latest.disk_io_read_mb:.1f} MB read, {latest.disk_io_write_mb:.1f} MB write")
                
                if len(system_metrics) > 1:
                    avg_cpu = sum(m.cpu_percent for m in system_metrics) / len(system_metrics)
                    avg_memory = sum(m.memory_percent for m in system_metrics) / len(system_metrics)
                    report.add_line()
                    report.add_bullet(f"Average CPU: {avg_cpu:.1f}%")
                    report.add_bullet(f"Average Memory: {avg_memory:.1f}%")
        
        return report.build()
    
    def clear_metrics(self) -> None:
        """Clear all performance metrics."""
        with self._lock:
            self._metrics.clear()
            self._history.clear()
            self._system_metrics.clear()
        logger.info("Performance metrics cleared")
    
    def _update_metrics(self, name: str, execution_time: float, error: bool = False) -> None:
        """Update metrics for a named operation."""
        with self._lock:
            if name not in self._metrics:
                self._metrics[name] = PerformanceMetrics(name)
            
            self._metrics[name].update(execution_time, error)
            
            # Add to history
            self._history[name].append({
                'time': time.time(),
                'execution_time': execution_time,
                'error': error
            })
    
    def _system_monitor_loop(self, interval: float) -> None:
        """System monitoring loop."""
        import psutil
        process = psutil.Process()
        
        # Initial readings for delta calculations
        last_disk_io = process.io_counters() if hasattr(process, 'io_counters') else None
        last_net_io = psutil.net_io_counters()
        
        while self._monitoring_system:
            try:
                # CPU and memory
                cpu_percent = process.cpu_percent()
                memory_info = process.memory_info()
                system_memory = psutil.virtual_memory()
                
                # Disk I/O
                disk_read_mb = disk_write_mb = 0.0
                if hasattr(process, 'io_counters'):
                    current_disk_io = process.io_counters()
                    if last_disk_io:
                        disk_read_mb = (current_disk_io.read_bytes - last_disk_io.read_bytes) / 1024 / 1024
                        disk_write_mb = (current_disk_io.write_bytes - last_disk_io.write_bytes) / 1024 / 1024
                    last_disk_io = current_disk_io
                
                # Network I/O
                net_sent_mb = net_recv_mb = 0.0
                current_net_io = psutil.net_io_counters()
                if last_net_io:
                    net_sent_mb = (current_net_io.bytes_sent - last_net_io.bytes_sent) / 1024 / 1024
                    net_recv_mb = (current_net_io.bytes_recv - last_net_io.bytes_recv) / 1024 / 1024
                last_net_io = current_net_io
                
                metrics = SystemMetrics(
                    cpu_percent=cpu_percent,
                    memory_percent=system_memory.percent,
                    memory_rss_mb=memory_info.rss / 1024 / 1024,
                    disk_io_read_mb=disk_read_mb,
                    disk_io_write_mb=disk_write_mb,
                    network_sent_mb=net_sent_mb,
                    network_recv_mb=net_recv_mb
                )
                
                with self._lock:
                    self._system_metrics.append(metrics)
                
                time.sleep(interval)
            except Exception as e:
                logger.error("Error in system monitoring: %s", e)
                time.sleep(interval)


class CodeProfiler:
    """Advanced code profiling using cProfile and pyinstrument."""
    
    def __init__(self):
        self._profilers: Dict[str, Any] = {}
    
    def start_profile(self, name: str, use_pyinstrument: bool = True) -> None:
        """Start profiling session.
        
        Args:
            name: Profile session name
            use_pyinstrument: Whether to use pyinstrument (if available)
        """
        if use_pyinstrument and PYINSTRUMENT_AVAILABLE:
            profiler = PyInstrumentProfiler()
            profiler.start()
            self._profilers[name] = ('pyinstrument', profiler)
            logger.info("Started pyinstrument profiling session: %s", name)
        else:
            profiler = cProfile.Profile()
            profiler.enable()
            self._profilers[name] = ('cprofile', profiler)
            logger.info("Started cProfile profiling session: %s", name)
    
    def stop_profile(self, name: str) -> str:
        """Stop profiling session and get results.
        
        Args:
            name: Profile session name
            
        Returns:
            Formatted profile results
        """
        if name not in self._profilers:
            return f"No profiling session named '{name}'"
        
        profiler_type, profiler = self._profilers.pop(name)
        
        if profiler_type == 'pyinstrument':
            profiler.stop()
            return profiler.output_text(unicode=True, color=False)
        else:  # cprofile
            profiler.disable()
            
            # Format cProfile results
            stream = io.StringIO()
            stats = pstats.Stats(profiler, stream=stream)
            stats.sort_stats('cumulative')
            stats.print_stats(20)  # Top 20 functions
            
            return stream.getvalue()
    
    @contextmanager
    def profile_context(self, name: str, use_pyinstrument: bool = True):
        """Context manager for profiling code blocks.
        
        Args:
            name: Profile session name
            use_pyinstrument: Whether to use pyinstrument
        """
        self.start_profile(name, use_pyinstrument)
        try:
            yield
        finally:
            result = self.stop_profile(name)
            logger.info("Profile results for %s:\n%s", name, result)


# Global profiler instance
_performance_profiler: Optional[PerformanceProfiler] = None
_code_profiler: Optional[CodeProfiler] = None


def get_performance_profiler() -> PerformanceProfiler:
    """Get global performance profiler instance."""
    global _performance_profiler
    if _performance_profiler is None:
        _performance_profiler = PerformanceProfiler()
    return _performance_profiler


def get_code_profiler() -> CodeProfiler:
    """Get global code profiler instance."""
    global _code_profiler
    if _code_profiler is None:
        _code_profiler = CodeProfiler()
    return _code_profiler


# Convenience decorators
def profile_execution(name: Optional[str] = None, include_args: bool = False):
    """Convenience decorator for function profiling."""
    return get_performance_profiler().profile_function(name, include_args)


def profile_database(query_type: str = "query"):
    """Convenience decorator for database query profiling.""" 
    return get_performance_profiler().profile_database_query(query_type)


def setup_performance_monitoring() -> None:
    """Set up performance monitoring for ActivityWatch."""
    profiler = get_performance_profiler()
    profiler.enable_profiling(True)
    profiler.start_system_monitoring()
    
    logger.info("Performance monitoring setup completed")


def benchmark_function(func: Callable, *args, iterations: int = 100, **kwargs) -> Dict[str, float]:
    """Benchmark function execution time.
    
    Args:
        func: Function to benchmark
        *args: Function arguments
        iterations: Number of iterations to run
        **kwargs: Function keyword arguments
        
    Returns:
        Benchmark results
    """
    times = []
    
    for _ in range(iterations):
        start_time = time.perf_counter()
        try:
            func(*args, **kwargs)
        except Exception as e:
            logger.error("Benchmark iteration failed: %s", e)
            continue
        end_time = time.perf_counter()
        times.append(end_time - start_time)
    
    if not times:
        return {'error': 'All benchmark iterations failed'}
    
    total_time = sum(times)
    avg_time = total_time / len(times)
    min_time = min(times)
    max_time = max(times)
    
    return {
        'iterations': len(times),
        'total_time': total_time,
        'avg_time': avg_time,
        'min_time': min_time,
        'max_time': max_time,
        'times': times
    }
