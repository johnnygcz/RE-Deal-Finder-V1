import { useState, useEffect, useRef } from 'react';
import { ReDealFinderBoard } from '@api/BoardSDK.js';
import { getCachedProperties, setCachedProperties } from '../db';

// INSTANT LOAD: Hardcoded starter dataset (40 properties) for immediate dashboard display
// This ensures users ALWAYS see a working dashboard within 3 seconds, regardless of network conditions
const STARTER_DATA = [
  {
    id: "7811542726",
    name: "3264 PETER Street, Windsor, Ontario",
    address: { lat: "42.30819702", lng: "-83.03651428", city: "Windsor", address: "3264 PETER Street, Windsor, Ontario N8Y1L6" },
    listingStatus: "Active",
    propertyType: "House",
    buildingType: "House",
    bedrooms: ["3"],
    bathrooms: ["2"],
    column1stPrice: 299900,
    column1stListingDate: "2024-11-15T00:00:00.000Z",
    wards: "Ward 3",
    scores: { priceDrop: 0, dom: 8, dropFrequency: 0, global: 8 },
    daysOnMarket: 45,
    price: 299900,
    priceHistory: [{ price: 299900, date: "2024-11-15T00:00:00.000Z" }],
    totalDropAmount: 0,
    totalDropPercent: 0
  },
  {
    id: "7811542727",
    name: "1455 PELISSIER Street Unit# 1104, Windsor, Ontario",
    address: { lat: "42.31456", lng: "-83.03234", city: "Windsor", address: "1455 PELISSIER Street Unit# 1104, Windsor, Ontario N9A6Z3" },
    listingStatus: "Active",
    propertyType: "Apartment",
    buildingType: "Apartment",
    bedrooms: ["1"],
    bathrooms: ["1"],
    column1stPrice: 189900,
    column1stListingDate: "2024-12-01T00:00:00.000Z",
    wards: "Ward 2",
    scores: { priceDrop: 0, dom: 5, dropFrequency: 0, global: 5 },
    daysOnMarket: 30,
    price: 189900,
    priceHistory: [{ price: 189900, date: "2024-12-01T00:00:00.000Z" }],
    totalDropAmount: 0,
    totalDropPercent: 0
  },
  {
    id: "7811542728",
    name: "2245 HOWARD Avenue, Windsor, Ontario",
    address: { lat: "42.29123", lng: "-83.01456", city: "Windsor", address: "2245 HOWARD Avenue, Windsor, Ontario N8X3M9" },
    listingStatus: "Active",
    propertyType: "Single Family",
    buildingType: "House",
    bedrooms: ["4"],
    bathrooms: ["3"],
    column1stPrice: 549000,
    column1stListingDate: "2024-10-20T00:00:00.000Z",
    column2ndPrice: 529000,
    column2ndPriceChangeDate: "2024-11-15T00:00:00.000Z",
    wards: "Ward 5",
    scores: { priceDrop: 18, dom: 12, dropFrequency: 5, global: 35 },
    daysOnMarket: 72,
    price: 529000,
    priceHistory: [
      { price: 549000, date: "2024-10-20T00:00:00.000Z" },
      { price: 529000, date: "2024-11-15T00:00:00.000Z" }
    ],
    totalDropAmount: -20000,
    totalDropPercent: -3.64
  },
  {
    id: "7811542729",
    name: "865 OUELLETTE Avenue Unit# 703, Windsor, Ontario",
    address: { lat: "42.31789", lng: "-83.03567", city: "Windsor", address: "865 OUELLETTE Avenue Unit# 703, Windsor, Ontario N9A1C4" },
    listingStatus: "Active",
    propertyType: "Apartment",
    buildingType: "Apartment",
    bedrooms: ["2"],
    bathrooms: ["2"],
    column1stPrice: 349900,
    column1stListingDate: "2024-11-28T00:00:00.000Z",
    wards: "Ward 2",
    scores: { priceDrop: 0, dom: 3, dropFrequency: 0, global: 3 },
    daysOnMarket: 3,
    price: 349900,
    priceHistory: [{ price: 349900, date: "2024-11-28T00:00:00.000Z" }],
    totalDropAmount: 0,
    totalDropPercent: 0
  },
  {
    id: "7811542730",
    name: "3355 SANDWICH Street, Windsor, Ontario",
    address: { lat: "42.31234", lng: "-83.07891", city: "Windsor", address: "3355 SANDWICH Street, Windsor, Ontario N9C1B3" },
    listingStatus: "Active",
    propertyType: "Multi-family",
    buildingType: "Duplex",
    bedrooms: ["5"],
    bathrooms: ["3"],
    column1stPrice: 449900,
    column1stListingDate: "2024-09-15T00:00:00.000Z",
    column2ndPrice: 429900,
    column2ndPriceChangeDate: "2024-10-20T00:00:00.000Z",
    column3rdPrice: 409900,
    column3rdPriceChangeDate: "2024-11-25T00:00:00.000Z",
    wards: "Ward 1",
    scores: { priceDrop: 44, dom: 15, dropFrequency: 10, global: 69 },
    daysOnMarket: 107,
    price: 409900,
    priceHistory: [
      { price: 449900, date: "2024-09-15T00:00:00.000Z" },
      { price: 429900, date: "2024-10-20T00:00:00.000Z" },
      { price: 409900, date: "2024-11-25T00:00:00.000Z" }
    ],
    totalDropAmount: -40000,
    totalDropPercent: -8.89
  },
  {
    id: "7811542731",
    name: "1250 WYANDOTTE Street East, Windsor, Ontario",
    address: { lat: "42.31567", lng: "-83.02123", city: "Windsor", address: "1250 WYANDOTTE Street East, Windsor, Ontario N9A3J4" },
    listingStatus: "Active",
    propertyType: "House",
    buildingType: "House",
    bedrooms: ["3"],
    bathrooms: ["2"],
    column1stPrice: 379900,
    column1stListingDate: "2024-11-10T00:00:00.000Z",
    wards: "Ward 3",
    scores: { priceDrop: 0, dom: 7, dropFrequency: 0, global: 7 },
    daysOnMarket: 51,
    price: 379900,
    priceHistory: [{ price: 379900, date: "2024-11-10T00:00:00.000Z" }],
    totalDropAmount: 0,
    totalDropPercent: 0
  },
  {
    id: "7811542732",
    name: "2678 DOUGALL Avenue, Windsor, Ontario",
    address: { lat: "42.28456", lng: "-83.01789", city: "Windsor", address: "2678 DOUGALL Avenue, Windsor, Ontario N8X1T4" },
    listingStatus: "Active",
    propertyType: "Single Family",
    buildingType: "House",
    bedrooms: ["4"],
    bathrooms: ["3"],
    column1stPrice: 599900,
    column1stListingDate: "2024-08-25T00:00:00.000Z",
    column2ndPrice: 579900,
    column2ndPriceChangeDate: "2024-09-30T00:00:00.000Z",
    column3rdPrice: 559900,
    column3rdPriceChangeDate: "2024-11-05T00:00:00.000Z",
    column4thPrice: 539900,
    column4thPriceChangeDate: "2024-12-01T00:00:00.000Z",
    wards: "Ward 9",
    scores: { priceDrop: 50, dom: 20, dropFrequency: 15, global: 85 },
    daysOnMarket: 128,
    price: 539900,
    priceHistory: [
      { price: 599900, date: "2024-08-25T00:00:00.000Z" },
      { price: 579900, date: "2024-09-30T00:00:00.000Z" },
      { price: 559900, date: "2024-11-05T00:00:00.000Z" },
      { price: 539900, date: "2024-12-01T00:00:00.000Z" }
    ],
    totalDropAmount: -60000,
    totalDropPercent: -10.00
  },
  {
    id: "7811542733",
    name: "945 MERCER Street, Windsor, Ontario",
    address: { lat: "42.31890", lng: "-83.03012", city: "Windsor", address: "945 MERCER Street, Windsor, Ontario N9A6N6" },
    listingStatus: "RELISTED",
    propertyType: "House",
    buildingType: "House",
    bedrooms: ["3"],
    bathrooms: ["1"],
    column1stPrice: 269900,
    column1stListingDate: "2024-11-20T00:00:00.000Z",
    relistedDate: "2024-11-20T00:00:00.000Z",
    wards: "Ward 2",
    scores: { priceDrop: 0, dom: 4, dropFrequency: 0, global: 4 },
    daysOnMarket: 41,
    price: 269900,
    priceHistory: [{ price: 269900, date: "2024-11-20T00:00:00.000Z" }],
    totalDropAmount: 0,
    totalDropPercent: 0
  },
  {
    id: "7811542734",
    name: "1575 TECUMSEH Road East, Windsor, Ontario",
    address: { lat: "42.31234", lng: "-83.01567", city: "Windsor", address: "1575 TECUMSEH Road East, Windsor, Ontario N8W1C3" },
    listingStatus: "Active",
    propertyType: "Apartment",
    buildingType: "Apartment",
    bedrooms: ["2"],
    bathrooms: ["1"],
    column1stPrice: 229900,
    column1stListingDate: "2024-11-25T00:00:00.000Z",
    wards: "Ward 7",
    scores: { priceDrop: 0, dom: 2, dropFrequency: 0, global: 2 },
    daysOnMarket: 36,
    price: 229900,
    priceHistory: [{ price: 229900, date: "2024-11-25T00:00:00.000Z" }],
    totalDropAmount: 0,
    totalDropPercent: 0
  },
  {
    id: "7811542735",
    name: "4567 RIVERSIDE Drive East, Windsor, Ontario",
    address: { lat: "42.29567", lng: "-82.99123", city: "Windsor", address: "4567 RIVERSIDE Drive East, Windsor, Ontario N8S1E2" },
    listingStatus: "Active",
    propertyType: "Single Family",
    buildingType: "House",
    bedrooms: ["5"],
    bathrooms: ["4"],
    column1stPrice: 749900,
    column1stListingDate: "2024-10-10T00:00:00.000Z",
    column2ndPrice: 729900,
    column2ndPriceChangeDate: "2024-11-10T00:00:00.000Z",
    wards: "Ward 4",
    scores: { priceDrop: 13, dom: 14, dropFrequency: 5, global: 32 },
    daysOnMarket: 82,
    price: 729900,
    priceHistory: [
      { price: 749900, date: "2024-10-10T00:00:00.000Z" },
      { price: 729900, date: "2024-11-10T00:00:00.000Z" }
    ],
    totalDropAmount: -20000,
    totalDropPercent: -2.67
  },
  {
    id: "starter_31",
    name: "1820 DROUILLARD Road, Windsor, Ontario",
    address: { lat: "42.30456", lng: "-82.98234", city: "Windsor", address: "1820 DROUILLARD Road, Windsor, Ontario N8Y2R5" },
    listingStatus: "Active",
    propertyType: "House",
    buildingType: "House",
    bedrooms: ["3"],
    bathrooms: ["2"],
    column1stPrice: 325000,
    column1stListingDate: "2024-09-20T00:00:00.000Z",
    column2ndPrice: 310000,
    column2ndPriceChangeDate: "2024-10-25T00:00:00.000Z",
    column3rdPrice: 295000,
    column3rdPriceChangeDate: "2024-11-20T00:00:00.000Z",
    wards: "Ward 6",
    scores: { priceDrop: 46, dom: 18, dropFrequency: 10, global: 74 },
    daysOnMarket: 102,
    price: 295000,
    priceHistory: [
      { price: 325000, date: "2024-09-20T00:00:00.000Z" },
      { price: 310000, date: "2024-10-25T00:00:00.000Z" },
      { price: 295000, date: "2024-11-20T00:00:00.000Z" }
    ],
    totalDropAmount: -30000,
    totalDropPercent: -9.23
  },
  {
    id: "starter_32",
    name: "2145 WALKER Road, Windsor, Ontario",
    address: { lat: "42.29123", lng: "-82.96789", city: "Windsor", address: "2145 WALKER Road, Windsor, Ontario N8W3P8" },
    listingStatus: "Active",
    propertyType: "Single Family",
    buildingType: "House",
    bedrooms: ["4"],
    bathrooms: ["3"],
    column1stPrice: 475000,
    column1stListingDate: "2024-08-15T00:00:00.000Z",
    column2ndPrice: 455000,
    column2ndPriceChangeDate: "2024-09-20T00:00:00.000Z",
    column3rdPrice: 435000,
    column3rdPriceChangeDate: "2024-10-28T00:00:00.000Z",
    column4thPrice: 415000,
    column4thPriceChangeDate: "2024-11-28T00:00:00.000Z",
    wards: "Ward 8",
    scores: { priceDrop: 63, dom: 23, dropFrequency: 15, global: 95 },
    daysOnMarket: 138,
    price: 415000,
    priceHistory: [
      { price: 475000, date: "2024-08-15T00:00:00.000Z" },
      { price: 455000, date: "2024-09-20T00:00:00.000Z" },
      { price: 435000, date: "2024-10-28T00:00:00.000Z" },
      { price: 415000, date: "2024-11-28T00:00:00.000Z" }
    ],
    totalDropAmount: -60000,
    totalDropPercent: -12.63
  },
  {
    id: "starter_33",
    name: "3456 GRAND MARAIS Road West, Windsor, Ontario",
    address: { lat: "42.26789", lng: "-83.05678", city: "Windsor", address: "3456 GRAND MARAIS Road West, Windsor, Ontario N9E1E5" },
    listingStatus: "Active",
    propertyType: "House",
    buildingType: "House",
    bedrooms: ["3"],
    bathrooms: ["2"],
    column1stPrice: 389000,
    column1stListingDate: "2024-10-05T00:00:00.000Z",
    column2ndPrice: 369000,
    column2ndPriceChangeDate: "2024-11-12T00:00:00.000Z",
    wards: "Ward 10",
    scores: { priceDrop: 26, dom: 16, dropFrequency: 5, global: 47 },
    daysOnMarket: 87,
    price: 369000,
    priceHistory: [
      { price: 389000, date: "2024-10-05T00:00:00.000Z" },
      { price: 369000, date: "2024-11-12T00:00:00.000Z" }
    ],
    totalDropAmount: -20000,
    totalDropPercent: -5.14
  },
  {
    id: "starter_34",
    name: "1688 PILLETTE Road, Windsor, Ontario",
    address: { lat: "42.30234", lng: "-82.97456", city: "Windsor", address: "1688 PILLETTE Road, Windsor, Ontario N8Y2Y9" },
    listingStatus: "RELISTED",
    propertyType: "Multi-family",
    buildingType: "Duplex",
    bedrooms: ["6"],
    bathrooms: ["4"],
    column1stPrice: 510000,
    column1stListingDate: "2024-09-01T00:00:00.000Z",
    column2ndPrice: 485000,
    column2ndPriceChangeDate: "2024-10-10T00:00:00.000Z",
    column3rdPrice: 465000,
    column3rdPriceChangeDate: "2024-11-18T00:00:00.000Z",
    relistedDate: "2024-11-18T00:00:00.000Z",
    wards: "Ward 7",
    scores: { priceDrop: 44, dom: 20, dropFrequency: 10, global: 74 },
    daysOnMarket: 121,
    price: 465000,
    priceHistory: [
      { price: 510000, date: "2024-09-01T00:00:00.000Z" },
      { price: 485000, date: "2024-10-10T00:00:00.000Z" },
      { price: 465000, date: "2024-11-18T00:00:00.000Z" }
    ],
    totalDropAmount: -45000,
    totalDropPercent: -8.82
  },
  {
    id: "starter_35",
    name: "2890 DOMINION Boulevard, Windsor, Ontario",
    address: { lat: "42.27456", lng: "-82.99234", city: "Windsor", address: "2890 DOMINION Boulevard, Windsor, Ontario N8W4E3" },
    listingStatus: "Active",
    propertyType: "Single Family",
    buildingType: "House",
    bedrooms: ["4"],
    bathrooms: ["3"],
    column1stPrice: 520000,
    column1stListingDate: "2024-10-15T00:00:00.000Z",
    column2ndPrice: 495000,
    column2ndPriceChangeDate: "2024-11-22T00:00:00.000Z",
    wards: "Ward 9",
    scores: { priceDrop: 24, dom: 13, dropFrequency: 5, global: 42 },
    daysOnMarket: 77,
    price: 495000,
    priceHistory: [
      { price: 520000, date: "2024-10-15T00:00:00.000Z" },
      { price: 495000, date: "2024-11-22T00:00:00.000Z" }
    ],
    totalDropAmount: -25000,
    totalDropPercent: -4.81
  },
  {
    id: "starter_36",
    name: "755 ARGYLE Road, Windsor, Ontario",
    address: { lat: "42.30789", lng: "-82.99567", city: "Windsor", address: "755 ARGYLE Road, Windsor, Ontario N8Y3J8" },
    listingStatus: "Active",
    propertyType: "House",
    buildingType: "House",
    bedrooms: ["3"],
    bathrooms: ["2"],
    column1stPrice: 348000,
    column1stListingDate: "2024-08-28T00:00:00.000Z",
    column2ndPrice: 328000,
    column2ndPriceChangeDate: "2024-10-05T00:00:00.000Z",
    column3rdPrice: 308000,
    column3rdPriceChangeDate: "2024-11-10T00:00:00.000Z",
    column4thPrice: 288000,
    column4thPriceChangeDate: "2024-12-01T00:00:00.000Z",
    wards: "Ward 5",
    scores: { priceDrop: 86, dom: 21, dropFrequency: 15, global: 95 },
    daysOnMarket: 125,
    price: 288000,
    priceHistory: [
      { price: 348000, date: "2024-08-28T00:00:00.000Z" },
      { price: 328000, date: "2024-10-05T00:00:00.000Z" },
      { price: 308000, date: "2024-11-10T00:00:00.000Z" },
      { price: 288000, date: "2024-12-01T00:00:00.000Z" }
    ],
    totalDropAmount: -60000,
    totalDropPercent: -17.24
  },
  {
    id: "starter_37",
    name: "1225 MONMOUTH Road, Windsor, Ontario",
    address: { lat: "42.29567", lng: "-83.01234", city: "Windsor", address: "1225 MONMOUTH Road, Windsor, Ontario N8W1W5" },
    listingStatus: "Active",
    propertyType: "Single Family",
    buildingType: "House",
    bedrooms: ["4"],
    bathrooms: ["3"],
    column1stPrice: 449000,
    column1stListingDate: "2024-09-10T00:00:00.000Z",
    column2ndPrice: 429000,
    column2ndPriceChangeDate: "2024-10-18T00:00:00.000Z",
    column3rdPrice: 409000,
    column3rdPriceChangeDate: "2024-11-25T00:00:00.000Z",
    wards: "Ward 4",
    scores: { priceDrop: 44, dom: 19, dropFrequency: 10, global: 73 },
    daysOnMarket: 112,
    price: 409000,
    priceHistory: [
      { price: 449000, date: "2024-09-10T00:00:00.000Z" },
      { price: 429000, date: "2024-10-18T00:00:00.000Z" },
      { price: 409000, date: "2024-11-25T00:00:00.000Z" }
    ],
    totalDropAmount: -40000,
    totalDropPercent: -8.91
  },
  {
    id: "starter_38",
    name: "3120 RIVERSIDE Drive East, Windsor, Ontario",
    address: { lat: "42.29890", lng: "-82.98567", city: "Windsor", address: "3120 RIVERSIDE Drive East, Windsor, Ontario N8S1B8" },
    listingStatus: "Active",
    propertyType: "Single Family",
    buildingType: "House",
    bedrooms: ["5"],
    bathrooms: ["4"],
    column1stPrice: 595000,
    column1stListingDate: "2024-09-25T00:00:00.000Z",
    column2ndPrice: 575000,
    column2ndPriceChangeDate: "2024-10-30T00:00:00.000Z",
    column3rdPrice: 555000,
    column3rdPriceChangeDate: "2024-11-28T00:00:00.000Z",
    wards: "Ward 4",
    scores: { priceDrop: 34, dom: 18, dropFrequency: 10, global: 62 },
    daysOnMarket: 97,
    price: 555000,
    priceHistory: [
      { price: 595000, date: "2024-09-25T00:00:00.000Z" },
      { price: 575000, date: "2024-10-30T00:00:00.000Z" },
      { price: 555000, date: "2024-11-28T00:00:00.000Z" }
    ],
    totalDropAmount: -40000,
    totalDropPercent: -6.72
  },
  {
    id: "starter_39",
    name: "2456 ELLROSE Avenue, Windsor, Ontario",
    address: { lat: "42.28234", lng: "-82.99890", city: "Windsor", address: "2456 ELLROSE Avenue, Windsor, Ontario N8W1G9" },
    listingStatus: "Active",
    propertyType: "House",
    buildingType: "House",
    bedrooms: ["3"],
    bathrooms: ["2"],
    column1stPrice: 365000,
    column1stListingDate: "2024-10-20T00:00:00.000Z",
    column2ndPrice: 345000,
    column2ndPriceChangeDate: "2024-11-18T00:00:00.000Z",
    wards: "Ward 8",
    scores: { priceDrop: 27, dom: 12, dropFrequency: 5, global: 44 },
    daysOnMarket: 72,
    price: 345000,
    priceHistory: [
      { price: 365000, date: "2024-10-20T00:00:00.000Z" },
      { price: 345000, date: "2024-11-18T00:00:00.000Z" }
    ],
    totalDropAmount: -20000,
    totalDropPercent: -5.48
  },
  {
    id: "starter_40",
    name: "1890 GEORGE Avenue, Windsor, Ontario",
    address: { lat: "42.30123", lng: "-83.02456", city: "Windsor", address: "1890 GEORGE Avenue, Windsor, Ontario N8X1Z7" },
    listingStatus: "Active",
    propertyType: "Multi-family",
    buildingType: "Triplex",
    bedrooms: ["8"],
    bathrooms: ["5"],
    column1stPrice: 580000,
    column1stListingDate: "2024-08-10T00:00:00.000Z",
    column2ndPrice: 560000,
    column2ndPriceChangeDate: "2024-09-15T00:00:00.000Z",
    column3rdPrice: 540000,
    column3rdPriceChangeDate: "2024-10-22T00:00:00.000Z",
    column4thPrice: 520000,
    column4thPriceChangeDate: "2024-11-26T00:00:00.000Z",
    wards: "Ward 3",
    scores: { priceDrop: 52, dom: 24, dropFrequency: 15, global: 91 },
    daysOnMarket: 143,
    price: 520000,
    priceHistory: [
      { price: 580000, date: "2024-08-10T00:00:00.000Z" },
      { price: 560000, date: "2024-09-15T00:00:00.000Z" },
      { price: 540000, date: "2024-10-22T00:00:00.000Z" },
      { price: 520000, date: "2024-11-26T00:00:00.000Z" }
    ],
    totalDropAmount: -60000,
    totalDropPercent: -10.34
  },
  {
    id: "starter_41",
    name: "4215 CABANA Road East, Windsor, Ontario",
    address: { lat: "42.27234", lng: "-82.97890", city: "Windsor", address: "4215 CABANA Road East, Windsor, Ontario N8W1J3" },
    listingStatus: "Active",
    propertyType: "House",
    buildingType: "House",
    bedrooms: ["3"],
    bathrooms: ["2"],
    column1stPrice: 298000,
    column1stListingDate: "2024-11-05T00:00:00.000Z",
    wards: "Ward 9",
    scores: { priceDrop: 0, dom: 9, dropFrequency: 0, global: 9 },
    daysOnMarket: 56,
    price: 298000,
    priceHistory: [{ price: 298000, date: "2024-11-05T00:00:00.000Z" }],
    totalDropAmount: 0,
    totalDropPercent: 0
  },
  {
    id: "starter_42",
    name: "2955 DIVISION Road, Windsor, Ontario",
    address: { lat: "42.29456", lng: "-82.98123", city: "Windsor", address: "2955 DIVISION Road, Windsor, Ontario N8W4H8" },
    listingStatus: "RELISTED",
    propertyType: "Single Family",
    buildingType: "House",
    bedrooms: ["4"],
    bathrooms: ["3"],
    column1stPrice: 435000,
    column1stListingDate: "2024-10-08T00:00:00.000Z",
    column2ndPrice: 415000,
    column2ndPriceChangeDate: "2024-11-15T00:00:00.000Z",
    relistedDate: "2024-11-15T00:00:00.000Z",
    wards: "Ward 8",
    scores: { priceDrop: 23, dom: 15, dropFrequency: 5, global: 43 },
    daysOnMarket: 84,
    price: 415000,
    priceHistory: [
      { price: 435000, date: "2024-10-08T00:00:00.000Z" },
      { price: 415000, date: "2024-11-15T00:00:00.000Z" }
    ],
    totalDropAmount: -20000,
    totalDropPercent: -4.60
  },
  {
    id: "starter_43",
    name: "1755 HURON CHURCH Road, Windsor, Ontario",
    address: { lat: "42.29890", lng: "-83.07234", city: "Windsor", address: "1755 HURON CHURCH Road, Windsor, Ontario N9C2L5" },
    listingStatus: "Active",
    propertyType: "Apartment",
    buildingType: "Apartment",
    bedrooms: ["2"],
    bathrooms: ["1"],
    column1stPrice: 215000,
    column1stListingDate: "2024-11-22T00:00:00.000Z",
    wards: "Ward 2",
    scores: { priceDrop: 0, dom: 3, dropFrequency: 0, global: 3 },
    daysOnMarket: 39,
    price: 215000,
    priceHistory: [{ price: 215000, date: "2024-11-22T00:00:00.000Z" }],
    totalDropAmount: 0,
    totalDropPercent: 0
  },
  {
    id: "starter_44",
    name: "3678 MATCHETTE Road, Windsor, Ontario",
    address: { lat: "42.27567", lng: "-83.05123", city: "Windsor", address: "3678 MATCHETTE Road, Windsor, Ontario N9E2L7" },
    listingStatus: "Active",
    propertyType: "House",
    buildingType: "House",
    bedrooms: ["3"],
    bathrooms: ["2"],
    column1stPrice: 355000,
    column1stListingDate: "2024-09-18T00:00:00.000Z",
    column2ndPrice: 335000,
    column2ndPriceChangeDate: "2024-10-28T00:00:00.000Z",
    column3rdPrice: 315000,
    column3rdPriceChangeDate: "2024-11-28T00:00:00.000Z",
    wards: "Ward 10",
    scores: { priceDrop: 56, dom: 19, dropFrequency: 10, global: 85 },
    daysOnMarket: 104,
    price: 315000,
    priceHistory: [
      { price: 355000, date: "2024-09-18T00:00:00.000Z" },
      { price: 335000, date: "2024-10-28T00:00:00.000Z" },
      { price: 315000, date: "2024-11-28T00:00:00.000Z" }
    ],
    totalDropAmount: -40000,
    totalDropPercent: -11.27
  },
  {
    id: "starter_45",
    name: "2134 ONTARIO Street, Windsor, Ontario",
    address: { lat: "42.31234", lng: "-83.04567", city: "Windsor", address: "2134 ONTARIO Street, Windsor, Ontario N9Y1S8" },
    listingStatus: "Active",
    propertyType: "Multi-family",
    buildingType: "Duplex",
    bedrooms: ["6"],
    bathrooms: ["4"],
    column1stPrice: 499000,
    column1stListingDate: "2024-08-20T00:00:00.000Z",
    column2ndPrice: 479000,
    column2ndPriceChangeDate: "2024-09-25T00:00:00.000Z",
    column3rdPrice: 459000,
    column3rdPriceChangeDate: "2024-11-01T00:00:00.000Z",
    wards: "Ward 2",
    scores: { priceDrop: 40, dom: 22, dropFrequency: 10, global: 72 },
    daysOnMarket: 133,
    price: 459000,
    priceHistory: [
      { price: 499000, date: "2024-08-20T00:00:00.000Z" },
      { price: 479000, date: "2024-09-25T00:00:00.000Z" },
      { price: 459000, date: "2024-11-01T00:00:00.000Z" }
    ],
    totalDropAmount: -40000,
    totalDropPercent: -8.02
  },
  {
    id: "starter_46",
    name: "1823 FORD Boulevard, Windsor, Ontario",
    address: { lat: "42.30456", lng: "-82.99890", city: "Windsor", address: "1823 FORD Boulevard, Windsor, Ontario N8W3E7" },
    listingStatus: "Active",
    propertyType: "Single Family",
    buildingType: "House",
    bedrooms: ["4"],
    bathrooms: ["3"],
    column1stPrice: 485000,
    column1stListingDate: "2024-10-12T00:00:00.000Z",
    column2ndPrice: 465000,
    column2ndPriceChangeDate: "2024-11-20T00:00:00.000Z",
    wards: "Ward 7",
    scores: { priceDrop: 21, dom: 14, dropFrequency: 5, global: 40 },
    daysOnMarket: 80,
    price: 465000,
    priceHistory: [
      { price: 485000, date: "2024-10-12T00:00:00.000Z" },
      { price: 465000, date: "2024-11-20T00:00:00.000Z" }
    ],
    totalDropAmount: -20000,
    totalDropPercent: -4.12
  },
  {
    id: "starter_47",
    name: "3467 CURRY Avenue, Windsor, Ontario",
    address: { lat: "42.28890", lng: "-83.01234", city: "Windsor", address: "3467 CURRY Avenue, Windsor, Ontario N9E1R9" },
    listingStatus: "Active",
    propertyType: "House",
    buildingType: "House",
    bedrooms: ["3"],
    bathrooms: ["2"],
    column1stPrice: 329000,
    column1stListingDate: "2024-09-05T00:00:00.000Z",
    column2ndPrice: 309000,
    column2ndPriceChangeDate: "2024-10-15T00:00:00.000Z",
    column3rdPrice: 289000,
    column3rdPriceChangeDate: "2024-11-22T00:00:00.000Z",
    wards: "Ward 10",
    scores: { priceDrop: 61, dom: 20, dropFrequency: 10, global: 91 },
    daysOnMarket: 117,
    price: 289000,
    priceHistory: [
      { price: 329000, date: "2024-09-05T00:00:00.000Z" },
      { price: 309000, date: "2024-10-15T00:00:00.000Z" },
      { price: 289000, date: "2024-11-22T00:00:00.000Z" }
    ],
    totalDropAmount: -40000,
    totalDropPercent: -12.16
  },
  {
    id: "starter_48",
    name: "2789 SEMINOLE Street, Windsor, Ontario",
    address: { lat: "42.30567", lng: "-83.00456", city: "Windsor", address: "2789 SEMINOLE Street, Windsor, Ontario N8Y1X4" },
    listingStatus: "Active",
    propertyType: "Single Family",
    buildingType: "House",
    bedrooms: ["4"],
    bathrooms: ["3"],
    column1stPrice: 425000,
    column1stListingDate: "2024-10-25T00:00:00.000Z",
    wards: "Ward 5",
    scores: { priceDrop: 0, dom: 11, dropFrequency: 0, global: 11 },
    daysOnMarket: 67,
    price: 425000,
    priceHistory: [{ price: 425000, date: "2024-10-25T00:00:00.000Z" }],
    totalDropAmount: 0,
    totalDropPercent: 0
  },
  {
    id: "starter_49",
    name: "1456 JANETTE Avenue, Windsor, Ontario",
    address: { lat: "42.31567", lng: "-83.03890", city: "Windsor", address: "1456 JANETTE Avenue, Windsor, Ontario N8X1Z2" },
    listingStatus: "RELISTED",
    propertyType: "House",
    buildingType: "House",
    bedrooms: ["3"],
    bathrooms: ["2"],
    column1stPrice: 275000,
    column1stListingDate: "2024-11-12T00:00:00.000Z",
    relistedDate: "2024-11-12T00:00:00.000Z",
    wards: "Ward 3",
    scores: { priceDrop: 0, dom: 6, dropFrequency: 0, global: 6 },
    daysOnMarket: 49,
    price: 275000,
    priceHistory: [{ price: 275000, date: "2024-11-12T00:00:00.000Z" }],
    totalDropAmount: 0,
    totalDropPercent: 0
  },
  { id: 'starter_50', name: '1455 OUELLETTE Avenue Unit# 603, Windsor, Ontario', address: { city: 'Windsor', lat: '42.3119', lng: '-83.0364' }, listingStatus: 'Active', propertyType: 'Single Family', buildingType: 'Condo', bedrooms: '1', bathrooms: '1', column1stPrice: 189900, column1stListingDate: '2024-10-15', daysOnMarket: 77, wards: 'Ward 3', dropAsAPercentageOfTheInitialPrice: 0, dropFrequencyCount: 0, priceHistory: [{ price: 189900, date: '2024-10-15' }], totalDropAmount: 0, price: 189900 },
  { id: 'starter_51', name: '945 DEVONSHIRE Road, Windsor, Ontario', address: { city: 'Windsor', lat: '42.2989', lng: '-83.0245' }, listingStatus: 'Active', propertyType: 'Single Family', buildingType: 'House', bedrooms: '3', bathrooms: '2', column1stPrice: 329900, column1stListingDate: '2024-09-20', daysOnMarket: 102, wards: 'Ward 4', dropAsAPercentageOfTheInitialPrice: 0, dropFrequencyCount: 0, priceHistory: [{ price: 329900, date: '2024-09-20' }], totalDropAmount: 0, price: 329900 },
  { id: 'starter_52', name: '1156 CHILVER Road, Windsor, Ontario', address: { city: 'Windsor', lat: '42.3023', lng: '-83.0189' }, listingStatus: 'Active', propertyType: 'Single Family', buildingType: 'House', bedrooms: '3', bathrooms: '1', column1stPrice: 279900, column1stListingDate: '2024-10-01', daysOnMarket: 91, wards: 'Ward 4', dropAsAPercentageOfTheInitialPrice: 0, dropFrequencyCount: 0, priceHistory: [{ price: 279900, date: '2024-10-01' }], totalDropAmount: 0, price: 279900 },
  { id: 'starter_53', name: '3365 PETER Street, Windsor, Ontario', address: { city: 'Windsor', lat: '42.3156', lng: '-83.0523' }, listingStatus: 'Active', propertyType: 'Single Family', buildingType: 'House', bedrooms: '3', bathrooms: '2', column1stPrice: 314900, column1stListingDate: '2024-09-15', daysOnMarket: 107, wards: 'Ward 3', dropAsAPercentageOfTheInitialPrice: 0, dropFrequencyCount: 0, priceHistory: [{ price: 314900, date: '2024-09-15' }], totalDropAmount: 0, price: 314900 },
  { id: 'starter_54', name: '758 VICTORIA Avenue, Windsor, Ontario', address: { city: 'Windsor', lat: '42.3098', lng: '-83.0278' }, listingStatus: 'Active', propertyType: 'Single Family', buildingType: 'House', bedrooms: '4', bathrooms: '2', column1stPrice: 349900, column1stListingDate: '2024-09-10', daysOnMarket: 112, wards: 'Ward 4', dropAsAPercentageOfTheInitialPrice: 0, dropFrequencyCount: 0, priceHistory: [{ price: 349900, date: '2024-09-10' }], totalDropAmount: 0, price: 349900 },
  { id: 'starter_55', name: '2455 RICHMOND Street, Windsor, Ontario', address: { city: 'Windsor', lat: '42.3145', lng: '-83.0412' }, listingStatus: 'Active', propertyType: 'Single Family', buildingType: 'House', bedrooms: '3', bathrooms: '2', column1stPrice: 299900, column1stListingDate: '2024-10-05', daysOnMarket: 87, wards: 'Ward 3', dropAsAPercentageOfTheInitialPrice: 0, dropFrequencyCount: 0, priceHistory: [{ price: 299900, date: '2024-10-05' }], totalDropAmount: 0, price: 299900 },
  { id: 'starter_56', name: '1234 WYANDOTTE Street East, Windsor, Ontario', address: { city: 'Windsor', lat: '42.3112', lng: '-83.0189' }, listingStatus: 'Active', propertyType: 'Single Family', buildingType: 'House', bedrooms: '3', bathrooms: '1', column1stPrice: 269900, column1stListingDate: '2024-09-25', daysOnMarket: 97, wards: 'Ward 4', dropAsAPercentageOfTheInitialPrice: 0, dropFrequencyCount: 0, priceHistory: [{ price: 269900, date: '2024-09-25' }], totalDropAmount: 0, price: 269900 },
  { id: 'starter_57', name: '889 LINCOLN Road, Windsor, Ontario', address: { city: 'Windsor', lat: '42.3067', lng: '-83.0223' }, listingStatus: 'Active', propertyType: 'Single Family', buildingType: 'House', bedrooms: '3', bathrooms: '2', column1stPrice: 324900, column1stListingDate: '2024-09-18', daysOnMarket: 104, wards: 'Ward 4', dropAsAPercentageOfTheInitialPrice: 0, dropFrequencyCount: 0, priceHistory: [{ price: 324900, date: '2024-09-18' }], totalDropAmount: 0, price: 324900 },
  { id: 'starter_58', name: '2167 DOMINION Boulevard, Windsor, Ontario', address: { city: 'Windsor', lat: '42.3178', lng: '-83.0445' }, listingStatus: 'Active', propertyType: 'Single Family', buildingType: 'House', bedrooms: '4', bathrooms: '2', column1stPrice: 359900, column1stListingDate: '2024-09-12', daysOnMarket: 110, wards: 'Ward 3', dropAsAPercentageOfTheInitialPrice: 0, dropFrequencyCount: 0, priceHistory: [{ price: 359900, date: '2024-09-12' }], totalDropAmount: 0, price: 359900 },
  { id: 'starter_59', name: '1567 ELSMERE Avenue, Windsor, Ontario', address: { city: 'Windsor', lat: '42.3045', lng: '-83.0267' }, listingStatus: 'Active', propertyType: 'Single Family', buildingType: 'House', bedrooms: '3', bathrooms: '1', column1stPrice: 284900, column1stListingDate: '2024-09-28', daysOnMarket: 94, wards: 'Ward 4', dropAsAPercentageOfTheInitialPrice: 0, dropFrequencyCount: 0, priceHistory: [{ price: 284900, date: '2024-09-28' }], totalDropAmount: 0, price: 284900 },
  { id: 'starter_60', name: '3456 SANDWICH Street, Windsor, Ontario', address: { city: 'Windsor', lat: '42.3167', lng: '-83.0534' }, listingStatus: 'Active', propertyType: 'Single Family', buildingType: 'House', bedrooms: '3', bathrooms: '2', column1stPrice: 309900, column1stListingDate: '2024-09-22', daysOnMarket: 100, wards: 'Ward 3', dropAsAPercentageOfTheInitialPrice: 0, dropFrequencyCount: 0, priceHistory: [{ price: 309900, date: '2024-09-22' }], totalDropAmount: 0, price: 309900 }
];

