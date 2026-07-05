import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';

const STATE_PATH = './bots/shared_task_state.json';
const SPAWN_FACILITY = { x: 0, y: -56, z: 0 };
const MINE_SITE = { x: 6, y: -60, z: 3 };
const HOUSE_SITE_LABEL = 'スポーン地点東側建築区の建築地点';

function emptyState() {
    return {
        places: {},
        fields: {}
    };
}

export function loadSharedTaskState() {
    if (!existsSync(STATE_PATH)) {
        return emptyState();
    }
    try {
        const state = JSON.parse(readFileSync(STATE_PATH, 'utf8'));
        return {
            places: state.places || {},
            fields: state.fields || {}
        };
    } catch (err) {
        console.warn(`Failed to load shared task state: ${err.message}`);
        return emptyState();
    }
}

export function saveSharedTaskState(state) {
    mkdirSync('./bots', { recursive: true });
    writeFileSync(STATE_PATH, JSON.stringify(state, null, 2), 'utf8');
}

export function rememberSharedPlace(name, pos, label = '') {
    const state = loadSharedTaskState();
    state.places[name] = {
        x: Number(pos.x),
        y: Number(pos.y),
        z: Number(pos.z),
        label
    };
    saveSharedTaskState(state);
    return state.places[name];
}

export function recallSharedPlace(name) {
    return loadSharedTaskState().places[name] || null;
}

export function setSharedTaskField(key, value) {
    const state = loadSharedTaskState();
    state.fields[key] = value;
    saveSharedTaskState(state);
    return state.fields[key];
}

export function describeSharedTaskState() {
    const state = loadSharedTaskState();
    return JSON.stringify(state);
}

export function selectHouseSite(agent) {
    const existing = recallSharedPlace('house_site');
    if (existing) {
        agent.memory_bank.rememberPlace('house_site', existing.x, existing.y, existing.z);
        return existing;
    }

    const site = {
        x: 32 + Math.floor(Math.random() * 17),
        y: -56,
        z: -8 + Math.floor(Math.random() * 17)
    };
    const saved = rememberSharedPlace('house_site', site, HOUSE_SITE_LABEL);
    agent.memory_bank.rememberPlace('house_site', saved.x, saved.y, saved.z);
    setSharedTaskField('house_progress', 'house_site selected; build not started');
    return saved;
}

export function getSpawnFacility() {
    return SPAWN_FACILITY;
}

export function getMineSite() {
    return MINE_SITE;
}
