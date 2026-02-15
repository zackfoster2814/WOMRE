/**
 * Character Development Immediate Handlers
 *
 * Handlers cho các Char Dev effects.
 */

import { registerImmediateHandler } from '../registry';
import type { ImmediateHandlerContext, ImmediateHandlerResult } from '../types';
import type { StatName } from '../../types';

const STAT_NAMES: StatName[] = ['strength', 'speed', 'durability', 'iq', 'biq', 'ma'];

// ============================================================================
// CHAR DEV HANDLERS
// ============================================================================

/**
 * Last Standing - +2 all stats khi là người duy nhất còn sống trong House
 */
registerImmediateHandler(
  'last_standing_check',
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const { character, allCharacters } = ctx;

    // Need allCharacters to check house membership
    if (!allCharacters || allCharacters.length === 0) {
      return {
        skipDefault: true,
        description: 'Last Standing (không có dữ liệu players)',
      };
    }

    // Get character's active houses
    const myHouses: string[] = [];
    for (const h of character.nestedHouses || []) {
      if (!h.isLost || h.lostType === 'kinda_homeless') {
        myHouses.push(h.name);
      }
    }
    // Fallback to regular houses
    for (const h of character.houses || []) {
      if (!h.isLost && !myHouses.includes(h.name)) {
        myHouses.push(h.name);
      }
    }

    if (myHouses.length === 0) {
      return {
        skipDefault: true,
        description: 'Last Standing (không có House)',
      };
    }

    // Check if character is the only alive member in ANY of their houses
    let isLastStanding = false;

    for (const houseName of myHouses) {
      // Count alive members in this house (excluding self)
      const otherAliveMembers = allCharacters.filter((other) => {
        if (other.no === character.no) return false;
        if (other.tournament?.status !== 'alive') return false;

        // Check if other character is in the same house
        const otherHouses: string[] = [];
        for (const h of other.nestedHouses || []) {
          if (!h.isLost || h.lostType === 'kinda_homeless') {
            otherHouses.push(h.name);
          }
        }
        for (const h of other.houses || []) {
          if (!h.isLost && !otherHouses.includes(h.name)) {
            otherHouses.push(h.name);
          }
        }

        return otherHouses.includes(houseName);
      });

      if (otherAliveMembers.length === 0) {
        isLastStanding = true;
        break;
      }
    }

    if (!isLastStanding) {
      return {
        skipDefault: true,
        description: 'Last Standing (chưa kích hoạt - còn đồng đội trong House)',
      };
    }

    // Apply +2 all stats
    const mods: ImmediateHandlerResult['statModifiers'] = [];
    for (const stat of STAT_NAMES) {
      mods.push({ stat, value: 2 });
    }

    return {
      statModifiers: mods,
      skipDefault: true,
      description: '+2 All Stats (Last Standing)',
    };
  },
  '+2 all stats when last alive member of House',
);

export function registerCharDevHandlers(): void {
  console.log('CharDev handlers registered');
}
