
const DB_NAME = 'RealEstateCache';
const DB_VERSION = 1;
const STORE_NAME = 'properties';
const CACHE_KEY = 'main_cache';
export const CACHE_VERSION = '1.0';

export const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('IndexedDB error:', event.target.error);
      reject(event.target.error);
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        // Create object store without keyPath since we use a fixed key
        db.createObjectStore(STORE_NAME);
      }
    };
  });
};

export const getCachedProperties = async () => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite'); // readwrite to allow clearing if needed
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(CACHE_KEY);

      request.onsuccess = () => {
        const result = request.result;
        
        // Check if cache exists
        if (!result) {
          resolve(null);
          return;
        }

        // Check version match
        if (result.version !== CACHE_VERSION) {
          console.warn(`⚠️ Cache version mismatch (Found: ${result.version}, Required: ${CACHE_VERSION}). Clearing cache.`);
          
          // Clear invalid cache
          const clearRequest = store.clear();
          clearRequest.onsuccess = () => {
            console.log('✓ Old cache cleared');
            resolve(null); // Return null to trigger fresh download
          };
          clearRequest.onerror = () => {
            console.error('Failed to clear old cache');
            resolve(null); // Return null anyway
          };
          return;
        }

        resolve(result);
      };

      request.onerror = () => {
        console.error('Error getting cached properties:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Failed to open DB for reading:', error);
    return null;
  }
};

export const setCachedProperties = async (payload) => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      // Enforce current version and preserve timestamp from Supabase
      // The timestamp in payload represents when the data was last refreshed
      const payloadWithVersion = {
        ...payload,
        version: CACHE_VERSION,
        // Ensure timestamp is preserved from Supabase (this is the "last refresh" time)
        timestamp: payload.timestamp || Date.now()
      };

      const request = store.put(payloadWithVersion, CACHE_KEY);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        console.error('Error setting cached properties:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Failed to open DB for writing:', error);
    throw error;
  }
};

export const isCacheValid = async () => {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(CACHE_KEY);

      request.onsuccess = () => {
        const result = request.result;
        
        if (!result) {
          resolve({ valid: false, reason: 'No cache found' });
          return;
        }

        if (result.version !== CACHE_VERSION) {
          resolve({ 
            valid: false, 
            reason: `Version mismatch (Found: ${result.version}, Required: ${CACHE_VERSION})` 
          });
          return;
        }

        resolve({ valid: true, reason: 'Cache is valid' });
      };

      request.onerror = () => {
        resolve({ valid: false, reason: 'Error reading cache' });
      };
    });
  } catch (error) {
    return { valid: false, reason: 'Database error' };
  }
};

export const clearCache = async () => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        console.error('Error clearing cache:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Failed to open DB for clearing:', error);
    throw error;
  }
};
