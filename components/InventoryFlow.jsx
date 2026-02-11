import React, { useState, useMemo } from 'react';
import { SimpleGrid, Stack, HStack, Button, Box, Text, Tooltip, IconButton } from '@chakra-ui/react';
import KPICard from '@components/KPICard';
import ChartCard from '@components/ChartCard';
import { Bar, Line } from '@charts';
import { TrendingUp, TrendingDown, Activity, RotateCcw, Info } from 'lucide-react';

export default function InventoryFlow({ properties }) {
  const [timePeriod, setTimePeriod] = useState('Weekly');

  // Calculate KPI stats (Overall, not affected by time period)
  const stats = useMemo(() => {
    const totalNew = properties.filter(p => p.column1stListingDate).length;
    const totalRemoved = properties.filter(p => p.dateRemoved).length;
    const netChange = totalNew - totalRemoved;
    const turnoverRate = totalRemoved > 0 ? ((totalRemoved / totalNew) * 100).toFixed(1) : 0;

    return { totalNew, totalRemoved, netChange, turnoverRate };
  }, [properties]);

  // Unified inventory flow data based on time period
    const chartData = useMemo(() => {
      console.log('=== INVENTORY FLOW DEBUG ===');
  console.log('Total properties:', properties.length);
    
        // Debug: Count properties with dateRemoved
        const propertiesWithRemovalDate = properties.filter(p => p.dateRemoved);
  const propertiesWithListingDate = properties.filter(p => p.column1stListingDate);
        const removedStatus = properties.filter(p => p.listingStatus === 'Removed');
    
        console.log('Properties with column1stListingDate:', propertiesWithListingDate.length);
          console.log('Properties with dateRemoved field:', propertiesWithRemovalDate.length);
          console.log('Properties with "Removed" status:', removedStatus.length);
          console.log('Sample dateRemoved values:', propertiesWithRemovalDate.slice(0, 5).map(p => ({ name: p.name, dateRemoved: p.dateRemoved })));
    
          const dataMap = {};

          const getKey = (dateStr) => {
        if (!dateStr) return null;
          const date = new Date(dateStr);
          if (isNaN(date.getTime())) return null;

      if (timePeriod === 'Daily') {
  return date.toISOString().split('T')[0];
      } else if (timePeriod === 'Weekly') {
        // Calculate ISO Week
          const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
          const dayNum = d.getUTCDay() || 7;
            d.setUTCDate(d.getUTCDate() + 4 - dayNum);
            const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
          const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1)/7);
        return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
  } else {
        // Monthly
          return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          }
            };

          let addedCount = 0;
        let removedCount = 0;

  properties.forEach(prop => {
      // Track new listings
      if (prop.column1stListingDate) {
  const key = getKey(prop.column1stListingDate);
      if (key) {
        if (!dataMap[key]) dataMap[key] = { added: 0, removed: 0 };
        dataMap[key].added += 1;
        addedCount++;
          }
          }

          // Track removed listings
        if (prop.dateRemoved) {
    const key = getKey(prop.dateRemoved);
          if (key) {
            if (!dataMap[key]) dataMap[key] = { added: 0, removed: 0 };
            dataMap[key].removed += 1;
            removedCount++;
          }
        }
      });

      console.log('Total added to chart:', addedCount);
      console.log('Total removed to chart:', removedCount);
      console.log('Unique periods:', Object.keys(dataMap).length);
      console.log('Sample dataMap entries:', Object.entries(dataMap).slice(0, 5));
      console.log('=== END INVENTORY FLOW DEBUG ===\n');

      // Determine slice count based on granularity
      const sliceCount = timePeriod === 'Daily' ? -30 : -12;

      return Object.entries(dataMap)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .slice(sliceCount)
        .map(([period, data]) => ({
          period,
          newListings: data.added,
          removedListings: data.removed,
          netChange: data.added - data.removed
        }));
    }, [properties, timePeriod]);

  return (
    <Stack gap={6}>
      {/* Header with Time Period Selector */}
      <HStack justify="space-between" wrap="wrap" gap={4}>
        <Box>
          <Text fontSize="lg" fontWeight="semibold">Inventory Analysis</Text>
          <Text fontSize="sm" color="fg.muted">Track listing flow and turnover</Text>
        </Box>
        
        <HStack bg="bg.subtle" p={1} borderRadius="lg" gap={0}>
          {['Daily', 'Weekly', 'Monthly'].map(period => (
            <Button
              key={period}
              size="sm"
              variant={timePeriod === period ? 'solid' : 'ghost'}
              colorPalette={timePeriod === period ? 'blue' : 'gray'}
              onClick={() => setTimePeriod(period)}
              borderRadius="md"
              px={4}
            >
              {period}
            </Button>
          ))}
        </HStack>
      </HStack>

      {/* KPIs */}
      <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} gap={4}>
        <KPICard 
          value={stats.totalNew.toLocaleString()} 
          label="Total New Listings" 
          icon={<TrendingUp size={32} />}
        />
        <KPICard 
          value={stats.totalRemoved.toLocaleString()} 
          label="Total Removed" 
          icon={<TrendingDown size={32} />}
        />
        <KPICard 
          value={stats.netChange > 0 ? `+${stats.netChange}` : stats.netChange} 
          label="Net Inventory Change" 
          icon={<Activity size={32} />}
        />
        <KPICard 
          value={`${stats.turnoverRate}%`} 
          label="Turnover Rate" 
          icon={<RotateCcw size={32} />}
        />
      </SimpleGrid>

      {/* Charts */}
          <SimpleGrid columns={{ base: 1, xl: 2 }} gap={4}>
        <Stack gap={2}>
      <HStack justify="space-between">
                  <Box>
                    <Box fontWeight="semibold" fontSize="lg">{timePeriod} Inventory Flow</Box>
                    <Box fontSize="sm" color="fg.muted">New vs removed listings ({timePeriod})</Box>
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
                          <Box>Side-by-side comparison of new properties entering the market versus properties being removed, aggregated by your selected time period (Daily, Weekly, or Monthly).</Box>
                          <Box fontWeight="bold">How to interpret:</Box>
                          <Box>When blue bars (new) are taller, inventory is growing. When orange bars (removed) are taller, inventory is shrinking. Equal heights indicate stable inventory.</Box>
                          <Box fontWeight="bold">Why it matters:</Box>
                          <Box>Inventory flow reveals market dynamics, competition levels, and whether supply is keeping pace with demand. Growing inventory favors buyers; shrinking inventory favors sellers.</Box>
                        </Stack>
                      </Tooltip.Content>
                    </Tooltip.Positioner>
                  </Tooltip.Root>
                </HStack>
                <ChartCard title="" subtitle="">
                  <Bar
                                      data={chartData}
                                      xField="period"
                                      series={[
                                        { key: 'New', yField: 'newListings' },
                                        { key: 'Removed', yField: 'removedListings' }
                                      ]}
                                      groupMode="grouped"
                                      showLegend
                                    colors={['#00c875', '#e2445c']}
                                    />
                </ChartCard>
              </Stack>

              <Stack gap={2}>
                <HStack justify="space-between">
                  <Box>
                    <Box fontWeight="semibold" fontSize="lg">Net Inventory Change</Box>
                    <Box fontSize="sm" color="fg.muted">Net change in listings ({timePeriod})</Box>
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
                          <Box>The net change in inventory (new listings minus removed listings) over time, showing whether total inventory is growing or shrinking.</Box>
                          <Box fontWeight="bold">How to interpret:</Box>
                          <Box>Positive values (above zero) indicate inventory growth. Negative values indicate inventory decline. The steeper the line, the faster the change.</Box>
                          <Box fontWeight="bold">Why it matters:</Box>
                          <Box>Net inventory change is a key market health indicator. Sustained growth may lead to price pressure downward, while sustained decline may drive prices up.</Box>
                        </Stack>
                      </Tooltip.Content>
                    </Tooltip.Positioner>
                  </Tooltip.Root>
                </HStack>
                <ChartCard title="" subtitle="">
                  <Line
                                      data={chartData}
                                      xField="period"
                                      yField="netChange"
                                      seriesLabel="Net Change"
                                      smoothing
                                      enableArea
                                    colors={['#0086c0']}
                                    />
                </ChartCard>
              </Stack>
            </SimpleGrid>
          </Stack>
        );
      }