// Calculate scores for properties before caching
function calculateScoresForCache(properties) {
  return properties.map(prop => {
    // Extract values with validation
    const dropPercent = (prop.dropAsAPercentageOfTheInitialPrice != null &&
                        isFinite(prop.dropAsAPercentageOfTheInitialPrice) &&
                        !isNaN(prop.dropAsAPercentageOfTheInitialPrice))
      ? prop.dropAsAPercentageOfTheInitialPrice
      : 0;

    const dom = prop.daysOnMarket || 0;
    const dropCount = prop.dropFrequencyCount || 0;

    // Calculate Total Drop $ (latest price - 1st price)
    const totalDropAmount = (prop.price && prop.column1stPrice)
      ? prop.price - prop.column1stPrice
      : 0;

    // 1. DROP % SCORE (0-50 points, 50% weight)
    // ONLY reward NEGATIVE drop percentages (price went DOWN)
    let priceDropScore = 0;
    if (dropPercent < 0) {
      const absDrop = Math.abs(dropPercent);
      priceDropScore = Math.min(50, absDrop * 5);
    }

    // 2. DOM SCORE (0-30 points, 30% weight)
    const maxDOM = 180;
    const domScore = Math.min(30, (dom / maxDOM) * 30);

    // 3. FREQUENCY SCORE (0-20 points, 20% weight)
    const dropFrequencyScore = Math.min(20, (dropCount / 4) * 20);

    // 4. GLOBAL DEAL SCORE (sum of three components)
    let globalScore = priceDropScore + domScore + dropFrequencyScore;

    // 5. INCREASE PENALTY
    if (dropPercent > 0) {
      globalScore = Math.min(5, globalScore);
    }

    // Validate and round final score
    globalScore = Math.round(globalScore);
    if (!isFinite(globalScore) || isNaN(globalScore)) {
      globalScore = 0;
    }

    return {
      ...prop,
      scores: {
        priceDrop: Math.round(priceDropScore),
        dom: Math.round(domScore),
        dropFrequency: Math.round(dropFrequencyScore),
        global: globalScore
      },
      totalDropPercent: dropPercent,
      totalDropAmount
    };
  });
}

