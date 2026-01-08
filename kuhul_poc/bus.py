from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Callable, Dict, List, Optional, Sequence

from session_log import SessionLog

EventHandler = Callable[[Dict[str, Any]], None]


@dataclass
class EventBus:
    """
    In-process append-only bus:
    - append(event): appends to in-memory list + optional log + notifies subscribers
    - replay(events): re-emits events in their original order (no mutation)
    """

    log: Optional[SessionLog] = None

    def __post_init__(self) -> None:
        self._events: List[Dict[str, Any]] = []
        self._subs_all: List[EventHandler] = []
        self._subs_by_topic: Dict[str, List[EventHandler]] = {}

    @property
    def events(self) -> Sequence[Dict[str, Any]]:
        return tuple(self._events)

    def subscribe(self, handler: EventHandler, topic: Optional[str] = None) -> None:
        if topic is None:
            self._subs_all.append(handler)
            return
        self._subs_by_topic.setdefault(topic, []).append(handler)

    def append(self, event: Dict[str, Any], *, persist: bool = True) -> None:
        self._events.append(event)

        if persist and self.log is not None:
            self.log.append(event)

        for handler in self._subs_all:
            handler(event)
        for handler in self._subs_by_topic.get(event.get("topic", ""), []):
            handler(event)

    def replay(self, events: Sequence[Dict[str, Any]]) -> None:
        """
        Replay events in-order.
        - Does not persist again (prevents log duplication)
        - Still notifies subscribers
        """
        for event in events:
            self.append(event, persist=False)
