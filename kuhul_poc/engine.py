from __future__ import annotations

from typing import Any, Dict, Optional

from bus import EventBus
from ids import IdGen
from state import (
    ALLOWED_COMPONENT_TYPES,
    ALLOWED_PHASES,
    ALLOWED_PROP_KEYS,
    ALLOWED_THEMES,
    KuhulState,
)


class Engine:
    """
    Deterministic core:
    - Accepts canonical commands only
    - Mutates state
    - Emits canonical events
    """

    CMD_TYPE = "kuhul.command"
    EVT_TYPE = "kuhul.event"
    V = "1.0.0"

    def __init__(
        self,
        *,
        bus: EventBus,
        state: KuhulState,
        idgen: Optional[IdGen] = None,
    ) -> None:
        self.bus = bus
        self.state = state
        self.idgen = idgen or IdGen()

    def emit_event(
        self,
        *,
        ts_ms: int,
        caused_by: str,
        topic: str,
        data: Dict[str, Any],
    ) -> Dict[str, Any]:
        event = {
            "@type": self.EVT_TYPE,
            "@v": self.V,
            "id": self.idgen.next_id("evt", ts_ms),
            "ts_ms": ts_ms,
            "caused_by": caused_by,
            "topic": topic,
            "data": data,
        }
        self.bus.append(event, persist=True)
        return event

    def apply_command(self, cmd: Dict[str, Any]) -> None:
        if cmd.get("@type") != self.CMD_TYPE:
            raise ValueError("Invalid command @type")
        if not isinstance(cmd.get("op"), str):
            raise ValueError("Invalid command op")
        if not isinstance(cmd.get("args"), dict):
            raise ValueError("Invalid command args")

        op = cmd["op"]
        args = cmd["args"]
        ts_ms = int(cmd["ts_ms"])
        cid = str(cmd["id"])

        if ts_ms < self.state.epoch_ms:
            self._reject(ts_ms=ts_ms, caused_by=cid, reason="time_regression")
            return
        if self.state.phase not in ALLOWED_PHASES:
            self._reject(ts_ms=ts_ms, caused_by=cid, reason="invalid_phase")
            return
        if self.state.phase != "accepting":
            self._reject(
                ts_ms=ts_ms,
                caused_by=cid,
                reason="phase_not_accepting",
                extra={"phase": self.state.phase},
            )
            return

        self.state.phase = "applying"

        accepted = False
        if op == "ui.create":
            accepted = self._op_ui_create(cid=cid, ts_ms=ts_ms, args=args)
        elif op == "ui.theme.apply":
            accepted = self._op_theme_apply(cid=cid, ts_ms=ts_ms, args=args)
        elif op == "svg.export":
            self.emit_event(
                ts_ms=ts_ms,
                caused_by=cid,
                topic="svg.export.requested",
                data={"format": "svg", "hint": args.get("hint", "state.svg")},
            )
            accepted = True
        elif op == "shell.intent":
            accepted = self._op_shell_intent(cid=cid, ts_ms=ts_ms, args=args)
        else:
            self._reject(
                ts_ms=ts_ms,
                caused_by=cid,
                reason="unknown_op",
                extra={"op": op},
            )
            self.state.phase = "accepting"
            return

        if accepted:
            self.state.epoch_ms = ts_ms
        self.state.phase = "accepting"

    def _op_ui_create(self, *, cid: str, ts_ms: int, args: Dict[str, Any]) -> bool:
        ctype = args.get("component")
        props = args.get("props", {}) or {}
        if ctype not in ALLOWED_COMPONENT_TYPES:
            self._reject(ts_ms=ts_ms, caused_by=cid, reason="invalid_component")
            return False
        if not isinstance(props, dict):
            self._reject(ts_ms=ts_ms, caused_by=cid, reason="props_not_object")
            return False

        extra_props = set(props.keys()) - ALLOWED_PROP_KEYS
        if extra_props:
            self._reject(
                ts_ms=ts_ms,
                caused_by=cid,
                reason="props_undeclared",
                extra={"keys": sorted(extra_props)},
            )
            return False
        for key, value in props.items():
            if not isinstance(value, str):
                self._reject(
                    ts_ms=ts_ms,
                    caused_by=cid,
                    reason="prop_value_not_string",
                    extra={"key": key},
                )
                return False

        comp_id = self.idgen.next_id("cmp", ts_ms)
        comp = {"id": comp_id, "type": ctype, "props": props}
        self.state.components.append(comp)

        self.emit_event(
            ts_ms=ts_ms,
            caused_by=cid,
            topic="state.changed",
            data={"kind": "component.created", "component": comp},
        )
        return True

    def _op_theme_apply(self, *, cid: str, ts_ms: int, args: Dict[str, Any]) -> bool:
        name = args.get("name")
        if name not in ALLOWED_THEMES:
            self._reject(ts_ms=ts_ms, caused_by=cid, reason="invalid_theme")
            return False

        old = self.state.theme
        self.state.theme = name

        self.emit_event(
            ts_ms=ts_ms,
            caused_by=cid,
            topic="state.changed",
            data={"kind": "theme.changed", "from": old, "to": name},
        )
        return True

    def _op_shell_intent(self, *, cid: str, ts_ms: int, args: Dict[str, Any]) -> bool:
        intent = args.get("intent")
        shell = args.get("shell")
        if not isinstance(intent, str) or not intent.strip():
            self._reject(ts_ms=ts_ms, caused_by=cid, reason="missing_intent")
            return False
        if not isinstance(shell, str) or not shell.strip():
            self._reject(ts_ms=ts_ms, caused_by=cid, reason="missing_shell")
            return False

        self.emit_event(
            ts_ms=ts_ms,
            caused_by=cid,
            topic="shell.intent.received",
            data={"intent": intent, "shell": shell},
        )
        return True

    def state_snapshot(self, *, caused_by: str, ts_ms: int) -> Dict[str, Any]:
        snap = self.state.to_dict()
        self.emit_event(
            ts_ms=ts_ms,
            caused_by=caused_by,
            topic="state.snapshot",
            data={"state": snap},
        )
        return snap

    def _reject(
        self,
        *,
        ts_ms: int,
        caused_by: str,
        reason: str,
        extra: Optional[Dict[str, Any]] = None,
    ) -> None:
        data: Dict[str, Any] = {"reason": reason}
        if extra:
            data.update(extra)
        self.emit_event(
            ts_ms=ts_ms,
            caused_by=caused_by,
            topic="command.rejected",
            data=data,
        )
