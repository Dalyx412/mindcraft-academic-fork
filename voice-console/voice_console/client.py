import socketio


class MindServerClient:
    def __init__(self, url: str):
        self.url = url
        self.sio = socketio.Client(reconnection=True, reconnection_attempts=0)
        self.connected = False

    def connect(self):
        if self.connected:
            return
        self.sio.connect(self.url)
        self.connected = True

    def disconnect(self):
        if self.connected:
            self.sio.disconnect()
            self.connected = False

    def send_voice_command(self, message: str):
        if not self.connected:
            raise RuntimeError("Not connected to MindServer")
        self.sio.emit("voice-command", message)
