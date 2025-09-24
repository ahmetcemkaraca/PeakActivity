from abc import ABCMeta, abstractmethod
from datetime import datetime
from typing import Dict, List, Optional

from aw_core.models import Event


class AbstractStorage(metaclass=ABCMeta):
    """Abstract base class defining the storage interface for ActivityWatch data.
    
    This interface defines the contract that all storage backends must implement
    to provide data persistence for ActivityWatch. Storage backends can include
    database systems, file-based storage, in-memory storage, or cloud services.
    
    Key concepts:
    - Buckets: Named containers for events, typically representing different data sources
    - Events: Individual data points with timestamps and associated metadata
    - Thread safety: Implementations should be thread-safe for concurrent access
    - Testing mode: Separate data spaces for production and testing environments
    
    Implementation guidelines:
    - All methods should handle bucket_id validation and raise appropriate exceptions
    - Event timestamps should be normalized to UTC
    - Bulk operations should be atomic where possible
    - Resource cleanup should be handled properly in destructors
    """

    sid = "Storage id not set, fix me"

    @abstractmethod
    def __init__(self, testing: bool) -> None:
        """Initialize the storage backend.
        
        Args:
            testing: If True, use a separate testing namespace to avoid
                    contaminating production data. This typically means
                    using different database names, table prefixes, or
                    file paths.
                    
        Implementation notes:
        - Set self.testing = testing for consistent behavior
        - Initialize connection pools, create necessary directories/tables
        - Validate configuration and credentials
        - Raise appropriate exceptions for initialization failures
        """
        self.testing = True
        raise NotImplementedError

    @abstractmethod
    def buckets(self) -> Dict[str, dict]:
        """Retrieve metadata for all buckets in the storage.
        
        Returns:
            Dictionary mapping bucket IDs to their metadata dictionaries.
            Each metadata dict should contain:
            - 'id': bucket identifier
            - 'type': event type stored in this bucket
            - 'client': client application that created the bucket
            - 'hostname': hostname where the bucket was created
            - 'created': ISO8601 creation timestamp
            - 'name': optional human-readable name
            - 'data': optional additional metadata
            
        Implementation notes:
        - Should return empty dict if no buckets exist
        - Metadata should be consistent across calls
        - Consider caching for performance
        """
        raise NotImplementedError

    @abstractmethod
    def create_bucket(
        self,
        bucket_id: str,
        type_id: str,
        client: str,
        hostname: str,
        created: str,
        name: Optional[str] = None,
        data: Optional[dict] = None,
    ) -> None:
        """Create a new bucket for storing events.
        
        Args:
            bucket_id: Unique identifier for the bucket
            type_id: Type of events that will be stored (e.g., 'afkstatus', 'currentwindow')
            client: Name of the client application creating the bucket
            hostname: Hostname of the machine where bucket is created
            created: ISO8601 timestamp of bucket creation
            name: Optional human-readable name for the bucket
            data: Optional additional metadata as key-value pairs
            
        Raises:
            ValueError: If bucket_id already exists or is invalid
            
        Implementation notes:
        - bucket_id should be unique across the storage instance
        - Validate all required parameters before creation
        - Store metadata for later retrieval via buckets() method
        - Consider bucket_id naming conventions and restrictions
        """
        raise NotImplementedError

    @abstractmethod
    def update_bucket(
        self,
        bucket_id: str,
        type_id: Optional[str] = None,
        client: Optional[str] = None,
        hostname: Optional[str] = None,
        name: Optional[str] = None,
        data: Optional[dict] = None,
    ) -> None:
        """Update metadata for an existing bucket.
        
        Args:
            bucket_id: Identifier of bucket to update
            type_id: New event type (if provided)
            client: New client name (if provided)
            hostname: New hostname (if provided)  
            name: New human-readable name (if provided)
            data: New metadata dict (if provided, replaces existing)
            
        Raises:
            KeyError: If bucket_id does not exist
            
        Implementation notes:
        - Only update fields that are not None
        - Preserve existing values for fields not specified
        - Update should be atomic to prevent partial updates
        - Consider validation of new values before applying
        """
        raise NotImplementedError

    @abstractmethod
    def delete_bucket(self, bucket_id: str) -> None:
        """Delete a bucket and all its events.
        
        Args:
            bucket_id: Identifier of bucket to delete
            
        Raises:
            KeyError: If bucket_id does not exist
            
        Implementation notes:
        - This operation should be atomic and irreversible
        - Delete all events in the bucket before deleting bucket metadata
        - Consider confirmation mechanisms for production use
        - Clean up any associated indexes or cached data
        """
        raise NotImplementedError

    @abstractmethod
    def get_metadata(self, bucket_id: str) -> dict:
        """Retrieve metadata for a specific bucket.
        
        Args:
            bucket_id: Identifier of bucket to retrieve
            
        Returns:
            Dictionary containing bucket metadata with same structure
            as individual entries from buckets() method.
            
        Raises:
            KeyError: If bucket_id does not exist
            
        Implementation notes:
        - Should return consistent data with buckets() method
        - Consider caching for frequently accessed buckets
        """
        raise NotImplementedError

    @abstractmethod
    def get_event(
        self,
        bucket_id: str,
        event_id: int,
    ) -> Optional[Event]:
        """Retrieve a single event by its ID.
        
        Args:
            bucket_id: Identifier of bucket containing the event
            event_id: Unique identifier of the event within the bucket
            
        Returns:
            Event object if found, None if not found
            
        Raises:
            KeyError: If bucket_id does not exist
            
        Implementation notes:
        - event_id should be unique within the bucket
        - Return None rather than raising exception for missing events
        - Event timestamps should be in UTC timezone
        """
        raise NotImplementedError

    @abstractmethod
    def get_events(
        self,
        bucket_id: str,
        limit: int,
        starttime: Optional[datetime] = None,
        endtime: Optional[datetime] = None,
    ) -> List[Event]:
        """Retrieve events from a bucket with optional time filtering.
        
        Args:
            bucket_id: Identifier of bucket to query
            limit: Maximum number of events to return (0 = no limit)
            starttime: Include only events at or after this time (UTC)
            endtime: Include only events before this time (UTC)
            
        Returns:
            List of Event objects ordered by timestamp (newest first)
            
        Raises:
            KeyError: If bucket_id does not exist
            ValueError: If limit < 0 or time range is invalid
            
        Implementation notes:
        - Should return events in reverse chronological order (newest first)
        - Time filtering should include starttime and exclude endtime
        - Empty list if no events match criteria
        - Consider pagination for large result sets
        - Optimize for common query patterns (recent events, time ranges)
        """
        raise NotImplementedError

    def get_eventcount(
        self,
        bucket_id: str,
        starttime: Optional[datetime] = None,
        endtime: Optional[datetime] = None,
    ) -> int:
        """Count events in a bucket with optional time filtering.
        
        Args:
            bucket_id: Identifier of bucket to query
            starttime: Count only events at or after this time (UTC)
            endtime: Count only events before this time (UTC)
            
        Returns:
            Number of events matching the criteria
            
        Raises:
            KeyError: If bucket_id does not exist
            ValueError: If time range is invalid
            
        Implementation notes:
        - Default implementation iterates through get_events()
        - Override with optimized COUNT queries for better performance
        - Time filtering should use same logic as get_events()
        """
        raise NotImplementedError

    @abstractmethod
    def insert_one(self, bucket_id: str, event: Event) -> Event:
        """Insert a single event into a bucket.
        
        Args:
            bucket_id: Identifier of bucket to insert into
            event: Event object to insert
            
        Returns:
            Event object with assigned ID and any normalized fields
            
        Raises:
            KeyError: If bucket_id does not exist
            ValueError: If event data is invalid
            
        Implementation notes:
        - Should assign a unique ID to the event if not present
        - Normalize timestamp to UTC if not already
        - Validate event data structure before insertion
        - Consider deduplication strategies for identical events
        - Return the event with any modifications (ID, normalized timestamp)
        """
        raise NotImplementedError

    def insert_many(self, bucket_id: str, events: List[Event]) -> None:
        """Insert multiple events into a bucket.
        
        Args:
            bucket_id: Identifier of bucket to insert into
            events: List of Event objects to insert
            
        Raises:
            KeyError: If bucket_id does not exist
            ValueError: If any event data is invalid
            
        Implementation notes:
        - Default implementation calls insert_one() for each event
        - Override with batch operations for better performance
        - Should be atomic where possible (all or none)
        - Consider memory usage for large event lists
        - Maintain event ordering where possible
        """
        for event in events:
            self.insert_one(bucket_id, event)

    @abstractmethod
    def delete(self, bucket_id: str, event_id: int) -> bool:
        """Delete a single event from a bucket.
        
        Args:
            bucket_id: Identifier of bucket containing the event
            event_id: Unique identifier of event to delete
            
        Returns:
            True if event was deleted, False if event did not exist
            
        Raises:
            KeyError: If bucket_id does not exist
            
        Implementation notes:
        - Should be idempotent (safe to call multiple times)
        - Return False rather than raising exception for missing events
        - Consider soft delete vs hard delete strategies
        - Clean up any associated indexes
        """
        raise NotImplementedError

    @abstractmethod
    def replace(self, bucket_id: str, event_id: int, event: Event) -> bool:
        """Replace an existing event with new data.
        
        Args:
            bucket_id: Identifier of bucket containing the event
            event_id: Unique identifier of event to replace
            event: New event data to replace the existing event
            
        Returns:
            True if event was replaced, False if event did not exist
            
        Raises:
            KeyError: If bucket_id does not exist
            ValueError: If new event data is invalid
            
        Implementation notes:
        - Should preserve the event_id in the replacement
        - Validate new event data before replacement
        - Return False rather than raising exception for missing events
        - Should be atomic (original event restored if replacement fails)
        """
        raise NotImplementedError

    @abstractmethod
    def replace_last(self, bucket_id: str, event: Event) -> None:
        """Replace the most recent event in a bucket.
        
        Args:
            bucket_id: Identifier of bucket to modify
            event: New event data to replace the last event
            
        Raises:
            KeyError: If bucket_id does not exist
            ValueError: If event data is invalid or bucket is empty
            
        Implementation notes:
        - Find the event with the latest timestamp
        - Replace its data while preserving the event ID
        - Should fail if bucket contains no events
        - Useful for updating ongoing activities or correcting recent data
        """
        raise NotImplementedError
