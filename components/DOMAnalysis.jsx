import React, { useMemo } from 'react';
import { SimpleGrid, Stack, HStack, Tooltip, IconButton, Box } from '@chakra-ui/react';
import KPICard from '@components/KPICard';
import ChartCard from '@components/ChartCard';
import { Bar, Line } from '@charts';
import { Calendar, TrendingUp, Clock, Target, Info } from 'lucide-react';

export default function DOMAnalysis({ properties }) {
  // DOM distribution by buckets
  const domDistribution = useMemo(() => {
    const buckets = {
      '0-30 days': 0,
      '31-60 days': 0,
      '61-90 days': 0,
      '90+ days': 0
    };

    properties.forEach(prop => {
      const dom = prop.daysOnMarket || 0;
      if (dom <= 30) buckets['0-30 days']++;
      else if (dom <= 60) buckets['31-60 days']++;
      else if (dom <= 90) buckets['61-90 days']++;
      else buckets['90+ days']++;
    });

    return Object.entries(buckets).map(([bucket, count]) => ({
      bucket,
      count
    }));
  }, [properties]);

  // Average DOM trend over time (by month)
  const domTrend = useMemo(() => {
    const monthlyData = {};
    
    properties.forEach(prop => {
      if (prop.column1stListingDate && prop.daysOnMarket > 0) {
        const date = new Date(prop.column1stListingDate);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { total: 0, count: 0 };
        }
        monthlyData[monthKey].total += prop.daysOnMarket;
        monthlyData[monthKey].count += 1;
      }
    });

    return Object.entries(monthlyData)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-12)
      .map(([month, data]) => ({
        month,
        avgDOM: Math.round(data.total / data.count)
      }));
  }, [properties]);

  // DOM by price range correlation
  const domByPriceRange = useMemo(() => {
    const ranges = {
      'Under $100k': { total: 0, count: 0 },
      '$100k-$200k': { total: 0, count: 0 },
      '$200k-$300k': { total: 0, count: 0 },
      '$300k-$500k': { total: 0, count: 0 },
      'Over $500k': { total: 0, count: 0 }
    };

    properties.forEach(prop => {
      const price = prop.price;
      const dom = prop.daysOnMarket || 0;
      
      let range;
      if (price < 100000) range = 'Under $100k';
      else if (price < 200000) range = '$100k-$200k';
      else if (price < 300000) range = '$200k-$300k';
      else if (price < 500000) range = '$300k-$500k';
      else range = 'Over $500k';

      if (dom > 0) {
        ranges[range].total += dom;
        ranges[range].count += 1;
      }
    });

    return Object.entries(ranges)
      .filter(([_, data]) => data.count > 0)
      .map(([range, data]) => ({
        range,
        avgDOM: Math.round(data.total / data.count)
      }));
  }, [properties]);

  // Calculate KPI stats
  const stats = useMemo(() => {
    const doms = properties.filter(p => p.daysOnMarket > 0).map(p => p.daysOnMarket);
    const avgDOM = doms.length > 0 ? Math.round(doms.reduce((a, b) => a + b, 0) / doms.length) : 0;
    const minDOM = doms.length > 0 ? Math.min(...doms) : 0;
    const maxDOM = doms.length > 0 ? Math.max(...doms) : 0;
    const medianDOM = doms.length > 0 ? doms.sort((a, b) => a - b)[Math.floor(doms.length / 2)] : 0;

    return { avgDOM, minDOM, maxDOM, medianDOM };
  }, [properties]);

  return (
    <Stack gap={6}>
      {/* KPIs */}
      <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} gap={4}>
        <KPICard 
          value={`${stats.avgDOM} days`} 
          label="Average DOM" 
          icon={<Calendar size={32} />}
        />
        <KPICard 
          value={`${stats.medianDOM} days`} 
          label="Median DOM" 
          icon={<Target size={32} />}
        />
        <KPICard 
          value={`${stats.minDOM} days`} 
          label="Fastest Sale" 
          icon={<TrendingUp size={32} />}
        />
        <KPICard 
          value={`${stats.maxDOM} days`} 
          label="Longest on Market" 
          icon={<Clock size={32} />}
        />
      </SimpleGrid>

      {/* Charts */}
                  <SimpleGrid columns={{ base: 1, xl: 2 }} gap={4}>
                    <Stack gap={2}>
                      <HStack justify="space-between">
                      <Box>
                    <Box fontWeight="semibold" fontSize="lg">Days on Market Distribution</Box>
                      <Box fontSize="sm" color="fg.muted">Properties grouped by time on market</Box>
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
                    <Box>Properties grouped into four time buckets: 0-30 days, 31-60 days, 61-90 days, and 90+ days on the market.</Box>
                      <Box fontWeight="bold">How to interpret:</Box>
                        <Box>More properties in the 0-30 day bucket indicates a hot market with quick sales. High counts in 90+ days suggests slower market conditions or overpricing.</Box>
                        <Box fontWeight="bold">Why it matters:</Box>
                        <Box>DOM distribution reveals market velocity, helps set realistic sale timelines, and identifies properties that may need price adjustments.</Box>
                        </Stack>
                        </Tooltip.Content>
                        </Tooltip.Positioner>
                      </Tooltip.Root>
                    </HStack>
                  <ChartCard title="" subtitle="">
            <Bar
                              data={domDistribution}
                                xField="bucket"
                                yField="count"
                              seriesLabel="Properties"
                                layout="vertical"
                                  colors={['#00c875', '#fdab3d', '#ff9900', '#e2445c']}
                                  />
                      </ChartCard>
                      </Stack>

                      <Stack gap={2}>
                    <HStack justify="space-between">
                  <Box>
      <Box fontWeight="semibold" fontSize="lg">Average DOM Trend</Box>
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
                                <Box>The average number of days properties stay on the market, calculated monthly over the past year.</Box>
                              <Box fontWeight="bold">How to interpret:</Box>
                            <Box>Decreasing DOM indicates a heating market with faster sales. Increasing DOM suggests cooling conditions or seasonal slowdowns.</Box>
                            <Box fontWeight="bold">Why it matters:</Box>
                              <Box>DOM trends help predict how long new listings will take to sell, identify seasonal patterns, and gauge overall market momentum.</Box>
                                </Stack>
                                  </Tooltip.Content>
                                  </Tooltip.Positioner>
                                  </Tooltip.Root>
                                  </HStack>
                                  <ChartCard title="" subtitle="">
                                  <Line
                                                  data={domTrend}
                                                xField="month"
                                              yField="avgDOM"
                                            seriesLabel="Avg DOM"
                                          smoothing
                                        enableArea
                                        colors={['#784bd1']}
                                        />
                    </ChartCard>
                      </Stack>
                        </SimpleGrid>

                        <Stack gap={2}>
                        <HStack justify="space-between">
                        <Box>
                        <Box fontWeight="semibold" fontSize="lg">DOM by Price Range</Box>
                      <Box fontSize="sm" color="fg.muted">Correlation between price and days on market</Box>
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
                        <Box>The average days on market for properties in different price brackets, revealing how price affects sale speed.</Box>
                        <Box fontWeight="bold">How to interpret:</Box>
                          <Box>Longer bars indicate slower sales in that price range. Typically, higher-priced properties take longer to sell due to smaller buyer pools.</Box>
                            <Box fontWeight="bold">Why it matters:</Box>
                              <Box>Understanding price-DOM correlation helps set realistic expectations, identify sweet spots for quick sales, and adjust pricing strategies.</Box>
                            </Stack>
                          </Tooltip.Content>
                          </Tooltip.Positioner>
                            </Tooltip.Root>
                              </HStack>
                                <ChartCard title="" subtitle="">
                                <Bar
                                                data={domByPriceRange}
                                                xField="range"
                                                yField="avgDOM"
                                                seriesLabel="Avg DOM"
                                              layout="horizontal"
                                            colors={['#579bfc', '#0086c0', '#784bd1', '#bb3354', '#e2445c']}
                                            />
                          </ChartCard>
                        </Stack>
    </Stack>
  );
}
