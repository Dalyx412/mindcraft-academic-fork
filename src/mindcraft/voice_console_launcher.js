import { spawn } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '../..');
const voiceConsoleDir = path.join(projectRoot, 'voice-console');
const configPath = path.join(voiceConsoleDir, 'config.json');

const DEFAULT_CONFIG = {
    stt_engine: 'openai',
    openai_api_key: '',
    whisper_model: 'base',
    hotkey_agent_a: 'alt',
    hotkey_agent_b: 'ctrl',
    mindserver_url: 'http://localhost:8080',
    language: 'ja',
    ptt_mock: false,
};

function normalizeLanguage(lang) {
    const key = (lang || '').toLowerCase();
    if (key.startsWith('zh')) return 'zh';
    if (key === 'en' || key === 'ja') return key;
    return null;
}

function syncVoiceConsoleConfig(settings) {
    let config = { ...DEFAULT_CONFIG };
    if (existsSync(configPath)) {
        config = { ...config, ...JSON.parse(readFileSync(configPath, 'utf8')) };
    }
    config.mindserver_url = `http://localhost:${settings.mindserver_port}`;
    const lang = normalizeLanguage(settings.ui_language || settings.language);
    if (lang) {
        config.language = lang;
    }
    writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
}

export function launchVoiceConsole(settings, delayMs = 4000) {
    if (!settings.auto_start_voice_console) {
        return;
    }

    setTimeout(() => {
        try {
            const mainPy = path.join(voiceConsoleDir, 'main.py');
            if (!existsSync(mainPy)) {
                console.warn('[VoiceConsole] voice-console/main.py not found, skipping auto-start.');
                return;
            }

            syncVoiceConsoleConfig(settings);

            const python = process.env.VOICE_CONSOLE_PYTHON || 'python';
            console.log('[VoiceConsole] Starting voice console...');

            const child = spawn(python, [mainPy], {
                cwd: voiceConsoleDir,
                detached: true,
                stdio: 'ignore',
                shell: process.platform === 'win32',
            });
            child.unref();
        } catch (error) {
            console.error('[VoiceConsole] Failed to launch:', error);
        }
    }, delayMs);
}
