from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, Optional

from ids import IdGen


@dataclass
class MetaShell:
    """
    Minimal meta-shell that normalizes intent into canonical KUHUL commands.

    This is intentionally small: it proves the universal-shell pattern by
    treating raw intent strings as inputs that become canonical commands.
    """

    idgen: IdGen
    version: str = "1.0.0"

    def infer_subshell(self, intent: str, *, hint: Optional[str] = None) -> str:
        if hint:
            return hint
        stripped = intent.strip()
        if stripped.startswith("SELECT"):
            return "sql"
        if stripped.startswith("document."):
            return "dom"
        if stripped.startswith("god "):
            return "quake"
        if stripped.startswith("ls ") or stripped == "ls":
            return "bash"
        return "kuhul"

    def to_command(
        self,
        *,
        intent: str,
        session: str,
        ts_ms: int,
        source_kind: str = "cli",
        who: str = "local",
        subshell: Optional[str] = None,
    ) -> Dict[str, Any]:
        shell = self.infer_subshell(intent, hint=subshell)
        return {
            "@type": "kuhul.command",
            "@v": self.version,
            "id": self.idgen.next_id("cmd", ts_ms),
            "ts_ms": ts_ms,
            "source": {"kind": source_kind, "who": who, "session": session},
            "op": "shell.intent",
            "args": {"intent": intent, "shell": shell},
        }
