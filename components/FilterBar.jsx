import React from 'react';
import { Box, HStack } from '@chakra-ui/react';
import FilterPanel from './FilterPanel';

export default function FilterBar({ filters, onChange, onClear, properties }) {
  return (
    <Box bg="bg.panel" borderBottomWidth="1px" borderColor="border.muted">
      <Box maxW="full" px={4} py={2}>
        <FilterPanel
          filters={filters}
          onChange={onChange}
          onClear={onClear}
          properties={properties}
        />
      </Box>
    </Box>
  );
}
