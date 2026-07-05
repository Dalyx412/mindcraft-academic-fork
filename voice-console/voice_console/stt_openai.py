import io

from openai import OpenAI


def transcribe(api_key: str, audio_wav: bytes, language: str = "ja") -> str:
    if not api_key:
        raise ValueError("OpenAI API key is not configured")
    if not audio_wav:
        raise ValueError("No audio recorded")

    client = OpenAI(api_key=api_key)
    audio_file = io.BytesIO(audio_wav)
    audio_file.name = "recording.wav"

    result = client.audio.transcriptions.create(
        model="whisper-1",
        file=audio_file,
        language=language,
    )
    return (result.text or "").strip()
