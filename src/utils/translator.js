import translate from 'google-translate-api-x';
import settings from '../agent/settings.js';
import { getUiLanguage, getLogicLanguage, isEnglish } from './language.js';

/**
 * Translate player-facing dialogue to UI language.
 * @param {string} message
 * @param {object} [profile]
 */
export async function handleTranslation(message, profile = null) {
    const target = getUiLanguage(profile);
    if (isEnglish(target)) return message;
    try {
        const translation = await translate(message, { to: target });
        return translation.text || message;
    } catch (error) {
        console.error('Error translating message:', error);
        return message;
    }
}

/**
 * Translate inbound chat to logic language for history / LLM reasoning.
 * @param {string} message
 */
export async function handleLogicTranslation(message) {
    const target = getLogicLanguage();
    if (isEnglish(target)) return message;
    try {
        const translation = await translate(message, { to: target });
        return translation.text || message;
    } catch (error) {
        console.error('Error translating message to logic language:', error);
        return message;
    }
}

/** @deprecated Use handleLogicTranslation */
export const handleEnglishTranslation = handleLogicTranslation;
