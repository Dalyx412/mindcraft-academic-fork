import settings from '../agent/settings.js';

const EN_ALIASES = new Set(['en', 'english', 'en-us', 'en_us']);

/** @param {string} code */
export function isEnglish(code) {
    if (!code) return true;
    return EN_ALIASES.has(String(code).toLowerCase());
}

/**
 * Player-facing chat/TTS language. Profile overrides global; legacy `language` maps here.
 * @param {object} [profile]
 */
export function getUiLanguage(profile = null) {
    return (
        profile?.ui_language ||
        settings.ui_language ||
        settings.language ||
        'ja'
    );
}

/** LLM history, command matching, bot-to-bot reasoning — default English. */
export function getLogicLanguage() {
    return settings.logic_language || 'en';
}

/** Long-term memory file language — default English. */
export function getMemoryLanguage(profile = null) {
    return (
        profile?.memory_language ||
        settings.memory_language ||
        'en'
    );
}

const REPLY_LANGUAGE_LABELS = {
    ja: 'Japanese',
    'zh-CN': 'Simplified Chinese',
    'zh-TW': 'Traditional Chinese',
    ko: 'Korean',
    en: 'English',
};

/** Injected into conversing/coding prompts. */
export function getReplyLanguageInstruction(profile = null) {
    const code = getUiLanguage(profile);
    const label = REPLY_LANGUAGE_LABELS[code] || code;
    let instruction =
        `REPLY LANGUAGE: When speaking to human players in natural language, use ${label} (${code}). ` +
        `Keep all !command syntax, command arguments, and code exactly as documented in English. ` +
        `Do not translate command names or JSON/code.`;
    if (code === 'ja') {
        instruction +=
            ` In natural-language chat (the part before !commands), use Japanese Minecraft terms — never English registry IDs. ` +
            `Examples: 丸石 (not cobblestone), オークの原木 (not oak_log), ガラス板 (not glass_pane), ` +
            `木のドア (not oak_door), 木板 (not oak_planks), 石炭鉱石 (not coal_ore), 隊長 (not PM), ` +
            `標準仕様 (not HOUSE SPEC). English IDs are ONLY for !command arguments and code strings inside !newAction(...).`;
    }
    if (code === 'zh-CN' || code === 'zh-TW') {
        instruction +=
            ` In natural-language chat (the part before !commands), use Chinese Minecraft terms — never English registry IDs. ` +
            `Examples: 圆石 (not cobblestone), 橡木原木 (not oak_log), 玻璃板 (not glass_pane), ` +
            `木门 (not oak_door), 木板 (not oak_planks), 煤矿石 (not coal_ore), 队长 (not PM), ` +
            `标准规格 (not HOUSE SPEC). English IDs are ONLY for !command arguments and code strings inside !newAction(...).`;
    }
    if (code === 'en') {
        instruction +=
            ` In natural-language chat (the part before !commands), use plain English Minecraft terms players understand — ` +
            `e.g. cobblestone, oak logs, glass panes, wooden door, planks, coal ore, captain (not PM), HOUSE SPEC. ` +
            `English block/item IDs are ONLY for !command arguments and code strings inside !newAction(...).`;
    }
    return instruction;
}
