import threading

from config import load_config
from ui.i18n import t
from ui.settings_window import SettingsWindow
from voice_console.audio import AudioRecorder
from voice_console.client import MindServerClient
from voice_console.hotkey_listener import HotkeyListener
from voice_console import stt_faster, stt_openai

MC_CHAT_MAX = 256


class VoiceConsoleApp:
    def __init__(self):
        self.config = load_config()
        self.client = MindServerClient(self.config["mindserver_url"])
        self.recorder = AudioRecorder()
        self.hotkey_listener: HotkeyListener | None = None
        self.recording_agent: str | None = None
        self.window: SettingsWindow | None = None

    def _lang(self) -> str:
        if self.window:
            return self.window.get_ui_lang()
        return self.config.get("language", "ja")

    def run(self):
        self.window = SettingsWindow(self)
        self.reconnect()
        self._start_hotkeys()
        self.window.mainloop()

    def apply_config(self, config):
        self.config = config
        url_changed = self.client.url != config["mindserver_url"]
        self.client.url = config["mindserver_url"]
        if url_changed:
            self.reconnect()
        self._restart_hotkeys()

    def reconnect(self):
        try:
            self.client.disconnect()
        except Exception:
            pass
        try:
            self.client.connect()
            if self.window:
                self.window.set_connection_status(True, self.config["mindserver_url"])
        except Exception as exc:
            if self.window:
                self.window.set_connection_status(False, self.config["mindserver_url"])
                self.window.set_status(
                    t(self._lang(), "status_connection_failed", error=exc)
                )

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

    def _restart_hotkeys(self):
        if self.hotkey_listener:
            self.hotkey_listener.stop()
        self._start_hotkeys()

    def _on_ptt_start(self, agent: str):
        self.recording_agent = agent
        lang = self._lang()
        if self.config.get("ptt_mock"):
            if self.window:
                self.window.set_status(t(lang, "status_ptt_mock", agent=agent))
            return
        try:
            self.recorder.start()
            if self.window:
                self.window.set_status(t(lang, "status_recording", agent=agent))
        except Exception as exc:
            if self.window:
                self.window.set_status(t(lang, "status_mic_error", error=exc))

    def _on_ptt_end(self, agent: str):
        threading.Thread(target=self._process_ptt, args=(agent,), daemon=True).start()

    def _process_ptt(self, agent: str):
        lang = self._lang()
        try:
            if self.config.get("ptt_mock"):
                mock_text = t(lang, "mock_command")
                message = f"@{agent} {mock_text}"
            else:
                audio = self.recorder.stop()
                transcript = self._transcribe(audio)
                if not transcript:
                    self._set_status(t(lang, "status_empty_transcription"))
                    return
                message = f"@{agent} {transcript}"

            if len(message) > MC_CHAT_MAX:
                message = message[: MC_CHAT_MAX - 3] + "..."

            if not self.client.connected:
                self.client.connect()

            self.client.send_voice_command(message)
            self._set_status(t(lang, "status_sent", message=message))
        except Exception as exc:
            self._set_status(t(lang, "status_error", error=exc))
        finally:
            self.recording_agent = None

    def _transcribe(self, audio: bytes) -> str:
        lang = self.config.get("language", "ja")
        if self.config.get("stt_engine") == "faster":
            return stt_faster.transcribe(
                self.config.get("whisper_model", "base"), audio, lang
            )
        return stt_openai.transcribe(self.config.get("openai_api_key", ""), audio, lang)

    def _set_status(self, text: str):
        if self.window:
            self.window.after(0, lambda: self.window.set_status(text))

    def shutdown(self):
        if self.hotkey_listener:
            self.hotkey_listener.stop()
        if self.recorder.is_recording:
            self.recorder.stop()
        try:
            self.client.disconnect()
        except Exception:
            pass
