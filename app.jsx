import { useState, useEffect, useRef } from 'react';
import { Box, Stack, HStack, VStack, Text, Button, IconButton, Progress, Separator, Alert, Spinner, Badge, Input, Menu, Portal, createToaster, Tooltip } from '@chakra-ui/react';
import { Home, Settings, RotateCcw, MapIcon, ListIcon, BarChart3, Search, Plus, Edit, ChevronDown, Clock, FileText, LogOut } from 'lucide-react';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

import { usePropertyData } from './hooks/usePropertyData';
import { useFilters } from './hooks/useFilters';
import { useScheduledRefresh } from './hooks/useScheduledRefresh';
import { saveSession, loadSession, updateSession, clearSession } from './utils/sessionManager';
import { pushNavigation } from './utils/navigationState';
import FilterBar from './components/FilterBar';
import DealAnalyser from './components/DealAnalyser';
import ChartsView from './components/ChartsView';
import WardFilterPanel from './components/WardFilterPanel';
import SettingsPage from './components/SettingsPage';
import LoginPage from './components/LoginPage';
import LensPage from './components/LensPage';
import DataLoadingProgress from './components/DataLoadingProgress';
import SearchView from './components/SearchView';
import ResearchView from './components/ResearchView';
import AnalyserView from './components/AnalyserView';
import OfferTrackerView from './components/OfferTrackerView';
import MyFeedView from './components/MyFeedView';
import { windsorWards } from './data/windsorWards';
import { ReDealFinderBoard } from '@api/BoardSDK.js';
import { storage } from '@api/monday-storage';
// Create toaster for notifications
const toaster = createToaster({
  placement: 'top',
  duration: 3000,
});

// HARDCODED DEFAULT LENSES - Always present, no storage dependency
const DEFAULT_LENSES = [
  {
    id: 'all-listings',
    name: 'All Listings',
    filters: {}, // No filters - shows everything
    isDefault: true
  },
  {
    id: 'buy-box',
    name: 'Buy Box',
    filters: {
      domMin: 30, // 30+ days on market
      propertyTypes: ['House', 'Single Family'] // Only House and Single Family
    },
    isDefault: true
  },
  {
    id: 'in-ghl',
    name: 'In GHL',
    filters: {
      ghlStatus: 'sent' // Only properties with SENT status
    },
    isDefault: true
  }
];

