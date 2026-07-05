import { transcribeAudioBuffer } from './voice_stt.js';
import { buildVoiceMessage, dispatchVoiceCommand } from './voice_dispatch.js';

const FORMAT_EXT = {
    wav: 'wav',
    webm: 'webm',
    mp4: 'mp4',
    mpeg: 'mp3',
    ogg: 'ogg',
};

/**
 * @param {import('ws').WebSocket} ws
 * @param {object} payload
 * @param {string} [defaultLanguage]
 * @param {() => Record<string, object>} getAgentConnections
 * @param {{ logOnly?: boolean }} [options] Phase 2: logOnly skips STT/dispatch
 */
export const BROADCAST_AGENT = '__broadcast__';

export async function handleVoiceUpload(ws, payload, defaultLanguage, getAgentConnections, options = {}) {
    if (payload?.type !== 'voice-upload') {
        sendJson(ws, { type: 'error', ok: false, error: 'Expected type "voice-upload"' });
        return;
    }

    const agent = normalizeAgent(payload.agent, getAgentConnections);
    if (!agent) {
        sendJson(ws, { type: 'error', ok: false, error: 'Invalid agent. Use a registered agent name or broadcast.' });
        return;
    }

    const audioBuffer = decodeAudio(payload);
    if (!audioBuffer) {
        sendJson(ws, { type: 'error', ok: false, error: 'Missing or invalid audio payload' });
        return;
    }

    const format = (payload.format || 'wav').toLowerCase();
    const ext = FORMAT_EXT[format] || format;
    const lang = payload.language || defaultLanguage || undefined;
    const isBroadcast = agent === BROADCAST_AGENT;

    console.log(
        `[VoiceUpload] Received ${audioBuffer.length} bytes (${ext}) for ${isBroadcast ? 'broadcast' : agent}` +
            (lang ? ` lang=${lang}` : '')
    );

    if (options.logOnly) {
        sendJson(ws, {
            type: 'result',
            ok: true,
            agent: isBroadcast ? 'broadcast' : agent,
            bytes: audioBuffer.length,
            format: ext,
            logOnly: true,
        });
        return;
    }

    const transcript = await transcribeAudioBuffer(audioBuffer, lang, `recording.${ext}`, `audio/${ext}`);
    console.log(`[VoiceUpload] Transcript (${isBroadcast ? 'broadcast' : agent}): ${transcript}`);

    if (!transcript) {
        sendJson(ws, { type: 'result', ok: false, agent: isBroadcast ? 'broadcast' : agent, error: 'Empty transcription' });
        return;
    }

    const message = isBroadcast ? transcript.trim() : buildVoiceMessage(agent, transcript);
    const dispatch = dispatchVoiceCommand(getAgentConnections(), message);

    sendJson(ws, {
        type: 'result',
        ok: dispatch.ok,
        agent: isBroadcast ? 'broadcast' : agent,
        transcript,
        message,
        delivered: dispatch.delivered,
        error: dispatch.ok ? undefined : 'No agents in game to receive command',
    });
}

export function normalizeAgent(agent, getAgentConnections) {
    if (!agent || typeof agent !== 'string') return null;
    const trimmed = agent.trim();
    const lower = trimmed.toLowerCase();
    if (['broadcast', 'all', 'both', 'everyone', 'global', 'team'].includes(lower)) {
        return BROADCAST_AGENT;
    }
    const connections = typeof getAgentConnections === 'function' ? getAgentConnections() : {};
    if (Object.prototype.hasOwnProperty.call(connections, trimmed)) {
        return trimmed;
    }
    return null;
}

function decodeAudio(payload) {
    const b64 = payload.audio || payload.audioBase64;
    if (!b64 || typeof b64 !== 'string') return null;
    try {
        return Buffer.from(b64, 'base64');
    } catch {
        return null;
    }
}

export function sendJson(ws, obj) {
    if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify(obj));
    }
}
