/**
 * Supabase Client
 * Manages connection to Supabase database for property cache synchronization and offer tracking
 */

const SUPABASE_URL = 'https://yrbtuxzkfcdphyxrwidk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlyYnR1eHprZmNkcGh5eHJ3aWRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3OTA5OTksImV4cCI6MjA4NTM2Njk5OX0.QLoSoZ0MwfY6v4wyKdTvd8PKZedav_Xz7VyC_g19PbQ';

/**
 * Fetch user's offers from Supabase
 * @param {string} userId - The user's ID/username
 * @returns {Promise<Array|null>} - Array of offers or null if not found
 */
export async function fetchOffersFromSupabase(userId) {
  try {
    // Try to fetch with comprehensive error handling
    let response;
    try {
      response = await fetch(
        `${SUPABASE_URL}/rest/v1/user_offers?user_id=eq.${userId}&select=*&order=updated_at.desc&limit=1`,
        {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
    } catch (fetchError) {
      // Network error - return null gracefully
      return null;
    }
    
    if (!response.ok) {
      // HTTP error - return null silently
      return null;
    }
    
    const data = await response.json();
    
    if (!Array.isArray(data) || data.length === 0) {
      return null;
    }
    
    return data[0].offers || [];
  } catch (error) {
    // Any error - return null gracefully
    return null;
  }
}

/**
 * Save user's offers to Supabase
 * @param {string} userId - The user's ID/username
 * @param {Array} offers - Array of offer objects
 * @returns {Promise<boolean>} - Success status
 */
export async function saveOffersToSupabase(userId, offers) {
  try {
    console.log(`☁️ Saving ${offers.length} offers to Supabase for user: ${userId}...`);
    
    const currentTimestamp = new Date().toISOString();
    
    // Use UPSERT operation (single atomic insert-or-update)
    // This eliminates race conditions and 409 conflicts
    console.log('💾 Using UPSERT operation for reliable save...');
    const saveResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/user_offers`,
      {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates,return=minimal' // UPSERT on conflict
        },
        body: JSON.stringify({
          user_id: userId,
          offers: offers,
          updated_at: currentTimestamp
        })
      }
    );
    
    if (!saveResponse.ok) {
      const errorBody = await saveResponse.text();
      
      // Handle 404/406 gracefully - table doesn't exist yet
      if (saveResponse.status === 404 || saveResponse.status === 406) {
        console.error(`\n❌ Supabase user_offers table doesn't exist (${saveResponse.status})`);
        console.error('💡 ACTION REQUIRED: Create the user_offers table in Supabase');
        console.error('💡 Run this SQL in Supabase SQL Editor:\n');
        console.error(`CREATE TABLE IF NOT EXISTS user_offers (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  offers JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE user_offers ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (adjust as needed for production)
CREATE POLICY "Enable all operations for user_offers" ON user_offers
  FOR ALL USING (true);
`);
        return false;
      }
      
      // Handle 409 Conflict errors gracefully
      if (saveResponse.status === 409) {
        console.warn(`⚠️ Conflict detected (409) - retrying with PATCH...`);
        
        // Fallback to explicit UPDATE on conflict
        const patchResponse = await fetch(
          `${SUPABASE_URL}/rest/v1/user_offers?user_id=eq.${userId}`,
          {
            method: 'PATCH',
            headers: {
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              offers: offers,
              updated_at: currentTimestamp
            })
          }
        );
        
        if (!patchResponse.ok) {
          const patchError = await patchResponse.text();
          console.error(`❌ PATCH retry failed: ${patchResponse.status}`, patchError);
          return false;
        }
        
        console.log(`✅ Successfully saved offers via PATCH fallback`);
        return true;
      }
      
      console.error(`❌ Supabase offers save failed: ${saveResponse.status}`, errorBody);
      return false;
    }
    
    console.log(`✅ Successfully saved offers to Supabase`);
    return true;
  } catch (error) {
    console.error('❌ Supabase offers save error:', error);
    return false;
  }
}

/**
 * Check if Supabase record exists
 * @param {string} cacheKey - The cache key to check
 * @returns {Promise<boolean>} - True if record exists
 */
export async function checkSupabaseRecord(cacheKey) {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/property_cache?cache_key=eq.${cacheKey}&select=id`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (!response.ok) {
      console.error(`❌ Supabase check failed: ${response.status} ${response.statusText}`);
      return false;
    }
    
    const data = await response.json();
    return Array.isArray(data) && data.length > 0;
  } catch (error) {
    console.error('❌ Failed to check Supabase record:', error);
    return false;
  }
}

/**
 * Fetch property cache from Supabase
 * @param {string} cacheKey - The cache key
 * @returns {Promise<object|null>} - Cached data or null
 */
export async function fetchFromSupabase(cacheKey) {
  try {
    console.log(`📡 Fetching from Supabase (key: ${cacheKey})...`);
    
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/property_cache?cache_key=eq.${cacheKey}&order=created_at.desc&limit=1`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.status === 401) {
      console.error('❌ Supabase authentication failed (401 Unauthorized)');
      return null;
    }
    
    if (response.status === 404 || response.status === 406) {
      console.error(`❌ Supabase table not found (${response.status})`);
      return null;
    }
    
    if (!response.ok) {
      console.error(`❌ Supabase fetch failed: ${response.status} ${response.statusText}`);
      return null;
    }
    
    const data = await response.json();
    
    if (!Array.isArray(data) || data.length === 0) {
      console.log('ℹ️ No cache found in Supabase');
      return null;
    }
    
    const cached = data[0];
    console.log(`✅ Fetched cache from Supabase: ${cached.data?.length || 0} properties`);
    
    return cached.data;
  } catch (error) {
    console.error('❌ Supabase fetch error:', error);
    return null;
  }
}

