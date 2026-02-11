import React, { useMemo } from 'react';
import { Box, Stack, SimpleGrid, HStack, Badge, Text, Card, VStack, Separator } from '@chakra-ui/react';
import { Users, TrendingUp, Award, Home, DollarSign, Calendar, MapPin } from 'lucide-react';
import KPICard from '@components/KPICard';
import ChartCard from '@components/ChartCard';
import { Bar } from '@charts';

export default function BuyBoxRealtorMatch({ properties, activeLensFilters, isDefaultLens }) {
  // Don't show chart for "All Listings" default lens
  if (isDefaultLens) {
    return (
      <Box p={8} textAlign="center">
        <VStack gap={3}>
          <Users size={48} color="var(--chakra-colors-fg-muted)" />
          <Text fontSize="lg" fontWeight="semibold" color="fg">
            Select a Custom Lens
          </Text>
          <Text color="fg.muted" maxW="md">
            The Buy Box Realtor Match chart appears when you're viewing a custom lens with specific filter criteria. 
            Switch to "Buy Box" or another custom lens to see which realtors have the most matching inventory.
          </Text>
        </VStack>
      </Box>
    );
  }

  // Calculate market averages for comparison
  const marketStats = useMemo(() => {
    const avgPrice = properties.reduce((sum, p) => sum + (p.price || 0), 0) / properties.length;
    const avgDOM = properties.reduce((sum, p) => sum + (p.daysOnMarket || 0), 0) / properties.length;
    const avgBeds = properties.reduce((sum, p) => sum + (Number(p.bedrooms) || 0), 0) / properties.length;
    const avgBaths = properties.reduce((sum, p) => sum + (Number(p.bathrooms) || 0), 0) / properties.length;
    
    return {
      avgPrice: Math.round(avgPrice),
      avgDOM: Math.round(avgDOM),
      avgBeds: avgBeds.toFixed(1),
      avgBaths: avgBaths.toFixed(1)
    };
  }, [properties]);

  // Calculate detailed realtor statistics with specialty breakdown
  const realtorMatchStats = useMemo(() => {
    const stats = {};

    properties.forEach(prop => {
      // Extract realtor name
      const realtorName = prop.realtors?.linkedItems?.[0]?.name || 'Unknown';
      
      if (!stats[realtorName]) {
        stats[realtorName] = {
          matchingCount: 0,
          totalCount: 0,
          totalPrice: 0,
          totalDOM: 0,
          totalBeds: 0,
          totalBaths: 0,
          wards: {}
        };
      }
      
      // This property is already filtered by lens, so it's a match
      stats[realtorName].matchingCount += 1;
      stats[realtorName].totalCount += 1;
      
      // Accumulate stats for averages
      stats[realtorName].totalPrice += (prop.price || 0);
      stats[realtorName].totalDOM += (prop.daysOnMarket || 0);
      stats[realtorName].totalBeds += (Number(prop.bedrooms) || 0);
      stats[realtorName].totalBaths += (Number(prop.bathrooms) || 0);
      
      // Track ward distribution
      const ward = prop.wards || 'Unknown';
      stats[realtorName].wards[ward] = (stats[realtorName].wards[ward] || 0) + 1;
    });

    // Calculate percentages and averages, sort by matching count
    return Object.entries(stats)
      .map(([realtor, data]) => {
        const count = data.matchingCount;
        const avgPrice = count > 0 ? Math.round(data.totalPrice / count) : 0;
        const avgDOM = count > 0 ? Math.round(data.totalDOM / count) : 0;
        const avgBeds = count > 0 ? (data.totalBeds / count).toFixed(1) : '0.0';
        const avgBaths = count > 0 ? (data.totalBaths / count).toFixed(1) : '0.0';
        
        // Find top wards
        const topWards = Object.entries(data.wards)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([ward, count]) => ({ ward, count }));
        
        return {
          realtor,
          matchingCount: count,
          totalCount: data.totalCount,
          matchPercentage: data.totalCount > 0 ? Math.round((count / data.totalCount) * 100) : 0,
          avgPrice,
          avgDOM,
          avgBeds,
          avgBaths,
          topWards
        };
      })
      .sort((a, b) => b.matchingCount - a.matchingCount);
  }, [properties]);

  // Top 5 realtors
  const top5Realtors = useMemo(() => {
    return realtorMatchStats.slice(0, 5);
  }, [realtorMatchStats]);

  // Chart data
  const chartData = useMemo(() => {
    return top5Realtors.map(stat => ({
      realtor: stat.realtor,
      count: stat.matchingCount,
      percentage: stat.matchPercentage
    }));
  }, [top5Realtors]);

  // KPI calculations
  const stats = useMemo(() => {
    const topRealtor = top5Realtors[0];
    const totalRealtors = realtorMatchStats.length;
    const totalMatchingListings = properties.length;
    const avgListingsPerRealtor = totalRealtors > 0 ? Math.round(totalMatchingListings / totalRealtors) : 0;

    return {
      topRealtor: topRealtor?.realtor || 'N/A',
      topRealtorCount: topRealtor?.matchingCount || 0,
      topRealtorPercentage: topRealtor?.matchPercentage || 0,
      totalRealtors,
      avgListingsPerRealtor
    };
  }, [top5Realtors, realtorMatchStats, properties]);

  return (
    <Stack gap={6}>
      {/* KPIs */}
      <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} gap={4}>
        <KPICard 
          value={stats.topRealtor} 
          label="Best Match Realtor" 
          icon={<Award size={32} />}
        />
        <KPICard 
          value={stats.topRealtorCount.toLocaleString()} 
          label="Matching Listings" 
          icon={<TrendingUp size={32} />}
        />
        <KPICard 
          value={`${stats.topRealtorPercentage}%`} 
          label="Match Rate" 
          icon={<Users size={32} />}
        />
        <KPICard 
          value={stats.totalRealtors} 
          label="Total Realtors with Matches" 
          icon={<Users size={32} />}
        />
      </SimpleGrid>

      {/* Top 5 Realtors Chart */}
      <Box>
        <Stack gap={2}>
          <Box>
            <Box fontWeight="semibold" fontSize="lg">Best Realtors for Your Buy Box</Box>
            <Box fontSize="sm" color="fg.muted">Top 5 realtors with most listings matching your criteria</Box>
          </Box>
          <ChartCard title="" subtitle="">
            <Bar
              data={chartData}
              xField="realtor"
              yField="count"
              seriesLabel="Matching Listings"
              layout="horizontal"
              colors={['#00c875', '#0086c0', '#fdab3d', '#579bfc', '#784bd1']}
            />
          </ChartCard>
        </Stack>
      </Box>

      {/* Enhanced Detailed Breakdown Cards */}
      <SimpleGrid columns={{ base: 1, lg: 2, xl: 3 }} gap={6}>
        {top5Realtors.map((stat, index) => {
          // Calculate comparisons to market averages
          const priceVsMarket = stat.avgPrice - marketStats.avgPrice;
          const domVsMarket = stat.avgDOM - marketStats.avgDOM;
          
          // Calculate comparison to Buy Box range if available
          const priceVsMax = activeLensFilters?.priceMax 
            ? stat.avgPrice - activeLensFilters.priceMax 
            : null;
          
          return (
            <Card.Root 
              key={stat.realtor}
              bg={index === 0 ? 'green.50' : 'bg.surface'}
              borderWidth={index === 0 ? '2px' : '1px'}
              borderColor={index === 0 ? 'green.500' : 'border.muted'}
              shadow={index === 0 ? 'lg' : 'md'}
            >
              <Card.Body>
                <Stack gap={4}>
                  {/* Header with rank and match badge */}
                  <HStack justify="space-between" align="flex-start">
                    <HStack gap={2}>
                      {index === 0 && <Award size={24} color="var(--chakra-colors-green-500)" />}
                      <VStack align="flex-start" gap={0}>
                        <Text fontWeight="bold" fontSize="sm" color="fg.muted">
                          #{index + 1}
                        </Text>
                        {index === 0 && (
                          <Badge colorPalette="green" size="xs">
                            🏆 TOP MATCH
                          </Badge>
                        )}
                      </VStack>
                    </HStack>
                    <Badge colorPalette={index === 0 ? 'green' : 'blue'} size="sm">
                      {stat.matchPercentage}% match
                    </Badge>
                  </HStack>

                  {/* Realtor Name */}
                  <Box>
                    <Text fontWeight="bold" fontSize="xl" lineHeight="1.2" noOfLines={2}>
                      {stat.realtor}
                    </Text>
                  </Box>

                  {/* Matching Listings Count */}
                  <HStack justify="space-between" p={3} bg={index === 0 ? 'green.100' : 'bg.subtle'} borderRadius="md">
                    <Text fontSize="sm" fontWeight="medium" color="fg.muted">Matching listings:</Text>
                    <Text fontSize="2xl" fontWeight="bold" color={index === 0 ? 'green.600' : 'fg'}>
                      {stat.matchingCount}
                    </Text>
                  </HStack>

                  <Separator />

                  {/* Specialty Breakdown */}
                  <VStack align="stretch" gap={3}>
                    <Text fontSize="sm" fontWeight="bold" color="fg.muted">SPECIALTY BREAKDOWN</Text>
                    
                    {/* Average Bedrooms */}
                    <HStack justify="space-between">
                      <HStack gap={2}>
                        <Home size={16} color="var(--chakra-colors-blue-500)" />
                        <Text fontSize="sm">Avg Bedrooms</Text>
                      </HStack>
                      <Badge 
                        colorPalette={stat.avgBeds > marketStats.avgBeds ? 'green' : stat.avgBeds < marketStats.avgBeds ? 'orange' : 'gray'}
                        size="sm"
                      >
                        {stat.avgBeds}
                      </Badge>
                    </HStack>

                    {/* Average Bathrooms */}
                    <HStack justify="space-between">
                      <HStack gap={2}>
                        <Box fontSize="16px">🛁</Box>
                        <Text fontSize="sm">Avg Bathrooms</Text>
                      </HStack>
                      <Badge 
                        colorPalette={stat.avgBaths > marketStats.avgBaths ? 'green' : stat.avgBaths < marketStats.avgBaths ? 'orange' : 'gray'}
                        size="sm"
                      >
                        {stat.avgBaths}
                      </Badge>
                    </HStack>

                    {/* Average Price with comparison */}
                    <HStack justify="space-between">
                      <HStack gap={2}>
                        <DollarSign size={16} color="var(--chakra-colors-green-500)" />
                        <Text fontSize="sm">Avg Price</Text>
                      </HStack>
                      <VStack align="flex-end" gap={0}>
                        <Badge 
                          colorPalette={priceVsMarket < 0 ? 'green' : priceVsMarket > 0 ? 'red' : 'gray'}
                          size="sm"
                        >
                          ${(stat.avgPrice / 1000).toFixed(0)}k
                        </Badge>
                        <Text fontSize="xs" color={priceVsMarket < 0 ? 'green.600' : priceVsMarket > 0 ? 'red.600' : 'fg.muted'}>
                          {priceVsMarket < 0 ? '-' : '+'}{Math.abs(Math.round(priceVsMarket / 1000))}k vs market
                        </Text>
                      </VStack>
                    </HStack>

                    {/* Buy Box Price Comparison */}
                    {priceVsMax !== null && (
                      <Box p={2} bg="blue.50" borderRadius="md">
                        <Text fontSize="xs" color="blue.700" textAlign="center">
                          {priceVsMax < 0 
                            ? `$${Math.abs(Math.round(priceVsMax / 1000))}k below your max` 
                            : `$${Math.round(priceVsMax / 1000)}k above your max`}
                        </Text>
                      </Box>
                    )}

                    {/* Average Days on Market with comparison */}
                    <HStack justify="space-between">
                      <HStack gap={2}>
                        <Calendar size={16} color="var(--chakra-colors-orange-500)" />
                        <Text fontSize="sm">Avg DOM</Text>
                      </HStack>
                      <VStack align="flex-end" gap={0}>
                        <Badge 
                          colorPalette={domVsMarket < 0 ? 'green' : domVsMarket > 0 ? 'red' : 'gray'}
                          size="sm"
                        >
                          {stat.avgDOM} days
                        </Badge>
                        <Text fontSize="xs" color={domVsMarket < 0 ? 'green.600' : domVsMarket > 0 ? 'red.600' : 'fg.muted'}>
                          {Math.abs(domVsMarket)} days {domVsMarket < 0 ? 'faster' : 'slower'} than avg
                        </Text>
                      </VStack>
                    </HStack>

                    {/* Top Wards */}
                    <Box>
                      <HStack gap={2} mb={2}>
                        <MapPin size={16} color="var(--chakra-colors-purple-500)" />
                        <Text fontSize="sm" fontWeight="medium">Top Wards</Text>
                      </HStack>
                      <HStack gap={2} flexWrap="wrap">
                        {stat.topWards.map(({ ward, count }) => (
                          <Badge key={ward} colorPalette="purple" size="sm">
                            {ward} ({count})
                          </Badge>
                        ))}
                      </HStack>
                    </Box>
                  </VStack>
                </Stack>
              </Card.Body>
            </Card.Root>
          );
        })}
      </SimpleGrid>
    </Stack>
  );
}
