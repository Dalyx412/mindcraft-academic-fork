const settings = {
    "minecraft_version": "auto", // auto-detects from server; or set e.g. "1.21.4"
    "host": "127.0.0.1", // or "localhost", "your.ip.address.here"
    "port": 25565, // local dedicated Minecraft server (not LAN); must match server listen port
    "auth": "offline", // or "microsoft"

    // the mindserver manages all agents and hosts the UI
    "mindserver_port": 8080,
    "auto_open_ui": true, // opens UI in browser on startup
    "auto_start_voice_console": false, // Python voice-console disabled; use VoiceWeb / VoiceAudio below

    // Remote lightweight voice client (WebSocket audio upload → host STT via Qwen ASR)
    "voice_audio_enabled": true,
    "voice_audio_port": 8081,
    "voice_audio_host": "0.0.0.0", // bind all interfaces for remote clients
    "voice_stt_provider": "qwen", // "qwen" | "gateway" | "openai"
    "voice_stt_language": null, // null = use ui_language for ASR
    "qwen_stt_model": "qwen3-asr-flash", // Qwen3-ASR-Flash via DashScope compatible-mode

    // Zero-install web voice console (Express + WebSocket + browser MediaRecorder)
    "voice_web_enabled": true,
    "voice_web_port": 3099, // avoid conflict with bot viewer ports 3000+
    "voice_web_host": "0.0.0.0",
    "voice_web_log_only": false, // true = skip STT, log upload size only (Phase 2 test)
    "auto_open_voice_web": true, // auto-open VoiceWeb (ngrok HTTPS URL when enabled)

    // ngrok tunnel for mobile HTTPS microphone access
    "ngrok_enabled": true,
    "ngrok_bin": "ngrok", // or full path to ngrok.exe on Windows
    "ngrok_open_delay_ms": 4000, // wait for VoiceWeb server before starting ngrok
    "ngrok_timeout_ms": 30000,
    
    "base_profile": "survival", // survival, assistant, creative, or god_mode
    "profiles": [
        "./profiles/aki_gateway.json",
        "./profiles/haru_gateway.json",
        // 中文（xiaoming + xiaohong）:
        // "./profiles/xiaoming_gateway.json",
        // "./profiles/xiaohong_gateway.json",
        // 英文后备（Tom + Jerry，对齐中文版设定）:
        // "./profiles/tom_gateway.json",
        // "./profiles/jerry_gateway.json",
    ],

    // Gateway LLM defaults (overridable via .env GATEWAY_MODEL / GATEWAY_EMBEDDING_MODEL)
    "gateway_model": "claude-sonnet-4-6",
    "gateway_embedding_model": "text-embedding-3-small",

    "mention_routing": true, // route public chat via @AgentName; unprefixed chat broadcasts to all agents

    "load_memory": true, // load memory from previous session

    // init_message — 切换语言：注释当前行，取消注释目标行（并同步 profiles / ui_language）
    // 中文（xiaoming + xiaohong，ui_language: zh-CN）
    // "init_message": "新据点建设项目开始了。玩家是队长。目标是在超平坦上建一栋标准规格的房子（7×7，石地板、木墙、门、玻璃窗/玻璃块、木天花板）。出生点有箱子、熔炉和工作台，优先复用这些设施。树林在出生点西边，建筑区在出生点东边，挖矿前必须先去出生点附近的固定矿点并尽量朝西开挖，避开建筑区。对玩家说话不要讲坐标，只说出生点、出生点东边/西边、建筑区、矿点、建房点。用中文报姓名（小明或小红），并说明等队长的 @指示，一句话即可，不要长篇。",
    // 日文（Aki + Haru，ui_language: ja）
    "init_message": "新規拠点建設プロジェクトが始まった。プレイヤーは隊長。目標はスーパーフラット上に標準仕様の家を1棟建てる（7×7、石の床・木の壁・ドア・ガラス窓/ガラスブロック・木の天井）。スポーン地点にはチェスト、かまど、作業台があり、全員で再利用する。木はスポーン地点の西側、建築区はスポーン地点の東側、採掘前は必ずスポーン地点近くの固定採掘地点へ行き、できるだけ西へ掘って建築区を避ける。隊長への自然な会話では座標を言わず、スポーン地点、スポーン地点の東側/西側、建築区、採掘地点、建築地点と呼ぶ。自分の名前（Aki または Haru）を名乗り、隊長の @指示を待つ旨を日本語で一言だけ。長く話さない。",
    // 英文（Tom + Jerry，ui_language: en）
    // "init_message": "New base construction has started. The player is the captain. Goal: build one standard house (7×7, stone floor, wood walls, door, glass panes/blocks, wood ceiling) on superflat. Spawn has a chest, furnace, and crafting table — reuse them first. Trees are west of spawn; the building zone is east of spawn. Before mining, go to the fixed mine site near spawn and dig westward, away from the building zone. Do not say raw coordinates to the captain — use spawn point, east/west of spawn, building zone, mine site, house site. Introduce yourself as Tom or Jerry in English, say you are waiting for the captain's @orders, one short sentence only.",

    "project_world_context": `SERVER WORLD RULES (current classroom prototype; highest priority for location/task behavior):
- These are long-term agent habits. Apply them after memory reset and at every new session, not only to the current saved task state.
- Internal coordinates are allowed for commands, code, memory_bank, and shared_task_state. Human-facing natural-language chat must not expose raw x/y/z coordinates.
- Use natural location labels in the current reply language. Chinese: 出生点, 出生点东边, 出生点西边, 建筑区, 矿点, 建房点. Japanese: スポーン地点, スポーン地点の東側, スポーン地点の西側, 建築区, 採掘地点, 建築地点. English: spawn point, east/west of spawn, building zone, mine site, house site.
- If a command needs coordinates, keep them inside !commands, code, or shared state. Do not write raw coordinates in the natural-language part before a command. If talking to another bot in visible chat, do not include raw coordinates there either; use !sharedTaskState, !selectHouseSite, !goToSharedPlace("house_site"), or shared place names.

Fixed world map:
- Spawn is internally (0, -56, 0). Human-facing label: 出生点 / スポーン地点 / spawn point.
- The spawn area already has the shared chest, furnace, and crafting table. Reuse them. Do not build duplicate basic facilities unless PM explicitly orders it.
- Trees are west of spawn. Default wood gathering route: 出生点西边树林 / スポーン地点の西側の林 / forest west of spawn.
- The building zone is east of spawn. Internally, X > 20 is building zone; default house site must be selected at X > 30 and Y = -56.
- Y = -56 is the ground surface in this superflat world. Do not use normal sea level, Y = 0, or negative Y alone to decide that you are underground or in the sky.
- Ground layers below the surface: 1 layer dirt, 3 layers stone, 1 layer coal, 2 layers sand, then bedrock. Sand is below the coal layer; do not try to mine sand through coal/stone.

Mining protocol:
- Before mining stone, coal, gravel, sand, or underground resources, first go to the fixed mine site using !goToMineSite. Internally this is (6, -60, 3); do not say that coordinate to the PM.
- After reaching the mine site, inspect nearby blocks and collect from the surrounding resource layers.
- Prefer expanding the mine westward from the mine site (toward lower X / 出生点西边) and away from the east building zone. Do not drift into X > 20 / 建筑区 while mining.
- For sand tasks: check/use a pickaxe first; clear the blocking coal/coal_ore layer above the sand before collecting sand. If sand is not directly reachable, mine the coal/stone access block first, then collect sand. Do not keep attempting to mine sand through the coal layer.
- Never mine under the house, inside the building zone, or in random surface spots.
- Keep mining safe: no straight down/up shafts, no digging under your feet, preserve a walkable return route.

House site protocol:
- Before the first build action, choose or reuse one shared house site with !selectHouseSite. Then both agents must check !sharedTaskState and treat that same house_site as fixed.
- house_site is the center/anchor of the one 7x7 standard house unless PM gives a clearer location.
- Save progress with !setSharedTaskField("house_progress", "...") after each major step: floor, walls, door, windows, ceiling, resource shortages.
- Save platform heights with !setSharedTaskField("house_levels", "...") while building. At minimum remember ground/first-floor platform height and any second-floor platform height before continuing upper-level construction.
- Glass panes are preferred but glass blocks are acceptable for window repair/completion; do not stall just because panes are unavailable.
- If PM requests a second floor/upper platform: craft or take ladders first, place a safe ladder route, climb to the remembered platform height, then continue building there. Do not build upper floors from the ground by guessing height.
- All later building, repairs, door/window placement, ceiling work, and resumed tasks must return to !goToSharedPlace("house_site"). Do not silently pick a new building location.
- Human-facing phrase: 建房点已经固定 / 我回建房点继续; 建築地点は固定しました / 建築地点に戻って続けます; house site is fixed / I am returning to the house site. Do not say the coordinate.
`,

    "only_chat_with": [], // users that the bots listen to and send general messages to. if empty it will chat publicly

    // Language layers (see src/utils/language.js)
    "ui_language": "ja", // player-facing chat/TTS (profile.ui_language overrides)
    // "ui_language": "zh-CN", // 中文：xiaoming + xiaohong
    // "ui_language": "en", // 英文后备：tom + jerry
    "logic_language": "en", // LLM history, command matching, bot-to-bot reasoning
    "memory_language": "en", // long-term memory file language
    "language": "ja", // legacy alias for ui_language

    "speak": false,
    // allows all bots to speak through text-to-speech. 
    // specify speech model inside each profile with format: {provider}/{model}/{voice}.
    // if set to "system" it will use basic system text-to-speech. 
    // Works on windows and mac, but linux requires you to install the espeak package through your package manager eg: `apt install espeak` `pacman -S espeak`.

    "chat_ingame": true, // bot responses are shown in minecraft chat
    "render_bot_view": false, // show bot's view in browser at localhost:3000, 3001...

    "allow_insecure_coding": true, // allows newAction command and model can write/run code on your computer. enable at own risk
    "allow_vision": true, // allows vision model to interpret screenshots as inputs
    "blocked_actions" : ["!checkBlueprint", "!checkBlueprintLevel", "!getBlueprint", "!getBlueprintLevel"] , // commands to disable and remove from docs. Ex: ["!setMode"]
    "code_timeout_mins": -1, // minutes code is allowed to run. -1 for no timeout
    "relevant_docs_count": 5, // number of relevant code function docs to select for prompting. -1 for all

    "max_messages": 30, // max number of messages to keep in context
    "num_examples": 2, // number of examples to give to the model
    "max_commands": -1, // max number of commands that can be used in consecutive responses. -1 for no limit
    "show_command_syntax": "none", // "full", "shortened", or "none"
    "narrate_behavior": false, // chat simple automatic actions ('Picking up item!')
    "chat_bot_messages": true, // publicly chat messages to other bots

    "spawn_timeout": 30, // num seconds allowed for the bot to spawn before throwing error. Increase when spawning takes a while.
    "block_place_delay": 0, // delay between placing blocks (ms) if using newAction. helps avoid bot being kicked by anti-cheat mechanisms on servers.
  
    "log_all_prompts": true, // log ALL prompts to file

}

export default settings;
