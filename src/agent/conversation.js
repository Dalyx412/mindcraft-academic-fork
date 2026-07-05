import settings from './settings.js';
import { containsCommand } from './commands/index.js';
import { sendBotChatToServer } from './mindserver_proxy.js';

let agent;
let agent_names = [];
let agents_in_game = [];

class Conversation {
    constructor(name) {
        this.name = name;
        this.active = false;
        this.ignore_until_start = false;
        this.blocked = false;
        this.in_queue = [];
        this.inMessageTimer = null;
        // Loop-breaker state for runaway bot-to-bot chatter.
        this.turnCount = 0;
        this.recentBodies = [];
        this.repeatStrikes = 0;
    }

    reset() {
        this.active = false;
        this.ignore_until_start = false;
        this.in_queue = [];
        this.inMessageTimer = null;
        this.turnCount = 0;
        this.recentBodies = [];
        this.repeatStrikes = 0;
    }

    end() {
        this.active = false;
        this.ignore_until_start = true;
        this.inMessageTimer = null;
        const full_message = _compileInMessages(this);
        if (full_message.message.trim().length > 0)
            agent.history.add(this.name, full_message.message);
        // add the full queued messages to history, but don't respond

        if (agent.last_sender === this.name)
            agent.last_sender = null;
    }

    queue(message) {
        this.in_queue.push(message);
    }
}

const WAIT_TIME_START = 30000;
class ConversationManager {
    constructor() {
        this.convos = {};
        this.activeConversation = null;
        this.awaiting_response = false;
        this.connection_timeout = null;
        this.wait_time_limit = WAIT_TIME_START;
        this._recentBotMessages = new Map();
    }

    initAgent(a) {
        agent = a;
    }

    _getConvo(name) {
        if (!this.convos[name])
            this.convos[name] = new Conversation(name);
        return this.convos[name];
    }

    _startMonitor() {
        clearInterval(this.connection_monitor);
        let wait_time = 0;
        let last_time = Date.now();
        this.connection_monitor = setInterval(() => {
            if (!this.activeConversation) {
                this._stopMonitor();
                return; // will clean itself up
            }

            let delta = Date.now() - last_time;
            last_time = Date.now();
            let convo_partner = this.activeConversation.name;

            if (this.awaiting_response && agent.isIdle()) {
                wait_time += delta;
                if (wait_time > this.wait_time_limit) {
                    agent.handleMessage('system', `${convo_partner} hasn't responded in ${this.wait_time_limit/1000} seconds, respond with a message to them or your own action.`);
                    wait_time = 0;
                    this.wait_time_limit*=2;
                }
            }
            else if (!this.awaiting_response){
                this.wait_time_limit = WAIT_TIME_START;
                wait_time = 0;
            }

            if (!this.otherAgentInGame(convo_partner) && !this.connection_timeout) {
                this.connection_timeout = setTimeout(() => {
                    if (this.otherAgentInGame(convo_partner)){
                        this._clearMonitorTimeouts();
                        return;
                    }
                    if (!agent.self_prompter.isPaused()) {
                        this.endConversation(convo_partner);
                        agent.handleMessage('system', `${convo_partner} disconnected, conversation has ended.`);
                    }
                    else {
                        this.endConversation(convo_partner);
                    }
                }, 10000);
            }
        }, 1000);
    }

    _stopMonitor() {
        clearInterval(this.connection_monitor);
        this.connection_monitor = null;
        this._clearMonitorTimeouts();
    }

    _clearMonitorTimeouts() {
        this.awaiting_response = false;
        clearTimeout(this.connection_timeout);
        this.connection_timeout = null;
    }

    async startConversation(send_to, message) {
        const convo = this._getConvo(send_to);
        convo.reset();
        
        if (agent.self_prompter.isActive()) {
            await agent.self_prompter.pause();
        }
        if (convo.active)
            return;
        convo.active = true;
        this.activeConversation = convo;
        this._startMonitor();
        this.sendToBot(send_to, message, true, true);
    }

    startConversationFromOtherBot(name) {
        const convo = this._getConvo(name);
        convo.active = true;
        this.activeConversation = convo;
        this._startMonitor();
    }

    sendToBot(send_to, message, start=false, open_chat=true) {
        if (!this.isOtherAgent(send_to)) {
            console.warn(`${agent.name} tried to send bot message to non-bot ${send_to}`);
            return;
        }
        if (!message || message.trim().length === 0) {
            return;
        }
        const convo = this._getConvo(send_to);
        
        if (settings.chat_bot_messages && open_chat) {
            const publicText = message.includes(`@${send_to}`)
                ? message
                : `@${send_to} ${message}`;
            agent.openChat(publicText);
        }
        
        if (convo.ignore_until_start)
            return;
        convo.active = true;
        
        const end = message.includes('!endConversation');
        const json = {
            'message': message,
            start,
            end,
        };

        this.awaiting_response = true;
        sendBotChatToServer(send_to, json);
    }

