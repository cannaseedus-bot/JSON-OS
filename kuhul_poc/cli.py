from __future__ import annotations

import argparse
import os
import json
import sys
from typing import Any, Dict, List

from bus import EventBus
from engine import Engine
from ids import IdGen
from session_log import SessionLog
from state import KuhulState
from meta_shell import MetaShell
from svg_renderer import render_svg

V = "1.0.0"


def make_cmd(
    idgen: IdGen,
    *,
    session: str,
    ts_ms: int,
    op: str,
    args: Dict[str, Any],
    source_kind: str = "cli",
    who: str = "local",
) -> Dict[str, Any]:
    return {
        "@type": "kuhul.command",
        "@v": V,
        "id": idgen.next_id("cmd", ts_ms),
        "ts_ms": ts_ms,
        "source": {"kind": source_kind, "who": who, "session": session},
        "op": op,
        "args": args,
    }


def ensure_dir(path: str) -> None:
    os.makedirs(path, exist_ok=True)


def write_text(path: str, text: str) -> None:
    with open(path, "w", encoding="utf-8") as f:
        f.write(text)


def load_events(log: SessionLog) -> List[Dict[str, Any]]:
    return list(log.read_all())


def load_state(path: str) -> KuhulState:
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return KuhulState.from_dict(data)


