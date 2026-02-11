import React, { useMemo } from 'react';
import { SimpleGrid, Stack, Box, Text, HStack, Tooltip, IconButton } from '@chakra-ui/react';
import KPICard from '@components/KPICard';
import ChartCard from '@components/ChartCard';
import { Bar, Pie } from '@charts';
import { Home, DollarSign, Calendar, Info } from 'lucide-react';

export default function PropertyTypeBreakdown({ properties }) {
  // Property type statistics
  const typeStats = useMemo(() => {
    const stats = {};
    const total = properties.length;

    properties.forEach(prop => {
      const type = prop.propertyType || 'Unknown';
      if (!stats[type]) {
        stats[type] = {
          count: 0,
          totalPrice: 0,
          totalDOM: 0,
          priceCount: 0,
          domCount: 0
        };
      }

      stats[type].count += 1;

      if (prop.price > 0) {
        stats[type].totalPrice += prop.price;
        stats[type].priceCount += 1;
      }

      if (prop.daysOnMarket > 0) {
        stats[type].totalDOM += prop.daysOnMarket;
        stats[type].domCount += 1;
      }
    });

    return Object.entries(stats)
      .map(([type, data]) => ({
        type,
        count: data.count,
        percentage: ((data.count / total) * 100).toFixed(1),
        avgPrice: data.priceCount > 0 ? Math.round(data.totalPrice / data.priceCount) : 0,
        avgDOM: data.domCount > 0 ? Math.round(data.totalDOM / data.domCount) : 0
      }))
      .sort((a, b) => b.count - a.count);
  }, [properties]);

  // Count by type for pie chart
  const typeDistribution = useMemo(() => {
    return typeStats.slice(0, 8).map(stat => ({
      id: stat.type,
      label: stat.type,
      value: stat.count
    }));
  }, [typeStats]);

  // Average price by type
  const priceByType = useMemo(() => {
    return typeStats
      .filter(stat => stat.avgPrice > 0)
      .map(stat => ({
        type: stat.type,
        avgPrice: stat.avgPrice
      }));
  }, [typeStats]);

  // DOM by type
  const domByType = useMemo(() => {
    return typeStats
      .filter(stat => stat.avgDOM > 0)
      .map(stat => ({
        type: stat.type,
        avgDOM: stat.avgDOM
      }));
  }, [typeStats]);

  // Top 4 types for KPIs
  const topTypes = typeStats.slice(0, 4);

  return (
    <Stack gap={6}>
      {/* Top Property Types KPIs */}
      <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} gap={4}>
        {topTypes.map((stat, index) => (
          <KPICard
            key={stat.type}
            value={stat.count.toLocaleString()}
            label={stat.type}
            icon={<Home size={32} />}
          />
        ))}
      </SimpleGrid>

      {/* Charts */}
      <SimpleGrid columns={{ base: 1, xl: 2 }} gap={4}>
        <Stack gap={2}>
          <HStack justify="space-between">
            <Box>
              <Box fontWeight="semibold" fontSize="lg">Property Type Distribution</Box>
              <Box fontSize="sm" color="fg.muted">Breakdown by property type</Box>
            </Box>
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <IconButton variant="ghost" size="sm" aria-label="Chart info">
                  <Info size={16} />
                </IconButton>
              </Tooltip.Trigger>
              <Tooltip.Positioner>
                <Tooltip.Content maxW="280px" p={3}>
                  <Stack gap={2}>
                    <Box fontWeight="bold">How to interpret:</Box>
                    <Box>This pie chart shows the distribution of property types in the current dataset. Larger slices indicate more common property types.</Box>
                    <Box fontWeight="bold">Why it matters:</Box>
                    <Box>Understanding the market composition helps identify which property types dominate the market and where there might be less competition.</Box>
                  </Stack>
                </Tooltip.Content>
              </Tooltip.Positioner>
            </Tooltip.Root>
          </HStack>
          <ChartCard title="" subtitle="">
            <Pie
              data={typeDistribution}
              innerRadius={0.5}
              showLegend
              colors={['#0086c0', '#00c875', '#fdab3d', '#e2445c', '#784bd1', '#579bfc', '#ff158a', '#bb3354']}
            />
          </ChartCard>
        </Stack>

        <Stack gap={2}>
          <HStack justify="space-between">
            <Box>
              <Box fontWeight="semibold" fontSize="lg">Average Price by Type</Box>
              <Box fontSize="sm" color="fg.muted">Comparison of average listing prices</Box>
            </Box>
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <IconButton variant="ghost" size="sm" aria-label="Chart info">
                  <Info size={16} />
                </IconButton>
              </Tooltip.Trigger>
              <Tooltip.Positioner>
                <Tooltip.Content maxW="280px" p={3}>
                  <Stack gap={2}>
                    <Box fontWeight="bold">How to interpret:</Box>
                    <Box>Taller bars represent property types with higher average listing prices. Compare bars to see relative price differences between types.</Box>
                    <Box fontWeight="bold">Why it matters:</Box>
                    <Box>Average price by type reveals investment entry points and helps identify undervalued segments or premium categories.</Box>
                  </Stack>
                </Tooltip.Content>
              </Tooltip.Positioner>
            </Tooltip.Root>
          </HStack>
          <ChartCard title="" subtitle="">
            <Bar
              data={priceByType}
              xField="type"
              yField="avgPrice"
              seriesLabel="Avg Price"
              colors={['#0086c0', '#00c875', '#fdab3d', '#e2445c', '#784bd1', '#579bfc']}
            />
          </ChartCard>
        </Stack>
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, xl: 2 }} gap={4}>
        <Stack gap={2}>
          <HStack justify="space-between">
            <Box>
              <Box fontWeight="semibold" fontSize="lg">Days on Market by Type</Box>
              <Box fontSize="sm" color="fg.muted">Average time to sell by property type</Box>
            </Box>
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <IconButton variant="ghost" size="sm" aria-label="Chart info">
                  <Info size={16} />
                </IconButton>
              </Tooltip.Trigger>
              <Tooltip.Positioner>
                <Tooltip.Content maxW="280px" p={3}>
                  <Stack gap={2}>
                    <Box fontWeight="bold">How to interpret:</Box>
                    <Box>Longer bars indicate property types that take more time to sell. Shorter bars show types with faster turnover.</Box>
                    <Box fontWeight="bold">Why it matters:</Box>
                    <Box>DOM by type helps set realistic sale timelines, identify high-demand property categories, and understand market liquidity for different investments.</Box>
                  </Stack>
                </Tooltip.Content>
              </Tooltip.Positioner>
            </Tooltip.Root>
          </HStack>
          <ChartCard title="" subtitle="">
            <Bar
              data={domByType}
              xField="type"
              yField="avgDOM"
              seriesLabel="Avg DOM"
              layout="horizontal"
              colors={['#784bd1', '#579bfc', '#0086c0', '#fdab3d', '#e2445c', '#00c875']}
            />
          </ChartCard>
        </Stack>

        {/* Detailed Stats Grid */}
        <Box bg="bg.surface" p={6} borderRadius="xl">
          <Text fontSize="lg" fontWeight="semibold" mb={4}>Detailed Statistics by Type</Text>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4}>
            {typeStats.map(stat => (
              <Box key={stat.type} p={4} bg="bg.subtle" borderRadius="md">
                <Text fontWeight="medium" mb={2}>{stat.type}</Text>
                <Stack gap={1} fontSize="sm" color="fg.muted">
                  <Text><Home size={14} style={{ display: 'inline', marginRight: '8px' }} />{stat.count} properties ({stat.percentage}%)</Text>
                  <Text><DollarSign size={14} style={{ display: 'inline', marginRight: '8px' }} />${stat.avgPrice.toLocaleString()} avg price</Text>
                  <Text><Calendar size={14} style={{ display: 'inline', marginRight: '8px' }} />{stat.avgDOM} avg DOM</Text>
                </Stack>
              </Box>
            ))}
          </SimpleGrid>
        </Box>
      </SimpleGrid>
    </Stack>
  );
}
