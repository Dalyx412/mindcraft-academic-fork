/**
 * Test VoiceAudio WebSocket server with a minimal WAV payload.
 * Usage: node voice-client/test-voice-audio-ws.js [host] [port] [agent]
 *
 * Requires: npm start (mindcraft) running with voice_audio_enabled.
 * For real STT test, replace the dummy WAV with a recorded file path via VOICE_TEST_WAV env.
 */
import { readFileSync, existsSync } from 'fs';
import WebSocket from 'ws';

const host = process.argv[2] || '127.0.0.1';
const port = parseInt(process.argv[3] || '8081', 10);
const agent = process.argv[4] || 'Aki';

function minimalWav(seconds = 0.5, sampleRate = 16000) {
    const numSamples = Math.floor(seconds * sampleRate);
    const dataSize = numSamples * 2;
    const buffer = Buffer.alloc(44 + dataSize);
    buffer.write('RIFF', 0);
    buffer.writeUInt32LE(36 + dataSize, 4);
    buffer.write('WAVE', 8);
    buffer.write('fmt ', 12);
    buffer.writeUInt32LE(16, 16);
    buffer.writeUInt16LE(1, 20);
    buffer.writeUInt16LE(1, 22);
    buffer.writeUInt32LE(sampleRate, 24);
    buffer.writeUInt32LE(sampleRate * 2, 28);
    buffer.writeUInt16LE(2, 32);
    buffer.writeUInt16LE(16, 34);
    buffer.write('data', 36);
    buffer.writeUInt32LE(dataSize, 40);
    return buffer;
}

const wavPath = process.env.VOICE_TEST_WAV;
const wav = wavPath && existsSync(wavPath)
    ? readFileSync(wavPath)
    : minimalWav();

const ws = new WebSocket(`ws://${host}:${port}`);

ws.on('open', () => {
    console.log(`Connected to ws://${host}:${port}`);
    ws.send(JSON.stringify({
        type: 'voice-upload',
        agent,
        audio: wav.toString('base64'),
        format: 'wav',
    }));
});

ws.on('message', (data) => {
    console.log('Response:', data.toString());
    ws.close();
    process.exit(0);
});

ws.on('error', (err) => {
    console.error('WebSocket error:', err.message);
    process.exit(1);
});
