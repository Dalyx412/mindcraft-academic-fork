import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import QRCode from 'qrcode';
import { WebSocketServer } from 'ws';
import { handleVoiceUpload, sendJson } from './voice_upload_handler.js';
import { getNgrokPublicUrl, refreshNgrokPublicUrl } from './ngrok_tunnel.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, '../voice-web/public');

/**
 * Express static + WebSocket on one HTTP port (zero-install web voice console).
 * @param {object} options
 * @param {number} options.port
 * @param {string} options.host
 * @param {string} [options.language]
 * @param {() => Record<string, object>} options.getAgentConnections
 * @param {boolean} [options.logOnly] Skip STT — verify upload size only
 */
export function createVoiceWebServer(options) {
    const { port, host, language, getAgentConnections, logOnly = false } = options;

    const app = express();
    const server = http.createServer(app);

    app.use(express.static(PUBLIC_DIR));

    app.get('/health', (_req, res) => {
        res.json({ ok: true, service: 'voice-web' });
    });

    app.get('/api/agents', (_req, res) => {
        const connections = getAgentConnections();
        const agents = Object.entries(connections).map(([name, conn]) => ({
            name,
            label: conn?.settings?.profile?.voice_label || name,
            in_game: Boolean(conn?.in_game),
        }));
        res.set('Cache-Control', 'no-store').json({ agents });
    });

    async function resolveShareUrl(req) {
        let ngrokUrl = getNgrokPublicUrl();
        if (!ngrokUrl) {
            ngrokUrl = await refreshNgrokPublicUrl(port);
        }
        const hostHeader = req.get('host') || `localhost:${port}`;
        const proto = req.protocol || 'http';
        const localUrl = `${proto}://${hostHeader}`;
        const shareUrl = ngrokUrl || localUrl;
        return { shareUrl, ngrokUrl, localUrl, source: ngrokUrl ? 'ngrok' : 'local' };
    }

    app.get('/api/share-url', async (req, res) => {
        const { shareUrl, ngrokUrl, localUrl, source } = await resolveShareUrl(req);
        res.json({
            shareUrl,
            ngrokUrl: ngrokUrl || null,
            localUrl,
            source,
        });
    });

    app.get('/api/share-qr', async (req, res) => {
        const { shareUrl } = await resolveShareUrl(req);
        try {
            const png = await QRCode.toBuffer(shareUrl, {
                type: 'png',
                width: 256,
                margin: 1,
                color: { dark: '#0f172a', light: '#ffffff' },
            });
            res.type('png').set('Cache-Control', 'no-store').send(png);
        } catch (error) {
            console.error('[VoiceWeb] QR generation failed:', error);
            res.status(500).json({ ok: false, error: error.message });
        }
    });

    const wss = new WebSocketServer({ server, path: '/ws' });

    wss.on('connection', (ws, req) => {
        const remote = req.socket.remoteAddress;
        console.log(`[VoiceWeb] Browser connected from ${remote}`);

        ws.on('message', async (raw, isBinary) => {
            try {
                if (isBinary) {
                    console.log(`[VoiceWeb] Received binary frame: ${raw.length} bytes (ignored — send JSON voice-upload)`);
                    return;
                }
                const payload = JSON.parse(raw.toString());
                await handleVoiceUpload(ws, payload, language, getAgentConnections, { logOnly });
            } catch (error) {
                console.error('[VoiceWeb] Message error:', error);
                sendJson(ws, { type: 'error', ok: false, error: error.message });
            }
        });

        ws.on('close', () => {
            console.log(`[VoiceWeb] Browser disconnected (${remote})`);
        });
    });

    server.listen(port, host, () => {
        console.log(`VoiceWeb console at http://${host === '0.0.0.0' ? 'localhost' : host}:${port}`);
        console.log(`VoiceWeb WebSocket at ws://${host === '0.0.0.0' ? 'localhost' : host}:${port}/ws`);
    });

    return { app, server, wss };
}
