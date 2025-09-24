#!/usr/bin/env python3
"""
Improved unused imports checker for PeakActivity project.
Bu script, kullanılmayan import'ları daha akıllıca tespit eder.
"""

import ast
import glob
import os
from typing import Dict, List, Set, Tuple


class SmartImportChecker(ast.NodeVisitor):
    def __init__(self):
        self.imports: Dict[str, Set[str]] = {}
        self.used_names: Set[str] = set()
        self.from_imports: Dict[str, Set[str]] = {}
        self.string_references: Set[str] = set()
        self.docstring_references: Set[str] = set()

    def visit_Import(self, node):
        for alias in node.names:
            module_name = alias.name
            as_name = alias.asname or module_name.split(".")[-1]
            if module_name not in self.imports:
                self.imports[module_name] = set()
            self.imports[module_name].add(as_name)

    def visit_ImportFrom(self, node):
        if node.module:
            for alias in node.names:
                name = alias.name
                as_name = alias.asname or name
                if node.module not in self.from_imports:
                    self.from_imports[node.module] = set()
                self.from_imports[node.module].add((name, as_name))

    def visit_Name(self, node):
        if isinstance(node.ctx, ast.Load):
            self.used_names.add(node.id)

    def visit_Attribute(self, node):
        if isinstance(node.ctx, ast.Load) and isinstance(node.value, ast.Name):
            self.used_names.add(node.value.id)
        # Nested attribute access için
        if hasattr(node.value, "id"):
            self.used_names.add(node.value.id)

    def visit_Str(self, node):
        # String literallerde geçen referansları kaydet
        self.string_references.add(node.s)

    def visit_Constant(self, node):
        # Python 3.8+ için constant literaller
        if isinstance(node.value, str):
            self.string_references.add(node.value)

    def visit_FunctionDef(self, node):
        # Docstring'lerde kullanılan referansları kaydet
        if ast.get_docstring(node):
            self.docstring_references.add(ast.get_docstring(node))
        self.generic_visit(node)

    def visit_ClassDef(self, node):
        # Class docstring'lerini kontrol et
        if ast.get_docstring(node):
            self.docstring_references.add(ast.get_docstring(node))
        self.generic_visit(node)


def is_likely_used(name: str, content: str, checker: SmartImportChecker) -> bool:
    """Import'un kullanılıp kullanılmadığını daha kapsamlı kontrol et."""

    # Bariz kullanımlar
    if name in checker.used_names:
        return True

    # String literallerde geçiyor mu
    for string_ref in checker.string_references:
        if name in string_ref:
            return True

    # Docstring'lerde geçiyor mu
    for doc in checker.docstring_references:
        if name in doc:
            return True

    # Exception handling için
    if name in ["Exception", "Error"] and ("except" in content or "raise" in content):
        return True

    # Platform specific imports
    platform_imports = ["os", "sys", "platform", "AppKit", "Xlib", "OSAScript"]
    if name in platform_imports and any(
        x in content for x in ["if", "try", "platform", "darwin", "linux", "win"]
    ):
        return True

    # Type hints için kullanılan importlar
    if any(
        x in content for x in ["Dict", "List", "Set", "Tuple", "Optional", "Union"]
    ) and name in ["typing", "Dict", "List", "Set", "Tuple", "Optional", "Union"]:
        return True

    # __all__ export listesinde geçiyor mu
    if (
        "__all__" in content
        and name in content[content.find("__all__") : content.find("__all__") + 500]
    ):
        return True

    return False


def check_file(filepath: str) -> List[str]:
    """Bir dosyadaki kullanılmayan import'ları akıllıca kontrol et."""
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()

        tree = ast.parse(content)
        checker = SmartImportChecker()
        checker.visit(tree)

        unused = []

        # Regular imports kontrol et
        for module, aliases in checker.imports.items():
            for alias in aliases:
                if not is_likely_used(alias, content, checker):
                    unused.append(
                        f"import {module}"
                        + (f" as {alias}" if alias != module.split(".")[-1] else "")
                    )

        # From imports kontrol et
        for module, imports in checker.from_imports.items():
            for name, alias in imports:
                if not is_likely_used(alias, content, checker):
                    unused.append(
                        f"from {module} import {name}"
                        + (f" as {alias}" if alias != name else "")
                    )

        return unused

    except Exception as e:
        print(f"Error checking {filepath}: {e}")
        return []


def main():
    """Ana fonksiyon - sadece gerçekten kullanılmayan import'ları göster."""
    patterns = [
        "aw-server/aw_server/*.py",
        "aw-watcher-afk/aw_watcher_afk/*.py",
        "aw-watcher-window/aw_watcher_window/*.py",
        "aw-qt/aw_qt/*.py",
        "aw-core/aw_core/*.py",
    ]

    total_unused = 0

    for pattern in patterns:
        files = glob.glob(pattern)
        for filepath in files:
            # __init__.py dosyalarını atla (genelde re-export için)
            if filepath.endswith("__init__.py"):
                continue

            unused = check_file(filepath)
            if unused:
                print(f"\n🔍 {filepath}:")
                for imp in unused:
                    print(f"  ❌ {imp}")
                    total_unused += 1

    if total_unused == 0:
        print("✅ Kullanılmayan import bulunamadı!")
    else:
        print(
            f"\n📊 Toplam {total_unused} potansiyel kullanılmayan import tespit edildi."
        )
        print("⚠️  Platform specific ve type hint import'ları false positive olabilir.")


if __name__ == "__main__":
    main()
