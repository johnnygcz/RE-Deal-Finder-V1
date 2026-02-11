/**
 * useNavigationHistory - React hook for managing in-app back button navigation
 * Handles state restoration when user clicks back
 */

import { useCallback } from 'react';
import { popNavigation, canNavigateBack } from '../utils/navigationState';

export function useNavigationHistory(onNavigate) {
  const canGoBack = canNavigateBack();

  const goBack = useCallback(() => {
    const previousState = popNavigation();
    
    if (previousState && onNavigate) {
      console.log('🔙 Navigating back to:', previousState);
      onNavigate(previousState);
    } else {
      console.log('ℹ️ No previous state available for back navigation');
    }
  }, [onNavigate]);

  return {
    canGoBack,
    goBack
  };
}
