import React, { useMemo, useState } from 'react';
import { Stack, SimpleGrid, HStack, Box, IconButton, Tooltip, createListCollection, Select } from '@chakra-ui/react';
import { Info, Users, TrendingUp } from 'lucide-react';
import KPICard from '@components/KPICard';
import ChartCard from '@components/ChartCard';
import { Bar } from '@charts';

export default function RealtorAnalytics({ properties }) {
  const [topN, setTopN] = useState(10);

  const topNOptions = createListCollection({
    items: [
      { label: 'Top 10', value: '10' },
      { label: 'Top 20', value: '20' },
      { label: 'Top 30', value: '30' }
    ]
  });

  // Calculate realtor statistics
  const realtorStats = useMemo(() => {
    const stats = {};

    properties.forEach(prop => {
      // Extract realtor name from board relation
      const realtorName = prop.realtors?.linkedItems?.[0]?.name || 'Unknown';

      if (!stats[realtorName]) {
        stats[realtorName] = {
          count: 0,
          totalDOM: 0,
          domCount: 0
        };
      }

      stats[realtorName].count += 1;

      if (prop.daysOnMarket > 0) {
        stats[realtorName].totalDOM += prop.daysOnMarket;
        stats[realtorName].domCount += 1;
      }
    });

    return Object.entries(stats)
      .map(([realtor, data]) => ({
        realtor,
        count: data.count,
        avgDOM: data.domCount > 0 ? Math.round(data.totalDOM / data.domCount) : 0
      }))
      .sort((a, b) => b.count - a.count);
  }, [properties]);

  // Top realtors by inventory
  const topRealtorsByInventory = useMemo(() => {
    return realtorStats.slice(0, topN).map(stat => ({
      realtor: stat.realtor,
      count: stat.count
    }));
  }, [realtorStats, topN]);

  // Top realtors by average DOM
  const topRealtorsByDOM = useMemo(() => {
    return realtorStats
      .filter(stat => stat.avgDOM > 0)
      .sort((a, b) => b.avgDOM - a.avgDOM)
      .slice(0, topN)
      .map(stat => ({
        realtor: stat.realtor,
        avgDOM: stat.avgDOM
      }));
  }, [realtorStats, topN]);

  // KPI calculations
  const stats = useMemo(() => {
    const totalRealtors = realtorStats.length;
    const topRealtor = realtorStats[0];
    const avgListingsPerRealtor = properties.length > 0 ? Math.round(properties.length / totalRealtors) : 0;

    return {
      totalRealtors,
      topRealtor: topRealtor?.realtor || 'N/A',
      topRealtorCount: topRealtor?.count || 0,
      avgListingsPerRealtor
    };
  }, [realtorStats, properties]);

  return (
    <Stack gap={6}>
      {/* Top N Selector */}
      <Box width="200px">
        <Select.Root
          collection={topNOptions}
          value={[topN.toString()]}
          onValueChange={(e) => setTopN(Number(e.value[0]))}
          size="sm"
        >
          <Select.Label fontSize="xs" color="fg.muted">Show Top Realtors</Select.Label>
          <Select.Trigger>
            <Select.ValueText />
          </Select.Trigger>
          <Select.Content>
            {topNOptions.items.map((item) => (
              <Select.Item item={item} key={item.value}>
                {item.label}
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Root>
      </Box>

      {/* KPIs */}
      <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} gap={4}>
        <KPICard
          value={stats.totalRealtors}
          label="Total Realtors"
          icon={<Users size={32} />}
        />
        <KPICard
          value={stats.topRealtor}
          label="Top Realtor"
          icon={<Users size={32} />}
        />
        <KPICard
          value={stats.topRealtorCount.toLocaleString()}
          label="Listings by Top Realtor"
          icon={<TrendingUp size={32} />}
        />
        <KPICard
          value={stats.avgListingsPerRealtor}
          label="Avg Listings/Realtor"
          icon={<TrendingUp size={32} />}
        />
      </SimpleGrid>

      {/* Charts */}
      <SimpleGrid columns={{ base: 1, xl: 2 }} gap={4}>
        <Stack gap={2}>
          <HStack justify="space-between">
            <Box>
              <Box fontWeight="semibold" fontSize="lg">Inventory by Realtor</Box>
              <Box fontSize="sm" color="fg.muted">Number of listings per realtor (top {topN})</Box>
            </Box>
            <Tooltip asChild>
              <IconButton variant="ghost" size="sm" aria-label="Chart info">
                <Info size={16} />
              </IconButton>
            </Tooltip>
            <Box maxW="300px">
              <Stack gap={2} fontSize="sm">
                <Box fontWeight="bold">What this shows:</Box>
                <Box>The number of active listings each realtor has in the system.</Box>
                <Box fontWeight="bold">How to interpret:</Box>
                <Box>Longer bars indicate realtors with more inventory. High-volume realtors may offer more opportunities for bulk deals.</Box>
              </Stack>
            </Box>
          </HStack>
          <ChartCard title="" subtitle="">
            <Bar
              data={topRealtorsByInventory}
              xField="realtor"
              yField="count"
              seriesLabel="Listings"
              layout="horizontal"
              colors={['#0086c0', '#00c875', '#fdab3d', '#e2445c', '#784bd1', '#579bfc', '#ff158a', '#bb3354', '#ffcb00', '#9cd326']}
            />
          </ChartCard>
        </Stack>

        <Stack gap={2}>
          <HStack justify="space-between">
            <Box>
              <Box fontWeight="semibold" fontSize="lg">Days on Market by Realtor</Box>
              <Box fontSize="sm" color="fg.muted">Average DOM per realtor (top {topN} by DOM)</Box>
            </Box>
            <Tooltip asChild>
              <IconButton variant="ghost" size="sm" aria-label="Chart info">
                <Info size={16} />
              </IconButton>
            </Tooltip>
            <Box maxW="300px">
              <Stack gap={2} fontSize="sm">
                <Box fontWeight="bold">What this shows:</Box>
                <Box>The average days on market for each realtor's listings.</Box>
                <Box fontWeight="bold">How to interpret:</Box>
                <Box>Higher DOM suggests properties may be priced aggressively or require negotiation. Lower DOM indicates quick-selling realtors.</Box>
              </Stack>
            </Box>
          </HStack>
          <ChartCard title="" subtitle="">
            <Bar
              data={topRealtorsByDOM}
              xField="realtor"
              yField="avgDOM"
              seriesLabel="Avg DOM"
              layout="horizontal"
              colors={['#e2445c', '#fdab3d', '#ffcb00', '#00c875', '#0086c0', '#579bfc', '#784bd1', '#9cd326', '#ff158a', '#bb3354']}
            />
          </ChartCard>
        </Stack>
      </SimpleGrid>
    </Stack>
  );
}
