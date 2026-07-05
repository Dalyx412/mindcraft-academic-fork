import { routePublicChatMessage, formatVoiceEcho, findAllMentions } from '../utils/mention_routing.js';

/**
 * Inject a voice/text command into agent processes (Socket.IO path).
 * @param {Record<string, import('./mindserver.js').AgentConnection>} agent_connections
 * @param {string} message Full message, e.g. "@Aki 木を切って"
 * @returns {{ ok: boolean, delivered: number, transcript?: string }}
 */
export function dispatchVoiceCommand(agent_connections, message) {
    const text = (message || '').trim();
    if (!text) {
        return { ok: false, delivered: 0, error: 'empty message' };
    }

    const allAgentNames = Object.keys(agent_connections);
    let delivered = 0;
    const isBroadcast = findAllMentions(text).length === 0;

    for (const agentName of allAgentNames) {
        const routed = routePublicChatMessage(text, agentName, allAgentNames);
        if (!routed.deliver) continue;
        const conn = agent_connections[agentName];
        if (!conn?.in_game || !conn.socket) {
            console.warn(`Agent ${agentName} not in game, skipping voice-command.`);
            continue;
        }
        const echoText = isBroadcast
            ? `[Voice] 全员, ${routed.message}`
            : formatVoiceEcho(agentName, routed.message, text);
        conn.socket.emit('voice-echo', { text: echoText });
        conn.socket.emit('send-message', { from: 'PM', message: routed.message });
        delivered++;
    }

    return { ok: delivered > 0, delivered };
}

/**
 * Build @-prefixed command from agent id and transcript.
 * @param {string} agent e.g. Aki
 * @param {string} transcript
 */
export function buildVoiceMessage(agent, transcript) {
    const trimmed = (transcript || '').trim();
    if (!trimmed) return '';
    const normalized = agent.startsWith('@') ? agent.slice(1) : agent;
    return `@${normalized} ${trimmed}`;
}
