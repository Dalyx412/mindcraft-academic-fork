import json
import os

CONFIG_PATH = os.path.join(os.path.dirname(__file__), "config.json")

DEFAULT_CONFIG = {
    "stt_engine": "openai",
    "openai_api_key": "",
    "whisper_model": "base",
    "hotkey_agent_a": "alt",
    "hotkey_agent_b": "ctrl",
    "mindserver_url": "http://localhost:8080",
    "language": "ja",
    "ptt_mock": False,
}


def load_config():
    if os.path.isfile(CONFIG_PATH):
        with open(CONFIG_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
        merged = {**DEFAULT_CONFIG, **data}
        return merged
    return dict(DEFAULT_CONFIG)


def save_config(config):
    with open(CONFIG_PATH, "w", encoding="utf-8") as f:
        json.dump(config, f, indent=2, ensure_ascii=False)
