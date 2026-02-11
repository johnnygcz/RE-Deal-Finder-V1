import React, { useState } from 'react';
import { Box, Button, Container, Heading, VStack, HStack, Text, createListCollection, Select, Checkbox, Input, Stack, Separator, SimpleGrid, Grid, GridItem } from '@chakra-ui/react';
import { Plus, ArrowRight, Edit, Trash2, Save, Star } from 'lucide-react';

export default function LensPage({ lenses, activeLensId, onCreateLens, onSelectLens, onContinue, onRenameLens, onDeleteLens, onUpdateLens, onSave, defaultLensId, onSetDefaultLens }) {
  const [newLensName, setNewLensName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);

  const lensCollection = createListCollection({
    items: lenses.map(l => ({ label: l.name, value: l.id }))
  });

  const activeLens = lenses.find(l => l.id === activeLensId);

  const handleCreateLens = () => {
    if (newLensName.trim()) {
      onCreateLens(newLensName.trim());
      setNewLensName('');
      setShowNameInput(false);
    }
  };

  const handleRename = () => {
    if (!activeLensId) return;
    const activeLens = lenses.find(l => l.id === activeLensId);
    const newName = prompt('Enter new lens name:', activeLens?.name || '');
    if (newName && newName.trim()) {
      onRenameLens(activeLensId, newName.trim());
    }
  };

  const handleDelete = () => {
    if (!activeLensId) {
      console.log('❌ Delete button clicked but no active lens selected');
      return;
    }
    
    const activeLens = lenses.find(l => l.id === activeLensId);
    console.log('🗑️ Delete button clicked for lens:', {
      lensId: activeLensId,
      lensName: activeLens?.name,
      totalLenses: lenses.length
    });
    
    // Show confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to delete "${activeLens?.name}"?\n\nThis action cannot be undone.`
    );
    
    if (confirmed) {
      console.log(`✅ User confirmed deletion of lens: ${activeLens?.name} (ID: ${activeLensId})`);
      console.log('📞 Calling onDeleteLens callback...');
      onDeleteLens(activeLensId);
      console.log('✅ onDeleteLens callback completed');
    } else {
      console.log('❌ User cancelled lens deletion');
    }
  };

  const handleFilterChange = (key, value) => {
    if (!activeLens) return;
    const updatedFilters = { ...activeLens.filters, [key]: value };
    onUpdateLens(activeLensId, updatedFilters);
  };

  const handleCheckboxChange = (key, option, checked) => {
    if (!activeLens) return;
    const current = activeLens.filters[key] || [];
    const updated = checked
      ? [...current, option]
      : current.filter(item => item !== option);
    handleFilterChange(key, updated);
  };

  const handleContinueClick = () => {
    // Immediately navigate - App.jsx will show loading animation during data fetch
    onContinue();
  };

  const handleSave = async () => {
    if (onSave) {
      try {
        await onSave();
        console.log(`✅ Saved ${lenses.length} lens${lenses.length !== 1 ? 'es' : ''} to Monday.com storage`);
      } catch (error) {
        console.error('❌ Save failed in LensPage:', error);
      }
    }
  };

  const handleSetDefault = () => {
    if (!activeLensId) return;
    if (onSetDefaultLens) {
      onSetDefaultLens(activeLensId);
    }
  };

  // Build filter summary for loading animation
  const getFilterSummary = () => {
    if (!activeLens) return [];
    const summary = [];
    const f = activeLens.filters;

    // Property types
    if (f.propertyTypes?.length > 0) {
      summary.push(`Looking for ${f.propertyTypes.join(', ')}...`);
    }

    // Status
    if (f.statuses?.length > 0) {
      summary.push(`Status: ${f.statuses.join(', ')}...`);
    }

    // Price range
    if (f.priceMin || f.priceMax) {
      const priceText = f.priceMin && f.priceMax 
        ? `Price: $${(f.priceMin/1000).toFixed(0)}k - $${(f.priceMax/1000).toFixed(0)}k`
        : f.priceMin 
        ? `Price: over $${(f.priceMin/1000).toFixed(0)}k`
        : `Price: up to $${(f.priceMax/1000).toFixed(0)}k`;
      summary.push(priceText + '...');
    }

    // Wards
    if (f.wards?.length > 0) {
      summary.push(`In Wards: ${f.wards.map(w => w.replace('Ward ', '')).join(', ')}...`);
    }

    // Beds/Baths
    if (f.bedsMin || f.bedsMax) {
      const bedsText = f.bedsMin && f.bedsMax 
        ? `${f.bedsMin}-${f.bedsMax} bedrooms`
        : f.bedsMin 
        ? `${f.bedsMin}+ bedrooms`
        : `up to ${f.bedsMax} bedrooms`;
      summary.push(bedsText + '...');
    }

    if (f.bathsMin || f.bathsMax) {
      const bathsText = f.bathsMin && f.bathsMax 
        ? `${f.bathsMin}-${f.bathsMax} bathrooms`
        : f.bathsMin 
        ? `${f.bathsMin}+ bathrooms`
        : `up to ${f.bathsMax} bathrooms`;
      summary.push(bathsText + '...');
    }

    // Drop frequency
    if (f.dropFreqMin || f.dropFreqMax) {
      const dropFreqText = f.dropFreqMin && f.dropFreqMax 
        ? `${f.dropFreqMin}-${f.dropFreqMax} price drops`
        : f.dropFreqMin 
        ? `${f.dropFreqMin}+ price drops`
        : `up to ${f.dropFreqMax} price drops`;
      summary.push(dropFreqText + '...');
    }

    // Drop percentage
    if (f.dropPercentMin || f.dropPercentMax) {
      const dropPercentText = f.dropPercentMin && f.dropPercentMax 
        ? `${f.dropPercentMin}%-${f.dropPercentMax}% price reduction`
        : f.dropPercentMin 
        ? `${f.dropPercentMin}%+ price reduction`
        : `up to ${f.dropPercentMax}% price reduction`;
      summary.push(dropPercentText + '...');
    }

    return summary.length > 0 ? summary : ['Searching all properties...'];
  };

  return (
    <Container maxW="3xl" py={20}>
      <VStack gap={6} align="stretch" width="full">
        <Box textAlign="center">
          <Heading size="2xl" mb={2}>Step 2</Heading>
          <Text color="fg.muted" fontSize="lg">Choose or create your lens</Text>
        </Box>

        <Box bg="bg.panel" p={6} borderRadius="xl" shadow="md" borderWidth="1px" borderColor="border.muted">
          <VStack gap={5}>
            <Box width="full">
              <Text mb={2} fontWeight="medium" fontSize="sm">Select a Lens</Text>
              <Select.Root
                collection={lensCollection}
                value={activeLensId ? [activeLensId] : []}
                onValueChange={(e) => onSelectLens(e.value[0])}
                disabled={lenses.length === 0}
              >
                <Select.Trigger>
                  <Select.ValueText placeholder={lenses.length === 0 ? "No lenses created yet" : "Select a lens..."} />
                </Select.Trigger>
                <Select.Positioner>
                  <Select.Content>
                    {lensCollection.items.map((lens) => {
                      const isDefault = lens.value === defaultLensId;
                      return (
                        <Select.Item key={lens.value} item={lens}>
                          <HStack gap={1}>
                            {isDefault && <Text>⭐</Text>}
                            <Text>{lens.label}</Text>
                            {isDefault && <Text fontSize="xs" color="fg.muted">(Default)</Text>}
                          </HStack>
                        </Select.Item>
                      );
                    })}
                  </Select.Content>
                </Select.Positioner>
              </Select.Root>
            </Box>

            {showNameInput ? (
              <VStack width="full" gap={2}>
                <Input
                  placeholder="Enter lens name..."
                  value={newLensName}
                  onChange={(e) => setNewLensName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateLens();
                    if (e.key === 'Escape') {
                      setShowNameInput(false);
                      setNewLensName('');
                    }
                  }}
                  autoFocus
                />
                <HStack width="full" gap={2}>
                  <Button 
                    colorPalette="blue" 
                    flex="1" 
                    onClick={handleCreateLens}
                    disabled={!newLensName.trim()}
                  >
                    Create
                  </Button>
                  <Button 
                    variant="outline" 
                    flex="1" 
                    onClick={() => {
                      setShowNameInput(false);
                      setNewLensName('');
                    }}
                  >
                    Cancel
                  </Button>
                </HStack>
              </VStack>
            ) : (
              <VStack width="full" gap={2}>
                <HStack width="full" gap={2}>
                  <Button variant="outline" flex="1" onClick={() => setShowNameInput(true)}>
                    <Plus size={16} /> New
                  </Button>
                  <Button 
                    variant="outline" 
                    flex="1" 
                    onClick={handleRename}
                    disabled={!activeLensId}
                  >
                    <Edit size={16} /> Rename
                  </Button>
                  <Button 
                    variant="outline" 
                    colorPalette="red"
                    flex="1" 
                    onClick={handleDelete}
                    disabled={!activeLensId}
                  >
                    <Trash2 size={16} /> Delete
                  </Button>
                </HStack>
                <Button
                  variant="outline"
                  colorPalette="orange"
                  width="full"
                  onClick={handleSetDefault}
                  disabled={!activeLensId || activeLensId === defaultLensId}
                >
                  ⭐ Set as Default
                </Button>
              </VStack>
            )}
          </VStack>
        </Box>

        {/* Buy Box Filter Form - Only shown when a lens is selected */}
        {activeLens && (
          <Box bg="bg.panel" p={6} borderRadius="xl" shadow="md" borderWidth="1px" borderColor="border.muted">
            <VStack gap={4} align="stretch">
              <Heading size="lg">Buy Box Filters</Heading>
              <Text color="fg.muted" fontSize="sm">Configure the filters for this lens</Text>

              <Separator />

              {/* Row 1: Property Type and Status */}
              <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={6}>
                <GridItem>
                  <Text fontWeight="semibold" mb={2} fontSize="sm">Property Type</Text>
                  <HStack gap={3} flexWrap="wrap">
                    {['House', 'Apartment', 'Single Family', 'Multi-family'].map(type => (
                      <Checkbox.Root
                        key={type}
                        size="sm"
                        checked={(activeLens.filters.propertyTypes || []).includes(type)}
                        onCheckedChange={(e) => handleCheckboxChange('propertyTypes', type, e.checked)}
                      >
                        <Checkbox.HiddenInput />
                        <Checkbox.Control />
                        <Checkbox.Label fontSize="sm">{type}</Checkbox.Label>
                      </Checkbox.Root>
                    ))}
                  </HStack>
                </GridItem>

                <GridItem>
                  <Text fontWeight="semibold" mb={2} fontSize="sm">Status</Text>
                  <HStack gap={3} flexWrap="wrap">
                    {['Active', 'RELISTED', 'Removed'].map(status => (
                      <Checkbox.Root
                        key={status}
                        size="sm"
                        checked={(activeLens.filters.statuses || []).includes(status)}
                        onCheckedChange={(e) => handleCheckboxChange('statuses', status, e.checked)}
                      >
                        <Checkbox.HiddenInput />
                        <Checkbox.Control />
                        <Checkbox.Label fontSize="sm">{status}</Checkbox.Label>
                      </Checkbox.Root>
                    ))}
                  </HStack>
                </GridItem>
              </Grid>

              <Separator />

              {/* Row 2: Price Range, DOM, Beds, Baths */}
              <Grid templateColumns={{ base: '1fr', md: 'repeat(4, 1fr)' }} gap={4}>
                <GridItem>
                  <Text fontWeight="semibold" mb={2} fontSize="sm">Price Range</Text>
                  <VStack gap={2}>
                    <Input
                      type="number"
                      placeholder="Min"
                      size="sm"
                      value={activeLens.filters.priceMin != null ? String(activeLens.filters.priceMin) : ''}
                      onChange={(e) => handleFilterChange('priceMin', e.target.value ? parseInt(e.target.value) : undefined)}
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      size="sm"
                      value={activeLens.filters.priceMax != null ? String(activeLens.filters.priceMax) : ''}
                      onChange={(e) => handleFilterChange('priceMax', e.target.value ? parseInt(e.target.value) : undefined)}
                    />
                  </VStack>
                </GridItem>

                <GridItem>
                  <Text fontWeight="semibold" mb={2} fontSize="sm">Days on Market</Text>
                  <VStack gap={2}>
                    <Input
                      type="number"
                      placeholder="Min"
                      size="sm"
                      value={activeLens.filters.domMin != null ? String(activeLens.filters.domMin) : ''}
                      onChange={(e) => handleFilterChange('domMin', e.target.value ? parseInt(e.target.value) : undefined)}
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      size="sm"
                      value={activeLens.filters.domMax != null ? String(activeLens.filters.domMax) : ''}
                      onChange={(e) => handleFilterChange('domMax', e.target.value ? parseInt(e.target.value) : undefined)}
                    />
                  </VStack>
                </GridItem>

                <GridItem>
                  <Text fontWeight="semibold" mb={2} fontSize="sm">Beds</Text>
                  <VStack gap={2}>
                    <Input
                      type="number"
                      placeholder="Min"
                      size="sm"
                      value={activeLens.filters.bedsMin != null ? String(activeLens.filters.bedsMin) : ''}
                      onChange={(e) => handleFilterChange('bedsMin', e.target.value ? parseInt(e.target.value) : undefined)}
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      size="sm"
                      value={activeLens.filters.bedsMax != null ? String(activeLens.filters.bedsMax) : ''}
                      onChange={(e) => handleFilterChange('bedsMax', e.target.value ? parseInt(e.target.value) : undefined)}
                    />
                  </VStack>
                </GridItem>

                <GridItem>
                  <Text fontWeight="semibold" mb={2} fontSize="sm">Baths</Text>
                  <VStack gap={2}>
                    <Input
                      type="number"
                      placeholder="Min"
                      size="sm"
                      value={activeLens.filters.bathsMin != null ? String(activeLens.filters.bathsMin) : ''}
                      onChange={(e) => handleFilterChange('bathsMin', e.target.value ? parseInt(e.target.value) : undefined)}
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      size="sm"
                      value={activeLens.filters.bathsMax != null ? String(activeLens.filters.bathsMax) : ''}
                      onChange={(e) => handleFilterChange('bathsMax', e.target.value ? parseInt(e.target.value) : undefined)}
                    />
                  </VStack>
                </GridItem>
              </Grid>

              <Separator />

              {/* Row 3: Ward checkboxes horizontally */}
              <Box>
                <Text fontWeight="semibold" mb={2} fontSize="sm">Ward</Text>
                <HStack gap={3} flexWrap="wrap">
                  {['Ward 1', 'Ward 2', 'Ward 3', 'Ward 4', 'Ward 5', 'Ward 6', 'Ward 7', 'Ward 8', 'Ward 9', 'Ward 10'].map(ward => (
                    <Checkbox.Root
                      key={ward}
                      size="sm"
                      checked={(activeLens.filters.wards || []).includes(ward)}
                      onCheckedChange={(e) => handleCheckboxChange('wards', ward, e.checked)}
                    >
                      <Checkbox.HiddenInput />
                      <Checkbox.Control />
                      <Checkbox.Label fontSize="sm">{ward}</Checkbox.Label>
                    </Checkbox.Root>
                  ))}
                </HStack>
              </Box>

              <Separator />

              {/* Row 4: GHL Status, Comps, Drop %, Drop $, Drop Frequency */}
              <Grid templateColumns={{ base: '1fr', md: 'repeat(5, 1fr)' }} gap={4}>
                <GridItem>
                  <Text fontWeight="semibold" mb={2} fontSize="sm">GHL Status</Text>
                  <Select.Root
                    collection={createListCollection({
                      items: [
                        { label: 'Any', value: 'any' },
                        { label: 'In GHL (SENT)', value: 'sent' },
                        { label: 'Not Sent', value: 'not_sent' }
                      ]
                    })}
                    size="sm"
                    value={activeLens.filters.ghlStatus ? [activeLens.filters.ghlStatus] : ['any']}
                    onValueChange={(e) => handleFilterChange('ghlStatus', e.value[0])}
                  >
                    <Select.Trigger>
                      <Select.ValueText placeholder="Select" />
                    </Select.Trigger>
                    <Select.Positioner>
                      <Select.Content>
                        <Select.Item item={{ label: 'Any', value: 'any' }} value="any">
                          Any
                        </Select.Item>
                        <Select.Item item={{ label: 'In GHL (SENT)', value: 'sent' }} value="sent">
                          In GHL (SENT)
                        </Select.Item>
                        <Select.Item item={{ label: 'Not Sent', value: 'not_sent' }} value="not_sent">
                          Not Sent
                        </Select.Item>
                      </Select.Content>
                    </Select.Positioner>
                  </Select.Root>
                </GridItem>

                <GridItem>
                  <Text fontWeight="semibold" mb={2} fontSize="sm">Comps</Text>
                  <Select.Root
                    collection={createListCollection({
                      items: [
                        { label: 'Any comps', value: 'any' },
                        { label: 'Has comps only', value: 'has' },
                        { label: 'No comps only', value: 'none' }
                      ]
                    })}
                    size="sm"
                    value={activeLens.filters.compsMode ? [activeLens.filters.compsMode] : ['any']}
                    onValueChange={(e) => handleFilterChange('compsMode', e.value[0])}
                  >
                    <Select.Trigger>
                      <Select.ValueText placeholder="Select" />
                    </Select.Trigger>
                    <Select.Positioner>
                      <Select.Content>
                        <Select.Item item={{ label: 'Any comps', value: 'any' }} value="any">
                          Any comps
                        </Select.Item>
                        <Select.Item item={{ label: 'Has comps only', value: 'has' }} value="has">
                          Has comps only
                        </Select.Item>
                        <Select.Item item={{ label: 'No comps only', value: 'none' }} value="none">
                          No comps only
                        </Select.Item>
                      </Select.Content>
                    </Select.Positioner>
                  </Select.Root>
                </GridItem>

                <GridItem>
                  <Text fontWeight="semibold" mb={2} fontSize="sm">Drop %</Text>
                  <HStack gap={2}>
                    <Input
                      type="number"
                      placeholder="Min"
                      size="sm"
                      value={activeLens.filters.dropPercentMin != null ? String(activeLens.filters.dropPercentMin) : ''}
                      onChange={(e) => handleFilterChange('dropPercentMin', e.target.value ? parseFloat(e.target.value) : undefined)}
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      size="sm"
                      value={activeLens.filters.dropPercentMax != null ? String(activeLens.filters.dropPercentMax) : ''}
                      onChange={(e) => handleFilterChange('dropPercentMax', e.target.value ? parseFloat(e.target.value) : undefined)}
                    />
                  </HStack>
                </GridItem>

                <GridItem>
                  <Text fontWeight="semibold" mb={2} fontSize="sm">Drop $</Text>
                  <HStack gap={2}>
                    <Input
                      type="number"
                      placeholder="Min"
                      size="sm"
                      value={activeLens.filters.dropDollarMin != null ? String(activeLens.filters.dropDollarMin) : ''}
                      onChange={(e) => handleFilterChange('dropDollarMin', e.target.value ? parseInt(e.target.value) : undefined)}
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      size="sm"
                      value={activeLens.filters.dropDollarMax != null ? String(activeLens.filters.dropDollarMax) : ''}
                      onChange={(e) => handleFilterChange('dropDollarMax', e.target.value ? parseInt(e.target.value) : undefined)}
                    />
                  </HStack>
                </GridItem>

                <GridItem>
                  <Text fontWeight="semibold" mb={2} fontSize="sm">Drop Frequency</Text>
                  <HStack gap={2}>
                    <Input
                      type="number"
                      placeholder="Min"
                      size="sm"
                      value={activeLens.filters.dropFreqMin != null ? String(activeLens.filters.dropFreqMin) : ''}
                      onChange={(e) => handleFilterChange('dropFreqMin', e.target.value ? parseInt(e.target.value) : undefined)}
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      size="sm"
                      value={activeLens.filters.dropFreqMax != null ? String(activeLens.filters.dropFreqMax) : ''}
                      onChange={(e) => handleFilterChange('dropFreqMax', e.target.value ? parseInt(e.target.value) : undefined)}
                    />
                  </HStack>
                </GridItem>
              </Grid>
            </VStack>
          </Box>
        )}

        {/* Save Button */}
        <Button
          colorPalette="green"
          width="full"
          size="md"
          onClick={handleSave}
          variant="outline"
          disabled={lenses.length === 0}
        >
          <Save size={16} /> Save All Lenses
        </Button>

        {/* Continue Button */}
        <Button
          colorPalette="blue"
          width="full"
          size="lg"
          onClick={handleContinueClick}
          disabled={!activeLensId}
        >
          🔍 Click here to find the hottest deals
        </Button>
      </VStack>
    </Container>
  );
}
