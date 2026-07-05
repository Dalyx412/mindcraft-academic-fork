import { toFile } from 'openai';
import { getKey, hasKey } from '../utils/keys.js';
import { createGatewayClient } from '../models/gateway.js';

let gatewayClient = null;

function getClient() {
    if (!gatewayClient) {
        gatewayClient = createGatewayClient();
    }
    return gatewayClient;
}

/**
 * @param {Buffer} audioBuffer
 * @param {string} [language]
 * @param {string} [filename]
 * @param {string} [mimeType]
 * @returns {Promise<string>}
 */
export async function transcribeAudioBuffer(
    audioBuffer,
    language,
    filename = 'recording.wav',
    mimeType = 'audio/wav'
) {
    if (!hasKey('GATEWAY_API_KEY')) {
        throw new Error('GATEWAY_API_KEY not found in keys.json or environment');
    }
    if (!audioBuffer?.length) {
        throw new Error('Empty audio payload');
    }

    const client = getClient();
    const file = await toFile(audioBuffer, filename, { type: mimeType });
    const options = {
        file,
        model: process.env.GATEWAY_STT_MODEL || 'whisper-1',
    };
    if (language) {
        options.language = language;
    }

    console.log('[VoiceSTT] Transcribing via gateway (model:', options.model, ')');
    const result = await client.audio.transcriptions.create(options);
    return (result.text || '').trim();
}
