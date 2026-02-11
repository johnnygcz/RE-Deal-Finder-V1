
import React, { useState, useMemo } from 'react';
import {
  Box, Card, Stack, HStack, Text, Button, Input, Slider,
  Checkbox, Badge, Collapsible, createListCollection, Select, Portal, SimpleGrid
} from '@chakra-ui/react';
import { Filter, X, ChevronDown, ChevronRight } from 'lucide-react';

export default function FilterPanel({ filters, onChange, onClear, properties }) {
  const [isOpen, setIsOpen] = useState(true); // Default to expanded so filters are visible
  
  // Local state for immediate UI updates (no debounce lag)
  // CRITICAL: Always ensure string values to prevent controlled/uncontrolled warnings
  const [localPriceMin, setLocalPriceMin] = useState(() => {
    const val = filters.priceRange?.min;
    return val !== undefined && val !== null ? String(val) : '';
  });
  const [localPriceMax, setLocalPriceMax] = useState(() => {
    const val = filters.priceRange?.max;
    return val !== undefined && val !== null ? String(val) : '';
  });
  const [localDomMin, setLocalDomMin] = useState(() => {
    const val = filters.domRange?.min;
    return val !== undefined && val !== null ? String(val) : '';
  });
  const [localDomMax, setLocalDomMax] = useState(() => {
    const val = filters.domRange?.max;
    return val !== undefined && val !== null ? String(val) : '';
  });
  
  // Debounce timer refs
  const priceDebounceRef = React.useRef(null);
  const domDebounceRef = React.useRef(null);
  
  // Sync local state when filters change externally (e.g., clear all)
  // CRITICAL: Always convert to strings to prevent controlled/uncontrolled warnings
  React.useEffect(() => {
    const priceMin = filters.priceRange?.min;
    const priceMax = filters.priceRange?.max;
    const domMin = filters.domRange?.min;
    const domMax = filters.domRange?.max;
    
    // Explicitly convert to string, using empty string for null/undefined
    setLocalPriceMin(priceMin != null ? String(priceMin) : '');
    setLocalPriceMax(priceMax != null ? String(priceMax) : '');
    setLocalDomMin(domMin != null ? String(domMin) : '');
    setLocalDomMax(domMax != null ? String(domMax) : '');
  }, [filters.priceRange?.min, filters.priceRange?.max, filters.domRange?.min, filters.domRange?.max]);

  // Extract unique values from properties
  const uniqueTypes = useMemo(() => {
    const types = new Set();
    properties.forEach(p => {
      if (p.propertyType) types.add(p.propertyType);
    });
    return Array.from(types).sort();
  }, [properties]);

  const uniqueStatuses = useMemo(() => {
    const statuses = new Set();
    properties.forEach(p => {
      if (p.listingStatus) statuses.add(p.listingStatus);
    });
    return Array.from(statuses).sort();
  }, [properties]);

  const uniqueWards = useMemo(() => {
    const wards = new Set();
    properties.forEach(p => {
      if (p.wards) wards.add(p.wards);
    });
    // Wards are already normalized in usePropertyData, just sort them
    return Array.from(wards).sort((a, b) => {
      // Extract numbers for proper numeric sorting (Ward 1, Ward 2, ..., Ward 10)
      const numA = parseInt(a.replace(/\D/g, '')) || 0;
      const numB = parseInt(b.replace(/\D/g, '')) || 0;
      return numA - numB;
    });
  }, [properties]);

    // Calculate dynamic max values from actual data
    const maxPrice = useMemo(() => {
      const prices = properties.map(p => p.price || 0).filter(p => p > 0);
      return prices.length > 0 ? Math.max(...prices) : 5000000; // Default to 5M if no data
    }, [properties]);

    const maxDOM = useMemo(() => {
      const doms = properties.map(p => p.daysOnMarket || 0).filter(d => d > 0);
      return doms.length > 0 ? Math.max(...doms) : 1000; // Default to 1000 days if no data
    }, [properties]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.propertyType?.length > 0) count++;
    if (filters.listingStatus?.length > 0) count++;
    if (filters.priceRange?.min || filters.priceRange?.max) count++;
    if (filters.domRange?.min || filters.domRange?.max) count++;
    if (filters.city) count++;
    if (filters.keyword) count++;
    if (filters.wards?.length > 0) count++;
    return count;
  }, [filters]);

  const handleTypeChange = (type, checked) => {
    const current = filters.propertyType || [];
    const updated = checked 
      ? [...current, type]
      : current.filter(t => t !== type);
    onChange({ ...filters, propertyType: updated });
  };

  const handleStatusChange = (status, checked) => {
    const current = filters.listingStatus || [];
    const updated = checked
      ? [...current, status]
      : current.filter(s => s !== status);
    onChange({ ...filters, listingStatus: updated });
  };

  const handleWardChange = (ward, checked) => {
    const current = filters.wards || [];
    const updated = checked
      ? [...current, ward]
      : current.filter(w => w !== ward);
    onChange({ ...filters, wards: updated });
  };

  // Debounced price range handlers
  const handlePriceMinChange = (e) => {
    const value = e.target.value;
    setLocalPriceMin(value); // Update UI immediately
    
    // Clear existing timer
    if (priceDebounceRef.current) {
      clearTimeout(priceDebounceRef.current);
    }
    
    // Debounce actual filter update (500ms)
    priceDebounceRef.current = setTimeout(() => {
      const numValue = value ? parseInt(value) : null;
      onChange({ 
        ...filters, 
        priceRange: { ...filters.priceRange, min: numValue }
      });
    }, 500);
  };

  const handlePriceMaxChange = (e) => {
    const value = e.target.value;
    setLocalPriceMax(value); // Update UI immediately
    
    if (priceDebounceRef.current) {
      clearTimeout(priceDebounceRef.current);
    }
    
    priceDebounceRef.current = setTimeout(() => {
      const numValue = value ? parseInt(value) : null;
      onChange({ 
        ...filters, 
        priceRange: { ...filters.priceRange, max: numValue }
      });
    }, 500);
  };

  // Debounced DOM range handlers
  const handleDomMinChange = (e) => {
    const value = e.target.value;
    setLocalDomMin(value); // Update UI immediately
    
    if (domDebounceRef.current) {
      clearTimeout(domDebounceRef.current);
    }
    
    domDebounceRef.current = setTimeout(() => {
      const numValue = value ? parseInt(value) : null;
      onChange({ 
        ...filters, 
        domRange: { ...filters.domRange, min: numValue }
      });
    }, 500);
  };

  const handleDomMaxChange = (e) => {
    const value = e.target.value;
    setLocalDomMax(value); // Update UI immediately
    
    if (domDebounceRef.current) {
      clearTimeout(domDebounceRef.current);
    }
    
    domDebounceRef.current = setTimeout(() => {
      const numValue = value ? parseInt(value) : null;
      onChange({ 
        ...filters, 
        domRange: { ...filters.domRange, max: numValue }
      });
    }, 500);
  };

  // Apply filter immediately on Enter key or blur
  const handlePriceMinKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (priceDebounceRef.current) clearTimeout(priceDebounceRef.current);
      const numValue = localPriceMin ? parseInt(localPriceMin) : null;
      onChange({ 
        ...filters, 
        priceRange: { ...filters.priceRange, min: numValue }
      });
    }
  };

  const handlePriceMaxKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (priceDebounceRef.current) clearTimeout(priceDebounceRef.current);
      const numValue = localPriceMax ? parseInt(localPriceMax) : null;
      onChange({ 
        ...filters, 
        priceRange: { ...filters.priceRange, max: numValue }
      });
    }
  };

  const handleDomMinKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (domDebounceRef.current) clearTimeout(domDebounceRef.current);
      const numValue = localDomMin ? parseInt(localDomMin) : null;
      onChange({ 
        ...filters, 
        domRange: { ...filters.domRange, min: numValue }
      });
    }
  };

  const handleDomMaxKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (domDebounceRef.current) clearTimeout(domDebounceRef.current);
      const numValue = localDomMax ? parseInt(localDomMax) : null;
      onChange({ 
        ...filters, 
        domRange: { ...filters.domRange, max: numValue }
      });
    }
  };

  // Cleanup timers on unmount
  React.useEffect(() => {
    return () => {
      if (priceDebounceRef.current) clearTimeout(priceDebounceRef.current);
      if (domDebounceRef.current) clearTimeout(domDebounceRef.current);
    };
  }, []);

  return (
    <Box bg="bg.panel" borderRadius="md" p={3}>
      {/* Filters Header - Always Visible */}
      <HStack justify="space-between" mb={isOpen ? 3 : 0}>
        <HStack gap={2} cursor="pointer" onClick={() => setIsOpen(!isOpen)}>
          <Filter size={16} />
          <Text fontSize="sm" fontWeight="semibold">Filters</Text>
          {activeFilterCount > 0 && (
            <Badge colorPalette="blue" variant="solid" size="sm" borderRadius="full">
              {activeFilterCount} active
            </Badge>
          )}
          {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </HStack>
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="xs" onClick={onClear}>
            <X size={12} /> Clear
          </Button>
        )}
      </HStack>

      {/* Collapsible Filter Controls */}
      <Collapsible.Root open={isOpen}>
        <Collapsible.Content>
          <SimpleGrid columns={{ base: 1, md: 5 }} gap={3} alignItems="start">

            {/* Property Type */}
            <Box>
              <Text fontSize="xs" fontWeight="semibold" color="fg.muted" mb={1.5} textTransform="uppercase">
                Property Type
              </Text>
              <Stack gap={1.5}>
                {uniqueTypes.slice(0, 4).map(type => (
                  <Checkbox.Root
                    key={type}
                    size="sm"
                    checked={filters.propertyType?.includes(type)}
                    onCheckedChange={(e) => handleTypeChange(type, e.checked)}
                  >
                    <Checkbox.HiddenInput />
                    <Checkbox.Control />
                    <Checkbox.Label fontSize="xs">{type}</Checkbox.Label>
                  </Checkbox.Root>
                ))}
              </Stack>
            </Box>

            {/* Listing Status */}
            <Box>
              <Text fontSize="xs" fontWeight="semibold" color="fg.muted" mb={1.5} textTransform="uppercase">
                Status
              </Text>
              <Stack gap={1.5}>
                {uniqueStatuses.map(status => (
                  <Checkbox.Root
                    key={status}
                    size="sm"
                    checked={filters.listingStatus?.includes(status)}
                    onCheckedChange={(e) => handleStatusChange(status, e.checked)}
                  >
                    <Checkbox.HiddenInput />
                    <Checkbox.Control />
                    <Checkbox.Label fontSize="xs">{status}</Checkbox.Label>
                  </Checkbox.Root>
                ))}
              </Stack>
            </Box>

            {/* Price Range (Min/Max Inputs) */}
            <Box>
              <Text fontSize="xs" fontWeight="semibold" color="fg.muted" mb={1.5} textTransform="uppercase">
                Price Range
              </Text>
              <Stack gap={1.5}>
                <Input
                  placeholder="Min price"
                  type="number"
                  size="xs"
                  value={localPriceMin}
                  onChange={handlePriceMinChange}
                  onKeyDown={handlePriceMinKeyDown}
                />
                <Input
                  placeholder="Max price"
                  type="number"
                  size="xs"
                  value={localPriceMax}
                  onChange={handlePriceMaxChange}
                  onKeyDown={handlePriceMaxKeyDown}
                />
              </Stack>
            </Box>

            {/* Days on Market (Min/Max Inputs) */}
            <Box>
              <Text fontSize="xs" fontWeight="semibold" color="fg.muted" mb={1.5} textTransform="uppercase">
                Days on Market
              </Text>
              <Stack gap={1.5}>
                <Input
                  placeholder="Min DOM"
                  type="number"
                  size="xs"
                  value={localDomMin}
                  onChange={handleDomMinChange}
                  onKeyDown={handleDomMinKeyDown}
                />
                <Input
                  placeholder="Max DOM"
                  type="number"
                  size="xs"
                  value={localDomMax}
                  onChange={handleDomMaxChange}
                  onKeyDown={handleDomMaxKeyDown}
                />
              </Stack>
            </Box>

            {/* Ward - Three Column Layout */}
            <Box>
              <Text fontSize="xs" fontWeight="semibold" color="fg.muted" mb={1.5} textTransform="uppercase">
                Ward
              </Text>
              <Box maxH="120px" overflowY="auto">
                <SimpleGrid columns={{ base: 1, md: 3 }} gap={1.5}>
                  {uniqueWards.map(ward => (
                    <Checkbox.Root
                      key={ward}
                      size="sm"
                      checked={filters.wards?.includes(ward)}
                      onCheckedChange={(e) => handleWardChange(ward, e.checked)}
                    >
                      <Checkbox.HiddenInput />
                      <Checkbox.Control />
                      <Checkbox.Label fontSize="xs">{ward}</Checkbox.Label>
                    </Checkbox.Root>
                  ))}
                </SimpleGrid>
              </Box>
            </Box>
          </SimpleGrid>
        </Collapsible.Content>
      </Collapsible.Root>
    </Box>
  );
}
