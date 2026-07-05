import { WebSocketServer } from 'ws';
import { handleVoiceUpload } from './voice_upload_handler.js';

/**
 * Standalone WebSocket server (legacy Python voice-client path).
 */
export function createVoiceAudioServer(options) {
    const { port, host, language, getAgentConnections } = options;
    const wss = new WebSocketServer({ port, host });

    wss.on('listening', () => {
        console.log(`VoiceAudio WebSocket server on ws://${host}:${port}`);
    });

    wss.on('connection', (ws, req) => {
        const remote = req.socket.remoteAddress;
        console.log(`[VoiceAudio] Client connected from ${remote}`);

        ws.on('message', async (raw) => {
            try {
                const payload = JSON.parse(raw.toString());
                await handleVoiceUpload(ws, payload, language, getAgentConnections);
            } catch (error) {
                console.error('[VoiceAudio] Message error:', error);
                ws.send(JSON.stringify({ type: 'error', ok: false, error: error.message }));
            }
        });

        ws.on('close', () => {
            console.log(`[VoiceAudio] Client disconnected (${remote})`);
        });
    });

    wss.on('error', (err) => {
        console.error('[VoiceAudio] Server error:', err);
    });

    return wss;
}