    async receiveFromBot(sender, received) {
        const body = received?.message ?? '';
        const dedupKey = `${sender}|${body}`;
        const now = Date.now();
        const lastSeen = this._recentBotMessages.get(dedupKey);
        if (lastSeen && now - lastSeen < 3000) {
            return;
        }
        this._recentBotMessages.set(dedupKey, now);
        // prune stale dedup entries
        for (const [key, ts] of this._recentBotMessages) {
            if (now - ts > 10000) this._recentBotMessages.delete(key);
        }

        const convo = this._getConvo(sender);

        if (convo.ignore_until_start && !received.start)
            return;

        // check if any convo is active besides the sender
        if (this.inConversation() && !this.inConversation(sender)) {
            this.sendToBot(sender, `I'm talking to someone else, try again later. !endConversation("${sender}")`, false, false);
            this.endConversation(sender);
            return;
        }

        if (received.start) {
            convo.reset();
            this.startConversationFromOtherBot(sender);
        }

        // --- Runaway loop-breaker -------------------------------------------------
        // Two bots will otherwise reply to each other forever. End the conversation
        // when they exchange too many turns, or keep repeating near-identical lines.
        if (!received.start && !received.end) {
            convo.turnCount = (convo.turnCount || 0) + 1;

            const norm = _normalizeBody(body);
            if (norm.length > 0) {
                const maxSim = convo.recentBodies.reduce(
                    (m, prev) => Math.max(m, _similarity(norm, prev)), 0);
                convo.repeatStrikes = maxSim >= REPEAT_SIMILARITY ? (convo.repeatStrikes || 0) + 1 : 0;
                convo.recentBodies.push(norm);
                if (convo.recentBodies.length > 4) convo.recentBodies.shift();
            }

            const tooRepetitive = convo.repeatStrikes >= REPEAT_STRIKE_LIMIT;
            const tooManyTurns = convo.turnCount > MAX_BOT_EXCHANGES;
            if (tooRepetitive || tooManyTurns) {
                const reason = tooRepetitive
                    ? 'you were repeating nearly the same thing back and forth'
                    : 'the back-and-forth went on too long with no real progress';
                console.warn(`${agent.name} auto-ending convo with ${sender}: ${reason}`);
                this.sendToBot(sender, `!endConversation("${sender}")`, false, false);
                this.endConversation(sender);
                agent.handleMessage('system', `Conversation with ${sender} was auto-ended because ${reason}. Stop messaging ${sender} and do NOT start a new conversation with them. Wait for the player's next instruction; if you already have a clear pending task, just do it with a single !command instead of chatting.`);
                return;
            }
        }
        // -------------------------------------------------------------------------

        this._clearMonitorTimeouts();
        convo.queue(received);
        
        // responding to conversation takes priority over self prompting
        if (agent.self_prompter.isActive()){
            await agent.self_prompter.pause();
        }
    
        _scheduleProcessInMessage(sender, received, convo);
    }

    responseScheduledFor(sender) {
        if (!this.isOtherAgent(sender) || !this.inConversation(sender))
            return false;
        const convo = this._getConvo(sender);
        return !!convo.inMessageTimer;
    }

    isOtherAgent(name) {
        // Our own name is never an "other" agent — guards against self-triggered loops.
        if (agent && name === agent.name) return false;
        return agent_names.some((n) => n === name);
    }

    otherAgentInGame(name) {
        return agents_in_game.some((n) => n === name);
    }
    
    updateAgents(agents) {
        agent_names = agents.map(a => a.name);
        agents_in_game = agents.filter(a => a.in_game).map(a => a.name);
    }

    getInGameAgents() {
        return agents_in_game;
    }
    
    inConversation(other_agent=null) {
        if (other_agent)
            return this.convos[other_agent]?.active;
        return Object.values(this.convos).some(c => c.active);
    }
    
    // Reset loop-breaker counters whenever a human gives input, so player-driven
    // collaboration is never cut off by the runaway guard.
    notePlayerMessage() {
        for (const convo of Object.values(this.convos)) {
            convo.turnCount = 0;
            convo.repeatStrikes = 0;
            convo.recentBodies = [];
        }
        this.wait_time_limit = WAIT_TIME_START;
    }

    endConversation(sender) {
        if (this.convos[sender]) {
            this.convos[sender].end();
            if (this.activeConversation && this.activeConversation.name === sender) {
                this._stopMonitor();
                this.activeConversation = null;
                if (agent.self_prompter.isPaused() && !this.inConversation()) {
                    _resumeSelfPrompter();
                }
            }
        }
    }
    
    endAllConversations() {
        for (const sender in this.convos) {
            this.endConversation(sender);
        }
        if (agent.self_prompter.isPaused()) {
            _resumeSelfPrompter();
        }
    }

    forceEndCurrentConversation() {
        if (this.activeConversation) {
            let sender = this.activeConversation.name;
            this.sendToBot(sender, '!endConversation("' + sender + '")', false, false);
            this.endConversation(sender);
        }
    }
}

