export const FLUX_API_URL = (process.env.FLUX_API_URL || 'http://127.0.0.1:8788').replace(/\/+$/, '');
export const SESSION_COOKIE = 'flux_session';
export const THEME_COOKIE = 'flux_theme';
export const LANG_COOKIE = 'flux_lang';
export const SESSION_MAX_AGE = 12 * 60 * 60;
