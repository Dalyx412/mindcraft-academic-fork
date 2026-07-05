# Mindcraft Voice Client — PyInstaller 打包指南

轻量级远端语音客户端，不含 API Key 与 AI 模型，仅负责录音并通过 WebSocket 上传音频。

## 1. 环境准备

```powershell
cd voice-client
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
pip install pyinstaller
```

## 2. 本地运行（开发模式）

```powershell
python main.py
```

- 在界面填写主机 **公网 IP 或域名** 与 **端口**（默认 `8081`）
- **识别语言**：中文 / English / 日本語（同时切换界面语言，并随音频上传至服务端）
- **PTT 热键**：点击「录制」绑定 Agent A / B 的按住说话键（默认 Alt / Ctrl）
- 点击 **保存设置** 写入 `config.json`
- Windows 全局热键可能需要 **以管理员身份运行**

## 3. 主机端配置

在 [`settings.js`](../settings.js) 中确认：

```javascript
"voice_audio_enabled": true,
"voice_audio_port": 8081,
"voice_audio_host": "0.0.0.0",
```

主机需配置 `keys.json` 中的 `OPENAI_API_KEY`，并在防火墙/路由器放行 `8081/tcp`。

启动 mindcraft：

```powershell
npm start
```

## 4. PyInstaller 单文件打包

在 `voice-client` 目录执行：

```powershell
python -m PyInstaller --onefile --windowed --name MindcraftVoiceClient ^
  --distpath . --workpath build --specpath build ^
  --hidden-import=sounddevice ^
  --hidden-import=numpy ^
  --collect-all sounddevice ^
  main.py
```

输出：[`MindcraftVoiceClient.exe`](MindcraftVoiceClient.exe)（位于 `voice-client` 目录）

重新打包（已有 spec 时）：

```powershell
python -m PyInstaller build\MindcraftVoiceClient.spec --noconfirm --distpath .
copy dist\MindcraftVoiceClient.exe .\MindcraftVoiceClient.exe
```

### 体积优化建议

- 使用 `--onefile` 单 exe，典型体积约 15–30 MB（无 torch/faster-whisper）
- 不要使用 `customtkinter` / `faster-whisper`，本客户端已排除
- 若杀毒软件误报，可对 exe 签名或加入白名单

### 可选：附带默认 config

首次运行会在 exe 同目录生成 `config.json`。也可预置：

```powershell
copy config.example.json dist\config.json
```

## 5. 协议说明

客户端发送 JSON（WebSocket 文本帧）：

```json
{
  "type": "voice-upload",
  "agent": "AgentA",
  "audio": "<base64 WAV 16kHz mono>",
  "format": "wav"
}
```

服务端响应：

```json
{
  "type": "result",
  "ok": true,
  "agent": "AgentA",
  "transcript": "去砍点树",
  "message": "@AgentA 去砍点树",
  "delivered": 1
}
```

成功后 Agent 会在 Minecraft 公屏显示 `[Voice] AgentA, ...` 并执行指令。

## 6. 联调测试

**服务端测试脚本**（mindcraft 运行中）：

```powershell
node voice-client/test-voice-audio-ws.js 127.0.0.1 8081 AgentA
```

使用真实录音文件：

```powershell
$env:VOICE_TEST_WAV="C:\path\to\test.wav"
node voice-client/test-voice-audio-ws.js
```

**端到端**：远端运行 `MindcraftVoiceClient.exe`，填入主机公网 IP:8081，按住热键说话。

## 7. 故障排查

| 现象 | 处理 |
|------|------|
| 连接失败 | 检查防火墙、端口映射、`voice_audio_host` 是否为 `0.0.0.0` |
| OPENAI_API_KEY 错误 | 在主机 `keys.json` 配置密钥 |
| 无 Agent 响应 | 确认 Agent 已进游戏（`in_game`） |
| 热键无效 | Windows 下以管理员运行客户端 |
| 空转录 | 检查麦克风权限与录音时长（建议 >0.5s） |
