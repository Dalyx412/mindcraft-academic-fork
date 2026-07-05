import OpenAIApi from 'openai';
import { getKey } from '../utils/keys.js';
import { strictFormat } from '../utils/text.js';

export const GATEWAY_BASE_URL = 'https://code.viwo50when4.xyz/v1';

/** Shared OpenAI client for gateway chat, embeddings, and Whisper STT.
 * @param {string} [url] override base URL
 * @param {string} [keyName] which key in keys.json to use (defaults to GATEWAY_API_KEY)
 */
export function createGatewayClient(url, keyName) {
    return new OpenAIApi({
        baseURL: url || GATEWAY_BASE_URL,
        apiKey: getKey(keyName || 'GATEWAY_API_KEY'),
    });
}

/**
 * OpenAI-compatible unified gateway — routes to any upstream model by name.
 * Registered automatically via static prefix; no changes to other providers required.
 */
export class Gateway {
    static prefix = 'gateway';

    constructor(model_name, url, params, api_key) {
        this.model_name = model_name;
        this.params = params;
        // api_key is the NAME of a key in keys.json (e.g. "GATEWAY2_API_KEY"),
        // letting each bot/profile authenticate with its own gateway key.
        this.openai = createGatewayClient(url, api_key);
    }

    async sendRequest(turns, systemMessage, stop_seq = '***') {
        let messages = [{ role: 'system', content: systemMessage }, ...turns];
        messages = strictFormat(messages);

        const pack = {
            model: this.model_name,
            messages,
            stop: stop_seq,
            ...(this.params || {}),
        };

        let res = null;
        try {
            console.log('Awaiting gateway api response from model', this.model_name);
            const completion = await this.openai.chat.completions.create(pack);
            if (!completion?.choices?.[0]) {
                console.error('No completion or choices returned:', completion);
                return 'No response received.';
            }
            if (completion.choices[0].finish_reason === 'length') {
                throw new Error('Context length exceeded');
            }
            console.log('Received.');
            res = completion.choices[0].message.content;
        } catch (err) {
            if ((err.message === 'Context length exceeded' || err.code === 'context_length_exceeded') && turns.length > 1) {
                console.log('Context length exceeded, trying again with shorter context.');
                return await this.sendRequest(turns.slice(1), systemMessage, stop_seq);
            }
            console.log(err);
            res = 'My brain disconnected, try again.';
        }
        return res;
    }

    async sendVisionRequest(messages, systemMessage, imageBuffer) {
        const imageMessages = [...messages];
        imageMessages.push({
            role: 'user',
            content: [
                { type: 'text', text: systemMessage },
                {
                    type: 'image_url',
                    image_url: {
                        url: `data:image/jpeg;base64,${imageBuffer.toString('base64')}`,
                    },
                },
            ],
        });
        return this.sendRequest(imageMessages, systemMessage);
    }

    async embed(text) {
        if (text.length > 8191) {
            text = text.slice(0, 8191);
        }
        const embedding = await this.openai.embeddings.create({
            model: this.model_name || 'text-embedding-3-small',
            input: text,
            encoding_format: 'float',
        });
        return embedding.data[0].embedding;
    }
}
