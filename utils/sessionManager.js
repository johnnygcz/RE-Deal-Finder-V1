/**
 * Session Manager - Handles session persistence across browser refreshes
 * Uses sessionStorage to maintain user state during browser session
 */

const SESSION_KEY = 're_deal_finder_session';

/**
 * Save session data to sessionStorage
 * @param {Object} sessionData - Session data to persist
 */
export function saveSession(sessionData) {
  try {
    const serialized = JSON.stringify({
      ...sessionData,
      timestamp: Date.now()
    });
    sessionStorage.setItem(SESSION_KEY, serialized);
    console.log('✓ Session saved:', Object.keys(sessionData));
  } catch (error) {
    console.error('Failed to save session:', error);
  }
}

/**
 * Load session data from sessionStorage
 * @returns {Object|null} - Session data or null if not found
 */
export function loadSession() {
  try {
    const serialized = sessionStorage.getItem(SESSION_KEY);
    if (!serialized) return null;
    
    const session = JSON.parse(serialized);
    console.log('✓ Session loaded:', Object.keys(session));
    return session;
  } catch (error) {
    console.error('Failed to load session:', error);
    return null;
  }
}

/**
 * Clear session data from sessionStorage
 */
export function clearSession() {
  try {
    sessionStorage.removeItem(SESSION_KEY);
    console.log('✓ Session cleared');
  } catch (error) {
    console.error('Failed to clear session:', error);
  }
}

/**
 * Update specific session fields without overwriting entire session
 * @param {Object} updates - Fields to update
 */
export function updateSession(updates) {
  try {
    const current = loadSession() || {};
    saveSession({ ...current, ...updates });
  } catch (error) {
    console.error('Failed to update session:', error);
  }
}
