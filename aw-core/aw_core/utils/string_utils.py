"""ActivityWatch string building utilities for performance optimization.

This module provides efficient string building utilities to replace inefficient
string concatenation patterns throughout the ActivityWatch codebase.

Performance Benefits:
- StringBuilder: Efficient string building with list join instead of concatenation
- Template utilities: Precompiled string templates for repeated operations
- Safe formatters: Type-safe string formatting with error handling

Usage Examples:
    # Instead of: result = ""
    # for item in items: result += str(item) + ", "

    # Use:
    builder = StringBuilder()
    for item in items:
        builder.append(item).append(", ")
    result = builder.build()
"""

import logging
from typing import Any, Dict, Iterable, List, Optional, Union
import string
import re

logger = logging.getLogger(__name__)


class StringBuilder:
    """Efficient string building utility for performance optimization.

    Replaces inefficient string concatenation patterns with list-based
    building and single join operation.

    Example:
        builder = StringBuilder()
        builder.append("Hello").append(" ").append("World")
        result = builder.build()  # "Hello World"
    """

    def __init__(self, initial_capacity: int = 16):
        """Initialize StringBuilder with optional capacity hint.

        Args:
            initial_capacity: Hint for initial list size (performance optimization)
        """
        self._parts: List[str] = []
        if initial_capacity > 0:
            # Pre-allocate list for better performance
            self._parts = [None] * initial_capacity  # type: ignore
            self._parts.clear()

    def append(self, text: Any) -> "StringBuilder":
        """Append text to the builder.

        Args:
            text: Any object that can be converted to string

        Returns:
            Self for method chaining
        """
        if text is not None:
            self._parts.append(str(text))
        return self

    def append_line(self, text: Any = "") -> "StringBuilder":
        """Append text with newline.

        Args:
            text: Text to append before newline

        Returns:
            Self for method chaining
        """
        return self.append(text).append("\n")

    def extend(self, texts: Iterable[Any]) -> "StringBuilder":
        """Extend with multiple text items.

        Args:
            texts: Iterable of objects to convert to strings

        Returns:
            Self for method chaining
        """
        self._parts.extend(str(t) for t in texts if t is not None)
        return self

    def build(self, separator: str = "") -> str:
        """Build final string with separator.

        Args:
            separator: String to join parts with

        Returns:
            Final joined string
        """
        return separator.join(self._parts)

    def clear(self) -> "StringBuilder":
        """Clear all parts.

        Returns:
            Self for method chaining
        """
        self._parts.clear()
        return self

    def length(self) -> int:
        """Get total length of all parts."""
        return sum(len(part) for part in self._parts)

    def is_empty(self) -> bool:
        """Check if builder is empty."""
        return len(self._parts) == 0


class SafeFormatter:
    """Safe string formatting with error handling.

    Provides type-safe string formatting with graceful error handling
    for template operations.
    """

    @staticmethod
    def format_safe(template: str, **kwargs: Any) -> str:
        """Safe string formatting with error handling.

        Args:
            template: String template with {key} placeholders
            **kwargs: Values to substitute

        Returns:
            Formatted string, or template with error marker on failure
        """
        try:
            return template.format(**kwargs)
        except (KeyError, ValueError, TypeError) as e:
            logger.warning(
                "String formatting failed for template '%s': %s", template, e
            )
            return f"{template} [FORMAT_ERROR: {e}]"

    @staticmethod
    def format_safe_partial(template: str, **kwargs: Any) -> str:
        """Safe partial string formatting.

        Only substitutes available keys, leaves others unchanged.

        Args:
            template: String template with {key} placeholders
            **kwargs: Values to substitute

        Returns:
            Partially formatted string
        """
        try:
            # Use string.Template for partial substitution
            safe_template = string.Template(template.replace("{", "$").replace("}", ""))
            return (
                safe_template.safe_substitute(**kwargs)
                .replace("$", "{")
                .replace("{", "}")
            )
        except Exception as e:
            logger.warning(
                "Partial formatting failed for template '%s': %s", template, e
            )
            return template


