import React, { useMemo, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import { Box, Stack, HStack, VStack, Text, Badge, Card, Button } from '@chakra-ui/react';
import { MapPin, Home, DollarSign, Calendar, MapPinned, TrendingDown } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { windsorWards, getWardCentroid } from '../data/windsorWards';
import PropertyCard from './PropertyCard';

// Zoom threshold for full price label display
const ZOOM_THRESHOLD = 14; // >= 14 shows all price labels, < 14 shows selective labels

// Format price as abbreviated string (e.g., 350450 -> "350K")
const formatPriceLabel = (price) => {
  if (!price || price <= 0) return '$0';
  const thousands = Math.round(price / 1000);
  return `$${thousands}K`;
};

// ============================================================================
// CACHED ICON SYSTEM - Zero allocations during render
// ============================================================================

// Static dot icons (created once, reused forever)
const DOT_ICON = L.divIcon({
  html: `<div style="
    background: #e2445c;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    border: 2px solid white;
    box-shadow: 0 1px 3px rgba(0,0,0,0.4);
  "></div>`,
  className: 'custom-dot-marker',
  iconSize: [8, 8],
  iconAnchor: [4, 4],
  popupAnchor: [0, -4]
});

const GREY_DOT_ICON = L.divIcon({
  html: `<div style="
    background: #9ca3af;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    border: 2px solid white;
    box-shadow: 0 1px 3px rgba(0,0,0,0.3);
  "></div>`,
  className: 'custom-grey-dot-marker',
  iconSize: [8, 8],
  iconAnchor: [4, 4],
  popupAnchor: [0, -4]
});

// Price icon caches - keyed by price band (rounded to nearest $25k)
const priceIconCache = new Map();
const greyPriceIconCache = new Map();
const highlightedPriceIconCache = new Map();

// Get or create cached price icon for active listings
const getPriceIcon = (price) => {
  const band = Math.round((price || 0) / 25000);
  
  if (!priceIconCache.has(band)) {
    const priceLabel = formatPriceLabel(price);
    const icon = L.divIcon({
      html: `<div style="
        background: #e2445c;
        color: white;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: bold;
        white-space: nowrap;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        text-align: center;
      ">${priceLabel}</div>`,
      className: 'custom-price-marker',
      iconSize: [60, 24],
      iconAnchor: [30, 12],
      popupAnchor: [0, -12]
    });
    priceIconCache.set(band, icon);
  }
  
  return priceIconCache.get(band);
};

// Get or create cached price icon for HIGHLIGHTED active listings (Blue)
const getHighlightedPriceIcon = (price) => {
  const band = Math.round((price || 0) / 25000);
  
  if (!highlightedPriceIconCache.has(band)) {
    const priceLabel = formatPriceLabel(price);
    const icon = L.divIcon({
      html: `<div style="
        background: #2563eb; /* Blue to match Top Properties badge */
        color: white;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: bold;
        white-space: nowrap;
        box-shadow: 0 0 0 2px white, 0 2px 6px rgba(0,0,0,0.4); /* Added white border */
        text-align: center;
        z-index: 1000;
      ">${priceLabel}</div>`,
      className: 'custom-highlighted-price-marker',
      iconSize: [60, 24],
      iconAnchor: [30, 12],
      popupAnchor: [0, -12]
    });
    highlightedPriceIconCache.set(band, icon);
  }
  
  return highlightedPriceIconCache.get(band);
};

// Get or create cached price icon for removed listings
const getGreyPriceIcon = (price) => {
  const band = Math.round((price || 0) / 25000);
  
  if (!greyPriceIconCache.has(band)) {
    const priceLabel = formatPriceLabel(price);
    const icon = L.divIcon({
      html: `<div style="
        background: #9ca3af;
        color: white;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: bold;
        white-space: nowrap;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        text-align: center;
      ">${priceLabel}</div>`,
      className: 'custom-grey-price-marker',
      iconSize: [60, 24],
      iconAnchor: [30, 12],
      popupAnchor: [0, -12]
    });
    greyPriceIconCache.set(band, icon);
  }
  
  return greyPriceIconCache.get(band);
};

// Auto-fit map bounds to markers (constrained to Windsor area)
// ONLY runs on initial load, never after user has interacted with map
function MapBounds({ properties, windsorBounds, hasUserInteracted }) {
  const map = useMap();
  
  React.useEffect(() => {
    // CRITICAL: Skip auto-fit if user has already moved/zoomed the map
    if (!map || properties.length === 0 || hasUserInteracted) return;

    // Wait for map to be fully ready
    const timer = setTimeout(() => {
      try {
        const [[minLat, minLng], [maxLat, maxLng]] = windsorBounds;
        
        // Only include properties within Windsor bounds with valid coordinates
        const bounds = properties
          .filter(p => {
            // Strict validation: must have address object with lat and lng
            if (!p.address || !p.address.lat || !p.address.lng) {
              return false;
            }
            const lat = parseFloat(p.address.lat);
            const lng = parseFloat(p.address.lng);
            // Must be valid numbers within Windsor bounds
            return !isNaN(lat) && !isNaN(lng) && isFinite(lat) && isFinite(lng) &&
                   lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng;
          })
          .map(p => [parseFloat(p.address.lat), parseFloat(p.address.lng)]);
        
        if (bounds.length > 0 && map._loaded) {
          map.fitBounds(bounds, { 
            padding: [50, 50],
            animate: false 
          });
        } else if (bounds.length === 0) {
          console.warn('No properties with valid coordinates found for map bounds');
        }
      } catch (error) {
        console.error('Error in MapBounds:', error);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [properties, map, windsorBounds, hasUserInteracted]);
  
  return null;
}

// Viewport and zoom tracker for selective marker rendering with debouncing
// Also tracks user interaction to prevent auto-reset of zoom/center
function ViewportTracker({ onViewportChange, onUserInteraction, properties }) {
  const map = useMap();
  const debounceTimerRef = React.useRef(null);
  
  const updateViewport = useCallback(() => {
    if (!map) return;
    
    // Clear any pending debounced update
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Debounce viewport updates by 300ms to reduce recomputation frequency
    // Slightly increased from 200ms for better performance with large datasets
    debounceTimerRef.current = setTimeout(() => {
      const zoom = map.getZoom();
      const bounds = map.getBounds();
      
      onViewportChange({ zoom, bounds });
    }, 300);
  }, [map, onViewportChange]);
  
  // Track user interaction events (pan, zoom, drag)
  useMapEvents({
    zoomstart: () => {
      // User initiated zoom - mark as interacted
      onUserInteraction();
    },
    dragstart: () => {
      // User initiated pan - mark as interacted
      onUserInteraction();
    },
    movestart: () => {
      // User initiated move - mark as interacted
      onUserInteraction();
    },
    zoomend: updateViewport,
    moveend: updateViewport
  });
  
  // Initial viewport calculation (no debounce for first load)
  React.useEffect(() => {
    if (!map) return;
    const zoom = map.getZoom();
    const bounds = map.getBounds();
    onViewportChange({ zoom, bounds });
  }, [map, onViewportChange]);
  
  // Cleanup debounce timer on unmount
  React.useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);
  
  return null;
}

export default function MapWidget({ properties, onPropertyClick, favorites, toggleFavorite, visibleCardIds }) {
  const [currentZoom, setCurrentZoom] = useState(12);
  const [currentBounds, setCurrentBounds] = useState(null);
  const [labeledPropertyIds, setLabeledPropertyIds] = useState(new Set());
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  
  // Cache for label selection results - keyed by viewport bounds + zoom + visibleCardIds hash
  const labelCacheRef = React.useRef(new Map());
  
  // Calculate Windsor bounding box from ward data
  const windsorBounds = useMemo(() => {
    let minLat = Infinity, maxLat = -Infinity;
    let minLng = Infinity, maxLng = -Infinity;
    
    windsorWards.features.forEach(ward => {
      ward.geometry.coordinates[0].forEach(coord => {
        const [lng, lat] = coord;
        minLat = Math.min(minLat, lat);
        maxLat = Math.max(maxLat, lat);
        minLng = Math.min(minLng, lng);
        maxLng = Math.max(maxLng, lng);
      });
    });
    
    // Add small padding to bounds
    const latPadding = (maxLat - minLat) * 0.05;
    const lngPadding = (maxLng - minLng) * 0.05;
    
    return [
      [minLat - latPadding, minLng - lngPadding], // Southwest
      [maxLat + latPadding, maxLng + lngPadding]  // Northeast
    ];
  }, []);
  
  // Pre-normalize coordinates and flags - zero parsing in render loop
  const mappableProperties = useMemo(() => {
    const [[minLat, minLng], [maxLat, maxLng]] = windsorBounds;
    
    return properties
      .map(p => {
        if (!p.address?.lat || !p.address?.lng) return null;
        
        const latNum = parseFloat(p.address.lat);
        const lngNum = parseFloat(p.address.lng);
        
        if (isNaN(latNum) || isNaN(lngNum)) return null;
        
        // Only include properties within Windsor bounds
        if (latNum < minLat || latNum > maxLat || lngNum < minLng || lngNum > maxLng) {
          return null;
        }
        
        // Pre-compute flags for render loop
        return {
          ...p,
          latNum,
          lngNum,
          isRemoved: p.listingStatus === 'Removed'
        };
      })
      .filter(Boolean);
  }, [properties, windsorBounds]);

  // Limit markers at low zoom for performance
  const visibleProperties = useMemo(() => {
    // If no bounds yet, return all mappable properties
    if (!currentBounds) return mappableProperties;

    // At low zoom (<=11) with many properties, cap the number of markers rendered
    if (currentZoom <= 11 && mappableProperties.length > 400) {
      // Prioritize by price (descending) and take top 400
      const sorted = [...mappableProperties].sort((a, b) => (b.price || 0) - (a.price || 0));
      return sorted.slice(0, 400);
    }

    // Otherwise, render all mappable properties
    return mappableProperties;
  }, [mappableProperties, currentZoom, currentBounds]);

  const defaultCenter = [42.3149, -83.0364]; // Windsor, ON
  
  // Handle viewport changes (zoom + pan)
  const handleViewportChange = useCallback(({ zoom, bounds }) => {
    setCurrentZoom(zoom);
    setCurrentBounds(bounds);
  }, []);
  
  // Handle user interaction (mark that user has moved/zoomed the map)
  const handleUserInteraction = useCallback(() => {
    if (!hasUserInteracted) {
      console.log('User has interacted with map - disabling auto-fit');
      setHasUserInteracted(true);
    }
  }, [hasUserInteracted]);
  
  // Memoized marker selection with cache to prevent recalculation during pan/zoom
  const selectMarkersForLabels = useCallback((zoom, bounds, properties, priorityIds) => {
    // At high zoom (14+), show all price labels
    if (zoom >= ZOOM_THRESHOLD) {
      return new Set(properties.map(p => p.id));
    }
    
    // At lower zoom, show selective labels to prevent overlap
    if (!bounds) return new Set();
    
    // Create cache key from viewport bounds + zoom + priority IDs hash (to invalidate when sidebar changes)
    // Simple hash of priority IDs size/first ID to detect changes
    const priorityHash = priorityIds ? `${priorityIds.size}-${Array.from(priorityIds)[0] || ''}` : '0';
    const cacheKey = `${zoom}-${Math.round(bounds.getNorth() * 100)}-${Math.round(bounds.getSouth() * 100)}-${Math.round(bounds.getEast() * 100)}-${Math.round(bounds.getWest() * 100)}-${priorityHash}`;
    
    // Check cache first - return immediately if we've computed this viewport before
    if (labelCacheRef.current.has(cacheKey)) {
      return labelCacheRef.current.get(cacheKey);
    }
    
    // Filter to properties in viewport (use pre-normalized coordinates)
    const inViewport = properties.filter(p => {
      return bounds.contains([p.latNum, p.lngNum]);
    });
    
    if (inViewport.length === 0) {
      const emptySet = new Set();
      labelCacheRef.current.set(cacheKey, emptySet);
      return emptySet;
    }
    
    // Calculate how many labels to show based on zoom level
    let labelPercentage = 0.05;
    if (zoom >= 12) labelPercentage = 0.15;
    if (zoom >= 13) labelPercentage = 0.25;
    
    const targetCount = Math.max(5, Math.floor(inViewport.length * labelPercentage));
    const selected = new Set();

    // 1. PRIORITY SELECTION: Always select properties visible in the sidebar
    if (priorityIds && priorityIds.size > 0) {
      for (const prop of inViewport) {
        if (priorityIds.has(prop.id)) {
          selected.add(prop.id);
        }
      }
    }

    // If we've already met or exceeded target count with priority items, we might stop here
    // But we usually want to fill the map a bit more if space allows, 
    // or at least ensure we don't ONLY show sidebar items if the map is huge.
    // Let's allow filling up to targetCount + priority items count to ensure map isn't empty elsewhere.
    
    const remainingSlots = Math.max(0, targetCount - selected.size);

    if (remainingSlots > 0) {
      // PERFORMANCE OPTIMIZATION: Limit sort cost for large datasets
      const SAMPLE_LIMIT = 600;
      const toSort = inViewport.length > SAMPLE_LIMIT 
        ? inViewport.slice(0, SAMPLE_LIMIT) 
        : inViewport;
      
      // Sort by price (descending) and recency
      const sorted = [...toSort].sort((a, b) => {
        const priceDiff = (b.price || 0) - (a.price || 0);
        if (Math.abs(priceDiff) > 10000) return priceDiff;
        const aDate = a.column1stListingDate ? new Date(a.column1stListingDate).getTime() : 0;
        const bDate = b.column1stListingDate ? new Date(b.column1stListingDate).getTime() : 0;
        return bDate - aDate;
      });
      
      // Select with spatial distribution
      const gridSize = Math.ceil(Math.sqrt(targetCount));
      const latRange = bounds.getNorth() - bounds.getSouth();
      const lngRange = bounds.getEast() - bounds.getWest();
      
      const latStep = latRange > 0 ? latRange / gridSize : 0.01;
      const lngStep = lngRange > 0 ? lngRange / gridSize : 0.01;
      
      const cells = new Map();
      
      // Mark cells occupied by priority items
      for (const id of selected) {
        const prop = inViewport.find(p => p.id === id);
        if (prop) {
          const cellKey = `${Math.floor((prop.latNum - bounds.getSouth()) / latStep)}-${Math.floor((prop.lngNum - bounds.getWest()) / lngStep)}`;
          cells.set(cellKey, true);
        }
      }

      // Fill remaining slots
      for (const prop of sorted) {
        if (selected.has(prop.id)) continue; // Skip already selected

        const cellKey = `${Math.floor((prop.latNum - bounds.getSouth()) / latStep)}-${Math.floor((prop.lngNum - bounds.getWest()) / lngStep)}`;
        
        if (!cells.has(cellKey)) {
          cells.set(cellKey, true);
          selected.add(prop.id);
          if (selected.size >= targetCount + (priorityIds?.size || 0)) break; // Soft limit
        }
      }
    }
    
    // Store in cache and return
    labelCacheRef.current.set(cacheKey, selected);
    return selected;
  }, []);
  
  // Recompute labeled markers when viewport or properties change
  React.useEffect(() => {
    if (currentBounds && visibleProperties.length > 0) {
      const selected = selectMarkersForLabels(currentZoom, currentBounds, visibleProperties, visibleCardIds);
      setLabeledPropertyIds(selected);
    }
  }, [currentZoom, currentBounds, visibleProperties, selectMarkersForLabels, visibleCardIds]);

  return (
    <Box position="relative" height="100%" width="100%" borderRadius="lg" overflow="hidden" border="1px solid" borderColor="border.muted">
      <MapContainer
        center={defaultCenter}
        zoom={12}
        maxBounds={windsorBounds}
        maxBoundsViscosity={1.0}
        minZoom={10}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapBounds 
          properties={visibleProperties} 
          windsorBounds={windsorBounds}
          hasUserInteracted={hasUserInteracted}
        />
        <ViewportTracker 
          onViewportChange={handleViewportChange}
          onUserInteraction={handleUserInteraction}
          properties={visibleProperties}
        />
        
        {/* Ward Boundaries - Softer Opacity */}
        {windsorWards.features.map((ward) => (
          <Polygon
            key={ward.properties.NUMBER}
            positions={ward.geometry.coordinates[0].map(coord => [coord[1], coord[0]])}
            pathOptions={{
              color: ward.properties.color,
              weight: 2,
              opacity: 0.5,
              fillColor: ward.properties.color,
              fillOpacity: 0.15
            }}
          >
            <Tooltip permanent direction="center" className="ward-label">
              <Box textAlign="center" bg="whiteAlpha.800" p={1} borderRadius="sm" boxShadow="sm">
                <Text fontSize="xs" fontWeight="bold" color={ward.properties.color}>
                  W{ward.properties.NUMBER}
                </Text>
              </Box>
            </Tooltip>
          </Polygon>
        ))}
        
        {/* Individual property markers - ZERO allocations per render */}
        {visibleProperties.map((property) => {
          const isFavorited = favorites?.has(property.id) || false;
          const isHighlighted = visibleCardIds?.has(property.id);
          const shouldShowLabel = labeledPropertyIds.has(property.id) || isHighlighted; // Always show label if highlighted
          
          // Determine icon based on status and label selection (use cached icons)
          let icon;
          if (property.isRemoved) {
            // Removed listings: grey icons (cached)
            icon = shouldShowLabel ? getGreyPriceIcon(property.price) : GREY_DOT_ICON;
          } else {
            // Active listings: red icons (cached)
            if (shouldShowLabel) {
              // Use highlighted blue icon for sidebar properties, standard red for others
              icon = isHighlighted ? getHighlightedPriceIcon(property.price) : getPriceIcon(property.price);
            } else {
              icon = DOT_ICON;
            }
          }
          
          return (
            <Marker
              key={property.id}
              position={[property.latNum, property.lngNum]}
              icon={icon}
              zIndexOffset={isHighlighted ? 1000 : 0} // Bring highlighted markers to front
            >
              <Popup maxWidth={350} minWidth={320}>
                <Box 
                  onClick={(e) => {
                    e.stopPropagation();
                    onPropertyClick?.(property);
                  }}
                  cursor="pointer"
                >
                  {/* Reuse PropertyCard component with compact mode and realtor company */}
                  <PropertyCard
                    property={property}
                    onSelect={() => onPropertyClick?.(property)}
                    isSelected={false}
                    isFavorited={isFavorited}
                    onToggleFavorite={toggleFavorite}
                    showRealtorCompany={true}
                    compact={true}
                  />
                </Box>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Reset View Button - Bottom Left (only when user has interacted) */}
      {hasUserInteracted && (
        <Box 
          position="absolute" 
          bottom={4} 
          left={4} 
          zIndex={1000}
        >
          <Button
            size="sm"
            variant="solid"
            colorPalette="blue"
            onClick={() => {
              console.log('Resetting map view to Windsor bounds');
              setHasUserInteracted(false);
            }}
            boxShadow="lg"
          >
            Reset View
          </Button>
        </Box>
      )}
    </Box>
  );
}
