/**
 * DataLoader Service
 * Centralized data loading with caching, error handling, and retry logic
 */

type FetcherFunction<T> = () => Promise<T>;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresIn?: number; // milliseconds
}

export class DataLoader {
  private cache = new Map<string, CacheEntry<any>>();
  private pendingRequests = new Map<string, Promise<any>>();

  /**
   * Load data with caching
   * @param key - Unique cache key
   * @param fetcher - Function that fetches the data
   * @param options - Cache options
   */
  async load<T>(
    key: string,
    fetcher: FetcherFunction<T>,
    options?: {
      ttl?: number; // Time to live in milliseconds
      forceRefresh?: boolean;
      retries?: number;
    }
  ): Promise<T> {
    const { ttl, forceRefresh = false, retries = 3 } = options || {};

    // Check cache first
    if (!forceRefresh) {
      const cached = this.getFromCache<T>(key);
      if (cached !== null) {
        console.log(`[DataLoader] Cache hit: ${key}`);
        return cached;
      }
    }

    // Check if request is already pending (prevent duplicate requests)
    if (this.pendingRequests.has(key)) {
      console.log(`[DataLoader] Request pending, reusing: ${key}`);
      return this.pendingRequests.get(key);
    }

    // Fetch with retry logic
    const requestPromise = this.fetchWithRetry(fetcher, retries, key);
    this.pendingRequests.set(key, requestPromise);

    try {
      const data = await requestPromise;

      // Store in cache
      this.setCache(key, data, ttl);

      return data;
    } catch (error) {
      console.error(`[DataLoader] Failed to load ${key}:`, error);
      throw error;
    } finally {
      this.pendingRequests.delete(key);
    }
  }

  /**
   * Fetch with automatic retry on failure
   */
  private async fetchWithRetry<T>(
    fetcher: FetcherFunction<T>,
    retries: number,
    key: string
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        console.log(`[DataLoader] Fetching ${key} (attempt ${attempt + 1}/${retries + 1})`);
        const data = await fetcher();
        return data;
      } catch (error) {
        lastError = error as Error;

        if (attempt < retries) {
          // Exponential backoff: 100ms, 200ms, 400ms...
          const delay = 100 * Math.pow(2, attempt);
          console.warn(`[DataLoader] Retry ${key} after ${delay}ms...`);
          await this.sleep(delay);
        }
      }
    }

    throw new Error(`Failed to fetch ${key} after ${retries + 1} attempts: ${lastError?.message}`);
  }

  /**
   * Get data from cache if valid
   */
  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) return null;

    // Check if expired
    if (entry.expiresIn) {
      const age = Date.now() - entry.timestamp;
      if (age > entry.expiresIn) {
        console.log(`[DataLoader] Cache expired: ${key}`);
        this.cache.delete(key);
        return null;
      }
    }

    return entry.data;
  }

  /**
   * Store data in cache
   */
  private setCache<T>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresIn: ttl
    });
    console.log(`[DataLoader] Cached: ${key}${ttl ? ` (TTL: ${ttl}ms)` : ''}`);
  }

  /**
   * Invalidate cache entry
   */
  invalidate(key: string): void {
    this.cache.delete(key);
    console.log(`[DataLoader] Invalidated cache: ${key}`);
  }

  /**
   * Clear all cache
   */
  clearAll(): void {
    this.cache.clear();
    console.log('[DataLoader] Cleared all cache');
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      totalEntries: this.cache.size,
      pendingRequests: this.pendingRequests.size,
      entries: Array.from(this.cache.keys())
    };
  }

  /**
   * Helper: sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance
export const dataLoader = new DataLoader();