class ReportBuilder:
    """Specialized string builder for activity reports.

    Optimized for building ActivityWatch reports with consistent formatting
    and performance optimizations.
    """

    def __init__(self):
        self._builder = StringBuilder(initial_capacity=64)
        self._indent_level = 0
        self._indent_str = "  "

    def add_header(self, title: str, level: int = 1) -> "ReportBuilder":
        """Add formatted header.

        Args:
            title: Header title
            level: Header level (1-6)

        Returns:
            Self for method chaining
        """
        prefix = "#" * min(max(level, 1), 6) + " "
        return self.add_line(f"{prefix}{title}")

    def add_line(self, text: str = "") -> "ReportBuilder":
        """Add line with current indentation.

        Args:
            text: Line text

        Returns:
            Self for method chaining
        """
        indent = self._indent_str * self._indent_level
        self._builder.append_line(f"{indent}{text}")
        return self

    def add_bullet(self, text: str) -> "ReportBuilder":
        """Add bullet point.

        Args:
            text: Bullet text

        Returns:
            Self for method chaining
        """
        return self.add_line(f"• {text}")

    def add_section(self, title: str, content: List[str]) -> "ReportBuilder":
        """Add formatted section.

        Args:
            title: Section title
            content: List of content lines

        Returns:
            Self for method chaining
        """
        self.add_header(title, 2)
        self.indent()
        for line in content:
            self.add_line(line)
        self.dedent()
        return self

    def indent(self) -> "ReportBuilder":
        """Increase indentation level."""
        self._indent_level += 1
        return self

    def dedent(self) -> "ReportBuilder":
        """Decrease indentation level."""
        self._indent_level = max(0, self._indent_level - 1)
        return self

    def build(self) -> str:
        """Build final report string."""
        return self._builder.build()


class QueryStringBuilder:
    """Optimized string builder for database queries.

    Specialized for building SQL-like queries with parameter safety
    and performance optimizations.
    """

    def __init__(self):
        self._builder = StringBuilder(initial_capacity=32)
        self._parameters: List[Any] = []

    def select(self, *columns: str) -> "QueryStringBuilder":
        """Add SELECT clause.

        Args:
            *columns: Column names to select

        Returns:
            Self for method chaining
        """
        if columns:
            self._builder.append("SELECT ").append(", ".join(columns))
        else:
            self._builder.append("SELECT *")
        return self

    def from_table(self, table: str) -> "QueryStringBuilder":
        """Add FROM clause.

        Args:
            table: Table name

        Returns:
            Self for method chaining
        """
        self._builder.append(" FROM ").append(table)
        return self

    def where(self, condition: str, *params: Any) -> "QueryStringBuilder":
        """Add WHERE clause with parameters.

        Args:
            condition: WHERE condition with ? placeholders
            *params: Parameters to bind

        Returns:
            Self for method chaining
        """
        self._builder.append(" WHERE ").append(condition)
        self._parameters.extend(params)
        return self

    def order_by(self, column: str, desc: bool = False) -> "QueryStringBuilder":
        """Add ORDER BY clause.

        Args:
            column: Column to order by
            desc: Whether to order descending

        Returns:
            Self for method chaining
        """
        direction = " DESC" if desc else ""
        self._builder.append(" ORDER BY ").append(column).append(direction)
        return self

    def limit(self, count: int) -> "QueryStringBuilder":
        """Add LIMIT clause.

        Args:
            count: Maximum number of results

        Returns:
            Self for method chaining
        """
        self._builder.append(" LIMIT ").append(str(count))
        return self

    def build_query(self) -> tuple[str, List[Any]]:
        """Build query and parameters.

        Returns:
            Tuple of (query_string, parameters)
        """
        return self._builder.build(), self._parameters.copy()


def efficient_join(items: Iterable[Any], separator: str = ", ") -> str:
    """Efficient joining of items to string.

    Args:
        items: Items to join
        separator: Separator string

    Returns:
        Joined string
    """
    return separator.join(str(item) for item in items if item is not None)


def build_log_message(level: str, message: str, **context: Any) -> str:
    """Build structured log message efficiently.

    Args:
        level: Log level
        message: Main message
        **context: Additional context

    Returns:
        Formatted log message
    """
    builder = StringBuilder()
    builder.append(f"[{level}] {message}")

    if context:
        builder.append(" | Context: ")
        context_parts = [f"{k}={v}" for k, v in context.items()]
        builder.append(", ".join(context_parts))

    return builder.build()
