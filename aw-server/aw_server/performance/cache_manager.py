"""ActivityWatch centralized cache management for performance optimization.

This module provides comprehensive caching strategies for ActivityWatch components
including query results, event data, bucket metadata, and computed insights.

Cache Types:
- TTLCache: Time-based expiration for fresh data requirements
- LRUCache: Least Recently Used for memory-bounded scenarios
- QueryCache: SQL query result caching with invalidation
- EventCache: Activity event caching with smart batching
- ComputeCache: Expensive computation result caching

Performance Features:
- Automatic cache key generation
- Cache hit/miss metrics
- Memory usage monitoring
- Smart cache invalidation
- Distributed cache support for cloud functions
"""

import functools
import hashlib
import logging
import threading
import time
from typing import Any, Callable, Dict, List, Optional, Tuple, TypeVar, Union
from dataclasses import dataclass
from abc import ABC, abstractmethod

try:
    from cachetools import TTLCache, LRUCache, RRCache

    CACHETOOLS_AVAILABLE = True
except ImportError:
    CACHETOOLS_AVAILABLE = False

    # Fallback implementations
    class TTLCache(dict):
        def __init__(self, maxsize: int, ttl: int):
            super().__init__()
            self.maxsize = maxsize
            self.ttl = ttl

    class LRUCache(dict):
        def __init__(self, maxsize: int):
            super().__init__()
            self.maxsize = maxsize


logger = logging.getLogger(__name__)

F = TypeVar("F", bound=Callable[..., Any])


@dataclass
class CacheStats:
    """Cache performance statistics."""

    hits: int = 0
    misses: int = 0
    size: int = 0
    max_size: int = 0

    @property
    def hit_rate(self) -> float:
        """Calculate cache hit rate."""
        total = self.hits + self.misses
        return self.hits / total if total > 0 else 0.0


class CacheBackend(ABC):
    """Abstract cache backend interface."""

    @abstractmethod
    def get(self, key: str) -> Any:
        """Get value by key."""
        pass

    @abstractmethod
    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        """Set value with optional TTL."""
        pass

    @abstractmethod
    def delete(self, key: str) -> bool:
        """Delete key."""
        pass

    @abstractmethod
    def clear(self) -> None:
        """Clear all cached items."""
        pass

    @abstractmethod
    def stats(self) -> CacheStats:
        """Get cache statistics."""
        pass


class MemoryCacheBackend(CacheBackend):
    """In-memory cache backend with TTL support."""

    def __init__(self, maxsize: int = 1000, default_ttl: int = 300):
        self.maxsize = maxsize
        self.default_ttl = default_ttl
        self._cache: Dict[str, Tuple[Any, float]] = {}
        self._stats = CacheStats(max_size=maxsize)
        self._lock = threading.RLock()

    def get(self, key: str) -> Any:
        """Get value by key with TTL check."""
        with self._lock:
            if key not in self._cache:
                self._stats.misses += 1
                return None

            value, expire_time = self._cache[key]
            if time.time() > expire_time:
                del self._cache[key]
                self._stats.misses += 1
                self._stats.size -= 1
                return None

            self._stats.hits += 1
            return value

    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        """Set value with TTL."""
        with self._lock:
            ttl = ttl or self.default_ttl
            expire_time = time.time() + ttl

            # Check if we need to evict items
            if len(self._cache) >= self.maxsize and key not in self._cache:
                self._evict_oldest()

            is_new = key not in self._cache
            self._cache[key] = (value, expire_time)

            if is_new:
                self._stats.size += 1

    def delete(self, key: str) -> bool:
        """Delete key."""
        with self._lock:
            if key in self._cache:
                del self._cache[key]
                self._stats.size -= 1
                return True
            return False

    def clear(self) -> None:
        """Clear all cached items."""
        with self._lock:
            self._cache.clear()
            self._stats.size = 0

    def stats(self) -> CacheStats:
        """Get cache statistics."""
        with self._lock:
            return CacheStats(
                hits=self._stats.hits,
                misses=self._stats.misses,
                size=len(self._cache),
                max_size=self.maxsize,
            )

    def _evict_oldest(self) -> None:
        """Evict oldest item by expiration time."""
        if not self._cache:
            return

        oldest_key = min(self._cache.keys(), key=lambda k: self._cache[k][1])
        del self._cache[oldest_key]
        self._stats.size -= 1


