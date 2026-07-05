import { createMindServer, registerAgent, numStateListeners, getAgentConnections } from './mindserver.js';
import { createVoiceAudioServer } from './voice_audio_server.js';
import { createVoiceWebServer } from './voice_web_server.js';
import { startNgrokTunnel, stopNgrokTunnel } from './ngrok_tunnel.js';
import { AgentProcess } from '../process/agent_process.js';
import { getServer } from './mcserver.js';
import open from 'open';

let mindserver;
let connected = false;
let agent_processes = {};
let agent_count = 0;
let mindserver_port = 8080;

async function openVoiceWebBrowser(settings) {
    const webPort = settings.voice_web_port ?? 3099;
    const delayMs = settings.ngrok_open_delay_ms ?? 4000;

    setTimeout(async () => {
        let url = `http://localhost:${webPort}`;

        if (settings.ngrok_enabled !== false) {
            const ngrokUrl = await startNgrokTunnel(webPort, {
                bin: settings.ngrok_bin || process.env.NGROK_BIN || 'ngrok',
                timeoutMs: settings.ngrok_timeout_ms ?? 30000,
            });
            if (ngrokUrl) {
                url = ngrokUrl;
            } else {
                console.warn('[VoiceWeb] ngrok unavailable — opening localhost (phone mic needs HTTPS)');
            }
        }

        if (settings.auto_open_voice_web !== false) {
            console.log(`[VoiceWeb] Opening browser: ${url}`);
            open(url);
        }
    }, delayMs);
}

export async function init(host_public=false, port=8080, auto_open_ui=true, settings={}) {
    if (connected) {
        console.error('Already initiliazed!');
        return;
    }
    mindserver = createMindServer(host_public, port);
    mindserver_port = port;
    connected = true;

    if (settings.voice_audio_enabled !== false) {
        createVoiceAudioServer({
            port: settings.voice_audio_port ?? 8081,
            host: settings.voice_audio_host ?? '0.0.0.0',
            language: settings.voice_stt_language || settings.ui_language || settings.language || 'ja',
            getAgentConnections,
        });
    }

    if (settings.voice_web_enabled !== false) {
        createVoiceWebServer({
            port: settings.voice_web_port ?? 3099,
            host: settings.voice_web_host ?? '0.0.0.0',
            language: settings.voice_stt_language || settings.ui_language || settings.language || 'ja',
            getAgentConnections,
            logOnly: settings.voice_web_log_only === true,
        });
        openVoiceWebBrowser(settings);
    }

    if (auto_open_ui) {
        setTimeout(() => {
            // check if browser listener is already open
            if (numStateListeners() === 0) {
                open('http://localhost:'+port);
            }
        }, 3000);
    }
}

export async function createAgent(settings) {
    if (!settings.profile.name) {
        console.error('Agent name is required in profile');
        return {
            success: false,
            error: 'Agent name is required in profile'
        };
    }
    settings = JSON.parse(JSON.stringify(settings));
    let agent_name = settings.profile.name;
    const agentIndex = agent_count++;
    const viewer_port = 3000 + agentIndex;
    registerAgent(settings, viewer_port);
    let load_memory = settings.load_memory || false;
    let init_message = settings.init_message || null;

    try {
        try {
            const server = await getServer(settings.host, settings.port, settings.minecraft_version);
            settings.host = server.host;
            settings.port = server.port;
            settings.minecraft_version = server.version;
        } catch (error) {
            console.warn(`Error getting server:`, error);
            if (settings.minecraft_version === "auto") {
                settings.minecraft_version = null;
            }
            console.warn(`Attempting to connect anyway...`);
        }

        const agentProcess = new AgentProcess(agent_name, mindserver_port);
        agentProcess.start(load_memory, init_message, agentIndex);
        agent_processes[settings.profile.name] = agentProcess;
    } catch (error) {
        console.error(`Error creating agent ${agent_name}:`, error);
        destroyAgent(agent_name);
        return {
            success: false,
            error: error.message
        };
    }
    return {
        success: true,
        error: null
    };
}

export function getAgentProcess(agentName) {
    return agent_processes[agentName];
}

export function startAgent(agentName) {
    if (agent_processes[agentName]) {
        agent_processes[agentName].forceRestart();
    }
    else {
        console.error(`Cannot start agent ${agentName}; not found`);
    }
}

export function stopAgent(agentName) {
    if (agent_processes[agentName]) {
        agent_processes[agentName].stop();
    }
}

export function destroyAgent(agentName) {
    if (agent_processes[agentName]) {
        agent_processes[agentName].stop();
        delete agent_processes[agentName];
    }
}

export function shutdown() {
    console.log('Shutting down');
    stopNgrokTunnel();
    for (let agentName in agent_processes) {
        agent_processes[agentName].stop();
    }
    setTimeout(() => {
        process.exit(0);
    }, 2000);
}