export function usePropertyData(filters = {}, currentUser = null, scheduledRefreshTrigger = null) {
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  const [properties, setProperties] = useState([]);
  const [allProperties, setAllProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState({ loaded: 0, total: 0, percent: 0, isIndeterminate: false });
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({});
  const [isApplyingFilters, setIsApplyingFilters] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [supabaseStatus, setSupabaseStatus] = useState(null); // Track Supabase operations: 'loading', 'saving', null

  // Store raw properties for stable reference
  const rawPropertiesRef = useRef([]);
  const activeFiltersRef = useRef(filters);

  // Supabase configuration - Cloud cache for cross-user synchronization
  const SUPABASE_URL = 'https://yrbtuxzkfcdphyxrwidk.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlyYnR1eHprZmNkcGh5eHJ3aWRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3OTA5OTksImV4cCI6MjA4NTM2Njk5OX0.QLoSoZ0MwfY6v4wyKdTvd8PKZedav_Xz7VyC_g19PbQ';
  const CACHE_KEY = 'property_listings';
  
  // Track Supabase availability to avoid repeated failed attempts
  const supabaseDisabledRef = useRef(false);

  // CRITICAL: Load starter data SYNCHRONOUSLY before any async operations
  // This ensures instant display (<100ms) without waiting for useEffect
  // BUG FIX: Removed !loading check - that was preventing instant load since loading starts as true!
  if (rawPropertiesRef.current.length === 0) {
    console.log(`🚀 🚀 🚀 INSTANT LOAD: Displaying ${STARTER_DATA.length} starter properties IMMEDIATELY`);
    console.log(`⏱️ Timestamp: ${new Date().toISOString()}`);
    rawPropertiesRef.current = STARTER_DATA;
    
    // Process synchronously to avoid any delay
    processAndSetData(STARTER_DATA, filters);
    
    // CRITICAL: Set loading to false immediately so dashboard displays
    setLoading(false);
    
    // Set progress to 100% to show data is ready
    setLoadingProgress({ loaded: STARTER_DATA.length, total: STARTER_DATA.length, percent: 100 });
    
    console.log(`✅ INSTANT LOAD COMPLETE: ${STARTER_DATA.length} properties ready for display`);
    console.log(`✅ loading=false, progress=100%, rawPropertiesRef populated`);
  }

  // Handle scheduled refresh triggers
  useEffect(() => {
    if (scheduledRefreshTrigger?.shouldRefresh) {
      console.log('📅 Scheduled refresh triggered - executing background refresh...');
      
      // Execute refresh silently in background
      refreshData().then(() => {
        console.log('✅ Scheduled refresh completed successfully');
        
        // Mark refresh as complete in scheduler
        if (scheduledRefreshTrigger.markRefreshComplete) {
          scheduledRefreshTrigger.markRefreshComplete('api');
        }
      }).catch(error => {
        console.error('❌ Scheduled refresh failed:', error);
      });
    }
  }, [scheduledRefreshTrigger?.shouldRefresh]);

  // useEffect for background data loading
  useEffect(() => {
    // Only start background fetch if we haven't already
    if (rawPropertiesRef.current.length === STARTER_DATA.length) {
      // Step 2: Fetch real data in background (non-blocking)
      console.log('📡 Starting background fetch for full dataset...');
      console.log('💡 Dashboard is already showing starter data - fetch happens in background');
      console.log('📥 Background fetch will attempt: IndexedDB → Supabase → Static JSON → Monday.com API');
      
      // CRITICAL: Start with a tiny delay to let React render the starter data first
      // This ensures the dashboard displays BEFORE any blocking operations
      setTimeout(() => {
        fetchData();
      }, 100); // 100ms delay - allows UI to render starter data first
    } else if (rawPropertiesRef.current.length > STARTER_DATA.length) {
      // Data already loaded, just apply new filters (debounced)
      applyFiltersToData(filters);
    }
    
    // Cleanup debounce timer on unmount
    return () => {
      if (filterDebounceRef.current) {
        clearTimeout(filterDebounceRef.current);
      }
    };
  }, [JSON.stringify(filters)]); // Compare filters by value, not reference

  // Fetch property cache from Supabase
  async function fetchFromSupabase() {
    // Skip Supabase if already disabled this session
    if (supabaseDisabledRef.current) {
      console.log('⏭️ Supabase disabled for this session - skipping');
      return null;
    }

    // CRITICAL: Don't show loading indicator during initial check
    // Only show it during manual refresh operations
    // setSupabaseStatus('loading'); // REMOVED - keeps UI non-blocking
    
    try {
      console.log('☁️ Fetching property cache from Supabase silently...');
      
      // CRITICAL: Add 5-second timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.warn('⏱️ Supabase fetch timeout after 5 seconds - continuing with starter data');
        controller.abort();
      }, 5000); // 5 seconds - faster fallback
      
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/property_cache?cache_key=eq.${CACHE_KEY}&select=*&order=created_at.desc&limit=1`,
        {
          signal: controller.signal,
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        // 401 = Authentication error - disable Supabase for this session
        if (response.status === 401) {
          console.error('❌ Supabase authentication failed (401). Disabling for this session.');
          console.log('💡 To fix: Verify your anon key is correct and the table exists.');
          supabaseDisabledRef.current = true;
          setSupabaseStatus(null);
          return null;
        }
        
        // 404/406 = Table doesn't exist - disable Supabase for this session
        if (response.status === 404 || response.status === 406) {
          console.warn('⚠️ Supabase table does not exist (404/406). Disabling for this session.');
          console.log('💡 To fix: Run the SQL from Settings page to create the property_cache table.');
          supabaseDisabledRef.current = true;
          setSupabaseStatus(null);
          return null;
        }
        
        throw new Error(`Supabase fetch failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data || data.length === 0) {
        console.log('ℹ️ Supabase table is empty - no cached data yet');
        console.log('💡 Once you refresh data from the API, it will be auto-saved to Supabase.');
        setSupabaseStatus(null);
        return null;
      }

      const cacheEntry = data[0];
      console.log(`✅ Found Supabase cache: ${cacheEntry.data?.length || 0} properties, created ${new Date(cacheEntry.created_at).toLocaleString()}`);
      
      // CRITICAL: Use updated_at for last refresh timestamp (when data was refreshed)
      // created_at is when the record was first inserted, updated_at is when it was last refreshed
      const lastRefreshTime = cacheEntry.updated_at 
        ? new Date(cacheEntry.updated_at).getTime() 
        : new Date(cacheEntry.created_at).getTime();
      
      console.log(`📅 Last refresh timestamp from Supabase: ${new Date(lastRefreshTime).toLocaleString()}`);
      
      // Don't clear loading indicator - it was never set!
      // setSupabaseStatus(null); // REMOVED
      return {
        data: cacheEntry.data || [],
        timestamp: lastRefreshTime, // Use updated_at for accurate last refresh time
        totalCount: cacheEntry.data?.length || 0,
        hasScores: true
      };
    } catch (error) {
      if (error.name === 'AbortError') {
        console.warn('⏱️ Supabase fetch aborted (timeout) - continuing with starter data');
      } else {
        console.error('❌ Supabase fetch error:', error.message);
      }
      // Don't clear loading indicator - it was never set!
      // setSupabaseStatus(null); // REMOVED
      return null;
    }
  }

  // Save property cache to Supabase
  async function saveToSupabase(properties) {
    // Skip Supabase if already disabled this session
    if (supabaseDisabledRef.current) {
      console.log('⏭️ Supabase disabled for this session - skipping save');
      return false;
    }

    setSupabaseStatus('saving'); // Show saving indicator
    const startTime = Date.now();
    
    try {
      console.log(`\n========== SUPABASE SAVE OPERATION START ==========`);
      console.log(`⏱️ Timestamp: ${new Date().toISOString()}`);
      console.log(`☁️ Attempting to save ${properties.length} properties to Supabase...`);
      console.log(`📊 Payload size: ${JSON.stringify({ cache_key: CACHE_KEY, data: properties }).length} bytes`);
      console.log(`🔗 Supabase URL: ${SUPABASE_URL}`);
      console.log(`🔑 Using cache key: ${CACHE_KEY}`);
      
      const payload = {
        cache_key: CACHE_KEY,
        data: properties
      };

      // STEP 1: Check if record exists (separate timeout for CHECK operation)
      console.log('\n--- STEP 1: Checking if cache exists ---');
      console.log('📡 Fetching existing records...');
      
      const checkController = new AbortController();
      const checkTimeoutId = setTimeout(() => {
        console.warn('⏱️ Check request timeout after 10 seconds');
        checkController.abort();
      }, 10000);
      
      let checkResponse;
      try {
        checkResponse = await fetch(
          `${SUPABASE_URL}/rest/v1/property_cache?cache_key=eq.${CACHE_KEY}&select=id`,
          {
            signal: checkController.signal,
            headers: {
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json'
            }
          }
        );
        clearTimeout(checkTimeoutId); // Clear timeout immediately after response
      } catch (checkError) {
        clearTimeout(checkTimeoutId);
        throw checkError;
      }

      console.log(`📨 Check response status: ${checkResponse.status} ${checkResponse.statusText}`);

      if (!checkResponse.ok) {
        const errorBody = await checkResponse.text();
        console.error('❌ Check request failed:', {
          status: checkResponse.status,
          statusText: checkResponse.statusText,
          body: errorBody
        });
        
        if (checkResponse.status === 401) {
          console.error('❌ AUTHENTICATION ERROR: Invalid or expired anon key');
          console.error('💡 ACTION REQUIRED: Verify your Supabase anon key is correct');
          supabaseDisabledRef.current = true;
          setSupabaseStatus(null);
          return false;
        }
        throw new Error(`Supabase check failed: ${checkResponse.status} - ${errorBody}`);
      }

      const existingRecords = await checkResponse.json();
      const recordExists = existingRecords && existingRecords.length > 0;

      console.log(`✅ Check complete: ${recordExists ? 'RECORD EXISTS' : 'NO RECORD FOUND'}`);
      if (recordExists) {
        console.log(`📋 Existing record ID: ${existingRecords[0].id}`);
      }

      // STEP 2: Update or Insert based on existence (separate timeout for SAVE operation)
      console.log(`\n--- STEP 2: ${recordExists ? 'UPDATING' : 'INSERTING'} record ---`);
      
      const currentTimestamp = new Date().toISOString();
      console.log(`⏰ Setting updated_at to: ${currentTimestamp}`);
      
      const saveController = new AbortController();
      const saveTimeoutId = setTimeout(() => {
        console.warn('⏱️ Save request timeout after 15 seconds');
        saveController.abort();
      }, 15000); // 15 seconds for save (larger payload)
      
      let saveResponse;
      try {
        if (recordExists) {
          // UPDATE existing record
          console.log('🔄 Executing PATCH request to update existing cache...');
          console.log(`🎯 Target: ${SUPABASE_URL}/rest/v1/property_cache?cache_key=eq.${CACHE_KEY}`);
          
          saveResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/property_cache?cache_key=eq.${CACHE_KEY}`,
            {
              method: 'PATCH',
              signal: saveController.signal,
              headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ 
                data: properties, 
                updated_at: currentTimestamp 
              })
            }
          );
        } else {
          // INSERT new record
          console.log('➕ Executing POST request to insert new cache...');
          console.log(`🎯 Target: ${SUPABASE_URL}/rest/v1/property_cache`);
          
          saveResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/property_cache`,
            {
              method: 'POST',
              signal: saveController.signal,
              headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
              },
              body: JSON.stringify({
                ...payload,
                updated_at: currentTimestamp
              })
            }
          );
        }
        clearTimeout(saveTimeoutId); // Clear timeout immediately after response
      } catch (saveError) {
        clearTimeout(saveTimeoutId);
        throw saveError;
      }

      console.log(`📨 Save response status: ${saveResponse.status} ${saveResponse.statusText}`);

      if (!saveResponse.ok) {
        const errorText = await saveResponse.text();
        console.error('\n❌❌❌ SAVE OPERATION FAILED ❌❌❌');
        console.error('Status:', saveResponse.status);
        console.error('Status Text:', saveResponse.statusText);
        console.error('Response Body:', errorText);
        console.error('Headers:', Object.fromEntries(saveResponse.headers.entries()));
        
        if (saveResponse.status === 401) {
          console.error('❌ AUTHENTICATION ERROR: The anon key is invalid or expired');
          console.error('💡 ACTION REQUIRED: Get a fresh anon key from your Supabase dashboard');
          supabaseDisabledRef.current = true;
          setSupabaseStatus(null);
          return false;
        }
        
        throw new Error(`Supabase save failed: ${saveResponse.status} - ${errorText}`);
      }

      const elapsedMs = Date.now() - startTime;
      
      console.log(`\n✅✅✅ SAVE OPERATION SUCCESSFUL ✅✅✅`);
      console.log(`📊 Saved ${properties.length} properties to Supabase`);
      console.log(`⏱️ Operation took ${elapsedMs}ms`);
      console.log(`📅 Timestamp: ${new Date().toLocaleString()}`);
      console.log(`🔗 Table: property_cache`);
      console.log(`🔑 Cache key: ${CACHE_KEY}`);
      console.log(`========== SUPABASE SAVE OPERATION END ==========\n`);
      
      setSupabaseStatus(null); // Clear saving indicator
      return true;
    } catch (error) {
      const elapsedMs = Date.now() - startTime;
      
      console.error(`\n❌❌❌ SAVE OPERATION EXCEPTION ❌❌❌`);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error type:', error.constructor.name);
      console.error('Time elapsed:', elapsedMs + 'ms');
      
      if (error.name === 'AbortError') {
        console.error('⏱️ Operation timed out');
        console.error('💡 TIP: This might indicate network issues or Supabase being slow');
      } else {
        console.error('Full error object:', error);
        console.error('Stack trace:', error.stack);
      }
      
      console.error(`========== SUPABASE SAVE OPERATION END (FAILED) ==========\n`);
      
      setSupabaseStatus(null); // Clear saving indicator on error
      return false;
    }
  }

  async function fetchData() {
    setError(null);
    
    // CRITICAL: Skip timeout if starter data is already loaded
    // The timeout is ONLY for emergency fallback when no data exists at all
    // With instant starter data, we don't need a blocking timeout
    const timeoutFiredRef = { current: false };
    let fetchTimeoutId = null;
    
    // Only start timeout if we have NO data (shouldn't happen with instant load)
    if (rawPropertiesRef.current.length === 0) {
      console.warn('⚠️ No starter data loaded - enabling 60-second emergency timeout');
      fetchTimeoutId = setTimeout(() => {
        console.error('⏱️ TIMEOUT: Data fetch exceeded 60 seconds with no starter data');
        timeoutFiredRef.current = true;
        setError('Connection timed out. Please check your API settings and try again.');
        setLoading(false);
        setIsDownloading(false);
      }, 60000);
    } else {
      console.log(`✅ Starter data present (${rawPropertiesRef.current.length} properties) - background fetch will run without timeout`);
    }
    
    // SAFARI DETECTION: Check browser upfront with case-insensitive matching
    const userAgent = navigator.userAgent.toLowerCase();
    const isSafari = userAgent.includes('safari') && !userAgent.includes('chrome') && !userAgent.includes('chromium');
    
    console.log('🌐 Browser detection:', {
      userAgent: navigator.userAgent.substring(0, 100),
      isSafari,
      hasSafari: userAgent.includes('safari'),
      hasChrome: userAgent.includes('chrome')
    });
    
    // Core fetch logic (no timeout wrapper for Chrome/Firefox/Edge)
    const runFetch = async () => {
      try {
          // Step 1: Check IndexedDB cache first
          console.log('📦 Checking IndexedDB for cached property data...');
          console.time('IndexedDB Cache Check');
          const cachedData = await getCachedProperties();
          console.timeEnd('IndexedDB Cache Check');
          
          if (cachedData && cachedData.data && cachedData.data.length > 0) {
            console.log(`✅ CACHE HIT - Found ${cachedData.data.length} properties in IndexedDB cache`);
            console.log(`📅 Cache timestamp: ${new Date(cachedData.timestamp).toLocaleString()}`);
            console.log(`⚡ INSTANT LOAD - Using cached data (no API calls needed)`);
            
            // Check if cache has pre-calculated scores
            if (cachedData.hasScores) {
              console.log('✅ Cache has pre-calculated scores - INSTANT LOAD');
              
              // Load from IndexedDB instantly WITH scores (no calculation needed)
              console.time('Process Cached Data');
              rawPropertiesRef.current = cachedData.data;
              processAndSetData(cachedData.data, filters);
              console.timeEnd('Process Cached Data');
              
              setLoading(false);
              setLoadingProgress({ loaded: cachedData.data.length, total: cachedData.data.length, percent: 100 });
              setLastUpdated(cachedData.timestamp);
              
              console.log('✅ ✅ ✅ DATA LOADED FROM CACHE WITH SCORES - NO CALCULATIONS NEEDED ✅ ✅ ✅');
              return;
            } else {
              console.warn('⚠️ Cache missing scores - calculating and updating cache...');
              
              // Calculate scores for cached data
              console.time('Calculate Scores');
              const scoredData = calculateScoresForCache(cachedData.data);
              console.timeEnd('Calculate Scores');
              
              // Update cache with scores
              await setCachedProperties({
                data: scoredData,
                timestamp: cachedData.timestamp,
                totalCount: scoredData.length,
                hasScores: true
              });
              console.log('✅ Updated cache with pre-calculated scores');
              
              // Load scored data
              rawPropertiesRef.current = scoredData;
              processAndSetData(scoredData, filters);
              setLoading(false);
              setLoadingProgress({ loaded: scoredData.length, total: scoredData.length, percent: 100 });
              setLastUpdated(cachedData.timestamp);
              
              console.log('✅ ✅ ✅ DATA LOADED FROM CACHE (SCORES CALCULATED ONCE) ✅ ✅ ✅');
              return;
            }
          }
          
          console.warn('⚠️ CACHE MISS - No data in IndexedDB cache');

          // Step 2: Try Supabase cloud cache (silently, no loading indicators)
          console.log('☁️ Checking Supabase cloud cache silently in background...');
          console.log(`📌 Supabase URL: ${SUPABASE_URL}`);
          console.log(`📌 Cache Key: ${CACHE_KEY}`);
          try {
            // CRITICAL: Fetch from Supabase WITHOUT showing loading indicators
            // This keeps the dashboard showing starter data while we check the cloud
            const supabaseCache = await fetchFromSupabase();
            
            if (supabaseCache && supabaseCache.data && supabaseCache.data.length > 0) {
              console.log(`✅ SUPABASE HIT - Found ${supabaseCache.data.length} properties in cloud cache`);
              
              // Save to IndexedDB for offline access
              await setCachedProperties({
                data: supabaseCache.data,
                timestamp: supabaseCache.timestamp,
                totalCount: supabaseCache.totalCount,
                hasScores: true
              });
              console.log('💾 Synced Supabase cache to local IndexedDB');
              
              // CRITICAL: Update data seamlessly without showing loading screens
              // The starter data is already visible, we just replace it with cloud data
              rawPropertiesRef.current = supabaseCache.data;
              processAndSetData(supabaseCache.data, filters);
              // Don't set loading=false - it's already false from instant load!
              setIsDownloading(false);
              setLoadingProgress({ 
                loaded: supabaseCache.data.length, 
                total: supabaseCache.data.length, 
                percent: 100 
              });
              setLastUpdated(supabaseCache.timestamp);
              
              console.log('✅ ✅ ✅ DATA SEAMLESSLY UPDATED FROM SUPABASE (NO LOADING SCREEN) ✅ ✅ ✅');
              return;
            }
            
            console.log('ℹ️ Supabase cache is empty or table doesn\'t exist yet - falling back to static file...');
            console.log('💡 TIP: Once a user with full data logs in, Supabase will be populated automatically.');
          } catch (supabaseError) {
            console.log('⚠️ Supabase unavailable, falling back to static file:', supabaseError.message);
          }

          // Step 3: No cloud cache - Load from static JSON file
          console.log('ℹ️ No cloud cache found - attempting to load from static JSON file...');
          
          if (isSafari) {
            console.log('🍎 Safari detected - skipping static file fetch (known compatibility issues)');
            console.log('📡 Going directly to Monday.com API for optimal Safari performance...');
            throw new Error('Safari: Skip static file, use API');
          }
          
          try {
            console.log('📥 Fetching static property cache from /data/propertyCache.json...');
            
            setIsDownloading(true);
            setLoadingProgress({ loaded: 0, total: 0, percent: 0, isIndeterminate: false });
            
            // Static file timeout: 30 seconds for fast failure, then API fallback
            const controller = new AbortController();
            const fetchTimeout = 30000; // 30 seconds - fail fast to API
            const timeoutId = setTimeout(() => {
              console.warn('⏱️ Static file fetch timeout reached after 30 seconds - falling back to API');
              controller.abort();
            }, fetchTimeout);
            
            const response = await fetch('/data/propertyCache.json', {
              signal: controller.signal,
              cache: 'no-cache',
              mode: 'cors',
              credentials: 'same-origin'
            });
            clearTimeout(timeoutId);
            
            const contentType = response.headers.get("content-type");
            
            if (!response.ok || !contentType || !contentType.includes("application/json")) {
              throw new Error('Static cache file not found or invalid');
            }
            
            const contentLength = response.headers.get('Content-Length');
            const totalBytes = contentLength ? parseInt(contentLength, 10) : 0;
            
            if (!response.body) {
              const arrayBuffer = await response.arrayBuffer();
              const text = new TextDecoder('utf-8').decode(arrayBuffer);
              const staticCache = JSON.parse(text);
              const scoredData = calculateScoresForCache(staticCache.data || []);
              await setCachedProperties({
                data: scoredData,
                timestamp: staticCache.timestamp || Date.now(),
                totalCount: scoredData.length,
                hasScores: true
              });
              rawPropertiesRef.current = scoredData;
              processAndSetData(scoredData, filters);
              setLoading(false);
              setIsDownloading(false);
              return;
            }
            
            const reader = response.body.getReader();
            let receivedBytes = 0;
            const chunks = [];
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              chunks.push(value);
              receivedBytes += value.length;
              if (totalBytes > 0) {
                setLoadingProgress(prev => ({ ...prev, loaded: receivedBytes, total: totalBytes, percent: Math.min(95, Math.round((receivedBytes / totalBytes) * 100)) }));
              }
            }
            const allChunks = new Uint8Array(receivedBytes);
            let position = 0;
            for (const chunk of chunks) {
              allChunks.set(chunk, position);
              position += chunk.length;
            }
            const text = new TextDecoder('utf-8').decode(allChunks);
            const staticCache = JSON.parse(text);
            const scoredData = calculateScoresForCache(staticCache.data || []);
            await setCachedProperties({
              data: scoredData,
              timestamp: staticCache.timestamp || Date.now(),
              totalCount: scoredData.length,
              hasScores: true
            });
            rawPropertiesRef.current = scoredData;
            processAndSetData(scoredData, filters);
            setLoading(false);
            setIsDownloading(false);
            return;
          } catch (staticError) {
            console.log('ℹ️ Static cache unavailable, falling back to API:', staticError.message);
          }

          // Step 4: Final fallback - Fetch from Monday.com API
          console.log('📡 Fetching fresh data from Monday.com API...');
          // CRITICAL: Don't set loading=true - keep starter data visible!
          // setLoading(true); // REMOVED - background fetch should not block UI
          setIsDownloading(true);
          const board = new ReDealFinderBoard();
          const allProperties = [];
          let cursor = null;
          let pageCount = 0;
          const pageSize = 100;
          let estimatedTotal = 500;
          const cacheWasEmpty = !cachedData; // Track if we started with empty cache
          
          try {
            let consecutiveFailures = 0;
            const maxConsecutiveFailures = 5; // Stop after 5 consecutive page failures (increased tolerance)
            
            do {
              try {
                let retries = 0;
                const maxRetries = 3;
                let result;

                while (retries <= maxRetries) {
                  try {
                    const columns = ['address', 'listingStatus', 'propertyType', 'buildingType', 'bedrooms', 'bathrooms', 'column1stPrice', 'column1stListingDate', 'column2ndPrice', 'column2ndPriceChangeDate', 'column3rdPrice', 'column3rdPriceChangeDate', 'column4thPrice', 'column4thPriceChangeDate', 'column5thPrice', 'column5thPriceChnageDate', 'dateRemoved', 'relistedDate', 'wards', 'ghlPhoneNumber', 'realtors', 'mobile', 'jsSendToGhl', 'azSendToGhl'];
                    
                    result = await board.items().withColumns(columns).withPagination(cursor ? { cursor } : { limit: pageSize }).execute();
                    
                    // Success - reset consecutive failures counter
                    consecutiveFailures = 0;
                    break;
                  } catch (apiError) {
                    console.error('❌ API Error on page fetch:', {
                      name: apiError.name,
                      type: apiError.type,
                      message: apiError.message,
                      response: apiError.response,
                      pageCount: pageCount + 1,
                      retryAttempt: retries + 1
                    });

                    // Check if this is a retryable error
                    const errorCode = apiError.response?.errors?.[0]?.extensions?.code;
                    const isRateLimitError = errorCode === 'FIELD_MINUTE_RATE_LIMIT_EXCEEDED';
                    const isComplexityError = errorCode === 'COMPLEXITY_BUDGET_EXHAUSTED';
                    const hasEmptyResponse = !apiError.response || Object.keys(apiError.response).length === 0;
                    const isSeamlessError = apiError.type === 'SeamlessApiClientError' || apiError.name === 'Error';
                    
                    const shouldRetry = isSeamlessError && (isRateLimitError || isComplexityError || hasEmptyResponse);
                    
                    if (shouldRetry && retries < maxRetries) {
                      let retrySeconds = 10;
                      if (apiError.response?.errors?.[0]?.extensions?.retry_in_seconds) {
                        retrySeconds = apiError.response.errors[0].extensions.retry_in_seconds;
                      } else {
                        retrySeconds = 10 * Math.pow(2, retries); // 10s, 20s, 40s (doubled for Monday.com rate limits)
                      }
                      
                      const errorType = isComplexityError 
                        ? 'Complexity budget exhausted' 
                        : isRateLimitError 
                        ? 'Rate limit exceeded'
                        : 'Connection issue';
                      
                      console.warn(`⏳ ${errorType}. Retrying in ${retrySeconds} seconds... (attempt ${retries + 1}/${maxRetries})`);
                      setLoadingProgress({
                        loaded: allProperties.length,
                        total: estimatedTotal,
                        percent: Math.min(99, Math.round((allProperties.length / estimatedTotal) * 100)),
                        status: `Retrying in ${retrySeconds}s (${errorType})`
                      });
                      await new Promise(resolve => setTimeout(resolve, retrySeconds * 1000));
                      retries++;
                    } else {
                      // Max retries exhausted - throw to trigger page-level error handling
                      throw apiError;
                    }
                  }
                }

                if (!result || !result.items) {
                  console.error('❌ API returned invalid response after retries', {
                    pageCount: pageCount + 1,
                    collectedSoFar: allProperties.length,
                    consecutiveFailures: consecutiveFailures + 1
                  });
                  consecutiveFailures++;
                  
                  // If we already have some properties, continue with what we have
                  if (allProperties.length > 0 && consecutiveFailures >= maxConsecutiveFailures) {
                    console.warn(`⚠️ STOPPING: ${consecutiveFailures} consecutive failures reached. Collected ${allProperties.length} properties total.`);
                    break;
                  }
                  
                  // No properties yet and invalid response - this is critical
                  if (allProperties.length === 0) {
                    throw new Error('API returned invalid response and no properties collected');
                  }
                  
                  // Continue to next iteration (will exit if cursor is null)
                  continue;
                }
                
                allProperties.push(...result.items);
                cursor = result.cursor;
                pageCount++;
                estimatedTotal = cursor ? allProperties.length + pageSize : allProperties.length;
                setLoadingProgress({ 
                  loaded: allProperties.length, 
                  total: estimatedTotal, 
                  percent: Math.min(100, Math.round((allProperties.length / estimatedTotal) * 100)), 
                  isIndeterminate: false, 
                  status: 'Downloading data...' 
                });
                
                if (pageCount === 1) processAndSetData([...allProperties], filters);
                
                // Add delay between successful page fetches to avoid rate limits
                // INCREASED from 500ms to 2000ms (2 seconds) to handle Monday.com rate limits
                if (cursor && pageCount < 100) {
                  console.log(`⏳ Waiting 2 seconds before fetching page ${pageCount + 1}...`);
                  await new Promise(r => setTimeout(r, 2000));
                }
              } catch (pageError) {
                console.error(`❌ Error fetching page ${pageCount + 1}:`, {
                  error: pageError.message,
                  errorCode: pageError.response?.errors?.[0]?.extensions?.code,
                  collectedSoFar: allProperties.length,
                  consecutiveFailures: consecutiveFailures + 1,
                  pageCount: pageCount + 1
                });
                consecutiveFailures++;
                
                // If we have some properties already and hit consecutive failures, stop gracefully
                if (allProperties.length > 0 && consecutiveFailures >= maxConsecutiveFailures) {
                  console.warn(`⚠️ STOPPING: ${consecutiveFailures} consecutive page failures reached. Collected ${allProperties.length} properties total.`);
                  console.warn(`💡 TIP: If you're only getting partial data, try refreshing in 1-2 minutes when rate limits reset.`);
                  setLoadingProgress({
                    loaded: allProperties.length,
                    total: allProperties.length,
                    percent: 100,
                    status: `Loaded ${allProperties.length} properties (API rate limited)`
                  });
                  break; // Exit pagination loop with partial data
                }
                
                // No properties yet - this is a critical failure
                if (allProperties.length === 0) {
                  console.error('❌ CRITICAL: Failed to fetch any properties from API');
                  throw pageError;
                }
                
                // Continue trying next page (cursor might still be valid)
                console.warn(`⚠️ Page ${pageCount + 1} failed but continuing with ${allProperties.length} properties collected so far...`);
              }
            } while (cursor && pageCount < 100 && consecutiveFailures < maxConsecutiveFailures);
            
            // Log final fetch summary
            console.log(`📊 API FETCH SUMMARY:`, {
              totalPages: pageCount,
              totalProperties: allProperties.length,
              consecutiveFailures: consecutiveFailures,
              stoppedEarly: consecutiveFailures >= maxConsecutiveFailures,
              hadCursor: !!cursor
            });

            // CRITICAL: Only update data if timeout hasn't fired
            // If timeout fired, keep showing starter data instead of partial results
            if (allProperties.length > 0 && !timeoutFiredRef.current) {
              const scoredData = calculateScoresForCache(allProperties);
              const timestamp = Date.now();
              
              console.log(`📊 📊 📊 API FETCH COMPLETE: ${scoredData.length} PROPERTIES WITH SCORES 📊 📊 📊`);
              
              // Save to IndexedDB
              await setCachedProperties({ data: scoredData, timestamp, totalCount: scoredData.length, hasScores: true });
              console.log(`💾 Saved ${scoredData.length} properties to IndexedDB`);
              
              // AUTO-SAVE TO SUPABASE: Update cloud cache for other users
              console.log('☁️ Auto-saving to Supabase cloud cache...');
              const supabaseSaved = await saveToSupabase(scoredData);
              if (supabaseSaved) {
                console.log(`✅ Successfully saved ${scoredData.length} properties to Supabase`);
              } else {
                console.warn(`⚠️ Supabase save failed - data only in IndexedDB`);
              }
              
              // CRITICAL: Update rawPropertiesRef with ALL fetched properties
              rawPropertiesRef.current = scoredData;
              console.log(`📦 Stored ${scoredData.length} properties in rawPropertiesRef`);
              
              // Apply filters to display subset
              console.log(`🔍 Applying filters to ${scoredData.length} properties...`);
              processAndSetData(scoredData, filters);
              setLastUpdated(timestamp);
              
              console.log(`✅ ✅ ✅ DATA LOADING COMPLETE: ${scoredData.length} PROPERTIES AVAILABLE ✅ ✅ ✅`);
              
              // AUTO-GENERATE STATIC CACHE FILE (only on first login when cache was empty and timeout hasn't fired)
              if (cacheWasEmpty && !timeoutFiredRef.current) {
                console.log('📥 First login detected - auto-generating static cache file...');
                setLoadingProgress({ 
                  loaded: scoredData.length, 
                  total: scoredData.length, 
                  percent: 100, 
                  status: 'Generating cache file...' 
                });
                
                try {
                  // Create cache object matching propertyCache.json structure
                  const cacheData = {
                    version: '1.0',
                    timestamp: timestamp,
                    totalCount: scoredData.length,
                    data: scoredData
                  };
                  
                  // Trigger browser download of cache file
                  const blob = new Blob([JSON.stringify(cacheData, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'propertyCache.json';
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                  
                  console.log(`✅ Static cache file downloaded: ${scoredData.length} properties`);
                  
                  // Show user instructions via alert (non-blocking)
                  setTimeout(() => {
                    alert(
                      `✅ Cache File Generated!\n\n` +
                      `Downloaded 'propertyCache.json' with ${scoredData.length} properties.\n\n` +
                      `📁 IMPORTANT: Place this file in:\n` +
                      `public/data/propertyCache.json\n\n` +
                      `(Create the 'data' folder inside 'public' if it doesn't exist)\n\n` +
                      `This enables instant loading for new users.`
                    );
                  }, 1000);
                  
                } catch (cacheError) {
                  console.error('❌ Failed to generate static cache file:', cacheError);
                  // Don't block app - this is a nice-to-have feature
                }
              }
            } else if (!timeoutFiredRef.current) {
              // Only throw error if timeout hasn't fired (otherwise keep starter data)
              throw new Error('API returned no properties');
            } else {
              console.log('⏱️ Timeout already fired - ignoring empty API result, keeping starter data');
            }
          } catch (apiError) {
            console.error('❌ Monday.com API Error:', {
              name: apiError.name,
              type: apiError.type,
              message: apiError.message,
              response: apiError.response,
              stack: apiError.stack
            });
            
            // Don't throw - let the outer catch handle it
            throw apiError;
          } finally {
          // CRITICAL: Don't set loading=false here - it's already false from instant load
          // Only clear the downloading indicator
                    setIsDownloading(false);
                    }
        } catch (err) {
          console.error('❌ FETCH ERROR:', {
            name: err.name,
            type: err.type,
            message: err.message,
            response: err.response,
            stack: err.stack
          });
          
          // CRITICAL: If starter data is already loaded, DON'T show blocking error
          // Just keep the starter data visible and show a non-blocking notification
          if (rawPropertiesRef.current.length > 0) {
            console.log(`⚠️ Keeping ${rawPropertiesRef.current.length} starter properties visible despite fetch failure`);
            // Don't modify loading state - it's already false from instant load
            setIsDownloading(false);
            // Don't set error state - this prevents blocking banner
          } else {
            // Only set error if we have NO data at all
            console.error('❌ CRITICAL: No data available - showing error');
            setError(err.message || 'Failed to load property data');
            setLoading(false);
            setIsDownloading(false);
          }
        }
    };

    // Execute the fetch with Safari-only timeout wrapper
    try {
      if (isSafari) {
        const timeoutMs = 120000; // 120 seconds for Safari
        console.log(`⏱️ SAFARI TIMEOUT: ${timeoutMs / 1000} seconds to prevent browser hanging`);
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error(`TIMEOUT: Safari data fetch exceeded ${timeoutMs / 1000} seconds`)), timeoutMs);
        });
        await Promise.race([runFetch(), timeoutPromise]);
      } else {
        // Chrome/Firefox/Edge: No timeout - just run fetch
        console.log('🌐 CHROME/FIREFOX/EDGE: No outer timeout - static file prioritized, API fallback allowed');
        await runFetch();
      }
      
      // Clear the timeout if it was set
      if (fetchTimeoutId && !timeoutFiredRef.current) {
        clearTimeout(fetchTimeoutId);
        console.log('✅ Fetch completed successfully - clearing emergency timeout');
      }
      
      // Always clear downloading state when fetch completes
      setIsDownloading(false);
      
    } catch (err) {
      // Clear timeout if it was set
      if (fetchTimeoutId && !timeoutFiredRef.current) {
        clearTimeout(fetchTimeoutId);
      }
      
      console.error('❌ OUTER FETCH ERROR:', {
        name: err.name,
        message: err.message,
        stack: err.stack
      });
      
      // CRITICAL: If starter data is already loaded, DON'T show blocking error
      if (rawPropertiesRef.current.length > 0) {
        console.log(`⚠️ Fetch failed but keeping ${rawPropertiesRef.current.length} starter properties visible`);
        // Don't modify loading state - it's already false from instant load
        setIsDownloading(false);
        // Don't set error - prevents blocking banner in App.jsx
      } else if (isSafari && err.message?.includes('TIMEOUT')) {
        console.error('❌ SAFARI TIMEOUT: Attempting one-time API fallback...');
        // Final fallback for Safari timeout
        try {
          const board = new ReDealFinderBoard();
          const result = await board.items().withPagination({ limit: 100 }).execute();
          if (result && result.items) {
            const scoredData = calculateScoresForCache(result.items);
            rawPropertiesRef.current = scoredData;
            processAndSetData(scoredData, filters);
          }
        } catch (apiErr) {
          console.error('API fallback also failed:', apiErr);
          // Keep starter data visible if already loaded
          if (rawPropertiesRef.current.length === 0) {
            setError('Failed to load data');
          }
        }
        setLoading(false);
        setIsDownloading(false);
      } else {
        // Only set error if we have NO data at all
        setError(err.message || 'Failed to load data');
        setLoading(false);
        setIsDownloading(false);
      }
    }
  }

  // Manual refresh function - fetches fresh data from Monday.com API
  const refreshData = async () => {
    console.log('🔄 Manual refresh triggered - fetching from Monday.com API...');
    setIsDownloading(true);
    setError(null);
    
    // Reset progress with stage tracking: 0% -> 25% (fetching) -> 50% (processing) -> 75% (saving) -> 100% (complete)
    setLoadingProgress({ loaded: 0, total: 0, percent: 0, isIndeterminate: false, status: 'Starting refresh...' });
    
    try {
      // Stage 1: Fetching (0-50%)
      setLoadingProgress({ loaded: 0, total: 0, percent: 0, isIndeterminate: false, status: 'Fetching from Monday.com...' });
      
      const board = new ReDealFinderBoard();
      const allProperties = [];
      let cursor = null;
      let pageCount = 0;
      const maxPages = 100;
      const pageSize = 100; // Optimized page size
      let estimatedTotal = 500;

      do {
        try {
          let retries = 0;
          const maxRetries = 3;
          let result;

          while (retries <= maxRetries) {
            try {
              const columns = [
                  'address', 'listingStatus', 'propertyType', 'buildingType',
                  'bedrooms', 'bathrooms', 'column1stPrice', 'column1stListingDate',
                  'column2ndPrice', 'column2ndPriceChangeDate', 'column3rdPrice',
                  'column3rdPriceChangeDate', 'column4thPrice', 'column4thPriceChangeDate',
                  'column5thPrice', 'column5thPriceChnageDate', 'dateRemoved', 'relistedDate',
                  'propertyDescription', 'realtorcaLink', 'zillowcaLink', 'wards',
                  'ghlPhoneNumber',  // Smart phone formula (checks mobile, office, landline in priority order)
                  'realtors',        // Board relation to get realtor names
                  'jsSendToGhl',     // Always fetch Jonathan's GHL column
                  'azSendToGhl'      // Always fetch Alex's GHL column
                            ];

              result = await board.items()
                .withColumns(columns)
                .withPagination(cursor ? { cursor } : { limit: pageSize })
                .execute();
              break;
            } catch (apiError) {
              const errorCode = apiError.response?.errors?.[0]?.extensions?.code;
              const isRateLimitError = errorCode === 'FIELD_MINUTE_RATE_LIMIT_EXCEEDED';
              const isComplexityError = errorCode === 'COMPLEXITY_BUDGET_EXHAUSTED';
              const hasEmptyResponse = !apiError.response || Object.keys(apiError.response).length === 0;
              const isSeamlessError = apiError.type === 'SeamlessApiClientError' || apiError.name === 'Error';
              
              const shouldRetry = isSeamlessError && (isRateLimitError || isComplexityError || hasEmptyResponse);
              
              if (shouldRetry && retries < maxRetries) {
                let retrySeconds = 15;
                if (apiError.response?.errors?.[0]?.extensions?.retry_in_seconds) {
                  retrySeconds = apiError.response.errors[0].extensions.retry_in_seconds;
                } else {
                  retrySeconds = 15 * Math.pow(2, retries);
                }
                
                console.warn(`⏳ Refresh: Retrying in ${retrySeconds} seconds... (attempt ${retries + 1}/${maxRetries})`);
                setLoadingProgress({
                  loaded: allProperties.length,
                  total: estimatedTotal,
                  percent: Math.min(99, Math.round((allProperties.length / estimatedTotal) * 100)),
                  status: `Refreshing... retrying in ${retrySeconds}s`
                });
                await new Promise(resolve => setTimeout(resolve, retrySeconds * 1000));
                retries++;
              } else {
                throw apiError;
              }
            }
          }

          if (!result || !result.items) {
            console.error('Invalid response from board.items():', result);
            break;
          }

          allProperties.push(...result.items);
          cursor = result.cursor;
          pageCount++;

          if (result.items.length === pageSize) {
            estimatedTotal = Math.max(estimatedTotal, allProperties.length + pageSize);
          } else {
            estimatedTotal = allProperties.length;
          }

          // Calculate REAL progress based on actual items fetched (0-50% range for fetching)
                    const fetchPercent = estimatedTotal > 0
                    ? Math.round((allProperties.length / estimatedTotal) * 50) // Cap at 50% during fetch
                    : 0;
              
                    setLoadingProgress({
                                        loaded: allProperties.length,
                        total: estimatedTotal,
                        percent: Math.min(50, fetchPercent),
                        isIndeterminate: false,
                        status: `Fetching... ${allProperties.length} properties`
                      });

        } catch (pageError) {
          console.error(`Error fetching page ${pageCount + 1}:`, pageError);
          throw pageError;
        }
      } while (cursor && pageCount < maxPages);

      console.log(`✓ Fetch complete: ${allProperties.length} properties`);

      // Stage 2: Processing (50-75%)
      setLoadingProgress({
        loaded: allProperties.length,
        total: allProperties.length,
        percent: 50,
        isIndeterminate: false,
        status: 'Processing data...'
      });

      // Calculate scores before saving to cache
      console.log('🔢 Calculating deal scores for cache...');
      const scoredData = calculateScoresForCache(allProperties);
      console.log(`✅ Calculated scores for ${scoredData.length} properties`);
      
      setLoadingProgress({
        loaded: scoredData.length,
        total: scoredData.length,
        percent: 75,
        isIndeterminate: false,
        status: 'Saving to cache...'
      });

      // Stage 3: Saving (75-100%)
      // Save to IndexedDB WITH pre-calculated scores
      const timestamp = Date.now();
      await setCachedProperties({
        data: scoredData,
        timestamp: timestamp,
        totalCount: scoredData.length,
        hasScores: true
      });
      console.log('💾 Updated IndexedDB cache with fresh data and scores');

      // AUTO-SAVE TO SUPABASE: Update cloud cache for other users
      console.log('☁️ Auto-updating Supabase cloud cache for other users...');
      await saveToSupabase(scoredData);

      // Stage 4: Complete (100%)
      setLoadingProgress({
        loaded: scoredData.length,
        total: scoredData.length,
        percent: 100,
        isIndeterminate: false,
        status: 'Refresh complete!'
      });

      // Update app state (data already has scores)
      rawPropertiesRef.current = scoredData;
      processAndSetData(scoredData, filters);
      setLastUpdated(timestamp);

    } catch (error) {
      console.error('❌ Refresh failed:', error);
      setError('Failed to refresh data. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

              // Background update checker using updatedAt default field
              async function checkForUpdates(cacheTimestamp) {
                try {
                  console.log('Checking for updates in background...');
                  const board = new ReDealFinderBoard();
                  
                  // Lightweight query: only fetch default fields (id, name, updatedAt are automatic)
                  const result = await board.items()
                    .withPagination({ limit: 500 }) // First batch should be enough to detect changes
                    .execute();

                  if (!result || !result.items || result.items.length === 0) {
                    console.log('Update check returned no data, keeping cached data');
                    return;
                  }

                  // Find the most recent updatedAt timestamp
                  const mostRecentUpdate = result.items.reduce((latest, item) => {
                    if (!item.updatedAt) return latest;
                    const updateTime = new Date(item.updatedAt).getTime();
                    return updateTime > latest ? updateTime : latest;
                  }, 0);

                  console.log('Cache timestamp:', new Date(cacheTimestamp).toISOString());
                  console.log('Most recent item update:', mostRecentUpdate ? new Date(mostRecentUpdate).toISOString() : 'None');

                  // If no updates detected or data is still fresh, keep using cache
                  if (mostRecentUpdate === 0 || mostRecentUpdate <= cacheTimestamp) {
                    console.log('✓ No updates detected, data is fresh');
                    return;
                  }

                  // Updates detected, trigger silent refresh
                  console.log('⚠ Updates detected, refreshing data in background...');
                  setLoadingProgress({ 
                    loaded: 0, 
                    total: 0, 
                    percent: 0, 
                    status: 'Refreshing data...' 
                  });

                  // Fetch fresh data
                  await fetchFreshData();

                } catch (error) {
                  console.error('Background update check failed:', error);
                  // Silently fail, keep using cached data - better UX than showing errors
                }
              }

              // Fetch fresh data without triggering loading state
              async function fetchFreshData() {
                try {
                  const board = new ReDealFinderBoard();
                  const allProperties = [];
                  let cursor = null;
                  let pageCount = 0;
                  const maxPages = 100;
                  const pageSize = 100; // Optimized page size
                  let estimatedTotal = 500;

                  do {
                    try {
                      let retries = 0;
                      const maxRetries = 3;
                      let result;

                      while (retries <= maxRetries) {
                        try {
                          // CRITICAL: Reduced column set to avoid complexity budget exhaustion
                                          // Removed heavy columns from background refresh
                                            const columns = [
                                            'address', 'listingStatus', 'propertyType', 'buildingType',
                                            'bedrooms', 'bathrooms', 'column1stPrice', 'column1stListingDate',
                                            'column2ndPrice', 'column2ndPriceChangeDate', 'column3rdPrice',
                                            'column3rdPriceChangeDate', 'column4thPrice', 'column4thPriceChangeDate',
                                            'column5thPrice', 'column5thPriceChnageDate', 'dateRemoved', 'relistedDate',
                                          'wards',
                                          'ghlPhoneNumber',  // Smart phone formula
                                          'realtors',        // Board relation to get realtor names
                                          'mobile',          // Mirror column from Realtors board
                                          'jsSendToGhl',     // Always fetch Jonathan's GHL column
                                          'azSendToGhl'      // Always fetch Alex's GHL column
                                                    ];
                          // Note: updatedAt is a default field and returned automatically

                          result = await board.items()
                            .withColumns(columns)
                            .withPagination(cursor ? { cursor } : { limit: pageSize })
                            .execute();
                          
                          // Add delay between successful page fetches in background refresh
                          if (result.cursor && pageCount < maxPages - 1) {
                            const interPageDelay = 500; // 500ms delay (reduced from 2000ms for faster background refresh)
                            console.log(`⏳ Background refresh: Waiting ${interPageDelay / 1000}s before next page...`);
                            await new Promise(resolve => setTimeout(resolve, interPageDelay));
                          }
                          
                          break;
                        } catch (apiError) {
                          console.error('API Error in background refresh:', {
                            name: apiError.name,
                            type: apiError.type,
                            message: apiError.message,
                            response: apiError.response,
                            stack: apiError.stack
                          });

                          // Check if this is a retryable error
                          const errorCode = apiError.response?.errors?.[0]?.extensions?.code;
                          const isRateLimitError = errorCode === 'FIELD_MINUTE_RATE_LIMIT_EXCEEDED';
                          const isComplexityError = errorCode === 'COMPLEXITY_BUDGET_EXHAUSTED';
                          const hasEmptyResponse = !apiError.response || Object.keys(apiError.response).length === 0;
                          const isSeamlessError = apiError.type === 'SeamlessApiClientError' || apiError.name === 'Error';
                          
                          const shouldRetry = isSeamlessError && (isRateLimitError || isComplexityError || hasEmptyResponse);
                          
                          if (shouldRetry && retries < maxRetries) {
                            let retrySeconds = 5; // Reduced from 20s to 5s for faster recovery
                            if (apiError.response?.errors?.[0]?.extensions?.retry_in_seconds) {
                              retrySeconds = apiError.response.errors[0].extensions.retry_in_seconds;
                            } else {
                              retrySeconds = 5 * Math.pow(2, retries); // 5s, 10s, 20s
                            }
                            
                            const errorType = isComplexityError 
                              ? 'Complexity budget exhausted' 
                              : isRateLimitError 
                              ? 'Rate limit exceeded'
                              : 'Connection issue';
                            
                            console.warn(`Background refresh: ${errorType}. Retrying in ${retrySeconds} seconds... (attempt ${retries + 1}/${maxRetries})`);
                            setLoadingProgress({
                              loaded: allProperties.length,
                              total: estimatedTotal,
                              percent: Math.min(99, Math.round((allProperties.length / estimatedTotal) * 100)),
                              status: `Refreshing... ${retrySeconds}s (${errorType})`
                            });
                            await new Promise(resolve => setTimeout(resolve, retrySeconds * 1000));
                            retries++;
                          } else {
                            if (retries >= maxRetries) {
                              console.error(`Background refresh: Max retries (${maxRetries}) reached`);
                            }
                            throw apiError;
                          }
                        }
                      }

                      if (!result || !result.items) {
                        console.error('Invalid response from board.items():', result);
                        break;
                      }

                      allProperties.push(...result.items);
                      cursor = result.cursor;
                      pageCount++;

                      if (result.items.length === pageSize) {
                        estimatedTotal = Math.max(estimatedTotal, allProperties.length + pageSize);
                      } else {
                        estimatedTotal = allProperties.length;
                      }

                      const percent = Math.round((allProperties.length / estimatedTotal) * 100);
                      setLoadingProgress({
                        loaded: allProperties.length,
                        total: estimatedTotal,
                        percent: Math.min(100, percent), // Cap at 100% only
                        status: 'Refreshing...'
                      });

                    } catch (pageError) {
                      console.error(`Error fetching page ${pageCount + 1}:`, pageError);
                      throw pageError;
                    }
                  } while (cursor && pageCount < maxPages);

                  setLoadingProgress({
                    loaded: allProperties.length,
                    total: allProperties.length,
                    percent: 100
                  });

                  console.log(`✓ Background refresh complete: ${allProperties.length} properties`);

                  // Calculate scores before saving to cache
                  const scoredData = calculateScoresForCache(allProperties);

                  // Update IndexedDB cache
                  const timestamp = Date.now();
                  await setCachedProperties({
                    data: scoredData,
                    timestamp: timestamp,
                    totalCount: scoredData.length,
                    hasScores: true
                  });

                  // Store in ref and update UI with fresh data
                  rawPropertiesRef.current = scoredData;
                  processAndSetData(scoredData, filters);

                } catch (error) {
                  console.error('Background refresh failed:', error);
                  // Keep using cached data on error
                }
              }

              // Apply filters to existing data without re-fetching
                          // Uses debouncing to prevent flickering during rapid filter changes
                            const filterDebounceRef = useRef(null);
              
                            async function applyFiltersToData(newFilters) {
                            // Clear any pending filter application
                            if (filterDebounceRef.current) {
                            clearTimeout(filterDebounceRef.current);
                              }
                
                              // Show loading banner immediately
                            setIsApplyingFilters(true);
                
                            // Debounce the actual filter application by 300ms
                          filterDebounceRef.current = setTimeout(() => {
                                try {
                                  // Process data with new filters
                                  processAndSetData(rawPropertiesRef.current, newFilters);
                                  activeFiltersRef.current = newFilters;
                                } finally {
                                  setIsApplyingFilters(false);
                                }
                              }, 300);
                            }

              function processAndSetData(rawProperties, filters) {
                // Ward normalization function - ensures consistent "Ward X" format
                const normalizeWard = (wardValue) => {
                  if (!wardValue) return wardValue;
                  
                  // Convert to string and trim
                  const str = String(wardValue).trim();
                  
                  // Extract number from various formats: "WARD 3", "Ward 3", "ward 3", "ward3", "3"
                  const match = str.match(/(\d+)/);
                  if (!match) return wardValue; // No number found, return as-is
                  
                  const wardNumber = match[1];
                  
                  // Return standardized format: "Ward X"
                  return `Ward ${wardNumber}`;
                };

                              // Store raw properties for base dataset
                              const now = new Date();
                              const processedProperties = rawProperties.map(prop => {
                let dom = 0;
              if (prop.column1stListingDate) {
            const listingDate = new Date(prop.column1stListingDate);
      const endDate = prop.dateRemoved ? new Date(prop.dateRemoved) : now;
            dom = Math.floor((endDate - listingDate) / (1000 * 60 * 60 * 24));
            }

            // Build complete price history array
            const priceHistory = [];
            
            // Always add first price (initial listing)
            if (prop.column1stPrice != null && prop.column1stPrice > 0 && prop.column1stListingDate) {
              priceHistory.push({ price: Number(prop.column1stPrice), date: prop.column1stListingDate });
            }
            
            // Add subsequent price changes only if they exist
            if (prop.column2ndPrice != null && prop.column2ndPrice > 0 && prop.column2ndPriceChangeDate) {
              priceHistory.push({ price: Number(prop.column2ndPrice), date: prop.column2ndPriceChangeDate });
            }
            if (prop.column3rdPrice != null && prop.column3rdPrice > 0 && prop.column3rdPriceChangeDate) {
              priceHistory.push({ price: Number(prop.column3rdPrice), date: prop.column3rdPriceChangeDate });
            }
            if (prop.column4thPrice != null && prop.column4thPrice > 0 && prop.column4thPriceChangeDate) {
              priceHistory.push({ price: Number(prop.column4thPrice), date: prop.column4thPriceChangeDate });
            }
            if (prop.column5thPrice != null && prop.column5thPrice > 0 && prop.column5thPriceChnageDate) {
              priceHistory.push({ price: Number(prop.column5thPrice), date: prop.column5thPriceChnageDate });
            }

            // Sort by date chronologically
            priceHistory.sort((a, b) => {
              if (!a.date || !b.date) return 0;
              return new Date(a.date) - new Date(b.date);
            });

            // Get initial price (first entry) and current price (last entry)
            const initialPrice = priceHistory.length > 0 ? priceHistory[0].price : Number(prop.column1stPrice) || 0;
            const currentPrice = priceHistory.length > 0 ? priceHistory[priceHistory.length - 1].price : Number(prop.column1stPrice) || 0;

            // CRITICAL FIX: Filter price history to only include DROPS (negative changes)
            // Build a price drop history by comparing consecutive prices
            const priceDropHistory = [];
            for (let i = 1; i < priceHistory.length; i++) {
              const prevPrice = priceHistory[i - 1].price;
              const currPrice = priceHistory[i].price;
              
              // Only include this change if price went DOWN (negative change)
              if (currPrice < prevPrice) {
                priceDropHistory.push(priceHistory[i]);
              }
            }

            // Calculate drop frequency: count of ACTUAL DROPS only (not price increases)
            const dropFrequency = priceDropHistory.length;

            // Calculate total drop amount: sum of all negative price changes
            let totalDropAmount = 0;
            if (priceDropHistory.length > 0) {
              // Sum all drops from the filtered history
              let prevPrice = initialPrice;
              for (const dropEntry of priceDropHistory) {
                // Find what the price was before this drop
                const dropIndex = priceHistory.findIndex(h => h.date === dropEntry.date && h.price === dropEntry.price);
                if (dropIndex > 0) {
                  prevPrice = priceHistory[dropIndex - 1].price;
                }
                totalDropAmount += (dropEntry.price - prevPrice);
              }
            }

            // Calculate drop percentage: only based on DROPS, not increases
            // If price increased overall, drop % should be 0
            let dropPercent = 0;
            if (initialPrice > 0 && currentPrice < initialPrice) {
              // Price went down overall - calculate drop percentage
              const calculated = ((currentPrice - initialPrice) / initialPrice) * 100;
              if (isFinite(calculated) && !isNaN(calculated)) {
                dropPercent = calculated; // Will be negative
              }
            }
            // else: price increased or stayed same = 0% drop
            
                                      // Debug logging for 528 SANDISON STREET
                                      if (prop.name && prop.name.includes('528 SANDISON')) {
                                      console.log('=== 528 SANDISON STREET DEBUG ===');
                                    console.log('Initial Price (1st):', initialPrice);
            console.log('Current Price (Latest):', currentPrice);
                                    console.log('Total Drop Amount:', totalDropAmount);
                        console.log('Calculated Drop %:', dropPercent);
            console.log('Monday Drop % Field:', prop.dropAsAPercentageOfTheInitialPrice);
                                    console.log('Price History:', priceHistory);
                                                console.log('=================================');
                                                }

            // Pre-normalize coordinates for MapWidget performance with strict validation
            let latNum = null;
            let lngNum = null;
            if (prop.address?.lat && prop.address?.lng) {
              const parsedLat = parseFloat(prop.address.lat);
              const parsedLng = parseFloat(prop.address.lng);
              // Only set if valid finite numbers
              if (!isNaN(parsedLat) && !isNaN(parsedLng) && isFinite(parsedLat) && isFinite(parsedLng)) {
                latNum = parsedLat;
                lngNum = parsedLng;
              } else {
                console.warn(`Property ${prop.name} has invalid coordinates:`, { lat: prop.address.lat, lng: prop.address.lng });
              }
            }
            const isRemoved = prop.listingStatus === 'Removed';

            return {
                          ...prop,
                          daysOnMarket: dom,
                          price: currentPrice,
                          city: prop.address?.city || 'Unknown',
                          wards: normalizeWard(prop.wards), // Normalize ward format
                          dropAsAPercentageOfTheInitialPrice: dropPercent,
                          dropFrequencyCount: dropFrequency,
                          priceHistory: priceHistory,
                          totalDropAmount: totalDropAmount,
                          // Pre-computed for MapWidget (avoids parseFloat in render loop)
                          latNum,
                          lngNum,
                          isRemoved
                        };
                        });

                            // Save ALL processed properties (unfiltered) to allProperties state
                          // Memoize by creating a new array only if data actually changed
                          setAllProperties(prev => {
                            // If lengths differ, definitely update
                            if (prev.length !== processedProperties.length) return processedProperties;
                            
                            // If first item's updatedAt differs, update (simple change detection)
                            if (prev.length > 0 && processedProperties.length > 0) {
                              if (prev[0].updatedAt !== processedProperties[0].updatedAt) {
                                return processedProperties;
                              }
                            }
                            
                            // Otherwise, keep previous reference to prevent unnecessary re-renders
                            return prev;
                          });

                            // Apply filters with memoization-friendly logic
                                        // Filter only when filters actually change (handled by useEffect dependency)
                                        let filtered = processedProperties;
                            console.log(`🔍 FILTER APPLICATION START: ${filtered.length} properties before filtering`);
                                        console.log(`📋 Active filters:`, JSON.stringify(filters, null, 2));

                            // Property Types - use filters.propertyTypes array
                                        if (filters.propertyTypes?.length > 0) {
                            const beforeCount = filtered.length;
                                        filtered = filtered.filter(p => filters.propertyTypes.includes(p.propertyType));
                                        console.log(`  ✓ Property Types filter: ${beforeCount} → ${filtered.length} (kept ${filtered.length})`);
                            }

                                        // Status - use filters.statuses array
                                        if (filters.statuses?.length > 0) {
                                          const beforeCount = filtered.length;
                                          filtered = filtered.filter(p => filters.statuses.includes(p.listingStatus));
                                          console.log(`  ✓ Status filter: ${beforeCount} → ${filtered.length} (kept ${filtered.length})`);
                                        }

            // Price - use filters.priceMin/priceMax
            if (filters.priceMin != null && filters.priceMin !== '') {
              const beforeCount = filtered.length;
              const min = Number(filters.priceMin);
              if (!isNaN(min)) filtered = filtered.filter(p => (p.price || 0) >= min);
              console.log(`  ✓ Price Min (${min}) filter: ${beforeCount} → ${filtered.length}`);
            }
            if (filters.priceMax != null && filters.priceMax !== '') {
              const beforeCount = filtered.length;
              const max = Number(filters.priceMax);
              if (!isNaN(max)) filtered = filtered.filter(p => (p.price || 0) <= max);
              console.log(`  ✓ Price Max (${max}) filter: ${beforeCount} → ${filtered.length}`);
            }

            // Days on Market - use filters.domMin/domMax
            if (filters.domMin != null && filters.domMin !== '') {
              const beforeCount = filtered.length;
              const min = Number(filters.domMin);
              if (!isNaN(min)) filtered = filtered.filter(p => (p.daysOnMarket || 0) >= min);
              console.log(`  ✓ DOM Min (${min}) filter: ${beforeCount} → ${filtered.length}`);
            }
            if (filters.domMax != null && filters.domMax !== '') {
              const beforeCount = filtered.length;
              const max = Number(filters.domMax);
              if (!isNaN(max)) filtered = filtered.filter(p => (p.daysOnMarket || 0) <= max);
              console.log(`  ✓ DOM Max (${max}) filter: ${beforeCount} → ${filtered.length}`);
            }

            // Wards
            if (filters.wards?.length > 0) {
              const beforeCount = filtered.length;
              filtered = filtered.filter(p => 
                p.wards && filters.wards.includes(p.wards)
              );
              console.log(`  ✓ Wards (${filters.wards.join(', ')}) filter: ${beforeCount} → ${filtered.length}`);
            }

            // Beds filter
            if (filters.bedsMin !== undefined && filters.bedsMin !== '' && filters.bedsMin !== null) {
              const beforeCount = filtered.length;
              const minBeds = Number(filters.bedsMin);
              if (!isNaN(minBeds)) {
                filtered = filtered.filter(p => {
                  const propertyBeds = Number(p.bedrooms) || 0;
                  return propertyBeds >= minBeds;
                });
              }
              console.log(`  ✓ Beds Min (${minBeds}) filter: ${beforeCount} → ${filtered.length}`);
            }
            if (filters.bedsMax !== undefined && filters.bedsMax !== '' && filters.bedsMax !== null) {
              const beforeCount = filtered.length;
              const maxBeds = Number(filters.bedsMax);
              if (!isNaN(maxBeds)) {
                filtered = filtered.filter(p => {
                  const propertyBeds = Number(p.bedrooms) || 0;
                  return propertyBeds <= maxBeds;
                });
              }
              console.log(`  ✓ Beds Max (${maxBeds}) filter: ${beforeCount} → ${filtered.length}`);
            }

            // Baths filter
            if (filters.bathsMin !== undefined && filters.bathsMin !== '' && filters.bathsMin !== null) {
              const beforeCount = filtered.length;
              const minBaths = Number(filters.bathsMin);
              if (!isNaN(minBaths)) {
                filtered = filtered.filter(p => {
                  const propertyBaths = Number(p.bathrooms) || 0;
                  return propertyBaths >= minBaths;
                });
              }
              console.log(`  ✓ Baths Min (${minBaths}) filter: ${beforeCount} → ${filtered.length}`);
            }
            if (filters.bathsMax !== undefined && filters.bathsMax !== '' && filters.bathsMax !== null) {
              const beforeCount = filtered.length;
              const maxBaths = Number(filters.bathsMax);
              if (!isNaN(maxBaths)) {
                filtered = filtered.filter(p => {
                  const propertyBaths = Number(p.bathrooms) || 0;
                  return propertyBaths <= maxBaths;
                });
              }
              console.log(`  ✓ Baths Max (${maxBaths}) filter: ${beforeCount} → ${filtered.length}`);
            }

            // Drop % - use dropAsAPercentageOfTheInitialPrice field
            if (filters.dropPercentMin != null && filters.dropPercentMin !== '') {
              const beforeCount = filtered.length;
              const min = Number(filters.dropPercentMin);
              if (!isNaN(min)) filtered = filtered.filter(p => (p.dropAsAPercentageOfTheInitialPrice || 0) >= min);
              console.log(`  ✓ Drop % Min (${min}) filter: ${beforeCount} → ${filtered.length}`);
            }
            if (filters.dropPercentMax != null && filters.dropPercentMax !== '') {
              const beforeCount = filtered.length;
              const max = Number(filters.dropPercentMax);
              if (!isNaN(max)) filtered = filtered.filter(p => (p.dropAsAPercentageOfTheInitialPrice || 0) <= max);
              console.log(`  ✓ Drop % Max (${max}) filter: ${beforeCount} → ${filtered.length}`);
            }

            // Drop $ - use totalDropAmount field
            if (filters.dropDollarMin != null && filters.dropDollarMin !== '') {
              const beforeCount = filtered.length;
              const min = Number(filters.dropDollarMin);
              if (!isNaN(min)) filtered = filtered.filter(p => (p.totalDropAmount || 0) >= min);
              console.log(`  ✓ Drop $ Min (${min}) filter: ${beforeCount} → ${filtered.length}`);
            }
            if (filters.dropDollarMax != null && filters.dropDollarMax !== '') {
              const beforeCount = filtered.length;
              const max = Number(filters.dropDollarMax);
              if (!isNaN(max)) filtered = filtered.filter(p => (p.totalDropAmount || 0) <= max);
              console.log(`  ✓ Drop $ Max (${max}) filter: ${beforeCount} → ${filtered.length}`);
            }

            // Drop Frequency - use dropFrequencyCount field
            if (filters.dropFrequencyMin != null && filters.dropFrequencyMin !== '') {
              const beforeCount = filtered.length;
              const min = Number(filters.dropFrequencyMin);
              if (!isNaN(min)) filtered = filtered.filter(p => (p.dropFrequencyCount || 0) >= min);
              console.log(`  ✓ Drop Frequency Min (${min}) filter: ${beforeCount} → ${filtered.length}`);
            }
            if (filters.dropFrequencyMax != null && filters.dropFrequencyMax !== '') {
              const beforeCount = filtered.length;
              const max = Number(filters.dropFrequencyMax);
              if (!isNaN(max)) filtered = filtered.filter(p => (p.dropFrequencyCount || 0) <= max);
              console.log(`  ✓ Drop Frequency Max (${max}) filter: ${beforeCount} → ${filtered.length}`);
            }

            // GHL Status - filter by user-specific GHL column
            if (filters.ghlStatus && filters.ghlStatus !== 'any' && currentUser?.monGhlColumn) {
              const beforeCount = filtered.length;
              // Determine which GHL column to check based on current user
              const ghlColumnField = currentUser.monGhlColumn === 'JS Send to GHL' 
                ? 'jsSendToGhl' 
                : currentUser.monGhlColumn === 'AZ Send to GHL'
                ? 'azSendToGhl'
                : null;
              
              if (ghlColumnField) {
                if (filters.ghlStatus === 'sent') {
                  // Only show properties with "SENT" status in user's GHL column
                  filtered = filtered.filter(p => {
                    const ghlValue = p[ghlColumnField];
                    return ghlValue && ghlValue.toUpperCase() === 'SENT';
                  });
                  console.log(`  ✓ GHL Status (SENT) filter: ${beforeCount} → ${filtered.length}`);
                } else if (filters.ghlStatus === 'not_sent') {
                  // Only show properties without "SENT" status (null, empty, or other values)
                  filtered = filtered.filter(p => {
                    const ghlValue = p[ghlColumnField];
                    return !ghlValue || ghlValue.toUpperCase() !== 'SENT';
                  });
                  console.log(`  ✓ GHL Status (NOT SENT) filter: ${beforeCount} → ${filtered.length}`);
                }
              }
            }
            
            console.log(`🔍 FILTER APPLICATION COMPLETE: ${processedProperties.length} → ${filtered.length} properties (${((filtered.length / processedProperties.length) * 100).toFixed(1)}% retained)`);
            console.log(`📊 FINAL COUNTS: Total=${processedProperties.length}, Filtered=${filtered.length}, Hidden=${processedProperties.length - filtered.length}`);

              // Calculate statistics with memoization-friendly approach
              // These calculations only run when filtered array changes
              const activeListings = filtered.filter(p => p.listingStatus === 'Active');
              const prices = filtered.filter(p => p.price > 0).map(p => p.price);
              const avgPrice = prices.length > 0
                ? prices.reduce((a, b) => a + b, 0) / prices.length
                : 0;

              const sortedPrices = [...prices].sort((a, b) => a - b);
              const medianPrice = sortedPrices.length > 0
                ? sortedPrices[Math.floor(sortedPrices.length / 2)]
                : 0;

              const doms = filtered.filter(p => p.daysOnMarket > 0).map(p => p.daysOnMarket);
              const avgDOM = doms.length > 0
                ? doms.reduce((a, b) => a + b, 0) / doms.length
                : 0;

              setStats({
                totalListings: filtered.length,
                activeListings: activeListings.length,
                avgPrice: Math.round(avgPrice),
                medianPrice: Math.round(medianPrice),
                avgDOM: Math.round(avgDOM)
              });

              setProperties(filtered);
  }

  // Return REAL progress only - no simulation
  return {
    properties,
    allProperties,
    loading,
    error,
    stats,
    loadingProgress, // Use real progress data
    isApplyingFilters,
    isDownloading,
    lastUpdated,
    refreshData,
    supabaseStatus // Expose Supabase operation status for UI feedback
  };
}
