import { hasKey } from '../utils/keys.js';
import * as openaiStt from './voice_stt_openai.js';
import * as gatewayStt from './voice_stt_gateway.js';
import * as qwenStt from './voice_stt_qwen.js';

const sttStrategies = {
    openai: openaiStt,
    gateway: gatewayStt,
    qwen: qwenStt,
};

function selectSttStrategy() {
    const explicit = process.env.VOICE_STT_PROVIDER;
    let name = explicit;
    if (!name) {
        if (hasKey('QWEN_API_KEY')) {
            name = 'qwen';
        } else if (hasKey('GATEWAY_API_KEY')) {
            name = 'gateway';
        } else {
            name = 'openai';
        }
    }
    const strategy = sttStrategies[name];
    if (!strategy) {
        throw new Error(`Unknown VOICE_STT_PROVIDER: ${name}. Use "openai", "gateway", or "qwen".`);
    }
    return strategy;
}

/**
 * Transcribe audio bytes via configured STT strategy.
 * @param {Buffer} audioBuffer
 * @param {string} [language] ISO 639-1 code (zh, en, ja, ...)
 * @param {string} [filename] e.g. recording.webm
 * @param {string} [mimeType] e.g. audio/webm
 * @returns {Promise<string>}
 */
export async function transcribeAudioBuffer(
    audioBuffer,
    language,
    filename = 'recording.wav',
    mimeType = 'audio/wav'
) {
    return selectSttStrategy().transcribeAudioBuffer(audioBuffer, language, filename, mimeType);
}
