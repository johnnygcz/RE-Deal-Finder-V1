import { useState } from 'react';
import { ReDealFinderBoard } from '@api/BoardSDK.js';
import { findWardForLocation } from '../utils/wardDetection';
import { windsorWards } from '../data/windsorWards';

/**
 * Hook to assign ward numbers to properties based on their coordinates
 * Updates the Monday.com 'wards' column with the detected ward
 */
export function useWardAssignment() {
  const [progress, setProgress] = useState({ current: 0, total: 0, percent: 0 });
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState({ updated: 0, skipped: 0, failed: 0 });

  const assignWardsToProperties = async (properties) => {
    if (!properties || properties.length === 0) {
      setError('No properties provided');
      return;
    }

    setIsRunning(true);
    setError(null);
    setResults({ updated: 0, skipped: 0, failed: 0 });
    setProgress({ current: 0, total: properties.length, percent: 0 });

    const board = new ReDealFinderBoard();
    const stats = { updated: 0, skipped: 0, failed: 0 };

    try {
      for (let i = 0; i < properties.length; i++) {
        const property = properties[i];
        
        // Update progress
        const current = i + 1;
        const percent = Math.round((current / properties.length) * 100);
        setProgress({ current, total: properties.length, percent });

        // Skip if no coordinates
        if (!property.address?.lat || !property.address?.lng) {
          console.log(`Skipping ${property.name} - no coordinates`);
          stats.skipped++;
          continue;
        }

        // Skip if ward already assigned
        if (property.wards && property.wards.trim() !== '') {
          console.log(`Skipping ${property.name} - ward already assigned: ${property.wards}`);
          stats.skipped++;
          continue;
        }

        // Detect ward
        const ward = findWardForLocation(
          property.address.lat,
          property.address.lng,
          windsorWards.features
        );

        if (!ward) {
          console.log(`No ward found for ${property.name} (${property.address.lat}, ${property.address.lng})`);
          stats.failed++;
          continue;
        }

        // Update Monday.com item with ward number
        // CRITICAL: Extract only the numeric value to ensure "Ward X" format
        const wardNumberOnly = String(ward.number).replace(/\D/g, '');
        
        try {
          await board.item(property.id).update({
            wards: `Ward ${wardNumberOnly}`
          }).execute();

          console.log(`✓ Updated ${property.name} → Ward ${ward.number} (${ward.councillor})`);
          stats.updated++;
        } catch (updateError) {
          console.error(`Failed to update ${property.name}:`, updateError);
          stats.failed++;
          
          // Check for rate limit
          if (updateError.type === 'SeamlessApiClientError' && 
              updateError.response?.errors?.[0]?.extensions?.code === 'FIELD_MINUTE_RATE_LIMIT_EXCEEDED') {
            const retrySeconds = updateError.response.errors[0].extensions.retry_in_seconds || 30;
            console.warn(`Rate limit hit. Waiting ${retrySeconds} seconds...`);
            await new Promise(resolve => setTimeout(resolve, retrySeconds * 1000));
            
            // Retry the failed item
            try {
              await board.item(property.id).update({
                wards: `Ward ${wardNumberOnly}`
              }).execute();
              stats.updated++;
              stats.failed--;
              console.log(`✓ Retry successful for ${property.name}`);
            } catch (retryError) {
              console.error(`Retry failed for ${property.name}:`, retryError);
            }
          }
        }

        // Add small delay to avoid rate limits (100ms between updates)
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.log(`\n=== Ward Assignment Complete ===`);
      console.log(`Updated: ${stats.updated}`);
      console.log(`Skipped: ${stats.skipped}`);
      console.log(`Failed: ${stats.failed}`);
      console.log(`================================\n`);

      setResults(stats);
    } catch (err) {
      console.error('Error during ward assignment:', err);
      setError(err.message || 'Failed to assign wards');
    } finally {
      setIsRunning(false);
      setProgress({ current: properties.length, total: properties.length, percent: 100 });
    }
  };

  return {
    assignWardsToProperties,
    progress,
    isRunning,
    error,
    results
  };
}
