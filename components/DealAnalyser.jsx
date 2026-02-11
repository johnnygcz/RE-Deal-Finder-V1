import React, { useState, useMemo, useEffect } from 'react';
import {
  Box, Stack, HStack, VStack, Text, Badge, Button, Card, SimpleGrid,
  Select, Portal, createListCollection, Slider, Collapsible,
  Dialog, CloseButton, Menu, Switch, Tabs, IconButton
} from '@chakra-ui/react';
import { useDealScoring } from '../hooks/useDealScoring';
import { useRealtorRankings } from '../hooks/useRealtorRankings';
import { ArrowUpDown, ChevronUp, ChevronDown, Filter, TrendingUp, Check, ArrowUp, ArrowDown as ArrowDownIcon, Map as MapIcon, List, Heart, X } from 'lucide-react';
import { ReDealFinderBoard } from '@api/BoardSDK.js';
import PropertyDetailView from './PropertyDetailView';
import MapWidget from './MapWidget';
import PropertyCard from './PropertyCard';
import DetailedView from './DetailedView';

export default function DealAnalyser({ properties, viewMode = 'list', currentUser, filters = {}, realtorFilter = null, setViewMode, setRealtorFilter }) {
  // Debug logging for currentUser prop
  React.useEffect(() => {
    console.log('=== DEAL ANALYSER - CURRENT USER PROP DEBUG ===');
    console.log('currentUser received:', currentUser);
    console.log('currentUser.monGhlColumn:', currentUser?.monGhlColumn);
    console.log('================================================');
  }, [currentUser]);

  const { scoredProperties } = useDealScoring(properties);
  const realtorRankings = useRealtorRankings(properties);
  const [sortConfig, setSortConfig] = useState({ key: 'scores.global', direction: 'desc', label: 'Deal Score' });
  const [scoreFilters, setScoreFilters] = useState({ min: 0, max: 100 });
  const [showRemoved, setShowRemoved] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  
  // Handler to navigate to realtor filtered list
  const handleNavigateToRealtorList = React.useCallback((realtorName) => {
    // 1. Close modal immediately
    setSelectedProperty(null);
    setIsModalOpen(false);
    
    // 2. Update view mode to list
    if (setViewMode) {
      setViewMode('list');
    }
    
    // 3. Set realtor filter
    if (setRealtorFilter) {
      setRealtorFilter(realtorName);
    }
    
    // 4. Update URL hash for state persistence
    window.location.hash = `#view=list&realtor=${encodeURIComponent(realtorName)}`;
  }, [setViewMode, setRealtorFilter]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Use Set for O(1) membership checks with stable identity
  const [favorites, setFavorites] = useState(() => new Set());
  const [sentToGHL, setSentToGHL] = useState(() => new Set());
  
  // Local state for GHL status updates (overrides prop values)
  const [ghlStatusUpdates, setGhlStatusUpdates] = useState({});
  
  // Pagination state for List and Detailed views
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  
  // Infinite scroll state for Map view
  const [visibleCardLimit, setVisibleCardLimit] = useState(20);
  const sentinelRef = React.useRef(null);
  const [showBatchToast, setShowBatchToast] = useState(false);
  const [batchToastMessage, setBatchToastMessage] = useState('');
  const prevVisibleCardLimitRef = React.useRef(20);

  const board = new ReDealFinderBoard();

  // Load showRemoved state from session storage
  React.useEffect(() => {
    const saved = sessionStorage.getItem('showRemovedListings');
    if (saved !== null) {
      setShowRemoved(JSON.parse(saved));
    }
  }, []);

  // Save showRemoved state to session storage
  const handleToggleRemoved = (checked) => {
    setShowRemoved(checked);
    sessionStorage.setItem('showRemovedListings', JSON.stringify(checked));
  };

  // CRITICAL FIX: Check if we're in "In GHL" lens (ghlStatus filter is 'sent')
  // This determines whether "Show Removed Listings" should filter for GHL+Removed only
  const isInGHLLens = filters.ghlStatus === 'sent';

  // Calculate distance between two coordinates
  const getDistance = (lat1, lon1, lat2, lon2) => {
    const lat1Num = typeof lat1 === 'string' ? parseFloat(lat1) : lat1;
    const lon1Num = typeof lon1 === 'string' ? parseFloat(lon1) : lon1;
    const lat2Num = typeof lat2 === 'string' ? parseFloat(lat2) : lat2;
    const lon2Num = typeof lon2 === 'string' ? parseFloat(lon2) : lon2;

    if (!lat1Num || !lon1Num || !lat2Num || !lon2Num || isNaN(lat1Num) || isNaN(lon1Num) || isNaN(lat2Num) || isNaN(lon2Num)) {
      return Infinity;
    }

    const R = 6371; // Radius of the earth in km
    const dLat = (lat2Num - lat1Num) * (Math.PI / 180);
    const dLon = (lon2Num - lon1Num) * (Math.PI / 180);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1Num * (Math.PI / 180)) * Math.cos(lat2Num * (Math.PI / 180)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const d = R * c; // Distance in km
    const miles = d * 0.621371;
    return isFinite(miles) && !isNaN(miles) ? miles : Infinity;
  };

  // Find comparable properties for a given property
  const findComparables = (property) => {
    if (!property.address?.lat || !property.address?.lng) {
      return { avgPrice: 0, count: 0 };
    }

    const radius = 1; // 1 km = 0.621371 miles
    const normalizeBedBath = (value) => Array.isArray(value) ? value[0] : value;
    const propertyBeds = normalizeBedBath(property.bedrooms);
    const propertyBaths = normalizeBedBath(property.bathrooms);

    const comparables = scoredProperties.filter(comp => {
      if (comp.id === property.id) return false;
      if (!comp.address?.lat || !comp.address?.lng) return false;
      
      // Check distance
      const distance = getDistance(
        property.address.lat,
        property.address.lng,
        comp.address.lat,
        comp.address.lng
      );
      if (distance > radius) return false;

      // Check same ward
      if (comp.wards !== property.wards) return false;

      // Check same property type (Single Family with Single Family, Apartment with Apartment, etc.)
      if (comp.propertyType !== property.propertyType) return false;

      // Check same beds and baths
      const compBeds = normalizeBedBath(comp.bedrooms);
      const compBaths = normalizeBedBath(comp.bathrooms);
      if (compBeds !== propertyBeds || compBaths !== propertyBaths) return false;

      return true;
    });

    if (comparables.length === 0) {
      return { avgPrice: 0, count: 0 };
    }

    const avgPrice = comparables.reduce((sum, comp) => sum + (comp.price || 0), 0) / comparables.length;
    return { avgPrice: Math.round(avgPrice), count: comparables.length };
  };

  // Memoized toggle function with stable reference
  const toggleFavorite = React.useCallback((propertyId) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(propertyId)) {
        newFavorites.delete(propertyId);
      } else {
        newFavorites.add(propertyId);
      }
      return newFavorites;
    });
  }, []);

  // Memoized GHL handler with stable reference - supports batch sending
  const handleSendToGHL = React.useCallback(async (propertyId) => {
    try {
      // Determine which column to update based on current user
      let columnToUpdate = null;
      if (currentUser?.monGhlColumn === 'JS Send to GHL') {
        columnToUpdate = 'jsSendToGhl';
      } else if (currentUser?.monGhlColumn === 'AZ Send to GHL') {
        columnToUpdate = 'azSendToGhl';
      }

      if (!columnToUpdate) {
        console.error('No GHL column configured for current user');
        return;
      }

      // Check if this property is loved - if so, send ALL loved properties
      const isLoved = favorites.has(propertyId);
      
      if (isLoved) {
        // BATCH MODE: Send all loved properties
        const lovedProperties = scoredProperties.filter(p => favorites.has(p.id));
        const totalCount = lovedProperties.length;
        
        console.log(`💙 BATCH SEND: Sending ${totalCount} loved properties to GHL...`);
        
        // Show toast notification for batch operation
        if (window.mondaySdk) {
          window.mondaySdk.execute('notice', {
            message: `Sending ${totalCount} loved properties to GHL...`,
            type: 'info',
            timeout: 3000
          });
        }
        
        let successCount = 0;
        let failCount = 0;
        
        // Send each loved property sequentially
        for (let i = 0; i < lovedProperties.length; i++) {
          const prop = lovedProperties[i];
          try {
            console.log(`📤 [${i + 1}/${totalCount}] Sending ${prop.name} (${prop.id}) to GHL...`);
            
            // CRITICAL: Write 'SEND' (not 'SENT') to trigger Monday.com automation
            await board.item(prop.id).update({ [columnToUpdate]: 'SEND' }).execute();
            
            // Update local state for optimistic UI feedback
            setSentToGHL(prev => new Set([...prev, prop.id]));
            
            successCount++;
            console.log(`✅ [${i + 1}/${totalCount}] ${prop.name} sent to GHL`);
            
            // Schedule auto-refresh for this property after 8 seconds
            setTimeout(async () => {
              try {
                const freshProperty = await board.item(prop.id)
                  .withColumns(['jsSendToGhl', 'azSendToGhl'])
                  .execute();
                
                if (freshProperty) {
                  const updatedStatus = freshProperty[columnToUpdate];
                  setGhlStatusUpdates(prev => ({
                    ...prev,
                    [prop.id]: { [columnToUpdate]: updatedStatus }
                  }));
                }
              } catch (refreshError) {
                console.error(`Failed to auto-refresh ${prop.id}:`, refreshError);
              }
            }, 8000);
            
            // Small delay between sends to avoid rate limiting
            if (i < lovedProperties.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 500));
            }
            
          } catch (error) {
            console.error(`❌ [${i + 1}/${totalCount}] Failed to send ${prop.name}:`, error);
            failCount++;
            
            // Remove from local state on error
            setSentToGHL(prev => {
              const newSet = new Set(prev);
              newSet.delete(prop.id);
              return newSet;
            });
          }
        }
        
        // Show completion notification
        if (window.mondaySdk) {
          window.mondaySdk.execute('notice', {
            message: `Batch send complete: ${successCount} sent, ${failCount} failed`,
            type: failCount > 0 ? 'warning' : 'success',
            timeout: 5000
          });
        }
        
        console.log(`✅ BATCH SEND COMPLETE: ${successCount}/${totalCount} sent successfully`);
        
        // Schedule batch auto-refresh with scaled delay (8 seconds × items sent)
        const batchRefreshDelay = 8000 * lovedProperties.length;
        console.log(`⏳ Scheduling batch auto-refresh for ${lovedProperties.length} properties in ${batchRefreshDelay / 1000} seconds...`);
        
        setTimeout(async () => {
          try {
            console.log(`🔄 PRIMARY batch auto-refresh for ${lovedProperties.length} properties...`);
            
            // Refresh all sent properties
            for (const prop of lovedProperties) {
              try {
                const freshProperty = await board.item(prop.id)
                  .withColumns(['jsSendToGhl', 'azSendToGhl'])
                  .execute();
                
                if (freshProperty) {
                  const updatedStatus = freshProperty[columnToUpdate];
                  console.log(`✅ Primary refresh: ${prop.id} - ${columnToUpdate}: ${updatedStatus}`);
                  
                  // Store the updated GHL status locally to override the prop value
                  setGhlStatusUpdates(prev => ({
                    ...prev,
                    [prop.id]: {
                      [columnToUpdate]: updatedStatus
                    }
                  }));
                }
              } catch (refreshError) {
                console.error(`Failed to refresh property ${prop.id}:`, refreshError);
              }
            }
            
            console.log(`✅ Primary batch auto-refresh complete for ${lovedProperties.length} properties`);
            
            // Schedule SECONDARY auto-refresh 60 seconds later as safety net for slower automations
            const secondaryDelay = 60000; // 60 seconds
            console.log(`⏳ Scheduling SECONDARY safety check in ${secondaryDelay / 1000} seconds for any slower automations...`);
            
            setTimeout(async () => {
              try {
                console.log(`🔄 SECONDARY safety check for ${lovedProperties.length} properties...`);
                
                // Re-check all sent properties to catch any that took longer
                for (const prop of lovedProperties) {
                  try {
                    const freshProperty = await board.item(prop.id)
                      .withColumns(['jsSendToGhl', 'azSendToGhl'])
                      .execute();
                    
                    if (freshProperty) {
                      const updatedStatus = freshProperty[columnToUpdate];
                      console.log(`✅ Secondary check: ${prop.id} - ${columnToUpdate}: ${updatedStatus}`);
                      
                      // Update local state with latest status
                      setGhlStatusUpdates(prev => ({
                        ...prev,
                        [prop.id]: {
                          [columnToUpdate]: updatedStatus
                        }
                      }));
                    }
                  } catch (refreshError) {
                    console.error(`Secondary check failed for property ${prop.id}:`, refreshError);
                  }
                }
                
                console.log(`✅ Secondary safety check complete - all ${lovedProperties.length} properties verified`);
              } catch (secondaryError) {
                console.error('Secondary safety check error:', secondaryError);
              }
            }, secondaryDelay);
            
          } catch (refreshError) {
            console.error('Failed to batch auto-refresh properties:', refreshError);
          }
        }, batchRefreshDelay);
        
      } else {
        // SINGLE MODE: Send only this property
        console.log(`Sending property ${propertyId} to GHL - updating ${columnToUpdate} to SEND`);

        // CRITICAL: Write 'SEND' (not 'SENT') to trigger Monday.com automation
        // Automation flow: SEND → in progress → SENT
        await board.item(propertyId).update({ [columnToUpdate]: 'SEND' }).execute();

        // Update local state immediately for optimistic UI feedback
        setSentToGHL(prev => new Set([...prev, propertyId]));

        console.log(`✓ Property sent to GHL - ${columnToUpdate} set to SEND`);

        // Auto-refresh this property's status after 8 seconds to show final status from Monday.com
        console.log(`⏳ Scheduling auto-refresh for property ${propertyId} in 8 seconds...`);
        setTimeout(async () => {
          try {
            console.log(`🔄 Auto-refreshing property ${propertyId} to get final GHL status...`);
            
            // Fetch just this one property's current data from Monday.com
            const freshProperty = await board.item(propertyId)
              .withColumns(['jsSendToGhl', 'azSendToGhl'])
              .execute();
            
            if (freshProperty) {
              const updatedStatus = freshProperty[columnToUpdate];
              console.log(`✅ Refreshed ${propertyId} - ${columnToUpdate}: ${updatedStatus}`);
              
              // Store the updated GHL status locally to override the prop value
              setGhlStatusUpdates(prev => ({
                ...prev,
                [propertyId]: {
                  [columnToUpdate]: updatedStatus
                }
              }));
            }
          } catch (refreshError) {
            console.error('Failed to auto-refresh property status:', refreshError);
            // Silently fail - user can still manually refresh if needed
          }
        }, 8000);
      }

    } catch (error) {
      console.error('Failed to send to GHL:', error);
      // Remove from local state on error
      setSentToGHL(prev => {
        const newSet = new Set(prev);
        newSet.delete(propertyId);
        return newSet;
      });
    }
  }, [board, currentUser, favorites, scoredProperties]);

  // Apply GHL status updates to properties (merge local overrides with prop data)
  const propertiesWithUpdates = useMemo(() => {
    if (Object.keys(ghlStatusUpdates).length === 0) {
      return scoredProperties;
    }
    
    return scoredProperties.map(prop => {
      const updates = ghlStatusUpdates[prop.id];
      if (updates) {
        return { ...prop, ...updates };
      }
      return prop;
    });
  }, [scoredProperties, ghlStatusUpdates]);

  // Memoized filtering with performance logging
  const filteredProperties = useMemo(() => {
    const startTime = performance.now();
    
    const result = propertiesWithUpdates.filter(prop => {
      // CRITICAL: Realtor Filter - Check realtor name match
      if (realtorFilter) {
        const realtorName = prop.realtors?.linkedItems?.[0]?.name;
        // Case-insensitive comparison for robustness
        if (!realtorName || realtorName.toLowerCase() !== realtorFilter.toLowerCase()) {
          return false;
        }
      }

      // Score filter
      if (prop.scores.global < scoreFilters.min || prop.scores.global > scoreFilters.max) {
        return false;
      }
      
      // CRITICAL FIX for Issue #15: Show Removed Listings filter logic
      // When in "In GHL" lens (ghlStatus='sent'), "Show Removed Listings" should ONLY show
      // properties that have BOTH:
      // 1. SENT status in the user's GHL column
      // 2. Removed listing status
      
      // Status filter - Active and RELISTED always pass through
      if (prop.listingStatus === 'Active' || prop.listingStatus === 'RELISTED') {
        return true;
      }
      
      // Removed listings handling
      if (prop.listingStatus === 'Removed') {
        if (!showRemoved) {
          // Toggle OFF - hide all removed listings
          return false;
        }
        
        if (isInGHLLens) {
          // Toggle ON + In GHL lens - ONLY show if property has SENT status
          const ghlColumnField = currentUser?.monGhlColumn === 'JS Send to GHL' 
            ? 'jsSendToGhl' 
            : currentUser?.monGhlColumn === 'AZ Send to GHL'
            ? 'azSendToGhl'
            : null;
          
          if (!ghlColumnField) return false;
          
          const ghlValue = prop[ghlColumnField];
          const isSent = ghlValue && ghlValue.toUpperCase() === 'SENT';
          
          // Must have SENT status to be shown in "In GHL" lens with removed filter
          return isSent;
        }
        
        // Toggle ON but NOT in GHL lens - show all removed listings
        return true;
      }
      
      return false;
    });
    console.timeEnd('Filter Properties');
    console.log(`Filtered ${propertiesWithUpdates.length} → ${result.length} properties (In GHL Lens: ${isInGHLLens}, Show Removed: ${showRemoved})`);
    return result;
  }, [propertiesWithUpdates, scoreFilters, showRemoved, isInGHLLens, currentUser, realtorFilter]);

  // Reset to page 1 when filters or sort changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filteredProperties.length, sortConfig.key, sortConfig.direction]);

  // Memoized sort logic with performance logging
  const sortedProperties = useMemo(() => {
    if (!sortConfig.key) return filteredProperties;

    console.time('Sort Properties');
    const result = [...filteredProperties].sort((a, b) => {
      // Special handling for favorite sorting
      if (sortConfig.key === 'isFavorited') {
        const aFav = favorites.has(a.id) ? 1 : 0;
        const bFav = favorites.has(b.id) ? 1 : 0;
        return sortConfig.direction === 'desc' ? bFav - aFav : aFav - bFav;
      }

      // Special handling for recent price drop sorting
      if (sortConfig.key === 'lastPriceDropDate') {
        const getLastDropDate = (prop) => {
          if (!prop.priceHistory || prop.priceHistory.length <= 1) return null;
          const lastEntry = prop.priceHistory[prop.priceHistory.length - 1];
          return lastEntry?.date ? new Date(lastEntry.date) : null;
        };
        
        const aDate = getLastDropDate(a);
        const bDate = getLastDropDate(b);
        
        if (!aDate && !bDate) return 0;
        if (!aDate) return 1; // Properties without drops go to end
        if (!bDate) return -1;
        
        // Most recent first (descending)
        return sortConfig.direction === 'desc' ? bDate - aDate : aDate - bDate;
      }

      // Special handling for relisted recently sorting
      if (sortConfig.key === 'relistedRecently') {
        const getRelistDate = (prop) => {
          // Only consider properties with RELISTED status
          if (prop.listingStatus !== 'RELISTED') return null;
          
          // Use the relistedDate field if available, otherwise fall back to column1stListingDate
          if (prop.relistedDate) {
            return new Date(prop.relistedDate);
          } else if (prop.column1stListingDate) {
            return new Date(prop.column1stListingDate);
          }
          
          return null;
        };
        
        const aDate = getRelistDate(a);
        const bDate = getRelistDate(b);
        
        // Properties without relist dates go to the end
        if (!aDate && !bDate) return 0;
        if (!aDate) return 1;
        if (!bDate) return -1;
        
        // Most recent first (descending by default)
        return sortConfig.direction === 'desc' ? bDate - aDate : aDate - bDate;
      }

      let aVal = sortConfig.key.includes('.')
        ? sortConfig.key.split('.').reduce((obj, key) => obj?.[key], a)
        : a[sortConfig.key];
      let bVal = sortConfig.key.includes('.')
        ? sortConfig.key.split('.').reduce((obj, key) => obj?.[key], b)
        : b[sortConfig.key];

      // Special handling for drop percentage
      if (sortConfig.key === 'dropAsAPercentageOfTheInitialPrice') {
        const aIsNull = aVal == null || isNaN(aVal) || !isFinite(aVal);
        const bIsNull = bVal == null || isNaN(aVal) || !isFinite(aVal);
        
        if (aIsNull && bIsNull) return 0;
        if (aIsNull) return 1;
        if (bIsNull) return -1;
        
        const aIsDrop = aVal < 0;
        const bIsDrop = bVal < 0;
        
        if (aIsDrop && !bIsDrop) return -1;
        if (!aIsDrop && bIsDrop) return 1;
        if (aIsDrop && bIsDrop) return aVal - bVal;
        return aVal - bVal;
      }

      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      if (sortConfig.direction === 'asc') {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      } else {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
      }
    });
    console.timeEnd('Sort Properties');
    console.log(`Sort by ${sortConfig.key} (${sortConfig.direction}): ${result.length} properties`);
    return result;
  }, [filteredProperties, sortConfig, favorites]);

  // Paginated properties for List and Detailed views
  const pagedProperties = useMemo(() => {
    // Map view doesn't use pagination
    if (viewMode === 'map') return sortedProperties;

    const totalItems = sortedProperties.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    
    // Clamp currentPage to valid range
    const validPage = Math.max(1, Math.min(currentPage, totalPages || 1));
    if (validPage !== currentPage) {
      setCurrentPage(validPage);
    }

    const startIndex = (validPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    
    return sortedProperties.slice(startIndex, endIndex);
  }, [sortedProperties, currentPage, pageSize, viewMode]);

  const handleSort = (key, label) => {
    if (sortConfig.key === key) {
      setSortConfig({ ...sortConfig, direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' });
    } else {
      const defaultDirection = key === 'totalDropAmount' ? 'asc' : 'desc';
      setSortConfig({ key, direction: defaultDirection, label });
    }
  };

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  const totalPages = Math.ceil(sortedProperties.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, sortedProperties.length);

  // Memoized click handler with stable reference
  const handleRowClick = React.useCallback((property) => {
    setSelectedProperty(property);
    setIsModalOpen(true);
  }, []);

  const getScoreColor = (score) => {
    if (score >= 80) return 'green';
    if (score >= 60) return 'teal';
    if (score >= 40) return 'orange';
    return 'red';
  };

  const sortOptions = [
    { key: 'scores.global', label: 'Deal Score' },
    { key: 'lastPriceDropDate', label: 'Recent Price Drop' },
    { key: 'relistedRecently', label: 'Relisted Recently' },
    { key: 'daysOnMarket', label: 'Days on Market' },
    { key: 'dropAsAPercentageOfTheInitialPrice', label: 'Total Drop %' },
    { key: 'totalDropAmount', label: 'Total Drop $' },
    { key: 'price', label: 'Price' },
  ];

  // Helper to safely format numbers
  const safeNum = (val, decimals = 0) => {
    if (val == null || isNaN(val) || !isFinite(val)) return 0;
    return Number(val).toFixed(decimals);
  };

  // Reset visible card limit when sort changes
  React.useEffect(() => {
    if (viewMode === 'map') {
      setVisibleCardLimit(20);
    }
  }, [sortConfig.key, sortConfig.direction, viewMode]);

  // All properties for Map view sorted by current preset (NO 20-item cap)
  const topPropertiesForMap = useMemo(() => {
    if (viewMode !== 'map') return [];
    
    // Sort ALL filtered properties by the current sort preset
    const sorted = [...filteredProperties].sort((a, b) => {
      if (sortConfig.key === 'isFavorited') {
        const aFav = favorites.has(a.id) ? 1 : 0;
        const bFav = favorites.has(b.id) ? 1 : 0;
        return sortConfig.direction === 'desc' ? bFav - aFav : aFav - bFav;
      }

      if (sortConfig.key === 'lastPriceDropDate') {
        const getLastDropDate = (prop) => {
          if (!prop.priceHistory || prop.priceHistory.length <= 1) return null;
          const lastEntry = prop.priceHistory[prop.priceHistory.length - 1];
          return lastEntry?.date ? new Date(lastEntry.date) : null;
        };
        const aDate = getLastDropDate(a);
        const bDate = getLastDropDate(b);
        if (!aDate && !bDate) return 0;
        if (!aDate) return 1;
        if (!bDate) return -1;
        return sortConfig.direction === 'desc' ? bDate - aDate : aDate - bDate;
      }

      if (sortConfig.key === 'relistedRecently') {
        const getRelistDate = (prop) => {
          if (prop.listingStatus !== 'RELISTED') return null;
          if (prop.relistedDate) return new Date(prop.relistedDate);
          if (prop.column1stListingDate) return new Date(prop.column1stListingDate);
          return null;
        };
        const aDate = getRelistDate(a);
        const bDate = getRelistDate(b);
        if (!aDate && !bDate) return 0;
        if (!aDate) return 1;
        if (!bDate) return -1;
        return sortConfig.direction === 'desc' ? bDate - aDate : aDate - bDate;
      }

      let aVal = sortConfig.key.includes('.')
        ? sortConfig.key.split('.').reduce((obj, key) => obj?.[key], a)
        : a[sortConfig.key];
      let bVal = sortConfig.key.includes('.')
        ? sortConfig.key.split('.').reduce((obj, key) => obj?.[key], b)
        : b[sortConfig.key];

      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      if (sortConfig.direction === 'asc') {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      } else {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
      }
    });
    
    // Return ALL sorted properties - visibleCardLimit controls rendering
    return sorted;
  }, [filteredProperties, sortConfig, favorites, viewMode]);

  // Visible cards for Map view (infinite scroll)
  const visibleMapCards = useMemo(() => {
    if (viewMode !== 'map') return [];
    return topPropertiesForMap.slice(0, visibleCardLimit);
  }, [topPropertiesForMap, visibleCardLimit, viewMode]);

  // Create Set of visible card IDs for MapWidget priority rendering
  const visibleCardIds = useMemo(() => {
    return new Set(visibleMapCards.map(p => p.id));
  }, [visibleMapCards]);

  // IntersectionObserver for infinite scroll in Map view
  React.useEffect(() => {
    if (viewMode !== 'map' || !sentinelRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && visibleCardLimit < topPropertiesForMap.length) {
          // Load 20 more cards
          setVisibleCardLimit(prev => Math.min(prev + 20, topPropertiesForMap.length));
        }
      },
      {
        root: null,
        rootMargin: '100px', // Start loading slightly before reaching bottom
        threshold: 0.1
      }
    );

    observer.observe(sentinelRef.current);

    return () => {
      if (sentinelRef.current) {
        observer.unobserve(sentinelRef.current);
      }
    };
  }, [viewMode, visibleCardLimit, topPropertiesForMap.length]);

  // Show toast notification when new batch loads
  React.useEffect(() => {
    if (viewMode !== 'map') return;
    
    // Only show toast if visibleCardLimit increased (not on initial load or reset)
    if (visibleCardLimit > prevVisibleCardLimitRef.current && prevVisibleCardLimitRef.current >= 20) {
      const message = `Loaded 20 more properties (${visibleCardLimit} of ${topPropertiesForMap.length})`;
      setBatchToastMessage(message);
      setShowBatchToast(true);
      
      // Hide toast after 2.5 seconds
      const timer = setTimeout(() => {
        setShowBatchToast(false);
      }, 2500);
      
      return () => clearTimeout(timer);
    }
    
    // Update ref for next comparison
    prevVisibleCardLimitRef.current = visibleCardLimit;
  }, [visibleCardLimit, topPropertiesForMap.length, viewMode]);

  return (
    <Stack gap={0} height="100%">
      {/* Sub-header for Sort/Filter controls specific to Deal Analyser */}
      <Box py={2} px={4} borderBottomWidth="1px" borderColor="border.muted" bg="bg.panel">
        <HStack justify="space-between">
          <HStack gap={4}>
            <Text fontSize="sm" color="fg.muted">
              Showing <b>{sortedProperties.length}</b> Properties
            </Text>
            {realtorFilter && (
                <HStack gap={2}>
                  <Badge colorPalette="blue" variant="solid" size="sm">
                    Realtor: {realtorFilter}
                  </Badge>
                  <Button 
                    size="xs" 
                    variant="ghost" 
                    colorPalette="blue"
                    onClick={() => {
                      if (setRealtorFilter) {
                        setRealtorFilter(null);
                      }
                      window.location.hash = '';
                    }}
                  >
                    Clear Filter
                  </Button>
                </HStack>
            )}
            
            {/* Show Removed Listings Toggle - All Views */}
            <HStack gap={2}>
              <Switch.Root
                size="sm"
                checked={showRemoved}
                onCheckedChange={(e) => handleToggleRemoved(e.checked)}
              >
                <Switch.HiddenInput />
                <Switch.Control>
                  <Switch.Thumb />
                </Switch.Control>
              </Switch.Root>
              <Text fontSize="sm" color="fg.muted">
                Show Removed Listings
              </Text>
            </HStack>
          </HStack>
          
          <HStack gap={2}>
             <Menu.Root>
                <Menu.Trigger asChild>
                  <Button variant="ghost" size="sm">
                    Sort: {sortConfig.label} <ChevronDown size={14} />
                  </Button>
                </Menu.Trigger>
                <Portal>
                  <Menu.Positioner>
                    <Menu.Content>
                      {sortOptions.map((option) => (
                        <Menu.Item 
                          key={option.key} 
                          onClick={() => handleSort(option.key, option.label)}
                          value={option.key}
                        >
                          <HStack justify="space-between" width="full">
                            <Text>{option.label}</Text>
                            {sortConfig.key === option.key && <Check size={14} />}
                          </HStack>
                        </Menu.Item>
                      ))}
                    </Menu.Content>
                  </Menu.Positioner>
                </Portal>
              </Menu.Root>
          </HStack>
        </HStack>
      </Box>

      {/* Map View */}
      {viewMode === 'map' && (
        <Stack gap={0} minHeight="calc(100vh - 200px)">
          {/* Map Sort Preset Bar - Sticky at top */}
          <Box 
            py={2} 
            px={4} 
            borderBottomWidth="1px" 
            borderColor="border.muted" 
            bg="bg.subtle"
            position="sticky"
            top={0}
            zIndex={100}
          >
            <HStack justify="space-between" align="center">
              <HStack gap={2}>
                <Text fontSize="xs" fontWeight="semibold" color="fg.muted" textTransform="uppercase">
                  Map Sort:
                </Text>
                <HStack gap={1}>
                  {sortOptions.slice(0, 4).map((option) => (
                    <Button
                      key={option.key}
                      size="xs"
                      variant={sortConfig.key === option.key ? 'solid' : 'outline'}
                      colorPalette={sortConfig.key === option.key ? 'blue' : 'gray'}
                      onClick={() => handleSort(option.key, option.label)}
                    >
                      {option.label}
                    </Button>
                  ))}
                </HStack>
              </HStack>
              <Text fontSize="xs" color="fg.muted">
                {visibleMapCards.length >= topPropertiesForMap.length 
                  ? `Showing all ${topPropertiesForMap.length} properties`
                  : `Showing ${visibleMapCards.length} of ${topPropertiesForMap.length} properties`
                }
              </Text>
            </HStack>
          </Box>

          <HStack gap={0} minHeight="600px" align="stretch">
            {/* Left: Map Container (75%) */}
            <Box flex="0 0 75%" minHeight="600px" position="relative">
              <MapWidget
                properties={sortedProperties}
                onPropertyClick={handleRowClick}
                favorites={favorites}
                toggleFavorite={toggleFavorite}
                visibleCardIds={visibleCardIds}
              />
            </Box>

            {/* Right: Top Properties Sidebar (25%) - Fixed height with independent scroll */}
            <Box 
              flex="0 0 25%" 
              minHeight="600px"
              maxHeight="800px"
              display="flex" 
              flexDirection="column"
              bg="gray.50" 
              borderLeftWidth="1px"
              borderColor="gray.200"
            >
              {/* Sticky Header */}
              <Box 
                p={3} 
                borderBottomWidth="1px" 
                borderColor="gray.200"
                bg="white"
                flexShrink={0}
              >
                <HStack justify="space-between">
                  <Text fontSize="lg" fontWeight="bold" color="gray.900">
                    Top Properties
                  </Text>
                  <Badge colorPalette="blue" variant="solid" size="sm">
                    {sortConfig.label}
                  </Badge>
                </HStack>
              </Box>

              {/* Scrollable Content Area */}
              <Box 
                flex="1" 
                overflowY="auto" 
                overflowX="hidden"
                p={3}
                position="relative"
              >
                {/* Toast Notification for Batch Loading */}
                {showBatchToast && (
                  <Box
                    position="sticky"
                    top={12}
                    zIndex={10}
                    bg="green.500"
                    color="white"
                    borderRadius="md"
                    p={2}
                    mb={2}
                    boxShadow="lg"
                    animation="fadeIn 0.3s ease-in"
                  >
                    <Text fontSize="xs" textAlign="center" fontWeight="semibold">
                      ✓ {batchToastMessage}
                    </Text>
                  </Box>
                )}

                <VStack align="stretch" gap={1.5}>
                  {/* Property Cards - Infinite Scroll */}
                  {visibleMapCards.map((prop) => {
                    return (
                      <PropertyCard
                        key={prop.id}
                        property={prop}
                        onSelect={() => handleRowClick(prop)}
                        isSelected={selectedProperty?.id === prop.id}
                        isFavorited={favorites.has(prop.id)}
                        onToggleFavorite={toggleFavorite}
                        currentUser={currentUser}
                        onSendToGHL={handleSendToGHL}
                      />
                    );
                  })}

                  {/* Sentinel for Infinite Scroll */}
                  {visibleCardLimit < topPropertiesForMap.length && (
                    <Box
                      ref={sentinelRef}
                      p={3}
                      textAlign="center"
                    >
                      <Text fontSize="xs" color="gray.500">
                        Loading more properties...
                      </Text>
                    </Box>
                  )}

                  {/* Load More Hint for Map Markers */}
                  {sortedProperties.length > topPropertiesForMap.length && (
                    <Box
                      p={3}
                      bg="blue.50"
                      borderRadius="md"
                      borderWidth="1px"
                      borderColor="blue.200"
                      mt={2}
                      mb={2}
                    >
                      <Text fontSize="xs" color="blue.700" textAlign="center">
                        Click any marker on the map to view more properties
                      </Text>
                    </Box>
                  )}
                </VStack>

                {/* Bottom Sticky Ribbon */}
                <Box
                  position="sticky"
                  bottom={0}
                  bg="white"
                  borderTopWidth="1px"
                  borderColor="gray.200"
                  p={2}
                  boxShadow="0 -2px 4px rgba(0, 0, 0, 0.05)"
                  zIndex={5}
                >
                  <Text fontSize="xs" color="gray.600" textAlign="center" fontWeight="medium">
                    {visibleCardLimit >= topPropertiesForMap.length 
                      ? `✓ You've reached the bottom – all ${topPropertiesForMap.length} properties are loaded`
                      : `↑ Scroll up to see more loaded properties (${visibleCardLimit} of ${topPropertiesForMap.length})`
                    }
                  </Text>
                </Box>
              </Box>
            </Box>
          </HStack>
        </Stack>
      )}

      {/* Detailed View - Monday.com Grid Style */}
      {viewMode === 'detailed' && (
        <Stack gap={0} height="100%">
          {/* Pagination Controls - Sticky at Top */}
          <Box 
            py={3} 
            px={4} 
            borderBottomWidth="1px" 
            borderColor="border.muted" 
            bg="bg.panel"
            position="sticky"
            top={0}
            zIndex={10}
          >
            <HStack justify="space-between" wrap="wrap" gap={3}>
              <HStack gap={2}>
                <Text fontSize="sm" color="fg.muted">
                  Showing {startIndex}-{endIndex} of {sortedProperties.length} properties
                </Text>
                <Text fontSize="sm" color="fg.muted">•</Text>
                <HStack gap={1}>
                  <Text fontSize="sm" color="fg.muted">Show:</Text>
                  {[25, 50, 100].map(size => (
                    <Button
                      key={size}
                      size="xs"
                      variant={pageSize === size ? 'solid' : 'ghost'}
                      colorPalette={pageSize === size ? 'blue' : 'gray'}
                      onClick={() => handlePageSizeChange(size)}
                    >
                      {size}
                    </Button>
                  ))}
                </HStack>
              </HStack>

              <HStack gap={2}>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage(p => p - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Text fontSize="sm" color="fg.muted">
                  Page {currentPage} of {totalPages}
                </Text>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage(p => p + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </HStack>
            </HStack>
          </Box>

          <Box flex="1" overflowY="auto">
            <DetailedView
              properties={pagedProperties}
              onPropertyClick={handleRowClick}
              favorites={favorites}
              toggleFavorite={toggleFavorite}
              sentToGHL={sentToGHL}
              handleSendToGHL={(e, prop) => {
                e.stopPropagation();
                handleSendToGHL(prop.id);
              }}
              findComparables={findComparables}
              currentUser={currentUser}
            />
          </Box>
        </Stack>
      )}

      {/* List View - Compact Strip Design with Sortable Headers */}
      {viewMode === 'list' && (
        <Stack gap={0} height="100%">
          {/* Pagination Controls - Sticky at Top */}
          <Box 
            py={3} 
            px={4} 
            borderBottomWidth="1px" 
            borderColor="border.muted" 
            bg="bg.panel"
            position="sticky"
            top={0}
            zIndex={20}
          >
            <HStack justify="space-between" wrap="wrap" gap={3}>
              <HStack gap={2}>
                <Text fontSize="sm" color="fg.muted">
                  Showing {startIndex}-{endIndex} of {sortedProperties.length} properties
                </Text>
                <Text fontSize="sm" color="fg.muted">•</Text>
                <HStack gap={1}>
                  <Text fontSize="sm" color="fg.muted">Show:</Text>
                  {[25, 50, 100].map(size => (
                    <Button
                      key={size}
                      size="xs"
                      variant={pageSize === size ? 'solid' : 'ghost'}
                      colorPalette={pageSize === size ? 'blue' : 'gray'}
                      onClick={() => handlePageSizeChange(size)}
                    >
                      {size}
                    </Button>
                  ))}
                </HStack>
              </HStack>

              <HStack gap={2}>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage(p => p - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Text fontSize="sm" color="fg.muted">
                  Page {currentPage} of {totalPages}
                </Text>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage(p => p + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </HStack>
            </HStack>
          </Box>

          <Box flex="1" overflowY="auto" bg="bg.subtle">
          {/* Table Header */}
          <Box 
            bg="gray.100" 
            py={0.5} 
            px={4} 
            borderBottomWidth="2px" 
            borderColor="gray.300"
            position="sticky"
            top={0}
            zIndex={10}
          >
            <SimpleGrid columns={{ base: 1, md: 16 }} gap={2} alignItems="center">
              {/* Favorite Header - Sortable */}
              <Box 
                gridColumn={{ md: "span 1" }} 
                textAlign="center"
                cursor="pointer"
                onClick={() => handleSort('isFavorited', 'Favorite')}
                _hover={{ color: 'blue.600' }}
              >
                <HStack gap={1} justify="center">
                  <Heart size={14} color="gray" />
                  {sortConfig.key === 'isFavorited' && (
                    sortConfig.direction === 'asc' ? <ArrowUp size={10} /> : <ArrowDownIcon size={10} />
                  )}
                </HStack>
              </Box>

              {/* Score Header */}
              <Box 
                gridColumn={{ md: "span 1" }} 
                cursor="pointer" 
                onClick={() => handleSort('scores.global', 'Deal Score')}
                _hover={{ color: 'blue.600' }}
              >
                <HStack gap={1}>
                  <Text fontSize="xs" fontWeight="bold" textTransform="uppercase" color="gray.700">
                    Score
                  </Text>
                  {sortConfig.key === 'scores.global' && (
                    sortConfig.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDownIcon size={12} />
                  )}
                </HStack>
              </Box>

              {/* Address Header */}
              <Box gridColumn={{ md: "span 2" }}>
                <Text fontSize="xs" fontWeight="bold" textTransform="uppercase" color="gray.700">
                  Address
                </Text>
              </Box>

              {/* Price Header */}
              <Box 
                gridColumn={{ md: "span 1" }} 
                cursor="pointer" 
                onClick={() => handleSort('price', 'Price')}
                _hover={{ color: 'blue.600' }}
              >
                <HStack gap={1}>
                  <Text fontSize="xs" fontWeight="bold" textTransform="uppercase" color="gray.700">
                    Price
                  </Text>
                  {sortConfig.key === 'price' && (
                    sortConfig.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDownIcon size={12} />
                  )}
                </HStack>
              </Box>

              {/* Avg Comps Header */}
              <Box gridColumn={{ md: "span 1" }}>
                <Text fontSize="xs" fontWeight="bold" textTransform="uppercase" color="gray.700">
                  Comps
                </Text>
              </Box>

              {/* Total Drop $ Header - NEW */}
              <Box 
                gridColumn={{ md: "span 1" }} 
                cursor="pointer" 
                onClick={() => handleSort('totalDropAmount', 'Total Drop $')}
                _hover={{ color: 'blue.600' }}
              >
                <HStack gap={1}>
                  <Text fontSize="xs" fontWeight="bold" textTransform="uppercase" color="gray.700">
                    Drop $
                  </Text>
                  {sortConfig.key === 'totalDropAmount' && (
                    sortConfig.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDownIcon size={12} />
                  )}
                </HStack>
              </Box>

              {/* Total Drop % Header - NEW */}
              <Box 
                gridColumn={{ md: "span 1" }} 
                cursor="pointer" 
                onClick={() => handleSort('dropAsAPercentageOfTheInitialPrice', 'Total Drop %')}
                _hover={{ color: 'blue.600' }}
              >
                <HStack gap={1}>
                  <Text fontSize="xs" fontWeight="bold" textTransform="uppercase" color="gray.700">
                    Drop %
                  </Text>
                  {sortConfig.key === 'dropAsAPercentageOfTheInitialPrice' && (
                    sortConfig.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDownIcon size={12} />
                  )}
                </HStack>
              </Box>

              {/* Beds Header - NOW SORTABLE */}
              <Box 
                gridColumn={{ md: "span 1" }}
                cursor="pointer"
                onClick={() => handleSort('bedrooms', 'Bedrooms')}
                _hover={{ color: 'blue.600' }}
              >
                <HStack gap={1}>
                  <Text fontSize="xs" fontWeight="bold" textTransform="uppercase" color="gray.700">
                    Beds
                  </Text>
                  {sortConfig.key === 'bedrooms' && (
                    sortConfig.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDownIcon size={12} />
                  )}
                </HStack>
              </Box>

              {/* Baths Header - NOW SORTABLE */}
              <Box 
                gridColumn={{ md: "span 1" }}
                cursor="pointer"
                onClick={() => handleSort('bathrooms', 'Bathrooms')}
                _hover={{ color: 'blue.600' }}
              >
                <HStack gap={1}>
                  <Text fontSize="xs" fontWeight="bold" textTransform="uppercase" color="gray.700">
                    Baths
                  </Text>
                  {sortConfig.key === 'bathrooms' && (
                    sortConfig.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDownIcon size={12} />
                  )}
                </HStack>
              </Box>

              {/* Type Header - NOW SORTABLE */}
              <Box 
                gridColumn={{ md: "span 1" }}
                cursor="pointer"
                onClick={() => handleSort('propertyType', 'Property Type')}
                _hover={{ color: 'blue.600' }}
              >
                <HStack gap={1}>
                  <Text fontSize="xs" fontWeight="bold" textTransform="uppercase" color="gray.700">
                    Type
                  </Text>
                  {sortConfig.key === 'propertyType' && (
                    sortConfig.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDownIcon size={12} />
                  )}
                </HStack>
              </Box>

              {/* Ward Header */}
              <Box 
                gridColumn={{ md: "span 1" }} 
                cursor="pointer" 
                onClick={() => handleSort('wards', 'Ward')}
                _hover={{ color: 'blue.600' }}
              >
                <HStack gap={1}>
                  <Text fontSize="xs" fontWeight="bold" textTransform="uppercase" color="gray.700">
                    Ward
                  </Text>
                  {sortConfig.key === 'wards' && (
                    sortConfig.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDownIcon size={12} />
                  )}
                </HStack>
              </Box>

              {/* DOM Header */}
              <Box 
                gridColumn={{ md: "span 1" }} 
                textAlign="right"
                cursor="pointer" 
                onClick={() => handleSort('daysOnMarket', 'Days on Market')}
                _hover={{ color: 'blue.600' }}
              >
                <HStack gap={1} justify="flex-end">
                  <Text fontSize="xs" fontWeight="bold" textTransform="uppercase" color="gray.700">
                    DOM
                  </Text>
                  {sortConfig.key === 'daysOnMarket' && (
                    sortConfig.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDownIcon size={12} />
                  )}
                </HStack>
              </Box>

              {/* GHL Header - User-specific label */}
              <Box gridColumn={{ md: "span 1" }} textAlign="center">
                <Text fontSize="xs" fontWeight="bold" textTransform="uppercase" color="gray.700">
                  {currentUser?.monGhlColumn === 'JS Send to GHL' ? 'JS GHL' : 
                   currentUser?.monGhlColumn === 'AZ Send to GHL' ? 'AZ GHL' : 'GHL'}
                </Text>
              </Box>
            </SimpleGrid>
          </Box>

          {/* Property Rows */}
          <Stack gap="1px" pb={4}>
            {pagedProperties.map((prop) => {
              const handleSendToGHLClick = async (e) => {
                e.stopPropagation();
                await handleSendToGHL(prop.id);
              };

              const handleFavoriteClick = (e) => {
                e.stopPropagation();
                toggleFavorite(prop.id);
              };

              // Get actual GHL status based on current user's column
              const getGHLStatus = () => {
                if (!currentUser?.monGhlColumn) return null;
                
                // Map column name to property field and return the ACTUAL current value
                if (currentUser.monGhlColumn === 'JS Send to GHL') {
                  return prop.jsSendToGhl || null;
                }
                if (currentUser.monGhlColumn === 'AZ Send to GHL') {
                  return prop.azSendToGhl || null;
                }
                return null;
              };

              const comps = findComparables(prop);
              const isFavorited = favorites.has(prop.id);
              const ghlStatus = getGHLStatus();
              const isSent = sentToGHL.has(prop.id) || ghlStatus !== null;

              return (
              <Box 
                key={prop.id}
                bg="bg.panel"
                py={0}
                px={4}
                cursor="pointer"
                onClick={() => handleRowClick(prop)}
                _hover={{ bg: "gray.50" }}
                transition="background 0.1s"
              >
                <SimpleGrid columns={{ base: 1, md: 16 }} gap={2} alignItems="center">
                  
                  {/* Favorite Button */}
                  <Box gridColumn={{ md: "span 1" }} textAlign="center">
                    <IconButton
                      variant="ghost"
                      size="sm"
                      onClick={handleFavoriteClick}
                      aria-label="Favorite"
                      _hover={{ transform: 'scale(1.1)' }}
                    >
                      <Heart 
                        size={18} 
                        color={isFavorited ? "#e11d48" : "#9ca3af"}
                        fill={isFavorited ? "#e11d48" : "none"}
                      />
                    </IconButton>
                  </Box>

                  {/* Deal Score Badge */}
                  <Box gridColumn={{ md: "span 1" }}>
                    <Badge 
                      colorPalette={getScoreColor(prop.scores.global)} 
                      variant="solid" 
                      size="md"
                      borderRadius="md"
                    >
                      {safeNum(prop.scores.global)}
                    </Badge>
                  </Box>

                  {/* Address */}
                  <Box gridColumn={{ md: "span 2" }}>
                    <Text fontSize="xs" lineClamp={1} fontWeight="medium">
                      {prop.name?.split(',')[0] || prop.name}, {prop.address?.city || 'Windsor'}, ON
                    </Text>
                  </Box>

                  {/* Price */}
                  <Box gridColumn={{ md: "span 1" }}>
                    <Text fontSize="sm" fontWeight="bold" letterSpacing="-0.5px">
                      ${Number(safeNum(prop.price)).toLocaleString()}
                    </Text>
                  </Box>

                  {/* Comps */}
                  <Box gridColumn={{ md: "span 1" }}>
                    {comps.count > 0 ? (
                      <Text fontSize="xs" fontWeight="medium">
                        ${comps.avgPrice.toLocaleString()} ({comps.count})
                      </Text>
                    ) : (
                      <Text fontSize="xs" color="fg.muted">No comps</Text>
                    )}
                  </Box>

                  {/* Total Drop $ - NEW */}
                  <Box gridColumn={{ md: "span 1" }}>
                    {prop.totalDropAmount !== 0 ? (
                      <Text 
                        fontSize="xs" 
                        fontWeight="medium"
                        color={prop.totalDropAmount < 0 ? 'red.600' : 'green.600'}
                      >
                        {prop.totalDropAmount < 0 
                          ? `-$${Math.abs(prop.totalDropAmount).toLocaleString()}`
                          : `+$${prop.totalDropAmount.toLocaleString()}`}
                      </Text>
                    ) : (
                      <Text fontSize="xs" color="fg.muted">$0</Text>
                    )}
                  </Box>

                  {/* Total Drop % - NEW */}
                  <Box gridColumn={{ md: "span 1" }}>
                    {prop.dropAsAPercentageOfTheInitialPrice !== 0 ? (
                      <Text 
                        fontSize="xs" 
                        fontWeight="medium"
                        color={prop.dropAsAPercentageOfTheInitialPrice < 0 ? 'red.600' : 'green.600'}
                      >
                        {safeNum(Math.abs(prop.dropAsAPercentageOfTheInitialPrice), 1)}%
                      </Text>
                    ) : (
                      <Text fontSize="xs" color="fg.muted">0%</Text>
                    )}
                  </Box>

                  {/* Beds */}
                  <Box gridColumn={{ md: "span 1" }}>
                    <Text fontSize="xs" fontWeight="medium">{prop.bedrooms?.[0] || '-'}</Text>
                  </Box>

                  {/* Baths */}
                  <Box gridColumn={{ md: "span 1" }}>
                    <Text fontSize="xs" fontWeight="medium">{prop.bathrooms?.[0] || '-'}</Text>
                  </Box>

                  {/* Type */}
                  <Box gridColumn={{ md: "span 1" }}>
                    <Text fontSize="xs" color="fg.muted" lineClamp={1}>{prop.propertyType || 'N/A'}</Text>
                  </Box>

                  {/* Ward */}
                  <Box gridColumn={{ md: "span 1" }}>
                    <Text fontSize="xs" color="fg.muted">{prop.wards || '-'}</Text>
                  </Box>

                  {/* DOM */}
                  <Box gridColumn={{ md: "span 1" }} textAlign="right">
                    <Text fontSize="xs" color={prop.daysOnMarket > 30 ? "orange.600" : "fg.muted"}>
                      {safeNum(prop.daysOnMarket)}
                    </Text>
                  </Box>

                  {/* Send to GHL - Display actual status or button */}
                  <Box gridColumn={{ md: "span 1" }} textAlign="center">
                    {ghlStatus ? (
                      <Badge
                        colorPalette={
                          ghlStatus.toUpperCase() === 'SENT' ? 'green' :
                          ghlStatus.toUpperCase() === 'SEND' ? 'blue' :
                          'orange'
                        }
                        variant="solid"
                        size="xs"
                      >
                        {ghlStatus}
                      </Badge>
                    ) : (
                      <Button 
                        size="xs" 
                        colorPalette="blue"
                        variant="solid"
                        onClick={handleSendToGHLClick}
                      >
                        Send
                      </Button>
                    )}
                  </Box>

                </SimpleGrid>
              </Box>
              );
            })}
          </Stack>
          </Box>
        </Stack>
      )}

      {/* Property Detail Modal */}
      <Dialog.Root 
        open={isModalOpen} 
        onOpenChange={({ open }) => setIsModalOpen(open)}
        size="full"
      >
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content maxW="90vw" maxH="90vh" overflow="hidden">
              <Dialog.CloseTrigger asChild position="absolute" top="4" right="4" zIndex="1">
                <CloseButton size="sm" />
              </Dialog.CloseTrigger>
              <Dialog.Body p={0} overflow="auto">
                {selectedProperty && (
                  <PropertyDetailView
                    property={selectedProperty}
                    allProperties={scoredProperties}
                    onPropertyChange={setSelectedProperty}
                    currentUser={currentUser}
                    onNavigateToRealtorList={handleNavigateToRealtorList}
                  />
                )}
              </Dialog.Body>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </Stack>
  );
}
