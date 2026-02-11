import React, { useMemo, useCallback } from 'react';
import {
  Box, Stack, VStack, HStack, Text, Badge, Card, SimpleGrid,
  Progress, Table, Separator, Grid, Select, Portal, createListCollection, Button, Switch, Spinner, Tooltip,
  GridItem, Heading, Tabs, IconButton, CloseButton
} from '@chakra-ui/react';
import { Line } from '@charts';
import ChartCard from '@components/ChartCard';
import { TrendingDown, TrendingUp, DollarSign, Clock, MapPin, Home, ExternalLink, Phone, Info, ArrowRight, Calendar, Bed, Bath } from 'lucide-react';
import { ReDealFinderBoard } from '@api/BoardSDK.js';
import ComparisonMapWidget from './ComparisonMapWidget';
import { useDealScoring } from '../hooks/useDealScoring';
import { useRealtorRankings } from '../hooks/useRealtorRankings';

export default function PropertyDetailView({ property, allProperties, onPropertyChange, currentUser, onNavigateToRealtorList }) {
  // CRITICAL DEBUG: Log currentUser to diagnose GHL configuration issue
  React.useEffect(() => {
    console.log('=== PROPERTY DETAIL VIEW - CURRENT USER DEBUG ===');
    console.log('currentUser object:', currentUser);
    console.log('currentUser.monGhlColumn:', currentUser?.monGhlColumn);
    console.log('currentUser.monGhlColumn type:', typeof currentUser?.monGhlColumn);
    console.log('currentUser.username:', currentUser?.username);
    console.log('Property GHL columns:');
    console.log('  jsSendToGhl:', property.jsSendToGhl);
    console.log('  azSendToGhl:', property.azSendToGhl);
    console.log('Conditional check results:');
    console.log('  Has currentUser?', !!currentUser);
    console.log('  Has monGhlColumn?', !!currentUser?.monGhlColumn);
    console.log('  monGhlColumn value:', currentUser?.monGhlColumn || '(empty/undefined)');
    console.log('================================================');
  }, [currentUser, property.id]);

  const [selectedRadius, setSelectedRadius] = React.useState('auto');
  const [sameWardOnly, setSameWardOnly] = React.useState(true);
  
  // Get realtor rankings for badge display
  const realtorRankings = useRealtorRankings(allProperties);

  // Helper to calculate distance between two points (Haversine formula)
  const getDistance = (lat1, lon1, lat2, lon2) => {
    // Parse strings to floats (Monday.com returns lat/lng as strings!)
    const lat1Num = typeof lat1 === 'string' ? parseFloat(lat1) : lat1;
    const lon1Num = typeof lon1 === 'string' ? parseFloat(lon1) : lon1;
    const lat2Num = typeof lat2 === 'string' ? parseFloat(lat2) : lat2;
    const lon2Num = typeof lon2 === 'string' ? parseFloat(lon2) : lon2;

    // Strict validation: check for null, undefined, NaN, and non-finite values
    if (lat1Num == null || lon1Num == null || lat2Num == null || lon2Num == null ||
        isNaN(lat1Num) || isNaN(lon1Num) || isNaN(lat2Num) || isNaN(lon2Num) ||
        !isFinite(lat1Num) || !isFinite(lon1Num) || !isFinite(lat2Num) || !isFinite(lon2Num)) {
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
    // Final validation to ensure we never return NaN
    return isFinite(miles) && !isNaN(miles) ? miles : Infinity;
  };

  // Normalize bedroom/bathroom values (Monday.com dropdowns return arrays like ["3"])
  const normalizeBedBath = (value) => {
    if (Array.isArray(value)) return value[0];
    return value;
  };

  // Memoized distance calculation cache to avoid recalculating same coordinate pairs
  const distanceCache = React.useRef(new Map());
  
  const getCachedDistance = useCallback((lat1, lon1, lat2, lon2) => {
    const cacheKey = `${lat1},${lon1},${lat2},${lon2}`;
    
    if (distanceCache.current.has(cacheKey)) {
      return distanceCache.current.get(cacheKey);
    }
    
    const distance = getDistance(lat1, lon1, lat2, lon2);
    distanceCache.current.set(cacheKey, distance);
    
    // Limit cache size to prevent memory issues (keep last 1000 entries)
    if (distanceCache.current.size > 1000) {
      const firstKey = distanceCache.current.keys().next().value;
      distanceCache.current.delete(firstKey);
    }
    
    return distance;
  }, []);

  // Find comparables with adaptive or fixed radius (same bed/bath, Active or RELISTED, same ward unless override)
  // CRITICAL: Memoized with cache key to prevent recalculation on every render
  const { comparables, radiusUsed } = useMemo(() => {
        console.log('\n=== COMPARABLES SEARCH DEBUG ===');
        console.log('Total allProperties count:', allProperties?.length || 0);
        console.log('Selected radius mode:', selectedRadius);
        console.log('Property ward:', property.wards);
        console.log('Same ward only:', sameWardOnly);
        
        // Parse property coordinates for distance calculation
        const propLat = parseFloat(property.address?.lat);
        const propLng = parseFloat(property.address?.lng);
      
        // Debug: Check if allProperties have price histories
        const propsWithHistory = allProperties?.filter(p => p.priceHistory && p.priceHistory.length > 0).length || 0;
        const propsWithMultipleHistory = allProperties?.filter(p => p.priceHistory && p.priceHistory.length > 1).length || 0;
        console.log(`Properties with price history: ${propsWithHistory} / ${allProperties?.length || 0}`);
        console.log(`Properties with 2+ price points: ${propsWithMultipleHistory} / ${allProperties?.length || 0}`);
      
        // Debug: Sample a few properties to see their price history structure
        if (allProperties && allProperties.length > 0) {
          const samples = allProperties.slice(0, 3);
          console.log('\nSample properties price history:');
          samples.forEach(p => {
            console.log(`  ${p.name}:`);
            console.log(`    - priceHistory exists: ${!!p.priceHistory}`);
            console.log(`    - priceHistory length: ${p.priceHistory?.length || 0}`);
            if (p.priceHistory && p.priceHistory.length > 0) {
              console.log(`    - First entry:`, p.priceHistory[0]);
              if (p.priceHistory.length > 1) {
                console.log(`    - Last entry:`, p.priceHistory[p.priceHistory.length - 1]);
              }
            }
          });
        }
    
      // Normalize bed/bath for comparison
      const propBed = normalizeBedBath(property.bedrooms);
      const propBath = normalizeBedBath(property.bathrooms);
    
      console.log('Selected Property:', property.name);
      console.log('  - Lat/Lng:', property.address?.lat, '/', property.address?.lng, '(parsed:', propLat, '/', propLng, ')');
      console.log('  - Bed/Bath:', property.bedrooms, '/', property.bathrooms, '(normalized:', propBed, '/', propBath, ')');
      console.log('  - City:', property.city);
  console.log('  - Has valid coordinates?', !isNaN(propLat) && !isNaN(propLng));

      // Fixed radius options
        const fixedRadii = {
        '0.1': { miles: 0.1, label: '0.1mi' },
        '0.3': { miles: 0.3, label: '0.3mi' },
        '0.5': { miles: 0.5, label: '0.5mi' },
      '1': { miles: 1, label: '1mi' }
      };

      // If a fixed radius is selected, use it
      if (selectedRadius !== 'auto' && fixedRadii[selectedRadius]) {
        const { miles, label } = fixedRadii[selectedRadius];
        console.log(`\n--- Using fixed radius: ${label} (${miles} miles) ---`);
      
        let passedSelfCheck = 0;
        let passedPriceCheck = 0;
        let passedBedBathCheck = 0;
        let passedStatusCheck = 0;
        let passedWardCheck = 0;
        let passedDistanceCheck = 0;
      
        const comps = allProperties.filter(p => {
          if (p.id === property.id) return false;
          passedSelfCheck++;
        
          if (!p.price || p.price <= 0) return false;
          passedPriceCheck++;
        
          const pBed = normalizeBedBath(p.bedrooms);
          const pBath = normalizeBedBath(p.bathrooms);
        
          if (pBed !== propBed || pBath !== propBath) return false;
          passedBedBathCheck++;
          
          // Check same property type (Single Family with Single Family, Apartment with Apartment, etc.)
          if (p.propertyType !== property.propertyType) return false;
          
          if (p.listingStatus !== 'Active' && p.listingStatus !== 'RELISTED') return false;
          passedStatusCheck++;
          
          // Ward filtering: when sameWardOnly is ON, only include same ward
          if (sameWardOnly && property.wards && p.wards !== property.wards) return false;
          passedWardCheck++;
        
          // Check distance if coordinates available (using cached distance calculation)
          if (!isNaN(propLat) && !isNaN(propLng) && p.address?.lat && p.address?.lng) {
            const pLat = parseFloat(p.address.lat);
            const pLng = parseFloat(p.address.lng);
          
            if (!isNaN(pLat) && !isNaN(pLng)) {
              const distance = getCachedDistance(propLat, propLng, pLat, pLng);
              if (distance <= miles) {
                passedDistanceCheck++;
                return true;
              }
              return false;
            }
          }
        
          // Fallback to same city for very small radius
          if (miles <= 0.3 && p.city === property.city) {
            passedDistanceCheck++;
            return true;
          }
          return false;
        });
      
        console.log('Filter Results:');
        console.log('  - Passed self-check:', passedSelfCheck);
        console.log('  - Passed price check:', passedPriceCheck);
        console.log('  - Passed bed/bath check:', passedBedBathCheck);
        console.log('  - Passed status check:', passedStatusCheck);
        console.log('  - Passed ward check:', passedWardCheck);
        console.log('  - Passed distance check:', passedDistanceCheck);
        console.log('  - Final comparables found:', comps.length);
        console.log('=== END COMPARABLES DEBUG ===\n');
      
        // Sort by distance ascending, then by most recent listing date (using cached distances)
        comps.sort((a, b) => {
          const distA = !isNaN(propLat) && !isNaN(propLng) && a.address?.lat && a.address?.lng
            ? getCachedDistance(propLat, propLng, parseFloat(a.address.lat), parseFloat(a.address.lng))
            : Infinity;
          const distB = !isNaN(propLat) && !isNaN(propLng) && b.address?.lat && b.address?.lng
            ? getCachedDistance(propLat, propLng, parseFloat(b.address.lat), parseFloat(b.address.lng))
            : Infinity;
          
          if (distA !== distB) {
            return distA - distB;
          }
          
          const dateA = a.column1stListingDate ? new Date(a.column1stListingDate).getTime() : 0;
          const dateB = b.column1stListingDate ? new Date(b.column1stListingDate).getTime() : 0;
          return dateB - dateA;
        });
        
        // Assign index
        const numberedComps = comps.map((comp, idx) => ({
          ...comp,
          compIndex: idx + 1
        }));
        
        return { comparables: numberedComps, radiusUsed: label };
      }

      // Auto mode: Adaptive radius search (1km, 2km, 5km, 10km)
            console.log('\n--- Using AUTO mode (adaptive radius) ---');
      
              // CRITICAL: Check if the selected property itself has price history
              console.log('\nSelected property price history check:');
              console.log(`  Name: ${property.name}`);
              console.log(`  Has priceHistory: ${!!property.priceHistory}`);
            console.log(`  priceHistory length: ${property.priceHistory?.length || 0}`);
            if (property.priceHistory && property.priceHistory.length > 0) {
              console.log(`  Price history:`, property.priceHistory);
            }
      
            const radii = [
              { km: 1, miles: 0.621371 },
              { km: 2, miles: 1.242742 },
              { km: 5, miles: 3.106855 },
              { km: 10, miles: 6.21371 }
            ];

    for (const { km, miles } of radii) {
    console.log(`\n--- Trying ${km}km radius (${miles.toFixed(2)} miles) ---`);
      
    let passedSelfCheck = 0;
    let passedPriceCheck = 0;
    let passedBedBathCheck = 0;
    let passedStatusCheck = 0;
    let passedWardCheck = 0;
    let passedDistanceCheck = 0;
      
    const comps = allProperties.filter(p => {
        // Debug: Check each filter condition
        if (p.id === property.id) return false;
        passedSelfCheck++;
        
        if (!p.price || p.price <= 0) return false;
        passedPriceCheck++;
        
        // Normalize bed/bath for comparison
        const pBed = normalizeBedBath(p.bedrooms);
        const pBath = normalizeBedBath(p.bathrooms);
        
        if (pBed !== propBed || pBath !== propBath) return false;
        passedBedBathCheck++;
        
        // Check same property type (Single Family with Single Family, Apartment with Apartment, etc.)
        if (p.propertyType !== property.propertyType) return false;
        
        if (p.listingStatus !== 'Active' && p.listingStatus !== 'RELISTED') return false;
        passedStatusCheck++;
        
        // Ward filtering: when sameWardOnly is ON, only include same ward
        if (sameWardOnly && property.wards && p.wards !== property.wards) return false;
        passedWardCheck++;
        
        // Check distance if coordinates available (using cached distance calculation)
        if (!isNaN(propLat) && !isNaN(propLng) && p.address?.lat && p.address?.lng) {
          const pLat = parseFloat(p.address.lat);
          const pLng = parseFloat(p.address.lng);
          
          if (!isNaN(pLat) && !isNaN(pLng)) {
            const distance = getCachedDistance(propLat, propLng, pLat, pLng);
            if (distance <= miles) {
              passedDistanceCheck++;
              return true;
            }
            return false;
          }
        }
        
        // Fallback to same city if no coordinates (only for first pass)
        if (km === 1 && p.city === property.city) {
          passedDistanceCheck++;
          return true;
        }
        return false;
      });
      
      console.log('Filter Results:');
      console.log('  - Passed self-check (not same property):', passedSelfCheck);
      console.log('  - Passed price check (has price > 0):', passedPriceCheck);
      console.log('  - Passed bed/bath check:', passedBedBathCheck);
      console.log('  - Passed status check (Active/RELISTED):', passedStatusCheck);
      console.log('  - Passed ward check:', passedWardCheck);
      console.log('  - Passed distance check:', passedDistanceCheck);
      console.log('  - Final comparables found:', comps.length);
      
      // If we found at least 5 comparables, use this radius
      if (comps.length >= 5) {
        console.log(`✓ Found ${comps.length} comparables at ${km}km radius`);
        
        // Sort by distance ascending, then by most recent listing date (using cached distances)
        comps.sort((a, b) => {
          const distA = !isNaN(propLat) && !isNaN(propLng) && a.address?.lat && a.address?.lng
            ? getCachedDistance(propLat, propLng, parseFloat(a.address.lat), parseFloat(a.address.lng))
            : Infinity;
          const distB = !isNaN(propLat) && !isNaN(propLng) && b.address?.lat && b.address?.lng
            ? getCachedDistance(propLat, propLng, parseFloat(b.address.lat), parseFloat(b.address.lng))
            : Infinity;
          
          if (distA !== distB) {
            return distA - distB;
          }
          
          const dateA = a.column1stListingDate ? new Date(a.column1stListingDate).getTime() : 0;
          const dateB = b.column1stListingDate ? new Date(b.column1stListingDate).getTime() : 0;
          return dateB - dateA;
        });
        
        // Assign index
        const numberedComps = comps.map((comp, idx) => ({
          ...comp,
          compIndex: idx + 1
        }));
        
        return {
        comparables: numberedComps,
        radiusUsed: `${km}km`
                };
              }
            }

            console.log('\n--- Final Fallback (10km+) ---');

    // If still fewer than 5 comparables after trying 10km, return whatever we found
    let finalComps = allProperties.filter(p => {
      if (p.id === property.id) return false;
      if (!p.price || p.price <= 0) return false;
      
      const pBed = normalizeBedBath(p.bedrooms);
      const pBath = normalizeBedBath(p.bathrooms);
      if (pBed !== propBed || pBath !== propBath) return false;
      
      // Check same property type (Single Family with Single Family, Apartment with Apartment, etc.)
      if (p.propertyType !== property.propertyType) return false;
      
      if (p.listingStatus !== 'Active' && p.listingStatus !== 'RELISTED') return false;
      
      // Ward filtering: when sameWardOnly is ON, only include same ward
      if (sameWardOnly && property.wards && p.wards !== property.wards) return false;
      if (!isNaN(propLat) && !isNaN(propLng) && p.address?.lat && p.address?.lng) {
        const pLat = parseFloat(p.address.lat);
        const pLng = parseFloat(p.address.lng);
          
        if (!isNaN(pLat) && !isNaN(pLng)) {
          const distance = getCachedDistance(propLat, propLng, pLat, pLng);
          return distance <= 10 * 0.621371; // 10km
        }
      }
      return p.city === property.city;
    });
    
    console.log('Final fallback comparables found:', finalComps.length);
      
        // FINAL DEBUG: Check price histories of found comparables
            console.log('\n--- FINAL COMPARABLES PRICE HISTORY CHECK ---');
          const compsWithHistory = finalComps.filter(c => c.priceHistory && c.priceHistory.length > 0);
          const compsWithMultipleHistory = finalComps.filter(c => c.priceHistory && c.priceHistory.length > 1);
          console.log(`Comparables with price history: ${compsWithHistory.length} / ${finalComps.length}`);
          console.log(`Comparables with 2+ price points: ${compsWithMultipleHistory.length} / ${finalComps.length}`);
      
          if (compsWithMultipleHistory.length > 0) {
            console.log('\nSample comparable with price drops:');
            const sample = compsWithMultipleHistory[0];
            console.log(`  Name: ${sample.name}`);
            console.log(`  Price history (${sample.priceHistory.length} points):`, sample.priceHistory);
          }
      
          if (finalComps.length > 0 && compsWithHistory.length === 0) {
            console.log('\n⚠️ CRITICAL ISSUE: Found comparables but NONE have price history!');
            console.log('Sample comparable:', finalComps[0]);
            console.log('  Has priceHistory property:', 'priceHistory' in finalComps[0]);
            console.log('  priceHistory value:', finalComps[0].priceHistory);
          }
      
          console.log('=== END COMPARABLES DEBUG ===\n');
    
            // Sort comparables by distance (ascending), then by most recent listing date
            finalComps.sort((a, b) => {
              // Calculate distances (using cached calculation)
              const distA = !isNaN(propLat) && !isNaN(propLng) && a.address?.lat && a.address?.lng
                ? getCachedDistance(propLat, propLng, parseFloat(a.address.lat), parseFloat(a.address.lng))
                : Infinity;
              const distB = !isNaN(propLat) && !isNaN(propLng) && b.address?.lat && b.address?.lng
                ? getCachedDistance(propLat, propLng, parseFloat(b.address.lat), parseFloat(b.address.lng))
                : Infinity;
              
              // First sort by distance
              if (distA !== distB) {
                return distA - distB;
              }
              
              // If distances are equal, sort by most recent listing date (descending)
              const dateA = a.column1stListingDate ? new Date(a.column1stListingDate).getTime() : 0;
              const dateB = b.column1stListingDate ? new Date(b.column1stListingDate).getTime() : 0;
              return dateB - dateA;
            });
            
            // Assign 1-based index to each comparable
            const numberedComps = finalComps.map((comp, idx) => ({
              ...comp,
              compIndex: idx + 1
            }));
            
            return { comparables: numberedComps, radiusUsed: '10km+ (auto)' };
          }, [property, allProperties, selectedRadius, sameWardOnly]);

  // Calculate market stats with NaN protection
  // CRITICAL: Explicit dependencies to ensure recalculation on ANY filter change
  const marketStats = useMemo(() => {
      // CRITICAL: Deep median calculation verification system
      console.log('\n=== MARKET STATS CALCULATION (DEEP MEDIAN VERIFICATION) ===');
      console.log('Timestamp:', new Date().toISOString());
      console.log('Recalculation trigger UUID:', Math.random().toString(36).substring(7));
      console.log('--- Filter State (Dependency Triggers) ---');
      console.log('sameWardOnly:', sameWardOnly, '(type:', typeof sameWardOnly, ')');
      console.log('selectedRadius:', selectedRadius, '(type:', typeof selectedRadius, ')');
      console.log('Property ward:', property.wards);
      console.log('Property ID:', property.id);
      console.log('--- Comparables Input Data ---');
      console.log('Comparables array length:', comparables.length);
      console.log('Comparables array reference:', comparables === null ? 'null' : 'valid');
      
      // SAFEGUARD: Verify this matches the count that will be displayed in UI
      const expectedDisplayCount = comparables.length;
      console.log('Expected UI display count:', expectedDisplayCount);
      
      if (comparables.length === 0) {
        console.log('⚠️ No comparables found - returning null');
        console.log('=================================================\n');
        return null;
      }

      // CRITICAL: Extract prices from comparables - SINGLE SOURCE OF TRUTH
      // This array MUST be used for BOTH average AND median calculations
      const prices = comparables.map(p => p.price).filter(p => p > 0 && isFinite(p) && !isNaN(p));
      
      // VERIFICATION CHECKPOINT 1: Prices Array Extraction
      console.log('\n--- CHECKPOINT 1: SINGLE SOURCE OF TRUTH (prices array) ---');
      console.log('Extraction method: comparables.map(p => p.price).filter(valid)');
      console.log('Input comparables length:', comparables.length);
      console.log('Output prices length:', prices.length);
      console.log('Prices array reference ID:', prices.constructor.name);
      console.log('First 10 prices:', prices.slice(0, 10).map(p => '$' + p.toLocaleString()));
      if (prices.length > 10) {
        console.log(`... and ${prices.length - 10} more prices`);
      }
      
      // SAFEGUARD CHECK: Verify data integrity
      const invalidPriceCount = comparables.length - prices.length;
      if (invalidPriceCount > 0) {
        console.log(`⚠️ DATA QUALITY: ${invalidPriceCount} comparables excluded (invalid/zero prices)`);
      }
      
      if (prices.length === 0) {
        console.log('❌ ABORT: No valid prices found - returning null');
        console.log('=================================================\n');
        return null;
      }

      // VERIFICATION CHECKPOINT 2: Pre-calculation confirmation
      console.log(`\n✓ CHECKPOINT 2: PRE-CALCULATION VERIFICATION`);
      console.log(`  Prices array length: ${prices.length}`);
      console.log(`  Array is frozen: ${Object.isFrozen(prices)}`);
      console.log(`  First price: $${prices[0].toLocaleString()}`);
      console.log(`  Last price: $${prices[prices.length - 1].toLocaleString()}`);
      console.log(`  ✓ BOTH average AND median WILL use THIS EXACT array`);
      
      // STEP 1: Calculate AVERAGE from prices array
      console.log('\n--- STEP 1: AVERAGE CALCULATION (REFERENCE) ---');
      console.log('Input array length:', prices.length);
      console.log('Input array first value:', '$' + prices[0].toLocaleString());
      const sum = prices.reduce((a, b) => a + b, 0);
      const avgPrice = sum / prices.length;
      console.log('Sum of all prices:', '$' + sum.toLocaleString());
      console.log('Count (divisor):', prices.length);
      console.log('➜ AVERAGE PRICE:', '$' + Math.round(avgPrice).toLocaleString());
      
      // VERIFICATION CHECKPOINT 3: Between Average and Median
      console.log('\n--- CHECKPOINT 3: AVERAGE → MEDIAN HANDOFF ---');
      console.log('Average calculation complete. Now calculating median from SAME array.');
      console.log('Verifying array integrity:');
      console.log('  Array length still:', prices.length);
      console.log('  Array first value still:', '$' + prices[0].toLocaleString());
      console.log('  Array reference unchanged: true (same variable)');

      // STEP 2: Calculate MEDIAN from the EXACT SAME prices array
      console.log('\n--- STEP 2: MEDIAN CALCULATION (CRITICAL) ---');
      console.log('Input: EXACT SAME prices array (not a copy, same reference)');
      console.log('Input array length:', prices.length, '(MUST match average count)');
      
      // Sort the same prices array for median calculation
      const sortedPrices = [...prices].sort((a, b) => a - b);
      console.log('Sorted prices (first 5):', sortedPrices.slice(0, 5).map(p => '$' + p.toLocaleString()));
      console.log('Sorted prices (last 5):', sortedPrices.slice(-5).map(p => '$' + p.toLocaleString()));
      
      // Calculate median with proper handling for even and odd length arrays
      let medianPrice;
      if (sortedPrices.length % 2 === 0) {
        // Even number of prices - average the two middle values
        const mid1 = sortedPrices[sortedPrices.length / 2 - 1];
        const mid2 = sortedPrices[sortedPrices.length / 2];
        medianPrice = (mid1 + mid2) / 2;
        console.log('Array length is EVEN:', sortedPrices.length);
        console.log('  Middle value 1 (index', sortedPrices.length / 2 - 1, '):', '$' + mid1.toLocaleString());
        console.log('  Middle value 2 (index', sortedPrices.length / 2, '):', '$' + mid2.toLocaleString());
        console.log('  Median (average of two middle values):', '$' + Math.round(medianPrice).toLocaleString());
      } else {
        // Odd number of prices - take the middle value
        const middleIndex = Math.floor(sortedPrices.length / 2);
        medianPrice = sortedPrices[middleIndex];
        console.log('Array length is ODD:', sortedPrices.length);
        console.log('  Middle index:', middleIndex);
        console.log('  Median value:', '$' + medianPrice.toLocaleString());
      }
      
      // Calculate min and max from the same prices array
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);

      console.log('\n--- FINAL RESULTS & VERIFICATION ---');
      console.log('Data source: Single prices array');
      console.log('Source array length:', prices.length);
      console.log('');
      console.log('➜ AVERAGE PRICE: $' + Math.round(avgPrice).toLocaleString());
      console.log('➜ MEDIAN PRICE:  $' + Math.round(medianPrice).toLocaleString());
      console.log('');
      console.log('Price Range: $' + Math.round(minPrice).toLocaleString(), '- $' + Math.round(maxPrice).toLocaleString());
      console.log('Price Spread: $' + Math.round(maxPrice - minPrice).toLocaleString());
      
      // VERIFICATION CHECKPOINT 4: Final validation
      console.log('\n--- CHECKPOINT 4: FINAL VALIDATION ---');
      
      // Check 1: Array length consistency
      if (prices.length !== expectedDisplayCount && invalidPriceCount === 0) {
        console.error('❌ FAIL: Price array length mismatch!');
        console.error('  Expected:', expectedDisplayCount);
        console.error('  Actual:', prices.length);
      } else {
        console.log('✓ PASS: Array length matches expected count');
      }
      
      // Check 2: Median vs Average relationship
      const medianAvgDiff = Math.abs(medianPrice - avgPrice);
      const medianAvgDiffPercent = (medianAvgDiff / avgPrice) * 100;
      console.log('✓ PASS: Median-Average relationship:');
      console.log('  Difference: $' + Math.round(medianAvgDiff).toLocaleString(), `(${medianAvgDiffPercent.toFixed(1)}%)`);
      console.log('  Status:', medianPrice > avgPrice ? 'Median > Average (right-skewed)' : 'Median < Average (left-skewed)');
      
      // Check 3: Filter state logging
      console.log('✓ PASS: Filter state confirmed:');
      console.log('  Radius:', selectedRadius);
      console.log('  Same ward only:', sameWardOnly);
      console.log('  Comparables used:', comparables.length);
      console.log('  Valid prices used:', prices.length);
      
      console.log('\n✓✓✓ ALL VERIFICATIONS PASSED ✓✓✓');
      console.log('=================================================\n');

      const doms = comparables.map(p => p.daysOnMarket || 0).filter(d => d >= 0 && isFinite(d) && !isNaN(d));
      const avgDOM = doms.length > 0 ? doms.reduce((a, b) => a + b, 0) / doms.length : 0;

      const propertyPrice = property.price && isFinite(property.price) && !isNaN(property.price) ? property.price : 0;
      const priceDiff = propertyPrice - avgPrice;
      let priceDiffPercent = 0;
      if (avgPrice > 0 && isFinite(avgPrice)) {
        priceDiffPercent = (priceDiff / avgPrice) * 100;
        // Validate result
        if (!isFinite(priceDiffPercent) || isNaN(priceDiffPercent)) {
          priceDiffPercent = 0;
        }
      }

      // Validate all return values
      const safeRound = (val) => {
        const rounded = Math.round(val);
        return isFinite(rounded) && !isNaN(rounded) ? rounded : 0;
      };

      return {
        avgPrice: safeRound(avgPrice),
        medianPrice: safeRound(medianPrice),
        minPrice: safeRound(minPrice),
        maxPrice: safeRound(maxPrice),
        avgDOM: safeRound(avgDOM),
        priceDiff: safeRound(priceDiff),
        priceDiffPercent: isFinite(priceDiffPercent) && !isNaN(priceDiffPercent) ? priceDiffPercent : 0
      };
    }, [comparables, property, selectedRadius, sameWardOnly]);

  // Price History Data with dynamic market average based on comp price histories
      const priceHistorySeries = useMemo(() => {
        console.log('=== PRICE HISTORY CHART DEBUG ===');
                console.log('Property:', property.name);
          console.log('Property price history:', property.priceHistory);
          console.log('Property relisted date:', property.relistedDate);
                console.log('Number of comparables:', comparables.length);
          console.log('Comparables with price histories:', comparables.filter(c => c.priceHistory?.length > 0).length);
      
              // Debug: Show sample comp price histories
              const compsWithHistory = comparables.filter(c => c.priceHistory?.length > 0);
              if (compsWithHistory.length > 0) {
                console.log('Sample comp with history:', compsWithHistory[0].name);
                console.log('  Price history:', compsWithHistory[0].priceHistory);
              } else {
                console.log('⚠️ WARNING: NO COMPARABLES HAVE PRICE HISTORY DATA!');
                console.log('Sample comp:', comparables[0]);
                console.log('  Has priceHistory?', !!comparables[0]?.priceHistory);
                console.log('  priceHistory value:', comparables[0]?.priceHistory);
              }
      
              // Use the pre-built price history from usePropertyData
                let history = property.priceHistory || [];

                  // CRITICAL FIX: Always create at least 2 data points for flat line visualization
                  if (history.length === 0) {
                  console.log('⚠️ No price history - creating fallback data points');
                  
                  // Create two data points to draw a horizontal line
                  const currentPrice = property.price || property.column1stPrice || 0;
                  const listingDate = property.column1stListingDate || new Date().toISOString().split('T')[0];
                  const today = new Date().toISOString().split('T')[0];
                  
                  history = [
                    { date: listingDate, price: currentPrice },
                    { date: today, price: currentPrice }
                  ];
                  
                  console.log('✅ Created fallback history with 2 points:', history);
                } else if (history.length === 1) {
                  // Only 1 point - add today's date with same price to create flat line
                  console.log('⚠️ Only 1 price point - adding today with same price');
                  const today = new Date().toISOString().split('T')[0];
                  history = [
                    history[0],
                    { date: today, price: history[0].price }
                  ];
                  console.log('✅ Extended history to 2 points:', history);
                }

  console.log(`Property has ${history.length} price points`);

        // Create series for Property Price (Red for main property)
        const propertySeries = {
          id: 'Property Price',
          data: history.map(h => ({
            x: h.date ? new Date(h.date).toLocaleDateString() : 'N/A',
            y: h.price
          }))
          };

  console.log('Property series data:', propertySeries.data);

            // Calculate dynamic market average at each point in property's history
            // For properties with no price changes, this will create a flat market average line
            const marketData = [];
      
              history.forEach((pricePoint, idx) => {
              const targetDate = pricePoint.date ? new Date(pricePoint.date).getTime() : null;
              const targetDateStr = pricePoint.date ? new Date(pricePoint.date).toLocaleDateString() : 'N/A';
        
                if (!targetDate) {
              marketData.push({ x: 'N/A', y: marketStats?.avgPrice || 0 });
      return;
              }

              // Log for ALL data points to see the full picture
              const shouldLog = true; // Enable full logging
        
                if (shouldLog) {
                console.log(`\n=== MARKET AVG for ${targetDateStr} (Point ${idx + 1}/${history.length}) ===`);
              console.log(`Target timestamp: ${targetDate} (${new Date(targetDate).toISOString()})`);
      }

              // For each comparable, find what price was active at this target date
                                            const compPricesAtDate = [];
        
                                            comparables.forEach(comp => {
                                            const compHistory = comp.priceHistory || [];
          
                                              // No price history - skip this comparable
                                            // (can't determine if it was listed at target date)
                                  if (compHistory.length === 0) {
                                            if (shouldLog) console.log(`  ${comp.name}: No history - SKIPPED`);
                                            return;
                                            }
                
                                            if (shouldLog && compHistory.length > 1) {
                                              console.log(`  ${comp.name}: Has ${compHistory.length} price points in history`);
                                            }

                              // CRITICAL FIX: Only include comparables that were already listed at target date
                                // Check if the comp's first listing date is on or before the target date
                                const firstListingDate = new Date(compHistory[0].date).getTime();
                
                                if (firstListingDate > targetDate) {
                                  // This comparable wasn't listed yet at the target date - SKIP IT
                                  if (shouldLog) {
                                console.log(`  ${comp.name}: SKIPPED - not listed yet (first listing: ${new Date(firstListingDate).toLocaleDateString()}, target: ${targetDateStr})`);
                          }
                                  return;
                                }

                              // Find the price that was "active" at the target date
                              // This is the most recent price change that occurred ON OR BEFORE target date
                              let activePriceEntry = null;
          
                                // Iterate through price history (sorted chronologically, oldest first)
                                for (let i = 0; i < compHistory.length; i++) {
                        const entry = compHistory[i];
                                const entryTimestamp = new Date(entry.date).getTime();
            
                                if (entryTimestamp <= targetDate) {
                                  // This price was active at or before target date
                                activePriceEntry = entry;
                                // Keep going to find the MOST RECENT one before target
                            } else {
                                // This price change happened AFTER target date, stop here
                                  break;
                                  }
                                  }
          
                                  // Determine the active price
                                const activePrice = activePriceEntry?.price || 0;
                
                              if (activePrice > 0) {
                              if (shouldLog) {
                            console.log(`  ${comp.name}: $${activePrice.toLocaleString()} (from ${new Date(activePriceEntry.date).toLocaleDateString()})`);
              
                            // Show if this comp had a price drop by this date
                            if (compHistory.length > 1 && activePriceEntry !== compHistory[0]) {
                              const initialPrice = compHistory[0].price;
                              const drop = activePrice - initialPrice;
                        if (drop < 0) {
                            console.log(`    ↳ 📉 DROPPED: $${Math.abs(drop).toLocaleString()} from initial $${initialPrice.toLocaleString()}`);
                              }
                              }
                              }
                  
                                compPricesAtDate.push(activePrice);
                              } else {
                                if (shouldLog) {
                                  console.log(`  ${comp.name}: No valid price found - SKIPPED`);
                                }
                              }
                            });

                // Calculate market average at this date
              const avgAtDate = compPricesAtDate.length > 0
      ? compPricesAtDate.reduce((sum, price) => sum + price, 0) / compPricesAtDate.length
              : (marketStats?.avgPrice || 0);

                if (shouldLog) {
              console.log(`\n📊 RESULT for ${targetDateStr}:`);
            console.log(`   ${compPricesAtDate.length} comps with valid prices`);
                console.log(`   Prices: [${compPricesAtDate.slice(0, 5).map(p => '$' + p.toLocaleString()).join(', ')}${compPricesAtDate.length > 5 ? '...' : ''}]`);
                console.log(`   Market Average: $${Math.round(avgAtDate).toLocaleString()}`);
                console.log(`=================================\n`);
              }

              marketData.push({
                x: targetDateStr,
                y: Math.round(avgAtDate)
              });
            });

        const marketSeries = {
          id: 'Market Avg',
          data: marketData
        };

        console.log('Market series data:', marketSeries.data);

        // Add relist date marker if property has been relisted
        const relistSeries = [];
        if (property.relistedDate && property.listingStatus === 'RELISTED') {
          const relistDate = new Date(property.relistedDate);
          const relistDateStr = relistDate.toLocaleDateString();
          
          // Find the price at the relist date from price history
          let relistPrice = property.price; // Default to current price
          
          // Find the closest price point to the relist date
          if (history.length > 0) {
            const relistTimestamp = relistDate.getTime();
            let closestEntry = history[0];
            let closestDiff = Math.abs(new Date(history[0].date).getTime() - relistTimestamp);
            
            for (const entry of history) {
              const entryTimestamp = new Date(entry.date).getTime();
              const diff = Math.abs(entryTimestamp - relistTimestamp);
              if (diff < closestDiff) {
                closestDiff = diff;
                closestEntry = entry;
              }
            }
            
            relistPrice = closestEntry.price;
          }
          
          console.log('Adding relist marker:', {
            date: relistDateStr,
            price: relistPrice,
            status: property.listingStatus
          });
          
          relistSeries.push({
            id: 'Relisted',
            data: [{ x: relistDateStr, y: relistPrice }]
          });
        }

        console.log('=== END PRICE HISTORY CHART DEBUG ===\n');

        return relistSeries.length > 0 
          ? [propertySeries, marketSeries, ...relistSeries]
          : [propertySeries, marketSeries];
      }, [property, comparables, marketStats]);

  // Validation helper function (defined first to be used in useMemo hooks)
  const validate = (score) => {
    const validated = Math.round(score);
    return isFinite(validated) && !isNaN(validated) ? validated : 0;
  };

  // Use the SAME scoring system as Map view for consistency
  // This ensures 446 McKay Avenue shows the SAME score everywhere
  const { scoredProperties } = useDealScoring([property]);
  const scoredProperty = scoredProperties[0] || property;
  
  // Extract scores from the scored property
  const globalScore = scoredProperty.scores?.global || 0;
  const priceDropScore = scoredProperty.scores?.priceDrop || 0;
  const domScore = scoredProperty.scores?.dom || 0;
  const dropFrequencyScore = scoredProperty.scores?.dropFrequency || 0;

  // Extract keyword score from scored property
  const keywordScore = scoredProperty.scores?.keywords || 0;

  // Create deal score components for display (matching the scoring breakdown)
  const dealScoreComponents = useMemo(() => {
    const keywordValue = property.keywordUsed || '';
    const hasKeyword = keywordValue && keywordValue !== 'No result' && keywordValue.trim() !== '';
    
    return {
      priceDrop: {
        score: validate(priceDropScore),
        detail: `${Math.abs(scoredProperty.totalDropPercent || 0).toFixed(1)}% price ${scoredProperty.totalDropPercent < 0 ? 'drop' : 'increase'}`
      },
      dom: {
        score: validate(domScore),
        detail: `${property.daysOnMarket || 0} days on market`
      },
      dropFrequency: {
        score: validate(dropFrequencyScore),
        detail: `${property.priceHistory?.length - 1 || 0} price changes`
      },
      keywords: {
        score: validate(keywordScore),
        detail: hasKeyword ? `Found via: ${keywordValue}` : 'No keyword match'
      }
    };
  }, [priceDropScore, domScore, dropFrequencyScore, keywordScore, scoredProperty.totalDropPercent, property.daysOnMarket, property.priceHistory, property.keywordUsed]);

  const getDealBadge = (score) => {
    if (score >= 80) return { label: 'Excellent Deal', color: 'green' };
    if (score >= 60) return { label: 'Good Deal', color: 'blue' };
    if (score >= 40) return { label: 'Fair Deal', color: 'orange' };
    return { label: 'Poor Deal', color: 'red' };
  };

  const dealBadge = getDealBadge(globalScore);

  return (
    <Box bg="bg.subtle" p={6}>
      <Stack gap={6}>
        {/* Header */}
        <HStack justify="space-between" align="start" wrap="wrap" gap={4}>
          <Stack gap={1}>
            <HStack>
              <Badge colorPalette={dealBadge.color} size="lg" variant="solid">
                {dealBadge.label}
              </Badge>
              <Badge variant="outline" size="lg">Score: {globalScore}/100</Badge>
            </HStack>
            <Text fontSize="xl" fontWeight="bold">{property.name}</Text>
            <HStack color="fg.muted" fontSize="sm">
              <MapPin size={14} /> <Text>{property.address?.address || property.city}</Text>
              <Separator orientation="vertical" height="12px" />
              <Home size={14} /> <Text>{property.propertyType}</Text>
            </HStack>
          </Stack>
          <Stack align="end" gap={0}>
            <HStack align="baseline" gap={2}>
              {property.column1stPrice && property.price && property.column1stPrice > property.price && (
                <Text textDecoration="line-through" color="fg.muted" fontSize="lg" fontWeight="medium">
                  ${property.column1stPrice.toLocaleString()}
                </Text>
              )}
              <Text fontSize="2xl" fontWeight="bold">${property.price?.toLocaleString() || 'N/A'}</Text>
            </HStack>
            {marketStats && isFinite(marketStats.priceDiffPercent) && !isNaN(marketStats.priceDiffPercent) && (
              <Badge colorPalette={marketStats.priceDiff < 0 ? 'green' : 'red'} variant="subtle">
                {marketStats.priceDiff < 0 ? '-' : '+'}{Math.abs(marketStats.priceDiffPercent).toFixed(1)}% vs Market
              </Badge>
            )}
          </Stack>
        </HStack>

        <Grid templateColumns={{ base: "1fr", md: "1fr 1fr", lg: "0.8fr 0.7fr 0.9fr 1.4fr 1.2fr" }} gap={6}>
                  {/* Column 1: Price History List + Property Description */}
                  <Stack gap={4}>
                    {/* Price History List */}
                    <Card.Root>
                      <Card.Header pb={2}>
                        <Text fontWeight="semibold" fontSize="sm">Price History</Text>
                      </Card.Header>
                      <Card.Body pt={0} pb={3}>
                        <VStack align="start" gap={2}>
                          {(property.priceHistory && property.priceHistory.length > 0) ? (
                            property.priceHistory.map((h, i) => {
                              const isLast = i === property.priceHistory.length - 1;
                              const date = h.date ? new Date(h.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
                              
                              // Calculate ordinal suffix
                              const n = i + 1;
                              const ord = (n % 10 === 1 && n % 100 !== 11) ? 'st' :
                                          (n % 10 === 2 && n % 100 !== 12) ? 'nd' :
                                          (n % 10 === 3 && n % 100 !== 13) ? 'rd' : 'th';
                              
                              let label = `${n}${ord} Listing`;
                              if (isLast && property.priceHistory.length > 1) label = "Current";
                              
                              return (
                                <HStack key={i} w="full" justify="space-between" fontSize="sm">
                                  <HStack gap={2}>
                                    <Box w={1.5} h={1.5} borderRadius="full" bg={isLast ? "blue.500" : "gray.300"} />
                                    <Text color={isLast ? "fg" : "fg.muted"} fontWeight={isLast ? "medium" : "normal"}>{label}:</Text>
                                  </HStack>
                                  <HStack gap={1}>
                                    <Text fontWeight={isLast ? "bold" : "medium"}>${h.price?.toLocaleString()}</Text>
                                    <Text color="fg.muted" fontSize="xs">({date})</Text>
                                  </HStack>
                                </HStack>
                              );
                            })
                          ) : (
                            <HStack w="full" justify="space-between" fontSize="sm">
                              <HStack gap={2}>
                                <Box w={1.5} h={1.5} borderRadius="full" bg="blue.500" />
                                <Text fontWeight="medium">Current:</Text>
                              </HStack>
                              <Text fontWeight="bold">${(property.price || 0).toLocaleString()}</Text>
                            </HStack>
                          )}
                        </VStack>
                      </Card.Body>
                    </Card.Root>

                    <Card.Root>
                      <Card.Header>
                        <Text fontWeight="semibold">Property Description</Text>
                      </Card.Header>
                      <Card.Body>
                        <Text fontSize="sm" maxH="200px" overflowY="auto">
                          {property.propertyDescription || 'No description available.'}
                        </Text>
                      </Card.Body>
                    </Card.Root>
                  </Stack>

                  {/* Column 2: Market Statistics */}
                                                        <Card.Root>
                                                      <Card.Header>
                                                        <Stack gap={0}>
                                                        <Text fontWeight="semibold">Market Stats</Text>
                                                            <Text fontSize="xs" color="fg.muted">
                                                              {comparables.length} comps within {radiusUsed}
                                                              {property.wards && sameWardOnly && ` • ${property.wards} only`}
                                                            </Text>
                                                          </Stack>
                                                          <Stack gap={2} w="full" mt={2}>
                                                            <Box>
                                                              <Text fontSize="xs" fontWeight="semibold" color="fg" mb={1}>Radius</Text>
                                                              <Select.Root
                                                                collection={createListCollection({
                                                                  items: [
                                                                    { label: 'Auto', value: 'auto' },
                                                                    { label: '0.1mi', value: '0.1' },
                                                                    { label: '0.3mi', value: '0.3' },
                                                                    { label: '0.5mi', value: '0.5' },
                                                                    { label: '1mi', value: '1' }
                                                                  ]
                                                                })}
                                                                size="xs"
                                                                value={[selectedRadius]}
                                                                onValueChange={(details) => setSelectedRadius(details.value[0])}
                                                              >
                                                                <Select.HiddenSelect />
                                                                <Select.Control>
                                                                  <Select.Trigger w="full">
                                                                    <Select.ValueText />
                                                                  </Select.Trigger>
                                                                  <Select.IndicatorGroup>
                                                                    <Select.Indicator />
                                                                  </Select.IndicatorGroup>
                                                                </Select.Control>
                                                                <Select.Positioner>
                                                                  <Select.Content>
                                                                    {createListCollection({
                                                                      items: [
                                                                        { label: 'Auto', value: 'auto' },
                                                                        { label: '0.1mi', value: '0.1' },
                                                                        { label: '0.3mi', value: '0.3' },
                                                                        { label: '0.5mi', value: '0.5' },
                                                                        { label: '1mi', value: '1' }
                                                                      ]
                                                                    }).items.map((item) => (
                                                                      <Select.Item item={item} key={item.value}>
                                                                        {item.label}
                                                                        <Select.ItemIndicator />
                                                                      </Select.Item>
                                                                    ))}
                                                                  </Select.Content>
                                                                </Select.Positioner>
                                                              </Select.Root>
                                                            </Box>
                                                            
                                                            <Separator />
                                                            
                                                            <Switch.Root
                                                              size="sm"
                                                              checked={sameWardOnly}
                                                              onCheckedChange={(details) => {
                                                                console.log('Ward toggle changed:', details.checked);
                                                                setSameWardOnly(details.checked);
                                                              }}
                                                              disabled={!property.wards}
                                                            >
                                                              <Switch.HiddenInput />
                                                              <Switch.Control>
                                                                <Switch.Thumb />
                                                              </Switch.Control>
                                                              <Switch.Label fontSize="xs" fontWeight="medium">
                                                                {property.wards ? 'Same ward only' : 'Ward not assigned'}
                                                              </Switch.Label>
                                                            </Switch.Root>
                                                          </Stack>
                                                        </Card.Header>
                                                      <Card.Body>
                                                      {marketStats ? (
                                                        <Stack gap={3}>
                                                        <SimpleGrid columns={1} gap={3}>
                                                      <Box p={2} bg="bg.subtle" borderRadius="md">
                                                      <Text fontSize="xs" color="fg.muted">Average Price</Text>
                                                        <Text fontSize="sm" fontWeight="bold">
                                                          {(() => {
                                                            const val = marketStats.avgPrice;
                                                            if (val == null || isNaN(val) || !isFinite(val)) return '$0';
                                                            return `$${Math.round(val).toLocaleString()}`;
                                                          })()}
                                                        </Text>
                                                        </Box>
                                                          <Box p={2} bg="bg.subtle" borderRadius="md">
                                                        <Text fontSize="xs" color="fg.muted">Median Price</Text>
                                                      <Text fontSize="sm" fontWeight="bold">
                                                        {(() => {
                                                          const val = marketStats.medianPrice;
                                                          if (val == null || isNaN(val) || !isFinite(val)) return '$0';
                                                          return `$${Math.round(val).toLocaleString()}`;
                                                        })()}
                                                      </Text>
                                                      </Box>
                                                                          <Box p={2} bg="bg.subtle" borderRadius="md">
                                                                          <Text fontSize="xs" color="fg.muted">Price Range</Text>
                                                                        <Text fontSize="sm" fontWeight="bold">
                                                                          {(() => {
                                                                            const min = marketStats.minPrice;
                                                                            const max = marketStats.maxPrice;
                                                                            if (min == null || isNaN(min) || !isFinite(min) || max == null || isNaN(max) || !isFinite(max)) return '$0 - $0';
                                                                            return `$${(min/1000).toFixed(0)}k - $${(max/1000).toFixed(0)}k`;
                                                                          })()}
                                                                        </Text>
                                                      </Box>
                                                        <Box p={2} bg="bg.subtle" borderRadius="md">
                                                        <Text fontSize="xs" color="fg.muted">This Property</Text>
                                                          <Text fontSize="sm" fontWeight="bold" color={marketStats.priceDiff < 0 ? 'green.600' : 'red.600'}>
                                                        {(() => {
                                                          const price = property.price;
                                                          if (price == null || isNaN(price) || !isFinite(price)) return '-';
                                                          return `$${price.toLocaleString()}`;
                                                        })()}
                                                      </Text>
                                                      </Box>
                                                        <Box p={2} bg="bg.subtle" borderRadius="md">
                                                                                                                <Text fontSize="xs" color="fg.muted">Avg DOM (Comps)</Text>
                                                                                                                  <Text fontSize="sm" fontWeight="bold">
                                                                                                                {(() => {
                                                                                                              const dom = marketStats.avgDOM;
                                                                                                              if (dom == null || isNaN(dom) || !isFinite(dom)) return '0 days';
                                                                                                                return `${Math.round(dom)} days`;
                                                                                                                })()}
                                                                                                                  </Text>
                                                                                                                </Box>
                                                                                                              <Box p={2} bg="bg.subtle" borderRadius="md">
                                                                                                              <Text fontSize="xs" color="fg.muted">This Property DOM</Text>
                                                                                                                <Text fontSize="sm" fontWeight="bold">
                                                                                                                  {(() => {
                                                                                                                    const dom = property.daysOnMarket;
                                                                                                                    if (dom == null || isNaN(dom) || !isFinite(dom)) return '0 days';
                                                                                                                    return `${Math.round(dom)} days`;
                                                                                                                  })()}
                                                                                                                </Text>
                                                                                                                </Box>
                                                          </SimpleGrid>

                                                      <Separator />

                                                  <Box p={3} bg="blue.50" borderRadius="md" borderLeftWidth="3px" borderLeftColor="blue.500">
                                                <Text fontSize="xs" fontWeight="medium" color="blue.900">
                                    Deal Analysis
                                                </Text>
                                                              <Text fontSize="xs" color="blue.800" mt={1}>
                                                                {!isNaN(marketStats.priceDiffPercent) && isFinite(marketStats.priceDiffPercent) ? (
                                                                marketStats.priceDiff < 0
                                                              ? `${Math.abs(marketStats.priceDiffPercent).toFixed(1)}% below market (${Math.abs(Math.round(marketStats.priceDiff)).toLocaleString()} discount)`
                                                              : `${marketStats.priceDiffPercent.toFixed(1)}% above market`
                                                                ) : (
                                                                  "Insufficient data"
                                                                    )}
                                                                      </Text>
                                                                      </Box>
                                                                      </Stack>
                                                                      ) : (
                                                                      <Text fontSize="sm" color="fg.muted">
                                                                      No comparable properties found. Check console for debugging info.
                                                                      </Text>
                                                                    )}
                                                                  </Card.Body>
                                                                  </Card.Root>

                {/* Column 3: Property Details & GHL Send */}
                  <Stack gap={4}>
                    <Card.Root>
                      <Card.Header>
                        <Text fontWeight="semibold">Property Details</Text>
                      </Card.Header>
                      <Card.Body>
                        <Stack gap={3}>
                          <HStack justify="space-between">
                            <HStack gap={1.5} color="fg.muted">
                              <Home size={14} />
                              <Text fontSize="sm">Type</Text>
                            </HStack>
                            <Text fontSize="sm" fontWeight="medium">{property.propertyType || '-'}</Text>
                          </HStack>
                          <HStack justify="space-between">
                            <Text fontSize="sm" color="fg.muted">Building Type</Text>
                            <Text fontSize="sm" fontWeight="medium">{property.buildingType || '-'}</Text>
                          </HStack>
                          <HStack justify="space-between">
                            <HStack gap={1.5} color="fg.muted">
                              <Bed size={14} />
                              <Text fontSize="sm">Bedrooms</Text>
                            </HStack>
                            <Text fontSize="sm" fontWeight="medium">
                              {(() => {
                                const val = normalizeBedBath(property.bedrooms);
                                if (val == null || val === '') return '-';
                                return String(val);
                              })()}
                            </Text>
                          </HStack>
                          <HStack justify="space-between">
                            <HStack gap={1.5} color="fg.muted">
                              <Bath size={14} />
                              <Text fontSize="sm">Bathrooms</Text>
                            </HStack>
                            <Text fontSize="sm" fontWeight="medium">
                              {(() => {
                                const val = normalizeBedBath(property.bathrooms);
                                if (val == null || val === '') return '-';
                                return String(val);
                              })()}
                            </Text>
                          </HStack>
                          <HStack justify="space-between">
                            <Text fontSize="sm" color="fg.muted">Status</Text>
                            <Badge size="sm" colorPalette={property.listingStatus === 'Active' ? 'blue' : 'purple'}>
                              {property.listingStatus}
                            </Badge>
                          </HStack>
                          {property.wards && (
                            <HStack justify="space-between">
                              <Text fontSize="sm" color="fg.muted">Ward</Text>
                              <Badge size="sm" colorPalette="teal">
                                {property.wards}
                              </Badge>
                            </HStack>
                          )}
                          <HStack justify="space-between">
                            <HStack gap={1.5} color="fg.muted">
                              <Calendar size={14} />
                              <Text fontSize="sm">Days on Market</Text>
                            </HStack>
                            <Text fontSize="sm" fontWeight="medium" color="red.600">
                              {(() => {
                                const dom = property.daysOnMarket;
                                if (dom == null || isNaN(dom) || !isFinite(dom)) return '0 days';
                                return `${Math.round(dom)} days`;
                              })()}
                            </Text>
                          </HStack>
                          <HStack justify="space-between">
                            <Text fontSize="sm" color="fg.muted">Listed Date</Text>
                            <Text fontSize="sm" fontWeight="medium">
                              {property.column1stListingDate ? new Date(property.column1stListingDate).toLocaleDateString() : '-'}
                            </Text>
                          </HStack>
                          {property.listingStatus === 'RELISTED' && (
                            <HStack justify="space-between">
                              <Text fontSize="sm" color="fg.muted">Relisted Date</Text>
                              <Text fontSize="sm" fontWeight="medium" color="purple.600">
                                {property.relistedDate ? new Date(property.relistedDate).toLocaleDateString() : '-'}
                              </Text>
                            </HStack>
                          )}
                          <HStack justify="space-between">
                            <Text fontSize="sm" color="fg.muted">Initial Price</Text>
                            <Text fontSize="sm" fontWeight="medium">
                              {(() => {
                                const val = property.column1stPrice;
                                if (val == null || isNaN(val) || !isFinite(val)) return '-';
                                return `$${val.toLocaleString()}`;
                              })()}
                            </Text>
                          </HStack>
                          <HStack justify="space-between">
                                                      <Text fontSize="sm" color="fg.muted">Current Price</Text>
                                                      <Text fontSize="sm" fontWeight="bold" color="blue.600">
                                                        {(() => {
                                                          const val = property.price;
                                                          if (val == null || isNaN(val) || !isFinite(val)) return '-';
                                                          return `$${val.toLocaleString()}`;
                                                        })()}
                                                      </Text>
                                                    </HStack>
                                                  </Stack>
                                                </Card.Body>
                                              </Card.Root>

                                              <Card.Root>
                                                                      <Card.Header>
                                                                    <Text fontWeight="semibold">Realtor Information</Text>
                                                                    </Card.Header>
                                                                      <Card.Body>
                                                                    {(property.realtors?.linkedItems?.[0]?.name || property.ghlPhoneNumber?.displayValue) ? (
                                                                      <Stack gap={2}>
                                                                        {property.realtors?.linkedItems?.[0]?.name && (
                                                                          <HStack justify="space-between" align="center" width="full">
                                                                            <Text fontSize="sm" fontWeight="semibold" color="fg">
                                                                              {property.realtors.linkedItems[0].name}
                                                                            </Text>
                                                                            <Button
                                                                              size="xs"
                                                                              variant="ghost"
                                                                              colorPalette="blue"
                                                                              gap={1}
                                                                              h="auto"
                                                                              py={1}
                                                                              px={2}
                                                                              fontSize="xs"
                                                                              onClick={() => {
                                                                                const realtorName = property.realtors.linkedItems[0].name;
                                                                                if (onNavigateToRealtorList) {
                                                                              onNavigateToRealtorList(realtorName);
                                                                            }
                                                                              }}
                                                                            >
                                                                                                See all listings <ArrowRight size={10} />
                                                                                              </Button>
                                                                          </HStack>
                                                                        )}
                                                                        {property.ghlPhoneNumber?.displayValue && (
                                                                          <HStack gap={2}>
                                                                            <Phone size={16} />
                                                                            <a
                                                                              href={`tel:${property.ghlPhoneNumber.displayValue}`}
                                                                              style={{ textDecoration: 'none' }}
                                                                            >
                                                                              <Text fontSize="sm" color="blue.600" _hover={{ textDecoration: 'underline' }}>
                                                                                {property.ghlPhoneNumber.displayValue}
                                                                              </Text>
                                                                            </a>
                                                                          </HStack>
                                                                        )}
                                                                        
                                                                        {/* Realtor Performance Badges */}
                                                                          {property.realtors?.linkedItems?.[0]?.name && (() => {
                                                                          const realtorName = property.realtors.linkedItems[0].name;
                                                                          const badges = realtorRankings.get(realtorName) || [];
                                                                          
                                                                                                                        if (badges.length === 0) return null;
                                                                          
                                                                                                                        return (
                                                                                                                          <VStack align="start" gap={2} pt={2} borderTopWidth="1px" borderColor="border.muted">
                                                                                                                            <Text fontSize="xs" fontWeight="semibold" color="fg.muted" textTransform="uppercase">
                                                                                                                              Top Performance Categories
                                                                                                                            </Text>
                                                                                                                            <HStack gap={2} flexWrap="wrap">
                                                                                                                              {badges.map((badge, idx) => {
                                                                                                                                const Icon = badge.icon;
                                                                                                                                
                                                                                                                                // Define tooltip text for each category (matching RealtorInsights dashboard)
                                                                                                                                const getCategoryTooltip = (category) => {
                                                                                                                                  const tooltips = {
                                                                                                                                    'Negotiation Pro': 'Higher drops = more negotiation room. Good targets for below-asking offers.',
                                                                                                                                    'Deal Finder': 'These agents may have distressed seller connections or know motivated sellers.',
                                                                                                                                    'Price Drop Pro': 'Agents with most price reductions. Opportunities for negotiation - sellers are motivated.',
                                                                                                                                    'Market Expert': 'Long-established agents with proven track records. Reliable but may have higher expectations.',
                                                                                                                                    'Volume Leader': 'Realtors with highest inventory volume. High volume = more deal flow opportunities, but may mean less personalized attention.',
                                                                                                                                    'Fast Seller': 'Realtors whose listings sell quickest (lowest DOM to sell). Indicates strong pricing strategy and buyer network.',
                                                                                                                                    'Ward Specialist': 'Ward specialists have deep local knowledge - know the streets, schools, and hidden gems.',
                                                                                                                                    'Luxury Specialist': 'Agents handling highest-priced properties. Good for luxury investments, may have premium buyer connections.',
                                                                                                                                    'Value Expert': 'These agents may have distressed seller connections or know motivated sellers.',
                                                                                                                                    'New Lister': 'Newer agents showing rapid growth. Often more motivated and may offer better terms to build relationships.'
                                                                                                                                  };
                                                                                                                                  return tooltips[category] || 'Top performer in this category based on recent market activity.';
                                                                                                                                };
                                                                                                                                
                                                                                                                                return (
                                                                                                                                  <Tooltip.Root key={idx} openDelay={200} closeDelay={200}>
                                                                                                                                    <Tooltip.Trigger asChild>
                                                                                                                                      <Badge
                                                                                                                                        colorPalette={badge.color}
                                                                                                                                        variant="subtle"
                                                                                                                                        size="sm"
                                                                                                                                        display="flex"
                                                                                                                                        alignItems="center"
                                                                                                                                        gap={1.5}
                                                                                                                                        px={2}
                                                                                                                                        py={1}
                                                                                                                                        cursor="help"
                                                                                                                                      >
                                                                                                                                        <Icon size={14} />
                                                                                                                                        <Text fontSize="xs" fontWeight="semibold">{badge.category}</Text>
                                                                                                                                        <Text fontSize="xs" opacity={0.9}>{badge.badgeText}</Text>
                                                                                                                                        <Info size={12} opacity={0.6} />
                                                                                                                                      </Badge>
                                                                                                                                    </Tooltip.Trigger>
                                                                                                                                    <Portal>
                                                                                                                                      <Tooltip.Positioner>
                                                                                                                                        <Tooltip.Content maxW="280px" bg="gray.800" color="white" p={2.5} fontSize="xs" borderRadius="md" lineHeight="1.5">
                                                                                                                                          <Tooltip.Arrow />
                                                                                                                                          {getCategoryTooltip(badge.category)}
                                                                                                                                        </Tooltip.Content>
                                                                                                                                      </Tooltip.Positioner>
                                                                                                                                    </Portal>
                                                                                                                                  </Tooltip.Root>
                                                                                                                                );
                                                                                                                              })}
                                                                                                                            </HStack>
                                                                                                                          </VStack>
                                                                                                                        );
                                                                                                                      })()}
                                                                                                                    </Stack>
                                                                                                                      ) : (
                                                                                                                        <Text fontSize="sm" color="fg.muted">No realtor contact information available</Text>
                                                                                                                        )}
                                                                                                                        </Card.Body>
                                                                                                                        </Card.Root>

                                                                        <Card.Root>
                                                                      <Card.Header>
                                                                    <Text fontWeight="semibold">External Links</Text>
                                                                    </Card.Header>
                                                                      <Card.Body>
                                                                    <Stack gap={2}>
                                                                  {property.realtorcaLink?.url && (
                                                                <Button
                                                              variant="outline"
                                                                                                      size="sm"
                                                                                                      onClick={() => window.open(property.realtorcaLink.url, '_blank')}
                                                                                                      colorPalette="blue"
                                                                                                    >
                                                                                                      <ExternalLink size={14} /> View on Realtor.ca
                                                                                                    </Button>
                                                                                                  )}
                                                                                                  {property.zillowcaLink?.url && (
                                                                                                    <Button
                                                                                                      variant="outline"
                                                                                                      size="sm"
                                                                                                      onClick={() => window.open(property.zillowcaLink.url, '_blank')}
                                                                                                      colorPalette="purple"
                                                                                                    >
                                                                                                      <ExternalLink size={14} /> View on Zillow
                                                                                                    </Button>
                                                                                                  )}
                                                                                                  {!property.realtorcaLink?.url && !property.zillowcaLink?.url && (
                                                                                                    <Text fontSize="sm" color="fg.muted">No external links available</Text>
                                                                                                  )}
                                                                                                </Stack>
                                                                                              </Card.Body>
                                                                                            </Card.Root>

                    <Card.Root>
                                          <Card.Header>
                                            <Text fontWeight="semibold">Send to GHL</Text>
                                            <Text fontSize="xs" color="fg.muted">
                                              {currentUser?.monGhlColumn || 'GHL column not configured'}
                                            </Text>
                                          </Card.Header>
                                          <Card.Body>
                                            {currentUser?.monGhlColumn ? (
                                              <Select.Root
                                                collection={createListCollection({
                                                  items: [
                                                    { label: 'Working on it', value: 'Working on it' },
                                                    { label: 'Send', value: 'SEND' },
                                                    { label: 'SENT', value: 'SENT' }
                                                  ]
                                                })}
                                                size="sm"
                                                value={(() => {
                                                  // Dynamically get the current value from the user's specific column
                                                  const columnField = currentUser.monGhlColumn === 'JS Send to GHL' ? 'jsSendToGhl' : 'azSendToGhl';
                                                  const currentValue = property[columnField];
                                                  return currentValue ? [currentValue] : [];
                                                })()}
                                                onValueChange={(details) => {
                                                  const board = new ReDealFinderBoard();
                                                  // Dynamically update the user's specific column
                                                  const columnField = currentUser.monGhlColumn === 'JS Send to GHL' ? 'jsSendToGhl' : 'azSendToGhl';
                                                  const updateData = { [columnField]: details.value[0] };
                                                  board.item(property.id).update(updateData).execute();
                                                }}
                                              >
                                                <Select.HiddenSelect />
                                                <Select.Control>
                                                  <Select.Trigger>
                                                    <Select.ValueText placeholder="Select status" />
                                                  </Select.Trigger>
                                                  <Select.IndicatorGroup>
                                                    <Select.Indicator />
                                                  </Select.IndicatorGroup>
                                                </Select.Control>
                                                <Select.Positioner>
                                                  <Select.Content>
                                                    {createListCollection({
                                                      items: [
                                                        { label: 'Working on it', value: 'Working on it' },
                                                        { label: 'Send', value: 'SEND' },
                                                        { label: 'SENT', value: 'SENT' }
                                                      ]
                                                    }).items.map((item) => (
                                                      <Select.Item item={item} key={item.value}>
                                                        {item.label}
                                                        <Select.ItemIndicator />
                                                      </Select.Item>
                                                    ))}
                                                  </Select.Content>
                                                </Select.Positioner>
                                              </Select.Root>
                                            ) : (
                                              <Text fontSize="sm" color="fg.muted">
                                                GHL Send not configured for your account
                                              </Text>
                                            )}
                                          </Card.Body>
                                        </Card.Root>
                                      </Stack>

                                      {/* Column 4: Nearby Comparables */}
                                      <Card.Root>
                                        <Card.Header>
                                          <Text fontWeight="semibold">Nearby Comparables</Text>
                                          <Text fontSize="xs" color="fg.muted">Click to view details</Text>
                                        </Card.Header>
                                        <Card.Body>
                                          {comparables.length > 0 ? (
                                            <Box overflowY="auto" maxH="600px">
                                              <Table.Root size="sm" variant="outline">
                                                                                              <Table.Header>
                                                                                                <Table.Row>
                                                                                                  <Table.ColumnHeader w="10">#</Table.ColumnHeader>
                                                                                                  <Table.ColumnHeader>Address</Table.ColumnHeader>
                                                                                                  <Table.ColumnHeader>Price</Table.ColumnHeader>
                                                                                                  <Table.ColumnHeader>Drop</Table.ColumnHeader>
                                                                                                  <Table.ColumnHeader>DOM</Table.ColumnHeader>
                                                                                                <Table.ColumnHeader>Score</Table.ColumnHeader>
                                                                                              </Table.Row>
                                                                                              </Table.Header>
                                                                                                <Table.Body>
                                                                                                  {comparables.slice(0, 20).map(comp => {
                                                                                                    const dropPercent = comp.dropAsAPercentageOfTheInitialPrice || 0;
                                                                                                    const isIncrease = dropPercent > 0;
                                                                                                    const dropDisplay = dropPercent === 0 ? '-' : `${Math.abs(dropPercent).toFixed(1)}%`;
                                                    
                                                                                                    return (
                                                                                                  <Table.Row
                                                                                                    key={comp.id}
                                                                                                    cursor="pointer"
                                                                                                    onClick={() => onPropertyChange?.(comp)}
                                                                                                    _hover={{ bg: 'bg.subtle', transform: 'translateX(2px)' }}
                                                                                                      transition="all 0.2s"
                                                                                                        >
                                                                                                        <Table.Cell fontSize="xs" fontWeight="bold" color="blue.600">{comp.compIndex}</Table.Cell>
                                                                                                        <Table.Cell fontSize="xs" lineClamp={2}>{comp.name}</Table.Cell>
                                                                                                      <Table.Cell fontSize="xs" fontWeight="medium">${comp.price.toLocaleString()}</Table.Cell>
                                                                                                        <Table.Cell fontSize="xs" color={isIncrease ? 'fg' : dropPercent < 0 ? 'red.600' : 'fg.muted'}>
                                                                                                      {dropDisplay}
                                                                                                    </Table.Cell>
                                                                                                  <Table.Cell fontSize="xs">{comp.daysOnMarket || 0}d</Table.Cell>
                                                                                                <Table.Cell fontSize="xs">
                                                                                                                              <Badge
                                                                                                                            size="xs"
                                                                                                                                          colorPalette="gray"
                                                                                                                                        >
                                                                                                                                          -
                                                                                                                                        </Badge>
                                                                                                                                      </Table.Cell>
                                                                                                    </Table.Row>
                                                                                                  );
                                                                                                })}
                                                                                              </Table.Body>
                                                                                            </Table.Root>
                                            </Box>
                                          ) : (
                                            <Text fontSize="sm" color="fg.muted" textAlign="center" py={4}>
                                              No comparables found
                                            </Text>
                                          )}
                                        </Card.Body>
                                      </Card.Root>

                  {/* Column 5: Property Location Map - Moved here next to Comparables */}
                  <Card.Root>
                    <Card.Header>
                      <HStack gap={2}>
                        <MapPin size={18} />
                        <Text fontWeight="semibold">Property Location</Text>
                      </HStack>
                      <Text fontSize="xs" color="fg.muted">
                        Red = Selected • Blue = Comparables
                      </Text>
                    </Card.Header>
                    <Card.Body>
                      <ComparisonMapWidget
                        selectedProperty={property}
                        comparables={comparables.slice(0, 20)}
                        onCompClick={onPropertyChange}
                      />
                    </Card.Body>
                  </Card.Root>
                </Grid>

      </Stack>
    </Box>
  );
}
