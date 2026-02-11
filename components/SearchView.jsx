// SearchView component handles property search by address, MLS, or realtor
import React, { useState } from 'react';
import { Box, VStack, HStack, Input, Button, Text, Heading, Grid, Dialog, Portal, CloseButton } from '@chakra-ui/react';
import { Search, X } from 'lucide-react';
import PropertyCard from './PropertyCard';
import PropertyDetailView from './PropertyDetailView';
import { useDealScoring } from '../hooks/useDealScoring';

export default function SearchView({ allProperties, currentUser }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [favorites, setFavorites] = useState(() => new Set());

  // Calculate deal scores for search results using the SAME hook as Map view
  const { scoredProperties: scoredSearchResults } = useDealScoring(searchResults);

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    const query = searchQuery.toLowerCase().trim();

    // Search by address, MLS number, or Realtor name
    const results = allProperties.filter(property => {
      const address = (property.name || '').toLowerCase();
      const mlsNumber = (property.rcaMlsNumber || '').toLowerCase();
      const realtorName = (property.realtors?.linkedItems?.[0]?.name || '').toLowerCase();

      return address.includes(query) || mlsNumber.includes(query) || realtorName.includes(query);
    });

    setSearchResults(results);
    setHasSearched(true);
  };

  const handleClear = () => {
    setSearchQuery('');
    setSearchResults([]);
    setHasSearched(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handlePropertyClick = (property) => {
    setSelectedProperty(property);
    setIsModalOpen(true);
  };

  const toggleFavorite = (propertyId) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(propertyId)) {
        newFavorites.delete(propertyId);
      } else {
        newFavorites.add(propertyId);
      }
      return newFavorites;
    });
  };

  return (
    <Box p={8} minHeight="calc(100vh - 200px)">
      <VStack gap={8} maxW="1400px" mx="auto">
        {/* Search Header */}
        <VStack gap={4} w="full" align="center">
          <Heading size="2xl" color="fg">Property Search</Heading>
          <Text color="fg.muted" fontSize="lg" textAlign="center">
            Search by property address, MLS number, or realtor
          </Text>
        </VStack>

        {/* Search Input */}
        <HStack gap={3} w="full" maxW="800px">
          <Input
            placeholder="Enter address, MLS number, or realtor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            size="lg"
            height="60px"
            fontSize="lg"
            bg="bg.subtle"
            borderColor="border.muted"
            _focus={{ borderColor: 'blue.500', boxShadow: '0 0 0 1px var(--chakra-colors-blue-500)' }}
          />
          <Button colorPalette="blue" size="lg" height="60px" px={8} onClick={handleSearch}>
            <Search size={20} />
            Search
          </Button>
          {hasSearched && (
            <Button variant="outline" size="lg" height="60px" px={6} onClick={handleClear}>
              <X size={20} />
              Clear
            </Button>
          )}
        </HStack>

        {/* Search Results */}
        {hasSearched && (
          <Box w="full">
            {scoredSearchResults.length > 0 ? (
              <VStack gap={6} align="start" w="full">
                <Text fontSize="lg" fontWeight="medium" color="fg">
                  Found {scoredSearchResults.length} {scoredSearchResults.length === 1 ? 'property' : 'properties'}
                </Text>
                <Grid
                  templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)', xl: 'repeat(4, 1fr)' }}
                  gap={6}
                  w="full"
                >
                  {scoredSearchResults.map((property) => (
                    <PropertyCard
                      key={property.id}
                      property={property}
                      onSelect={() => handlePropertyClick(property)}
                      isSelected={selectedProperty?.id === property.id}
                      isFavorited={favorites.has(property.id)}
                      onToggleFavorite={toggleFavorite}
                      compact={false}
                      currentUser={currentUser}
                    />
                  ))}
                </Grid>
              </VStack>
            ) : (
              <VStack gap={4} py={12} align="center">
                <Box p={6} borderRadius="full" bg="bg.muted" color="fg.muted">
                  <Search size={48} />
                </Box>
                <Heading size="lg" color="fg">No results found</Heading>
                <Text color="fg.muted" textAlign="center" maxW="500px">
                  No properties match your search. Try a different address, MLS number, or realtor.
                </Text>
              </VStack>
            )}
          </Box>
        )}

        {/* Initial Empty State */}
        {!hasSearched && (
          <VStack gap={4} py={12} align="center">
            <Box p={6} borderRadius="full" bg="blue.50" color="blue.500">
              <Search size={48} />
            </Box>
            <Heading size="lg" color="fg">Start your search</Heading>
            <Text color="fg.muted" textAlign="center" maxW="500px">
              Enter an address, MLS number, or realtor name above to find specific listings
            </Text>
          </VStack>
        )}
      </VStack>

      {/* Property Detail Modal */}
      <Dialog.Root open={isModalOpen} onOpenChange={({ open }) => setIsModalOpen(open)} size="full">
        <Portal>
          <Dialog.Backdrop />
        </Portal>
        <Dialog.Positioner maxW="90vw" maxH="90vh" overflow="hidden">
          <Dialog.CloseTrigger asChild position="absolute" top="4" right="4" zIndex="1">
            <CloseButton size="sm" />
          </Dialog.CloseTrigger>
          <Dialog.Content p={0} overflow="auto">
            {selectedProperty && (
              <PropertyDetailView
                property={selectedProperty}
                allProperties={allProperties}
                onPropertyChange={(newProperty) => setSelectedProperty(newProperty)}
              />
            )}
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </Box>
  );
}
