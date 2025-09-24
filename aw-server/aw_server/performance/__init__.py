"""ActivityWatch performance optimization package.

This package provides comprehensive performance optimization tools for ActivityWatch
including caching, memory management, and profiling utilities.

Key Components:
- cache_manager: Centralized caching for queries, events, and computations
- memory_manager: Memory usage monitoring and optimization
- profiler: Function execution profiling and system monitoring

Usage:
    from aw_server.performance import (
        get_cache_manager,
        get_performance_profiler,
        setup_performance_monitoring
    )
    
    # Set up performance optimization
    setup_performance_monitoring()
    
    # Use caching decorator
    @cached_query(ttl=300)
    def expensive_query():
        return process_data()
    
    # Use profiling decorator  
    @profile_execution
    def critical_function():
        return compute_result()
"""

from .cache_manager import (
    CacheManager,
    get_cache_manager,
    cached_query,
    cached_computation,
    clear_global_cache,
    batch_process_with_cache,
)

from .memory_manager import (
    MemoryMonitor,
    MemoryOptimizer,
    ObjectPool,
    MemoryLeakDetector,
    get_memory_monitor,
    get_resource_manager,
    get_leak_detector,
    setup_memory_optimization,
    memory_profile,
)

from .profiler import (
    PerformanceProfiler,
    CodeProfiler,
    get_performance_profiler,
    get_code_profiler,
    profile_execution,
    profile_database,
    setup_performance_monitoring,
    benchmark_function,
)

__all__ = [
    # Cache manager
    'CacheManager',
    'get_cache_manager', 
    'cached_query',
    'cached_computation',
    'clear_global_cache',
    'batch_process_with_cache',
    
    # Memory manager
    'MemoryMonitor',
    'MemoryOptimizer',
    'ObjectPool',
    'MemoryLeakDetector',
    'get_memory_monitor',
    'get_resource_manager',
    'get_leak_detector',
    'setup_memory_optimization',
    'memory_profile',
    
    # Profiler
    'PerformanceProfiler',
    'CodeProfiler',
    'get_performance_profiler',
    'get_code_profiler',
    'profile_execution', 
    'profile_database',
    'setup_performance_monitoring',
    'benchmark_function',
]


def setup_all_performance_optimizations() -> None:
    """Set up all performance optimizations for ActivityWatch.
    
    This convenience function enables:
    - Memory monitoring and optimization
    - Performance profiling and monitoring
    - Cache management
    """
    setup_memory_optimization()
    setup_performance_monitoring()
    
    import logging
    logger = logging.getLogger(__name__)
    logger.info("All ActivityWatch performance optimizations enabled")
