import { spawn } from 'child_process';

let ngrokProcess = null;
let publicUrl = null;

// ngrok picks the next free port (4041, 4042, …) when 4040 is taken by another app
const NGROK_API_PORTS = [4040, 4041, 4042, 4043, 4044, 4045];

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function pickTunnelUrl(tunnels, targetPort) {
    let candidates = tunnels;
    if (targetPort != null) {
        const forPort = tunnels.filter((t) => {
            const addr = t.config?.addr || '';
            return addr.includes(`:${targetPort}`);
        });
        if (forPort.length) candidates = forPort;
    }
    const https = candidates.find((t) => t.public_url?.startsWith('https://'));
    const http = candidates.find((t) => t.public_url?.startsWith('http://'));
    return (https || http)?.public_url || null;
}

async function fetchPublicUrl(targetPort) {
    for (const apiPort of NGROK_API_PORTS) {
        try {
            const res = await fetch(`http://127.0.0.1:${apiPort}/api/tunnels`);
            if (!res.ok) continue;
            const data = await res.json();
            const url = pickTunnelUrl(data?.tunnels || [], targetPort);
            if (url) return url;
        } catch {
            /* try next API port */
        }
    }
    return null;
}

/**
 * Start ngrok HTTP tunnel to local port and resolve public HTTPS URL.
 * @param {number} port Local VoiceWeb port
 * @param {object} [options]
 * @param {string} [options.bin] ngrok executable name/path
 * @param {number} [options.timeoutMs] max wait for tunnel URL
 * @returns {Promise<string|null>} public URL or null on failure
 */
export async function startNgrokTunnel(port, options = {}) {
    const bin = options.bin || process.env.NGROK_BIN || 'ngrok';
    const timeoutMs = options.timeoutMs ?? 30000;
    const pollMs = options.pollMs ?? 500;

    if (ngrokProcess) {
        return publicUrl || (await waitForPublicUrl(port, timeoutMs, pollMs));
    }

    const existing = await fetchPublicUrl(port);
    if (existing) {
        publicUrl = existing;
        console.log(`[Ngrok] Reusing existing tunnel: ${existing}`);
        return existing;
    }

    console.log(`[Ngrok] Starting tunnel → localhost:${port}`);

    try {
        ngrokProcess = spawn(bin, ['http', String(port)], {
            detached: false,
            stdio: 'ignore',
            shell: process.platform === 'win32',
        });

        ngrokProcess.on('error', (err) => {
            console.error('[Ngrok] Failed to start:', err.message);
            ngrokProcess = null;
        });

        ngrokProcess.on('exit', (code) => {
            if (code !== 0 && code !== null) {
                console.warn(`[Ngrok] Process exited with code ${code}`);
            }
            ngrokProcess = null;
            publicUrl = null;
        });
    } catch (err) {
        console.error('[Ngrok] Spawn error:', err.message);
        return null;
    }

    const url = await waitForPublicUrl(port, timeoutMs, pollMs);
    if (url) {
        publicUrl = url;
        console.log(`[Ngrok] Public URL: ${url}`);
    } else {
        console.warn('[Ngrok] Tunnel URL not found — is ngrok installed and authenticated? (ngrok config add-authtoken ...)');
    }
    return url;
}

async function waitForPublicUrl(port, timeoutMs, pollMs) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        const url = await fetchPublicUrl(port);
        if (url) return url;
        await sleep(pollMs);
    }
    return null;
}

/** @returns {string|null} Last known ngrok public URL */
export function getNgrokPublicUrl() {
    return publicUrl;
}

/** Refresh public URL from any running ngrok inspect API (e.g. after port 4040 conflict). */
export async function refreshNgrokPublicUrl(port) {
    const url = await fetchPublicUrl(port);
    if (url) publicUrl = url;
    return url;
}

export function stopNgrokTunnel() {
    if (ngrokProcess) {
        try {
            ngrokProcess.kill();
        } catch {
            /* ignore */
        }
        ngrokProcess = null;
    }
    publicUrl = null;
}

process.on('exit', () => stopNgrokTunnel());
