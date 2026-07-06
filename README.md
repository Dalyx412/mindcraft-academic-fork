<h1 align="center">🧠mindcraft⛏️</h1>

> [!Important]
> This repository is a personal modified version of the upstream [mindcraft-bots/mindcraft](https://github.com/mindcraft-bots/mindcraft) project. It is published only for academic research and prototype evaluation, and is not an official upstream Mindcraft release. The upstream MIT license and copyright notice are retained in `LICENSE`.

# 本个人研究版相对原版 Mindcraft 的主要改动

本章节说明本仓库相对上游 Mindcraft 的功能改动、研究场景扩展和实际使用方式。下面的原版 Mindcraft 文档仍然保留，用于说明基础安装、Mineflayer 行为、模型配置和原项目能力；如果两处说明有冲突，请以本章节和本仓库当前代码为准。

## 版本定位

- 这是基于上游 `mindcraft-bots/mindcraft` 的个人修改版，用于学术研究、课堂原型和人类 PM 指挥多智能体协作实验。
- 本版本的默认目标不是通用 Minecraft 自动化，而是“新据点建设”研究场景：玩家作为队长，通过文字或语音指挥两个 Agent 协作建造一栋标准房屋。
- 本公开发布版保留 MIT License 和上游版权声明；本地曾用于对照的 `originalcode/` 原版快照不包含在公开仓库中，以减少重复代码和发布体积。

## 一句话启动路径

1. 在项目根目录创建 `keys.json`，至少填写 `GATEWAY_API_KEY`；需要语音识别时再填写 `QWEN_API_KEY`。
2. 启动本地 Minecraft dedicated server，监听 `127.0.0.1:25565`，建议使用超平坦世界和 offline mode。
3. 运行 `npm install`，然后运行 `npm start` 或双击 `启动 Mindcraft.bat`。
4. MindServer 会打开 `http://localhost:8080`，VoiceWeb 会打开 `http://localhost:3099` 或 ngrok HTTPS 链接。
5. 在游戏里使用 `@Aki ...` / `@Haru ...`（日文默认）或切换到 `@xiaoming ...` / `@xiaohong ...`（中文配置）来定向指挥。

示例 `keys.json`：

```json
{
  "GATEWAY_API_KEY": "your-gateway-key",
  "GATEWAY2_API_KEY": "optional-second-agent-key",
  "QWEN_API_KEY": "your-qwen-stt-key"
}
```

## 1. 默认研究场景：新据点建设

原版 Mindcraft 更偏向通用的 Minecraft LLM agent 框架。本版本加入了固定研究任务背景，用来观察人类队长如何分配任务、处理 Agent 协作失败、纠正误解并推动建造完成。

当前 `settings.js` 中的 `project_world_context` 会注入到 Agent prompt，约束以下行为：

- 任务目标：在超平坦世界中完成一栋标准 7x7 房屋。
- 房屋规格：石头或圆石地板、木墙、木门、至少两面窗户、木天花板；玻璃板不足时玻璃块也可算作完成。
- 场地规则：出生点附近有共享箱子、熔炉、工作台；树林在出生点西侧；建筑区在出生点东侧。
- 挖矿规则：挖石头、煤、沙子等地下资源前，必须先去固定矿点 `!goToMineSite`，并尽量向西开挖，避免进入建筑区。
- 安全规则：禁止直上直下挖 1x1 竖井，不能挖脚下方块，必须保持可返回地面的通道。
- 展示规则：Agent 与玩家自然对话时不要暴露原始坐标，只说“出生点”“建筑区”“矿点”“建房点”等自然地点名。

这套设定主要服务研究过程，不是上游 Mindcraft 的默认玩法。

## 2. 双 Agent 角色与多语言配置

本 fork 增加了更适合实验的角色配置。默认 `settings.js` 使用日文版本：

- `profiles/aki_gateway.json`：较可靠、执行型 Agent。
- `profiles/haru_gateway.json`：带有更明显的不稳定/犹豫行为，用于模拟协作压力。

仓库还提供中文与英文后备角色：

- 中文：`profiles/xiaoming_gateway.json` 与 `profiles/xiaohong_gateway.json`
- 英文：`profiles/tom_gateway.json` 与 `profiles/jerry_gateway.json`

切换语言时，需要同步修改三处：

1. `settings.js` 的 `profiles`
2. `settings.js` 的 `init_message`
3. `settings.js` 的 `ui_language`

中文示例：

```javascript
"profiles": [
  "./profiles/xiaoming_gateway.json",
  "./profiles/xiaohong_gateway.json"
],
"ui_language": "zh-CN"
```

英文后备示例：

```javascript
"profiles": [
  "./profiles/tom_gateway.json",
  "./profiles/jerry_gateway.json"
],
"ui_language": "en"
```

也可以临时用环境变量覆盖 profile：

```powershell
$env:PROFILES='["./profiles/xiaoming_gateway.json","./profiles/xiaohong_gateway.json"]'
npm start
```

## 3. Gateway 模型通道

原版 Mindcraft 支持多个模型 provider。本版本额外加入了 `gateway` provider：`src/models/gateway.js`。它使用 OpenAI-compatible API 形式，将聊天、视觉、embedding 和部分语音相关能力统一到一个网关。

默认配置在 `settings.js`：

```javascript
"gateway_model": "claude-sonnet-4-6",
"gateway_embedding_model": "text-embedding-3-small"
```

可通过 `.env` 临时覆盖：

```bash
GATEWAY_MODEL=your-chat-model
GATEWAY_EMBEDDING_MODEL=your-embedding-model
GATEWAY_CODE_MODEL=your-code-model
GATEWAY_VISION_MODEL=your-vision-model
```

每个 profile 中的 `api_key` 字段不是实际密钥，而是 `keys.json` 中的键名。例如 `GATEWAY_API_KEY` 或 `GATEWAY2_API_KEY`。这样可以让两个 Agent 使用不同网关 key 或通道。

如果需要回到非 gateway 的直接 API profile，可设置：

```bash
USE_GATEWAY=false
```

注意：中文配置强依赖 gateway profile；`USE_GATEWAY=false` 对中文会被忽略。

## 4. @ 提及路由与广播

原版多 Agent 公屏聊天容易让所有 Agent 同时响应。本版本加入 `mention_routing`，默认开启：

```javascript
"mention_routing": true
```

用法：

- `@Aki 木を集めて`：只有 Aki 收到。
- `@Haru 採掘地点に行って`：只有 Haru 收到。
- `@xiaoming 去出生点箱子看看`：只有小明收到。
- `@xiaohong 跟小明确认建房点`：只有小红收到。
- 不带 `@` 的消息：广播给所有 Agent。

Bot 之间的旧式 `(To Agent) ...` 消息也会被路由器识别。语音输入同样走这套路由逻辑。

## 5. 共享任务状态与研究用命令

本版本新增 `src/agent/shared_task_state.js`，把团队共享信息保存到 `bots/shared_task_state.json`。该文件是运行时状态，已被 `.gitignore` 排除，不会进入公开仓库。

新增或强化的研究场景命令包括：

| 命令 | 用途 |
|------|------|
| `!sharedTaskState` | 查看团队共享状态，供 Agent 确认建房点和进度 |
| `!setSharedTaskField("house_progress", "...")` | 保存房屋阶段进度，例如地板、墙、门、窗、天花板 |
| `!setSharedTaskField("house_levels", "...")` | 保存二层或平台高度，避免上层施工靠猜 |
| `!rememberSharedPlace("house_site", "建房点")` | 把当前位置保存为全队共享地点 |
| `!selectHouseSite` | 在出生点东侧建筑区选择或复用唯一建房点 |
| `!goToSharedPlace("house_site")` | 回到共享建房点继续施工 |
| `!goToSpawnFacilities` | 去出生点共享箱子、熔炉、工作台 |
| `!goToMineSite` | 去固定矿点，之后再采集石头、煤、沙子等地下资源 |

推荐任务流程：

1. 队长指定任务，例如 `@Aki 建房点确定后先铺地板`。
2. Agent 用 `!selectHouseSite` 或 `!rememberSharedPlace("house_site", "...")` 固定建房点。
3. Agent 用 `!sharedTaskState` 与队友同步。
4. 每完成一个阶段，用 `!setSharedTaskField("house_progress", "...")` 保存进度。
5. 中断后继续时，先 `!goToSharedPlace("house_site")`，不要重新选地点。

## 6. VoiceWeb 与远程语音输入

本版本新增两个语音入口，适合课堂或访谈实验中让队长用语音直接指挥 Agent。

### VoiceWeb：浏览器零安装语音控制台

默认开启：

```javascript
"voice_web_enabled": true,
"voice_web_port": 3099,
"auto_open_voice_web": true
```

启动 `npm start` 后打开：

- 本机：`http://localhost:3099`
- 手机：ngrok 自动生成的 HTTPS 链接，页面顶部提供二维码

页面按钮：

- “呼叫 Aki / 小明”：按住说话，自动加 `@Aki` 或 `@xiaoming`
- “呼叫 Haru / 小红”：按住说话，自动加 `@Haru` 或 `@xiaohong`
- “全员广播”：不加 `@`，所有 Agent 都收到

手机麦克风通常需要 HTTPS，因此默认启用 ngrok：

```bash
ngrok config add-authtoken YOUR_TOKEN
```

如果只在本机测试，可关闭：

```javascript
"ngrok_enabled": false
```

### VoiceAudio：远程客户端 WebSocket 上传

默认服务端监听：

```javascript
"voice_audio_enabled": true,
"voice_audio_port": 8081,
"voice_audio_host": "0.0.0.0"
```

远程客户端代码在 `voice-client/`。开发运行：

```powershell
cd voice-client
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

打包说明见 `voice-client/BUILD.md`。远程设备只上传音频，不保存 API key；识别在主机端完成。

### STT 配置

默认语音识别 provider 是 Qwen：

```javascript
"voice_stt_provider": "qwen",
"qwen_stt_model": "qwen3-asr-flash"
```

需要在 `keys.json` 中提供 `QWEN_API_KEY`。也可把 `voice_stt_provider` 改成 `gateway` 或 `openai`。

## 7. 多语言 prompt 与坐标隐藏

本版本新增 `src/utils/language.js`，把语言分成三层：

- `ui_language`：玩家可见聊天和语音语言，默认日文。
- `logic_language`：Agent 内部推理、命令匹配和 Bot 间逻辑，默认英文。
- `memory_language`：长期记忆文件语言，默认英文。

`src/models/prompter.js` 会把 `$REPLY_LANGUAGE` 和 `$WORLD_CONTEXT` 注入到 profile prompt。这样可以做到：

- 对玩家用中文、日文或英文自然交流。
- `!command` 名称、JSON、代码和 Minecraft registry id 仍保持英文，减少命令失败。
- 人类可见聊天隐藏坐标；命令、代码和共享状态内部仍可使用坐标。

## 8. Windows 一键启动与本地维护

本 fork 加入了更适合 Windows 本地实验的启动和维护脚本。

### 一键启动

可直接运行：

```powershell
scripts/start-mindcraft.ps1
```

或双击：

```text
启动 Mindcraft.bat
```

如果希望脚本自动启动 Minecraft server，复制示例配置：

```powershell
copy launcher.config.example.json launcher.config.json
```

然后修改：

```json
{
  "minecraftServerDir": "C:\\path\\to\\your\\minecraft-server",
  "javaCommand": "java",
  "minecraftPort": 25565,
  "waitForMinecraftSeconds": 90,
  "autoStartMinecraft": true
}
```

### 防火墙

远程语音需要开放端口时，以管理员身份运行：

```powershell
scripts/add-voice-firewall.ps1
```

它会添加 `3099/tcp` 和 `8081/tcp` 入站规则。

### 重置 Agent 运行记忆

为了开始新一轮实验而不带旧任务记忆，可先停止 Mindcraft，再运行：

```powershell
npm run reset:memory:dry
npm run reset:memory
```

也可双击：

```text
重置 Agent 记忆.bat
```

该工具只清理运行态记忆，如 `bots/*/memory.json`、`bots/*/histories`、`bots/shared_task_state.json`；不会改 `settings.js`、profiles、源码或模板。

## 9. 发布版清理与敏感信息边界

公开仓库中应只包含可分享的源码、配置示例和文档。以下内容被 `.gitignore` 排除：

- `keys.json`、`.env`
- `.agents/`、`.codex/`、`.cursor/`、`.venv/`
- `node_modules/`
- `bots/**`、`bots/shared_task_state.json`
- `session_logs/**`
- `voice-console/config.json`、`voice-client/config.json`
- `launcher.config.json`
- `originalcode/`

因此，API key、Agent 记忆、语音客户端本地配置、运行日志和原版源码快照不会随正常 git 更新上传。

<h1 align="center">
  <a href="https://trendshift.io/repositories/9163" target="_blank"><img src="https://trendshift.io/api/badge/repositories/9163" alt="kolbytn%2Fmindcraft | Trendshift" style="width: 250px; height: 55px;" width="250" height="55"/></a>
</h1>

<p align="center">Crafting minds for Minecraft with LLMs and <a href="https://prismarinejs.github.io/mineflayer/#/">Mineflayer!</a></p>

<p align="center">
  <a href="https://github.com/mindcraft-bots/mindcraft/blob/main/FAQ.md">FAQ</a> | 
  <a href="https://discord.gg/mp73p35dzC">Discord Support</a> | 
  <a href="https://www.youtube.com/watch?v=gRotoL8P8D8">Video Tutorial</a> | 
  <a href="https://kolbynottingham.com/mindcraft/">Blog Post</a> | 
  <a href="https://mindcraft-minecollab.github.io/index.html">Paper Website</a> | 
  <a href="https://github.com/mindcraft-bots/mindcraft/blob/main/minecollab.md">MineCollab</a>
</p>

> [!Caution]
Do not connect this bot to public servers with coding enabled. This project allows an LLM to write/execute code on your computer. The code is sandboxed, but still vulnerable to injection attacks. Code writing is disabled by default, you can enable it by setting `allow_insecure_coding` to `true` in `settings.js`. Ye be warned.

# Getting Started
## Requirements

- [Minecraft Java Edition](https://www.minecraft.net/en-us/store/minecraft-java-bedrock-edition-pc) (up to v1.21.11, recommend v1.21.6)
- [Node.js Installed](https://nodejs.org/) (Node v18 or v20 LTS recommended. Node v24+ may cause issues with native dependencies)
- At least one API key from a supported API provider. See [supported APIs](#model-customization). OpenAI is the default.

> [!Important]
> If installing node on windows, ensure you check `Automatically install the necessary tools`
>
> If you encounter `npm install` errors on macOS, see the [FAQ](FAQ.md#common-issues) for troubleshooting native module build issues

## Install and Run

1. Make sure you have the requirements above.

2. Clone or download this repository.

3. Create `keys.json` in the project root with at least `GATEWAY_API_KEY` (see [Gateway setup](#gateway-setup-default) below). Optional `.env` overrides are documented in `.env.example`.

4. Run `npm install` from the project directory.

5. Start a **local dedicated Minecraft server** listening on port **25565** (offline mode is fine). Load your superflat world on that server.

6. Run `node main.js` (or `npm start`). Two default agents (`Aki`, `Haru`) connect via Gateway using `claude-sonnet-4-6`.

7. Two browser tabs open automatically (~3–4 s after start):
   - **MindServer UI** — `http://localhost:8080` (agent 管理控制台)
   - **VoiceWeb** — ngrok HTTPS 公网链接（手机可用麦克风；见下方）

If you encounter issues, check the [FAQ](FAQ.md) or find support on [discord](https://discord.gg/mp73p35dzC).

### Prerequisites: ngrok (mobile voice)

Install [ngrok](https://ngrok.com/) and authenticate once:

```bash
ngrok config add-authtoken YOUR_TOKEN
```

With `ngrok_enabled: true` in `settings.js` (default), mindcraft starts `ngrok http 3099` automatically and opens the **HTTPS** VoiceWeb URL in your browser. The VoiceWeb page shows a **QR code** — scan it on your phone to open the same URL.

Disable ngrok (local-only testing): set `"ngrok_enabled": false` in `settings.js`.

### Gateway setup (default)

This fork defaults to the unified **Gateway** API (`src/models/gateway.js`). Configure in `keys.json`:

```json
{
    "GATEWAY_API_KEY": "your-gateway-key",
    "QWEN_API_KEY": "your-qwen-key"
}
```

`GATEWAY_API_KEY` powers chat/coding/vision. `QWEN_API_KEY` powers voice STT only.

Defaults in `settings.js` (override via `.env` if needed):

| Setting | Default |
|---------|---------|
| Chat model | `claude-sonnet-4-6` |
| Embedding | `text-embedding-3-small` (falls back to chat API if unavailable) |
| STT (voice) | `qwen3-asr-flash` via `QWEN_API_KEY` |
| Agent profiles | `profiles/aki_gateway.json`, `profiles/haru_gateway.json` |

To use direct Qwen profiles instead (Japanese only), set `USE_GATEWAY=false` in `.env` or change `settings.js` profiles to `aki.json` / `haru.json` and add `QWEN_API_KEY`.

### Minecraft connection

| `settings.js` | Value | Notes |
|---------------|-------|-------|
| `host` | `127.0.0.1` | Local dedicated server |
| `port` | `25565` | Must match server listen port |
| `auth` | `offline` | Bots join as offline players |

**Startup order:** start the Minecraft server first, then `node main.js`.

### Dual-agent @ routing

With `mention_routing: true` (default):

- `@Aki ...` — only Aki receives the message
- `@Haru ...` — only Haru receives the message
- `@xiaoming ...` / `@xiaohong ...` — Chinese profile equivalents after switching profiles
- No `@` prefix — broadcast to both agents

### Voice input (VoiceWeb / VoiceAudio)

Python `voice-console/` is **disabled** by default (`auto_start_voice_console: false`).

| Service | URL / port | Purpose |
|---------|------------|---------|
| **MindServer UI** | `http://localhost:8080` | Agent 状态与管理 |
| **VoiceWeb** | `http://localhost:3099` (+ ngrok HTTPS) | 浏览器按住说话 → Qwen ASR → 注入 Agent |
| **VoiceAudio** | `ws://localhost:8081` | 远程 WebSocket 音频上传 |

**VoiceWeb 页面功能：**

- **小明 / 小红** — 大按钮按住说话，带 `@` 路由到对应 agent
- **全员广播** — 较小按钮，不带 `@`，两位 agent 都会收到
- **二维码** — 页面顶部，手机扫码打开 ngrok HTTPS 链接（手机麦克风必需 HTTPS）

STT 使用 `keys.json` 中的 `QWEN_API_KEY`，模型 `qwen3-asr-flash`。

**启动后自动打开：**

| 时间 | 动作 |
|------|------|
| ~3 s | 打开 MindServer UI (`localhost:8080`) |
| ~4 s | 启动 ngrok → 打开 VoiceWeb 公网 HTTPS 链接 |

相关 `settings.js` 项：`ngrok_enabled`, `auto_open_voice_web`, `voice_web_port` (3099).

### Research scenario (新規拠点建設)

Two agents with contrasting behavior: **Aki** (reliable executor) and **Haru** (intentional “wobble”). The PM (human player) commands via `@` mentions. Chinese equivalents are **xiaoming / 小明** and **xiaohong / 小红** after switching profiles.

To switch language/persona pairs, swap `profiles`, `init_message`, and `ui_language` in `settings.js` (see comments in that file).


# Configuration
## Model Customization

You can configure project details in `settings.js`. [See file.](settings.js)

You can configure the agent's name, model, and prompts in their profile like `profiles/tomo.json`. The model can be specified with the `model` field, with values like `model: "gemini-2.5-pro"`. You will need the correct API key for the API provider you choose. See all supported APIs below.

<details>
<summary><strong>⭐ VIEW SUPPORTED APIs ⭐</strong></summary>

| API Name | Config Variable| Docs |
|------|------|------|
| `openai` | `OPENAI_API_KEY` | [docs](https://platform.openai.com/docs/models) |
| `google` | `GEMINI_API_KEY` | [docs](https://ai.google.dev/gemini-api/docs/models/gemini) |
| `anthropic` | `ANTHROPIC_API_KEY` | [docs](https://docs.anthropic.com/claude/docs/models-overview) |
| `xai` | `XAI_API_KEY` | [docs](https://docs.x.ai/docs) |
| `deepseek` | `DEEPSEEK_API_KEY` | [docs](https://api-docs.deepseek.com/) |
| `ollama` (local) | n/a | [docs](https://ollama.com/library) |
| `qwen` | `QWEN_API_KEY` | [Intl.](https://www.alibabacloud.com/help/en/model-studio/developer-reference/use-qwen-by-calling-api)/[cn](https://help.aliyun.com/zh/model-studio/getting-started/models) |
| `mistral` | `MISTRAL_API_KEY` | [docs](https://docs.mistral.ai/getting-started/models/models_overview/) |
| `replicate` | `REPLICATE_API_KEY` | [docs](https://replicate.com/collections/language-models) |
| `groq` (not grok) | `GROQCLOUD_API_KEY` | [docs](https://console.groq.com/docs/models) |
| `huggingface` | `HUGGINGFACE_API_KEY` | [docs](https://huggingface.co/models) |
| `novita` | `NOVITA_API_KEY` | [docs](https://novita.ai/model-api/product/llm-api?utm_source=github_mindcraft&utm_medium=github_readme&utm_campaign=link) |
| `openrouter` | `OPENROUTER_API_KEY` | [docs](https://openrouter.ai/models) |
| `glhf` | `GHLF_API_KEY` | [docs](https://glhf.chat/user-settings/api) |
| `hyperbolic` | `HYPERBOLIC_API_KEY` | [docs](https://docs.hyperbolic.xyz/docs/getting-started) |
| `vllm` | n/a | n/a |
| `cerebras` | `CEREBRAS_API_KEY` | [docs](https://inference-docs.cerebras.ai/introduction) |
| `mercury` | `MERCURY_API_KEY` | [docs](https://www.inceptionlabs.ai/) |
| `gateway` | `GATEWAY_API_KEY` | OpenAI-compatible unified gateway (this fork's default) |

</details>

For more comprehensive model configuration and syntax, see [Model Specifications](#model-specifications).

For local models we support [ollama](https://ollama.com/) and we provide our own finetuned models for you to use. 
To install our models, install ollama and run the following terminal command:
```bash
ollama pull sweaterdog/andy-4:micro-q8_0 && ollama pull embeddinggemma
```

## Online Servers
To connect to online servers your bot will need an official Microsoft/Minecraft account. You can use your own personal one, but will need another account if you want to connect too and play with it. To connect, change these lines in `settings.js`:
```javascript
"host": "111.222.333.444",
"port": 55920,
"auth": "microsoft",

// rest is same...
```
> [!Important]
> The bot's name in the profile.json must exactly match the Minecraft profile name! Otherwise the bot will spam talk to itself.

To use different accounts, Mindcraft will connect with the account that the Minecraft launcher is currently using. You can switch accounts in the launcher, then run `node main.js`, then switch to your main account after the bot has connected.

## Tasks

Tasks automatically start the bot with a prompt and a goal item to aquire or blueprint to construct. To run a simple task that involves collecting 4 oak_logs run 

`node main.js --task_path tasks/basic/single_agent.json --task_id gather_oak_logs`

Here is an example task json format: 

```
{
    "gather_oak_logs": {
      "goal": "Collect at least four logs",
      "initial_inventory": {
        "0": {
          "wooden_axe": 1
        }
      },
      "agent_count": 1,
      "target": "oak_log",
      "number_of_target": 4,
      "type": "techtree",
      "max_depth": 1,
      "depth": 0,
      "timeout": 300,
      "blocked_actions": {
        "0": [],
        "1": []
      },
      "missing_items": [],
      "requires_ctable": false
    }
}
```

The `initial_inventory` is what the bot will have at the start of the episode, `target` refers to the target item and `number_of_target` refers to the number of target items the agent needs to collect to successfully complete the task. 

If you want more optimization and automatic launching of the minecraft world, you will need to follow the instructions in [Minecollab Instructions](minecollab.md#installation)

## Docker Container

If you intend to `allow_insecure_coding`, it is a good idea to run the app in a docker container to reduce risks of running unknown code. This is strongly recommended before connecting to remote servers, although still does not guarantee complete safety.

```bash
docker build -t mindcraft . && docker run --rm --add-host=host.docker.internal:host-gateway -p 8080:8080 -p 3000-3003:3000-3003 -e SETTINGS_JSON='{"auto_open_ui":false,"profiles":["./profiles/gemini.json"],"host":"host.docker.internal"}' --volume ./keys.json:/app/keys.json --name mindcraft mindcraft
```
or simply
```bash
docker-compose up --build
```

When running in docker, if you want the bot to join your local minecraft server, you have to use a special host address `host.docker.internal` to call your localhost from inside your docker container. Put this into your [settings.js](settings.js):

```javascript
"host": "host.docker.internal", // instead of "localhost", to join your local minecraft from inside the docker container
```

To connect to an unsupported minecraft version, you can try to use [viaproxy](services/viaproxy/README.md)

# Bot Profiles

Bot profiles are json files (such as `profiles/tomo.json`) that define:

1. Bot backend LLMs to use for talking, coding, and embedding.
2. Prompts used to influence the bot's behavior.
3. Examples help the bot perform tasks.

## Model Specifications

LLM models can be specified simply as `"model": "gpt-4o"`, or more specifically with `"{api}/{model}"`, like `"openrouter/google/gemini-2.5-pro"`. See all supported APIs [here](#model-customization).

The `model` field can be a string or an object. A model object must specify an `api`, and optionally a `model`, `url`, and additional `params`. You can also use different models/providers for chatting, coding, vision, embedding, and voice synthesis. See the example below.

```json
"model": {
  "api": "openai",
  "model": "gpt-4o",
  "url": "https://api.openai.com/v1/",
  "params": {
    "max_tokens": 1000,
    "temperature": 1
  }
},
"code_model": {
  "api": "openai",
  "model": "gpt-4",
  "url": "https://api.openai.com/v1/"
},
"vision_model": {
  "api": "openai",
  "model": "gpt-4o",
  "url": "https://api.openai.com/v1/"
},
"embedding": {
  "api": "openai",
  "url": "https://api.openai.com/v1/",
  "model": "text-embedding-ada-002"
},
"speak_model": "openai/tts-1/echo"
```

`model` is used for chat, `code_model` is used for newAction coding, `vision_model` is used for image interpretation, `embedding` is used to embed text for example selection, and `speak_model` is used for voice synthesis. `model` will be used by default for all other models if not specified. Not all APIs support embeddings, vision, or voice synthesis.

All apis have default models and urls, so those fields are optional. The `params` field is optional and can be used to specify additional parameters for the model. It accepts any key-value pairs supported by the api. Is not supported for embedding models.

## Embedding Models

Embedding models are used to embed and efficiently select relevant examples for conversation and coding.

Supported Embedding APIs: `openai`, `google`, `replicate`, `huggingface`, `novita`

If you try to use an unsupported model, then it will default to a simple word-overlap method. Expect reduced performance. We recommend using supported embedding APIs.

## Voice Synthesis Models

Voice synthesis models are used to narrate bot responses and specified with `speak_model`. This field is parsed differently than other models and only supports strings formatted as `"{api}/{model}/{voice}"`, like `"openai/tts-1/echo"`. We only support `openai` and `google` for voice synthesis.

## Specifying Profiles via Command Line

By default, the program will use the profiles specified in `settings.js`. You can specify one or more agent profiles using the `--profiles` argument: `node main.js --profiles ./profiles/andy.json ./profiles/jill.json`


# Contributing

We welcome contributions to the project! We are generally less responsive to github issues, and more responsive to pull requests. Join the [discord](https://discord.gg/mp73p35dzC) for more active support and direction.

While AI generated code is allowed, please vet it carefully. Submitting tons of sloppy code and documentation actively harms development.

## Patches

Some of the node modules that we depend on have bugs in them. To add a patch, change your local node module file and run `npx patch-package [package-name]`

## Development Team
Thanks to all who contributed to the project, especially the official development team: [@MaxRobinsonTheGreat](https://github.com/MaxRobinsonTheGreat), [@kolbytn](https://github.com/kolbytn), [@icwhite](https://github.com/icwhite), [@Sweaterdog](https://github.com/Sweaterdog), [@Ninot1Quyi](https://github.com/Ninot1Quyi), [@riqvip](https://github.com/riqvip), [@uukelele-scratch](https://github.com/uukelele-scratch), [@mrelmida](https://github.com/mrelmida)


## Citation:
This work is published in the paper [Collaborating Action by Action: A Multi-agent LLM Framework for Embodied Reasoning](https://arxiv.org/abs/2504.17950). Please use this citation if you use this project in your research:
```
@article{mindcraft2025,
  title = {Collaborating Action by Action: A Multi-agent LLM Framework for Embodied Reasoning},
  author = {White*, Isadora and Nottingham*, Kolby and Maniar, Ayush and Robinson, Max and Lillemark, Hansen and Maheshwari, Mehul and Qin, Lianhui and Ammanabrolu, Prithviraj},
  journal = {arXiv preprint arXiv:2504.17950},
  year = {2025},
  url = {https://arxiv.org/abs/2504.17950},
}
```
