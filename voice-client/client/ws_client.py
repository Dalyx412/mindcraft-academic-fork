import asyncio
import base64
import json

import websockets


async def send_voice_upload(
    host: str,
    port: int,
    agent: str,
    wav_bytes: bytes,
    language: str | None = None,
    timeout: float = 60.0,
) -> dict:
    uri = f"ws://{host}:{port}"
    payload = {
        "type": "voice-upload",
        "agent": agent,
        "audio": base64.b64encode(wav_bytes).decode("ascii"),
        "format": "wav",
    }
    if language:
        payload["language"] = language

    async with websockets.connect(uri, open_timeout=10, close_timeout=5) as ws:
        await ws.send(json.dumps(payload))
        raw = await asyncio.wait_for(ws.recv(), timeout=timeout)
        return json.loads(raw)


def send_voice_upload_sync(
    host: str,
    port: int,
    agent: str,
    wav_bytes: bytes,
    language: str | None = None,
) -> dict:
    return asyncio.run(send_voice_upload(host, port, agent, wav_bytes, language))
