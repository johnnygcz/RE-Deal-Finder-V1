
import React, { useMemo } from 'react';
import { SimpleGrid, Stack, HStack, Tooltip, IconButton, Box, Card, VStack, Text } from '@chakra-ui/react';
import KPICard from '@components/KPICard';
import ChartCard from '@components/ChartCard';
import { Line, Bar } from '@charts';
import { TrendingUp, TrendingDown, DollarSign, Calendar, Home, Info, Activity } from 'lucide-react';

export default function MarketOverview({ properties, stats }) {
  // Calculate Inventory Flow metric
  const inventoryFlow = useMemo(() => {
    const totalNew = properties.filter(p => p.column1stListingDate).length;
    const totalRemoved = properties.filter(p => p.dateRemoved).length;
    const netChange = totalNew - totalRemoved;
    return { totalNew, totalRemoved, netChange };
  }, [properties]);

  // Calculate price trend over time (by month)
  const priceTrend = useMemo(() => {
    const monthlyData = {};
    
    properties.forEach(prop => {
      if (prop.column1stListingDate && prop.price > 0) {
        const date = new Date(prop.column1stListingDate);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { total: 0, count: 0 };
        }
        monthlyData[monthKey].total += prop.price;
        monthlyData[monthKey].count += 1;
      }
    });

    return Object.entries(monthlyData)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-12)
      .map(([month, data]) => ({
        month,
        avgPrice: Math.round(data.total / data.count)
      }));
  }, [properties]);

  // Calculate new vs removed listings by month
  const monthlyInventoryFlow = useMemo(() => {
    const monthlyFlow = {};

    properties.forEach(prop => {
      if (prop.column1stListingDate) {
        const date = new Date(prop.column1stListingDate);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyFlow[monthKey]) {
          monthlyFlow[monthKey] = { newListings: 0, removedListings: 0 };
        }
        monthlyFlow[monthKey].newListings += 1;
      }

      if (prop.dateRemoved) {
        const date = new Date(prop.dateRemoved);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyFlow[monthKey]) {
          monthlyFlow[monthKey] = { newListings: 0, removedListings: 0 };
        }
        monthlyFlow[monthKey].removedListings += 1;
      }
    });

    return Object.entries(monthlyFlow)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-12)
      .map(([month, data]) => ({
        month,
        newListings: data.newListings,
        removedListings: data.removedListings
      }));
  }, [properties]);

  return (
    <Stack gap={6}>
      {/* KPIs */}
      <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} gap={4}>
        <KPICard 
          value={stats.totalListings?.toLocaleString() || '0'} 
          label="Total Listings" 
          icon={<Home size={32} />}
        />
        <KPICard 
          value={stats.activeListings?.toLocaleString() || '0'} 
          label="Active Listings" 
          icon={<TrendingUp size={32} />}
        />
        <KPICard 
          value={`$${(stats.avgPrice || 0).toLocaleString()}`} 
          label="Avg Price" 
          icon={<DollarSign size={32} />}
        />
        <Box>
          <Card.Root>
            <Card.Body p={6}>
              <HStack justify="space-between" align="start">
                <VStack align="start" gap={1}>
                  <Text fontSize="sm" color="fg.muted" fontWeight="medium">
                    Inventory Flow
                  </Text>
                  <Text 
                    fontSize="4xl" 
                    fontWeight="bold" 
                    lineHeight="1"
                    color={inventoryFlow.netChange >= 0 ? 'green.600' : 'red.600'}
                  >
                    {inventoryFlow.netChange > 0 ? `+${inventoryFlow.netChange}` : inventoryFlow.netChange}
                  </Text>
                </VStack>
                <Box color={inventoryFlow.netChange >= 0 ? 'green.500' : 'red.500'}>
                  {inventoryFlow.netChange >= 0 ? <TrendingUp size={32} /> : <TrendingDown size={32} />}
                </Box>
              </HStack>
            </Card.Body>
          </Card.Root>
        </Box>
      </SimpleGrid>

      {/* Charts */}
                  <SimpleGrid columns={{ base: 1, xl: 2 }} gap={4}>
                    <Stack gap={2}>
                      <HStack justify="space-between">
                      <Box>
                    <Box fontWeight="semibold" fontSize="lg">Average Listing Price Trend</Box>
                      <Box fontSize="sm" color="fg.muted">Monthly average over last 12 months</Box>
                        </Box>
                        <Tooltip.Root>
                        <Tooltip.Trigger asChild>
                        <IconButton variant="ghost" size="sm" aria-label="Chart info">
                        <Info size={16} />
                        </IconButton>
                      </Tooltip.Trigger>
                    <Tooltip.Positioner>
            <Tooltip.Content maxW="300px">
                    <Stack gap={2} fontSize="sm">
                      <Box fontWeight="bold">What this shows:</Box>
                      <Box>The average listing price calculated monthly over the past 12 months, showing market pricing trends.</Box>
                    <Box fontWeight="bold">How to interpret:</Box>
                      <Box>An upward trend indicates rising property values, while a downward trend suggests declining prices. Flat lines indicate price stability.</Box>
                        <Box fontWeight="bold">Why it matters:</Box>
                        <Box>Understanding price trends helps identify market cycles, optimal listing times, and investment opportunities.</Box>
                        </Stack>
                          </Tooltip.Content>
                          </Tooltip.Positioner>
                        </Tooltip.Root>
                        </HStack>
                        <ChartCard title="" subtitle="">
                      <Line
                                      data={priceTrend}
                                    xField="month"
                                        yField="avgPrice"
                                      seriesLabel="Avg Price"
                                        smoothing
                                          enableArea
                                          colors={['#0086c0']}
                                          />
                        </ChartCard>
                        </Stack>

                        <Stack gap={2}>
                      <HStack justify="space-between">
                    <Box>
      <Box fontWeight="semibold" fontSize="lg">Inventory Flow</Box>
                    <Box fontSize="sm" color="fg.muted">New vs Removed listings per month</Box>
                      </Box>
                        <Tooltip.Root>
                          <Tooltip.Trigger asChild>
                            <IconButton variant="ghost" size="sm" aria-label="Chart info">
                            <Info size={16} />
                              </IconButton>
                            </Tooltip.Trigger>
                          <Tooltip.Positioner>
                          <Tooltip.Content maxW="300px">
                            <Stack gap={2} fontSize="sm">
                              <Box fontWeight="bold">What this shows:</Box>
                                <Box>Monthly comparison of new properties entering the market versus properties being removed (sold, delisted, or expired).</Box>
                              <Box fontWeight="bold">How to interpret:</Box>
                            <Box>When new listings exceed removals, inventory is growing (buyer's market). When removals exceed new listings, inventory is shrinking (seller's market).</Box>
                            <Box fontWeight="bold">Why it matters:</Box>
                              <Box>Inventory flow indicates market health, competition levels, and whether it's a buyer's or seller's market.</Box>
                                </Stack>
                                  </Tooltip.Content>
                                  </Tooltip.Positioner>
                                  </Tooltip.Root>
                                  </HStack>
                                  <ChartCard title="" subtitle="">
                                  <Bar
                                                  data={monthlyInventoryFlow}
                                                xField="month"
                                              series={[
                                            { key: 'New Listings', yField: 'newListings' },
                                          { key: 'Removed', yField: 'removedListings' }
                                        ]}
                                        groupMode="grouped"
                                      showLegend
                                        colors={['#00c875', '#e2445c']}
                                        />
                        </ChartCard>
                        </Stack>
                        </SimpleGrid>
    </Stack>
  );
}
