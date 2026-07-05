import { readFileSync } from 'fs';

let keys = {};
try {
    const data = readFileSync('./keys.json', 'utf8');
    keys = JSON.parse(data);
} catch (err) {
    console.warn('keys.json not found. Defaulting to environment variables.'); // still works with local models
}

function resolveKey(name) {
    const fromFile = keys[name];
    if (typeof fromFile === 'string' && fromFile.trim()) {
        return fromFile.trim();
    }
    const fromEnv = process.env[name];
    if (typeof fromEnv === 'string' && fromEnv.trim()) {
        return fromEnv.trim();
    }
    return null;
}

export function getKey(name) {
    const key = resolveKey(name);
    if (!key) {
        throw new Error(`API key "${name}" not found in keys.json or environment variables!`);
    }
    return key;
}

export function hasKey(name) {
    return Boolean(resolveKey(name));
}
