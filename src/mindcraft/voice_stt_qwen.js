import { getKey, hasKey } from '../utils/keys.js';

const QWEN_ASR_BASE_URL =
    process.env.QWEN_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1';

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
    filename = 'recording.webm',
    mimeType = 'audio/webm'
) {
    if (!hasKey('QWEN_API_KEY')) {
        throw new Error('QWEN_API_KEY not found in keys.json or environment');
    }
    if (!audioBuffer?.length) {
        throw new Error('Empty audio payload');
    }

    const model = process.env.QWEN_STT_MODEL || 'qwen3-asr-flash';
    const dataUri = `data:${mimeType};base64,${audioBuffer.toString('base64')}`;

    const body = {
        model,
        messages: [
            {
                role: 'user',
                content: [
                    {
                        type: 'input_audio',
                        input_audio: { data: dataUri },
                    },
                ],
            },
        ],
    };

    if (language) {
        body.asr_options = { language, enable_itn: false };
    }

    console.log('[VoiceSTT] Transcribing via Qwen ASR (model:', model, ')');

    const response = await fetch(`${QWEN_ASR_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${getKey('QWEN_API_KEY')}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Qwen ASR failed (${response.status}): ${errText}`);
    }

    const result = await response.json();
    const text = result?.choices?.[0]?.message?.content;
    return (text || '').trim();
}
