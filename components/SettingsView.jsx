import { useState, useEffect, useMemo } from 'react';
import { Box, VStack, HStack, Text, Heading, Badge, Button, Card, Stack, SimpleGrid, Input, Select, createListCollection } from '@chakra-ui/react';
import { CheckCircle, XCircle, Database, Trash2, RotateCcw, Globe, Settings as SettingsIcon } from 'lucide-react';
import { clearCache, getCachedProperties } from '@generated/db';
import { fetchProperties } from '@generated/utils/supabaseClient';

const SettingsView = ({ onClearCache, currentUser }) => {
  const [connectionStatus, setConnectionStatus] = useState('idle'); // idle, testing, success, error
  const [lastConnectionTest, setLastConnectionTest] = useState(null);
  const [cacheInfo, setCacheInfo] = useState({ count: 0, timestamp: null });
  const [preferences, setPreferences] = useState(() => {
    try {
      const saved = localStorage.getItem('re_deal_finder_preferences');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
    }
    return {
      defaultCity: 'Windsor',
      defaultSort: 'price',
      defaultView: 'list',
      propertiesPerPage: '50'
    };
  });
  const [lenses, setLenses] = useState([]);

  const sortOptions = useMemo(() => createListCollection({
    items: [
      { label: 'Price', value: 'price' },
      { label: 'DOM', value: 'daysOnMarket' },
      { label: 'Drop %', value: 'dropAsAPercentageOfTheInitialPrice' }
    ]
  }), []);

  const viewOptions = useMemo(() => createListCollection({
    items: [
      { label: 'List', value: 'list' },
      { label: 'Grid', value: 'grid' }
    ]
  }), []);

  const pageOptions = useMemo(() => createListCollection({
    items: [
      { label: '25', value: '25' },
      { label: '50', value: '50' },
      { label: '100', value: '100' }
    ]
  }), []);

  useEffect(() => {
    loadCacheInfo();
    loadPreferences();
    loadLenses();
  }, []);

  const loadCacheInfo = async () => {
    try {
      const cached = await getCachedProperties();
      if (cached) {
        setCacheInfo({ count: cached.properties?.length || 0, timestamp: cached.timestamp });
      }
    } catch (error) {
      console.error('Error loading cache info:', error);
    }
  };

  const loadPreferences = () => {
    const saved = localStorage.getItem('re_deal_finder_preferences');
    if (saved) {
      try {
        setPreferences(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse preferences:', e);
      }
    }
  };

  const loadLenses = () => {
    const saved = localStorage.getItem('re_deal_finder_lenses');
    if (saved) {
      try {
        setLenses(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse lenses:', e);
      }
    }
  };

  const testConnection = async () => {
    setConnectionStatus('testing');
    try {
      const data = await fetchProperties(25);
      if (data && Array.isArray(data) && data.length > 0) {
        setConnectionStatus('success');
        setLastConnectionTest(new Date().toISOString());
      } else {
        setConnectionStatus('error');
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      setConnectionStatus('error');
    }
  };

  const handleClearCache = async () => {
    if (!confirm('Clear all cached data? This will force a fresh fetch on next load.')) return;
    try {
      await clearCache();
      setCacheInfo({ count: 0, timestamp: null });
      if (onClearCache) onClearCache();
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  };

  const updatePreference = (key, value) => {
    const updated = { ...preferences, [key]: value };
    setPreferences(updated);
    localStorage.setItem('re_deal_finder_preferences', JSON.stringify(updated));
  };

  const deleteLens = (lensId) => {
    const updated = lenses.filter(l => l.id !== lensId);
    setLenses(updated);
    localStorage.setItem('re_deal_finder_lenses', JSON.stringify(updated));
  };

  const maskedUrl = 'https://aumlsadh...ebm.supabase.co';

  return (
    <VStack align="stretch" gap={6} overflow="auto" h="calc(100vh - 280px)" pr={2}>
      <Card bg="white" border="1px solid" borderColor="border" rounded="xl" p={6}>
        <VStack align="start" gap={4}>
          <HStack gap={2}>
            <Database size={20} color="var(--chakra-colors-blue-500)" />
            <Heading fontSize="lg" fontWeight="700" color="fg">Supabase Connection</Heading>
          </HStack>
          <HStack gap={4} flexWrap="wrap">
            <Badge colorPalette={connectionStatus === 'success' ? 'green' : connectionStatus === 'error' ? 'red' : 'gray'} variant="solid" rounded="full" px={3} py={1}>
              {connectionStatus === 'success' && <CheckCircle size={14} />}
              {connectionStatus === 'error' && <XCircle size={14} />}
              {connectionStatus === 'success' ? 'Connected' : connectionStatus === 'error' ? 'Connection Failed' : 'Not Tested'}
            </Badge>
            <Text fontSize="sm" color="fg.muted">URL: {maskedUrl}</Text>
            {lastConnectionTest && <Text fontSize="sm" color="fg.muted">Last test: {new Date(lastConnectionTest).toLocaleString()}</Text>}
          </HStack>
          <Button variant="outline" size="sm" onClick={testConnection} disabled={connectionStatus === 'testing'} rounded="xl" borderColor="border.muted">
            {connectionStatus === 'testing' ? 'Testing...' : 'Test Connection'}
          </Button>
        </VStack>
      </Card>

      <Card bg="white" border="1px solid" borderColor="border" rounded="xl" p={6}>
        <VStack align="start" gap={4}>
          <HStack gap={2}>
            <Database size={20} color="var(--chakra-colors-purple-500)" />
            <Heading fontSize="lg" fontWeight="700" color="fg">Cache Management</Heading>
          </HStack>
          <SimpleGrid columns={{ base: 1, md: 3 }} gap={4} w="full">
            <Box p={3} bg="bg.subtle" rounded="lg">
              <Text fontSize="xs" color="fg.muted" mb={1}>Cached Properties</Text>
              <Text fontSize="2xl" fontWeight="700" color="fg">{cacheInfo.count}</Text>
            </Box>
            <Box p={3} bg="bg.subtle" rounded="lg">
              <Text fontSize="xs" color="fg.muted" mb={1}>Last Updated</Text>
              <Text fontSize="sm" fontWeight="600" color="fg">{cacheInfo.timestamp ? new Date(cacheInfo.timestamp).toLocaleString() : 'Never'}</Text>
            </Box>
            <Box p={3} bg="bg.subtle" rounded="lg">
              <Text fontSize="xs" color="fg.muted" mb={1}>Cache TTL</Text>
              <Text fontSize="sm" fontWeight="600" color="fg">15 minutes</Text>
            </Box>
          </SimpleGrid>
          <HStack gap={2}>
            <Button variant="outline" size="sm" onClick={handleClearCache} rounded="xl" borderColor="border.muted" colorPalette="red">
              <Trash2 size={16} /> Clear Cache
            </Button>
          </HStack>
        </VStack>
      </Card>

      <Card bg="white" border="1px solid" borderColor="border" rounded="xl" p={6}>
        <VStack align="start" gap={4}>
          <HStack gap={2}>
            <SettingsIcon size={20} color="var(--chakra-colors-green-500)" />
            <Heading fontSize="lg" fontWeight="700" color="fg">Display Preferences</Heading>
          </HStack>
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={4} w="full">
            <VStack align="start" gap={2}>
              <Text fontSize="sm" fontWeight="600" color="fg">Default City</Text>
              <Input value={preferences.defaultCity} onChange={(e) => updatePreference('defaultCity', e.target.value)} size="sm" bg="bg.subtle" rounded="lg" border="1px solid" borderColor="border" />
            </VStack>
            <VStack align="start" gap={2}>
              <Text fontSize="sm" fontWeight="600" color="fg">Default Sort</Text>
              <Select collection={sortOptions} value={[String(preferences.defaultSort || 'price')]} onValueChange={(details) => updatePreference('defaultSort', details.value[0])} size="sm">
                <SelectTrigger bg="bg.subtle" rounded="lg" border="1px solid" borderColor="border">
                  <SelectValueText placeholder="Select sort" />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.items.map((item) => (
                    <SelectItem item={item} key={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </VStack>
            <VStack align="start" gap={2}>
              <Text fontSize="sm" fontWeight="600" color="fg">Default View</Text>
              <Select collection={viewOptions} value={[String(preferences.defaultView || 'list')]} onValueChange={(details) => updatePreference('defaultView', details.value[0])} size="sm">
                <SelectTrigger bg="bg.subtle" rounded="lg" border="1px solid" borderColor="border">
                  <SelectValueText placeholder="Select view" />
                </SelectTrigger>
                <SelectContent>
                  {viewOptions.items.map((item) => (
                    <SelectItem item={item} key={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </VStack>
            <VStack align="start" gap={2}>
              <Text fontSize="sm" fontWeight="600" color="fg">Properties Per Page</Text>
              <Select collection={pageOptions} value={[String(preferences.propertiesPerPage || '50')]} onValueChange={(details) => updatePreference('propertiesPerPage', details.value[0])} size="sm">
                <SelectTrigger bg="bg.subtle" rounded="lg" border="1px solid" borderColor="border">
                  <SelectValueText placeholder="Select per page" />
                </SelectTrigger>
                <SelectContent>
                  {pageOptions.items.map((item) => (
                    <SelectItem item={item} key={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </VStack>
          </SimpleGrid>
        </VStack>
      </Card>

      <Card bg="white" border="1px solid" borderColor="border" rounded="xl" p={6}>
        <VStack align="start" gap={4}>
          <Heading fontSize="lg" fontWeight="700" color="fg">Saved Lenses</Heading>
          {lenses.length === 0 ? (
            <Text fontSize="sm" color="fg.muted">No custom lenses saved</Text>
          ) : (
            <VStack gap={2} w="full">
              {lenses.map((lens) => (
                <HStack key={lens.id} justify="space-between" p={3} bg="bg.subtle" rounded="lg">
                  <VStack align="start" gap={0}>
                    <Text fontSize="sm" fontWeight="600" color="fg">{lens.name}</Text>
                    <Text fontSize="xs" color="fg.muted">Created: {new Date(lens.createdAt).toLocaleDateString()}</Text>
                  </VStack>
                  <Button variant="ghost" size="sm" colorPalette="red" onClick={() => deleteLens(lens.id)}>
                    <Trash2 size={14} />
                  </Button>
                </HStack>
              ))}
            </VStack>
          )}
        </VStack>
      </Card>

      <Card bg="white" border="1px solid" borderColor="border" rounded="xl" p={6}>
        <VStack align="start" gap={3}>
          <Heading fontSize="lg" fontWeight="700" color="fg">App Information</Heading>
          <SimpleGrid columns={{ base: 1, md: 3 }} gap={4} w="full">
            <Box>
              <Text fontSize="xs" color="fg.muted">Version</Text>
              <Text fontSize="sm" fontWeight="600" color="fg">2.0.0</Text>
            </Box>
            <Box>
              <Text fontSize="xs" color="fg.muted">Data Source</Text>
              <Text fontSize="sm" fontWeight="600" color="fg">Supabase</Text>
            </Box>
            <Box>
              <Text fontSize="xs" color="fg.muted">Cache Engine</Text>
              <Text fontSize="sm" fontWeight="600" color="fg">IndexedDB</Text>
            </Box>
          </SimpleGrid>
        </VStack>
      </Card>
    </VStack>
  );
};

export default SettingsView;
