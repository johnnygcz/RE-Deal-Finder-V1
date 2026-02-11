import React from 'react';
import { Box, HStack, VStack, Text, Badge, SimpleGrid, Button } from '@chakra-ui/react';
import { TrendingDown, Calendar, BarChart3, Heart, Phone } from 'lucide-react';

export default function PropertyCard({ 
  property, 
  onSelect, 
  isSelected = false, 
  isFavorite = false, 
  onToggleFavorite,
  showRealtorCompany = false,
  compact = false,
  currentUser = null,
  onSendToGHL = null,
  realtorBadges = []
}) {
  // Check if listing is removed
  const isRemoved = property.listingStatus === 'Removed';

  // Gradient color based on score (0-100) - GREEN for high, RED for low
  const getScoreGradient = (score) => {
    const safeScore = Math.max(0, Math.min(100, score || 0));
    
    // Grey gradient for removed listings
    if (isRemoved) {
      const intensity = (safeScore / 100) * 30; // 0-30 range
      return `hsl(0, 0%, ${65 - intensity}%)`; // Grey gradient from light to medium
    }
    
    if (safeScore >= 75) {
      // High scores: GREEN (75-100)
      const intensity = ((safeScore - 75) / 25) * 30; // 0-30 range
      return `hsl(120, ${70 + intensity}%, ${45 - intensity * 0.5}%)`; // Green gradient
    } else if (safeScore >= 50) {
      // Medium scores: YELLOW/ORANGE (50-74)
      const intensity = ((safeScore - 50) / 25) * 40; // 0-40 range
      return `hsl(${45 - intensity * 0.5}, ${80 + intensity * 0.2}%, ${55 - intensity * 0.3}%)`; // Yellow to orange
    } else {
      // Low scores: RED (0-49)
      const intensity = (safeScore / 50) * 30; // 0-30 range
      return `hsl(0, ${70 + intensity}%, ${50 - intensity * 0.3}%)`; // Red gradient
    }
  };

  const safeNum = (val, decimals = 0) => {
    if (val == null || isNaN(val) || !isFinite(val)) return 0;
    return Number(val).toFixed(decimals);
  };

  const formatPrice = (price) => {
    const num = Number(safeNum(price));
    if (num === 0) return '$0';
    return `$${num.toLocaleString()}`;
  };

  const handleLikeClick = (e) => {
    e.stopPropagation();
    if (onToggleFavorite) {
      onToggleFavorite(property.id);
    }
  };

  const dropPercent = property.dropAsAPercentageOfTheInitialPrice || 0;
  const dropAmount = property.totalDropAmount || 0;
  const dropFrequency = property.dropFrequencyCount || 0;

  // Calculate days since most recent price drop
  const getDaysSinceLastDrop = () => {
    if (!property.priceHistory || property.priceHistory.length <= 1) return null;
    
    const lastDropDate = property.priceHistory[property.priceHistory.length - 1]?.date;
    if (!lastDropDate) return null;
    
    const now = new Date();
    const dropDate = new Date(lastDropDate);
    const daysDiff = Math.floor((now - dropDate) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 0) return 'TODAY';
    if (daysDiff === 1) return 'YESTERDAY';
    if (daysDiff > 1) return `${daysDiff} DAYS AGO`;
    return null;
  };

  const priceDropTag = getDaysSinceLastDrop();
  const showPriceDropTag = priceDropTag && property.priceHistory && property.priceHistory.length > 1;

  // Calculate days since relisted
  const getDaysSinceRelisted = () => {
    if (!property.relistedDate) return null;
    
    const now = new Date();
    const relistDate = new Date(property.relistedDate);
    const daysDiff = Math.floor((now - relistDate) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 0) return 'TODAY';
    if (daysDiff === 1) return 'YESTERDAY';
    if (daysDiff > 1) return `${daysDiff} DAYS AGO`;
    return null;
  };

  const relistedTag = getDaysSinceRelisted();
  const showRelistedTag = relistedTag && property.listingStatus === 'RELISTED';

  // Check if property was already sent to GHL for this user
  const getGHLStatus = () => {
    if (!currentUser?.monGhlColumn) return null;
    
    // Map column name to property field and return the ACTUAL current value
    if (currentUser.monGhlColumn === 'JS Send to GHL') {
      return property.jsSendToGhl || null;
    }
    if (currentUser.monGhlColumn === 'AZ Send to GHL') {
      return property.azSendToGhl || null;
    }
    return null;
  };

  // GHL Status Display
  const ghlStatus = getGHLStatus();
  const isSent = ghlStatus !== null;
  
  // Check if this property is loved (indicates batch send capability)
  const isLoved = isFavorite;

  const showGHLButton = currentUser?.monGhlColumn && !isRemoved;

  const handleSendToGHL = (e) => {
    e.stopPropagation();
    if (onSendToGHL) {
      onSendToGHL(property.id);
    }
  };

  return (
    <Box width="100%">
      <Box
        bg={isRemoved ? '#F5F5F5' : 'white'}
        p={1}
        borderRadius="lg"
        cursor="pointer"
        onClick={onSelect}
        _hover={isRemoved 
          ? { bg: '#ECECEC' } 
          : { bg: 'gray.50', transform: 'translateY(-2px)', shadow: 'md' }
        }
        transition="all 0.2s"
        borderWidth={isSelected ? '2px' : '1px'}
        borderColor={isSelected ? 'blue.500' : isRemoved ? '#D1D5DB' : 'gray.200'}
        position="relative"
        width="100%"
        shadow={isRemoved ? 'xs' : 'sm'}
        opacity={isRemoved ? 0.85 : 1}
      >
        {/* TOP RIGHT: Deal Score Badge - Absolute positioning */}
        <Badge
          position="absolute"
          right={3}
          top={3}
          variant="solid"
          fontSize="xl"
          fontWeight="bold"
          px={3.5}
          py={1.5}
          borderRadius="md"
          bg={getScoreGradient(property.scores?.global || 0)}
          color="white"
          shadow="sm"
          zIndex={10}
        >
          {safeNum(property.scores?.global || 0)}
        </Badge>

        {/* TOP RIGHT: Like Button - Absolute positioning, below deal score */}
        <Box
          position="absolute"
          right={3}
          top={14}
          cursor="pointer"
          onClick={handleLikeClick}
          _hover={{ transform: 'scale(1.15)' }}
          transition="transform 0.2s"
          p={2}
          borderRadius="md"
          bg={isRemoved ? '#F5F5F5' : 'white'}
          shadow="sm"
          border="1px solid"
          borderColor={isRemoved ? '#D1D5DB' : 'gray.200'}
          zIndex={10}
        >
          <Heart 
            size={26} 
            color={isRemoved ? '#9CA3AF' : '#e11d48'} 
            fill={isFavorite ? (isRemoved ? '#9CA3AF' : '#e11d48') : 'none'} 
          />
        </Box>

        <VStack align="start" gap={0.5} width="full" pr={20}>
          {/* ROW 1: Price at top */}
          <Text 
            fontSize="lg" 
            fontWeight="bold" 
            lineHeight="1" 
            color={isRemoved ? '#6B7280' : 'gray.900'} 
            letterSpacing="-0.5px"
          >
            {formatPrice(property.price)}
          </Text>

          {/* ROW 2: Address */}
          <Box width="full">
            <Text 
              fontSize="sm" 
              fontWeight="semibold" 
              color={isRemoved ? '#6B7280' : 'gray.800'} 
              lineClamp={1}
            >
              {property.name?.split(',')[0] || property.name}
            </Text>
            <Text fontSize="xs" color={isRemoved ? '#9CA3AF' : 'gray.600'}>
              {property.address?.city || 'Windsor'}, ON
            </Text>
          </Box>

          {/* ROW 3: Price Drop Tag AND Relisted Tag */}
          {(showPriceDropTag || showRelistedTag) && (
            <HStack gap={1}>
              {showPriceDropTag && (
                <Badge
                  variant="solid"
                  bg={isRemoved ? '#9CA3AF' : '#EF4444'}
                  color="white"
                  fontSize="2xs"
                  fontWeight="semibold"
                  px={2}
                  py={0.5}
                  borderRadius="sm"
                  textTransform="uppercase"
                  shadow="sm"
                  width="fit-content"
                >
                  PRICE DROP {priceDropTag}
                </Badge>
              )}
              {showRelistedTag && (
                <Badge
                  variant="solid"
                  bg={isRemoved ? '#9CA3AF' : '#9333EA'}
                  color="white"
                  fontSize="2xs"
                  fontWeight="semibold"
                  px={2}
                  py={0.5}
                  borderRadius="sm"
                  textTransform="uppercase"
                  shadow="sm"
                  width="fit-content"
                >
                  RELISTED {relistedTag}
                </Badge>
              )}
            </HStack>
          )}

          {/* ROW 4: Property Details (tighter spacing, smaller text) */}
          <HStack gap={1.5} fontSize="sm" color={isRemoved ? '#6B7280' : 'gray.700'} fontWeight="medium" pt={0.5} flexWrap="wrap">
            <Text>{property.bedrooms?.[0] || '-'} bd</Text>
            <Text color={isRemoved ? '#9CA3AF' : 'gray.400'}>·</Text>
            <Text>{property.bathrooms?.[0] || '-'} ba</Text>
            <Text color={isRemoved ? '#9CA3AF' : 'gray.400'}>·</Text>
            <Text color={isRemoved ? '#6B7280' : 'gray.700'}>{property.propertyType || 'N/A'}</Text>
            
            {/* Ward Badge Inline */}
            {property.wards && (
              <>
                <Text color={isRemoved ? '#9CA3AF' : 'gray.400'}>·</Text>
                <Badge 
                  colorPalette={isRemoved ? 'gray' : 'cyan'} 
                  variant="subtle" 
                  size="xs"
                >
                  {property.wards}
                </Badge>
              </>
            )}
          </HStack>

          {/* Realtor Company (optional) */}
          {showRealtorCompany && property.realtorCompanies?.linkedItems?.[0]?.name && (
            <Text fontSize="xs" color={isRemoved ? '#9CA3AF' : 'fg.muted'}>
              Brokerage: {property.realtorCompanies.linkedItems[0].name}
            </Text>
          )}

          {/* Realtor Info (Name + Smart Phone from Realtors board mirror) */}
          {(property.realtors?.linkedItems?.[0]?.name || property.mobile?.displayValue) && (
            <VStack align="start" gap={0.5} fontSize="xs" color={isRemoved ? '#9CA3AF' : 'fg.muted'} pt={0.5} width="full">
              {property.realtors?.linkedItems?.[0]?.name && (
                <Text fontWeight="semibold" color={isRemoved ? '#6B7280' : 'fg'}>{property.realtors.linkedItems[0].name}</Text>
              )}
              {property.mobile?.displayValue && (
                <HStack gap={1}>
                  <Phone size={11} />
                  <Text>{property.mobile.displayValue}</Text>
                </HStack>
              )}
              
              {/* Realtor Performance Badges - Top 5 Categories */}
              {realtorBadges && realtorBadges.length > 0 && (
                <HStack gap={1} flexWrap="wrap" width="full" pt={1}>
                  {realtorBadges.map((badge, idx) => {
                    const Icon = badge.icon;
                    return (
                      <Badge
                        key={idx}
                        colorPalette={badge.color}
                        variant="subtle"
                        size="xs"
                        display="flex"
                        alignItems="center"
                        gap={1}
                        px={1.5}
                        py={0.5}
                      >
                        <Icon size={10} />
                        <Text fontSize="2xs" fontWeight="semibold">{badge.category}</Text>
                        <Text fontSize="2xs" opacity={0.8}>{badge.badgeText}</Text>
                      </Badge>
                    );
                  })}
                </HStack>
              )}
            </VStack>
          )}

          {/* Deal Metrics Grid (tighter spacing) */}
          <SimpleGrid columns={3} gap={1} width="full">
            <Box>
              <HStack gap={0.5} mb={0.5}>
                <TrendingDown size={11} color={isRemoved ? '#9CA3AF' : '#dc2626'} />
                <Text fontSize="xs" color={isRemoved ? '#9CA3AF' : 'gray.600'} fontWeight="medium">Drop %</Text>
              </HStack>
              <Text 
                fontSize="sm" 
                fontWeight="bold" 
                color={isRemoved ? '#6B7280' : (dropPercent < 0 ? 'red.600' : 'gray.700')}
              >
                {dropPercent === 0 ? '-' : `${Math.abs(dropPercent).toFixed(1)}%`}
              </Text>
            </Box>

            <Box>
              <HStack gap={0.5} mb={0.5}>
                <TrendingDown size={11} color={isRemoved ? '#9CA3AF' : '#dc2626'} />
                <Text fontSize="xs" color={isRemoved ? '#9CA3AF' : 'gray.600'} fontWeight="medium">Drop $</Text>
              </HStack>
              <Text 
                fontSize="sm" 
                fontWeight="bold" 
                color={isRemoved ? '#6B7280' : (dropAmount < 0 ? 'red.600' : 'gray.700')}
              >
                {dropAmount === 0 ? '-' : dropAmount < 0 ? `-$${Math.abs(dropAmount).toLocaleString()}` : `+$${dropAmount.toLocaleString()}`}
              </Text>
            </Box>

            <Box>
              <HStack gap={0.5} mb={0.5}>
                <BarChart3 size={11} color={isRemoved ? '#9CA3AF' : '#2563eb'} />
                <Text fontSize="xs" color={isRemoved ? '#9CA3AF' : 'gray.600'} fontWeight="medium">Drops</Text>
              </HStack>
              <Text fontSize="sm" fontWeight="bold" color={isRemoved ? '#6B7280' : 'blue.600'}>
                {dropFrequency}x
              </Text>
            </Box>
          </SimpleGrid>

          {/* Status and DOM Row (tighter spacing) */}
          <HStack justify="space-between" width="full" pt={1} borderTopWidth="1px" borderColor={isRemoved ? '#D1D5DB' : 'gray.100'}>
            <HStack gap={1}>
              {property.listingStatus === 'Active' && (
                <Badge colorPalette="green" variant="subtle" size="sm">
                  <Box
                    as="span"
                    display="inline-block"
                    width="5px"
                    height="5px"
                    borderRadius="full"
                    bg="green.500"
                    mr={0.5}
                  />
                  Active
                </Badge>
              )}
              {property.listingStatus === 'RELISTED' && (
                <Badge colorPalette="purple" variant="subtle" size="sm">
                  <Box
                    as="span"
                    display="inline-block"
                    width="5px"
                    height="5px"
                    borderRadius="full"
                    bg="purple.500"
                    mr={0.5}
                  />
                  Relisted
                </Badge>
              )}
              {property.listingStatus === 'Removed' && (
                <Badge colorPalette="gray" variant="subtle" size="sm">
                  Removed
                </Badge>
              )}
            </HStack>
            <HStack gap={0.5}>
              <Calendar size={11} color={isRemoved ? '#9CA3AF' : '#6b7280'} />
              <Text fontSize="xs" color={isRemoved ? '#6B7280' : 'gray.700'} fontWeight="medium">
                DOM {safeNum(property.daysOnMarket)}
              </Text>
            </HStack>
          </HStack>

          {/* GHL Send Button */}
          {showGHLButton && (
            <Box width="full" pt={1}>
              {ghlStatus ? (
                <Badge 
                  colorPalette={
                    ghlStatus.toUpperCase() === 'SENT' ? 'green' : 
                    ghlStatus.toUpperCase() === 'SEND' ? 'blue' : 
                    'orange'
                  } 
                  variant="solid" 
                  size="sm" 
                  width="full" 
                  textAlign="center"
                  py={1}
                >
                  {ghlStatus}
                </Badge>
              ) : (
                <Button
                  size="sm"
                  width="full"
                  colorPalette={isLoved ? "purple" : "blue"}
                  variant={isLoved ? "solid" : "outline"}
                  onClick={handleSendToGHL}
                  fontSize="xs"
                >
                  {isLoved ? '💙 Send All Loved' : 'Send to GHL'}
                </Button>
              )}
            </Box>
          )}
        </VStack>
      </Box>
    </Box>
  );
}
