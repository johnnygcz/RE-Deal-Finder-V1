import { useState, useEffect, useMemo } from 'react';
import { Box, Stack, HStack, VStack, Text, Heading, SimpleGrid, Badge, Button, IconButton, Progress } from '@chakra-ui/react';
import { TrendingUp, TrendingDown, Bell, Eye, Send, ChevronLeft, ChevronRight, MapPin, Home, DollarSign } from 'lucide-react';
import PropertyDetailView from './PropertyDetailView';

export default function MyFeedView({ properties = [], allProperties = [], currentUser }) {
  const [viewedPropertyIds, setViewedPropertyIds] = useState(new Set());
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [carouselOffset, setCarouselOffset] = useState(0);

  const username = currentUser?.username || 'Investor';
  const storageKey = `myFeed_${username}_viewed`;

  // Load viewed properties from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        const today = new Date().toDateString();
        const viewedToday = data.filter(v => new Date(v.timestamp).toDateString() === today);
        setViewedPropertyIds(new Set(viewedToday.map(v => v.id)));
      }
    } catch (error) {
      console.error('Failed to load viewed properties:', error);
    }
  }, [storageKey]);

  // Save viewed properties to localStorage
  const trackViewed = (propertyId) => {
    try {
      const stored = localStorage.getItem(storageKey);
      const data = stored ? JSON.parse(stored) : [];
      const updated = [...data, { id: propertyId, timestamp: Date.now() }];
      localStorage.setItem(storageKey, JSON.stringify(updated));
      setViewedPropertyIds(prev => new Set([...prev, propertyId]));
    } catch (error) {
      console.error('Failed to track viewed property:', error);
    }
  };

  // KPI Calculations
  const kpis = useMemo(() => {
    const viewedCount = viewedPropertyIds.size;
    const ghlColumn = currentUser?.monGhlColumn === 'JS Send to GHL' ? 'jsSendToGhl' : 'azSendToGhl';
    const ghlSentCount = allProperties.filter(p => p[ghlColumn]?.toUpperCase() === 'SENT').length;
    const avgScore = properties.length > 0 
      ? Math.round(properties.reduce((sum, p) => sum + (p.scores?.global || 0), 0) / properties.length)
      : 0;
    const alerts = properties.filter(p => {
      const hasRecentDrop = p.priceHistory?.length > 1 && 
        (Date.now() - new Date(p.priceHistory[p.priceHistory.length - 1].date).getTime()) < 7 * 24 * 60 * 60 * 1000;
      return hasRecentDrop || p.listingStatus === 'RELISTED';
    }).length;

    return { viewedCount, ghlSentCount, avgScore, alerts };
  }, [viewedPropertyIds, allProperties, properties, currentUser]);

  // Activity Feed - Recent price drops, status changes, new listings
  const activityFeed = useMemo(() => {
    const feed = [];
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    // Price drops in last 24h
    properties.forEach(p => {
      if (p.priceHistory?.length > 1) {
        const lastDrop = p.priceHistory[p.priceHistory.length - 1];
        const prevPrice = p.priceHistory[p.priceHistory.length - 2];
        const dropTime = new Date(lastDrop.date).getTime();
        
        if (dropTime > oneDayAgo && lastDrop.price < prevPrice.price) {
          feed.push({
            type: 'price_drop',
            property: p,
            oldPrice: prevPrice.price,
            newPrice: lastDrop.price,
            timestamp: dropTime
          });
        }
      }

      // Relisted properties
      if (p.listingStatus === 'RELISTED' && p.relistedDate) {
        const relistTime = new Date(p.relistedDate).getTime();
        if (relistTime > oneDayAgo) {
          feed.push({
            type: 'status_change',
            property: p,
            timestamp: relistTime
          });
        }
      }

      // New listings
      if (p.column1stListingDate) {
        const listTime = new Date(p.column1stListingDate).getTime();
        if (listTime > oneDayAgo) {
          feed.push({
            type: 'new_listing',
            property: p,
            timestamp: listTime
          });
        }
      }
    });

    return feed.sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);
  }, [properties]);

  // Smart Recommendations - Top unviewed properties
  const recommendations = useMemo(() => {
    return properties
      .filter(p => !viewedPropertyIds.has(p.id))
      .sort((a, b) => (b.scores?.global || 0) - (a.scores?.global || 0))
      .slice(0, 2);
  }, [properties, viewedPropertyIds]);

  // Nearby Discoveries - Categorized properties
  const discoveries = useMemo(() => {
    const categorized = properties.map(p => {
      const score = p.scores?.global || 0;
      const dropPercent = Math.abs(p.dropAsAPercentageOfTheInitialPrice || 0);
      
      let category = 'Rent Ready';
      if (dropPercent > 15) category = 'Fix & Flip';
      else if (score > 75) category = 'Stable Cash Flow';
      else if (p.propertyType === 'Vacant Land') category = 'Development Potential';
      
      return { ...p, category };
    });
    return categorized.slice(0, 12);
  }, [properties]);

  const formatTimeAgo = (timestamp) => {
    const minutes = Math.floor((Date.now() - timestamp) / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const formatPrice = (price) => `$${Math.round(price).toLocaleString()}`;

  return (
    <Box minH="100vh" bg="#0F172A" color="white" p={6}>
      <Stack gap={6}>
        {/* Header */}
        <Box>
          <Heading fontSize="4xl" fontWeight="bold" mb={6}>Good day, {username}!</Heading>
          
          {/* KPI Cards */}
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap={4}>
            <Box bg="#1E293B" p={6} borderRadius="xl" border="2px solid" borderColor="#6161FF20">
              <HStack justify="space-between" mb={3}>
                <Eye size={24} color="#6161FF" />
                <svg width="60" height="30" style={{ opacity: 0.7 }}>
                  <polyline points="0,20 15,15 30,18 45,10 60,12" fill="none" stroke="#6161FF" strokeWidth="2" />
                </svg>
              </HStack>
              <Text fontSize="3xl" fontWeight="bold">{kpis.viewedCount}</Text>
              <Text fontSize="sm" color="whiteAlpha.700">Viewed Today</Text>
            </Box>

            <Box bg="#1E293B" p={6} borderRadius="xl" border="2px solid" borderColor="#6161FF20">
              <HStack justify="space-between" mb={3}>
                <Send size={24} color="#6161FF" />
                <TrendingUp size={24} color="#22C55E" />
              </HStack>
              <Text fontSize="3xl" fontWeight="bold">{kpis.ghlSentCount}</Text>
              <Text fontSize="sm" color="whiteAlpha.700">GHL Sent</Text>
            </Box>

            <Box bg="#1E293B" p={6} borderRadius="xl" border="2px solid" borderColor="#6161FF20">
              <HStack justify="space-between" mb={3}>
                <Text fontSize="sm" color="whiteAlpha.700">Avg Deal Score</Text>
                <Progress.Root value={kpis.avgScore} size="xs" width="60px" colorPalette="purple">
                  <Progress.Track><Progress.Range /></Progress.Track>
                </Progress.Root>
              </HStack>
              <Text fontSize="3xl" fontWeight="bold">{kpis.avgScore}/100</Text>
            </Box>

            <Box bg="#1E293B" p={6} borderRadius="xl" border="2px solid" borderColor="#6161FF20" position="relative">
              <HStack justify="space-between" mb={3}>
                <Bell size={24} color="#6161FF" />
                {kpis.alerts > 0 && (
                  <Badge bg="#EF4444" color="white" borderRadius="full" px={2}>{kpis.alerts}</Badge>
                )}
              </HStack>
              <Text fontSize="3xl" fontWeight="bold">{kpis.alerts}</Text>
              <Text fontSize="sm" color="whiteAlpha.700">Alerts</Text>
            </Box>
          </SimpleGrid>
        </Box>

        {/* Two Column Layout */}
        <SimpleGrid columns={{ base: 1, lg: 2 }} gap={6}>
          {/* Activity Feed */}
          <Box>
            <Heading fontSize="xl" mb={4}>Activity Feed</Heading>
            <Stack gap={4}>
              {activityFeed.map((item, idx) => (
                <HStack 
                  key={idx} 
                  bg="#1E293B" 
                  p={4} 
                  borderRadius="lg" 
                  gap={4}
                  cursor="pointer"
                  _hover={{ bg: '#334155' }}
                  onClick={() => {
                    trackViewed(item.property.id);
                    setSelectedProperty(item.property);
                  }}
                >
                  <Box width="60px" height="60px" bg="#374151" borderRadius="md" flexShrink={0} />
                  <VStack align="start" flex={1} gap={1}>
                    <Text fontSize="sm" fontWeight="semibold">{item.property.name?.split(',')[0]}</Text>
                    {item.type === 'price_drop' && (
                      <HStack gap={2}>
                        <Badge bg="#6161FF" color="white" size="sm">Price Drop</Badge>
                        <Text fontSize="sm" color="whiteAlpha.700">
                          {formatPrice(item.oldPrice)} → {formatPrice(item.newPrice)}
                        </Text>
                      </HStack>
                    )}
                    {item.type === 'status_change' && (
                      <Badge bg="#22C55E" color="white" size="sm">Relisted</Badge>
                    )}
                    {item.type === 'new_listing' && (
                      <Badge bg="#3B82F6" color="white" size="sm">New</Badge>
                    )}
                    <Text fontSize="xs" color="whiteAlpha.600">{formatTimeAgo(item.timestamp)}</Text>
                  </VStack>
                </HStack>
              ))}
            </Stack>
          </Box>

          {/* Smart Recommendations */}
          <Box>
            <Heading fontSize="xl" mb={4}>Smart Recommendations</Heading>
            <Stack gap={4}>
              {recommendations.map((property) => (
                <Box key={property.id} bg="#1E293B" borderRadius="lg" overflow="hidden">
                  <Box height="200px" bg="#374151" />
                  <Box p={6}>
                    <HStack gap={1} mb={2}>
                      <MapPin size={14} />
                      <Text fontSize="sm">{property.address?.city || 'Windsor'}, ON</Text>
                    </HStack>
                    <Text fontSize="2xl" fontWeight="bold" mb={4}>{formatPrice(property.price)}</Text>
                    <Progress.Root value={property.scores?.global || 0} size="lg" colorPalette="purple" mb={4}>
                      <Progress.Track><Progress.Range /></Progress.Track>
                      <Progress.Label>
                        Deal Score: {property.scores?.global || 0}/100 {(property.scores?.global || 0) >= 90 ? 'Excellent' : 'Great'}
                      </Progress.Label>
                    </Progress.Root>
                    <HStack gap={2}>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        flex={1}
                        onClick={() => {
                          trackViewed(property.id);
                          setSelectedProperty(property);
                        }}
                      >
                        View Details
                      </Button>
                      <Button bg="#6161FF" color="white" size="sm" flex={1} _hover={{ bg: '#5050EE' }}>
                        Analyze Deal
                      </Button>
                    </HStack>
                  </Box>
                </Box>
              ))}
            </Stack>
          </Box>
        </SimpleGrid>

        {/* Nearby Discoveries Carousel */}
        <Box>
          <HStack justify="space-between" mb={4}>
            <Heading fontSize="xl">Nearby Discoveries</Heading>
            <HStack gap={2}>
              <IconButton 
                size="sm" 
                variant="ghost" 
                onClick={() => setCarouselOffset(Math.max(0, carouselOffset - 1))}
                disabled={carouselOffset === 0}
              >
                <ChevronLeft size={20} />
              </IconButton>
              <IconButton 
                size="sm" 
                variant="ghost"
                onClick={() => setCarouselOffset(Math.min(discoveries.length - 4, carouselOffset + 1))}
                disabled={carouselOffset >= discoveries.length - 4}
              >
                <ChevronRight size={20} />
              </IconButton>
            </HStack>
          </HStack>
          <Box overflowX="hidden">
            <HStack gap={4} transition="transform 0.3s" transform={`translateX(-${carouselOffset * 280}px)`}>
              {discoveries.map((property) => (
                <Box 
                  key={property.id} 
                  minW="260px" 
                  bg="#1E293B" 
                  borderRadius="lg" 
                  overflow="hidden"
                  cursor="pointer"
                  _hover={{ transform: 'scale(1.02)' }}
                  transition="all 0.2s"
                  onClick={() => {
                    trackViewed(property.id);
                    setSelectedProperty(property);
                  }}
                >
                  <Box height="180px" bg="#374151" position="relative">
                    <Box position="absolute" top={3} left={3} bg="blackAlpha.700" px={3} py={1} borderRadius="md">
                      <Text fontSize="lg" fontWeight="bold">{formatPrice(property.price)}</Text>
                    </Box>
                    <Box position="absolute" top={3} right={3}>
                      <Badge bg={property.scores?.global >= 80 ? '#22C55E' : '#6161FF'} color="white">
                        {property.scores?.global || 0}
                      </Badge>
                    </Box>
                  </Box>
                  <Box p={4}>
                    <Badge bg="#374151" color="white" size="sm" mb={2}>{property.category}</Badge>
                    <Text fontSize="sm" fontWeight="semibold" noOfLines={1}>
                      {property.name?.split(',')[0]}
                    </Text>
                  </Box>
                </Box>
              ))}
            </HStack>
          </Box>
        </Box>
      </Stack>

      {/* Property Detail Modal */}
      {selectedProperty && (
        <PropertyDetailView
          property={selectedProperty}
          allProperties={allProperties}
          onClose={() => setSelectedProperty(null)}
          onToggleFavorite={() => {}}
          isFavorite={false}
        />
      )}
    </Box>
  );
}
