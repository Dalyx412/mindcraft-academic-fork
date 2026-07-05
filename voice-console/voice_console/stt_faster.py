import io
import tempfile

from faster_whisper import WhisperModel

_model: WhisperModel | None = None
_model_name: str | None = None


def _get_model(model_name: str) -> WhisperModel:
    global _model, _model_name
    if _model is None or _model_name != model_name:
        _model = WhisperModel(model_name, device="cpu", compute_type="int8")
        _model_name = model_name
    return _model


def transcribe(model_name: str, audio_wav: bytes, language: str = "ja") -> str:
    if not audio_wav:
        raise ValueError("No audio recorded")

    model = _get_model(model_name)
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=True) as tmp:
        tmp.write(audio_wav)
        tmp.flush()
        segments, _info = model.transcribe(tmp.name, language=language)
        text = " ".join(seg.text.strip() for seg in segments)
    return text.strip()
