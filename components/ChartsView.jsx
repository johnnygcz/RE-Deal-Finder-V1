import React, { useState } from 'react';
import { Box, SimpleGrid, createListCollection, Select, Stack, Text } from '@chakra-ui/react';
import { BarChart, LineChart, PieChart, Activity, TrendingUp, Home, Users, Target } from 'lucide-react';
import MarketOverview from './MarketOverview';
import PriceAnalytics from './PriceAnalytics';
import DOMAnalysis from './DOMAnalysis';
import InventoryFlow from './InventoryFlow';
import PropertyTypeBreakdown from './PropertyTypeBreakdown';
import GeographicInsights from './GeographicInsights';
import RealtorAnalytics from './RealtorAnalytics';
import BuyBoxRealtorMatch from './BuyBoxRealtorMatch';
import RealtorInsights from './RealtorInsights';

export default function ChartsView({ properties, stats, activeLensFilters, isDefaultLens, onNavigateToFilteredList }) {
  const [chartType, setChartType] = useState("overview");

  const chartOptions = createListCollection({
    items: [
      { label: "Market Overview", value: "overview", icon: <Activity size={16} /> },
      { label: "Price Analytics", value: "price", icon: <TrendingUp size={16} /> },
      { label: "Days on Market", value: "dom", icon: <Activity size={16} /> },
      { label: "Inventory Flow", value: "inventory", icon: <BarChart size={16} /> },
      { label: "Property Types", value: "types", icon: <Home size={16} /> },
      { label: "Geographic Insights", value: "geo", icon: <PieChart size={16} /> },
      { label: "Realtor Analytics", value: "realtors", icon: <Users size={16} /> },
      { label: "Best Realtor for Your Buy Box", value: "buybox", icon: <Target size={16} /> },
      { label: "Realtor Insights", value: "insights", icon: <Users size={16} /> },
    ]
  });

  const renderChart = () => {
    switch (chartType) {
      case 'overview': return <MarketOverview properties={properties} stats={stats} />;
      case 'price': return <PriceAnalytics properties={properties} />;
      case 'dom': return <DOMAnalysis properties={properties} />;
      case 'inventory': return <InventoryFlow properties={properties} />;
      case 'types': return <PropertyTypeBreakdown properties={properties} />;
      case 'geo': return <GeographicInsights properties={properties} />;
      case 'realtors': return <RealtorAnalytics properties={properties} />;
      case 'buybox': return <BuyBoxRealtorMatch properties={properties} activeLensFilters={activeLensFilters} isDefaultLens={isDefaultLens} />;
      case 'insights': return <RealtorInsights properties={properties} onRealtorClick={onNavigateToFilteredList} />;
      default: return <MarketOverview properties={properties} stats={stats} />;
    }
  };

  return (
    <Stack gap={6}>
      <Box width="300px">
        <Select.Root 
          collection={chartOptions} 
          value={[chartType]} 
          onValueChange={(e) => setChartType(e.value[0])}
          size="sm"
        >
          <Select.Label fontSize="xs" color="fg.muted">Select Analysis View</Select.Label>
          <Select.Trigger>
            <Select.ValueText placeholder="Select chart..." />
          </Select.Trigger>
          <Select.Positioner>
            <Select.Content>
              {chartOptions.items.map((item) => (
                <Select.Item item={item} key={item.value}>
                  <Box mr={2}>{item.icon}</Box>
                  {item.label}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Positioner>
        </Select.Root>
      </Box>

      <Box>
        {renderChart()}
      </Box>
    </Stack>
  );
}
