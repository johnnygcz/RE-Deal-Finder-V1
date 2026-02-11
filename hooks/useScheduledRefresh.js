import { useState, useEffect, useRef } from 'react';

/**
 * Hook for managing scheduled data refreshes with timezone awareness
 * 
 * Schedules:
 * 1. Supabase Cache: 10 AM & 2 PM UK time (GMT/BST)
 * 2. API Refresh: Every 15 min from 6 AM - 9 PM Canada Eastern (EST/EDT)
 */
export function useScheduledRefresh() {
  const [nextRefreshTime, setNextRefreshTime] = useState(null);
  const [scheduleStatus, setScheduleStatus] = useState('Inactive');
  const [shouldRefresh, setShouldRefresh] = useState(false);
  
  const lastSupabaseRefreshRef = useRef(null);
  const lastApiRefreshRef = useRef(null);
  
  // Load last refresh times from localStorage on mount
  useEffect(() => {
    const storedSupabase = localStorage.getItem('last_supabase_refresh');
    const storedApi = localStorage.getItem('last_api_refresh');
    
    if (storedSupabase) lastSupabaseRefreshRef.current = parseInt(storedSupabase, 10);
    if (storedApi) lastApiRefreshRef.current = parseInt(storedApi, 10);
  }, []);
  
  // Check if it's time for Supabase cache update (10 AM & 2 PM UK time)
  const checkSupabaseSchedule = (now) => {
    const ukTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/London' }));
    const ukHour = ukTime.getHours();
    const ukMinute = ukTime.getMinutes();
    
    // Target hours: 10 AM (10:00) and 2 PM (14:00)
    const isTargetHour = ukHour === 10 || ukHour === 14;
    const isFirstMinute = ukMinute === 0;
    
    if (isTargetHour && isFirstMinute) {
      // Check cooldown: only refresh if last refresh was more than 3 hours ago
      const lastRefresh = lastSupabaseRefreshRef.current;
      if (!lastRefresh || (now.getTime() - lastRefresh) > (3 * 60 * 60 * 1000)) {
        console.log(`✅ Supabase schedule matched: ${ukHour}:00 UK time`);
        return true;
      }
    }
    return false;
  };
  
  // Check if it's time for API refresh (every 15 min during 6 AM - 9 PM EST)
  const checkApiSchedule = (now) => {
    const canadaTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Toronto' }));
    const canadaHour = canadaTime.getHours();
    const canadaMinute = canadaTime.getMinutes();
    
    // Only during business hours: 6 AM - 9 PM
    if (canadaHour < 6 || canadaHour >= 21) {
      return false;
    }
    
    // Check if we're at a 15-minute boundary (0, 15, 30, 45)
    const is15MinBoundary = canadaMinute % 15 === 0;
    
    if (is15MinBoundary) {
      // Check cooldown: only refresh if last refresh was more than 12 minutes ago
      const lastRefresh = lastApiRefreshRef.current;
      if (!lastRefresh || (now.getTime() - lastRefresh) > (12 * 60 * 1000)) {
        console.log(`✅ API schedule matched: ${canadaHour}:${canadaMinute.toString().padStart(2, '0')} ET`);
        return true;
      }
    }
    return false;
  };
  
  // Calculate next scheduled refresh time
  const calculateNextRefresh = (now) => {
    const times = [];
    
    // Calculate next Supabase refresh (10 AM or 2 PM UK)
    const ukTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/London' }));
    const ukHour = ukTime.getHours();
    
    if (ukHour < 10) {
      // Next is 10 AM today
      const next = new Date(ukTime);
      next.setHours(10, 0, 0, 0);
      times.push(next.getTime());
    } else if (ukHour < 14) {
      // Next is 2 PM today
      const next = new Date(ukTime);
      next.setHours(14, 0, 0, 0);
      times.push(next.getTime());
    } else {
      // Next is 10 AM tomorrow
      const next = new Date(ukTime);
      next.setDate(next.getDate() + 1);
      next.setHours(10, 0, 0, 0);
      times.push(next.getTime());
    }
    
    // Calculate next API refresh (next 15-min boundary during business hours)
    const canadaTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Toronto' }));
    const canadaHour = canadaTime.getHours();
    const canadaMinute = canadaTime.getMinutes();
    
    if (canadaHour >= 6 && canadaHour < 21) {
      // We're in business hours - find next 15-min boundary
      const nextMinute = Math.ceil((canadaMinute + 1) / 15) * 15;
      const next = new Date(canadaTime);
      if (nextMinute >= 60) {
        next.setHours(canadaHour + 1, 0, 0, 0);
      } else {
        next.setMinutes(nextMinute, 0, 0);
      }
      times.push(next.getTime());
    } else if (canadaHour < 6) {
      // Before business hours - next is 6 AM today
      const next = new Date(canadaTime);
      next.setHours(6, 0, 0, 0);
      times.push(next.getTime());
    } else {
      // After business hours - next is 6 AM tomorrow
      const next = new Date(canadaTime);
      next.setDate(next.getDate() + 1);
      next.setHours(6, 0, 0, 0);
      times.push(next.getTime());
    }
    
    // Return the earliest next refresh
    return Math.min(...times);
  };
  
  // Determine current schedule status
  const updateScheduleStatus = (now) => {
    const canadaTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Toronto' }));
    const canadaHour = canadaTime.getHours();
    
    if (canadaHour >= 6 && canadaHour < 21) {
      setScheduleStatus('Active (API refresh every 15 min)');
    } else {
      setScheduleStatus('Inactive (Outside business hours)');
    }
  };
  
  // Check schedules every minute
  useEffect(() => {
    const checkSchedules = () => {
      const now = new Date();
      
      // Check if any schedule matches
      const supabaseMatch = checkSupabaseSchedule(now);
      const apiMatch = checkApiSchedule(now);
      
      if (supabaseMatch || apiMatch) {
        console.log('📅 Schedule trigger fired:', { supabaseMatch, apiMatch });
        setShouldRefresh(true);
      }
      
      // Update next refresh time
      const nextTime = calculateNextRefresh(now);
      setNextRefreshTime(nextTime);
      
      // Update schedule status
      updateScheduleStatus(now);
    };
    
    // Check immediately
    checkSchedules();
    
    // Check every minute
    const intervalId = setInterval(checkSchedules, 60000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  // Callback to mark refresh as complete
  const markRefreshComplete = (type = 'api') => {
    const now = Date.now();
    
    if (type === 'supabase' || type === 'api') {
      lastApiRefreshRef.current = now;
      localStorage.setItem('last_api_refresh', now.toString());
      console.log(`✅ Marked API refresh complete at ${new Date(now).toLocaleTimeString()}`);
    }
    
    // Reset trigger
    setShouldRefresh(false);
  };
  
  return {
    shouldRefresh,
    nextRefreshTime,
    scheduleStatus,
    markRefreshComplete,
    lastSupabaseRefresh: lastSupabaseRefreshRef.current,
    lastApiRefresh: lastApiRefreshRef.current
  };
}
