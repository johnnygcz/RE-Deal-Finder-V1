import { useMemo } from 'react';
import { BarChart, TrendingUp, Zap, DollarSign, Award, Calendar, TrendingDown, Users, Star, MapPin, Gem, Activity, Flame, Sparkles } from 'lucide-react';

/**
 * Calculate realtor rankings across all performance categories
 * Returns a map of realtor names to their top performing categories with percentile ranks
 */
export function useRealtorRankings(properties) {
  return useMemo(() => {
    const realtorData = {};
    const rankingsMap = new Map(); // Map<realtorName, Array<{category, percentile, value, icon, color}>>

    // Build initial realtor data
    properties.forEach(prop => {
      const realtorName = prop.realtors?.linkedItems?.[0]?.name || 'Unknown';
      
      if (!realtorData[realtorName]) {
        realtorData[realtorName] = {
          totalListings: 0,
          soldListings: 0,
          totalDOMToSell: 0,
          prices: [],
          relisted: 0,
          priceDrops: 0,
          firstListingDate: null,
          recentListings: 0,
          wards: {}
        };
      }

      realtorData[realtorName].totalListings += 1;
      
      if (prop.price) {
        realtorData[realtorName].prices.push(prop.price);
      }

      // Track wards for specialization
      if (prop.wards) {
        if (!realtorData[realtorName].wards[prop.wards]) {
          realtorData[realtorName].wards[prop.wards] = 0;
        }
        realtorData[realtorName].wards[prop.wards] += 1;
      }

      if (prop.column1stListingDate) {
        const listingDate = new Date(prop.column1stListingDate);
        if (!realtorData[realtorName].firstListingDate || listingDate < realtorData[realtorName].firstListingDate) {
          realtorData[realtorName].firstListingDate = listingDate;
        }

        const daysSinceList = (Date.now() - listingDate) / (1000 * 60 * 60 * 24);
        if (daysSinceList <= 30) {
          realtorData[realtorName].recentListings += 1;
        }
      }

      if (prop.listingStatus === 'Removed' && prop.column1stListingDate && prop.dateRemoved) {
        const listDate = new Date(prop.column1stListingDate);
        const removeDate = new Date(prop.dateRemoved);
        const domToSell = Math.floor((removeDate - listDate) / (1000 * 60 * 60 * 24));
        
        if (domToSell >= 0 && domToSell <= 2) {
          realtorData[realtorName].soldListings += 1;
          realtorData[realtorName].totalDOMToSell += domToSell;
        }
      }

      if (prop.listingStatus === 'RELISTED') {
        realtorData[realtorName].relisted += 1;
      }

      if (prop.priceHistory && prop.priceHistory.length > 1) {
        realtorData[realtorName].priceDrops += 1;
      }
    });

    // Calculate all category scores
    const categories = [];

    // 1. Volume Leaders
    const volumeScores = Object.entries(realtorData).map(([name, data]) => ({
      name,
      score: data.totalListings
    })).sort((a, b) => b.score - a.score);
    categories.push({ key: 'volume', name: 'Volume Leader', scores: volumeScores, icon: BarChart, color: 'blue' });

    // 2. Fastest Sellers
    const fastestScores = Object.entries(realtorData)
      .filter(([_, data]) => data.soldListings > 0)
      .map(([name, data]) => ({
        name,
        score: -data.totalDOMToSell / data.soldListings // Negative so lower DOM ranks higher
      })).sort((a, b) => b.score - a.score);
    categories.push({ key: 'fastest', name: 'Fastest Seller', scores: fastestScores, icon: Zap, color: 'green' });

    // 3. Up and Coming
    const upAndComingScores = Object.entries(realtorData)
      .filter(([_, data]) => {
        const days = data.firstListingDate ? Math.floor((Date.now() - data.firstListingDate) / (1000 * 60 * 60 * 24)) : 9999;
        return days <= 180 && data.recentListings > 0;
      })
      .map(([name, data]) => ({
        name,
        score: data.recentListings
      })).sort((a, b) => b.score - a.score);
    categories.push({ key: 'upandcoming', name: 'Up & Coming', scores: upAndComingScores, icon: TrendingUp, color: 'teal' });

    // 4. Price Leaders
    const priceScores = Object.entries(realtorData)
      .filter(([_, data]) => data.prices.length > 0)
      .map(([name, data]) => ({
        name,
        score: data.prices.reduce((a, b) => a + b, 0) / data.prices.length
      })).sort((a, b) => b.score - a.score);
    categories.push({ key: 'price', name: 'Price Leader', scores: priceScores, icon: DollarSign, color: 'orange' });

    // 5. Most Sold
    const soldScores = Object.entries(realtorData)
      .filter(([_, data]) => data.soldListings > 0)
      .map(([name, data]) => ({
        name,
        score: data.soldListings
      })).sort((a, b) => b.score - a.score);
    categories.push({ key: 'sold', name: 'Top Seller', scores: soldScores, icon: Award, color: 'purple' });

    // 6. Relist Champions
    const relistScores = Object.entries(realtorData)
      .filter(([_, data]) => data.relisted > 0)
      .map(([name, data]) => ({
        name,
        score: data.relisted
      })).sort((a, b) => b.score - a.score);
    categories.push({ key: 'relist', name: 'Relist Champ', scores: relistScores, icon: Calendar, color: 'purple' });

    // 7. Price Drop Pros
    const dropScores = Object.entries(realtorData)
      .filter(([_, data]) => data.priceDrops > 0)
      .map(([name, data]) => ({
        name,
        score: data.priceDrops
      })).sort((a, b) => b.score - a.score);
    categories.push({ key: 'drops', name: 'Price Drop Pro', scores: dropScores, icon: TrendingDown, color: 'orange' });

    // 8. Active Performers
    const activeScores = Object.entries(realtorData)
      .filter(([_, data]) => data.recentListings > 0)
      .map(([name, data]) => ({
        name,
        score: data.totalListings + data.recentListings * 2
      })).sort((a, b) => b.score - a.score);
    categories.push({ key: 'active', name: 'Active Performer', scores: activeScores, icon: Users, color: 'blue' });

    // 9. Shapeshifter
    const shapeshifterScores = Object.entries(realtorData)
      .filter(([_, data]) => data.relisted + data.priceDrops > 0)
      .map(([name, data]) => ({
        name,
        score: data.relisted + data.priceDrops
      })).sort((a, b) => b.score - a.score);
    categories.push({ key: 'shapeshifter', name: 'Shapeshifter', scores: shapeshifterScores, icon: Sparkles, color: 'purple' });

    // 10. Market Veterans
    const veteranScores = Object.entries(realtorData)
      .filter(([_, data]) => {
        const days = data.firstListingDate ? Math.floor((Date.now() - data.firstListingDate) / (1000 * 60 * 60 * 24)) : 0;
        return days > 180 && data.totalListings >= 5;
      })
      .map(([name, data]) => {
        const days = data.firstListingDate ? Math.floor((Date.now() - data.firstListingDate) / (1000 * 60 * 60 * 24)) : 0;
        return {
          name,
          score: days * 0.3 + data.totalListings
        };
      }).sort((a, b) => b.score - a.score);
    categories.push({ key: 'veteran', name: 'Market Veteran', scores: veteranScores, icon: Star, color: 'teal' });

    // 11. Ward Specialists
    const wardSpecialistScores = Object.entries(realtorData)
      .filter(([_, data]) => Object.keys(data.wards).length > 0)
      .map(([name, data]) => {
        // Find the ward with most listings
        const topWard = Object.entries(data.wards).sort((a, b) => b[1] - a[1])[0];
        const totalInWard = properties.filter(p => p.wards === topWard[0]).length;
        const marketShare = totalInWard > 0 ? (topWard[1] / totalInWard) * 100 : 0;
        
        return {
          name,
          score: marketShare,
          ward: topWard[0]
        };
      }).sort((a, b) => b.score - a.score);
    categories.push({ key: 'ward', name: 'Ward Specialist', scores: wardSpecialistScores, icon: MapPin, color: 'indigo' });

    // 12. Deal Finders (properties below ward average)
    const wardAverages = {};
    properties.forEach(prop => {
      const ward = prop.wards || 'Unknown';
      if (!wardAverages[ward]) {
        wardAverages[ward] = { total: 0, count: 0 };
      }
      if (prop.price) {
        wardAverages[ward].total += prop.price;
        wardAverages[ward].count += 1;
      }
    });
    Object.keys(wardAverages).forEach(ward => {
      wardAverages[ward].avg = wardAverages[ward].count > 0 
        ? wardAverages[ward].total / wardAverages[ward].count 
        : 0;
    });

    const dealFinderData = {};
    properties.forEach(prop => {
      const ward = prop.wards || 'Unknown';
      const avgPrice = wardAverages[ward]?.avg || 0;
      const realtorName = prop.realtors?.linkedItems?.[0]?.name || 'Unknown';
      
      if (avgPrice > 0 && prop.price && prop.price < avgPrice * 0.9) {
        if (!dealFinderData[realtorName]) {
          dealFinderData[realtorName] = 0;
        }
        dealFinderData[realtorName] += 1;
      }
    });

    const dealFinderScores = Object.entries(dealFinderData)
      .map(([name, count]) => ({ name, score: count }))
      .sort((a, b) => b.score - a.score);
    categories.push({ key: 'dealfinder', name: 'Deal Finder', scores: dealFinderScores, icon: Gem, color: 'emerald' });

    // 13. Consistent Performers (low std dev in monthly listings)
    const monthlyData = {};
    properties.forEach(prop => {
      if (!prop.column1stListingDate) return;
      const date = new Date(prop.column1stListingDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const realtorName = prop.realtors?.linkedItems?.[0]?.name || 'Unknown';
      
      if (!monthlyData[realtorName]) {
        monthlyData[realtorName] = {};
      }
      if (!monthlyData[realtorName][monthKey]) {
        monthlyData[realtorName][monthKey] = 0;
      }
      monthlyData[realtorName][monthKey] += 1;
    });

    const consistentScores = Object.entries(monthlyData)
      .map(([name, months]) => {
        const counts = Object.values(months);
        if (counts.length < 3) return null;
        
        const avg = counts.reduce((a, b) => a + b, 0) / counts.length;
        const variance = counts.reduce((sum, count) => sum + Math.pow(count - avg, 2), 0) / counts.length;
        const stdDev = Math.sqrt(variance);
        
        return { name, score: -stdDev }; // Negative so lower stdDev ranks higher
      })
      .filter(r => r !== null)
      .sort((a, b) => b.score - a.score);
    categories.push({ key: 'consistent', name: 'Consistent Performer', scores: consistentScores, icon: Activity, color: 'slate' });

    // 14. Hot Streak (activity in last 7 days)
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const hotStreakData = {};
    properties.forEach(prop => {
      const realtorName = prop.realtors?.linkedItems?.[0]?.name || 'Unknown';
      let activity = 0;
      
      if (prop.column1stListingDate) {
        const listDate = new Date(prop.column1stListingDate).getTime();
        if (listDate >= sevenDaysAgo) activity += 1;
      }
      if (prop.relistedDate) {
        const relistDate = new Date(prop.relistedDate).getTime();
        if (relistDate >= sevenDaysAgo) activity += 1;
      }
      if (prop.dateRemoved) {
        const removeDate = new Date(prop.dateRemoved).getTime();
        if (removeDate >= sevenDaysAgo) activity += 1;
      }
      
      if (activity > 0) {
        if (!hotStreakData[realtorName]) {
          hotStreakData[realtorName] = 0;
        }
        hotStreakData[realtorName] += activity;
      }
    });

    const hotStreakScores = Object.entries(hotStreakData)
      .map(([name, activity]) => ({ name, score: activity }))
      .sort((a, b) => b.score - a.score);
    categories.push({ key: 'hotstreak', name: 'Hot Streak', scores: hotStreakScores, icon: Flame, color: 'red' });

    // 15. Negotiation Indicators (avg price drop %)
    const negotiationData = {};
    properties.forEach(prop => {
      if (!prop.priceHistory || prop.priceHistory.length < 2) return;
      
      const realtorName = prop.realtors?.linkedItems?.[0]?.name || 'Unknown';
      const firstPrice = prop.priceHistory[0].price;
      const lastPrice = prop.priceHistory[prop.priceHistory.length - 1].price;
      
      if (firstPrice > 0) {
        const dropPercent = Math.abs(((lastPrice - firstPrice) / firstPrice) * 100);
        
        if (!negotiationData[realtorName]) {
          negotiationData[realtorName] = { total: 0, count: 0 };
        }
        negotiationData[realtorName].total += dropPercent;
        negotiationData[realtorName].count += 1;
      }
    });

    const negotiationScores = Object.entries(negotiationData)
      .map(([name, data]) => ({
        name,
        score: data.total / data.count
      }))
      .filter(r => r.score > 0)
      .sort((a, b) => b.score - a.score);
    categories.push({ key: 'negotiation', name: 'Negotiation Pro', scores: negotiationScores, icon: TrendingDown, color: 'gold' });

    // Calculate percentiles for each category
    categories.forEach(category => {
      const totalInCategory = category.scores.length;
      
      category.scores.forEach((item, index) => {
        const rank = index + 1;
        const percentile = totalInCategory > 0 ? Math.round((rank / totalInCategory) * 100) : 100;
        
        // Only add to rankings if in top 20%
        if (percentile <= 20) {
          if (!rankingsMap.has(item.name)) {
            rankingsMap.set(item.name, []);
          }
          
          // Determine badge text based on percentile
          let badgeText = '';
          let badgeColor = '';
          if (percentile <= 10) {
            badgeText = 'Top 10%';
            badgeColor = 'blue';
          } else if (percentile <= 15) {
            badgeText = 'Top 15%';
            badgeColor = 'teal';
          } else {
            badgeText = 'Top 20%';
            badgeColor = 'gray';
          }
          
          rankingsMap.get(item.name).push({
            category: category.name,
            percentile: percentile,
            badgeText: badgeText,
            value: item.ward || '', // Include ward for ward specialists
            icon: category.icon,
            color: badgeColor
          });
        }
      });
    });

    // Sort each realtor's badges by percentile (best first) and limit to top 5
    rankingsMap.forEach((badges, realtorName) => {
      badges.sort((a, b) => a.percentile - b.percentile);
      rankingsMap.set(realtorName, badges.slice(0, 5));
    });

    return rankingsMap;
  }, [properties]);
}
