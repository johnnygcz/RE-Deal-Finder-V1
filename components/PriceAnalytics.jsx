
import React, { useMemo } from 'react';
import { SimpleGrid, Stack, HStack, Tooltip, IconButton, Box } from '@chakra-ui/react';
import ChartCard from '@components/ChartCard';
import { Bar, Pie } from '@charts';
import { Info } from 'lucide-react';

export default function PriceAnalytics({ properties }) {
  // Price distribution by buckets
  const priceDistribution = useMemo(() => {
    const buckets = {
      'Under $100k': 0,
      '$100k-$200k': 0,
      '$200k-$300k': 0,
      '$300k-$500k': 0,
      'Over $500k': 0
    };

    properties.forEach(prop => {
      const price = prop.price;
      if (price < 100000) buckets['Under $100k']++;
      else if (price < 200000) buckets['$100k-$200k']++;
      else if (price < 300000) buckets['$200k-$300k']++;
      else if (price < 500000) buckets['$300k-$500k']++;
      else buckets['Over $500k']++;
    });

    return Object.entries(buckets).map(([range, count]) => ({
      range,
      count
    }));
  }, [properties]);

  // Average price by property type
  const priceByType = useMemo(() => {
    const typeData = {};

    properties.forEach(prop => {
      const type = prop.propertyType || 'Unknown';
      if (!typeData[type]) {
        typeData[type] = { total: 0, count: 0 };
      }
      if (prop.price > 0) {
        typeData[type].total += prop.price;
        typeData[type].count += 1;
      }
    });

    return Object.entries(typeData)
      .filter(([_, data]) => data.count > 0)
      .map(([type, data]) => ({
        type,
        avgPrice: Math.round(data.total / data.count)
      }))
      .sort((a, b) => b.avgPrice - a.avgPrice);
  }, [properties]);

  // Property type distribution for pie chart
  const typeDistribution = useMemo(() => {
    const typeCounts = {};

    properties.forEach(prop => {
      const type = prop.propertyType || 'Unknown';
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });

    return Object.entries(typeCounts)
      .map(([type, count]) => ({
        id: type,
        label: type,
        value: count
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [properties]);

  return (
          <Stack gap={6}>
            <SimpleGrid columns={{ base: 1, xl: 2 }} gap={4}>
              <Stack gap={2}>
                <HStack justify="space-between">
                <Box>
              <Box fontWeight="semibold" fontSize="lg">Price Distribution</Box>
                <Box fontSize="sm" color="fg.muted">Number of properties by price range</Box>
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
              <Box>The number of properties grouped into five price brackets: Under $100k, $100k-$200k, $200k-$300k, $300k-$500k, and Over $500k.</Box>
                <Box fontWeight="bold">How to interpret:</Box>
                  <Box>Taller bars indicate more properties in that price range. This reveals where most inventory is concentrated and which price segments have the most competition.</Box>
                  <Box fontWeight="bold">Why it matters:</Box>
                  <Box>Helps identify market affordability, target buyer segments, and pricing strategies. High concentration in lower brackets may indicate affordability challenges.</Box>
                </Stack>
              </Tooltip.Content>
            </Tooltip.Positioner>
      </Tooltip.Root>
            </HStack>
              <ChartCard title="" subtitle="">
                            <Bar
                          data={priceDistribution}
                            xField="range"
                              yField="count"
                              seriesLabel="Properties"
                              layout="vertical"
                              colors={['#0086c0', '#00c875', '#fdab3d', '#e2445c', '#784bd1']}
                              />
                </ChartCard>
              </Stack>

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
                    <Tooltip.Content maxW="300px">
                      <Stack gap={2} fontSize="sm">
                        <Box fontWeight="bold">What this shows:</Box>
                          <Box>The percentage breakdown of properties by type (Single Family, Apartment, Condo, Multi-family, etc.) showing the top 8 categories.</Box>
                        <Box fontWeight="bold">How to interpret:</Box>
                      <Box>Larger slices represent more common property types in the market. This reveals market composition and dominant property categories.</Box>
                      <Box fontWeight="bold">Why it matters:</Box>
                        <Box>Understanding property type distribution helps target marketing efforts, identify niche opportunities, and understand local housing stock composition.</Box>
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
                </SimpleGrid>

                <Stack gap={2}>
                  <HStack justify="space-between">
                  <Box>
                  <Box fontWeight="semibold" fontSize="lg">Average Price by Property Type</Box>
                <Box fontSize="sm" color="fg.muted">Comparison of average listing prices</Box>
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
                  <Box>The average listing price for each property type, sorted from highest to lowest price.</Box>
                  <Box fontWeight="bold">How to interpret:</Box>
                    <Box>Longer bars indicate higher average prices for that property type. Compare bars to see which types command premium prices versus more affordable options.</Box>
                      <Box fontWeight="bold">Why it matters:</Box>
                        <Box>Reveals which property types are most valuable, helps set realistic pricing expectations, and identifies investment opportunities in undervalued categories.</Box>
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
                                          layout="horizontal"
                                          colors={['#00c875', '#0086c0', '#fdab3d', '#e2445c', '#784bd1', '#579bfc', '#ff158a', '#bb3354']}
                                          />
                    </ChartCard>
                  </Stack>
                </Stack>
              );
}
