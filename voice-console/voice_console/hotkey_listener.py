import keyboard


def normalize_hotkey(hotkey: str) -> frozenset:
    parts = [p.strip().lower() for p in hotkey.split("+") if p.strip()]
    return frozenset(parts)


class HotkeyListener:
    """Global push-to-talk listener for Agent A / Agent B hotkeys."""

    def __init__(self, hotkeys: dict[str, str], on_start, on_end):
        self.hotkeys = {agent: normalize_hotkey(key) for agent, key in hotkeys.items() if key}
        self.on_start = on_start
        self.on_end = on_end
        self.currently_held: set[str] = set()
        self.active_agent: str | None = None
        self._hook = None

    def start(self):
        if self._hook is not None:
            return
        self._hook = keyboard.hook(self._on_event, suppress=False)

    def stop(self):
        if self._hook is not None:
            keyboard.unhook(self._hook)
            self._hook = None
        self.currently_held.clear()
        self.active_agent = None

    def _on_event(self, event):
        name = event.name.lower()

        if event.event_type == "down":
            self.currently_held.add(name)
            if self.active_agent is None:
                for agent, combo in self.hotkeys.items():
                    if combo and combo.issubset(self.currently_held):
                        self.active_agent = agent
                        self.on_start(agent)
                        break
        elif event.event_type == "up":
            if self.active_agent:
                combo = self.hotkeys[self.active_agent]
                if name in combo:
                    agent = self.active_agent
                    self.active_agent = None
                    self.on_end(agent)
            self.currently_held.discard(name)


def record_hotkey(callback):
    """Block until the user presses a key combo, then call callback(hotkey_str)."""

    def worker():
        try:
            hotkey = keyboard.read_hotkey(suppress=False)
            callback(hotkey)
        except Exception as exc:
            callback(None, exc)

    import threading

    threading.Thread(target=worker, daemon=True).start()
