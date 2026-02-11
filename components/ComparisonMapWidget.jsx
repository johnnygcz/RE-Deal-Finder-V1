import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon, Tooltip, useMap } from 'react-leaflet';
import { Box, Text, Badge, HStack, Stack } from '@chakra-ui/react';
import { Home, MapPin } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { windsorWards } from '../data/windsorWards';

// Fix default marker icon issue in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icon for selected property (red)
const selectedIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Function to create numbered icon for comparables
const createNumberedIcon = (number) => {
  return new L.DivIcon({
    html: `
      <div style="
        position: relative;
        width: 25px;
        height: 41px;
      ">
        <img 
          src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png"
          style="width: 25px; height: 41px;"
        />
        <div style="
          position: absolute;
          top: 8px;
          left: 50%;
          transform: translateX(-50%);
          background: white;
          color: #3182ce;
          font-weight: bold;
          font-size: 11px;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #3182ce;
        ">${number}</div>
      </div>
    `,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    className: 'numbered-marker-icon'
  });
};

function MapBounds({ selectedProperty, comparables }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    // Wait for map to be fully ready
    const timer = setTimeout(() => {
      try {
        const bounds = [];
        
        // Add selected property with strict validation
        if (selectedProperty?.address?.lat && selectedProperty?.address?.lng) {
          const lat = parseFloat(selectedProperty.address.lat);
          const lng = parseFloat(selectedProperty.address.lng);
          if (!isNaN(lat) && !isNaN(lng) && isFinite(lat) && isFinite(lng)) {
            bounds.push([lat, lng]);
          } else {
            console.warn('Selected property has invalid coordinates:', { lat, lng });
          }
        } else {
          console.warn('Selected property missing coordinates:', selectedProperty?.name);
        }
        
        // Add comparables with strict validation
        comparables.forEach(comp => {
          if (comp.address?.lat && comp.address?.lng) {
            const lat = parseFloat(comp.address.lat);
            const lng = parseFloat(comp.address.lng);
            if (!isNaN(lat) && !isNaN(lng) && isFinite(lat) && isFinite(lng)) {
              bounds.push([lat, lng]);
            } else {
              console.warn('Comparable has invalid coordinates:', comp.name, { lat, lng });
            }
          } else {
            console.warn('Comparable missing coordinates:', comp.name);
          }
        });
        
        if (bounds.length > 0 && map._loaded) {
          map.fitBounds(bounds, { 
            padding: [50, 50], 
            maxZoom: 15,
            animate: false 
          });
        } else {
          console.warn('No valid coordinates available for map bounds. Selected:', !!selectedProperty?.address?.lat, 'Comparables:', comparables.length);
        }
      } catch (error) {
        console.error('Error in MapBounds:', error);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [map, selectedProperty, comparables]);

  return null;
}

export default function ComparisonMapWidget({ selectedProperty, comparables = [], onCompClick }) {
  const [mapKey, setMapKey] = useState(0);

  // Validate coordinates
  const centerLat = parseFloat(selectedProperty?.address?.lat);
  const centerLng = parseFloat(selectedProperty?.address?.lng);
  
  const hasValidCenter = !isNaN(centerLat) && !isNaN(centerLng) && 
                        isFinite(centerLat) && isFinite(centerLng);

  // Filter valid comparables
  const validComparables = useMemo(() => {
    return comparables.filter(comp => {
      const lat = parseFloat(comp.address?.lat);
      const lng = parseFloat(comp.address?.lng);
      return !isNaN(lat) && !isNaN(lng) && isFinite(lat) && isFinite(lng);
    });
  }, [comparables]);

  // Remount map when selected property changes
  useEffect(() => {
    setMapKey(prev => prev + 1);
  }, [selectedProperty?.id]);

  if (!hasValidCenter) {
    return (
      <Box h="600px" bg="bg.subtle" borderRadius="md" display="flex" alignItems="center" justifyContent="center">
        <Text color="fg.muted">No location data available for this property</Text>
      </Box>
    );
  }

  const defaultCenter = [centerLat, centerLng];

  return (
    <Box h="600px" borderRadius="md" overflow="hidden" border="1px solid" borderColor="border.muted">
      <MapContainer
        key={mapKey}
        center={defaultCenter}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
        whenReady={() => {
          console.log('Map ready');
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapBounds selectedProperty={selectedProperty} comparables={validComparables} />
        
        {/* Ward Boundaries - All Wards (matching main map styling) */}
        {windsorWards.features.map((ward) => (
          <Polygon
            key={ward.properties.NUMBER}
            positions={ward.geometry.coordinates[0].map(coord => [coord[1], coord[0]])}
            pathOptions={{
              color: ward.properties.color,
              weight: 3,
              opacity: 0.7,
              fillColor: ward.properties.color,
              fillOpacity: 0.7
            }}
          >
            <Tooltip permanent direction="center" className="ward-label">
              <Box textAlign="center" bg="white" p={1} borderRadius="md" boxShadow="sm">
                <Text fontSize="xs" fontWeight="bold" color={ward.properties.color}>
                  Ward {ward.properties.NUMBER}
                </Text>
              </Box>
            </Tooltip>
          </Polygon>
        ))}
        
        {/* Selected Property Marker (Red) */}
        <Marker 
          position={defaultCenter}
          icon={selectedIcon}
        >
          <Popup>
            <Box p={1} minW="150px">
              <HStack gap={1} mb={1}>
                <Home size={14} />
                <Text fontWeight="bold" fontSize="xs">SELECTED</Text>
              </HStack>
              <Text fontSize="xs" lineClamp={2}>{selectedProperty.name}</Text>
              <Text fontSize="xs" fontWeight="bold" color="blue.600" mt={1}>
                ${selectedProperty.price?.toLocaleString() || 'N/A'}
              </Text>
              {selectedProperty.wards && (
                <Badge size="xs" colorPalette="purple" mt={1}>{selectedProperty.wards}</Badge>
              )}
            </Box>
          </Popup>
        </Marker>
        
        {/* Comparable Property Markers (Blue with Numbers) */}
        {validComparables.map((comp) => {
          const lat = parseFloat(comp.address.lat);
          const lng = parseFloat(comp.address.lng);
          
          return (
            <Marker 
              key={comp.id} 
              position={[lat, lng]}
              icon={createNumberedIcon(comp.compIndex || '?')}
            >
              <Popup>
                <Box p={2} minW="180px">
                  <HStack gap={1} mb={2}>
                    <MapPin size={14} />
                    <Text fontSize="xs" fontWeight="semibold" color="blue.600">
                      Comp #{comp.compIndex || '?'}
                    </Text>
                  </HStack>
                  <Text fontSize="xs" lineClamp={2} mb={2}>{comp.name}</Text>
                  
                  <Stack gap={1} mb={2} fontSize="xs">
                    <HStack justify="space-between">
                      <Text color="fg.muted">Price:</Text>
                      <Text fontWeight="bold">${comp.price?.toLocaleString() || 'N/A'}</Text>
                    </HStack>
                    
                    {comp.daysOnMarket != null && (
                      <HStack justify="space-between">
                        <Text color="fg.muted">DOM:</Text>
                        <Text fontWeight="medium">{Math.round(comp.daysOnMarket)} days</Text>
                      </HStack>
                    )}
                    
                    {comp.wards && (
                      <HStack justify="space-between">
                        <Text color="fg.muted">Ward:</Text>
                        <Badge size="xs" colorPalette="teal">{comp.wards}</Badge>
                      </HStack>
                    )}
                    
                    {comp.scores?.global != null && (
                      <HStack justify="space-between">
                        <Text color="fg.muted">Score:</Text>
                        <Badge size="xs" colorPalette="green">
                          {Math.round(comp.scores.global)}
                        </Badge>
                      </HStack>
                    )}
                  </Stack>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onCompClick) {
                        onCompClick(comp);
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '6px 12px',
                      backgroundColor: '#3182ce',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2c5aa0'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3182ce'}
                  >
                    View Details
                  </button>
                </Box>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </Box>
  );
}
