import OpenAI from 'openai';
import { toFile } from 'openai';
import { getKey, hasKey } from '../utils/keys.js';

let openaiClient = null;

function getClient() {
    if (!openaiClient) {
        openaiClient = new OpenAI({ apiKey: getKey('OPENAI_API_KEY') });
    }
    return openaiClient;
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
    if (!hasKey('OPENAI_API_KEY')) {
        throw new Error('OPENAI_API_KEY not found in keys.json or environment');
    }
    if (!audioBuffer?.length) {
        throw new Error('Empty audio payload');
    }

    const client = getClient();
    const file = await toFile(audioBuffer, filename, { type: mimeType });
    const options = {
        file,
        model: 'whisper-1',
    };
    if (language) {
        options.language = language;
    }

    const result = await client.audio.transcriptions.create(options);
    return (result.text || '').trim();
}