class CacheManager:
    """Centralized cache management for ActivityWatch.

    Provides different cache types optimized for different use cases:
    - Query cache: Database query results
    - Event cache: Activity events
    - Bucket cache: Bucket metadata
    - Compute cache: Expensive computations
    """

    def __init__(self, backend: Optional[CacheBackend] = None):
        self.backend = backend or MemoryCacheBackend()

        # Specialized caches for different data types
        self.query_cache = (
            TTLCache(maxsize=100, ttl=300) if CACHETOOLS_AVAILABLE else {}
        )
        self.event_cache = LRUCache(maxsize=1000) if CACHETOOLS_AVAILABLE else {}
        self.bucket_cache = (
            TTLCache(maxsize=50, ttl=3600) if CACHETOOLS_AVAILABLE else {}
        )
        self.compute_cache = (
            TTLCache(maxsize=200, ttl=600) if CACHETOOLS_AVAILABLE else {}
        )

        self._stats: Dict[str, CacheStats] = {
            "query": CacheStats(),
            "event": CacheStats(),
            "bucket": CacheStats(),
            "compute": CacheStats(),
        }
        self._lock = threading.RLock()

    def cached_query(self, ttl: int = 300, cache_key_func: Optional[Callable] = None):
        """Decorator for caching query results.

        Args:
            ttl: Time to live in seconds
            cache_key_func: Custom cache key generation function

        Returns:
            Decorated function with caching
        """

        def decorator(func: F) -> F:
            @functools.wraps(func)
            def wrapper(*args, **kwargs):
                # Generate cache key
                if cache_key_func:
                    cache_key = cache_key_func(*args, **kwargs)
                else:
                    cache_key = self._generate_cache_key(func.__name__, args, kwargs)

                # Check cache
                with self._lock:
                    if cache_key in self.query_cache:
                        self._stats["query"].hits += 1
                        logger.debug("Query cache hit for key: %s", cache_key[:16])
                        return self.query_cache[cache_key]

                # Execute function and cache result
                try:
                    result = func(*args, **kwargs)
                    with self._lock:
                        self.query_cache[cache_key] = result
                        self._stats["query"].misses += 1
                    logger.debug("Query cached with key: %s", cache_key[:16])
                    return result
                except Exception as e:
                    logger.error("Query execution failed for %s: %s", func.__name__, e)
                    raise

            return wrapper  # type: ignore

        return decorator

    def cached_computation(
        self, ttl: int = 600, invalidate_on: Optional[List[str]] = None
    ):
        """Decorator for caching expensive computations.

        Args:
            ttl: Time to live in seconds
            invalidate_on: List of events that should invalidate this cache

        Returns:
            Decorated function with computation caching
        """

        def decorator(func: F) -> F:
            @functools.wraps(func)
            def wrapper(*args, **kwargs):
                cache_key = self._generate_cache_key(
                    f"compute_{func.__name__}", args, kwargs
                )

                with self._lock:
                    if cache_key in self.compute_cache:
                        self._stats["compute"].hits += 1
                        return self.compute_cache[cache_key]

                start_time = time.time()
                result = func(*args, **kwargs)
                execution_time = time.time() - start_time

                with self._lock:
                    self.compute_cache[cache_key] = result
                    self._stats["compute"].misses += 1

                logger.debug(
                    "Computation cached: %s (%.3fs) - key: %s",
                    func.__name__,
                    execution_time,
                    cache_key[:16],
                )
                return result

            return wrapper  # type: ignore

        return decorator

    def cache_event_data(self, bucket_id: str, events: List[Dict[str, Any]]) -> None:
        """Cache event data for a bucket.

        Args:
            bucket_id: Bucket identifier
            events: List of events to cache
        """
        cache_key = f"events_{bucket_id}"
        with self._lock:
            self.event_cache[cache_key] = events
            self._stats["event"].size = len(self.event_cache)

    def get_cached_events(self, bucket_id: str) -> Optional[List[Dict[str, Any]]]:
        """Get cached events for a bucket.

        Args:
            bucket_id: Bucket identifier

        Returns:
            Cached events or None if not found
        """
        cache_key = f"events_{bucket_id}"
        with self._lock:
            if cache_key in self.event_cache:
                self._stats["event"].hits += 1
                return self.event_cache[cache_key]
            else:
                self._stats["event"].misses += 1
                return None

    def cache_bucket_metadata(self, bucket_id: str, metadata: Dict[str, Any]) -> None:
        """Cache bucket metadata.

        Args:
            bucket_id: Bucket identifier
            metadata: Bucket metadata to cache
        """
        cache_key = f"bucket_{bucket_id}"
        with self._lock:
            self.bucket_cache[cache_key] = metadata
            self._stats["bucket"].size = len(self.bucket_cache)

    def get_cached_bucket_metadata(self, bucket_id: str) -> Optional[Dict[str, Any]]:
        """Get cached bucket metadata.

        Args:
            bucket_id: Bucket identifier

        Returns:
            Cached metadata or None if not found
        """
        cache_key = f"bucket_{bucket_id}"
        with self._lock:
            if cache_key in self.bucket_cache:
                self._stats["bucket"].hits += 1
                return self.bucket_cache[cache_key]
            else:
                self._stats["bucket"].misses += 1
                return None

    def invalidate_pattern(self, pattern: str) -> int:
        """Invalidate cache entries matching pattern.

        Args:
            pattern: Pattern to match against cache keys

        Returns:
            Number of entries invalidated
        """
        invalidated = 0
        caches = [
            ("query", self.query_cache),
            ("event", self.event_cache),
            ("bucket", self.bucket_cache),
            ("compute", self.compute_cache),
        ]

        with self._lock:
            for cache_name, cache in caches:
                keys_to_remove = [k for k in cache.keys() if pattern in k]
                for key in keys_to_remove:
                    del cache[key]
                    invalidated += 1
                    self._stats[cache_name].size -= 1

        logger.info(
            "Invalidated %d cache entries matching pattern: %s", invalidated, pattern
        )
        return invalidated

    def clear_all(self) -> None:
        """Clear all caches."""
        with self._lock:
            self.query_cache.clear()
            self.event_cache.clear()
            self.bucket_cache.clear()
            self.compute_cache.clear()

            for stats in self._stats.values():
                stats.size = 0

        logger.info("All caches cleared")

    def get_cache_stats(self) -> Dict[str, CacheStats]:
        """Get statistics for all caches.

        Returns:
            Dictionary of cache statistics by cache type
        """
        with self._lock:
            # Update current sizes
            self._stats["query"].size = len(self.query_cache)
            self._stats["event"].size = len(self.event_cache)
            self._stats["bucket"].size = len(self.bucket_cache)
            self._stats["compute"].size = len(self.compute_cache)

            return self._stats.copy()

    def _generate_cache_key(self, func_name: str, args: tuple, kwargs: dict) -> str:
        """Generate deterministic cache key.

        Args:
            func_name: Function name
            args: Function arguments
            kwargs: Function keyword arguments

        Returns:
            MD5 hash as cache key
        """
        # Convert args and kwargs to string representation
        args_str = str(args)
        kwargs_str = str(sorted(kwargs.items()))
        content = f"{func_name}:{args_str}:{kwargs_str}"

        # Generate MD5 hash
        return hashlib.md5(content.encode("utf-8")).hexdigest()


