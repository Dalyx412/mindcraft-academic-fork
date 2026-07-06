<h1 align="center">🧠mindcraft⛏️</h1>

> [!Important]
> This repository is a personal modified version of the upstream [mindcraft-bots/mindcraft](https://github.com/mindcraft-bots/mindcraft) project. It is published only for academic research and prototype evaluation, and is not an official upstream Mindcraft release. The upstream MIT license and copyright notice are retained in `LICENSE`.

# Main Changes In This Academic Fork

This section documents the practical differences between this repository and the upstream Mindcraft project. The original upstream README content is kept below for baseline installation notes, Mineflayer behavior, model setup, and upstream capabilities. If there is a conflict, this section and the current repository code should be treated as the source of truth for this fork.

## Project Scope

- This is a personal modified version of upstream `mindcraft-bots/mindcraft`, intended for academic research, classroom prototypes, and human PM experiments with multi-agent Minecraft collaboration.
- The default scenario is no longer general Minecraft automation. It is a "New Base Construction" research scenario where a human captain directs two agents by text or voice to build a standard house together.
- The repository keeps the upstream MIT license notice in `LICENSE`, and this fork should not be presented as an official Mindcraft release.

## Fast Start Path

1. Create `keys.json` in the project root. At minimum, provide `GATEWAY_API_KEY`; add `QWEN_API_KEY` when voice recognition is needed.
2. Start a local Minecraft dedicated server at `127.0.0.1:25565`. A superflat world and offline mode are recommended for repeatable classroom tests.
3. Run `npm install`, then run `npm start` or double-click `启动 Mindcraft.bat`.
4. MindServer opens at `http://localhost:8080`; VoiceWeb opens at `http://localhost:3099` or through an ngrok HTTPS link.
5. In Minecraft chat, use `@Aki ...` / `@Haru ...` by default, or switch profiles and use `@xiaoming ...` / `@xiaohong ...` for the Chinese persona pair.

Example `keys.json`:

```json
{
  "GATEWAY_API_KEY": "your-gateway-key",
  "GATEWAY2_API_KEY": "optional-second-agent-key",
  "QWEN_API_KEY": "your-qwen-stt-key"
}
```

## 1. Default Research Scenario: New Base Construction

Upstream Mindcraft is a general LLM-agent framework for Minecraft. This fork adds a fixed research scenario for observing how a human captain assigns tasks, handles agent coordination failures, corrects misunderstandings, and guides the team toward a completed build.

The `project_world_context` value in `settings.js` is injected into agent prompts and defines these constraints:

- Task goal: build one standard 7x7 house in a superflat world.
- House specification: stone or cobblestone floor, wooden walls, wooden door, at least two window sides, and a wooden ceiling. Glass blocks are acceptable when glass panes are unavailable.
- Site layout: shared chest, furnace, and crafting table near spawn; forest west of spawn; building area east of spawn.
- Mining rule: before collecting underground resources such as stone, coal, or sand, agents should first go to the fixed mine site with `!goToMineSite` and mine westward when possible.
- Safety rule: agents should not dig straight 1x1 vertical shafts, should not dig the block directly under themselves, and should keep a return path to the surface.
- Display rule: when speaking naturally to the player, agents should avoid raw coordinates and use place names such as spawn, building area, mine site, or house site.

This scenario is designed for the research workflow and is not the upstream Mindcraft default.

## 2. Two-Agent Personas And Multilingual Profiles

This fork adds persona profiles that are easier to use in controlled experiments. The default `settings.js` configuration uses the Japanese pair:

- `profiles/aki_gateway.json`: a more reliable execution-focused agent.
- `profiles/haru_gateway.json`: an agent with more visible hesitation and instability, used to simulate coordination pressure.

The repository also includes Chinese and English fallback persona pairs:

- Chinese: `profiles/xiaoming_gateway.json` and `profiles/xiaohong_gateway.json`
- English: `profiles/tom_gateway.json` and `profiles/jerry_gateway.json`

When switching language/persona pairs, update these three settings together:

1. `profiles` in `settings.js`
2. `init_message` in `settings.js`
3. `ui_language` in `settings.js`

Chinese profile example:

```javascript
"profiles": [
  "./profiles/xiaoming_gateway.json",
  "./profiles/xiaohong_gateway.json"
],
"ui_language": "zh-CN"
```

English fallback example:

```javascript
"profiles": [
  "./profiles/tom_gateway.json",
  "./profiles/jerry_gateway.json"
],
"ui_language": "en"
```

Profiles can also be overridden temporarily with an environment variable:

```powershell
$env:PROFILES='["./profiles/xiaoming_gateway.json","./profiles/xiaohong_gateway.json"]'
npm start
```

## 3. Gateway Model Provider

Upstream Mindcraft supports multiple model providers. This fork adds a `gateway` provider in `src/models/gateway.js`. It uses an OpenAI-compatible API shape to route chat, vision, embeddings, and some voice-related capabilities through one gateway.

Default settings in `settings.js`:

```javascript
"gateway_model": "claude-sonnet-4-6",
"gateway_embedding_model": "text-embedding-3-small"
```

Temporary `.env` overrides:

```bash
GATEWAY_MODEL=your-chat-model
GATEWAY_EMBEDDING_MODEL=your-embedding-model
GATEWAY_CODE_MODEL=your-code-model
GATEWAY_VISION_MODEL=your-vision-model
```

The `api_key` field in each profile is not a literal secret. It is the key name to read from `keys.json`, such as `GATEWAY_API_KEY` or `GATEWAY2_API_KEY`. This allows the two agents to use separate gateway keys or channels.

To return to non-gateway direct API profiles, set:

```bash
USE_GATEWAY=false
```

Note: the Chinese profile setup expects gateway profiles; `USE_GATEWAY=false` is ignored for that profile pair.

## 4. @ Mention Routing And Broadcast

In upstream-style multi-agent public chat, all agents can respond to the same message at once. This fork adds `mention_routing`, enabled by default:

```javascript
"mention_routing": true
```

Usage:

- `@Aki collect wood`: only Aki receives the instruction.
- `@Haru go to the mine site`: only Haru receives the instruction.
- `@xiaoming check the shared chest near spawn`: only xiaoming receives the instruction.
- `@xiaohong confirm the house site with xiaoming`: only xiaohong receives the instruction.
- Messages without `@`: broadcast to all agents.

Legacy bot-to-bot messages in the form `(To Agent) ...` are also recognized by the router. Voice input uses the same routing path.

## 5. Shared Task State And Research Commands

This fork adds `src/agent/shared_task_state.js`, which stores shared team information in `bots/shared_task_state.json`. This is runtime state, ignored by `.gitignore`, and should not be committed to the public repository.

Research-scenario commands added or strengthened in this fork:

| Command | Purpose |
|------|------|
| `!sharedTaskState` | Inspect team-level shared state so agents can confirm the house site and progress. |
| `!setSharedTaskField("house_progress", "...")` | Store house-stage progress, such as floor, walls, door, windows, or ceiling. |
| `!setSharedTaskField("house_levels", "...")` | Store second-floor or platform height information so upper-level construction does not rely on guessing. |
| `!rememberSharedPlace("house_site", "house site")` | Save the current position as a shared team place. |
| `!selectHouseSite` | Select or reuse one house site in the building area east of spawn. |
| `!goToSharedPlace("house_site")` | Return to the shared house site and continue construction. |
| `!goToSpawnFacilities` | Go to the shared chest, furnace, and crafting table near spawn. |
| `!goToMineSite` | Go to the fixed mine site before collecting underground resources such as stone, coal, or sand. |

Recommended task flow:

1. The captain assigns a task, such as `@Aki select the house site, then start the floor`.
2. An agent fixes the house site with `!selectHouseSite` or `!rememberSharedPlace("house_site", "...")`.
3. Agents use `!sharedTaskState` to synchronize with teammates.
4. After each build stage, agents save progress with `!setSharedTaskField("house_progress", "...")`.
5. After an interruption, agents should first use `!goToSharedPlace("house_site")` instead of selecting a new site.

## 6. VoiceWeb And Remote Voice Input

This fork adds two voice-entry paths so the captain can directly command agents by voice during classroom or interview-style experiments.

### VoiceWeb: Browser-Based Voice Console

Enabled by default:

```javascript
"voice_web_enabled": true,
"voice_web_port": 3099,
"auto_open_voice_web": true
```

After `npm start`, open:

- Local machine: `http://localhost:3099`
- Phone: the automatically generated ngrok HTTPS link; the page provides a QR code

Page controls:

- `Call Aki / 小明`: hold to speak; the message is automatically prefixed with `@Aki` or `@xiaoming`.
- `Call Haru / 小红`: hold to speak; the message is automatically prefixed with `@Haru` or `@xiaohong`.
- Broadcast: no `@` prefix; all agents receive the message.

Phone microphones usually require HTTPS, so ngrok is enabled by default:

```bash
ngrok config add-authtoken YOUR_TOKEN
```

For local-only testing, disable it:

```javascript
"ngrok_enabled": false
```

### VoiceAudio: Remote Client WebSocket Upload

Default server listener:

```javascript
"voice_audio_enabled": true,
"voice_audio_port": 8081,
"voice_audio_host": "0.0.0.0"
```

The remote client lives in `voice-client/`. Development run:

```powershell
cd voice-client
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

Packaging notes are in `voice-client/BUILD.md`. The remote device uploads audio only and does not store API keys; transcription is performed on the host machine.

### STT Configuration

The default speech-to-text provider is Qwen:

```javascript
"voice_stt_provider": "qwen",
"qwen_stt_model": "qwen3-asr-flash"
```

Provide `QWEN_API_KEY` in `keys.json`. You may also set `voice_stt_provider` to `gateway` or `openai`.

## 7. Multilingual Prompts And Coordinate Hiding

This fork adds `src/utils/language.js`, which separates language behavior into three layers:

- `ui_language`: player-visible chat and voice language; Japanese by default.
- `logic_language`: internal reasoning, command matching, and bot-to-bot logic; English by default.
- `memory_language`: long-term memory file language; English by default.

`src/models/prompter.js` injects `$REPLY_LANGUAGE` and `$WORLD_CONTEXT` into profile prompts. This supports the following behavior:

- Agents can speak naturally to the player in Chinese, Japanese, or English.
- `!command` names, JSON, code, and Minecraft registry IDs remain in English to reduce command failures.
- Player-visible chat hides coordinates, while commands, code, and internal shared state may still use coordinates.

## 8. Windows Launchers And Local Maintenance

This fork adds launch and maintenance scripts for Windows-based local experiments.

### One-Click Launch

Run directly:

```powershell
scripts/start-mindcraft.ps1
```

Or double-click:

```text
启动 Mindcraft.bat
```

To let the script start the Minecraft server automatically, copy the example config:

```powershell
copy launcher.config.example.json launcher.config.json
```

Then edit:

```json
{
  "minecraftServerDir": "C:\\path\\to\\your\\minecraft-server",
  "javaCommand": "java",
  "minecraftPort": 25565,
  "waitForMinecraftSeconds": 90,
  "autoStartMinecraft": true
}
```

### Firewall

When remote voice input needs open ports, run as Administrator:

```powershell
scripts/add-voice-firewall.ps1
```

It adds inbound rules for `3099/tcp` and `8081/tcp`.

### Reset Runtime Agent Memory

To start a new experiment without old runtime memories, stop Mindcraft first, then run:

```powershell
npm run reset:memory:dry
npm run reset:memory
```

Or double-click:

```text
重置 Agent 记忆.bat
```

This tool only clears runtime memories such as `bots/*/memory.json`, `bots/*/histories`, and `bots/shared_task_state.json`. It does not modify `settings.js`, profiles, source code, or templates.

## 9. Public Release Hygiene And Sensitive Data Boundary

The public repository should contain only shareable source code, example configuration, and documentation. The following paths are ignored by `.gitignore`:

- `keys.json`, `.env`
- `.agents/`, `.codex/`, `.cursor/`, `.venv/`
- `node_modules/`
- `bots/**`, `bots/shared_task_state.json`
- `session_logs/**`
- `voice-console/config.json`, `voice-client/config.json`
- `launcher.config.json`
- `originalcode/`

As a result, API keys, agent memories, local voice-client configuration, runtime logs, and local upstream snapshots are not uploaded by normal git updates.

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
   - **MindServer UI** — `http://localhost:8080` (agent management console)
   - **VoiceWeb** — ngrok HTTPS public link for mobile microphone access

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
| **MindServer UI** | `http://localhost:8080` | Agent status and management |
| **VoiceWeb** | `http://localhost:3099` (+ ngrok HTTPS) | Hold-to-talk browser input -> Qwen ASR -> agent chat injection |
| **VoiceAudio** | `ws://localhost:8081` | Remote WebSocket audio upload |

**VoiceWeb page controls:**

- **Aki / Haru** or **xiaoming / xiaohong (小明 / 小红)** — hold the large button to speak; the message is routed with the matching `@` mention
- **Broadcast** — smaller button without an `@` mention; both agents receive the message
- **QR code** — shown at the top of the page so a phone can open the ngrok HTTPS link

STT uses `QWEN_API_KEY` from `keys.json` with the `qwen3-asr-flash` model.

**Automatic browser launch after startup:**

| Time | Action |
|------|------|
| ~3 s | Open MindServer UI (`localhost:8080`) |
| ~4 s | Start ngrok -> open the public VoiceWeb HTTPS link |

Related `settings.js` fields: `ngrok_enabled`, `auto_open_voice_web`, `voice_web_port` (3099).

### Research scenario (New Base Construction)

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
