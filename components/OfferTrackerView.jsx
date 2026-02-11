import React, { useState, useEffect, useMemo } from 'react';
import { Box, Table, Input, Button, Badge, HStack, VStack, Text, createListCollection, Select, Portal, Card, Grid, IconButton, Menu, Spinner } from '@chakra-ui/react';
import { Plus, Search, BarChart3, TableIcon, Trash2, Cloud, CloudOff } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { fetchOffersFromSupabase, saveOffersToSupabase } from '../utils/supabaseClient';

export default function OfferTrackerView({ allProperties = [], currentUser }) {
  const [viewMode, setViewMode] = useState('table');
  const [rows, setRows] = useState([]);
  const [searchOpen, setSearchOpen] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [cloudStatus, setCloudStatus] = useState(null); // 'loading', 'saving', 'synced', 'error'
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Normalize offer rows to ensure all fields are defined (prevents controlled/uncontrolled warnings)
  const normalizeOfferRow = (row) => ({
    id: row.id || Date.now(),
    owner: row.owner ?? '',
    property: row.property ?? '',
    propertyId: row.propertyId ?? null,
    offerStatus: row.offerStatus ?? '',
    possibleReconsider: row.possibleReconsider ?? '',
    leadType: row.leadType ?? '',
    dateSubmitted: row.dateSubmitted ?? '',
    askingPrice: row.askingPrice ?? '',
    offerPrice: row.offerPrice ?? '',
    counterOffer: row.counterOffer ?? '',
    annualRentForecast: row.annualRentForecast ?? '',
    notes: row.notes ?? ''
  });

  // Load offers from Supabase first, fallback to localStorage on mount
  useEffect(() => {
    async function loadOffers() {
      if (!currentUser?.username) return;
      
      setCloudStatus('loading');
      const storageKey = `offers_${currentUser.username}`;
      
      try {
        // Try Supabase first
        const cloudOffers = await fetchOffersFromSupabase(currentUser.username);
        
        if (cloudOffers && cloudOffers.length > 0) {
          console.log(`✅ Loaded ${cloudOffers.length} offers from Supabase`);
          // Normalize all rows to prevent undefined values
          const normalizedOffers = cloudOffers.map(normalizeOfferRow);
          setRows(normalizedOffers);
          // Sync to localStorage
          localStorage.setItem(storageKey, JSON.stringify(normalizedOffers));
          setCloudStatus('synced');
        } else {
          // Fallback to localStorage
          console.log('📂 No cloud data, checking localStorage...');
          const saved = localStorage.getItem(storageKey);
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              console.log(`📂 Loaded ${parsed.length} offers from localStorage`);
              // Normalize all rows to prevent undefined values
              const normalizedOffers = parsed.map(normalizeOfferRow);
              setRows(normalizedOffers);
              // Sync to Supabase
              await saveOffersToSupabase(currentUser.username, normalizedOffers);
              setCloudStatus('synced');
            } catch (e) {
              console.error('Failed to parse localStorage offers:', e);
              setCloudStatus('error');
            }
          } else {
            // Initialize with one empty row
            console.log('🆕 Initializing with empty row');
            const initialRow = [{
              id: Date.now(),
              owner: '',
              property: '',
              propertyId: null,
              offerStatus: '',
              possibleReconsider: '',
              leadType: '',
              dateSubmitted: '',
              askingPrice: '',
              offerPrice: '',
              counterOffer: '',
              annualRentForecast: '',
              notes: ''
            }];
            setRows(initialRow);
            setCloudStatus(null);
          }
        }
      } catch (error) {
        console.error('Failed to load offers from cloud:', error);
        // Fallback to localStorage on error
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            // Normalize all rows to prevent undefined values
            const normalizedOffers = parsed.map(normalizeOfferRow);
            setRows(normalizedOffers);
            setCloudStatus('error');
          } catch (e) {
            console.error('Failed to parse localStorage offers:', e);
            setCloudStatus('error');
          }
        } else {
          setCloudStatus('error');
        }
      } finally {
        setIsInitialLoad(false);
      }
    }
    
    loadOffers();
  }, [currentUser]);

  // Save offers to both localStorage and Supabase whenever they change
  useEffect(() => {
    async function saveOffers() {
      if (!currentUser?.username || rows.length === 0 || isInitialLoad) return;
      
      const storageKey = `offers_${currentUser.username}`;
      
      // Save to localStorage immediately (optimistic)
      localStorage.setItem(storageKey, JSON.stringify(rows));
      
      // Save to Supabase in background
      setCloudStatus('saving');
      try {
        const success = await saveOffersToSupabase(currentUser.username, rows);
        setCloudStatus(success ? 'synced' : 'error');
        
        // Clear synced status after 2 seconds
        if (success) {
          setTimeout(() => setCloudStatus(null), 2000);
        }
      } catch (error) {
        console.error('Failed to save offers to cloud:', error);
        setCloudStatus('error');
      }
    }
    
    saveOffers();
  }, [rows, currentUser, isInitialLoad]);

  const offerStatusOptions = createListCollection({
    items: [
      { label: 'DECLINED', value: 'DECLINED' },
      { label: 'Verbal', value: 'Verbal' },
      { label: 'Accepted', value: 'Accepted' },
      { label: 'Pending', value: 'Pending' },
      { label: 'Withdrawn', value: 'Withdrawn' }
    ]
  });

  const reconsiderOptions = createListCollection({
    items: [
      { label: 'YES', value: 'YES' },
      { label: 'NO', value: 'NO' },
      { label: 'Undetermined', value: 'Undetermined' }
    ]
  });

  const leadTypeOptions = createListCollection({
    items: [
      { label: 'Listed', value: 'Listed' },
      { label: 'Off Market', value: 'Off Market' }
    ]
  });

  const handleAddRow = () => {
    const newRow = {
      id: Date.now(), // Use timestamp for unique IDs
      owner: '',
      property: '',
      propertyId: null,
      offerStatus: '',
      possibleReconsider: '',
      leadType: '',
      dateSubmitted: '',
      askingPrice: '',
      offerPrice: '',
      counterOffer: '',
      annualRentForecast: '',
      notes: ''
    };
    setRows([...rows, newRow]);
  };

  const handleDeleteRow = (rowId) => {
    // Confirm deletion
    const confirmed = window.confirm('Are you sure you want to delete this offer? This action cannot be undone.');
    if (!confirmed) return;
    
    // Optimistic update - remove from UI immediately
    const previousRows = rows;
    const updatedRows = rows.filter(row => row.id !== rowId);
    setRows(updatedRows);
    
    // Save to cloud in background (includes deletion)
    if (currentUser?.username) {
      setCloudStatus('saving');
      saveOffersToSupabase(currentUser.username, updatedRows)
        .then(success => {
          if (success) {
            console.log('✅ Offer deleted and synced to cloud');
            setCloudStatus('synced');
            setTimeout(() => setCloudStatus(null), 2000);
          } else {
            console.error('❌ Failed to sync deletion to cloud');
            setCloudStatus('error');
            // Rollback on failure
            setRows(previousRows);
          }
        })
        .catch(error => {
          console.error('❌ Error syncing deletion:', error);
          setCloudStatus('error');
          // Rollback on failure
          setRows(previousRows);
        });
    }
  };

  const handleCellChange = (rowId, field, value) => {
    setRows(rows.map(row => row.id === rowId ? { ...row, [field]: value } : row));
  };

  const handlePropertySelect = (rowId, property) => {
    setRows(rows.map(row => 
      row.id === rowId 
        ? { 
            ...row, 
            property: property.name,
            propertyId: property.id,
            askingPrice: formatCurrency(property.price)
          } 
        : row
    ));
    setSearchOpen(null);
    setSearchQuery('');
  };

  const formatCurrency = (value) => {
    if (!value || value === '') return '';
    const num = parseFloat(value.toString().replace(/[^0-9.-]/g, ''));
    if (isNaN(num)) return '';
    return '$' + num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  const calculateDiff = (asking, counter) => {
    const askNum = parseFloat(asking?.toString().replace(/[^0-9.-]/g, '')) || 0;
    const counterNum = parseFloat(counter?.toString().replace(/[^0-9.-]/g, '')) || 0;
    if (askNum === 0 && counterNum === 0) return '';
    return askNum - counterNum;
  };

  const calculateMAO = (annualRent) => {
    const rentNum = parseFloat(annualRent?.toString().replace(/[^0-9.-]/g, '')) || 0;
    if (rentNum === 0) return '';
    return rentNum / 0.0821;
  };

  const calculateMOASpread = (mao, asking) => {
    const maoNum = typeof mao === 'number' ? mao : parseFloat(mao?.toString().replace(/[^0-9.-]/g, '')) || 0;
    const askNum = parseFloat(asking?.toString().replace(/[^0-9.-]/g, '')) || 0;
    if (maoNum === 0 && askNum === 0) return '';
    return maoNum - askNum;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'DECLINED': return 'red';
      case 'Verbal': return 'orange';
      case 'Accepted': return 'green';
      case 'Pending': return 'orange';
      case 'Withdrawn': return 'gray';
      default: return 'gray';
    }
  };

  const getReconsiderColor = (value) => {
    switch (value) {
      case 'YES': return 'green';
      case 'NO': return 'red';
      case 'Undetermined': return 'gray';
      default: return 'gray';
    }
  };

  // Dashboard calculations
  const dashboardStats = useMemo(() => {
    const totalOffers = rows.length;
    const accepted = rows.filter(r => r.offerStatus === 'Accepted').length;
    const declined = rows.filter(r => r.offerStatus === 'DECLINED').length;
    const avgAsking = rows.reduce((sum, r) => {
      const val = parseFloat(r.askingPrice?.toString().replace(/[^0-9.-]/g, '')) || 0;
      return sum + val;
    }, 0) / (rows.length || 1);
    const avgOffer = rows.reduce((sum, r) => {
      const val = parseFloat(r.offerPrice?.toString().replace(/[^0-9.-]/g, '')) || 0;
      return sum + val;
    }, 0) / (rows.length || 1);
    const acceptanceRate = totalOffers > 0 ? (accepted / totalOffers) * 100 : 0;

    return { totalOffers, accepted, declined, avgAsking, avgOffer, acceptanceRate };
  }, [rows]);

  const pieData = useMemo(() => {
    const statusCounts = {};
    rows.forEach(r => {
      if (r.offerStatus) {
        statusCounts[r.offerStatus] = (statusCounts[r.offerStatus] || 0) + 1;
      }
    });
    return Object.keys(statusCounts).map(status => ({
      name: status,
      value: statusCounts[status],
      color: status === 'DECLINED' ? '#ef4444' : status === 'Verbal' ? '#f97316' : status === 'Accepted' ? '#22c55e' : status === 'Pending' ? '#f59e0b' : '#9ca3af'
    }));
  }, [rows]);

  const barData = useMemo(() => {
    const monthCounts = {};
    rows.forEach(r => {
      if (r.dateSubmitted) {
        const month = new Date(r.dateSubmitted).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        monthCounts[month] = (monthCounts[month] || 0) + 1;
      }
    });
    return Object.keys(monthCounts).map(month => ({ month, count: monthCounts[month] }));
  }, [rows]);

  const filteredProperties = useMemo(() => {
    if (!searchQuery) return allProperties;
    return allProperties.filter(p => 
      p.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [allProperties, searchQuery]);

  return (
    <Box h="100%" display="flex" flexDirection="column" overflow="hidden">
      {/* Header */}
      <Box bg="#334155" px={6} py={4} borderBottomWidth="1px" borderColor="border.muted" flexShrink={0}>
        <HStack justify="space-between">
          <HStack gap={3}>
            <Text fontSize="xl" fontWeight="bold" color="white">Offer Tracker</Text>
            {/* Cloud sync indicator */}
            {cloudStatus === 'loading' && (
              <HStack gap={2} color="white" opacity={0.7}>
                <Spinner size="xs" />
                <Text fontSize="xs">Loading...</Text>
              </HStack>
            )}
            {cloudStatus === 'saving' && (
              <HStack gap={2} color="white" opacity={0.7}>
                <Spinner size="xs" />
                <Text fontSize="xs">Saving...</Text>
              </HStack>
            )}
            {cloudStatus === 'synced' && (
              <HStack gap={2} color="green.300">
                <Cloud size={14} />
                <Text fontSize="xs">Synced</Text>
              </HStack>
            )}
            {cloudStatus === 'error' && (
              <HStack gap={2} color="orange.300">
                <CloudOff size={14} />
                <Text fontSize="xs">Local only</Text>
              </HStack>
            )}
          </HStack>
          <HStack gap={2}>
            <HStack bg="rgba(255,255,255,0.1)" p={1} borderRadius="md">
              <IconButton size="sm" variant={viewMode === 'table' ? 'solid' : 'ghost'} colorPalette={viewMode === 'table' ? 'blue' : 'gray'} onClick={() => setViewMode('table')} aria-label="Table view">
                <TableIcon size={16} />
              </IconButton>
              <IconButton size="sm" variant={viewMode === 'dashboard' ? 'solid' : 'ghost'} colorPalette={viewMode === 'dashboard' ? 'blue' : 'gray'} onClick={() => setViewMode('dashboard')} aria-label="Dashboard view">
                <BarChart3 size={16} />
              </IconButton>
            </HStack>
            {viewMode === 'table' && (
              <Button size="sm" colorPalette="blue" onClick={handleAddRow}>
                <Plus size={16} /> Add Row
              </Button>
            )}
          </HStack>
        </HStack>
      </Box>

      {/* Content */}
      {viewMode === 'dashboard' ? (
        <Box flex="1" overflowY="auto" p={6} bg="gray.50">
          <VStack align="stretch" gap={6}>
            {/* KPI Cards */}
            <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)', lg: 'repeat(6, 1fr)' }} gap={4}>
              <Card.Root bg="#334155" color="white">
                <Card.Body p={4}>
                  <Text fontSize="xs" mb={1}>Total Offers</Text>
                  <Text fontSize="2xl" fontWeight="bold">{dashboardStats.totalOffers}</Text>
                </Card.Body>
              </Card.Root>
              <Card.Root bg="#22c55e" color="white">
                <Card.Body p={4}>
                  <Text fontSize="xs" mb={1}>Accepted</Text>
                  <Text fontSize="2xl" fontWeight="bold">{dashboardStats.accepted}</Text>
                </Card.Body>
              </Card.Root>
              <Card.Root bg="#ef4444" color="white">
                <Card.Body p={4}>
                  <Text fontSize="xs" mb={1}>Declined</Text>
                  <Text fontSize="2xl" fontWeight="bold">{dashboardStats.declined}</Text>
                </Card.Body>
              </Card.Root>
              <Card.Root bg="white">
                <Card.Body p={4}>
                  <Text fontSize="xs" mb={1} color="gray.600">Avg Asking</Text>
                  <Text fontSize="xl" fontWeight="bold">{formatCurrency(dashboardStats.avgAsking)}</Text>
                </Card.Body>
              </Card.Root>
              <Card.Root bg="white">
                <Card.Body p={4}>
                  <Text fontSize="xs" mb={1} color="gray.600">Avg Offer</Text>
                  <Text fontSize="xl" fontWeight="bold">{formatCurrency(dashboardStats.avgOffer)}</Text>
                </Card.Body>
              </Card.Root>
              <Card.Root bg="white">
                <Card.Body p={4}>
                  <Text fontSize="xs" mb={1} color="gray.600">Accept Rate</Text>
                  <Text fontSize="xl" fontWeight="bold">{dashboardStats.acceptanceRate.toFixed(1)}%</Text>
                </Card.Body>
              </Card.Root>
            </Grid>

            {/* Charts */}
            <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }} gap={6}>
              <Card.Root bg="white">
                <Card.Header><Text fontWeight="bold">Offer Status Distribution</Text></Card.Header>
                <Card.Body>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Card.Body>
              </Card.Root>
              <Card.Root bg="white">
                <Card.Header><Text fontWeight="bold">Offers by Month</Text></Card.Header>
                <Card.Body>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={barData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </Card.Body>
              </Card.Root>
            </Grid>
          </VStack>
        </Box>
      ) : (
        <Box flex="1" overflowX="auto" overflowY="auto" bg="white">
          <Table.Root size="sm" variant="outline">
            <Table.Header bg="gray.50" position="sticky" top={0} zIndex={10}>
              <Table.Row>
                <Table.ColumnHeader minW="50px">#</Table.ColumnHeader>
                <Table.ColumnHeader minW="150px">Owner</Table.ColumnHeader>
                <Table.ColumnHeader minW="250px">Property</Table.ColumnHeader>
                <Table.ColumnHeader minW="120px">Status</Table.ColumnHeader>
                <Table.ColumnHeader minW="150px">Reconsider</Table.ColumnHeader>
                <Table.ColumnHeader minW="120px">Lead Type</Table.ColumnHeader>
                <Table.ColumnHeader minW="130px">Date</Table.ColumnHeader>
                <Table.ColumnHeader minW="120px">Asking</Table.ColumnHeader>
                <Table.ColumnHeader minW="120px">Offer</Table.ColumnHeader>
                <Table.ColumnHeader minW="130px">Counter</Table.ColumnHeader>
                <Table.ColumnHeader minW="150px">Diff</Table.ColumnHeader>
                <Table.ColumnHeader minW="160px">Annual Rent</Table.ColumnHeader>
                <Table.ColumnHeader minW="120px">MAO</Table.ColumnHeader>
                <Table.ColumnHeader minW="140px">Spread</Table.ColumnHeader>
                <Table.ColumnHeader minW="300px">Notes</Table.ColumnHeader>
                <Table.ColumnHeader minW="80px">Actions</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {rows.map((row) => {
                const diff = calculateDiff(row.askingPrice, row.counterOffer);
                const mao = calculateMAO(row.annualRentForecast);
                const moaSpread = calculateMOASpread(mao, row.askingPrice);

                return (
                  <Table.Row key={row.id}>
                    <Table.Cell textAlign="center" fontWeight="bold">{row.id}</Table.Cell>
                    <Table.Cell>
                      <Input size="sm" value={row.owner} onChange={(e) => handleCellChange(row.id, 'owner', e.target.value)} variant="ghost" px={2} />
                    </Table.Cell>
                    <Table.Cell>
                      <HStack gap={1}>
                        <Input size="sm" value={row.property} onChange={(e) => handleCellChange(row.id, 'property', e.target.value)} variant="ghost" px={2} flex="1" />
                        <Menu.Root open={searchOpen === row.id} onOpenChange={(e) => setSearchOpen(e.open ? row.id : null)}>
                          <Menu.Trigger asChild>
                            <IconButton size="sm" variant="ghost" aria-label="Search property">
                              <Search size={14} />
                            </IconButton>
                          </Menu.Trigger>
                          <Portal>
                            <Menu.Positioner>
                              <Menu.Content maxH="300px" overflowY="auto" minW="300px">
                                <Box p={2}>
                                  <Input size="sm" placeholder="Search properties..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                                </Box>
                                {filteredProperties.slice(0, 50).map(prop => (
                                  <Menu.Item key={prop.id} value={prop.id} onClick={() => handlePropertySelect(row.id, prop)}>
                                    <Text fontSize="sm">{prop.name}</Text>
                                  </Menu.Item>
                                ))}
                              </Menu.Content>
                            </Menu.Positioner>
                          </Portal>
                        </Menu.Root>
                      </HStack>
                    </Table.Cell>
                    <Table.Cell>
                      <Select.Root collection={offerStatusOptions} size="sm" value={row.offerStatus ? [row.offerStatus] : []} onValueChange={(e) => handleCellChange(row.id, 'offerStatus', e.value[0])}>
                        <Select.Control>
                          <Select.Trigger>
                            <Select.ValueText placeholder="Select...">
                              {row.offerStatus && <Badge colorPalette={getStatusColor(row.offerStatus)} size="sm">{row.offerStatus}</Badge>}
                            </Select.ValueText>
                          </Select.Trigger>
                        </Select.Control>
                        <Portal>
                          <Select.Positioner>
                            <Select.Content>
                              {offerStatusOptions.items.map((item) => (
                                <Select.Item key={item.value} item={item}>
                                  <Badge colorPalette={getStatusColor(item.value)} size="sm">{item.label}</Badge>
                                </Select.Item>
                              ))}
                            </Select.Content>
                          </Select.Positioner>
                        </Portal>
                      </Select.Root>
                    </Table.Cell>
                    <Table.Cell>
                      <Select.Root collection={reconsiderOptions} size="sm" value={row.possibleReconsider ? [row.possibleReconsider] : []} onValueChange={(e) => handleCellChange(row.id, 'possibleReconsider', e.value[0])}>
                        <Select.Control>
                          <Select.Trigger>
                            <Select.ValueText placeholder="Select...">
                              {row.possibleReconsider && <Badge colorPalette={getReconsiderColor(row.possibleReconsider)} size="sm">{row.possibleReconsider}</Badge>}
                            </Select.ValueText>
                          </Select.Trigger>
                        </Select.Control>
                        <Portal>
                          <Select.Positioner>
                            <Select.Content>
                              {reconsiderOptions.items.map((item) => (
                                <Select.Item key={item.value} item={item}>
                                  <Badge colorPalette={getReconsiderColor(item.value)} size="sm">{item.label}</Badge>
                                </Select.Item>
                              ))}
                            </Select.Content>
                          </Select.Positioner>
                        </Portal>
                      </Select.Root>
                    </Table.Cell>
                    <Table.Cell>
                      <Select.Root collection={leadTypeOptions} size="sm" value={row.leadType ? [row.leadType] : []} onValueChange={(e) => handleCellChange(row.id, 'leadType', e.value[0])}>
                        <Select.Control>
                          <Select.Trigger><Select.ValueText placeholder="Select..." /></Select.Trigger>
                        </Select.Control>
                        <Portal>
                          <Select.Positioner>
                            <Select.Content>
                              {leadTypeOptions.items.map((item) => (
                                <Select.Item key={item.value} item={item}>{item.label}</Select.Item>
                              ))}
                            </Select.Content>
                          </Select.Positioner>
                        </Portal>
                      </Select.Root>
                    </Table.Cell>
                    <Table.Cell>
                      <Input size="sm" type="date" value={row.dateSubmitted} onChange={(e) => handleCellChange(row.id, 'dateSubmitted', e.target.value)} variant="ghost" px={2} />
                    </Table.Cell>
                    <Table.Cell>
                      <Input size="sm" value={row.askingPrice} onChange={(e) => handleCellChange(row.id, 'askingPrice', e.target.value)} onBlur={(e) => handleCellChange(row.id, 'askingPrice', formatCurrency(e.target.value))} variant="ghost" px={2} />
                    </Table.Cell>
                    <Table.Cell>
                      <Input size="sm" value={row.offerPrice} onChange={(e) => handleCellChange(row.id, 'offerPrice', e.target.value)} onBlur={(e) => handleCellChange(row.id, 'offerPrice', formatCurrency(e.target.value))} variant="ghost" px={2} />
                    </Table.Cell>
                    <Table.Cell>
                      <Input size="sm" value={row.counterOffer} onChange={(e) => handleCellChange(row.id, 'counterOffer', e.target.value)} onBlur={(e) => handleCellChange(row.id, 'counterOffer', formatCurrency(e.target.value))} variant="ghost" px={2} />
                    </Table.Cell>
                    <Table.Cell>
                      <Text fontSize="sm" fontWeight="medium">{diff !== '' ? formatCurrency(diff) : ''}</Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Input size="sm" value={row.annualRentForecast} onChange={(e) => handleCellChange(row.id, 'annualRentForecast', e.target.value)} onBlur={(e) => handleCellChange(row.id, 'annualRentForecast', formatCurrency(e.target.value))} variant="ghost" px={2} />
                    </Table.Cell>
                    <Table.Cell>
                      <Text fontSize="sm" fontWeight="medium">{mao !== '' ? formatCurrency(mao) : ''}</Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Text fontSize="sm" fontWeight="medium" color={moaSpread !== '' ? (moaSpread < 0 ? 'red.600' : 'green.600') : 'inherit'}>
                        {moaSpread !== '' ? formatCurrency(moaSpread) : ''}
                      </Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Input size="sm" value={row.notes} onChange={(e) => handleCellChange(row.id, 'notes', e.target.value)} variant="ghost" px={2} />
                    </Table.Cell>
                    <Table.Cell textAlign="center">
                      <IconButton 
                        size="sm" 
                        variant="ghost" 
                        colorPalette="red" 
                        onClick={() => handleDeleteRow(row.id)}
                        aria-label="Delete offer"
                      >
                        <Trash2 size={16} />
                      </IconButton>
                    </Table.Cell>
                  </Table.Row>
                );
              })}
            </Table.Body>
          </Table.Root>
        </Box>
      )}
    </Box>
  );
}