/**
 * Save property analysis data to Supabase
 * @param {string} userId - The user's ID/username
 * @param {string} propertyId - The property ID
 * @param {object} analysisData - The analysis data to save
 * @returns {Promise<boolean>} - Success status
 */
export async function saveAnalysisToSupabase(userId, propertyId, analysisData) {
  try {
    const currentTimestamp = new Date().toISOString();
    
    // Use UPSERT operation (single atomic insert-or-update)
    let saveResponse;
    try {
      saveResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/property_analyses`,
        {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates,return=minimal' // UPSERT on conflict
          },
          body: JSON.stringify({
            user_id: userId,
            property_id: propertyId,
            analysis_data: analysisData,
            updated_at: currentTimestamp
          })
        }
      );
    } catch (fetchError) {
      // Network error - return false gracefully
      return false;
    }
    
    // Check save response
    if (!saveResponse.ok) {
      // Handle 409 Conflict with PATCH fallback
      if (saveResponse.status === 409) {
        try {
          const patchResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/property_analyses?user_id=eq.${userId}&property_id=eq.${propertyId}`,
            {
              method: 'PATCH',
              headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                analysis_data: analysisData,
                updated_at: currentTimestamp
              })
            }
          );
          
          return patchResponse.ok;
        } catch (patchError) {
          return false;
        }
      }
      
      // Other errors - return false silently
      return false;
    }
    
    return true;
  } catch (error) {
    // Any error - return false gracefully
    return false;
  }
}

/**
 * Fetch property analysis data from Supabase
 * @param {string} userId - The user's ID/username
 * @param {string} propertyId - The property ID
 * @returns {Promise<object|null>} - Analysis data or null if not found
 */
export async function fetchAnalysisFromSupabase(userId, propertyId) {
  // Outer try/catch to handle all errors
  try {
    // Add 10-second timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 10000);
    
    // Inner try/catch to handle ALL fetch errors (network failures, CORS, DNS, etc.)
    let response;
    try {
      response = await fetch(
        `${SUPABASE_URL}/rest/v1/property_analyses?user_id=eq.${userId}&property_id=eq.${propertyId}&select=*&order=updated_at.desc&limit=1`,
        {
          signal: controller.signal,
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
    } catch (fetchError) {
      clearTimeout(timeoutId);
      // ANY fetch error (network failure, CORS, DNS, etc.) - return null gracefully
      // This prevents noisy error logging when Supabase table doesn't exist
      return null;
    }
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      if (response.status === 404 || response.status === 406) {
        // Table doesn't exist yet - this is expected, return null silently
        return null;
      }
      // Other HTTP errors - return null
      return null;
    }
    
    const data = await response.json();
    
    if (!Array.isArray(data) || data.length === 0) {
      return null;
    }
    
    return data[0].analysis_data || null;
  } catch (error) {
    // Timeout or JSON parsing error - return null gracefully
    return null;
  }
}

/**
 * Save property cache to Supabase
 * @param {string} cacheKey - The cache key
 * @param {object} data - The data to save
 * @returns {Promise<boolean>} - Success status
 */
export async function saveToSupabase(cacheKey, data) {
  try {
    console.log(`☁️ Saving to Supabase (key: ${cacheKey}, items: ${data?.length || 0})...`);
    
    const recordExists = await checkSupabaseRecord(cacheKey);
    
    if (recordExists) {
      // UPDATE existing record
      console.log('📝 Updating existing Supabase record...');
      
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/property_cache?cache_key=eq.${cacheKey}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            data: data,
            updated_at: new Date().toISOString()
          })
        }
      );
      
      if (!response.ok) {
        console.error(`❌ Supabase update failed: ${response.status} ${response.statusText}`);
        return false;
      }
      
      console.log('✅ Successfully updated Supabase cache');
      return true;
    } else {
      // INSERT new record
      console.log('➕ Creating new Supabase record...');
      
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/property_cache`,
        {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            cache_key: cacheKey,
            data: data
          })
        }
      );
      
      if (!response.ok) {
        console.error(`❌ Supabase insert failed: ${response.status} ${response.statusText}`);
        return false;
      }
      
      console.log('✅ Successfully saved to Supabase cache');
      return true;
    }
  } catch (error) {
    console.error('❌ Supabase save error:', error);
    return false;
  }
}
