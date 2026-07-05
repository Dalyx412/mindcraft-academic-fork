import io
import wave

import numpy as np
import sounddevice as sd

SAMPLE_RATE = 16000
CHANNELS = 1


class AudioRecorder:
    def __init__(self):
        self.stream = None
        self.frames: list[np.ndarray] = []

    def start(self):
        self.frames = []

        def callback(indata, _frames, _time, _status):
            self.frames.append(indata.copy())

        self.stream = sd.InputStream(
            samplerate=SAMPLE_RATE,
            channels=CHANNELS,
            dtype="float32",
            callback=callback,
        )
        self.stream.start()

    def stop(self) -> bytes:
        if self.stream is None:
            return b""
        self.stream.stop()
        self.stream.close()
        self.stream = None

        if not self.frames:
            return b""

        audio = np.concatenate(self.frames, axis=0)
        pcm = (audio.flatten() * 32767).astype(np.int16)

        buffer = io.BytesIO()
        with wave.open(buffer, "wb") as wf:
            wf.setnchannels(CHANNELS)
            wf.setsampwidth(2)
            wf.setframerate(SAMPLE_RATE)
            wf.writeframes(pcm.tobytes())
        return buffer.getvalue()

    @property
    def is_recording(self) -> bool:
        return self.stream is not None
