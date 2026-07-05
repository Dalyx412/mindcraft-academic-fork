import threading
import tkinter as tk
from tkinter import messagebox, ttk

from config import load_config, save_config
from client.audio import AudioRecorder
from client.hotkeys import HotkeyListener, record_hotkey
from client.i18n import LANG_LABEL_KEYS, SUPPORTED_LANGUAGES, t
from client.ws_client import send_voice_upload_sync


class VoiceClientApp:
    def __init__(self):
        self.config = load_config()
        self.ui_lang = self._normalize_lang(self.config.get("language", "ja"))
        self.recorder = AudioRecorder()
        self.hotkey_listener: HotkeyListener | None = None
        self._recording_hotkey = False

        self.root = tk.Tk()
        self.root.geometry("460x480")
        self.root.resizable(False, False)
        self._widgets = {}
        self._build_ui()
        self._apply_ui_language()
        self._start_hotkeys()
        self.root.protocol("WM_DELETE_WINDOW", self._on_close)

    def _normalize_lang(self, lang: str) -> str:
        lang = (lang or "ja").lower()
        if lang.startswith("zh"):
            return "zh"
        return lang if lang in SUPPORTED_LANGUAGES else "ja"

    def _build_ui(self):
        pad = {"padx": 14, "pady": 5}
        outer = ttk.Frame(self.root, padding=4)
        outer.pack(fill="both", expand=True)

        self._widgets["hint"] = ttk.Label(outer, wraplength=420)
        self._widgets["hint"].pack(anchor="w", **pad)

        # --- Server ---
        self._widgets["server_frame"] = ttk.LabelFrame(outer, padding=10)
        self._widgets["server_frame"].pack(fill="x", **pad)

        host_row = ttk.Frame(self._widgets["server_frame"])
        host_row.pack(fill="x", pady=2)
        self._widgets["host_label"] = ttk.Label(host_row, width=16)
        self._widgets["host_label"].pack(side="left")
        self.host_entry = ttk.Entry(host_row, width=28)
        self.host_entry.pack(side="left", padx=(8, 0))
        self.host_entry.insert(0, self.config.get("server_host", "127.0.0.1"))

        port_row = ttk.Frame(self._widgets["server_frame"])
        port_row.pack(fill="x", pady=2)
        self._widgets["port_label"] = ttk.Label(port_row, width=16)
        self._widgets["port_label"].pack(side="left")
        self.port_entry = ttk.Entry(port_row, width=10)
        self.port_entry.pack(side="left", padx=(8, 0))
        self.port_entry.insert(0, str(self.config.get("server_port", 8081)))

        # --- Language ---
        self._widgets["lang_frame"] = ttk.LabelFrame(outer, padding=10)
        self._widgets["lang_frame"].pack(fill="x", **pad)

        self._widgets["lang_hint"] = ttk.Label(self._widgets["lang_frame"], wraplength=400)
        self._widgets["lang_hint"].pack(anchor="w", pady=(0, 6))

        self.lang_var = tk.StringVar()
        self.lang_combo = ttk.Combobox(
            self._widgets["lang_frame"],
            textvariable=self.lang_var,
            state="readonly",
            width=24,
        )
        self.lang_combo.pack(anchor="w")
        self.lang_combo.bind("<<ComboboxSelected>>", self._on_language_selected)

        # --- PTT Hotkeys ---
        self._widgets["ptt_frame"] = ttk.LabelFrame(outer, padding=10)
        self._widgets["ptt_frame"].pack(fill="x", **pad)

        self._hotkey_row(
            self._widgets["ptt_frame"],
            "agent_a",
            "hotkey_agent_a",
            "hotkey_display_a",
            "record_btn_a",
        )
        self._hotkey_row(
            self._widgets["ptt_frame"],
            "agent_b",
            "hotkey_agent_b",
            "hotkey_display_b",
            "record_btn_b",
        )

        # --- Actions & status ---
        btn_frame = ttk.Frame(outer)
        btn_frame.pack(fill="x", **pad)
        self.save_btn = ttk.Button(btn_frame, command=self._save_settings)
        self.save_btn.pack(side="left")

        self.status_var = tk.StringVar()
        self._widgets["status"] = ttk.Label(
            outer, textvariable=self.status_var, wraplength=420, foreground="#444"
        )
        self._widgets["status"].pack(anchor="w", **pad)

        self.record_indicator = ttk.Label(outer, text="", foreground="#c00")
        self.record_indicator.pack(anchor="w", padx=14)

    def _hotkey_row(self, parent, agent_label_key, config_key, display_attr, btn_attr):
        row = ttk.Frame(parent)
        row.pack(fill="x", pady=4)
        agent_label = ttk.Label(row, width=10)
        agent_label.pack(side="left")
        setattr(self, f"_{display_attr}_agent_label", agent_label)

        display = ttk.Label(row, width=14, anchor="w")
        display.configure(text=self.config.get(config_key, ""))
        display.pack(side="left", padx=4)
        setattr(self, display_attr, display)

        btn = ttk.Button(
            row,
            width=8,
            command=lambda k=config_key, d=display_attr, a=agent_label_key: self._record_hotkey(
                k, d, a
            ),
        )
        btn.pack(side="left", padx=4)
        setattr(self, btn_attr, btn)

    def _lang_combo_values(self):
        return [t(self.ui_lang, LANG_LABEL_KEYS[code]) for code in SUPPORTED_LANGUAGES]

    def _lang_code_from_label(self, label: str) -> str:
        for code in SUPPORTED_LANGUAGES:
            if t(self.ui_lang, LANG_LABEL_KEYS[code]) == label:
                return code
        return self.ui_lang

    def _on_language_selected(self, _event=None):
        selected = self.lang_var.get()
        new_lang = self._lang_code_from_label(selected)
        if new_lang != self.ui_lang:
            self.ui_lang = new_lang
            self._apply_ui_language()

    def _apply_ui_language(self):
        lang = self.ui_lang
        self.root.title(t(lang, "window_title"))

        self._widgets["hint"].configure(text=t(lang, "hint"))
        self._widgets["server_frame"].configure(text=t(lang, "server_section"))
        self._widgets["host_label"].configure(text=t(lang, "server_host"))
        self._widgets["port_label"].configure(text=t(lang, "server_port"))
        self._widgets["lang_frame"].configure(text=t(lang, "language_section"))
        self._widgets["lang_hint"].configure(text=t(lang, "language_hint"))
        self._widgets["ptt_frame"].configure(text=t(lang, "ptt_section"))

        self._hotkey_display_a_agent_label.configure(text=f"{t(lang, 'agent_a')}:")
        self._hotkey_display_b_agent_label.configure(text=f"{t(lang, 'agent_b')}:")
        self.record_btn_a.configure(text=t(lang, "record"))
        self.record_btn_b.configure(text=t(lang, "record"))
        self.save_btn.configure(text=t(lang, "save"))

        values = self._lang_combo_values()
        self.lang_combo.configure(values=values)
        self.lang_var.set(t(lang, LANG_LABEL_KEYS[lang]))

        self._set_status(t(lang, "status_ready"))

    def _record_hotkey(self, config_key, display_attr, agent_label_key):
        if self._recording_hotkey:
            return
        self._recording_hotkey = True
        display = getattr(self, display_attr)
        display.configure(text=t(self.ui_lang, "status_press_combo"))
        self._set_status(
            t(self.ui_lang, "status_recording_hotkey", agent=t(self.ui_lang, agent_label_key))
        )

        if self.hotkey_listener:
            self.hotkey_listener.stop()

        def on_recorded(hotkey, error=None):
            self.root.after(
                0,
                lambda: self._finish_hotkey_record(config_key, display_attr, hotkey, error),
            )

        record_hotkey(on_recorded)

    def _finish_hotkey_record(self, config_key, display_attr, hotkey, error):
        self._recording_hotkey = False
        display = getattr(self, display_attr)
        if error or not hotkey:
            display.configure(text=self.config.get(config_key, ""))
            self._set_status(t(self.ui_lang, "status_hotkey_failed", error=error))
        else:
            self.config[config_key] = hotkey
            display.configure(text=hotkey)
            self._set_status(t(self.ui_lang, "status_hotkey_recorded", hotkey=hotkey))
        self._restart_hotkeys()

    def _save_settings(self):
        try:
            port = int(self.port_entry.get().strip())
        except ValueError:
            messagebox.showerror(
                t(self.ui_lang, "error_title"), t(self.ui_lang, "error_port")
            )
            return

        self.config["server_host"] = self.host_entry.get().strip()
        self.config["server_port"] = port
        self.config["language"] = self.ui_lang
        self.config["hotkey_agent_a"] = self.config.get("hotkey_agent_a", "alt")
        self.config["hotkey_agent_b"] = self.config.get("hotkey_agent_b", "ctrl")
        save_config(self.config)
        self._restart_hotkeys()
        self._set_status(t(self.ui_lang, "status_saved"))

    def _restart_hotkeys(self):
        if self.hotkey_listener:
            self.hotkey_listener.stop()
        self._start_hotkeys()

    def _start_hotkeys(self):
        self.hotkey_listener = HotkeyListener(
            hotkeys={
                "AgentA": self.config.get("hotkey_agent_a", "alt"),
                "AgentB": self.config.get("hotkey_agent_b", "ctrl"),
            },
            on_start=self._on_ptt_start,
            on_end=self._on_ptt_end,
        )
        self.hotkey_listener.start()

    def _on_ptt_start(self, agent: str):
        if self._recording_hotkey:
            return
        try:
            self.recorder.start()
            lang = self.ui_lang
            self.root.after(
                0,
                lambda: self.record_indicator.configure(
                    text=t(lang, "recording_indicator", agent=agent)
                ),
            )
            self.root.after(
                0, lambda: self._set_status(t(lang, "status_recording", agent=agent))
            )
        except Exception as exc:
            self.root.after(
                0, lambda: self._set_status(t(self.ui_lang, "status_mic_error", error=exc))
            )

    def _on_ptt_end(self, agent: str):
        self.root.after(0, lambda: self.record_indicator.configure(text=""))
        threading.Thread(target=self._upload, args=(agent,), daemon=True).start()

    def _upload(self, agent: str):
        lang = self.ui_lang
        host = self.config.get("server_host", "127.0.0.1")
        port = int(self.config.get("server_port", 8081))
        stt_lang = self.config.get("language", lang)
        try:
            wav = self.recorder.stop()
            if not wav:
                self._set_status(t(lang, "status_no_audio"))
                return
            self._set_status(t(lang, "status_uploading", host=host, port=port))
            result = send_voice_upload_sync(host, port, agent, wav, language=stt_lang)
            if result.get("ok"):
                text = result.get("transcript", "")
                self._set_status(t(lang, "status_sent", agent=agent, text=text))
            else:
                err = result.get("error", "Unknown error")
                self._set_status(t(lang, "status_server_error", error=err))
        except Exception as exc:
            self._set_status(t(lang, "status_upload_failed", error=exc))

    def _set_status(self, text: str):
        self.status_var.set(f"{t(self.ui_lang, 'status_prefix')}{text}")

    def _on_close(self):
        if self.hotkey_listener:
            self.hotkey_listener.stop()
        if self.recorder.is_recording:
            self.recorder.stop()
        self.root.destroy()

    def run(self):
        self.root.mainloop()
