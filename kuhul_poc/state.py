from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List

ALLOWED_COMPONENT_TYPES = {"button", "card", "chat-bubble"}
ALLOWED_PHASES = {"accepting", "applying"}
ALLOWED_THEMES = {"dark", "light"}
ALLOWED_PROP_KEYS = {"text", "label"}


@dataclass
class KuhulState:
    """
    Minimal state:
    - theme: string
    - components: list of components with id/type/props
    - epoch_ms: monotonic time marker
    - phase: execution phase
    """

    theme: str
    components: List[Dict[str, Any]]
    epoch_ms: int
    phase: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "theme": self.theme,
            "components": list(self.components),
            "epoch_ms": self.epoch_ms,
            "phase": self.phase,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "KuhulState":
        if not isinstance(data, dict):
            raise ValueError("State must be an object")
        expected_keys = {"theme", "components", "epoch_ms", "phase"}
        extra = set(data.keys()) - expected_keys
        missing = expected_keys - set(data.keys())
        if extra:
            raise ValueError(f"State has undeclared fields: {sorted(extra)}")
        if missing:
            raise ValueError(f"State missing required fields: {sorted(missing)}")

        theme = data["theme"]
        if theme not in ALLOWED_THEMES:
            raise ValueError("State theme is invalid")

        epoch_ms = data["epoch_ms"]
        if not isinstance(epoch_ms, int) or epoch_ms < 0:
            raise ValueError("State epoch_ms must be a non-negative integer")

        phase = data["phase"]
        if phase not in ALLOWED_PHASES:
            raise ValueError("State phase is invalid")

        components = data["components"]
        if not isinstance(components, list):
            raise ValueError("State components must be a list")
        for comp in components:
            _validate_component(comp)

        return cls(
            theme=theme,
            components=list(components),
            epoch_ms=epoch_ms,
            phase=phase,
        )


def _validate_component(comp: Dict[str, Any]) -> None:
    if not isinstance(comp, dict):
        raise ValueError("Component must be an object")
    expected_keys = {"id", "type", "props"}
    extra = set(comp.keys()) - expected_keys
    missing = expected_keys - set(comp.keys())
    if extra:
        raise ValueError(f"Component has undeclared fields: {sorted(extra)}")
    if missing:
        raise ValueError(f"Component missing required fields: {sorted(missing)}")

    cid = comp["id"]
    if not isinstance(cid, str) or not cid:
        raise ValueError("Component id must be a non-empty string")

    ctype = comp["type"]
    if ctype not in ALLOWED_COMPONENT_TYPES:
        raise ValueError("Component type is invalid")

    props = comp["props"]
    if not isinstance(props, dict):
        raise ValueError("Component props must be an object")
    extra_props = set(props.keys()) - ALLOWED_PROP_KEYS
    if extra_props:
        raise ValueError(f"Component props have undeclared fields: {sorted(extra_props)}")
    for key, value in props.items():
        if not isinstance(value, str):
            raise ValueError(f"Component prop {key} must be a string")
