import React, { useMemo } from 'react';
import { SimpleGrid, Stack, Box, HStack, Tooltip, IconButton } from '@chakra-ui/react';
import KPICard from '@components/KPICard';
import ChartCard from '@components/ChartCard';
import TableComponent from '@components/Table';
import { Bar, Pie } from '@charts';
import { MapPin, TrendingUp, Home, DollarSign, Info } from 'lucide-react';

export default function GeographicInsights({ properties }) {
  // Ward statistics with realtor data
  const wardStats = useMemo(() => {
    const stats = {};

    properties.forEach(prop => {
      const ward = prop.wards || 'Unknown';
      const realtorName = prop.realtors?.linkedItems?.[0]?.name || 'Unknown';
      
      if (!stats[ward]) {
        stats[ward] = {
          count: 0,
          totalPrice: 0,
          priceCount: 0,
          activeCount: 0,
          realtors: {}
        };
      }
      
      stats[ward].count += 1;
      
      if (prop.price > 0) {
        stats[ward].totalPrice += prop.price;
        stats[ward].priceCount += 1;
      }
      
      if (prop.listingStatus === 'Active') {
        stats[ward].activeCount += 1;
      }
      
      // Track realtor activity per ward
      if (!stats[ward].realtors[realtorName]) {
        stats[ward].realtors[realtorName] = 0;
      }
      stats[ward].realtors[realtorName] += 1;
    });

    return Object.entries(stats)
      .map(([ward, data]) => {
        // Find top realtor in this ward
        const topRealtor = Object.entries(data.realtors)
          .sort((a, b) => b[1] - a[1])[0];
        
        return {
          ward,
          count: data.count,
          avgPrice: data.priceCount > 0 ? Math.round(data.totalPrice / data.priceCount) : 0,
          activeListings: data.activeCount,
          topRealtor: topRealtor ? topRealtor[0] : 'N/A',
          topRealtorCount: topRealtor ? topRealtor[1] : 0
        };
      })
      .sort((a, b) => b.count - a.count);
  }, [properties]);

  // Top wards for charts
  const topWards = wardStats.slice(0, 10);

  // Inventory concentration
  const inventoryConcentration = useMemo(() => {
    return topWards.map(stat => ({
      id: stat.ward,
      label: stat.ward,
      value: stat.count
    }));
  }, [topWards]);

  // Price by ward
  const priceByWard = useMemo(() => {
    return topWards
      .filter(stat => stat.avgPrice > 0)
      .map(stat => ({
        ward: stat.ward,
        avgPrice: stat.avgPrice
      }));
  }, [topWards]);

  // Table structure with realtor data
  const tableStructure = [
    { key: 'ward', label: 'Ward', type: 'text' },
    { key: 'count', label: 'Total Properties', type: 'text' },
    { key: 'activeListings', label: 'Active Listings', type: 'text' },
    { key: 'avgPrice', label: 'Avg Price', type: 'text' },
    { key: 'topRealtor', label: 'Top Realtor', type: 'text' },
    { key: 'topRealtorCount', label: 'Realtor Listings', type: 'text' }
  ];

  // Format table data with realtor info
  const tableData = wardStats.slice(0, 15).map(stat => ({
    id: stat.ward,
    ward: stat.ward,
    count: stat.count.toLocaleString(),
    activeListings: stat.activeListings.toLocaleString(),
    avgPrice: `$${stat.avgPrice.toLocaleString()}`,
    topRealtor: stat.topRealtor,
    topRealtorCount: stat.topRealtorCount.toLocaleString()
  }));

  // Calculate KPIs
  const stats = useMemo(() => {
    const totalWards = wardStats.length;
    const topWard = wardStats[0];
    const avgPropertiesPerWard = Math.round(properties.length / totalWards);

    return {
      totalWards,
      topWard: topWard?.ward || 'N/A',
      topWardCount: topWard?.count || 0,
      avgPropertiesPerWard
    };
  }, [wardStats, properties]);

  return (
    <Stack gap={6}>
      {/* KPIs */}
      <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} gap={4}>
        <KPICard 
          value={stats.totalWards} 
          label="Total Wards" 
          icon={<MapPin size={32} />}
        />
        <KPICard 
          value={stats.topWard} 
          label="Top Ward" 
          icon={<TrendingUp size={32} />}
        />
        <KPICard 
          value={stats.topWardCount.toLocaleString()} 
          label="Properties in Top Ward" 
          icon={<Home size={32} />}
        />
        <KPICard 
          value={stats.avgPropertiesPerWard} 
          label="Avg Properties/Ward" 
          icon={<DollarSign size={32} />}
        />
      </SimpleGrid>

      {/* Charts */}
      <SimpleGrid columns={{ base: 1, xl: 2 }} gap={4}>
        <Stack gap={2}>
          <HStack justify="space-between">
            <Box>
              <Box fontWeight="semibold" fontSize="lg">Inventory Concentration</Box>
              <Box fontSize="sm" color="fg.muted">Properties by top 10 wards</Box>
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
                    <Box>The percentage of total inventory concentrated in the top 10 wards, showing where properties are most densely located.</Box>
                    <Box fontWeight="bold">How to interpret:</Box>
                    <Box>Larger slices indicate wards with more properties. A few dominant slices suggest concentrated markets, while balanced slices indicate distributed inventory.</Box>
                    <Box fontWeight="bold">Why it matters:</Box>
                    <Box>Ward-level concentration helps identify primary investment areas and guides resource allocation strategies.</Box>
                  </Stack>
                </Tooltip.Content>
              </Tooltip.Positioner>
            </Tooltip.Root>
          </HStack>
          <ChartCard title="" subtitle="">
            <Pie
              data={inventoryConcentration}
              innerRadius={0.5}
              showLegend
              colors={['#0086c0', '#00c875', '#fdab3d', '#e2445c', '#784bd1', '#579bfc', '#ff158a', '#bb3354', '#ffcb00', '#9cd326']}
            />
          </ChartCard>
        </Stack>

        <Stack gap={2}>
          <HStack justify="space-between">
            <Box>
              <Box fontWeight="semibold" fontSize="lg">Average Price by Ward</Box>
              <Box fontSize="sm" color="fg.muted">Top 10 wards by property count</Box>
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
                    <Box>The average listing price for the top 10 wards (by volume), sorted from highest to lowest price.</Box>
                    <Box fontWeight="bold">How to interpret:</Box>
                    <Box>Longer bars indicate wards with higher property values. Compare this with inventory counts to find high-value, low-competition markets.</Box>
                    <Box fontWeight="bold">Why it matters:</Box>
                    <Box>Ward location is a primary driver of real estate value. This chart highlights the most expensive and most affordable neighborhoods in your dataset.</Box>
                  </Stack>
                </Tooltip.Content>
              </Tooltip.Positioner>
            </Tooltip.Root>
          </HStack>
          <ChartCard title="" subtitle="">
            <Bar
              data={priceByWard}
              xField="ward"
              yField="avgPrice"
              seriesLabel="Avg Price"
              layout="horizontal"
              colors={['#00c875', '#0086c0', '#fdab3d', '#e2445c', '#784bd1', '#579bfc', '#ff158a', '#bb3354', '#ffcb00', '#9cd326']}
            />
          </ChartCard>
        </Stack>
      </SimpleGrid>

      {/* Ward Statistics Table */}
      <Box bg="bg.surface" p={6} borderRadius="xl">
        <TableComponent 
          structure={tableStructure}
          items={tableData}
        />
      </Box>
    </Stack>
  );
}
