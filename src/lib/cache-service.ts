import NodeCache from 'node-cache';

// Default TTL (time to live) settings in seconds
const DEFAULT_TTL = 60 * 5; // 5 minutes
const SHORT_TTL = 60; // 1 minute
const LONG_TTL = 60 * 60; // 1 hour

// Create cache instance with standard settings
const cache = new NodeCache({
  stdTTL: DEFAULT_TTL,
  checkperiod: 120, // Check for expired keys every 2 minutes
  useClones: false, // For better performance with large objects
  deleteOnExpire: true,
  maxKeys: 1000, // Prevent memory issues by limiting max keys
});

// Cache namespace prefixes
const CACHE_PREFIXES = {
  USER: 'user:',
  POLICY: 'policy:',
  CLAIM: 'claim:',
  DOCUMENT: 'document:',
  SEARCH: 'search:',
  LIST: 'list:',
};

/**
 * Get a cached item by key
 */
export function getCache<T>(key: string): T | undefined {
  return cache.get<T>(key);
}

/**
 * Set a cached item
 */
export function setCache<T>(key: string, value: T, ttl: number = DEFAULT_TTL): boolean {
  return cache.set(key, value, ttl);
}

/**
 * Delete a cached item
 */
export function deleteCache(key: string): boolean {
  return cache.del(key) > 0;
}

/**
 * Invalidate cache for a specific prefix
 */
export function invalidateCache(prefix: string): void {
  const keys = cache.keys();
  const keysToDelete = keys.filter(key => key.startsWith(prefix));
  
  // Delete keys one by one instead of passing an array
  // NodeCache's del method behaves differently with arrays vs single keys
  keysToDelete.forEach(key => {
    cache.del(key);
  });
}

/**
 * Clear all cache
 */
export function clearCache(): void {
  cache.flushAll();
}

/**
 * Get or set cache with an async function
 * If the value is in cache, returns it
 * If not, executes the function and caches the result
 */
export async function getCachedData<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl: number = DEFAULT_TTL
): Promise<T> {
  const cachedValue = getCache<T>(key);
  
  if (cachedValue !== undefined) {
    return cachedValue;
  }
  
  const data = await fetchFn();
  setCache(key, data, ttl);
  return data;
}

/**
 * Cache keys for specific data types
 */
export const cacheKeys = {
  user: (userId: string) => `${CACHE_PREFIXES.USER}${userId}`,
  userPolicies: (userId: string) => `${CACHE_PREFIXES.LIST}${CACHE_PREFIXES.USER}${userId}:policies`,
  userClaims: (userId: string) => `${CACHE_PREFIXES.LIST}${CACHE_PREFIXES.USER}${userId}:claims`,
  userDocuments: (userId: string) => `${CACHE_PREFIXES.LIST}${CACHE_PREFIXES.USER}${userId}:documents`,
  
  policy: (policyId: string) => `${CACHE_PREFIXES.POLICY}${policyId}`,
  policyList: (filters = '') => `${CACHE_PREFIXES.LIST}policies:${filters}`,
  
  claim: (claimId: string) => `${CACHE_PREFIXES.CLAIM}${claimId}`,
  claimList: (filters = '') => `${CACHE_PREFIXES.LIST}claims:${filters}`,
  
  document: (documentId: string) => `${CACHE_PREFIXES.DOCUMENT}${documentId}`,
  documentList: (filters = '') => `${CACHE_PREFIXES.LIST}documents:${filters}`,
  
  search: (query: string, types = '') => `${CACHE_PREFIXES.SEARCH}${query}:${types}`,
};

// Export TTL constants for use in other services
export const TTL = {
  DEFAULT: DEFAULT_TTL,
  SHORT: SHORT_TTL,
  LONG: LONG_TTL,
};

export default cache; 