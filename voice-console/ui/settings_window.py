import customtkinter as ctk

from config import load_config, save_config
from ui.i18n import SUPPORTED_LANGUAGES, t
from voice_console.hotkey_listener import record_hotkey

LANG_LABEL_KEYS = {"zh": "lang_zh", "en": "lang_en", "ja": "lang_ja"}


class SettingsWindow(ctk.CTk):
    def __init__(self, app):
        super().__init__()
        self.app = app
        self.config = load_config()
        self.ui_lang = self._normalize_lang(self.config.get("language", "ja"))

        self.title(t(self.ui_lang, "window_title"))
        self.geometry("500x560")
        ctk.set_appearance_mode("system")
        ctk.set_default_color_theme("blue")

        self._labels = {}
        self._build_ui()
        self._refresh_engine_fields()
        self._apply_ui_language()
        self.protocol("WM_DELETE_WINDOW", self._on_close)

    def _normalize_lang(self, lang: str) -> str:
        lang = (lang or "ja").lower()
        if lang.startswith("zh"):
            return "zh"
        return lang if lang in SUPPORTED_LANGUAGES else "ja"

    def _build_ui(self):
        pad = {"padx": 12, "pady": 6}

        self._labels["recognition_language"] = ctk.CTkLabel(
            self, text="", font=ctk.CTkFont(weight="bold")
        )
        self._labels["recognition_language"].pack(anchor="w", **pad)

        lang_values = [t(self.ui_lang, LANG_LABEL_KEYS[code]) for code in SUPPORTED_LANGUAGES]
        self.lang_code_by_label = {
            t(self.ui_lang, LANG_LABEL_KEYS[code]): code for code in SUPPORTED_LANGUAGES
        }
        self.lang_var = ctk.StringVar(
            value=t(self.ui_lang, LANG_LABEL_KEYS[self.ui_lang])
        )
        self.lang_menu = ctk.CTkOptionMenu(
            self,
            values=lang_values,
            variable=self.lang_var,
            command=self._on_language_changed,
            width=200,
        )
        self.lang_menu.pack(anchor="w", **pad)

        self._labels["stt_engine"] = ctk.CTkLabel(self, text="", font=ctk.CTkFont(weight="bold"))
        self._labels["stt_engine"].pack(anchor="w", **pad)

        self.engine_var = ctk.StringVar(value=self.config.get("stt_engine", "openai"))
        engine_frame = ctk.CTkFrame(self, fg_color="transparent")
        engine_frame.pack(fill="x", **pad)
        self.engine_openai_radio = ctk.CTkRadioButton(
            engine_frame,
            text="",
            variable=self.engine_var,
            value="openai",
            command=self._refresh_engine_fields,
        )
        self.engine_openai_radio.pack(side="left", padx=(0, 16))
        self.engine_faster_radio = ctk.CTkRadioButton(
            engine_frame,
            text="",
            variable=self.engine_var,
            value="faster",
            command=self._refresh_engine_fields,
        )
        self.engine_faster_radio.pack(side="left")

        self._labels["api_key"] = ctk.CTkLabel(self, text="")
        self._labels["api_key"].pack(anchor="w", **pad)
        self.api_key_entry = ctk.CTkEntry(self, show="*", width=400)
        self.api_key_entry.pack(fill="x", **pad)
        self.api_key_entry.insert(0, self.config.get("openai_api_key", ""))

        self._labels["whisper_model"] = ctk.CTkLabel(self, text="")
        self._labels["whisper_model"].pack(anchor="w", **pad)
        self.model_menu = ctk.CTkOptionMenu(
            self, values=["tiny", "base", "small", "medium"], width=200
        )
        self.model_menu.set(self.config.get("whisper_model", "base"))
        self.model_menu.pack(anchor="w", **pad)

        self._labels["mindserver_url"] = ctk.CTkLabel(self, text="")
        self._labels["mindserver_url"].pack(anchor="w", **pad)
        self.url_entry = ctk.CTkEntry(self, width=400)
        self.url_entry.pack(fill="x", **pad)
        self.url_entry.insert(0, self.config.get("mindserver_url", "http://localhost:8080"))

        self._labels["ptt_hotkeys"] = ctk.CTkLabel(self, text="", font=ctk.CTkFont(weight="bold"))
        self._labels["ptt_hotkeys"].pack(anchor="w", padx=12, pady=(16, 6))

        self._hotkey_row("agent_a", "hotkey_agent_a", "hotkey_label_a", "record_btn_a")
        self._hotkey_row("agent_b", "hotkey_agent_b", "hotkey_label_b", "record_btn_b")

        self.mock_var = ctk.BooleanVar(value=self.config.get("ptt_mock", False))
        self.mock_checkbox = ctk.CTkCheckBox(self, text="", variable=self.mock_var)
        self.mock_checkbox.pack(anchor="w", **pad)

        btn_frame = ctk.CTkFrame(self, fg_color="transparent")
        btn_frame.pack(fill="x", **pad)
        self.save_btn = ctk.CTkButton(btn_frame, text="", command=self._save)
        self.save_btn.pack(side="left")
        self.reconnect_btn = ctk.CTkButton(
            btn_frame, text="", command=self.app.reconnect
        )
        self.reconnect_btn.pack(side="left", padx=8)

        self.status_label = ctk.CTkLabel(
            self, text="", text_color="gray", wraplength=460, justify="left"
        )
        self.status_label.pack(anchor="w", **pad)

    def _hotkey_row(self, label_key, config_key, label_attr, btn_attr):
        pad = {"padx": 12, "pady": 4}
        row = ctk.CTkFrame(self, fg_color="transparent")
        row.pack(fill="x", **pad)
        agent_label = ctk.CTkLabel(row, text="", width=80, anchor="w")
        agent_label.pack(side="left")
        setattr(self, f"{label_attr}_title", agent_label)
        hotkey_label = ctk.CTkLabel(row, text=self.config.get(config_key, ""), width=160, anchor="w")
        hotkey_label.pack(side="left", padx=8)
        setattr(self, label_attr, hotkey_label)
        record_btn = ctk.CTkButton(
            row,
            text="",
            width=80,
            command=lambda k=config_key, la=label_attr: self._record_hotkey(k, la),
        )
        record_btn.pack(side="left")
        setattr(self, btn_attr, record_btn)

    def _on_language_changed(self, selected_label: str):
        new_lang = self.lang_code_by_label.get(selected_label, self.ui_lang)
        if new_lang == self.ui_lang:
            return
        self.ui_lang = new_lang
        self._apply_ui_language()

    def _apply_ui_language(self):
        lang = self.ui_lang
        self.title(t(lang, "window_title"))

        label_map = {
            "recognition_language": "recognition_language",
            "stt_engine": "stt_engine",
            "api_key": "api_key",
            "whisper_model": "whisper_model",
            "mindserver_url": "mindserver_url",
            "ptt_hotkeys": "ptt_hotkeys",
        }
        for key, i18n_key in label_map.items():
            self._labels[key].configure(text=t(lang, i18n_key))

        self.engine_openai_radio.configure(text=t(lang, "engine_openai"))
        self.engine_faster_radio.configure(text=t(lang, "engine_faster"))
        self.mock_checkbox.configure(text=t(lang, "mock_ptt"))
        self.save_btn.configure(text=t(lang, "save"))
        self.reconnect_btn.configure(text=t(lang, "reconnect"))

        getattr(self, "hotkey_label_a_title").configure(text=f"{t(lang, 'agent_a')}:")
        getattr(self, "hotkey_label_b_title").configure(text=f"{t(lang, 'agent_b')}:")
        self.record_btn_a.configure(text=t(lang, "record"))
        self.record_btn_b.configure(text=t(lang, "record"))

        lang_values = [t(lang, LANG_LABEL_KEYS[code]) for code in SUPPORTED_LANGUAGES]
        self.lang_code_by_label = {t(lang, LANG_LABEL_KEYS[code]): code for code in SUPPORTED_LANGUAGES}
        self.lang_menu.configure(values=lang_values)
        self.lang_var.set(t(lang, LANG_LABEL_KEYS[lang]))

        if not self.status_label.cget("text") or self.status_label.cget("text").endswith("…"):
            self.set_status(t(lang, "status_starting"))

    def _record_hotkey(self, config_key, label_attr):
        label = getattr(self, label_attr)
        label.configure(text=t(self.ui_lang, "status_press_combo"))
        self.set_status(t(self.ui_lang, "status_recording_hotkey", key=config_key))

        def on_recorded(hotkey, error=None):
            self.after(0, lambda: self._finish_record(config_key, label_attr, hotkey, error))

        record_hotkey(on_recorded)

    def _finish_record(self, config_key, label_attr, hotkey, error):
        label = getattr(self, label_attr)
        if error or not hotkey:
            label.configure(text=self.config.get(config_key, ""))
            self.set_status(t(self.ui_lang, "status_hotkey_failed", error=error))
            return
        self.config[config_key] = hotkey
        label.configure(text=hotkey)
        self.set_status(t(self.ui_lang, "status_hotkey_recorded", hotkey=hotkey))

    def _refresh_engine_fields(self):
        is_openai = self.engine_var.get() == "openai"
        state = "normal" if is_openai else "disabled"
        self.api_key_entry.configure(state=state)
        self._labels["api_key"].configure(
            text_color=("gray10", "gray90") if is_openai else "gray"
        )
        model_state = "normal" if not is_openai else "disabled"
        self.model_menu.configure(state=model_state)
        self._labels["whisper_model"].configure(
            text_color=("gray10", "gray90") if not is_openai else "gray"
        )

    def _save(self):
        self.config["language"] = self.ui_lang
        self.config["stt_engine"] = self.engine_var.get()
        self.config["openai_api_key"] = self.api_key_entry.get().strip()
        self.config["whisper_model"] = self.model_menu.get()
        self.config["mindserver_url"] = self.url_entry.get().strip()
        self.config["ptt_mock"] = self.mock_var.get()
        save_config(self.config)
        self.app.apply_config(self.config)
        self.set_status(t(self.ui_lang, "status_saved"))

    def set_status(self, text: str):
        self.status_label.configure(text=f"{t(self.ui_lang, 'status_prefix')}{text}")

    def set_connection_status(self, connected: bool, url: str):
        if connected:
            self.set_status(t(self.ui_lang, "status_connected", url=url))
        else:
            self.set_status(t(self.ui_lang, "status_disconnected", url=url))

    def get_ui_lang(self) -> str:
        return self.ui_lang

    def _on_close(self):
        self.app.shutdown()
        self.destroy()
