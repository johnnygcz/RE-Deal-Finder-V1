import { useState, useCallback, useRef, useEffect } from 'react';

// useFilters - simplified without staging state (debouncing moved to FilterPanel)
export function useFilters() {
  const [filters, setFilters] = useState({
    propertyType: [],
    listingStatus: [],
    priceRange: { min: null, max: null },
    domRange: { min: null, max: null },
    city: '',
    keyword: '',
    wards: []
  });

  const updateFilter = useCallback((key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const clearFilters = useCallback(() => {
    const emptyFilters = {
      propertyType: [],
      listingStatus: [],
      priceRange: { min: null, max: null },
      domRange: { min: null, max: null },
      city: '',
      keyword: '',
      wards: []
    };
    setFilters(emptyFilters);
  }, []);

  return {
    filters,
    setFilters,
    updateFilter,
    clearFilters
  };
}
