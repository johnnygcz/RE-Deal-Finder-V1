import React, { useState, useMemo } from 'react';
import { Box, Stack, HStack, VStack, Text, Badge, Button, IconButton, Table } from '@chakra-ui/react';
import { Heart, ArrowUp, ArrowDown } from 'lucide-react';

export default function DetailedView({ 
  properties, 
  onPropertyClick, 
  favorites, 
  toggleFavorite, 
  sentToGHL, 
  handleSendToGHL,
  findComparables,
  currentUser
}) {
  const [sortConfig, setSortConfig] = useState({ key: 'scores.global', direction: 'desc' });

  // Sort properties
  const sortedProperties = useMemo(() => {
    if (!sortConfig.key) return properties;

    return [...properties].sort((a, b) => {
      // Special handling for favorite sorting
      if (sortConfig.key === 'isFavorited') {
        const aFav = favorites.has(a.id) ? 1 : 0;
        const bFav = favorites.has(b.id) ? 1 : 0;
        return sortConfig.direction === 'desc' ? bFav - aFav : aFav - bFav;
      }

      let aVal = sortConfig.key.includes('.')
        ? sortConfig.key.split('.').reduce((obj, key) => obj?.[key], a)
        : a[sortConfig.key];
      let bVal = sortConfig.key.includes('.')
        ? sortConfig.key.split('.').reduce((obj, key) => obj?.[key], b)
        : b[sortConfig.key];

      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      if (sortConfig.direction === 'asc') {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      } else {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
      }
    });
  }, [properties, sortConfig, favorites]);

  const handleSort = (key) => {
    if (sortConfig.key === key) {
      setSortConfig({ ...sortConfig, direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' });
    } else {
      setSortConfig({ key, direction: 'desc' });
    }
  };

  const SortableHeader = ({ columnKey, children, textAlign = 'left' }) => (
    <Table.ColumnHeader
      cursor="pointer"
      onClick={() => handleSort(columnKey)}
      _hover={{ bg: 'gray.100' }}
      userSelect="none"
      textAlign={textAlign}
    >
      <HStack gap={1} justify={textAlign === 'center' ? 'center' : textAlign === 'right' ? 'flex-end' : 'flex-start'}>
        <Text>{children}</Text>
        {sortConfig.key === columnKey && (
          sortConfig.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
        )}
      </HStack>
    </Table.ColumnHeader>
  );

  const safeNum = (val, decimals = 0) => {
    if (val == null || isNaN(val) || !isFinite(val)) return 0;
    return Number(val).toFixed(decimals);
  };

  const normalizeBedBath = (value) => Array.isArray(value) ? value[0] : value;

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return { bg: '#00C875', color: 'white' };
      case 'relisted':
        return { bg: '#579BFC', color: 'white' };
      case 'removed':
      case 'terminated':
        return { bg: '#E44258', color: 'white' };
      default:
        return { bg: '#E44258', color: 'white' };
    }
  };

  return (
    <Box height="100%" overflowY="auto" bg="white">
      <Table.ScrollArea borderWidth="0">
        <Table.Root size="md" variant="outline" stickyHeader>
          {/* Sticky Header */}
          <Table.Header bg="gray.50" position="sticky" top={0} zIndex={10}>
            <Table.Row>
              <SortableHeader columnKey="isFavorited" textAlign="center">♥</SortableHeader>
              <SortableHeader columnKey="listingStatus">STATUS</SortableHeader>
              <SortableHeader columnKey="scores.global" textAlign="center">Deal Score</SortableHeader>
              <Table.ColumnHeader minW="100px">Address</Table.ColumnHeader>
              <SortableHeader columnKey="column1stPrice" textAlign="right">1st Price</SortableHeader>
              <SortableHeader columnKey="price" textAlign="right">List Price</SortableHeader>
              <Table.ColumnHeader textAlign="right" minW="120px">AVG COMPS</Table.ColumnHeader>
              <SortableHeader columnKey="totalDropAmount" textAlign="right">Total Drop $</SortableHeader>
              <SortableHeader columnKey="dropAsAPercentageOfTheInitialPrice" textAlign="right">Total Drop %</SortableHeader>
              <SortableHeader columnKey="dropFrequencyCount" textAlign="center">Drops</SortableHeader>
              <SortableHeader columnKey="bedrooms" textAlign="center">BEDS</SortableHeader>
              <SortableHeader columnKey="bathrooms" textAlign="center">BATHS</SortableHeader>
              <SortableHeader columnKey="propertyType">TYPE</SortableHeader>
              <SortableHeader columnKey="wards">WARD</SortableHeader>
              <SortableHeader columnKey="realtors.linkedItems.0.name">Realtor Contact</SortableHeader>
              <SortableHeader columnKey="daysOnMarket" textAlign="right">DOM</SortableHeader>
              <Table.ColumnHeader textAlign="center">
                {currentUser?.monGhlColumn === 'JS Send to GHL' ? 'JS GHL' : 
                 currentUser?.monGhlColumn === 'AZ Send to GHL' ? 'AZ GHL' : 'GHL'}
              </Table.ColumnHeader>
            </Table.Row>
          </Table.Header>

          {/* Body with zebra striping */}
          <Table.Body>
            {sortedProperties.map((prop, idx) => {
              const isFavorited = favorites.has(prop.id);
              
              // Get actual GHL status value based on current user's column
              const getGHLStatus = () => {
                if (!currentUser?.monGhlColumn) return null;
                
                // Map column name to property field and return the ACTUAL current value
                if (currentUser.monGhlColumn === 'JS Send to GHL') {
                  return prop.jsSendToGhl || null;
                }
                if (currentUser.monGhlColumn === 'AZ Send to GHL') {
                  return prop.azSendToGhl || null;
                }
                return null;
              };
              
              const ghlStatus = getGHLStatus();
              const isSent = sentToGHL.has(prop.id) || ghlStatus !== null;
              const comps = findComparables(prop);

              // Status styling
              const statusStyle = getStatusColor(prop.listingStatus);

              return (
                <Table.Row
                  key={prop.id}
                  cursor="pointer"
                  onClick={() => onPropertyClick(prop)}
                  _hover={{ bg: 'gray.50' }}
                  bg={idx % 2 === 0 ? 'white' : '#FAFBFC'}
                  borderBottomWidth="1px"
                  borderColor="#E6E9EF"
                >
                  {/* Favorite */}
                  <Table.Cell textAlign="center" py={0.5} px={3} borderRightWidth="1px" borderColor="#E6E9EF">
                    <IconButton
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(prop.id);
                      }}
                      aria-label="Favorite"
                    >
                      <Heart 
                        size={18} 
                        color={isFavorited ? "#e11d48" : "#9ca3af"}
                        fill={isFavorited ? "#e11d48" : "none"}
                      />
                    </IconButton>
                  </Table.Cell>

                  {/* STATUS - Fill entire cell */}
                  <Table.Cell 
                    py={0.5} 
                    px={3} 
                    borderRightWidth="1px" 
                    borderColor="#E6E9EF"
                    bg={statusStyle.bg}
                    color={statusStyle.color}
                    textAlign="center"
                    fontWeight="600"
                    fontSize="xs"
                  >
                    {prop.listingStatus || 'Unknown'}
                  </Table.Cell>

                  {/* Deal Score */}
                  <Table.Cell py={0.5} px={3} textAlign="center" borderRightWidth="1px" borderColor="#E6E9EF">
                    <Badge
                      colorPalette={
                        prop.scores?.global >= 80 ? 'green' :
                        prop.scores?.global >= 60 ? 'teal' :
                        prop.scores?.global >= 40 ? 'orange' : 'red'
                      }
                      variant="solid"
                      size="md"
                    >
                      {safeNum(prop.scores?.global)}
                    </Badge>
                  </Table.Cell>

                  {/* Address (combined listing + address) */}
                  <Table.Cell py={0.5} px={3} borderRightWidth="1px" borderColor="#E6E9EF" minW="100px">
                    <Text fontSize="sm" fontWeight="semibold" color="#323338" lineClamp={1}>
                      {prop.name?.split(',')[0] || prop.name}, {prop.address?.city || 'Windsor'}, ON
                    </Text>
                  </Table.Cell>

                  {/* 1st Price */}
                  <Table.Cell py={0.5} px={3} textAlign="right" borderRightWidth="1px" borderColor="#E6E9EF">
                    ${Number(safeNum(prop.column1stPrice)).toLocaleString()}
                  </Table.Cell>

                  {/* List Price */}
                  <Table.Cell py={0.5} px={3} textAlign="right" fontWeight="bold" borderRightWidth="1px" borderColor="#E6E9EF">
                    ${Number(safeNum(prop.price)).toLocaleString()}
                  </Table.Cell>

                  {/* AVG COMPS */}
                  <Table.Cell py={0.5} px={3} textAlign="right" borderRightWidth="1px" borderColor="#E6E9EF" minW="120px">
                    {comps.count > 0 ? (
                      <Text fontSize="sm" fontWeight="medium">
                        ${comps.avgPrice.toLocaleString()} ({comps.count})
                      </Text>
                    ) : (
                      <Text fontSize="xs" color="fg.muted">No comps</Text>
                    )}
                  </Table.Cell>

                  {/* Total Drop $ */}
                  <Table.Cell py={0.5} px={3} textAlign="right" borderRightWidth="1px" borderColor="#E6E9EF">
                    {prop.totalDropAmount !== 0 ? (
                      <Text 
                        fontWeight="medium"
                        color={prop.totalDropAmount < 0 ? 'red.600' : 'green.600'}
                      >
                        {prop.totalDropAmount < 0 
                          ? `-$${Math.abs(prop.totalDropAmount).toLocaleString()}`
                          : `+$${prop.totalDropAmount.toLocaleString()}`}
                      </Text>
                    ) : (
                      <Text color="fg.muted">$0</Text>
                    )}
                  </Table.Cell>

                  {/* Total Drop % */}
                  <Table.Cell py={0.5} px={3} textAlign="right" borderRightWidth="1px" borderColor="#E6E9EF">
                    {prop.dropAsAPercentageOfTheInitialPrice !== 0 ? (
                      <Text 
                        fontWeight="medium"
                        color={prop.dropAsAPercentageOfTheInitialPrice < 0 ? 'red.600' : 'green.600'}
                      >
                        {safeNum(Math.abs(prop.dropAsAPercentageOfTheInitialPrice), 1)}%
                      </Text>
                    ) : (
                      <Text color="fg.muted">0%</Text>
                    )}
                  </Table.Cell>

                  {/* Drops */}
                  <Table.Cell py={0.5} px={3} textAlign="center" fontWeight="medium" borderRightWidth="1px" borderColor="#E6E9EF">
                    {prop.dropFrequencyCount || 0}
                  </Table.Cell>

                  {/* BEDS */}
                  <Table.Cell py={0.5} px={3} textAlign="center" fontWeight="medium" borderRightWidth="1px" borderColor="#E6E9EF">
                    {normalizeBedBath(prop.bedrooms) || '-'}
                  </Table.Cell>

                  {/* BATHS */}
                  <Table.Cell py={0.5} px={3} textAlign="center" fontWeight="medium" borderRightWidth="1px" borderColor="#E6E9EF">
                    {normalizeBedBath(prop.bathrooms) || '-'}
                  </Table.Cell>

                  {/* TYPE */}
                  <Table.Cell py={0.5} px={3} borderRightWidth="1px" borderColor="#E6E9EF">
                    <Text fontSize="sm" lineClamp={1}>{prop.propertyType || 'N/A'}</Text>
                  </Table.Cell>

                  {/* WARD */}
                  <Table.Cell py={0.5} px={3} borderRightWidth="1px" borderColor="#E6E9EF">
                    <Text fontSize="sm">{prop.wards || '-'}</Text>
                  </Table.Cell>

                  {/* Realtor Contact (Name + Phone) */}
                  <Table.Cell py={0.5} px={3} borderRightWidth="1px" borderColor="#E6E9EF">
                    {(prop.realtors?.linkedItems?.[0]?.name || prop.mobile?.displayValue) ? (
                      <VStack align="start" gap={0} py={0.5}>
                        {prop.realtors?.linkedItems?.[0]?.name && (
                          <Text fontSize="xs" fontWeight="semibold" lineClamp={1}>
                            {prop.realtors.linkedItems[0].name}
                          </Text>
                        )}
                        {prop.mobile?.displayValue && (
                          <Text fontSize="xs" lineClamp={1} color="fg.muted">
                            {prop.mobile.displayValue}
                          </Text>
                        )}
                      </VStack>
                    ) : (
                      <Text fontSize="sm" lineClamp={1} color="fg.muted">-</Text>
                    )}
                  </Table.Cell>

                  {/* DOM */}
                  <Table.Cell py={0.5} px={3} textAlign="right" borderRightWidth="1px" borderColor="#E6E9EF">
                    <Text fontSize="sm" color={prop.daysOnMarket > 30 ? "orange.600" : "fg"}>
                      {safeNum(prop.daysOnMarket)}
                    </Text>
                  </Table.Cell>

                  {/* GHL - Display actual status or button */}
                  <Table.Cell py={0.5} px={3} textAlign="center">
                    {ghlStatus ? (
                      <Badge
                        colorPalette={
                          ghlStatus.toUpperCase() === 'SENT' ? 'green' :
                          ghlStatus.toUpperCase() === 'SEND' ? 'blue' :
                          'orange'
                        }
                        variant="solid"
                        size="sm"
                      >
                        {ghlStatus}
                      </Badge>
                    ) : (
                      <Button 
                        size="sm" 
                        colorPalette="blue"
                        variant="solid"
                        onClick={(e) => handleSendToGHL(e, prop)}
                        disabled={isSent}
                        width="85%"
                      >
                        {isSent ? 'Sent' : 'Send'}
                      </Button>
                    )}
                  </Table.Cell>
                </Table.Row>
              );
            })}
          </Table.Body>
        </Table.Root>
      </Table.ScrollArea>
    </Box>
  );
}
