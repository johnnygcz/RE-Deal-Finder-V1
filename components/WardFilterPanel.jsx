import React, { useState } from 'react';
import {
  Box,
  Stack,
  HStack,
  Text,
  Checkbox,
  Button,
  Card,
  SimpleGrid,
  Separator
} from '@chakra-ui/react';
import { MapPin, RotateCcw } from 'lucide-react';

const WARDS = [
  'Ward 1', 'Ward 2', 'Ward 3', 'Ward 4', 'Ward 5',
  'Ward 6', 'Ward 7', 'Ward 8', 'Ward 9', 'Ward 10'
];

export default function WardFilterPanel({ selectedWards = [], onChange }) {
  const [localSelection, setLocalSelection] = useState(selectedWards);

  const handleWardToggle = (ward, checked) => {
    const newSelection = checked
      ? [...localSelection, ward]
      : localSelection.filter(w => w !== ward);
    
    setLocalSelection(newSelection);
    onChange?.(newSelection);
  };

  const handleSelectAll = () => {
    setLocalSelection(WARDS);
    onChange?.(WARDS);
  };

  const handleClearAll = () => {
    setLocalSelection([]);
    onChange?.([]);
  };

  const allSelected = localSelection.length === WARDS.length;

  return (
    <Card.Root>
      <Card.Header>
        <HStack justify="space-between">
          <HStack gap={2}>
            <MapPin size={18} />
            <Text fontWeight="semibold">Ward Filter</Text>
          </HStack>
          <Button variant="ghost" size="sm" onClick={handleClearAll}>
            <RotateCcw size={14} /> Clear
          </Button>
        </HStack>
      </Card.Header>

      <Card.Body>
        <Stack gap={4}>
          {/* Select All Toggle */}
          <Checkbox.Root
            checked={allSelected}
            onCheckedChange={({ checked }) => checked ? handleSelectAll() : handleClearAll()}
          >
            <Checkbox.HiddenInput />
            <Checkbox.Control />
            <Checkbox.Label fontWeight="medium">All Wards</Checkbox.Label>
          </Checkbox.Root>

          <Separator />

          {/* Individual Ward Checkboxes */}
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={3}>
            {WARDS.map((ward) => (
              <Checkbox.Root
                key={ward}
                checked={localSelection.includes(ward)}
                onCheckedChange={({ checked }) => handleWardToggle(ward, checked)}
              >
                <Checkbox.HiddenInput />
                <Checkbox.Control />
                <Checkbox.Label>{ward}</Checkbox.Label>
              </Checkbox.Root>
            ))}
          </SimpleGrid>

          {/* Selection Summary */}
          {localSelection.length > 0 && localSelection.length < WARDS.length && (
            <Box mt={2} p={2} bg="blue.50" borderRadius="md">
              <Text fontSize="xs" color="blue.700">
                {localSelection.length} of {WARDS.length} wards selected
              </Text>
            </Box>
          )}
        </Stack>
      </Card.Body>
    </Card.Root>
  );
}
