import { useMemo } from 'react';

export function useDealScoring(properties) {
  const scoredProperties = useMemo(() => {
    if (!properties || properties.length === 0) return [];

    return properties.map(prop => {
      // Extract values with validation
      const dropPercent = (prop.dropAsAPercentageOfTheInitialPrice != null && 
                          isFinite(prop.dropAsAPercentageOfTheInitialPrice) && 
                          !isNaN(prop.dropAsAPercentageOfTheInitialPrice))
        ? prop.dropAsAPercentageOfTheInitialPrice
        : 0;

      const dom = prop.daysOnMarket || 0;
      const dropCount = prop.dropFrequencyCount || 0;
      const keywordValue = prop.keywordUsed || '';

      // Calculate Total Drop $ (latest price - 1st price)
      // Positive value means price increased, negative means price dropped
      const totalDropAmount = (prop.price && prop.column1stPrice)
        ? prop.price - prop.column1stPrice
        : 0;

      // 1. DROP % SCORE (0-45 points, 45% weight)
      // ONLY reward NEGATIVE drop percentages (price went DOWN)
      // If price increased (positive %), score = 0
      let priceDropScore = 0;
      if (dropPercent < 0) {
        // Bigger negative % = higher score
        // -9% drop = 45 points, -4.5% drop = 22.5 points, etc.
        const absDrop = Math.abs(dropPercent);
        priceDropScore = Math.min(45, absDrop * 5);
      }
      // else: price increased or stayed same = 0 points

      // 2. DOM SCORE (0-30 points, 30% weight)
      // Longer DOM = more motivated seller = higher score
      // 180+ days = max 30 points
      const maxDOM = 180;
      const domScore = Math.min(30, (dom / maxDOM) * 30);

      // 3. FREQUENCY SCORE (0-15 points, 15% weight)
      // More price changes = more desperate seller = higher score
      // 4+ changes = max 15 points
      const dropFrequencyScore = Math.min(15, (dropCount / 4) * 15);

      // 4. KEYWORD SCORE (0-10 points, 10% weight)
      // Properties found via keywords = motivated sellers
      let keywordScore = 0;
      if (keywordValue && keywordValue !== 'No result' && keywordValue.trim() !== '') {
        keywordScore = 10; // Full points if keyword present
      }

      // 5. GLOBAL DEAL SCORE (sum of four components)
      // Range: 0-100 points
      let globalScore = priceDropScore + domScore + dropFrequencyScore + keywordScore;

      // 6. INCREASE PENALTY
      // If price INCREASED (positive %), cap score at 5 (terrible deal)
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
          keywords: Math.round(keywordScore),
          global: globalScore
        },
        totalDropPercent: dropPercent,
        totalDropAmount
      };
    });
  }, [properties]);

  return { scoredProperties };
}
