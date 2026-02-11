// Hardcoded 50-property starter dataset for instant dashboard display
// This data loads synchronously (<100ms) before any API calls
// Provides immediate user engagement while background fetch completes

const STARTER_DATA = [
  {
    id: "starter_1",
    name: "123 Main Street, Windsor, ON",
    address: { lat: "42.3149", lng: "-83.0364", city: "Windsor", address: "123 Main Street, Windsor, ON" },
    listingStatus: "Active",
    propertyType: "Single Family",
    buildingType: "House",
    bedrooms: "3",
    bathrooms: "2",
    price: 325000,
    column1stPrice: 325000,
    column1stListingDate: new Date("2024-01-15"),
    daysOnMarket: 45,
    wards: "Ward 3",
    priceHistory: [{ price: 325000, date: new Date("2024-01-15") }],
    dropAsAPercentageOfTheInitialPrice: 0,
    dropFrequencyCount: 0,
    totalDropAmount: 0,
    latNum: 42.3149,
    lngNum: -83.0364,
    isRemoved: false
  },
  {
    id: "starter_2",
    name: "456 Oak Avenue, Windsor, ON",
    address: { lat: "42.2989", lng: "-83.0193", city: "Windsor", address: "456 Oak Avenue, Windsor, ON" },
    listingStatus: "Active",
    propertyType: "Single Family",
    buildingType: "House",
    bedrooms: "4",
    bathrooms: "3",
    price: 425000,
    column1stPrice: 450000,
    column1stListingDate: new Date("2024-01-10"),
    column2ndPrice: 425000,
    column2ndPriceChangeDate: new Date("2024-02-01"),
    daysOnMarket: 50,
    wards: "Ward 5",
    priceHistory: [
      { price: 450000, date: new Date("2024-01-10") },
      { price: 425000, date: new Date("2024-02-01") }
    ],
    dropAsAPercentageOfTheInitialPrice: -5.56,
    dropFrequencyCount: 1,
    totalDropAmount: -25000,
    latNum: 42.2989,
    lngNum: -83.0193,
    isRemoved: false
  },
  {
    id: "starter_3",
    name: "789 Elm Street, Windsor, ON",
    address: { lat: "42.3086", lng: "-82.9948", city: "Windsor", address: "789 Elm Street, Windsor, ON" },
    listingStatus: "Active",
    propertyType: "Apartment",
    buildingType: "Condo",
    bedrooms: "2",
    bathrooms: "2",
    price: 225000,
    column1stPrice: 225000,
    column1stListingDate: new Date("2024-02-01"),
    daysOnMarket: 30,
    wards: "Ward 1",
    priceHistory: [{ price: 225000, date: new Date("2024-02-01") }],
    dropAsAPercentageOfTheInitialPrice: 0,
    dropFrequencyCount: 0,
    totalDropAmount: 0,
    latNum: 42.3086,
    lngNum: -82.9948,
    isRemoved: false
  },
  {
    id: "starter_4",
    name: "321 Maple Drive, Windsor, ON",
    address: { lat: "42.2850", lng: "-83.0450", city: "Windsor", address: "321 Maple Drive, Windsor, ON" },
    listingStatus: "Active",
    propertyType: "Single Family",
    buildingType: "House",
    bedrooms: "3",
    bathrooms: "2",
    price: 299000,
    column1stPrice: 315000,
    column1stListingDate: new Date("2024-01-20"),
    column2ndPrice: 299000,
    column2ndPriceChangeDate: new Date("2024-02-10"),
    daysOnMarket: 42,
    wards: "Ward 7",
    priceHistory: [
      { price: 315000, date: new Date("2024-01-20") },
      { price: 299000, date: new Date("2024-02-10") }
    ],
    dropAsAPercentageOfTheInitialPrice: -5.08,
    dropFrequencyCount: 1,
    totalDropAmount: -16000,
    latNum: 42.2850,
    lngNum: -83.0450,
    isRemoved: false
  },
  {
    id: "starter_5",
    name: "654 Pine Street, Windsor, ON",
    address: { lat: "42.3200", lng: "-83.0100", city: "Windsor", address: "654 Pine Street, Windsor, ON" },
    listingStatus: "Active",
    propertyType: "Multi-family",
    buildingType: "Duplex",
    bedrooms: "4",
    bathrooms: "3",
    price: 389000,
    column1stPrice: 389000,
    column1stListingDate: new Date("2024-01-25"),
    daysOnMarket: 37,
    wards: "Ward 2",
    priceHistory: [{ price: 389000, date: new Date("2024-01-25") }],
    dropAsAPercentageOfTheInitialPrice: 0,
    dropFrequencyCount: 0,
    totalDropAmount: 0,
    latNum: 42.3200,
    lngNum: -83.0100,
    isRemoved: false
  }
];

// Add 45 more properties to reach 50 total
for (let i = 6; i <= 50; i++) {
  const basePrice = 200000 + Math.floor(Math.random() * 300000);
  const hasPriceDrop = Math.random() > 0.6;
  const dropAmount = hasPriceDrop ? Math.floor(Math.random() * 30000) + 5000 : 0;
  const currentPrice = basePrice - dropAmount;
  
  const wards = ["Ward 1", "Ward 2", "Ward 3", "Ward 4", "Ward 5", "Ward 6", "Ward 7", "Ward 8", "Ward 9", "Ward 10"];
  const propertyTypes = ["Single Family", "Apartment", "Multi-family", "House"];
  const buildingTypes = ["House", "Condo", "Duplex", "Townhouse"];
  
  const priceHistory = hasPriceDrop 
    ? [
        { price: basePrice, date: new Date("2024-01-15") },
        { price: currentPrice, date: new Date("2024-02-01") }
      ]
    : [{ price: basePrice, date: new Date("2024-01-15") }];
  
  STARTER_DATA.push({
    id: `starter_${i}`,
    name: `${100 + i * 10} Sample Street Unit ${i}, Windsor, ON`,
    address: { 
      lat: (42.25 + Math.random() * 0.1).toFixed(4),
      lng: (-83.05 + Math.random() * 0.08).toFixed(4),
      city: "Windsor",
      address: `${100 + i * 10} Sample Street Unit ${i}, Windsor, ON`
    },
    listingStatus: "Active",
    propertyType: propertyTypes[Math.floor(Math.random() * propertyTypes.length)],
    buildingType: buildingTypes[Math.floor(Math.random() * buildingTypes.length)],
    bedrooms: String(Math.floor(Math.random() * 4) + 2),
    bathrooms: String(Math.floor(Math.random() * 3) + 1),
    price: currentPrice,
    column1stPrice: basePrice,
    column1stListingDate: new Date("2024-01-15"),
    column2ndPrice: hasPriceDrop ? currentPrice : undefined,
    column2ndPriceChangeDate: hasPriceDrop ? new Date("2024-02-01") : undefined,
    daysOnMarket: Math.floor(Math.random() * 60) + 20,
    wards: wards[Math.floor(Math.random() * wards.length)],
    priceHistory: priceHistory,
    dropAsAPercentageOfTheInitialPrice: hasPriceDrop ? ((currentPrice - basePrice) / basePrice * 100) : 0,
    dropFrequencyCount: hasPriceDrop ? 1 : 0,
    totalDropAmount: hasPriceDrop ? (currentPrice - basePrice) : 0,
    latNum: parseFloat((42.25 + Math.random() * 0.1).toFixed(4)),
    lngNum: parseFloat((-83.05 + Math.random() * 0.08).toFixed(4)),
    isRemoved: false
  });
}

export default STARTER_DATA;
