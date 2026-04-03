// ============================================================================
// DataManager — centralized data fetching with module-level cache
// ============================================================================
// Usage: import { DataManager } from '../managers/DataManager';
// const teams = await DataManager.getTeams();
// ============================================================================

import { getAssetPath } from '../utils/basePath';
import type { TeamJson } from '../types/battleZone';

// Module-level cache: Promise reuse so concurrent callers share the same fetch
let teamsPromise: Promise<TeamJson[]> | null = null;

export const DataManager = {
  /**
   * Fetch teams.json once and cache indefinitely for the page session.
   * Pass `force: true` to bypass cache (e.g. after a refresh action).
   */
  async getTeams(opts: { force?: boolean } = {}): Promise<TeamJson[]> {
    if (opts.force) teamsPromise = null;
    if (!teamsPromise) {
      teamsPromise = fetch(getAssetPath('/data/battles/teams.json'))
        .then((res) => {
          if (!res.ok) throw new Error(`Failed to fetch teams.json: ${res.status}`);
          return res.json();
        })
        .then((data) => data.teams ?? [])
        .catch((err) => {
          teamsPromise = null; // allow retry on next call
          throw err;
        });
    }
    return teamsPromise;
  },
};
