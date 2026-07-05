# Mindcraft Web 语音对讲控制台

零安装：浏览器打开 → 授权麦克风 → 按住按钮说话 → Qwen ASR 转录 → 注入 Agent。

## 访问地址

启动 `npm start` 后：

| 入口 | 地址 |
|------|------|
| 本机 | `http://localhost:3099` |
| 手机（推荐） | ngrok HTTPS 链接（启动后自动打开；页面顶部有二维码） |
| WebSocket | 同 host，`/ws` |

端口在 [`settings.js`](../../settings.js) 的 `voice_web_port`（默认 **3099**）。

## ngrok 自动隧道

默认 `ngrok_enabled: true`。`node main.js` 后会：

1. 启动 VoiceWeb 服务（3099）
2. 运行 `ngrok http 3099`
3. 约 4 秒后自动在浏览器打开 **HTTPS 公网 URL**
4. 页面 `/api/share-url` 提供链接；顶部二维码供手机扫码

前置条件：

```bash
ngrok config add-authtoken YOUR_TOKEN
```

关闭 ngrok：`"ngrok_enabled": false`

## 页面按钮

| 按钮 | 行为 |
|------|------|
| **呼叫 小明** | 按住说话 → `@xiaoming` + 转录文本 |
| **呼叫 小红** | 按住说话 → `@xiaohong` + 转录文本 |
| **全员广播** | 按住说话 → 无 `@` 前缀，小明和小红都收到 |

## 分阶段测试

### Phase 1 — HTTP + WebSocket

1. `npm start`
2. 控制台：`VoiceWeb console at http://localhost:3099`
3. `http://localhost:3099/health` → `{"ok":true,"service":"voice-web"}`

### Phase 2 — 录音上传（不调用 STT）

```javascript
"voice_web_log_only": true,
```

### Phase 3 — Qwen ASR + 注入 Agent

```javascript
"voice_web_log_only": false,
```

`keys.json` 中配置 `QWEN_API_KEY`。Agent 进游戏后，MC 公屏显示 `[Voice] Aki, ...` 或 `[Voice] 全员, ...`。

## 文件结构

```
src/voice-web/public/
  index.html   — UI + 二维码 + 广播按钮
  app.js       — MediaRecorder + WebSocket PTT
src/mindcraft/
  voice_web_server.js   — Express + ws + /api/share-url
  voice_upload_handler.js
  ngrok_tunnel.js       — 自动 ngrok 隧道
```