def main(argv: List[str]) -> int:
    ap = argparse.ArgumentParser(
        prog="kuhul", description="KUHUL PoC — CLI ⇄ SVG (append-only events + replay)"
    )
    ap.add_argument("--session", default="sess_local", help="Session id (used for logs)")
    ap.add_argument("--out", default="output", help="Output directory")
    ap.add_argument("--state", required=True, help="Path to explicit state JSON")
    ap.add_argument(
        "--events",
        default=None,
        help="Event log path (JSONL). Default: <out>/<session>.events.jsonl",
    )
    ap.add_argument("--quiet", action="store_true", help="Suppress event printing")

    sub = ap.add_subparsers(dest="cmd", required=True)

    p_create = sub.add_parser("create", help="Create a UI component")
    p_create.add_argument("component", choices=["button", "card", "chat-bubble"])
    p_create.add_argument("--text", default=None, help="Optional label/text")
    p_create.add_argument("--ts-ms", type=int, required=True, help="Explicit timestamp (ms)")

    p_theme = sub.add_parser("theme", help="Apply theme")
    p_theme.add_argument("name", choices=["dark", "light"])
    p_theme.add_argument("--ts-ms", type=int, required=True, help="Explicit timestamp (ms)")

    p_export = sub.add_parser("export-svg", help="Export current state to SVG")
    p_export.add_argument(
        "--file", default=None, help="Output svg filename. Default: <out>/<session>.svg"
    )
    p_export.add_argument("--ts-ms", type=int, required=True, help="Explicit timestamp (ms)")

    p_replay = sub.add_parser("replay", help="Replay an existing event log and export SVG")
    p_replay.add_argument(
        "--file", default=None, help="Event log path (JSONL). Default: <out>/<session>.events.jsonl"
    )
    p_replay.add_argument(
        "--svg", default=None, help="Output svg filename. Default: <out>/<session>.replay.svg"
    )

    p_intent = sub.add_parser("intent", help="Submit raw intent to the meta-shell")
    p_intent.add_argument("intent", help="Raw intent string to normalize")
    p_intent.add_argument("--shell", default=None, help="Explicit subshell hint (e.g. bash, dom, sql)")
    p_intent.add_argument("--ts-ms", type=int, required=True, help="Explicit timestamp (ms)")

    args = ap.parse_args(argv)

    ensure_dir(args.out)
    event_log_path = args.events or os.path.join(args.out, f"{args.session}.events.jsonl")
    log = SessionLog(event_log_path)
    bus = EventBus(log=log)
    idgen = IdGen()

    if not args.quiet:

        def printer(event: Dict[str, Any]) -> None:
            print(
                f"[{event.get('topic')}] {event.get('id')} caused_by={event.get('caused_by')}"
            )

        bus.subscribe(printer)

    base_state = load_state(args.state)
    engine = Engine(bus=bus, state=base_state, idgen=idgen)
    meta_shell = MetaShell(idgen=idgen, version=V)

    if args.cmd == "create":
        props: Dict[str, Any] = {}
        if args.text is not None:
            key = "text" if args.component != "card" else "label"
            props[key] = args.text
        cmd = make_cmd(
            idgen,
            session=args.session,
            ts_ms=args.ts_ms,
            op="ui.create",
            args={"component": args.component, "props": props},
        )
        cmd_log_path = os.path.join(args.out, f"{args.session}.commands.jsonl")
        SessionLog(cmd_log_path).append(cmd)
        engine.apply_command(cmd)

        engine.state_snapshot(caused_by=cmd["id"], ts_ms=args.ts_ms)

        svg_path = os.path.join(args.out, f"{args.session}.svg")
        svg = render_svg(engine.state.to_dict())
        write_text(svg_path, svg)
        if not args.quiet:
            print(f"SVG written: {svg_path}")
        return 0

    if args.cmd == "theme":
        cmd = make_cmd(
            idgen,
            session=args.session,
            ts_ms=args.ts_ms,
            op="ui.theme.apply",
            args={"name": args.name},
        )
        SessionLog(os.path.join(args.out, f"{args.session}.commands.jsonl")).append(cmd)
        engine.apply_command(cmd)
        engine.state_snapshot(caused_by=cmd["id"], ts_ms=args.ts_ms)

        svg_path = os.path.join(args.out, f"{args.session}.svg")
        svg = render_svg(engine.state.to_dict())
        write_text(svg_path, svg)
        if not args.quiet:
            print(f"SVG written: {svg_path}")
        return 0

    if args.cmd == "export-svg":
        out_svg = args.file or os.path.join(args.out, f"{args.session}.svg")
        cmd = make_cmd(
            idgen,
            session=args.session,
            ts_ms=args.ts_ms,
            op="svg.export",
            args={"hint": os.path.basename(out_svg)},
        )
        SessionLog(os.path.join(args.out, f"{args.session}.commands.jsonl")).append(cmd)
        engine.apply_command(cmd)
        engine.state_snapshot(caused_by=cmd["id"], ts_ms=args.ts_ms)

        svg = render_svg(engine.state.to_dict())
        write_text(out_svg, svg)
        if not args.quiet:
            print(f"SVG written: {out_svg}")
        return 0

    if args.cmd == "replay":
        replay_log_path = args.file or os.path.join(args.out, f"{args.session}.events.jsonl")
        replay_svg = args.svg or os.path.join(args.out, f"{args.session}.replay.svg")

        rlog = SessionLog(replay_log_path)
        events = load_events(rlog)

        st = KuhulState.from_dict(base_state.to_dict())
        for event in events:
            if event.get("topic") != "state.changed":
                continue
            data = event.get("data", {}) or {}
            kind = data.get("kind")
            if kind == "component.created":
                comp = data.get("component")
                if isinstance(comp, dict):
                    st.components.append(comp)
                    st.epoch_ms = int(event.get("ts_ms", st.epoch_ms))
            elif kind == "theme.changed":
                to = data.get("to")
                if to in ("dark", "light"):
                    st.theme = to
                    st.epoch_ms = int(event.get("ts_ms", st.epoch_ms))
        st.phase = "accepting"

        svg = render_svg(st.to_dict())
        write_text(replay_svg, svg)
        if not args.quiet:
            print(f"Replayed SVG written: {replay_svg}")
        return 0

    if args.cmd == "intent":
        cmd = meta_shell.to_command(
            intent=args.intent,
            session=args.session,
            ts_ms=args.ts_ms,
            subshell=args.shell,
        )
        SessionLog(os.path.join(args.out, f"{args.session}.commands.jsonl")).append(cmd)
        engine.apply_command(cmd)
        engine.state_snapshot(caused_by=cmd["id"], ts_ms=args.ts_ms)
        return 0

    return 2


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
