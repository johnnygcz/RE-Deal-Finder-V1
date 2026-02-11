/**
 * Navigation State Manager - Maintains navigation history for back button functionality
 * Stores UI state (view mode, filters, scroll position) for restoration on back
 */

const NAVIGATION_HISTORY_KEY = 're_deal_finder_nav_history';
const MAX_HISTORY_DEPTH = 20; // Prevent memory bloat

/**
 * Push a new navigation state onto the history stack
 * @param {Object} state - Navigation state to save
 *   { viewMode, realtorFilter, filters, scrollPosition, selectedPropertyId }
 */
export function pushNavigation(state) {
  try {
    const history = loadHistory();
    history.push({
      ...state,
      timestamp: Date.now()
    });

    // Prevent unbounded history growth
    if (history.length > MAX_HISTORY_DEPTH) {
      history.shift();
    }

    sessionStorage.setItem(NAVIGATION_HISTORY_KEY, JSON.stringify(history));
    console.log('✓ Navigation state pushed. History depth:', history.length);
  } catch (error) {
    console.error('Failed to push navigation state:', error);
  }
}

/**
 * Pop the last navigation state from history
 * @returns {Object|null} - Previous navigation state or null if no history
 */
export function popNavigation() {
  try {
    const history = loadHistory();
    if (history.length <= 1) {
      console.log('ℹ️ No previous state in history');
      return null;
    }

    // Remove current state and get previous
    history.pop();
    const previousState = history[history.length - 1];

    sessionStorage.setItem(NAVIGATION_HISTORY_KEY, JSON.stringify(history));
    console.log('✓ Navigation state popped. History depth:', history.length);

    return previousState;
  } catch (error) {
    console.error('Failed to pop navigation state:', error);
    return null;
  }
}

/**
 * Get current state without removing from history
 * @returns {Object|null} - Current navigation state or null
 */
export function getCurrentNavigation() {
  try {
    const history = loadHistory();
    return history.length > 0 ? history[history.length - 1] : null;
  } catch (error) {
    console.error('Failed to get current navigation:', error);
    return null;
  }
}

/**
 * Check if there's a previous state available for back navigation
 * @returns {boolean} - True if back is possible
 */
export function canNavigateBack() {
  try {
    const history = loadHistory();
    return history.length > 1;
  } catch (error) {
    console.error('Failed to check navigation history:', error);
    return false;
  }
}

/**
 * Clear entire navigation history
 */
export function clearNavigation() {
  try {
    sessionStorage.removeItem(NAVIGATION_HISTORY_KEY);
    console.log('✓ Navigation history cleared');
  } catch (error) {
    console.error('Failed to clear navigation history:', error);
  }
}

/**
 * Load navigation history from sessionStorage
 * @private
 */
function loadHistory() {
  const data = sessionStorage.getItem(NAVIGATION_HISTORY_KEY);
  return data ? JSON.parse(data) : [];
}
