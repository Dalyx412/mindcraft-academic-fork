import 'dotenv/config';
import * as Mindcraft from './src/mindcraft/mindcraft.js';
import { launchVoiceConsole } from './src/mindcraft/voice_console_launcher.js';
import { hasKey } from './src/utils/keys.js';
import settings from './settings.js';

// Normalize language settings (legacy `language` → ui_language)
if (!settings.ui_language && settings.language) {
    settings.ui_language = settings.language;
}
if (!settings.logic_language) {
    settings.logic_language = 'en';
}
if (!settings.memory_language) {
    settings.memory_language = 'en';
}
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { readFileSync } from 'fs';

function parseArguments() {
    return yargs(hideBin(process.argv))
        .option('profiles', {
            type: 'array',
            describe: 'List of agent profile paths',
        })
        .option('task_path', {
            type: 'string',
            describe: 'Path to task file to execute'
        })
        .option('task_id', {
            type: 'string',
            describe: 'Task ID to execute'
        })
        .help()
        .alias('help', 'h')
        .parse();
}
const args = parseArguments();
if (args.profiles) {
    settings.profiles = args.profiles;
}
if (args.task_path) {
    let tasks = JSON.parse(readFileSync(args.task_path, 'utf8'));
    if (args.task_id) {
        settings.task = tasks[args.task_id];
        settings.task.task_id = args.task_id;
    }
    else {
        throw new Error('task_id is required when task_path is provided');
    }
}

// these environment variables override certain settings
if (process.env.MINECRAFT_PORT) {
    settings.port = process.env.MINECRAFT_PORT;
}
if (process.env.MINDSERVER_PORT) {
    settings.mindserver_port = process.env.MINDSERVER_PORT;
}
if (process.env.PROFILES && JSON.parse(process.env.PROFILES).length > 0) {
    settings.profiles = JSON.parse(process.env.PROFILES);
}
if (process.env.INSECURE_CODING) {
    settings.allow_insecure_coding = true;
}
if (process.env.BLOCKED_ACTIONS) {
    settings.blocked_actions = JSON.parse(process.env.BLOCKED_ACTIONS);
}
if (process.env.MAX_MESSAGES) {
    settings.max_messages = process.env.MAX_MESSAGES;
}
if (process.env.NUM_EXAMPLES) {
    settings.num_examples = process.env.NUM_EXAMPLES;
}
if (process.env.LOG_ALL) {
    settings.log_all_prompts = process.env.LOG_ALL;
}
if (process.env.SETTINGS_JSON) {
    try {
        Object.assign(settings, JSON.parse(process.env.SETTINGS_JSON));
    } catch (err) {
        console.error("Failed to parse environment variable for SETTINGS_JSON:", err);
    }
}

// Optional: USE_GATEWAY=false falls back to direct-API profiles (non-gateway json)
if (process.env.USE_GATEWAY === 'false' || process.env.USE_GATEWAY === '0') {
    const lang = settings.ui_language || settings.language || '';
    if (String(lang).startsWith('zh')) {
        console.warn(
            'USE_GATEWAY=false ignored for zh-CN: use xiaoming_gateway.json / xiaohong_gateway.json with Gateway API.'
        );
    } else if (String(lang).startsWith('en')) {
        settings.profiles = [
            './profiles/tom.json',
            './profiles/jerry.json',
        ];
    } else {
        settings.profiles = [
            './profiles/aki.json',
            './profiles/haru.json',
        ];
    }
}

// Voice STT: settings.js → .env → auto-detect from keys.json
if (!process.env.VOICE_STT_PROVIDER) {
    if (settings.voice_stt_provider) {
        process.env.VOICE_STT_PROVIDER = settings.voice_stt_provider;
    } else if (hasKey('GATEWAY_API_KEY')) {
        process.env.VOICE_STT_PROVIDER = 'gateway';
    }
}
if (!process.env.QWEN_STT_MODEL && settings.qwen_stt_model) {
    process.env.QWEN_STT_MODEL = settings.qwen_stt_model;
}

function applyGatewayEnv(profile) {
    const out = JSON.parse(JSON.stringify(profile));
    if (out.model?.api !== 'gateway') {
        return out;
    }
    const chatModel = process.env.GATEWAY_MODEL || settings.gateway_model;
    if (chatModel) {
        out.model.model = chatModel;
    }
    const embedModel = process.env.GATEWAY_EMBEDDING_MODEL || settings.gateway_embedding_model;
    if (embedModel && out.embedding?.api === 'gateway') {
        out.embedding.model = embedModel;
    }
    const codeModel = process.env.GATEWAY_CODE_MODEL;
    if (codeModel && out.code_model?.api === 'gateway') {
        out.code_model.model = codeModel;
    }
    const visionModel = process.env.GATEWAY_VISION_MODEL;
    if (visionModel && out.vision_model?.api === 'gateway') {
        out.vision_model.model = visionModel;
    }
    return out;
}

Mindcraft.init(false, settings.mindserver_port, settings.auto_open_ui, settings);

for (let profile of settings.profiles) {
    const profile_json = applyGatewayEnv(JSON.parse(readFileSync(profile, 'utf8')));
    settings.profile = profile_json;
    Mindcraft.createAgent(settings);
}

if (settings.auto_start_voice_console) {
    launchVoiceConsole(settings, settings.voice_console_delay_ms ?? 4000);
}