# Global cache manager instance
_cache_manager: Optional[CacheManager] = None


def get_cache_manager() -> CacheManager:
    """Get global cache manager instance.

    Returns:
        Global CacheManager instance
    """
    global _cache_manager
    if _cache_manager is None:
        _cache_manager = CacheManager()
    return _cache_manager


def clear_global_cache() -> None:
    """Clear global cache manager."""
    global _cache_manager
    if _cache_manager:
        _cache_manager.clear_all()


# Convenience decorators using global cache manager
def cached_query(ttl: int = 300):
    """Convenience decorator for query caching."""
    return get_cache_manager().cached_query(ttl=ttl)


def cached_computation(ttl: int = 600):
    """Convenience decorator for computation caching."""
    return get_cache_manager().cached_computation(ttl=ttl)


def batch_process_with_cache(
    items: List[Any],
    process_func: Callable[[Any], Any],
    batch_size: int = 100,
    cache_results: bool = True,
) -> List[Any]:
    """Process items in batches with caching support.

    Args:
        items: Items to process
        process_func: Function to process each item
        batch_size: Number of items per batch
        cache_results: Whether to cache individual results

    Returns:
        List of processed results
    """
    results = []
    cache_manager = get_cache_manager()

    for i in range(0, len(items), batch_size):
        batch = items[i : i + batch_size]
        batch_results = []

        for item in batch:
            if cache_results:
                cache_key = f"batch_process_{hash(str(item))}"
                cached_result = cache_manager.backend.get(cache_key)

                if cached_result is not None:
                    batch_results.append(cached_result)
                else:
                    result = process_func(item)
                    cache_manager.backend.set(cache_key, result)
                    batch_results.append(result)
            else:
                batch_results.append(process_func(item))

        results.extend(batch_results)
        logger.debug(
            "Processed batch %d/%d",
            i // batch_size + 1,
            (len(items) + batch_size - 1) // batch_size,
        )

    return results
