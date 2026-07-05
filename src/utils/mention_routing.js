/** @example "(To Haru) hello" → deliver only to Haru */
function parseToPrefix(message) {
    const match = message.match(/^\(To\s+([a-zA-Z0-9_]{1,16})\)\s*/i);
    if (!match) return null;
    return {
        target: match[1],
        stripped: message.slice(match[0].length).trim() || message,
    };
}

/**
 * Route another bot's public MC chat to this agent.
 * Handles legacy "(To Agent)" echoes, @-mentions, and broadcasts.
 */
export function routeBotPublicChatMessage(message, agentName, allAgentNames) {
    const toPrefix = parseToPrefix(message);
    if (toPrefix) {
        const deliver = toPrefix.target.toLowerCase() === agentName.toLowerCase();
        return { deliver, message: toPrefix.stripped };
    }
    return routePublicChatMessage(message, agentName, allAgentNames);
}

/**
 * Decide whether a public chat message should reach this agent and strip @-mentions.
 * @param {string} message
 * @param {string} agentName
 * @param {string[]} allAgentNames
 * @returns {{ deliver: boolean, message: string }}
 */
export function routePublicChatMessage(message, agentName, allAgentNames) {
    if (!message) {
        return { deliver: false, message: '' };
    }

    const mentions = findAllMentions(message);

    if (mentions.length > 0) {
        const mentionsSelf = mentions.some(
            (name) => name.toLowerCase() === agentName.toLowerCase()
        );
        if (!mentionsSelf) {
            return { deliver: false, message };
        }
        // Keep @self so the LLM knows the PM directed this message at this agent.
        const stripped = stripOtherAgentMentions(message, allAgentNames, agentName).trim();
        return { deliver: true, message: stripped || message };
    }

    // No @-mention: broadcast to every agent when multiple are active.
    return { deliver: true, message };
}

export function findAllMentions(message) {
    const mentionPattern = /@([a-zA-Z0-9_]{1,16})/gi;
    const mentioned = [];
    let match;

    while ((match = mentionPattern.exec(message)) !== null) {
        const name = match[1];
        if (!mentioned.some((n) => n.toLowerCase() === name.toLowerCase())) {
            mentioned.push(name);
        }
    }

    return mentioned;
}

/** Strip @mentions of other agents only; keep @agentName for the recipient. */
function stripOtherAgentMentions(message, allAgentNames, agentName) {
    const selfLower = agentName.toLowerCase();
    const namesToStrip = (allAgentNames || [])
        .map((name) => name.toLowerCase())
        .filter((name) => name !== selfLower);

    let result = message;
    for (const name of namesToStrip) {
        const pattern = new RegExp(`@${name}\\b\\s*:?\\s*`, 'gi');
        result = result.replace(pattern, '');
    }
    return result;
}

/** @example "@Aki 木を切って" → "[Voice] Aki, 木を切って" */
export function formatVoiceEcho(agentName, strippedMessage, originalMessage) {
    const mention = originalMessage.match(/@([a-zA-Z0-9_]{1,16})/i)?.[1] ?? agentName;
    return `[Voice] ${mention}, ${strippedMessage || originalMessage}`;
}
