import React, { useState, useMemo } from 'react';
import { Box, Flex, VStack, HStack, Stack, Text, Input, Button, Card, Badge, Grid, Switch, Tooltip, Portal, SimpleGrid, IconButton, Spinner } from '@chakra-ui/react';
import { ArrowLeft, ArrowUp, ArrowDown, Info, Save, Check, X, Search, CheckCircle, Sparkles, DollarSign, Home, TrendingUp, TableIcon, BarChart3 } from 'lucide-react';
import { useDealScoring } from '../hooks/useDealScoring';
import { saveAnalysisToSupabase, fetchAnalysisFromSupabase } from '../utils/supabaseClient';
import KPICard from '@components/KPICard';
import ChartCard from '@components/ChartCard';
import { Bar, Pie } from '@charts';

export default function AnalyserView({ properties = [], allProperties = [], currentUser }) {
  const { scoredProperties } = useDealScoring(properties);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'scores.global', direction: 'desc' });
  
  // Property inputs
  const [address, setAddress] = useState('');
  const [size, setSize] = useState(0);
  const [lot, setLot] = useState(0);
  const [beds, setBeds] = useState(0);
  const [baths, setBaths] = useState(0);
  const [pool, setPool] = useState(false);
  
  // Financial inputs
  const [purchasePrice, setPurchasePrice] = useState(0);
  const [arv, setArv] = useState(0);
  const [fmv, setFmv] = useState(0);
  const [wholesalePrice, setWholesalePrice] = useState(0);
  const [propTax, setPropTax] = useState(0);
  const [insurance, setInsurance] = useState(0);
  const [utilities, setUtilities] = useState(0);
  const [airdna, setAirdna] = useState(0);
  const [rentcast, setRentcast] = useState(0);
  const [flipLTV, setFlipLTV] = useState(0.9);
  const [flipRate, setFlipRate] = useState(0.12);
  const [refiLTV, setRefiLTV] = useState(0.75);
  const [refiRate, setRefiRate] = useState(0.055);
  const [refiAmt, setRefiAmt] = useState(0);
  const [hoa, setHoa] = useState(0);
  const [isWholetail, setIsWholetail] = useState(false);
  
  // Rehab line items
  const [kitchen, setKitchen] = useState(0);
  const [appliances, setAppliances] = useState(0);
  const [masterBath, setMasterBath] = useState(0);
  const [bathsRehab, setBathsRehab] = useState(0);
  const [paintInt, setPaintInt] = useState(0);
  const [paintExt, setPaintExt] = useState(0);
  const [drywall, setDrywall] = useState(0);
  const [flooring, setFlooring] = useState(0);
  const [hardware, setHardware] = useState(0);
  const [electrical, setElectrical] = useState(0);
  const [plumbing, setPlumbing] = useState(0);
  const [hvac, setHvac] = useState(0);
  const [roof, setRoof] = useState(0);
  const [windows, setWindows] = useState(0);
  const [yard, setYard] = useState(0);
  const [poolRehab, setPoolRehab] = useState(0);
  const [contingency, setContingency] = useState(0);
  
  // Comps
  const [arvComps, setArvComps] = useState([]);
  const [fmvComps, setFmvComps] = useState([]);
  
  // Save status
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved' | 'error'
  
  // AI Analysis (webhook-based)
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [viewMode, setViewMode] = useState('table');
  
  const totalRehab = kitchen + appliances + masterBath + bathsRehab + paintInt + paintExt + drywall + flooring + hardware + electrical + plumbing + hvac + roof + windows + yard + poolRehab + contingency;
  const rehabPerSqft = size > 0 ? totalRehab / size : 0;

  const [arvSearchQuery, setArvSearchQuery] = useState(''); // Initialize as empty string
  const [fmvSearchQuery, setFmvSearchQuery] = useState(''); // Initialize as empty string
  const [propertiesWithAnalysis, setPropertiesWithAnalysis] = useState(new Set());

  const handleSelectARVProperty = async (property) => {
    if (!property) return;
    
    // Check if already added
    if (arvComps.some(c => c.propertyId === property.id)) {
      alert('This property is already in the ARV comps list');
      return;
    }
    
    // Fetch analysis data for this property
    let linkedData = {
      address: property.name || 'Unknown',
      price: property.price || 0,
      sqft: property.size || 0,
      date: property.updatedAt ? new Date(property.updatedAt).toLocaleDateString() : ''
    };
    
    if (currentUser) {
      try {
        const savedAnalysis = await Promise.race([
          fetchAnalysisFromSupabase(currentUser.username, property.id).catch(err => {
            console.error('fetchAnalysisFromSupabase threw error:', err);
            return null;
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Fetch timeout')), 5000)
          )
        ]);
        if (savedAnalysis) {
          linkedData = {
            address: savedAnalysis.address || property.name || 'Unknown',
            price: savedAnalysis.arv || savedAnalysis.fmv || savedAnalysis.purchasePrice || property.price || 0,
            sqft: savedAnalysis.size || property.size || 0,
            date: new Date().toLocaleDateString()
          };
        }
      } catch (error) {
        console.error('Failed to fetch ARV analysis:', error);
        // Continue with default linkedData
      }
    }
    
    setArvComps([...arvComps, {
      id: Date.now(),
      propertyId: property.id,
      linkedData
    }]);
    setArvSearchQuery(''); // Clear search after selection
  };

  const handleSelectFMVProperty = async (property) => {
    if (!property) return;
    
    // Check if already added
    if (fmvComps.some(c => c.propertyId === property.id)) {
      alert('This property is already in the FMV comps list');
      return;
    }
    
    // Fetch analysis data for this property
    let linkedData = {
      address: property.name || 'Unknown',
      price: property.price || 0,
      sqft: property.size || 0,
      date: property.updatedAt ? new Date(property.updatedAt).toLocaleDateString() : ''
    };
    
    if (currentUser) {
      try {
        const savedAnalysis = await Promise.race([
          fetchAnalysisFromSupabase(currentUser.username, property.id).catch(err => {
            console.error('fetchAnalysisFromSupabase threw error:', err);
            return null;
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Fetch timeout')), 5000)
          )
        ]);
        if (savedAnalysis) {
          linkedData = {
            address: savedAnalysis.address || property.name || 'Unknown',
            price: savedAnalysis.fmv || savedAnalysis.arv || savedAnalysis.purchasePrice || property.price || 0,
            sqft: savedAnalysis.size || property.size || 0,
            date: new Date().toLocaleDateString()
          };
        }
      } catch (error) {
        console.error('Failed to fetch FMV analysis:', error);
        // Continue with default linkedData
      }
    }
    
    setFmvComps([...fmvComps, {
      id: Date.now(),
      propertyId: property.id,
      linkedData
    }]);
    setFmvSearchQuery(''); // Clear search after selection
  };

  const handleDeleteARVComp = (id) => {
    setArvComps(arvComps.filter(c => c.id !== id));
  };

  const handleDeleteFMVComp = (id) => {
    setFmvComps(fmvComps.filter(c => c.id !== id));
  };

  const sortedProperties = useMemo(() => {
    if (!sortConfig.key) return scoredProperties;
    return [...scoredProperties].sort((a, b) => {
      let aVal = sortConfig.key.includes('.') ? sortConfig.key.split('.').reduce((obj, key) => obj?.[key], a) : a[sortConfig.key];
      let bVal = sortConfig.key.includes('.') ? sortConfig.key.split('.').reduce((obj, key) => obj?.[key], b) : b[sortConfig.key];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      return sortConfig.direction === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
    });
  }, [scoredProperties, sortConfig]);

  const handleSort = (key) => {
    setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }));
  };

  const SortHeader = ({ columnKey, children }) => (
    <th style={{ cursor: 'pointer', padding: '6px 8px', textAlign: 'left', fontSize: '11px', fontWeight: 'bold', borderBottom: '2px solid #ddd' }} onClick={() => handleSort(columnKey)}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <span>{children}</span>
        {sortConfig.key === columnKey && (sortConfig.direction === 'asc' ? <ArrowUp size={10} /> : <ArrowDown size={10} />)}
      </div>
    </th>
  );

  const fmt = (val) => val ? `$${Math.round(val).toLocaleString()}` : '$0';

  // Filter and sort ARV properties
  const filteredARVProperties = useMemo(() => {
    const filtered = allProperties
      .filter(p => p.id !== selectedProperty?.id)
      .filter(p => {
        if (!arvSearchQuery.trim()) return true;
        const query = arvSearchQuery.toLowerCase();
        return p.name?.toLowerCase().includes(query) || 
               fmt(p.price).toLowerCase().includes(query);
      });
    
    // Sort: properties with saved analysis first, then by name
    return filtered.sort((a, b) => {
      const aHasSaved = propertiesWithAnalysis.has(a.id);
      const bHasSaved = propertiesWithAnalysis.has(b.id);
      if (aHasSaved && !bHasSaved) return -1;
      if (!aHasSaved && bHasSaved) return 1;
      return (a.name || '').localeCompare(b.name || '');
    });
  }, [allProperties, selectedProperty?.id, arvSearchQuery, propertiesWithAnalysis]);

  // Filter and sort FMV properties
  const filteredFMVProperties = useMemo(() => {
    const filtered = allProperties
      .filter(p => p.id !== selectedProperty?.id)
      .filter(p => {
        if (!fmvSearchQuery.trim()) return true;
        const query = fmvSearchQuery.toLowerCase();
        return p.name?.toLowerCase().includes(query) || 
               fmt(p.price).toLowerCase().includes(query);
      });
    
    // Sort: properties with saved analysis first, then by name
    return filtered.sort((a, b) => {
      const aHasSaved = propertiesWithAnalysis.has(a.id);
      const bHasSaved = propertiesWithAnalysis.has(b.id);
      if (aHasSaved && !bHasSaved) return -1;
      if (!aHasSaved && bHasSaved) return 1;
      return (a.name || '').localeCompare(b.name || '');
    });
  }, [allProperties, selectedProperty?.id, fmvSearchQuery, propertiesWithAnalysis]);

  // Load inputs when property selected
  React.useEffect(() => {
    if (selectedProperty) {
      loadAnalysis();
    }
  }, [selectedProperty?.id]);

  // Load properties with saved analysis on mount
  React.useEffect(() => {
    if (currentUser && allProperties.length > 0) {
      loadPropertiesWithAnalysis();
    }
  }, [currentUser, allProperties.length]);

  // Load all properties that have saved analysis data
  const loadPropertiesWithAnalysis = async () => {
    if (!currentUser) {
      console.log('⚠️ No current user - skipping properties with analysis check');
      return;
    }
    
    if (!allProperties || allProperties.length === 0) {
      console.log('⚠️ No properties available - skipping analysis check');
      setPropertiesWithAnalysis(new Set());
      return;
    }
    
    const savedSet = new Set();
    
    try {
      console.log(`🔍 Checking ${allProperties.length} properties for saved analysis...`);
      
      // Check each property for saved analysis with comprehensive error handling
      const checks = allProperties.map(async (property) => {
        // Safety check for property ID
        if (!property || !property.id) {
          console.warn('⚠️ Skipping property with no ID:', property);
          return { success: false, propertyId: 'unknown', error: 'No property ID' };
        }
        
        try {
          // fetchAnalysisFromSupabase now handles all errors internally and returns null on failure
          const savedAnalysis = await fetchAnalysisFromSupabase(currentUser.username, property.id);
          
          if (savedAnalysis) {
            savedSet.add(property.id);
            return { success: true, propertyId: property.id, hasSaved: true };
          }
          
          return { success: true, propertyId: property.id, hasSaved: false };
        } catch (error) {
          // This should rarely happen since fetchAnalysisFromSupabase catches all errors
          console.warn(`⚠️ Unexpected error checking ${property.id}:`, error.message);
          return { success: false, propertyId: property.id, error: error.message };
        }
      });
      
      // Wait for all checks to complete, even if some fail
      const results = await Promise.allSettled(checks);
      
      // Count results
      const fulfilled = results.filter(r => r.status === 'fulfilled');
      const successCount = fulfilled.filter(r => r.value.success).length;
      const savedCount = fulfilled.filter(r => r.value.success && r.value.hasSaved).length;
      const failureCount = results.length - successCount;
      
      setPropertiesWithAnalysis(savedSet);
      console.log(`✅ Analysis check complete: ${savedCount} with saved data, ${successCount - savedCount} checked with no data, ${failureCount} failed`);
    } catch (error) {
      console.error('❌ Catastrophic failure loading properties with analysis:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      setPropertiesWithAnalysis(new Set()); // Clear on catastrophic failure
    }
  };

  // Load saved analysis from Supabase
  const loadAnalysis = async () => {
    if (!selectedProperty || !currentUser) return;
    
    try {
      // Try Supabase first with timeout protection
      let savedAnalysis = null;
      try {
        savedAnalysis = await fetchAnalysisFromSupabase(currentUser.username, selectedProperty.id).catch(err => {
          console.warn('⚠️ fetchAnalysisFromSupabase threw error:', err);
          return null;
        });
      } catch (supabaseError) {
        console.warn('⚠️ Supabase fetch failed, trying localStorage...', supabaseError);
      }
      
      // Fallback to localStorage if Supabase fails
      if (!savedAnalysis) {
        console.log('⚠️ No Supabase data, trying localStorage...');
        savedAnalysis = loadAnalysisFromLocalStorage(currentUser.username, selectedProperty.id);
      }
      
      if (savedAnalysis) {
        // Load all saved values
        setAddress(savedAnalysis.address || selectedProperty.name || '');
        setSize(savedAnalysis.size || selectedProperty.size || 0);
        setLot(savedAnalysis.lot || selectedProperty.lot || 0);
        setBeds(savedAnalysis.beds || (Array.isArray(selectedProperty.bedrooms) ? selectedProperty.bedrooms[0] : selectedProperty.bedrooms || 0));
        setBaths(savedAnalysis.baths || (Array.isArray(selectedProperty.bathrooms) ? selectedProperty.bathrooms[0] : selectedProperty.bathrooms || 0));
        setPool(savedAnalysis.pool || false);
        setPurchasePrice(savedAnalysis.purchasePrice || selectedProperty.price || 0);
        setArv(savedAnalysis.arv || 0);
        setFmv(savedAnalysis.fmv || 0);
        setWholesalePrice(savedAnalysis.wholesalePrice || 0);
        setPropTax(savedAnalysis.propTax || 0);
        setInsurance(savedAnalysis.insurance || 0);
        setUtilities(savedAnalysis.utilities || 0);
        setAirdna(savedAnalysis.airdna || 0);
        setRentcast(savedAnalysis.rentcast || 0);
        setFlipLTV(savedAnalysis.flipLTV || 0.9);
        setFlipRate(savedAnalysis.flipRate || 0.12);
        setRefiLTV(savedAnalysis.refiLTV || 0.75);
        setRefiRate(savedAnalysis.refiRate || 0.055);
        setRefiAmt(savedAnalysis.refiAmt || 0);
        setHoa(savedAnalysis.hoa || 0);
        setIsWholetail(savedAnalysis.isWholetail || false);
        setKitchen(savedAnalysis.kitchen || 0);
        setAppliances(savedAnalysis.appliances || 0);
        setMasterBath(savedAnalysis.masterBath || 0);
        setBathsRehab(savedAnalysis.bathsRehab || 0);
        setPaintInt(savedAnalysis.paintInt || 0);
        setPaintExt(savedAnalysis.paintExt || 0);
        setDrywall(savedAnalysis.drywall || 0);
        setFlooring(savedAnalysis.flooring || 0);
        setHardware(savedAnalysis.hardware || 0);
        setElectrical(savedAnalysis.electrical || 0);
        setPlumbing(savedAnalysis.plumbing || 0);
        setHvac(savedAnalysis.hvac || 0);
        setRoof(savedAnalysis.roof || 0);
        setWindows(savedAnalysis.windows || 0);
        setYard(savedAnalysis.yard || 0);
        setPoolRehab(savedAnalysis.poolRehab || 0);
        setContingency(savedAnalysis.contingency || 0);
        setArvComps(savedAnalysis.arvComps || []);
        setFmvComps(savedAnalysis.fmvComps || []);
        
        console.log('✅ Loaded saved analysis for property:', selectedProperty.id);
      } else {
        // No saved analysis - use default values from property
        console.log('ℹ️ No saved analysis found, using property defaults');
        setAddress(selectedProperty.name || '');
        setSize(selectedProperty.size || 0);
        setLot(selectedProperty.lot || 0);
        setBeds(Array.isArray(selectedProperty.bedrooms) ? selectedProperty.bedrooms[0] : selectedProperty.bedrooms || 0);
        setBaths(Array.isArray(selectedProperty.bathrooms) ? selectedProperty.bathrooms[0] : selectedProperty.bathrooms || 0);
        setPurchasePrice(selectedProperty.price || 0);
        // Reset all other fields
        setPool(false);
        setArv(0);
        setFmv(0);
        setWholesalePrice(0);
        setPropTax(0);
        setInsurance(0);
        setUtilities(0);
        setAirdna(0);
        setRentcast(0);
        setFlipLTV(0.9);
        setFlipRate(0.12);
        setRefiLTV(0.75);
        setRefiRate(0.055);
        setRefiAmt(0);
        setHoa(0);
        setIsWholetail(false);
        setKitchen(0);
        setAppliances(0);
        setMasterBath(0);
        setBathsRehab(0);
        setPaintInt(0);
        setPaintExt(0);
        setDrywall(0);
        setFlooring(0);
        setHardware(0);
        setElectrical(0);
        setPlumbing(0);
        setHvac(0);
        setRoof(0);
        setWindows(0);
        setYard(0);
        setPoolRehab(0);
        setContingency(0);
        setArvComps([]);
        setFmvComps([]);
      }
    } catch (error) {
      console.error('❌ Failed to load analysis:', error);
      
      // Emergency fallback to localStorage
      try {
        const localData = loadAnalysisFromLocalStorage(currentUser.username, selectedProperty.id);
        if (localData) {
          console.log('⚠️ Emergency load from localStorage successful');
          // Apply the same load logic as above
          setAddress(localData.address || selectedProperty.name || '');
          setSize(localData.size || selectedProperty.size || 0);
          setLot(localData.lot || selectedProperty.lot || 0);
          setBeds(localData.beds || (Array.isArray(selectedProperty.bedrooms) ? selectedProperty.bedrooms[0] : selectedProperty.bedrooms || 0));
          setBaths(localData.baths || (Array.isArray(selectedProperty.bathrooms) ? selectedProperty.bathrooms[0] : selectedProperty.bathrooms || 0));
          setPool(localData.pool || false);
          setPurchasePrice(localData.purchasePrice || selectedProperty.price || 0);
          setArv(localData.arv || 0);
          setFmv(localData.fmv || 0);
          setWholesalePrice(localData.wholesalePrice || 0);
          setPropTax(localData.propTax || 0);
          setInsurance(localData.insurance || 0);
          setUtilities(localData.utilities || 0);
          setAirdna(localData.airdna || 0);
          setRentcast(localData.rentcast || 0);
          setFlipLTV(localData.flipLTV || 0.9);
          setFlipRate(localData.flipRate || 0.12);
          setRefiLTV(localData.refiLTV || 0.75);
          setRefiRate(localData.refiRate || 0.055);
          setRefiAmt(localData.refiAmt || 0);
          setHoa(localData.hoa || 0);
          setIsWholetail(localData.isWholetail || false);
          setKitchen(localData.kitchen || 0);
          setAppliances(localData.appliances || 0);
          setMasterBath(localData.masterBath || 0);
          setBathsRehab(localData.bathsRehab || 0);
          setPaintInt(localData.paintInt || 0);
          setPaintExt(localData.paintExt || 0);
          setDrywall(localData.drywall || 0);
          setFlooring(localData.flooring || 0);
          setHardware(localData.hardware || 0);
          setElectrical(localData.electrical || 0);
          setPlumbing(localData.plumbing || 0);
          setHvac(localData.hvac || 0);
          setRoof(localData.roof || 0);
          setWindows(localData.windows || 0);
          setYard(localData.yard || 0);
          setPoolRehab(localData.poolRehab || 0);
          setContingency(localData.contingency || 0);
          setArvComps(localData.arvComps || []);
          setFmvComps(localData.fmvComps || []);
        }
      } catch (fallbackError) {
        console.error('❌ Emergency localStorage load also failed:', fallbackError);
      }
    }
  };

  // Save analysis to Supabase
  // Save analysis data to localStorage as fallback
  const saveAnalysisToLocalStorage = (userId, propertyId, analysisData) => {
    try {
      const storageKey = `analysis_${userId}_${propertyId}`;
      localStorage.setItem(storageKey, JSON.stringify(analysisData));
      console.log('💾 Saved analysis to localStorage:', storageKey);
      return true;
    } catch (error) {
      console.error('❌ localStorage save failed:', error);
      return false;
    }
  };

  // Load analysis data from localStorage as fallback
  const loadAnalysisFromLocalStorage = (userId, propertyId) => {
    try {
      const storageKey = `analysis_${userId}_${propertyId}`;
      const data = localStorage.getItem(storageKey);
      if (data) {
        console.log('💾 Loaded analysis from localStorage:', storageKey);
        return JSON.parse(data);
      }
      return null;
    } catch (error) {
      console.error('❌ localStorage load failed:', error);
      return null;
    }
  };

  const handleAIAnalysis = async () => {
    if (!selectedProperty) {
      console.log('ℹ️ No property selected for AI analysis');
      return;
    }

    // Get webhook URL from localStorage
    const webhookUrl = localStorage.getItem('ai_analyser_webhook_url');
    
    if (!webhookUrl) {
      console.log('ℹ️ Webhook URL not configured - showing setup instructions');
      alert(
        '⚙️ Setup Required: AI Analyser Webhook\n\n' +
        'Configure your automation webhook URL:\n\n' +
        'localStorage.setItem("ai_analyser_webhook_url", "YOUR_WEBHOOK_URL")\n\n' +
        'Paste this in the browser console and replace YOUR_WEBHOOK_URL with your Make.com or n8n endpoint.'
      );
      return;
    }

    setAiLoading(true);
    setAiError(null);

    try {
      console.log('🤖 Sending property to AI analysis webhook...');
      console.log('📡 Webhook URL:', webhookUrl);
      
      // Prepare payload with property data
      const payload = {
        propertyId: selectedProperty.id,
        name: selectedProperty.name || 'Unknown',
        address: selectedProperty.address?.address || selectedProperty.name,
        price: selectedProperty.price || 0,
        propertyType: selectedProperty.propertyType || 'Unknown',
        buildingType: selectedProperty.buildingType || 'Unknown',
        description: selectedProperty.propertyDescription || '',
        realtorcaLink: selectedProperty.realtorcaLink?.url || null,
        zillowcaLink: selectedProperty.zillowcaLink?.url || null,
        housesigmaLink: selectedProperty.housesigmacom?.url || null,
        beds: selectedProperty.bedrooms || null,
        baths: selectedProperty.bathrooms || null,
        ward: selectedProperty.wards || null,
        daysOnMarket: selectedProperty.daysOnMarket || 0,
        listingStatus: selectedProperty.listingStatus || 'Unknown',
        timestamp: new Date().toISOString()
      };

      console.log('📦 Sending payload:', payload);

      // Send POST request to webhook
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Webhook returned ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Webhook response:', result);

      // Show success message
      alert(
        'Property Sent to AI Analyser!\n\n' +
        `Property: ${selectedProperty.name}\n` +
        'Status: Analysis request sent successfully\n\n' +
        'The automation will:\n' +
        '1. Visit the property listing\n' +
        '2. Analyze photos and details\n' +
        '3. Send results back to update fields\n\n' +
        'Results will be available shortly.'
      );

      console.log('✅ AI analysis webhook triggered successfully');
      
    } catch (error) {
      console.error('❌ Webhook call failed:', error);
      setAiError(error.message || 'Failed to send to webhook');
      
      alert(
        'AI Analyser Error\n\n' +
        `Failed to send property to webhook:\n${error.message}\n\n` +
        'Please check:\n' +
        '1. Webhook URL is correct\n' +
        '2. Webhook endpoint is accessible\n' +
        '3. Browser console for more details'
      );
    } finally {
      setAiLoading(false);
    }
  };

  const handleSaveAnalysis = async () => {
    if (!selectedProperty || !currentUser) {
      console.error('❌ Cannot save: missing property or user');
      return;
    }
    
    setSaveStatus('saving');
    
    try {
      const analysisData = {
        address, size, lot, beds, baths, pool,
        purchasePrice, arv, fmv, wholesalePrice,
        propTax, insurance, utilities, airdna, rentcast,
        flipLTV, flipRate, refiLTV, refiRate, refiAmt, hoa, isWholetail,
        kitchen, appliances, masterBath, bathsRehab, paintInt, paintExt,
        drywall, flooring, hardware, electrical, plumbing, hvac,
        roof, windows, yard, poolRehab, contingency,
        arvComps, fmvComps
      };
      
      console.log('💾 Saving analysis with all form state:', Object.keys(analysisData));
      
      // Try Supabase first
      const supabaseSuccess = await saveAnalysisToSupabase(
        currentUser.username,
        selectedProperty.id,
        analysisData
      );
      
      // Always save to localStorage as backup
      const localSuccess = saveAnalysisToLocalStorage(
        currentUser.username,
        selectedProperty.id,
        analysisData
      );
      
      if (supabaseSuccess) {
        console.log('✅ Analysis saved to Supabase (localStorage backup also saved)');
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } else if (localSuccess) {
        console.log('⚠️ Supabase save failed, but localStorage backup successful');
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } else {
        console.error('❌ Both Supabase and localStorage saves failed');
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    } catch (error) {
      console.error('❌ Save analysis error:', error);
      
      // Emergency fallback to localStorage
      try {
        const analysisData = {
          address, size, lot, beds, baths, pool,
          purchasePrice, arv, fmv, wholesalePrice,
          propTax, insurance, utilities, airdna, rentcast,
          flipLTV, flipRate, refiLTV, refiRate, refiAmt, hoa, isWholetail,
          kitchen, appliances, masterBath, bathsRehab, paintInt, paintExt,
          drywall, flooring, hardware, electrical, plumbing, hvac,
          roof, windows, yard, poolRehab, contingency,
          arvComps, fmvComps
        };
        
        const localSuccess = saveAnalysisToLocalStorage(
          currentUser.username,
          selectedProperty.id,
          analysisData
        );
        
        if (localSuccess) {
          console.log('⚠️ Emergency localStorage save successful');
          setSaveStatus('saved');
          setTimeout(() => setSaveStatus('idle'), 2000);
        } else {
          setSaveStatus('error');
          setTimeout(() => setSaveStatus('idle'), 3000);
        }
      } catch (fallbackError) {
        console.error('❌ Emergency localStorage save also failed:', fallbackError);
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    }
  };

  // Calculate exit strategies
  const wholesaleProfit = wholesalePrice - purchasePrice - (purchasePrice * 0.015);
  const wholetailProfit = fmv - purchasePrice - (purchasePrice * 0.015) - totalRehab - (fmv * 0.055);
  const flipProfit = arv - purchasePrice - (purchasePrice * 0.015) - totalRehab - (arv * 0.055) - ((purchasePrice * flipLTV * flipRate / 12) * 6) - (((propTax + hoa + insurance) / 12 + utilities) * 6);
  const creativeProfit = (arv * 1.2) - purchasePrice - (purchasePrice * 0.015) - totalRehab - ((arv * 1.2) * 0.055) - ((purchasePrice * flipLTV * flipRate / 12) * 8) - (((propTax + hoa + insurance) / 12 + utilities) * 8);

  // Rental Analysis Calculations
  const strGrossRevenue = airdna || 0;
  const ltrGrossRevenue = (rentcast || 0) * 12;
  const strVacancy = strGrossRevenue * 0.10;
  const ltrVacancy = ltrGrossRevenue * 0.10;
  
  const refiMortgage = refiAmt > 0 ? (refiAmt * refiRate / 12) * 12 : 0;
  const propTaxInsurance = propTax + insurance;
  const annualUtilities = utilities * 12;
  const annualHOA = hoa * 12;
  const strOperatingExpenses = strGrossRevenue * 0.10;
  const ltrOperatingExpenses = ltrGrossRevenue * 0.10;
  
  const strCashFlow = strGrossRevenue - strVacancy - refiMortgage - propTaxInsurance - annualUtilities - annualHOA - strOperatingExpenses;
  const ltrCashFlow = ltrGrossRevenue - ltrVacancy - refiMortgage - propTaxInsurance - annualUtilities - annualHOA - ltrOperatingExpenses;
  
  const principalPaydown = refiAmt > 0 ? refiAmt * 0.02 : 0;
  const appreciation = arv * 0.039;
  
  const strNetAnnual = strCashFlow + principalPaydown + appreciation;
  const ltrNetAnnual = ltrCashFlow + principalPaydown + appreciation;

  // Chart data
  const exitStrategyData = useMemo(() => [
    { strategy: 'Wholesale', profit: wholesaleProfit },
    { strategy: 'Wholetail', profit: wholetailProfit },
    { strategy: 'Flip', profit: flipProfit },
    { strategy: 'Creative', profit: creativeProfit }
  ], [wholesaleProfit, wholetailProfit, flipProfit, creativeProfit]);

  const rentalComparisonData = useMemo(() => [
    { metric: 'Gross Revenue', STR: strGrossRevenue, LTR: ltrGrossRevenue },
    { metric: 'Cash Flow', STR: strCashFlow, LTR: ltrCashFlow },
    { metric: 'Net Annual', STR: strNetAnnual, LTR: ltrNetAnnual }
  ], [strGrossRevenue, ltrGrossRevenue, strCashFlow, ltrCashFlow, strNetAnnual, ltrNetAnnual]);

  // Fix & Flip rehab breakdown (all costs)
  const rehabBreakdownFlip = useMemo(() => {
    const items = [
      { id: 'Kitchen', label: 'Kitchen', value: kitchen },
      { id: 'Appliances', label: 'Appliances', value: appliances },
      { id: 'Master Bath', label: 'Master Bath', value: masterBath },
      { id: 'Baths', label: 'Baths', value: bathsRehab },
      { id: 'Paint Int', label: 'Paint Interior', value: paintInt },
      { id: 'Paint Ext', label: 'Paint Exterior', value: paintExt },
      { id: 'Drywall', label: 'Drywall', value: drywall },
      { id: 'Flooring', label: 'Flooring', value: flooring },
      { id: 'Hardware', label: 'Hardware', value: hardware },
      { id: 'Electrical', label: 'Electrical', value: electrical },
      { id: 'Plumbing', label: 'Plumbing', value: plumbing },
      { id: 'HVAC', label: 'HVAC', value: hvac },
      { id: 'Roof', label: 'Roof', value: roof },
      { id: 'Windows', label: 'Windows', value: windows },
      { id: 'Yard', label: 'Yard', value: yard },
      { id: 'Pool', label: 'Pool', value: poolRehab },
      { id: 'Contingency', label: 'Contingency', value: contingency }
    ];
    return items.filter(item => item.value > 0);
  }, [kitchen, appliances, masterBath, bathsRehab, paintInt, paintExt, drywall, flooring, hardware, electrical, plumbing, hvac, roof, windows, yard, poolRehab, contingency]);

  // Wholetail rehab breakdown (subset of costs for light rehab)
  const rehabBreakdownWholetail = useMemo(() => {
    const items = [
      { id: 'Kitchen', label: 'Kitchen', value: kitchen },
      { id: 'Appliances', label: 'Appliances', value: appliances },
      { id: 'Paint Int', label: 'Paint Interior', value: paintInt },
      { id: 'Paint Ext', label: 'Paint Exterior', value: paintExt },
      { id: 'Flooring', label: 'Flooring', value: flooring },
      { id: 'Hardware', label: 'Hardware', value: hardware },
      { id: 'Yard', label: 'Yard', value: yard },
      { id: 'Contingency', label: 'Contingency', value: contingency }
    ];
    return items.filter(item => item.value > 0);
  }, [kitchen, appliances, paintInt, paintExt, flooring, hardware, yard, contingency]);

  const totalRehabFlip = kitchen + appliances + masterBath + bathsRehab + paintInt + paintExt + drywall + flooring + hardware + electrical + plumbing + hvac + roof + windows + yard + poolRehab + contingency;
  const totalRehabWholetail = kitchen + appliances + paintInt + paintExt + flooring + hardware + yard + contingency;

  return (
    <Flex h="100%" overflow="hidden">
      {/* Property List */}
      {!selectedProperty && (
        <Box w="35%" h="100%" borderRightWidth="1px" borderColor="border.muted" overflowY="auto" bg="white">
          <Box p={3} borderBottomWidth="1px" borderColor="border.muted">
            <Text fontSize="sm" fontWeight="bold">Showing {scoredProperties.length} properties</Text>
          </Box>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ position: 'sticky', top: 0, bg: 'gray.50', zIndex: 1 }}>
              <tr>
                <SortHeader columnKey="name">Address</SortHeader>
                <SortHeader columnKey="price">Price</SortHeader>
                <SortHeader columnKey="scores.global">Score</SortHeader>
              </tr>
            </thead>
            <tbody>
              {sortedProperties.map(prop => (
                <tr key={prop.id} style={{ cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }} onClick={() => setSelectedProperty(prop)}>
                  <td style={{ padding: '6px 8px', fontSize: '11px', fontWeight: 'bold' }}>{prop.name}</td>
                  <td style={{ padding: '6px 8px', fontSize: '11px' }}>{fmt(prop.price)}</td>
                  <td style={{ padding: '6px 8px' }}>
                    <Badge colorPalette={prop.scores?.global >= 70 ? 'green' : prop.scores?.global >= 50 ? 'orange' : 'red'} size="xs">
                      {Math.round(prop.scores?.global || 0)}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Box>
      )}

      {/* Analysis View */}
      {selectedProperty && (
        <Box w="100%" h="100%" overflowY="auto" bg="bg.subtle" p={4}>
          <VStack align="stretch" gap={4}>
            <HStack justify="space-between">
              <HStack gap={4}>
                <Button variant="ghost" onClick={() => setSelectedProperty(null)} size="sm">
                  <ArrowLeft size={16} /> Back to List
                </Button>
                <Text fontSize="lg" fontWeight="bold">
                  {selectedProperty.name?.split(',')[0] || selectedProperty.name} • {selectedProperty.bedrooms?.[0] || '-'} bd • {selectedProperty.bathrooms?.[0] || '-'} ba • Purchase: ${Math.round(selectedProperty.price || 0).toLocaleString()} • ARV: ${Math.round(arv || 0).toLocaleString()} • Wholesale: ${Math.round(wholesalePrice || 0).toLocaleString()}
                </Text>
              </HStack>
              <HStack gap={2}>
                {/* View Mode Toggle */}
                <HStack bg="rgba(255,255,255,0.1)" p={1} borderRadius="md">
                  <IconButton 
                    size="sm" 
                    variant={viewMode === 'table' ? 'solid' : 'ghost'} 
                    colorPalette={viewMode === 'table' ? 'blue' : 'gray'}
                    onClick={() => setViewMode('table')}
                    aria-label="Table view"
                  >
                    <TableIcon size={16} />
                  </IconButton>
                  <IconButton 
                    size="sm" 
                    variant={viewMode === 'dashboard' ? 'solid' : 'ghost'} 
                    colorPalette={viewMode === 'dashboard' ? 'blue' : 'gray'}
                    onClick={() => setViewMode('dashboard')}
                    aria-label="Dashboard view"
                  >
                    <BarChart3 size={16} />
                  </IconButton>
                </HStack>
                
                {saveStatus === 'saving' && <Spinner size="sm" />}
                {saveStatus === 'saved' && <CheckCircle size={16} color="green" />}
                <Button
                  colorPalette="purple"
                  size="sm"
                  onClick={handleAIAnalysis}
                  disabled={aiLoading}
                >
                  {aiLoading ? <Spinner size="xs" /> : <Sparkles size={16} />}
                  AI Analyser
                </Button>
                <Text fontSize="xs" fontStyle="italic" color="fg.muted">Coming Soon</Text>
                <Button colorPalette="blue" onClick={handleSaveAnalysis} size="sm" disabled={saveStatus === 'saving'}>
                  <Save size={16} /> Save Analysis
                </Button>
              </HStack>
            </HStack>

            {/* Dashboard View - KPIs and Charts */}
            {viewMode === 'dashboard' && (
              <VStack align="stretch" gap={4}>
                {/* KPI Cards */}
                <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} gap={4}>
                              <KPICard
                value={fmt(purchasePrice)}
                label="Purchase Price"
                icon={<DollarSign size={32} />}
                              />
                              <KPICard
                value={fmt(arv)}
                label="ARV (After Repair Value)"
                icon={<TrendingUp size={32} />}
                              />
                              <KPICard
                value={fmt(totalRehab)}
                label="Total Rehab Cost"
                icon={<Home size={32} />}
                              />
                              </SimpleGrid>

                {/* Charts Section - Single horizontal row */}
                <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} gap={3}>
              <ChartCard title="Exit Strategy Comparison" subtitle="Profit by strategy">
                <Bar
                  data={exitStrategyData}
                  xField="strategy"
                  yField="profit"
                  seriesLabel="Profit"
                  layout="vertical"
                  colors={['#fdab3d', '#0086c0', '#00c875', '#579bfc']}
                />
              </ChartCard>

              <ChartCard title="Rental: STR vs LTR" subtitle="Annual comparison">
                <Bar
                  data={rentalComparisonData}
                  xField="metric"
                  series={[
                    { key: 'STR', yField: 'STR' },
                    { key: 'LTR', yField: 'LTR' }
                  ]}
                  groupMode="grouped"
                  showLegend
                  colors={['#784bd1', '#00c875']}
                />
              </ChartCard>

              {rehabBreakdownFlip.length > 0 && (
                <ChartCard title="Rehab: Fix & Flip" subtitle={`Total: ${fmt(totalRehabFlip)}`}>
                  <Pie
                    data={rehabBreakdownFlip}
                    innerRadius={0.5}
                    showLegend
                    colors={['#0086c0', '#00c875', '#fdab3d', '#e2445c', '#784bd1', '#579bfc', '#ff158a', '#bb3354', '#9cd326', '#225091', '#5559df', '#66ccff', '#ff9900', '#cd9282', '#7e3b8a', '#037f4c', '#175a63']}
                  />
                </ChartCard>
              )}

              {rehabBreakdownWholetail.length > 0 && (
                <ChartCard title="Rehab: Wholetail" subtitle={`Total: ${fmt(totalRehabWholetail)}`}>
                  <Pie
                    data={rehabBreakdownWholetail}
                    innerRadius={0.5}
                    showLegend
                    colors={['#0086c0', '#00c875', '#fdab3d', '#e2445c', '#784bd1', '#579bfc', '#ff158a', '#bb3354']}
                  />
                </ChartCard>
              )}
            </SimpleGrid>
              </VStack>
            )}

            {/* Table View - Analysis Form */}
            {viewMode === 'table' && (
              <VStack align="stretch" gap={4}>
                {/* Header - Consolidated into single row */}
                <Card.Root bg="white">
              <Card.Body p={4}>
                <Text fontSize="16px" fontWeight="bold">
                  <Text as="span" fontSize="20px" fontWeight="bold">{address || selectedProperty.name}</Text>
                  {' · '}
                  <Text as="span" color="fg.muted">{beds} bed · {baths} bath · {size.toLocaleString()} sqft · {lot.toLocaleString()} lot · {pool ? 'Pool' : 'No Pool'} · Score: {(selectedProperty.scores?.global || 0).toFixed(1)} · Purchase {fmt(purchasePrice)} · ARV {fmt(arv)} · Wholesale {fmt(wholesalePrice)} ({wholesalePrice > 0 && purchasePrice > 0 ? ((wholesalePrice / purchasePrice) * 100).toFixed(0) : 0}%)</Text>
                </Text>
              </Card.Body>
            </Card.Root>

            <Grid templateColumns="1.2fr 1fr" gap={4}>
              {/* Left Side: 3 Columns + Analysis Row */}
              <VStack align="stretch" gap={4}>
                <Grid templateColumns="repeat(3, 1fr)" gap={3}>
                  {/* Column A: Property */}
                  <Card.Root bg="#f8f9fa">
                    <Card.Header p={2}><Text fontSize="20px" fontWeight="bold">A. Property</Text></Card.Header>
                    <Card.Body p={3}>
                      <VStack align="stretch" gap={2}>
                        <Box><Text fontSize="16px" mb={1}>Address</Text><Input height="32px" fontSize="18px" value={address} onChange={(e) => setAddress(e.target.value)} bg="white" /></Box>
                        <Grid templateColumns="1fr 1fr" gap={2}>
                          <Box><Text fontSize="16px" mb={1}>Size</Text><Input height="32px" fontSize="18px" type="number" value={size} onChange={(e) => setSize(Number(e.target.value))} bg="white" /></Box>
                          <Box><Text fontSize="16px" mb={1}>Lot</Text><Input height="32px" fontSize="18px" type="number" value={lot} onChange={(e) => setLot(Number(e.target.value))} bg="white" /></Box>
                        </Grid>
                        <Grid templateColumns="1fr 1fr 1fr" gap={2}>
                          <Box><Text fontSize="16px" mb={1}>Beds</Text><Input height="32px" fontSize="18px" type="number" value={beds} onChange={(e) => setBeds(Number(e.target.value))} bg="white" /></Box>
                          <Box><Text fontSize="16px" mb={1}>Baths</Text><Input height="32px" fontSize="18px" type="number" value={baths} onChange={(e) => setBaths(Number(e.target.value))} bg="white" /></Box>
                          <Box><Text fontSize="16px" mb={1}>Pool</Text><Switch.Root size="sm" checked={pool} onCheckedChange={(e) => setPool(e.checked)}><Switch.HiddenInput /><Switch.Control><Switch.Thumb /></Switch.Control><Switch.Label fontSize="14px">{pool ? 'Yes' : 'No'}</Switch.Label></Switch.Root></Box>
                        </Grid>
                        <Grid templateColumns="1fr 1fr" gap={2}>
                          <Box><Text fontSize="16px" mb={1}>Prop Tax</Text><Input height="32px" fontSize="18px" type="number" value={propTax} onChange={(e) => setPropTax(Number(e.target.value))} bg="white" /></Box>
                          <Box>
                            <HStack gap={1} mb={1}>
                              <Text fontSize="16px">HOA</Text>
                              <Tooltip.Root openDelay={200} closeDelay={200}>
                                <Tooltip.Trigger asChild>
                                  <Box cursor="help" color="fg.muted">
                                    <Info size={14} />
                                  </Box>
                                </Tooltip.Trigger>
                                <Portal>
                                  <Tooltip.Positioner>
                                    <Tooltip.Content maxW="200px" bg="gray.800" color="white" p={2} fontSize="xs" borderRadius="md">
                                      <Tooltip.Arrow />
                                      Home Owners Association - Monthly community fees
                                    </Tooltip.Content>
                                  </Tooltip.Positioner>
                                </Portal>
                              </Tooltip.Root>
                            </HStack>
                            <Input height="32px" fontSize="18px" type="number" value={hoa} onChange={(e) => setHoa(Number(e.target.value))} bg="white" />
                          </Box>
                        </Grid>
                        <Grid templateColumns="1fr 1fr" gap={2}>
                          <Box><Text fontSize="16px" mb={1}>Insurance</Text><Input height="32px" fontSize="18px" type="number" value={insurance} onChange={(e) => setInsurance(Number(e.target.value))} bg="white" /></Box>
                          <Box><Text fontSize="16px" mb={1}>Utilities</Text><Input height="32px" fontSize="18px" type="number" value={utilities} onChange={(e) => setUtilities(Number(e.target.value))} bg="white" /></Box>
                        </Grid>
                      </VStack>
                    </Card.Body>
                  </Card.Root>

                  {/* Column B: Valuations & Financing */}
                  <Card.Root bg="#f8f9fa">
                    <Card.Header p={2}><Text fontSize="20px" fontWeight="bold">B. Valuations & Financing</Text></Card.Header>
                    <Card.Body p={3}>
                      <VStack align="stretch" gap={2}>
                        <Grid templateColumns="1fr 1fr" gap={2}>
                          <Box><Text fontSize="16px" mb={1}>Purchase</Text><Input height="32px" fontSize="18px" type="number" value={purchasePrice} onChange={(e) => setPurchasePrice(Number(e.target.value))} bg="white" /></Box>
                          <Box><Text fontSize="16px" mb={1}>Wholesale</Text><Input height="32px" fontSize="18px" type="number" value={wholesalePrice} onChange={(e) => setWholesalePrice(Number(e.target.value))} bg="white" /></Box>
                        </Grid>
                        <Grid templateColumns="1fr 1fr" gap={2}>
                          <Box>
                            <HStack gap={1} mb={1}>
                              <Text fontSize="16px">FMV</Text>
                              <Tooltip.Root openDelay={200} closeDelay={200}>
                                <Tooltip.Trigger asChild>
                                  <Box cursor="help" color="fg.muted">
                                    <Info size={14} />
                                  </Box>
                                </Tooltip.Trigger>
                                <Portal>
                                  <Tooltip.Positioner>
                                    <Tooltip.Content maxW="200px" bg="gray.800" color="white" p={2} fontSize="xs" borderRadius="md">
                                      <Tooltip.Arrow />
                                      Fair Market Value - Current market value in as-is condition
                                    </Tooltip.Content>
                                  </Tooltip.Positioner>
                                </Portal>
                              </Tooltip.Root>
                            </HStack>
                            <Input height="32px" fontSize="18px" type="number" value={fmv} onChange={(e) => setFmv(Number(e.target.value))} bg="white" />
                          </Box>
                          <Box>
                            <HStack gap={1} mb={1}>
                              <Text fontSize="16px">ARV</Text>
                              <Tooltip.Root openDelay={200} closeDelay={200}>
                                <Tooltip.Trigger asChild>
                                  <Box cursor="help" color="fg.muted">
                                    <Info size={14} />
                                  </Box>
                                </Tooltip.Trigger>
                                <Portal>
                                  <Tooltip.Positioner>
                                    <Tooltip.Content maxW="200px" bg="gray.800" color="white" p={2} fontSize="xs" borderRadius="md">
                                      <Tooltip.Arrow />
                                      After Repair Value - Estimated value after renovations
                                    </Tooltip.Content>
                                  </Tooltip.Positioner>
                                </Portal>
                              </Tooltip.Root>
                            </HStack>
                            <Input height="32px" fontSize="18px" type="number" value={arv} onChange={(e) => setArv(Number(e.target.value))} bg="white" />
                          </Box>
                        </Grid>
                        <Grid templateColumns="1fr 1fr" gap={2}>
                          <Box>
                            <HStack gap={1} mb={1}>
                              <Text fontSize="16px">AirDNA</Text>
                              <Tooltip.Root openDelay={200} closeDelay={200}>
                                <Tooltip.Trigger asChild>
                                  <Box cursor="help" color="fg.muted">
                                    <Info size={14} />
                                  </Box>
                                </Tooltip.Trigger>
                                <Portal>
                                  <Tooltip.Positioner>
                                    <Tooltip.Content maxW="200px" bg="gray.800" color="white" p={2} fontSize="xs" borderRadius="md">
                                      <Tooltip.Arrow />
                                      Short-term rental data provider - STR revenue estimates
                                    </Tooltip.Content>
                                  </Tooltip.Positioner>
                                </Portal>
                              </Tooltip.Root>
                            </HStack>
                            <Input height="32px" fontSize="18px" type="number" value={airdna} onChange={(e) => setAirdna(Number(e.target.value))} bg="white" />
                          </Box>
                          <Box>
                            <HStack gap={1} mb={1}>
                              <Text fontSize="16px">Rentcast</Text>
                              <Tooltip.Root openDelay={200} closeDelay={200}>
                                <Tooltip.Trigger asChild>
                                  <Box cursor="help" color="fg.muted">
                                    <Info size={14} />
                                  </Box>
                                </Tooltip.Trigger>
                                <Portal>
                                  <Tooltip.Positioner>
                                    <Tooltip.Content maxW="200px" bg="gray.800" color="white" p={2} fontSize="xs" borderRadius="md">
                                      <Tooltip.Arrow />
                                      Rental estimate provider - Long-term rental projections
                                    </Tooltip.Content>
                                  </Tooltip.Positioner>
                                </Portal>
                              </Tooltip.Root>
                            </HStack>
                            <Input height="32px" fontSize="18px" type="number" value={rentcast} onChange={(e) => setRentcast(Number(e.target.value))} bg="white" />
                          </Box>
                        </Grid>
                        <Grid templateColumns="1fr 1fr" gap={2}>
                          <Box>
                            <HStack gap={1} mb={1}>
                              <Text fontSize="16px">Flip LTV</Text>
                              <Tooltip.Root openDelay={200} closeDelay={200}>
                                <Tooltip.Trigger asChild>
                                  <Box cursor="help" color="fg.muted">
                                    <Info size={14} />
                                  </Box>
                                </Tooltip.Trigger>
                                <Portal>
                                  <Tooltip.Positioner>
                                    <Tooltip.Content maxW="200px" bg="gray.800" color="white" p={2} fontSize="xs" borderRadius="md">
                                      <Tooltip.Arrow />
                                      Loan to Value - Percentage of purchase price financed
                                    </Tooltip.Content>
                                  </Tooltip.Positioner>
                                </Portal>
                              </Tooltip.Root>
                            </HStack>
                            <Input height="32px" fontSize="18px" type="number" step="0.01" value={flipLTV} onChange={(e) => setFlipLTV(Number(e.target.value))} bg="white" />
                          </Box>
                          <Box><Text fontSize="16px" mb={1}>Flip Rate</Text><Input height="32px" fontSize="18px" type="number" step="0.01" value={flipRate} onChange={(e) => setFlipRate(Number(e.target.value))} bg="white" /></Box>
                        </Grid>
                        <Grid templateColumns="1fr 1fr" gap={2}>
                          <Box>
                            <HStack gap={1} mb={1}>
                              <Text fontSize="16px">Refi LTV</Text>
                              <Tooltip.Root openDelay={200} closeDelay={200}>
                                <Tooltip.Trigger asChild>
                                  <Box cursor="help" color="fg.muted">
                                    <Info size={14} />
                                  </Box>
                                </Tooltip.Trigger>
                                <Portal>
                                  <Tooltip.Positioner>
                                    <Tooltip.Content maxW="200px" bg="gray.800" color="white" p={2} fontSize="xs" borderRadius="md">
                                      <Tooltip.Arrow />
                                      Loan to Value - Refinance loan as % of property value
                                    </Tooltip.Content>
                                  </Tooltip.Positioner>
                                </Portal>
                              </Tooltip.Root>
                            </HStack>
                            <Input height="32px" fontSize="18px" type="number" step="0.01" value={refiLTV} onChange={(e) => setRefiLTV(Number(e.target.value))} bg="white" />
                          </Box>
                          <Box><Text fontSize="16px" mb={1}>Refi Rate</Text><Input height="32px" fontSize="18px" type="number" step="0.01" value={refiRate} onChange={(e) => setRefiRate(Number(e.target.value))} bg="white" /></Box>
                        </Grid>
                        <Box><Text fontSize="16px" mb={1}>Refi Amt</Text><Input height="32px" fontSize="18px" type="number" value={refiAmt} onChange={(e) => setRefiAmt(Number(e.target.value))} bg="white" /></Box>
                      </VStack>
                    </Card.Body>
                  </Card.Root>

                  {/* Column C: Rehab */}
                  <Card.Root bg="#f8f9fa">
                    <Card.Header p={2}>
                      <HStack justify="space-between">
                        <Text fontSize="20px" fontWeight="bold">C. Rehab</Text>
                        <Switch.Root size="sm" checked={isWholetail} onCheckedChange={(e) => setIsWholetail(e.checked)}><Switch.HiddenInput /><Switch.Control><Switch.Thumb /></Switch.Control><Switch.Label fontSize="12px">{isWholetail ? 'Wholetail' : 'Fix & Flip'}</Switch.Label></Switch.Root>
                      </HStack>
                      <Text fontSize="12px" color="purple.600" mt={1}>17 rehab cost % of ARV</Text>
                    </Card.Header>
                    <Card.Body p={3} maxH="400px" overflowY="auto">
                      <VStack align="stretch" gap={2}>
                        <Box><Text fontSize="16px" mb={1}>🍳 Kitchen</Text><Input height="32px" fontSize="18px" type="number" value={kitchen} onChange={(e) => setKitchen(Number(e.target.value))} bg="white" /></Box>
                        <Box><Text fontSize="16px" mb={1}>🔌 Appliances</Text><Input height="32px" fontSize="18px" type="number" value={appliances} onChange={(e) => setAppliances(Number(e.target.value))} bg="white" /></Box>
                        <Box><Text fontSize="16px" mb={1}>🛁 Master Bath</Text><Input height="32px" fontSize="18px" type="number" value={masterBath} onChange={(e) => setMasterBath(Number(e.target.value))} bg="white" /></Box>
                        <Box><Text fontSize="16px" mb={1}>🚿 Baths</Text><Input height="32px" fontSize="18px" type="number" value={bathsRehab} onChange={(e) => setBathsRehab(Number(e.target.value))} bg="white" /></Box>
                        <Box><Text fontSize="16px" mb={1}>🎨 Paint Interior</Text><Input height="32px" fontSize="18px" type="number" value={paintInt} onChange={(e) => setPaintInt(Number(e.target.value))} bg="white" /></Box>
                        <Box><Text fontSize="16px" mb={1}>🏠 Paint Exterior</Text><Input height="32px" fontSize="18px" type="number" value={paintExt} onChange={(e) => setPaintExt(Number(e.target.value))} bg="white" /></Box>
                        <Box><Text fontSize="16px" mb={1}>🧱 Drywall</Text><Input height="32px" fontSize="18px" type="number" value={drywall} onChange={(e) => setDrywall(Number(e.target.value))} bg="white" /></Box>
                        <Box><Text fontSize="16px" mb={1}>🪵 Flooring</Text><Input height="32px" fontSize="18px" type="number" value={flooring} onChange={(e) => setFlooring(Number(e.target.value))} bg="white" /></Box>
                        <Box><Text fontSize="16px" mb={1}>🔧 Hardware</Text><Input height="32px" fontSize="18px" type="number" value={hardware} onChange={(e) => setHardware(Number(e.target.value))} bg="white" /></Box>
                        <Box><Text fontSize="16px" mb={1}>⚡ Electrical</Text><Input height="32px" fontSize="18px" type="number" value={electrical} onChange={(e) => setElectrical(Number(e.target.value))} bg="white" /></Box>
                        <Box><Text fontSize="16px" mb={1}>🚰 Plumbing</Text><Input height="32px" fontSize="18px" type="number" value={plumbing} onChange={(e) => setPlumbing(Number(e.target.value))} bg="white" /></Box>
                        <Box><Text fontSize="16px" mb={1}>❄️ HVAC</Text><Input height="32px" fontSize="18px" type="number" value={hvac} onChange={(e) => setHvac(Number(e.target.value))} bg="white" /></Box>
                        <Box><Text fontSize="16px" mb={1}>🏗️ Roof</Text><Input height="32px" fontSize="18px" type="number" value={roof} onChange={(e) => setRoof(Number(e.target.value))} bg="white" /></Box>
                        <Box><Text fontSize="16px" mb={1}>🪟 Windows</Text><Input height="32px" fontSize="18px" type="number" value={windows} onChange={(e) => setWindows(Number(e.target.value))} bg="white" /></Box>
                        <Box><Text fontSize="16px" mb={1}>🌳 Yard</Text><Input height="32px" fontSize="18px" type="number" value={yard} onChange={(e) => setYard(Number(e.target.value))} bg="white" /></Box>
                        <Box><Text fontSize="16px" mb={1}>🏊 Pool</Text><Input height="32px" fontSize="18px" type="number" value={poolRehab} onChange={(e) => setPoolRehab(Number(e.target.value))} bg="white" /></Box>
                        <Box><Text fontSize="16px" mb={1}>📋 Contingency</Text><Input height="32px" fontSize="18px" type="number" value={contingency} onChange={(e) => setContingency(Number(e.target.value))} bg="white" /></Box>
                        <Box p={2} bg="purple.50" borderRadius="md">
                          <Text fontSize="16px" fontWeight="bold">Total: {fmt(totalRehab)} (${rehabPerSqft.toFixed(2)}/sqft)</Text>
                        </Box>
                      </VStack>
                    </Card.Body>
                  </Card.Root>
                </Grid>

                {/* Exit Strategy Comparison - Moved to bottom of left side */}
                <Card.Root bg="white">
                  <Card.Header p={3}><Text fontSize="20px" fontWeight="bold">Exit Strategy Comparison</Text></Card.Header>
                  <Card.Body p={3}>
                    <Grid templateColumns="repeat(2, 1fr)" gap={3}>
                      <Box p={3} bg="bg.subtle" borderRadius="md" textAlign="center">
                        <Text fontSize="14px" color="fg.muted" mb={1}>Wholesale</Text>
                        <Text fontSize="20px" fontWeight="bold">{fmt(wholesaleProfit)}</Text>
                      </Box>
                      <Box p={3} bg="bg.subtle" borderRadius="md" textAlign="center">
                        <Text fontSize="14px" color="fg.muted" mb={1}>Wholetail</Text>
                        <Text fontSize="20px" fontWeight="bold">{fmt(wholetailProfit)}</Text>
                      </Box>
                      <Box p={3} bg="bg.subtle" borderRadius="md" textAlign="center">
                        <Text fontSize="14px" color="fg.muted" mb={1}>Flip</Text>
                        <Text fontSize="20px" fontWeight="bold">{fmt(flipProfit)}</Text>
                      </Box>
                      <Box p={3} bg="green.50" borderRadius="md" textAlign="center">
                        <Text fontSize="14px" color="green.800" mb={1}>Creative</Text>
                        <Text fontSize="20px" fontWeight="bold" color="green.700">{fmt(creativeProfit)}</Text>
                      </Box>
                    </Grid>
                  </Card.Body>
                </Card.Root>
              </VStack>

              {/* Right Side */}
              <VStack align="stretch" gap={4}>
                <Card.Root bg="white">
                  <Card.Header p={3}><Text fontSize="20px" fontWeight="bold">Rental Analysis</Text></Card.Header>
                  <Card.Body p={3}>
                    <Box overflowX="auto">
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ borderBottom: '2px solid #e2e8f0', backgroundColor: '#f7fafc' }}>
                            <th style={{ padding: '8px', textAlign: 'left', fontSize: '14px', fontWeight: 'bold' }}>Metric</th>
                            <th style={{ padding: '8px', textAlign: 'right', fontSize: '14px', fontWeight: 'bold' }}>STR</th>
                            <th style={{ padding: '8px', textAlign: 'right', fontSize: '14px', fontWeight: 'bold' }}>LTR</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                            <td style={{ padding: '8px', fontSize: '14px' }}>Gross Revenue</td>
                            <td style={{ padding: '8px', textAlign: 'right', fontSize: '14px' }}>{fmt(strGrossRevenue)}</td>
                            <td style={{ padding: '8px', textAlign: 'right', fontSize: '14px' }}>{fmt(ltrGrossRevenue)}</td>
                          </tr>
                          <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                            <td style={{ padding: '8px', fontSize: '14px' }}>Vacancy (10%)</td>
                            <td style={{ padding: '8px', textAlign: 'right', fontSize: '14px', color: '#e53e3e' }}>-{fmt(strVacancy)}</td>
                            <td style={{ padding: '8px', textAlign: 'right', fontSize: '14px', color: '#e53e3e' }}>-{fmt(ltrVacancy)}</td>
                          </tr>
                          <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                            <td style={{ padding: '8px', fontSize: '14px' }}>Mortgage</td>
                            <td style={{ padding: '8px', textAlign: 'right', fontSize: '14px', color: '#e53e3e' }}>-{fmt(refiMortgage)}</td>
                            <td style={{ padding: '8px', textAlign: 'right', fontSize: '14px', color: '#e53e3e' }}>-{fmt(refiMortgage)}</td>
                          </tr>
                          <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                            <td style={{ padding: '8px', fontSize: '14px' }}>Prop Tax + Insurance</td>
                            <td style={{ padding: '8px', textAlign: 'right', fontSize: '14px', color: '#e53e3e' }}>-{fmt(propTaxInsurance)}</td>
                            <td style={{ padding: '8px', textAlign: 'right', fontSize: '14px', color: '#e53e3e' }}>-{fmt(propTaxInsurance)}</td>
                          </tr>
                          <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                            <td style={{ padding: '8px', fontSize: '14px' }}>Utilities</td>
                            <td style={{ padding: '8px', textAlign: 'right', fontSize: '14px', color: '#e53e3e' }}>-{fmt(annualUtilities)}</td>
                            <td style={{ padding: '8px', textAlign: 'right', fontSize: '14px', color: '#e53e3e' }}>-{fmt(annualUtilities)}</td>
                          </tr>
                          <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                            <td style={{ padding: '8px', fontSize: '14px' }}>HOA</td>
                            <td style={{ padding: '8px', textAlign: 'right', fontSize: '14px', color: '#e53e3e' }}>-{fmt(annualHOA)}</td>
                            <td style={{ padding: '8px', textAlign: 'right', fontSize: '14px', color: '#e53e3e' }}>-{fmt(annualHOA)}</td>
                          </tr>
                          <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                            <td style={{ padding: '8px', fontSize: '14px' }}>Operating Expenses (10%)</td>
                            <td style={{ padding: '8px', textAlign: 'right', fontSize: '14px', color: '#e53e3e' }}>-{fmt(strOperatingExpenses)}</td>
                            <td style={{ padding: '8px', textAlign: 'right', fontSize: '14px', color: '#e53e3e' }}>-{fmt(ltrOperatingExpenses)}</td>
                          </tr>
                          <tr style={{ borderBottom: '2px solid #e2e8f0', backgroundColor: '#f7fafc' }}>
                            <td style={{ padding: '8px', fontSize: '14px', fontWeight: 'bold' }}>RENTAL CASH FLOW</td>
                            <td style={{ padding: '8px', textAlign: 'right', fontSize: '14px', fontWeight: 'bold', color: strCashFlow >= 0 ? '#38a169' : '#e53e3e' }}>{fmt(strCashFlow)}</td>
                            <td style={{ padding: '8px', textAlign: 'right', fontSize: '14px', fontWeight: 'bold', color: ltrCashFlow >= 0 ? '#38a169' : '#e53e3e' }}>{fmt(ltrCashFlow)}</td>
                          </tr>
                          <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                            <td style={{ padding: '8px', fontSize: '14px' }}>Principal Paydown</td>
                            <td style={{ padding: '8px', textAlign: 'right', fontSize: '14px' }}>{fmt(principalPaydown)}</td>
                            <td style={{ padding: '8px', textAlign: 'right', fontSize: '14px' }}>{fmt(principalPaydown)}</td>
                          </tr>
                          <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                            <td style={{ padding: '8px', fontSize: '14px' }}>Appreciation (3.9%)</td>
                            <td style={{ padding: '8px', textAlign: 'right', fontSize: '14px' }}>{fmt(appreciation)}</td>
                            <td style={{ padding: '8px', textAlign: 'right', fontSize: '14px' }}>{fmt(appreciation)}</td>
                          </tr>
                          <tr style={{ backgroundColor: '#f7fafc' }}>
                            <td style={{ padding: '8px', fontSize: '14px', fontWeight: 'bold' }}>NET ANNUAL</td>
                            <td style={{ padding: '8px', textAlign: 'right', fontSize: '14px', fontWeight: 'bold' }}>{fmt(strNetAnnual)}</td>
                            <td style={{ padding: '8px', textAlign: 'right', fontSize: '14px', fontWeight: 'bold' }}>{fmt(ltrNetAnnual)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </Box>
                  </Card.Body>
                </Card.Root>

                <Stack gap={4}>
                  {/* ARV Comps Table */}
                  <Card.Root bg="white">
                    <Card.Header p={3}>
                      <HStack justify="space-between">
                        <Text fontSize="20px" fontWeight="bold">ARV Comps</Text>
                        <Box position="relative" w="300px">
                          <Box position="absolute" left="3" top="50%" transform="translateY(-50%)" color="gray.400" zIndex="1">
                            <Search size={16} />
                          </Box>
                          <Input
                            value={arvSearchQuery}
                            onChange={(e) => setArvSearchQuery(e.target.value)}
                            placeholder="Search properties..."
                            pl="10"
                            size="sm"
                            bg="white"
                            border="1px solid"
                            borderColor="gray.300"
                            borderRadius="md"
                          />
                          {arvSearchQuery && filteredARVProperties.length > 0 && (
                            <Box
                              position="absolute"
                              top="100%"
                              left="0"
                              right="0"
                              mt="1"
                              bg="white"
                              border="1px solid"
                              borderColor="gray.200"
                              borderRadius="md"
                              boxShadow="lg"
                              maxH="300px"
                              overflowY="auto"
                              zIndex="10"
                            >
                              {filteredARVProperties.map(p => (
                                <Box
                                  key={p.id}
                                  p="2"
                                  cursor="pointer"
                                  _hover={{ bg: 'blue.50' }}
                                  onClick={() => handleSelectARVProperty(p)}
                                  borderBottom="1px solid"
                                  borderColor="gray.100"
                                >
                                  <HStack justify="space-between">
                                    <VStack align="start" gap="0" flex="1">
                                      <Text fontSize="sm" fontWeight="600">{p.name}</Text>
                                      <Text fontSize="xs" color="gray.600">{fmt(p.price)}</Text>
                                    </VStack>
                                    {propertiesWithAnalysis.has(p.id) && (
                                      <Badge colorPalette="green" size="xs">
                                        <CheckCircle size={10} /> Saved
                                      </Badge>
                                    )}
                                  </HStack>
                                </Box>
                              ))}
                            </Box>
                          )}
                        </Box>
                      </HStack>
                    </Card.Header>
                    <Card.Body p={3}>
                      <Box overflowX="auto">
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ borderBottom: '2px solid #e2e8f0', backgroundColor: '#f7fafc' }}>
                              <th style={{ padding: '8px', textAlign: 'left', fontSize: '14px', fontWeight: 'bold' }}>Address</th>
                              <th style={{ padding: '8px', textAlign: 'right', fontSize: '14px', fontWeight: 'bold' }}>Price</th>
                              <th style={{ padding: '8px', textAlign: 'right', fontSize: '14px', fontWeight: 'bold' }}>Sqft</th>
                              <th style={{ padding: '8px', textAlign: 'right', fontSize: '14px', fontWeight: 'bold' }}>Price/Sqft</th>
                              <th style={{ padding: '8px', textAlign: 'right', fontSize: '14px', fontWeight: 'bold' }}>Date</th>
                              <th style={{ padding: '8px', textAlign: 'center', fontSize: '14px', fontWeight: 'bold', width: '60px' }}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {arvComps.length === 0 ? (
                              <tr>
                                <td colSpan="6" style={{ padding: '24px', textAlign: 'center', color: '#718096', fontSize: '14px' }}>
                                  No comps added yet. Select a property from the dropdown above.
                                </td>
                              </tr>
                            ) : (
                              <>
                                {arvComps.map(comp => {
                                  const pricePerSqft = comp.linkedData.sqft > 0 ? comp.linkedData.price / comp.linkedData.sqft : 0;
                                  return (
                                    <tr key={comp.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                      <td style={{ padding: '8px', fontSize: '14px' }}>{comp.linkedData.address}</td>
                                      <td style={{ padding: '8px', textAlign: 'right', fontSize: '14px' }}>{fmt(comp.linkedData.price)}</td>
                                      <td style={{ padding: '8px', textAlign: 'right', fontSize: '14px' }}>{comp.linkedData.sqft.toLocaleString()}</td>
                                      <td style={{ padding: '8px', textAlign: 'right', fontSize: '14px' }}>{pricePerSqft > 0 ? `$${Math.round(pricePerSqft)}` : '-'}</td>
                                      <td style={{ padding: '8px', textAlign: 'right', fontSize: '14px' }}>{comp.linkedData.date}</td>
                                      <td style={{ padding: '4px', textAlign: 'center' }}>
                                        <Button size="xs" variant="ghost" colorPalette="red" onClick={() => handleDeleteARVComp(comp.id)}>Delete</Button>
                                      </td>
                                    </tr>
                                  );
                                })}
                                {arvComps.length > 0 && (
                                  <tr style={{ backgroundColor: '#edf2f7' }}>
                                    <td style={{ padding: '8px', fontSize: '14px', fontWeight: 'bold' }}>Average</td>
                                    <td style={{ padding: '8px', textAlign: 'right', fontSize: '14px', fontWeight: 'bold' }}>
                                      {fmt(arvComps.reduce((sum, c) => sum + c.linkedData.price, 0) / arvComps.length)}
                                    </td>
                                    <td style={{ padding: '8px', textAlign: 'right', fontSize: '14px', fontWeight: 'bold' }}>
                                      {Math.round(arvComps.reduce((sum, c) => sum + c.linkedData.sqft, 0) / arvComps.length).toLocaleString()}
                                    </td>
                                    <td style={{ padding: '8px', textAlign: 'right', fontSize: '14px', fontWeight: 'bold' }}>
                                      {arvComps.reduce((sum, c) => sum + c.linkedData.sqft, 0) > 0 
                                        ? `$${Math.round(arvComps.reduce((sum, c) => sum + c.linkedData.price, 0) / arvComps.reduce((sum, c) => sum + c.linkedData.sqft, 0))}` 
                                        : '-'}
                                    </td>
                                    <td style={{ padding: '8px', textAlign: 'right', fontSize: '14px', fontWeight: 'bold' }}>-</td>
                                    <td></td>
                                  </tr>
                                )}
                              </>
                            )}
                          </tbody>
                        </table>
                      </Box>
                    </Card.Body>
                  </Card.Root>

                  {/* FMV Comps Table */}
                  <Card.Root bg="white">
                    <Card.Header p={3}>
                      <HStack justify="space-between">
                        <Text fontSize="20px" fontWeight="bold">FMV Comps</Text>
                        <Box position="relative" w="300px">
                          <Box position="absolute" left="3" top="50%" transform="translateY(-50%)" color="gray.400" zIndex="1">
                            <Search size={16} />
                          </Box>
                          <Input
                            value={fmvSearchQuery}
                            onChange={(e) => setFmvSearchQuery(e.target.value)}
                            placeholder="Search properties..."
                            pl="10"
                            size="sm"
                            bg="white"
                            border="1px solid"
                            borderColor="gray.300"
                            borderRadius="md"
                          />
                          {fmvSearchQuery && filteredFMVProperties.length > 0 && (
                            <Box
                              position="absolute"
                              top="100%"
                              left="0"
                              right="0"
                              mt="1"
                              bg="white"
                              border="1px solid"
                              borderColor="gray.200"
                              borderRadius="md"
                              boxShadow="lg"
                              maxH="300px"
                              overflowY="auto"
                              zIndex="10"
                            >
                              {filteredFMVProperties.map(p => (
                                <Box
                                  key={p.id}
                                  p="2"
                                  cursor="pointer"
                                  _hover={{ bg: 'blue.50' }}
                                  onClick={() => handleSelectFMVProperty(p)}
                                  borderBottom="1px solid"
                                  borderColor="gray.100"
                                >
                                  <HStack justify="space-between">
                                    <VStack align="start" gap="0" flex="1">
                                      <Text fontSize="sm" fontWeight="600">{p.name}</Text>
                                      <Text fontSize="xs" color="gray.600">{fmt(p.price)}</Text>
                                    </VStack>
                                    {propertiesWithAnalysis.has(p.id) && (
                                      <Badge colorPalette="green" size="xs">
                                        <CheckCircle size={10} /> Saved
                                      </Badge>
                                    )}
                                  </HStack>
                                </Box>
                              ))}
                            </Box>
                          )}
                        </Box>
                      </HStack>
                    </Card.Header>
                    <Card.Body p={3}>
                      <Box overflowX="auto">
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ borderBottom: '2px solid #e2e8f0', backgroundColor: '#f7fafc' }}>
                              <th style={{ padding: '8px', textAlign: 'left', fontSize: '14px', fontWeight: 'bold' }}>Address</th>
                              <th style={{ padding: '8px', textAlign: 'right', fontSize: '14px', fontWeight: 'bold' }}>Price</th>
                              <th style={{ padding: '8px', textAlign: 'right', fontSize: '14px', fontWeight: 'bold' }}>Sqft</th>
                              <th style={{ padding: '8px', textAlign: 'right', fontSize: '14px', fontWeight: 'bold' }}>Price/Sqft</th>
                              <th style={{ padding: '8px', textAlign: 'right', fontSize: '14px', fontWeight: 'bold' }}>Date</th>
                              <th style={{ padding: '8px', textAlign: 'center', fontSize: '14px', fontWeight: 'bold', width: '60px' }}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {fmvComps.length === 0 ? (
                              <tr>
                                <td colSpan="6" style={{ padding: '24px', textAlign: 'center', color: '#718096', fontSize: '14px' }}>
                                  No comps added yet. Select a property from the dropdown above.
                                </td>
                              </tr>
                            ) : (
                              <>
                                {fmvComps.map(comp => {
                                  const pricePerSqft = comp.linkedData.sqft > 0 ? comp.linkedData.price / comp.linkedData.sqft : 0;
                                  return (
                                    <tr key={comp.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                      <td style={{ padding: '8px', fontSize: '14px' }}>{comp.linkedData.address}</td>
                                      <td style={{ padding: '8px', textAlign: 'right', fontSize: '14px' }}>{fmt(comp.linkedData.price)}</td>
                                      <td style={{ padding: '8px', textAlign: 'right', fontSize: '14px' }}>{comp.linkedData.sqft.toLocaleString()}</td>
                                      <td style={{ padding: '8px', textAlign: 'right', fontSize: '14px' }}>{pricePerSqft > 0 ? `$${Math.round(pricePerSqft)}` : '-'}</td>
                                      <td style={{ padding: '8px', textAlign: 'right', fontSize: '14px' }}>{comp.linkedData.date}</td>
                                      <td style={{ padding: '4px', textAlign: 'center' }}>
                                        <Button size="xs" variant="ghost" colorPalette="red" onClick={() => handleDeleteFMVComp(comp.id)}>Delete</Button>
                                      </td>
                                    </tr>
                                  );
                                })}
                                {fmvComps.length > 0 && (
                                  <tr style={{ backgroundColor: '#edf2f7' }}>
                                    <td style={{ padding: '8px', fontSize: '14px', fontWeight: 'bold' }}>Average</td>
                                    <td style={{ padding: '8px', textAlign: 'right', fontSize: '14px', fontWeight: 'bold' }}>
                                      {fmt(fmvComps.reduce((sum, c) => sum + c.linkedData.price, 0) / fmvComps.length)}
                                    </td>
                                    <td style={{ padding: '8px', textAlign: 'right', fontSize: '14px', fontWeight: 'bold' }}>
                                      {Math.round(fmvComps.reduce((sum, c) => sum + c.linkedData.sqft, 0) / fmvComps.length).toLocaleString()}
                                    </td>
                                    <td style={{ padding: '8px', textAlign: 'right', fontSize: '14px', fontWeight: 'bold' }}>
                                      {fmvComps.reduce((sum, c) => sum + c.linkedData.sqft, 0) > 0 
                                        ? `$${Math.round(fmvComps.reduce((sum, c) => sum + c.linkedData.price, 0) / fmvComps.reduce((sum, c) => sum + c.linkedData.sqft, 0))}` 
                                        : '-'}
                                    </td>
                                    <td style={{ padding: '8px', textAlign: 'right', fontSize: '14px', fontWeight: 'bold' }}>-</td>
                                    <td></td>
                                  </tr>
                                )}
                              </>
                            )}
                          </tbody>
                        </table>
                      </Box>
                    </Card.Body>
                  </Card.Root>
                </Stack>
              </VStack>
            </Grid>
          </VStack>
        )}
          </VStack>
        </Box>
      )}
    </Flex>
  );
}