// Helper function to format timestamp as "X ago"
const formatTimeAgo = (timestamp) => {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

export default function App() {
  const [currentStep, setCurrentStep] = useState(() => {
    // Try to load session on mount
    const session = loadSession();
    return session?.currentStep || 'login';
  });
  const [currentUser, setCurrentUser] = useState(() => {
    const session = loadSession();
    return session?.currentUser || null;
  });
  const [lenses, setLenses] = useState(DEFAULT_LENSES);
  const [activeLensId, setActiveLensId] = useState('all-listings');
  const [defaultLensId, setDefaultLensId] = useState(null);
  const [viewMode, setViewMode] = useState(() => {
    const session = loadSession();
    return session?.viewMode || 'map';
  });
  const [previousView, setPreviousView] = useState('map');
  const [showMapLoadingAnimation, setShowMapLoadingAnimation] = useState(false);
  const [isCreatingNewLens, setIsCreatingNewLens] = useState(false);
  const [realtorFilter, setRealtorFilter] = useState(() => {
    const session = loadSession();
    return session?.realtorFilter || null;
  });
  const prevStepRef = useRef('login');
  
  const activeLens = lenses.find(l => l.id === activeLensId) || null;
  
  // Scheduled refresh hook for automatic data updates
  const scheduledRefresh = useScheduledRefresh();

  // Parse URL hash for realtor filter on mount and hash change
  // CRITICAL: Also close any open property detail modal when navigating to filtered view
  useEffect(() => {
    const parseHash = () => {
      const hash = window.location.hash.substring(1); // Remove '#'
      const params = new URLSearchParams(hash);
      
      const view = params.get('view');
      const realtor = params.get('realtor');
      
      if (view === 'list' && realtor) {
        setViewMode('list');
        setRealtorFilter(decodeURIComponent(realtor));
      } else {
        setRealtorFilter(null);
      }
    };
    
    parseHash();
    window.addEventListener('hashchange', parseHash);
    
    return () => window.removeEventListener('hashchange', parseHash);
  }, []);

  // Save session state whenever relevant state changes
  useEffect(() => {
    if (currentUser && currentStep === 'main') {
      saveSession({
        currentStep,
        currentUser,
        viewMode,
        realtorFilter
      });
    }
  }, [currentStep, currentUser, viewMode, realtorFilter]);

  // Update browser tab title based on current view
  useEffect(() => {
    let title = 'RE Deal Finder';
    
    if (currentStep === 'main') {
      if (viewMode === 'map') {
        title = 'RE Deal Finder - Map';
      } else if (viewMode === 'feed') {
        title = 'RE Deal Finder - My Feed';
      } else if (viewMode === 'list') {
        title = 'RE Deal Finder - List';
      } else if (viewMode === 'detailed') {
        title = 'RE Deal Finder - Detailed View';
      } else if (viewMode === 'research') {
        title = 'RE Deal Finder - Research';
      } else if (viewMode === 'analyser') {
        title = 'RE Deal Finder - Analyser';
      } else if (viewMode === 'offers') {
        title = 'RE Deal Finder - Offers';
      } else if (viewMode === 'charts') {
        title = 'RE Deal Finder - Analytics';
      } else if (viewMode === 'search') {
        title = 'RE Deal Finder - Search';
      } else if (viewMode === 'settings') {
        title = 'RE Deal Finder - Settings';
      }
    } else if (currentStep === 'lens') {
      title = 'RE Deal Finder - Select Lens';
    } else if (currentStep === 'login') {
      title = 'RE Deal Finder - Sign In';
    }
    
    document.title = title;
  }, [currentStep, viewMode]);
  
  // Pass active lens filters AND currentUser to usePropertyData
  // This ensures data filtering happens when lens changes and user-specific GHL columns are fetched
  const { 
    properties, 
    allProperties, 
    loading, 
    error, 
    stats, 
    loadingProgress, 
    isApplyingFilters, 
    isDownloading,
    lastUpdated,
    refreshData,
    supabaseStatus
  } = usePropertyData(activeLens?.filters || {}, currentUser, scheduledRefresh);
  
  // Manual refresh button is ALWAYS enabled (24/7)
  // Only automated scheduled refreshes follow the business hours schedule
  
  // Keep useFilters for UI state management (not used for data filtering)
  const { filters, setFilters } = useFilters();

  // Handle logout - clear session and return to login
  const handleLogout = () => {
    console.log('🚪 Logging out user:', currentUser?.username);
    clearSession();
    setCurrentUser(null);
    setCurrentStep('login');
    setViewMode('map');
    setRealtorFilter(null);
    setLenses(DEFAULT_LENSES);
    setActiveLensId('all-listings');
    setDefaultLensId(null);
    console.log('✓ Session cleared, returned to login');
  };

  // Dual-storage system: Monday.com Storage API (primary) + localStorage (fallback)
  const saveLensesToStorage = async (user, lensesData, activeId, customDefaultId = null) => {
    if (!user || !user.username) {
      console.error('❌ Cannot save lenses: No user provided');
      return false;
    }
    
    const storageKey = `user_${user.username}_lenses`;
    const localStorageKey = `app_lenses_${user.username}`;
    
    // Prepare lens data with active lens ID and default lens ID
    const lensDataToSave = {
      lenses: lensesData,
      activeLensId: activeId,
      defaultLensId: customDefaultId !== null ? customDefaultId : defaultLensId,
      timestamp: Date.now()
    };
    
    console.log(`💾 Saving ${lensesData.length} lenses for user ${user.username}...`);
    console.log('Data to save:', {
      lensCount: lensDataToSave.lenses.length,
      activeLensId: lensDataToSave.activeLensId,
      defaultLensId: lensDataToSave.defaultLensId,
      timestamp: lensDataToSave.timestamp
    });
    
    // ALWAYS save to localStorage first (reliable fallback)
    try {
      localStorage.setItem(localStorageKey, JSON.stringify(lensDataToSave));
      console.log('✅ Saved to localStorage (fallback)');
    } catch (localError) {
      console.error('❌ Failed to save to localStorage:', localError);
    }
    
    // Try Monday.com Storage API (with retry logic)
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      try {
        console.log(`📡 Attempting Monday.com storage save (attempt ${attempts + 1}/${maxAttempts})...`);
        
        // Get current version for optimistic locking
        const getResult = await storage().key(storageKey).get();
        const currentVersion = getResult?.version;
        
        // Save to Monday.com storage
        const setResult = await storage().key(storageKey).version(currentVersion).set(lensDataToSave);
        console.log('Monday.com save result:', setResult);
        
        // Verify the save
        const verifyResult = await storage().key(storageKey).get();
        
        if (!verifyResult?.value || verifyResult.value.lenses?.length !== lensesData.length) {
          throw new Error('Save verification failed - data not persisted correctly');
        }
        
        console.log(`✅ Saved ${lensesData.length} lenses to Monday.com storage`);
        
        // Show success toast
        toaster.create({
          title: 'Lenses Saved',
          description: `${lensesData.length} lens${lensesData.length !== 1 ? 'es' : ''} saved to cloud storage`,
          type: 'success',
        });
        
        return true;
      } catch (error) {
        attempts++;
        console.error(`❌ Monday.com storage error (attempt ${attempts}/${maxAttempts}):`, error);
        
        if (attempts >= maxAttempts) {
          console.warn('⚠️ Monday.com storage failed after 3 attempts - using localStorage fallback');
          
          // Show warning toast
          toaster.create({
            title: 'Saved Locally',
            description: `Lenses saved to browser storage. Cloud sync unavailable.`,
            type: 'warning',
          });
          
          return true; // Still return true since localStorage succeeded
        }
        
        // Wait before retry (exponential backoff: 1s, 2s, 4s)
        const delay = Math.pow(2, attempts - 1) * 1000;
        console.log(`⏳ Retrying in ${delay / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    return true; // localStorage succeeded even if Monday.com failed
  };

  const loadLensesFromStorage = async (user) => {
    if (!user || !user.username) {
      console.error('❌ Cannot load lenses: No user provided');
      return null;
    }
    
    const storageKey = `user_${user.username}_lenses`;
    const localStorageKey = `app_lenses_${user.username}`;
    
    console.log(`📦 Loading lenses for user ${user.username} from dual storage...`);
    console.log(`   Cloud Key: ${storageKey}`);
    console.log(`   Local Key: ${localStorageKey}`);
    
    // 1. Try Monday.com Storage API first (Cloud)
    try {
      console.log(`📡 Step 1: Checking Monday.com cloud storage...`);
      const result = await storage().key(storageKey).get();
      
      console.log(`   Monday.com API response:`, {
        hasResult: !!result,
        hasValue: !!result?.value,
        version: result?.version
      });
      
      if (result && result.value) {
        const data = typeof result.value === 'string' ? JSON.parse(result.value) : result.value;
        
        console.log(`   Parsed data:`, {
          hasLenses: !!data?.lenses,
          lensCount: data?.lenses?.length || 0,
          activeLensId: data?.activeLensId,
          defaultLensId: data?.defaultLensId,
          timestamp: data?.timestamp ? new Date(data.timestamp).toISOString() : 'none'
        });
        
        if (data && data.lenses && data.lenses.length > 0) {
          console.log(`✅ SUCCESS: Loaded ${data.lenses.length} lenses from Monday.com cloud storage`);
          console.log(`   Lens names: ${data.lenses.map(l => l.name).join(', ')}`);
          
          // Sync to localStorage for future fallback (Cloud -> Local)
          try {
            localStorage.setItem(localStorageKey, JSON.stringify(data));
            console.log('✅ Synced cloud data to localStorage for offline access');
          } catch (e) {
            console.warn('⚠️ Failed to sync to localStorage:', e);
          }
          
          // Show success toast
          toaster.create({
            title: 'Lenses Loaded from Cloud',
            description: `${data.lenses.length} saved lens${data.lenses.length !== 1 ? 'es' : ''} restored from Monday.com`,
            type: 'success',
            duration: 3000,
          });
          
          return {
            lenses: data.lenses || [],
            activeLensId: data.activeLensId || null,
            defaultLensId: data.defaultLensId || null,
            source: 'cloud'
          };
        } else {
          console.log('ℹ️ Monday.com storage returned data but no valid lenses array');
        }
      } else {
        console.log('ℹ️ No data found in Monday.com storage (key may not exist yet)');
      }
    } catch (error) {
      console.warn('⚠️ Monday.com storage load failed with error:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
    
    // 2. Fallback to localStorage
    try {
      console.log('📦 Step 2: Checking localStorage fallback...');
      const localData = localStorage.getItem(localStorageKey);
      
      if (localData) {
        console.log(`   Found localStorage data (${localData.length} bytes)`);
        const data = JSON.parse(localData);
        
        console.log(`   Parsed localStorage data:`, {
          hasLenses: !!data?.lenses,
          lensCount: data?.lenses?.length || 0,
          activeLensId: data?.activeLensId,
          defaultLensId: data?.defaultLensId
        });
        
        if (data && data.lenses && data.lenses.length > 0) {
          console.log(`✅ SUCCESS: Loaded ${data.lenses.length} lenses from localStorage (fallback)`);
          console.log(`   Lens names: ${data.lenses.map(l => l.name).join(', ')}`);
          
          // 3. Self-healing: Sync localStorage data UP to cloud (Local ->_Cloud)
          // This fixes the issue where cloud might be empty but local has data
          try {
            console.log('🔄 Self-healing: Syncing localStorage data UP to cloud...');
            // Get current version for optimistic locking (if key exists)
            const getResult = await storage().key(storageKey).get();
            const currentVersion = getResult?.version;
            
            console.log(`   Cloud version before sync: ${currentVersion || 'none (new key)'}`);
            
            await storage().key(storageKey).version(currentVersion).set(data);
            console.log('✅ Successfully synced localStorage data to cloud storage');
            
            toaster.create({
              title: 'Lenses Synced to Cloud',
              description: 'Your lenses are now saved in Monday.com cloud storage',
              type: 'success',
              duration: 4000,
            });
          } catch (syncError) {
            console.warn('❌ Self-healing sync failed:', {
              name: syncError.name,
              message: syncError.message,
              stack: syncError.stack
            });
            // Don't fail the load just because sync failed
            toaster.create({
              title: 'Lenses Loaded Locally',
              description: 'Using local lenses. Cloud sync will retry next time.',
              type: 'info',
              duration: 3000,
            });
          }
          
          return {
            lenses: data.lenses || [],
            activeLensId: data.activeLensId || null,
            defaultLensId: data.defaultLensId || null,
            source: 'localStorage'
          };
        } else {
          console.log('ℹ️ localStorage data exists but no valid lenses array');
        }
      } else {
        console.log('ℹ️ No data found in localStorage');
      }
    } catch (localError) {
      console.error('❌ Failed to load from localStorage:', {
        name: localError.name,
        message: localError.message,
        stack: localError.stack
      });
    }
    
    console.log('⚠️ BOTH STORAGES EMPTY - No lenses found in cloud OR localStorage');
    console.log('   This is expected for new users or after clearing browser data');
    return null;
  };

  // SIMPLIFIED: Load user's custom lenses from storage and merge with hardcoded defaults
  useEffect(() => {
    if (currentUser && currentStep === 'lens' && !isCreatingNewLens) {
      console.log(`🔍 User ${currentUser.username} logged in - default lenses already loaded, checking for custom lenses...`);
      
      loadLensesFromStorage(currentUser).then(stored => {
        if (stored && stored.lenses && stored.lenses.length > 0) {
          console.log(`📦 Found ${stored.lenses.length} custom lens${stored.lenses.length !== 1 ? 'es' : ''} in storage`);
          
          // Merge stored custom lenses with hardcoded defaults
          // Keep defaults, add any custom lenses that don't conflict
          const customLenses = stored.lenses.filter(l => 
            !DEFAULT_LENSES.some(d => d.id === l.id) // Exclude if it's a default lens
          );
          
          const mergedLenses = [...DEFAULT_LENSES, ...customLenses];
          setLenses(mergedLenses);
          
          // Restore active lens (or use default if it doesn't exist)
          const activeId = stored.activeLensId && mergedLenses.find(l => l.id === stored.activeLensId)
            ? stored.activeLensId
            : 'all-listings';
          setActiveLensId(activeId);
          setDefaultLensId(stored.defaultLensId || null);
          
          console.log(`✅ Loaded ${mergedLenses.length} total lenses (${DEFAULT_LENSES.length} defaults + ${customLenses.length} custom)`);
        } else {
          console.log(`ℹ️ No custom lenses found - using ${DEFAULT_LENSES.length} hardcoded defaults only`);
        }
        
        // Always go directly to main - defaults are already loaded
        console.log(`⏭️ Going directly to dashboard with "All Listings" active`);
        setCurrentStep('main');
      }).catch(error => {
        console.error('❌ Error loading custom lenses:', error);
        console.log(`✓ Using ${DEFAULT_LENSES.length} hardcoded default lenses only`);
        // Defaults are already in state, just proceed
        setCurrentStep('main');
      });
    }
  }, [currentUser, currentStep, isCreatingNewLens]);

  // Handle explicit save action - save to storage
  const handleSaveLenses = async () => {
    if (!currentUser) {
      toaster.create({
        title: 'Save Failed',
        description: 'No user logged in',
        type: 'error',
      });
      return;
    }
    
    if (lenses.length === 0) {
      toaster.create({
        title: 'Nothing to Save',
        description: 'Create a lens first before saving',
        type: 'info',
      });
      return;
    }
    
    const success = await saveLensesToStorage(currentUser, lenses, activeLensId);
    
    if (success) {
      console.log(`✅ Saved! ${lenses.length} lens${lenses.length !== 1 ? 'es' : ''} saved successfully to Monday.com storage`);
    }
  };

  // Handle lens selection - update activeLensId only
  // The activeLens.filters will automatically be passed to usePropertyData
  const handleLensSelect = (lensId) => {
    setActiveLensId(lensId);
    const selectedLens = lenses.find(l => l.id === lensId);
    if (selectedLens) {
      console.log(`✓ Switched to lens: ${selectedLens.name}, filters will be applied automatically`);
      
      // Auto-save lens selection to cloud
      if (currentUser) {
        saveLensesToStorage(currentUser, lenses, lensId, defaultLensId).catch(error => {
          console.error('Failed to auto-save lens selection:', error);
        });
      }
    }
  };

  // Handle setting a lens as default
  const handleSetDefaultLens = (lensId) => {
    if (!lensId) return;
    
    const lens = lenses.find(l => l.id === lensId);
    if (! lens) return;
    
    setDefaultLensId(lensId);
    console.log(`⭐ Set "${lens.name}" as default lens`);
    
    // Auto-save to storage
    if (currentUser) {
      saveLensesToStorage(currentUser, lenses, activeLensId, lensId).then(() => {
        toaster.create({
          title: 'Default Lens Set',
          description: `"${lens.name}" is now your default lens`,
          type: 'success',
        });
      }).catch(error => {
        console.error('Failed to save default lens:', error);
        toaster.create({
          title: 'Save Failed',
          description: 'Could not save default lens setting',
          type: 'error',
        });
      });
    }
  };

  const handleCreateNewLens = () => {
    // Set flag to prevent auto-skip when navigating to lens page
    setIsCreatingNewLens(true);
    setCurrentStep('lens');
    console.log('📝 Navigating to lens creation page');
  };

  // Track when we transition from lens to main to show loading animation
  useEffect(() => {
    if (prevStepRef.current === 'lens' && currentStep === 'main') {
      setShowMapLoadingAnimation(true);
    }
    prevStepRef.current = currentStep;
  }, [currentStep]);

  // Hide loading animation when data is loaded (data-driven, not timed)
  useEffect(() => {
    if (showMapLoadingAnimation && loadingProgress.percent >= 100) {
      // Hold at 100% for 1 second to show full map with "Found X deals!" message
      const timer = setTimeout(() => {
        setShowMapLoadingAnimation(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [showMapLoadingAnimation, loadingProgress]);

  // Generate filter summary for loading animation
  const getFilterSummary = () => {
    if (!activeLens) return [];
    const summary = [];
    const f = activeLens.filters;

    if (f.propertyTypes?.length > 0) {
      summary.push(`Property Types: ${f.propertyTypes.join(', ')}`);
    }
    if (f.statuses?.length > 0) {
      summary.push(`Status: ${f.statuses.join(', ')}`);
    }
    if (f.priceMin || f.priceMax) {
      const priceText = f.priceMin && f.priceMax 
        ? `Price: $${(f.priceMin/1000).toFixed(0)}k - $${(f.priceMax/1000).toFixed(0)}k`
        : f.priceMin 
        ? `Price: over $${(f.priceMin/1000).toFixed(0)}k`
        : `Price: up to $${(f.priceMax/1000).toFixed(0)}k`;
      summary.push(priceText);
    }
    if (f.wards?.length > 0) {
      summary.push(`Wards: ${f.wards.map(w => w.replace('Ward ', '')).join(', ')}`);
    }
    if (f.bedsMin || f.bedsMax) {
      const bedsText = f.bedsMin && f.bedsMax 
        ? `${f.bedsMin}-${f.bedsMax} bedrooms`
        : f.bedsMin 
        ? `${f.bedsMin}+ bedrooms`
        : `up to ${f.bedsMax} bedrooms`;
      summary.push(bedsText);
    }
    if (f.bathsMin || f.bathsMax) {
      const bathsText = f.bathsMin && f.bathsMax 
        ? `${f.bathsMin}-${f.bathsMax} bathrooms`
        : f.bathsMin 
        ? `${f.bathsMin}+ bathrooms`
        : `up to ${f.bathsMax} bathrooms`;
      summary.push(bathsText);
    }
    if (f.dropFreqMin || f.dropFreqMax) {
      const dropFreqText = f.dropFreqMin && f.dropFreqMax 
        ? `${f.dropFreqMin}-${f.dropFreqMax} price drops`
        : f.dropFreqMin 
        ? `${f.dropFreqMin}+ price drops`
        : `up to ${f.dropFreqMax} price drops`;
      summary.push(dropFreqText);
    }
    if (f.dropPercentMin || f.dropPercentMax) {
      const dropPercentText = f.dropPercentMin && f.dropPercentMax 
        ? `${f.dropPercentMin}%-${f.dropPercentMax}% price reduction`
        : f.dropPercentMin 
        ? `${f.dropPercentMin}%+ price reduction`
        : `up to ${f.dropPercentMax}% price reduction`;
      summary.push(dropPercentText);
    }

    return summary.length > 0 ? summary : ['Searching all properties'];
  };

  // Handle drill-down from charts to filtered list view with category-specific filters
  const handleChartDrillDown = (realtorName, category, metadata = {}) => {
    console.log(`📊 Chart drill-down: Realtor="${realtorName}", Category="${category}", Metadata=`, metadata);
    
    // Map category titles to filter configurations
    const categoryFilters = {
      'Relist Champions': { statuses: ['RELISTED'] },
      'Volume Leaders': {}, // No additional filter - just show all their listings
      'Fastest Sellers': {}, // No additional filter
      'The Shapeshifter': { statuses: ['RELISTED'] }, // Relisted OR price drops
      'Price Drop Pros': {}, // Properties with price drops (already in data)
      'Ward Specialists': {}, // Ward filter applied via metadata
      'Deal Finders': {}, // Deal score filter applied via metadata
      // Add more mappings as needed
    };
    
    // Get the filter configuration for this category
    let additionalFilters = categoryFilters[category] || {};
    
    // Apply metadata-based filters
    if (metadata.ward) {
      // Ward Specialists: filter by specific ward
      additionalFilters = {
        ...additionalFilters,
        wards: [metadata.ward]
      };
      console.log(`✓ Applied Ward Specialists filter: Ward="${metadata.ward}"`);
    }
    
    if (category === 'Deal Finders') {
      // Deal Finders: filter to show only properties with deal scores >= 60
      // This is done client-side in DealAnalyser via property scoring
      console.log(`✓ Applied Deal Finders context: filtering for high-value deals`);
    }
    
    // Update active lens filters to include category-specific filters
    if (Object.keys(additionalFilters).length > 0) {
      const updatedFilters = {
        ...activeLens.filters,
        ...additionalFilters
      };
      
      // Update the active lens with new filters
      const updatedLens = { ...activeLens, filters: updatedFilters };
      setLenses(lenses.map(l => l.id === activeLensId ? updatedLens : l));
      
      console.log(`✓ Applied category filters:`, additionalFilters);
    }
    
    // 1. Update hash to drive state (App's useEffect will catch this)
    const hashParams = new URLSearchParams();
    hashParams.set('view', 'list');
    hashParams.set('realtor', realtorName);
    if (category) {
      hashParams.set('category', category);
    }
    if (metadata.ward) {
      hashParams.set('ward', metadata.ward);
    }
    window.location.hash = `#${hashParams.toString()}`;
    
    // 2. Immediate state update for responsiveness
    setViewMode('list');
    setRealtorFilter(realtorName);
    
    console.log(`✓ Navigated to list view with realtor="${realtorName}", category="${category}", and ward="${metadata.ward || 'N/A'}"`);
  };

  if (currentStep === 'login') {
    return <LoginPage onLogin={(user) => {
      console.log('=== APP.JSX - USER LOGIN DEBUG ===');
      console.log('Received user from LoginPage:', user);
      console.log('user.username:', user?.username);
      console.log('user.monGhlColumn:', user?.monGhlColumn);
      console.log('user object keys:', user ? Object.keys(user) : 'null');
      console.log('=====================================');
      
      setCurrentUser(user); // user object now contains { username, itemId, monGhlColumn }
      setCurrentStep('lens');
    }} />;
  }

  if (currentStep === 'lens') {
    return (
      <LensPage
        lenses={lenses}
        activeLensId={activeLensId}
        onCreateLens={(lensName) => {
          const newLens = {
            id: Date.now().toString(),
            name: lensName,
            filters: {
              propertyTypes: [],
              statuses: [],
              priceMin: undefined,
              priceMax: undefined,
              domMin: undefined,
              domMax: undefined,
              wards: [],
              compsMode: 'any',
              dropPercentMin: undefined,
              dropPercentMax: undefined,
              dropDollarMin: undefined,
              dropDollarMax: undefined,
              dropFreqMin: undefined,
              dropFreqMax: undefined,
              bedsMin: undefined,
              bedsMax: undefined,
              bathsMin: undefined,
              bathsMax: undefined
            }
          };
          setLenses([...lenses, newLens]);
          setActiveLensId(newLens.id);
        }}
        onSelectLens={(id) => setActiveLensId(id)}
        onUpdateLens={(lensId, updatedFilters) => {
          setLenses(lenses.map(l => 
            l.id === lensId ? { ...l, filters: updatedFilters } : l
          ));
        }}
        onRenameLens={(lensId, newName) => {
          setLenses(lenses.map(l => 
            l.id === lensId ? { ...l, name: newName } : l
          ));
        }}
        onDeleteLens={(lensId) => {
          console.log('🗑️ App.jsx: onDeleteLens called with lensId:', lensId);
          const lensToDelete = lenses.find(l => l.id === lensId);
          console.log('📋 Deleting lens:', {
            id: lensId,
            name: lensToDelete?.name,
            isActive: activeLensId === lensId,
            isDefault: defaultLensId === lensId,
            totalLensesBefore: lenses.length
          });
          
          const updatedLenses = lenses.filter(l => l.id !== lensId);
          console.log('✅ Updated lenses array:', {
            totalLensesAfter: updatedLenses.length,
            remainingLenses: updatedLenses.map(l => ({ id: l.id, name: l.name }))
          });
          
          setLenses(updatedLenses);
          
          // If deleting the active lens, switch to another lens
          if (activeLensId === lensId) {
            const newActiveLensId = updatedLenses.length > 0 ? updatedLenses[0].id : null;
            console.log('🔄 Active lens was deleted, switching to:', newActiveLensId || 'none');
            setActiveLensId(newActiveLensId);
          }
          
          // If deleting the default lens, clear default lens ID (fall back to Default Buy Box)
          if (defaultLensId === lensId) {
            setDefaultLensId(null);
            console.log('⚠️ Default lens deleted - will use Default Buy Box on next login');
          }
          
          console.log('✅ Lens deletion complete');
        }}
        defaultLensId={defaultLensId}
        onSetDefaultLens={handleSetDefaultLens}
        onSave={handleSaveLenses}
        onContinue={() => {
          setIsCreatingNewLens(false); // Reset flag when leaving lens page
          setCurrentStep('main');
        }}
      />
    );
  }

  // CRITICAL: NEVER show blocking loading screen
  // Starter data loads instantly, so properties.length should always be > 0
  // Background fetch uses non-blocking top-right progress indicator only
  
  // Only show blocking error if absolutely NO data at all (not even starter data)
  if (error && properties.length === 0) {
    return (
      <Box p={8}>
        <Alert.Root colorPalette="red">
          <Alert.Title>Error Loading Data</Alert.Title>
          <Alert.Description>{error}</Alert.Description>
        </Alert.Root>
      </Box>
    );
  }

  return (
    <Box minHeight="100vh" display="flex" flexDirection="column" bg="bg.canvas" fontFamily="Figtree, sans-serif" position="relative">
      
      {/* Windsor Map Loading Animation Overlay */}
      {showMapLoadingAnimation && (
        <Box
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="#0F172A"
          zIndex={9999}
          overflow="hidden"
        >
          {/* Actual Windsor Map Background using Leaflet */}
          <Box
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            opacity={0.3}
            css={{
              '& .leaflet-container': {
                background: 'transparent',
                zIndex: 1
              },
              '& .leaflet-control-container': {
                display: 'none'
              }
            }}
          >
            <MapContainer
              center={[42.26, -83.00]}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
              zoomControl={false}
              dragging={false}
              scrollWheelZoom={false}
              doubleClickZoom={false}
              touchZoom={false}
              keyboard={false}
              attributionControl={false}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                opacity={0.6}
              />
            </MapContainer>
          </Box>

          {/* Progressive Dark Overlay - Fades as loading progresses (data-driven) */}
          <Box
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            zIndex={2}
            pointerEvents="none"
            style={{
              backgroundColor: `rgba(0, 0, 0, ${Math.max(0, 0.9 - (loadingProgress.percent / 100 * 0.9))})`,
              transition: 'background-color 0.5s ease-out'
            }}
          />

          {/* Animated Grid Pattern */}
          <Box
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            opacity={0.2}
            zIndex={3}
            css={{
              backgroundImage: 'linear-gradient(rgba(59, 130, 246, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.3) 1px, transparent 1px)',
              backgroundSize: '50px 50px',
              animation: 'gridPulse 3s ease-in-out infinite'
            }}
          />

          {/* Animated Magnifying Glass with Trail */}
          <Box
            position="absolute"
            zIndex={4}
            css={{
              animation: 'magnifySearch 4.5s cubic-bezier(0.4, 0, 0.2, 1) infinite'
            }}
          >
            {/* Glowing Trail */}
            <Box
              position="absolute"
              width="120px"
              height="120px"
              top="-20px"
              left="-20px"
              borderRadius="full"
              bg="radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, transparent 70%)"
              css={{
                animation: 'trailFade 1s ease-out infinite'
              }}
            />
            
            <svg width="80" height="80" viewBox="0 0 80 80" style={{ filter: 'drop-shadow(0 0 15px rgba(59, 130, 246, 0.9))' }}>
              {/* Outer Glow Ring */}
              <circle cx="30" cy="30" r="26" stroke="rgba(59, 130, 246, 0.3)" strokeWidth="2" fill="none">
                <animate attributeName="r" values="26;28;26" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.3;0.6;0.3" dur="2s" repeatCount="indefinite" />
              </circle>
              
              {/* Main Lens */}
              <circle cx="30" cy="30" r="22" stroke="#3B82F6" strokeWidth="4" fill="rgba(59, 130, 246, 0.1)" />
              
              {/* Handle */}
              <line x1="46" y1="46" x2="70" y2="70" stroke="#3B82F6" strokeWidth="6" strokeLinecap="round" />
              
              {/* Zoom Effect Center */}
              <circle cx="30" cy="30" r="8" fill="#3B82F6" opacity="0.6">
                <animate attributeName="r" values="6;10;6" dur="1.5s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.4;0.8;0.4" dur="1.5s" repeatCount="indefinite" />
              </circle>
              
              {/* Lens Reflection */}
              <ellipse cx="24" cy="24" rx="8" ry="10" fill="rgba(255, 255, 255, 0.3)" opacity="0.5" />
            </svg>
          </Box>

          {/* Scanning Hotspots - Constrained to Windsor area */}
          {[
            { top: '30%', left: '25%', delay: '0s' },
            { top: '45%', left: '65%', delay: '0.6s' },
            { top: '60%', left: '35%', delay: '1.2s' },
            { top: '30%', left: '70%', delay: '1.8s' },
            { top: '70%', left: '50%', delay: '2.4s' }
          ].map((spot, i) => (
            <Box
              key={i}
              position="absolute"
              zIndex={5}
              top={spot.top}
              left={spot.left}
              width="16px"
              height="16px"
              borderRadius="full"
              bg="#3B82F6"
              boxShadow="0 0 25px rgba(59, 130, 246, 0.8)"
              css={{
                animation: `hotspotPulse 2.5s ease-in-out infinite`,
                animationDelay: spot.delay
              }}
            />
          ))}

          {/* Filter Criteria Panel */}
          <Box
            position="absolute"
            zIndex={6}
            bottom="140px"
            left="50%"
            transform="translateX(-50%)"
            bg="rgba(30, 41, 59, 0.95)"
            borderRadius="xl"
            p={6}
            minW="500px"
            maxW="700px"
            backdropFilter="blur(15px)"
            border="2px solid rgba(59, 130, 246, 0.4)"
            boxShadow="0 8px 32px rgba(0, 0, 0, 0.4)"
          >
            <Text fontSize="xl" fontWeight="bold" color="white" mb={4} textAlign="center" letterSpacing="wide">
              Finding deals matching your criteria...
            </Text>
            <VStack align="start" gap={2.5}>
              {getFilterSummary().map((criteria, idx) => (
                <HStack
                  key={idx}
                  gap={2}
                  css={{
                    animation: 'fadeInSlide 0.5s ease-out forwards',
                    animationDelay: `${idx * 0.3}s`,
                    opacity: 0
                  }}
                >
                  <Box width="6px" height="6px" borderRadius="full" bg="#3B82F6" flexShrink={0} />
                  <Text color="rgba(255, 255, 255, 0.95)" fontSize="md" fontWeight="medium">
                    {criteria}
                  </Text>
                </HStack>
              ))}
            </VStack>
          </Box>

          {/* Progress Indicator - With Percentage */}
          <Box
            position="absolute"
            zIndex={6}
            bottom="50px"
            left="50%"
            transform="translateX(-50%)"
            textAlign="center"
            minW="400px"
          >
            <VStack gap={2}>
              <HStack gap={0} justify="center">
                <Text color="white" fontSize="lg" fontWeight="medium">Loading</Text>
                <Text 
                  color="white" 
                  fontSize="lg" 
                  fontWeight="medium"
                  css={{ 
                    animation: 'dots 1.5s steps(4, end) infinite',
                    display: 'inline-block',
                    minWidth: '1.5em',
                    textAlign: 'left'
                  }}
                >
                  ...
                </Text>
              </HStack>
              <Text color="rgba(255, 255, 255, 0.8)" fontSize="2xl" fontWeight="bold">
                {Math.round(loadingProgress.percent)}%
              </Text>
            </VStack>
          </Box>

          {/* CSS Keyframes */}
          <style>
            {`
              @keyframes magnifySearch {
                0% { top: 25%; left: 15%; transform: scale(1) rotate(-5deg); }
                15% { top: 25%; left: 35%; transform: scale(1.05) rotate(0deg); }
                30% { top: 25%; left: 70%; transform: scale(1) rotate(5deg); }
                45% { top: 45%; left: 70%; transform: scale(1.05) rotate(0deg); }
                60% { top: 45%; left: 25%; transform: scale(1) rotate(-5deg); }
                75% { top: 65%; left: 55%; transform: scale(1.05) rotate(5deg); }
                90% { top: 65%; left: 15%; transform: scale(1) rotate(0deg); }
                100% { top: 25%; left: 15%; transform: scale(1) rotate(-5deg); }
              }
              @keyframes gridPulse {
                0%, 100% { opacity: 0.15; }
                50% { opacity: 0.3; }
              }
              @keyframes hotspotPulse {
                0%, 100% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.8); opacity: 0.3; }
              }
              @keyframes trailFade {
                0% { opacity: 0.4; transform: scale(1); }
                100% { opacity: 0; transform: scale(1.5); }
              }
              @keyframes fadeInSlide {
                from { opacity: 0; transform: translateX(-15px); }
                to { opacity: 1; transform: translateX(0); }
              }
              @keyframes dots {
                0% { content: ''; }
                25% { content: '.'; }
                50% { content: '..'; }
                75% { content: '...'; }
              }
            `}
          </style>
        </Box>
      )}
      
      {/* HEADER */}
      <Box 
        bg="#334155"
        borderBottomWidth="1px" 
        borderColor="border.muted" 
        px={6} 
        py={3}
        flexShrink={0}
      >
        <HStack justify="space-between" align="center">
          
          {/* Left: Logo & View Toggle */}
          <HStack gap={8}>
            <HStack gap={2}>
              <Home size={20} strokeWidth={2.5} color="white" />
              <Text fontSize="lg" fontWeight="bold" letterSpacing="tight" color="white">
                RE DEAL FINDER
              </Text>
            </HStack>

            {/* View Toggle (Segmented Control) - Hide on Settings page */}
            {viewMode !== 'settings' && (
              <HStack gap={4}>
                <Box bg="rgba(255,255,255,0.1)" p={1} borderRadius="md" display="flex">
                  <Button 
                    size="sm" 
                    variant={viewMode === 'map' ? 'solid' : 'ghost'} 
                    colorPalette={viewMode === 'map' ? 'blue' : 'gray'}
                    onClick={() => setViewMode('map')}
                    px={4}
                    height="28px"
                    color={viewMode === 'map' ? 'white' : 'whiteAlpha.800'}
                  >
                    <MapIcon size={14} style={{ marginRight: '6px' }} /> Map
                  </Button>

                  {/* My Feed - Only visible to TimB */}
                  {currentUser?.username === 'TimB' && (
                    <Button 
                      size="sm" 
                      variant={viewMode === 'feed' ? 'solid' : 'ghost'} 
                      colorPalette={viewMode === 'feed' ? 'blue' : 'gray'}
                      onClick={() => setViewMode('feed')}
                      px={4}
                      height="28px"
                      color={viewMode === 'feed' ? 'white' : 'whiteAlpha.800'}
                    >
                      <Home size={14} style={{ marginRight: '6px' }} /> My Feed
                    </Button>
                  )}

                  <Button 
                    size="sm" 
                    variant={viewMode === 'detailed' ? 'solid' : 'ghost'} 
                    colorPalette={viewMode === 'detailed' ? 'blue' : 'gray'}
                    onClick={() => setViewMode('detailed')}
                    px={4}
                    height="28px"
                    color={viewMode === 'detailed' ? 'white' : 'whiteAlpha.800'}
                  >
                    <ListIcon size={14} style={{ marginRight: '6px' }} /> Detailed
                  </Button>
                  <Button 
                    size="sm" 
                    variant={viewMode === 'research' ? 'solid' : 'ghost'} 
                    colorPalette={viewMode === 'research' ? 'blue' : 'gray'}
                    onClick={() => setViewMode('research')}
                    px={4}
                    height="28px"
                    color={viewMode === 'research' ? 'white' : 'whiteAlpha.800'}
                  >
                    <Search size={14} style={{ marginRight: '6px' }} /> Research
                  </Button>
                  <Button 
                    size="sm" 
                    variant={viewMode === 'analyser' ? 'solid' : 'ghost'} 
                    colorPalette={viewMode === 'analyser' ? 'blue' : 'gray'}
                    onClick={() => setViewMode('analyser')}
                    px={4}
                    height="28px"
                    color={viewMode === 'analyser' ? 'white' : 'whiteAlpha.800'}
                  >
                    <BarChart3 size={14} style={{ marginRight: '6px' }} /> Analyser
                  </Button>
                  <Button 
                    size="sm" 
                    variant={viewMode === 'offers' ? 'solid' : 'ghost'} 
                    colorPalette={viewMode === 'offers' ? 'blue' : 'gray'}
                    onClick={() => setViewMode('offers')}
                    px={4}
                    height="28px"
                    color={viewMode === 'offers' ? 'white' : 'whiteAlpha.800'}
                  >
                    <FileText size={14} style={{ marginRight: '6px' }} /> Offers
                  </Button>
                  <Button 
                    size="sm" 
                    variant={viewMode === 'charts' ? 'solid' : 'ghost'}
                    colorPalette={viewMode === 'charts' ? 'blue' : 'gray'}
                    onClick={() => setViewMode('charts')}
                    px={4}
                    height="28px"
                    color={viewMode === 'charts' ? 'white' : 'whiteAlpha.800'}
                  >
                    <BarChart3 size={14} style={{ marginRight: '6px' }} /> Charts
                  </Button>
                  <Button 
                    size="sm" 
                    variant={viewMode === 'search' ? 'solid' : 'ghost'} 
                    colorPalette={viewMode === 'search' ? 'blue' : 'gray'}
                    onClick={() => setViewMode('search')}
                    px={4}
                    height="28px"
                    color={viewMode === 'search' ? 'white' : 'whiteAlpha.800'}
                  >
                    <Search size={14} style={{ marginRight: '6px' }} /> Search
                  </Button>
                </Box>

                {/* Active Lens Dropdown - After Charts Tab */}
                {activeLens && (
                  <HStack gap={2} pl={4} borderLeftWidth="1px" borderColor="whiteAlpha.300">
                    <Menu.Root>
                      <Menu.Trigger asChild>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          color="white"
                          _hover={{ bg: 'whiteAlpha.200' }}
                        >
                          👓 {activeLens.name} <ChevronDown size={14} />
                        </Button>
                      </Menu.Trigger>
                      <Portal>
                        <Menu.Positioner>
                          <Menu.Content minW="220px">
                            <Menu.ItemGroup title="Switch Lens">
                              {lenses.map((lens) => (
                                <Menu.Item 
                                  key={lens.id} 
                                  value={lens.id}
                                  onClick={() => handleLensSelect(lens.id)}
                                >
                                  <HStack justify="space-between" w="full">
                                    <HStack gap={1}>
                                      {lens.id === defaultLensId && <Text>⭐</Text>}
                                      <Text>{lens.name}</Text>
                                      {lens.id === defaultLensId && <Text fontSize="xs" color="fg.muted">(Default)</Text>}
                                    </HStack>
                                    {lens.id === activeLensId && <Text color="blue.500">✓</Text>}
                                  </HStack>
                                </Menu.Item>
                              ))}
                            </Menu.ItemGroup>
                            <Menu.Separator />
                            <Menu.Item value="create" onClick={handleCreateNewLens}>
                              <Plus size={14} /> Create New Lens
                            </Menu.Item>
                            <Menu.Item value="edit" onClick={() => {
                              setIsCreatingNewLens(true);
                            setCurrentStep('lens');
                                                  }}>
                                                    <Edit size={14} /> Edit Current Lens
                                                  </Menu.Item>
                          </Menu.Content>
                        </Menu.Positioner>
                      </Portal>
                    </Menu.Root>
                  </HStack>
                )}
              </HStack>
            )}
          </HStack>

          {/* Right: Inline KPIs with Mini Sparklines */}
          <HStack gap={6} divider={<Separator orientation="vertical" height="20px" borderColor="whiteAlpha.300" />}>
            <HStack gap={2}>
              <Box textAlign="right">
                <Text fontSize="2xl" fontWeight="bold" lineHeight="1" color="white">
                  ${stats.avgPrice ? (stats.avgPrice / 1000).toFixed(0) : 0}k
                </Text>
                <Text fontSize="xs" color="whiteAlpha.700">Avg Price</Text>
              </Box>
              <svg width="40" height="20" style={{ marginTop: '4px' }}>
                <polyline
                  points="0,15 10,12 20,8 30,10 40,6"
                  fill="none"
                  stroke="rgba(255,255,255,0.5)"
                  strokeWidth="1.5"
                />
              </svg>
            </HStack>
            <HStack gap={2}>
              <Box textAlign="right">
                <Text fontSize="2xl" fontWeight="bold" lineHeight="1" color="white">
                  {stats.avgDOM || 0}
                </Text>
                <Text fontSize="xs" color="whiteAlpha.700">Avg Days on Market</Text>
              </Box>
              <svg width="40" height="20" style={{ marginTop: '4px' }}>
                <polyline
                  points="0,10 10,8 20,12 30,9 40,11"
                  fill="none"
                  stroke="rgba(255,255,255,0.5)"
                  strokeWidth="1.5"
                />
              </svg>
            </HStack>
            <HStack gap={2}>
              <Box textAlign="right">
                <Text fontSize="2xl" fontWeight="bold" lineHeight="1" color="white">
                  {stats.activeListings || 0}
                </Text>
                <Text fontSize="xs" color="whiteAlpha.700">Active Listings</Text>
              </Box>
              <svg width="40" height="20" style={{ marginTop: '4px' }}>
                <polyline
                  points="0,14 10,11 20,13 30,7 40,9"
                  fill="none"
                  stroke="rgba(255,255,255,0.5)"
                  strokeWidth="1.5"
                />
              </svg>
            </HStack>
            
            {/* Refresh Data Button - Always Enabled for Manual Refresh */}
            <VStack gap={0} align="end">
              <HStack gap={2}>
                <Button
                  size="sm"
                  variant="ghost"
                  color="white"
                  _hover={{ bg: 'whiteAlpha.200' }}
                  onClick={refreshData}
                  disabled={isDownloading}
                >
                  <RotateCcw size={14} /> Refresh
                </Button>
                
                {/* Schedule Status Indicator */}
                {scheduledRefresh.nextRefreshTime && (
                  <Tooltip.Root>
                    <Tooltip.Trigger asChild>
                      <IconButton
                        size="sm"
                        variant="ghost"
                        color="white"
                        _hover={{ bg: 'whiteAlpha.200' }}
                        aria-label="Refresh schedule"
                      >
                        <Clock size={14} />
                      </IconButton>
                    </Tooltip.Trigger>
                    <Portal>
                      <Tooltip.Positioner>
                        <Tooltip.Content>
                          <VStack align="start" gap={1} p={2}>
                            <Text fontSize="xs" fontWeight="bold">Auto-Refresh Schedule</Text>
                            <Text fontSize="xs">Supabase: 10 AM & 2 PM UK</Text>
                            <Text fontSize="xs">API: Every 15 min (6 AM-9 PM ET)</Text>
                            <Separator my={1} />
                            <HStack justify="space-between" w="full">
                              <Text fontSize="xs">Status:</Text>
                              <Badge 
                                colorPalette={scheduledRefresh.scheduleStatus.includes('Active') ? 'green' : 'gray'}
                                size="xs"
                              >
                                {scheduledRefresh.scheduleStatus.includes('Active') ? 'Active' : 'Inactive'}
                              </Badge>
                            </HStack>
                            <HStack justify="space-between" w="full">
                              <Text fontSize="xs">Next:</Text>
                              <Text fontSize="xs" fontWeight="600">
                                {new Date(scheduledRefresh.nextRefreshTime).toLocaleTimeString('en-US', { 
                                  hour: 'numeric', 
                                  minute: '2-digit',
                                  hour12: true 
                                })}
                              </Text>
                            </HStack>
                          </VStack>
                        </Tooltip.Content>
                      </Tooltip.Positioner>
                    </Portal>
                  </Tooltip.Root>
                )}
              </HStack>
              {lastUpdated && (
                <Text fontSize="xs" color="whiteAlpha.600">
                  Updated {formatTimeAgo(lastUpdated)}
                </Text>
              )}
            </VStack>
            
            {/* Settings Button - Admin Only (TimB) */}
            {currentUser?.username === 'TimB' && (
              <IconButton 
                variant="ghost" 
                size="sm" 
                color="white"
                _hover={{ bg: 'whiteAlpha.200' }}
                aria-label="Settings"
                onClick={() => {
                  setPreviousView(viewMode);
                  setViewMode('settings');
                }}
              >
                <Settings size={18} />
              </IconButton>
            )}
            
            {/* Logout Button */}
            <IconButton 
              variant="ghost" 
              size="sm" 
              color="white"
              _hover={{ bg: 'whiteAlpha.200' }}
              aria-label="Logout"
              onClick={handleLogout}
            >
              <LogOut size={18} />
            </IconButton>
          </HStack>

        </HStack>
      </Box>

      {/* MAIN CONTENT AREA */}
      <Box flex="1" position="relative">
        
        {/* Non-blocking Error Notification (if error but we have data) */}
        {error && properties.length > 0 && (
          <Box 
            position="absolute" 
            top={4} 
            left="50%" 
            transform="translateX(-50%)" 
            zIndex={25}
            bg="orange.500"
            color="white"
            px={4}
            py={2}
            borderRadius="md"
            boxShadow="lg"
            maxW="600px"
            textAlign="center"
          >
            <Text fontSize="sm" fontWeight="medium">
              ⚠️ Data fetch failed. Showing {properties.length} sample properties.
            </Text>
            <Text fontSize="xs" mt={1}>
              {error}
            </Text>
          </Box>
        )}
        
        {/* Data Loading Progress Banner */}
        <DataLoadingProgress 
          progress={loadingProgress} 
          isVisible={isDownloading || (loading && loadingProgress.percent >= 10)} 
        />
        
        {/* Supabase Cloud Sync Indicator - top right corner */}
        {supabaseStatus && (
          <Box
            position="fixed"
            top="12px"
            right="12px"
            zIndex={10000}
            bg="blue.500"
            color="white"
            px={3}
            py={2}
            borderRadius="md"
            boxShadow="lg"
            display="flex"
            alignItems="center"
            gap={2}
            fontSize="sm"
            fontWeight="600"
            animation="slideIn 0.3s ease"
          >
            <Box
              as="span"
              display="inline-block"
              width="12px"
              height="12px"
              borderRadius="full"
              border="2px solid white"
              borderTopColor="transparent"
              animation="spin 0.8s linear infinite"
            />
            {supabaseStatus === 'loading' ? 'Loading from cloud...' : 'Syncing to cloud...'}
          </Box>
        )}
        
        {/* Applying Filters Banner */}
        {isApplyingFilters && (
          <Box 
            position="absolute" 
            top={4} 
            left="50%" 
            transform="translateX(-50%)" 
            zIndex={20}
            bg="blue.500"
            color="white"
            px={4}
            py={2}
            borderRadius="md"
            boxShadow="lg"
            display="flex"
            alignItems="center"
            gap={2}
          >
            <Spinner size="sm" color="white" />
            <Text fontSize="sm" fontWeight="medium">
              Applying new filters… Loading updated results in the background.
            </Text>
          </Box>
        )}
        
        {/* Loading Progress Overlay (if still fetching pages) */}
        {loadingProgress.percent < 100 && loadingProgress.percent >= 10 && (
          <Box position="absolute" top={0} left={0} right={0} zIndex={10} bg="blue.500" height="2px">
            <Box 
              bg="white" 
              height="100%" 
              width={`${loadingProgress.percent}%`} 
              transition="width 0.2s" 
              opacity={0.5}
            />
          </Box>
        )}

        {/* View Content */}
        {viewMode === 'settings' ? (
          <SettingsPage 
            allProperties={allProperties} 
            onBack={() => setViewMode(previousView)}
            currentUser={currentUser}
            scheduleInfo={{
              nextRefreshTime: scheduledRefresh.nextRefreshTime,
              scheduleStatus: scheduledRefresh.scheduleStatus
            }}
          />
        ) : viewMode === 'feed' ? (
          <MyFeedView 
            properties={properties}
            allProperties={allProperties}
            currentUser={currentUser}
          />
        ) : viewMode === 'research' ? (
          <ResearchView 
            properties={properties}
            allProperties={allProperties}
            currentUser={currentUser}
          />
        ) : viewMode === 'analyser' ? (
          <AnalyserView 
            properties={properties}
            allProperties={allProperties}
            currentUser={currentUser}
          />
        ) : viewMode === 'offers' ? (
          <OfferTrackerView allProperties={allProperties} currentUser={currentUser} />
        ) : viewMode === 'charts' ? (
          <Box p={6} height="100%" overflowY="auto">
            <ChartsView 
              properties={properties} 
              stats={stats} 
              activeLensFilters={activeLens?.filters}
              isDefaultLens={activeLensId === 'all-listings'}
              onNavigateToFilteredList={handleChartDrillDown}
            />
          </Box>
        ) : viewMode === 'search' ? (
          <SearchView allProperties={allProperties} currentUser={currentUser} />
        ) : (
          <DealAnalyser 
            properties={properties} 
            viewMode={viewMode}
            currentUser={currentUser}
            realtorFilter={realtorFilter}
            setViewMode={setViewMode}
            setRealtorFilter={setRealtorFilter}
          />
        )}

      </Box>

      {/* Ward Assignment Tool (Hidden/Utility) */}
      {/* Keeping this mounted but hidden if needed, or remove if not critical for main view */}
      {/* <Box display="none"><WardAssignmentPanel properties={allProperties} /></Box> */}

      {/* Global Footer - End of Page Marker */}
      <Box 
        py={4} 
        px={6} 
        borderTopWidth="1px" 
        borderColor="border.muted" 
        bg="bg.subtle"
        textAlign="center"
      >
        <Text fontSize="sm" color="fg.muted">
          You've reached the end of the page
        </Text>
      </Box>
    </Box>
  );
}