const convoManager = new ConversationManager();
export default convoManager;

/*
This function controls conversation flow by deciding when the bot responds.
The logic is as follows:
- If neither bot is busy, respond quickly with a small delay.
- If only the other bot is busy, respond with a long delay to allow it to finish short actions (ex check inventory)
- If I'm busy but other bot isn't, let LLM decide whether to respond
- If both bots are busy, don't respond until someone is done, excluding a few actions that allow fast responses
- New messages received during the delay will reset the delay following this logic, and be queued to respond in bulk
*/
const talkOverActions = ['stay', 'followPlayer', 'mode:']; // all mode actions
const fastDelay = 200;
const longDelay = 5000;
async function _scheduleProcessInMessage(sender, received, convo) {
    if (convo.inMessageTimer)
        clearTimeout(convo.inMessageTimer);
    let otherAgentBusy = containsCommand(received.message);

    const scheduleResponse = (delay) => convo.inMessageTimer = setTimeout(() => _processInMessageQueue(sender), delay);

    if (!agent.isIdle() && otherAgentBusy) {
        // both are busy
        let canTalkOver = talkOverActions.some(a => agent.actions.currentActionLabel.includes(a));
        if (canTalkOver)
            scheduleResponse(fastDelay);
        else if (convo.active)
            scheduleResponse(longDelay);
    }
    else if (otherAgentBusy)
        // other bot is busy but I'm not
        scheduleResponse(longDelay);
    else if (!agent.isIdle()) {
        // I'm busy but other bot isn't
        let canTalkOver = talkOverActions.some(a => agent.actions.currentActionLabel.includes(a));
        if (canTalkOver) {
            scheduleResponse(fastDelay);
        }
        else if (convo.active) {
            scheduleResponse(longDelay);
        }
        else {
            let shouldRespond = await agent.prompter.promptShouldRespondToBot(received.message);
            console.log(`${agent.name} decided to ${shouldRespond?'respond':'not respond'} to ${sender}`);
            if (shouldRespond)
                scheduleResponse(fastDelay);
        }
    }
    else {
        // neither are busy
        scheduleResponse(fastDelay);
    }
}

function _processInMessageQueue(name) {
    const convo = convoManager._getConvo(name);
    _handleFullInMessage(name, _compileInMessages(convo));
}

function _compileInMessages(convo) {
    let pack = {};
    let full_message = '';
    while (convo.in_queue.length > 0) {
        pack = convo.in_queue.shift();
        full_message += pack.message;
    }
    pack.message = full_message;
    return pack;
}

function _handleFullInMessage(sender, received) {
    console.log(`${agent.name} responding to "${received.message}" from ${sender}`);
    
    const convo = convoManager._getConvo(sender);
    convo.active = true;

    let message = _tagMessage(received.message);
    if (received.end) {
        convoManager.endConversation(sender);
        message = `Conversation with ${sender} ended with message: "${message}"`;
        sender = 'system'; // bot will respond to system instead of the other bot
    }
    else if (received.start)
        agent.shut_up = false;
    convo.inMessageTimer = null;
    agent.handleMessage(sender, message);
}


function _tagMessage(message) {
    return "(FROM OTHER BOT)" + message;
}

// --- Loop-breaker tuning -----------------------------------------------------
// Max consecutive bot<->bot turns before we force-end (reset by player input or a
// fresh conversation start). Generous enough for real coordination handoffs.
const MAX_BOT_EXCHANGES = 8;
// How similar two messages must be (0..1) to count as a "repeat".
const REPEAT_SIMILARITY = 0.7;
// How many near-duplicate messages in a row before we force-end.
const REPEAT_STRIKE_LIMIT = 2;

// Strip routing tags, @mentions, and !commands so we compare the human-readable
// intent of two bot messages, not their command syntax.
function _normalizeBody(text) {
    return (text || '')
        .replace(/\(FROM OTHER BOT\)/gi, '')
        .replace(/@[A-Za-z0-9_]+/g, '')
        .replace(/![A-Za-z]+(\([^)]*\))?/g, '')
        .toLowerCase()
        .replace(/[\s\p{P}\p{S}]+/gu, '')
        .trim();
}

// Character-bigram Jaccard similarity (works for CJK and latin alike).
function _similarity(a, b) {
    if (!a || !b) return 0;
    if (a === b) return 1;
    const bigrams = (s) => {
        const set = new Set();
        if (s.length === 1) { set.add(s); return set; }
        for (let i = 0; i < s.length - 1; i++) set.add(s.slice(i, i + 2));
        return set;
    };
    const A = bigrams(a);
    const B = bigrams(b);
    let inter = 0;
    for (const g of A) if (B.has(g)) inter++;
    const union = A.size + B.size - inter;
    return union === 0 ? 0 : inter / union;
}

async function _resumeSelfPrompter() {
    await new Promise(resolve => setTimeout(resolve, 5000));
    if (agent.self_prompter.isPaused() && !convoManager.inConversation()) {
        agent.self_prompter.start();
    }
}
