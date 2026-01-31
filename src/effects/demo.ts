/**
 * Effect System Demo
 *
 * Demo và test effect system với character thực tế
 */

import { initializeEffectData } from './data';
import { EffectResolver, STAT_NAMES } from './resolver';
import { EffectRegistry } from './registry';
import type { Character } from '../types/character';
import type { CharacterEffects } from './types';

/**
 * Tính toán và hiển thị effects của một character
 */
export function analyzeCharacterEffects(character: Character): CharacterEffects {
  // Đảm bảo data đã được khởi tạo
  initializeEffectData();

  // Tính toán effects
  const effects = EffectResolver.calculateCharacterEffects(character);

  return effects;
}

/**
 * Format kết quả để hiển thị
 */
export function formatEffectAnalysis(character: Character, effects: CharacterEffects): string {
  const lines: string[] = [];

  lines.push(`╔════════════════════════════════════════════════════════════╗`);
  lines.push(`║  EFFECT ANALYSIS: ${character.name.padEnd(39)}║`);
  lines.push(`╠════════════════════════════════════════════════════════════╣`);

  // Base Stats
  lines.push(`║ BASE STATS (từ file):                                      ║`);
  lines.push(`║   STR: ${character.stats.str.toString().padEnd(3)} SPD: ${character.stats.spd.toString().padEnd(3)} DUR: ${character.stats.dur.toString().padEnd(3)} IQ: ${character.stats.iq.toString().padEnd(3)} BIQ: ${character.stats.biq.toString().padEnd(3)} MA: ${character.stats.ma.toString().padEnd(3)}  ║`);

  lines.push(`╠════════════════════════════════════════════════════════════╣`);

  // Stat Modifiers
  lines.push(`║ STAT MODIFIERS (Immediate/Passive):                        ║`);
  if (effects.statModifiers.length === 0) {
    lines.push(`║   (không có)                                               ║`);
  } else {
    // Group by source
    const bySource = new Map<string, typeof effects.statModifiers>();
    for (const mod of effects.statModifiers) {
      if (!bySource.has(mod.source)) {
        bySource.set(mod.source, []);
      }
      bySource.get(mod.source)!.push(mod);
    }

    for (const [source, mods] of bySource) {
      const modStrings = mods.map(m => {
        const sign = m.value >= 0 ? '+' : '';
        const base = m.isBase ? ' Base' : '';
        return `${sign}${m.value}${base} ${m.stat.substring(0, 3).toUpperCase()}`;
      });
      const modLine = modStrings.join(', ');
      lines.push(`║   ${source.padEnd(20)} ${modLine.padEnd(35)}║`);
    }
  }

  lines.push(`╠════════════════════════════════════════════════════════════╣`);

  // Total Stats
  lines.push(`║ TOTAL STATS (sau immediate effects):                       ║`);
  lines.push(`║   STR: ${effects.totalStats.strength.toString().padEnd(3)} SPD: ${effects.totalStats.speed.toString().padEnd(3)} DUR: ${effects.totalStats.durability.toString().padEnd(3)} IQ: ${effects.totalStats.iq.toString().padEnd(3)} BIQ: ${effects.totalStats.biq.toString().padEnd(3)} MA: ${effects.totalStats.ma.toString().padEnd(3)}  ║`);

  // Bonus breakdown
  lines.push(`║ ─────────────────────────────────────────────────────────  ║`);
  lines.push(`║ Bonus Stats:                                               ║`);
  const bonusLine = STAT_NAMES.map(s => {
    const bonus = effects.bonusStats[s];
    const sign = bonus >= 0 ? '+' : '';
    return `${s.substring(0, 3).toUpperCase()}:${sign}${bonus}`;
  }).join(' ');
  lines.push(`║   ${bonusLine.padEnd(55)}║`);

  lines.push(`╠════════════════════════════════════════════════════════════╣`);

  // Immunities
  lines.push(`║ IMMUNITIES:                                                ║`);
  if (effects.immunities.length === 0) {
    lines.push(`║   (không có)                                               ║`);
  } else {
    lines.push(`║   ${effects.immunities.join(', ').padEnd(55)}║`);
  }

  lines.push(`╠════════════════════════════════════════════════════════════╣`);

  // Combat Effects (pending)
  lines.push(`║ COMBAT EFFECTS (sẽ kích hoạt trong combat):                ║`);
  const combatCount = effects.combatEffects.length;
  if (combatCount === 0) {
    lines.push(`║   (không có)                                               ║`);
  } else {
    lines.push(`║   Tổng: ${combatCount.toString()} effects                                          ║`);

    // Group by timing
    const byTiming = new Map<string, number>();
    for (const re of effects.combatEffects) {
      const timing = re.effect.timing || 'immediate';
      byTiming.set(timing, (byTiming.get(timing) || 0) + 1);
    }

    for (const [timing, count] of byTiming) {
      lines.push(`║     - ${timing.padEnd(25)} (${count.toString()})                      ║`);
    }
  }

  lines.push(`╚════════════════════════════════════════════════════════════╝`);

  return lines.join('\n');
}

/**
 * Debug: Kiểm tra xem effect có được đăng ký không
 */
export function checkRegisteredEffects(character: Character): void {
  console.log('\n=== CHECKING REGISTERED EFFECTS ===\n');

  // Race
  if (character.race?.race) {
    const entry = EffectRegistry.get('race', character.race.race);
    console.log(`Race "${character.race.race}":`, entry ? `✓ (${entry.effects.length} effects)` : '✗ NOT FOUND');
  }

  // Sub-race
  if (character.race?.subRace) {
    const entry = EffectRegistry.get('sub_race', character.race.subRace);
    console.log(`Sub-race "${character.race.subRace}":`, entry ? `✓ (${entry.effects.length} effects)` : '✗ NOT FOUND');
  }

  // Archetypes
  for (const arch of character.archetypes || []) {
    const entry = EffectRegistry.get('archetype', arch);
    console.log(`Archetype "${arch}":`, entry ? `✓ (${entry.effects.length} effects)` : '✗ NOT FOUND');
  }

  // Quirks
  for (const quirk of character.quirks || []) {
    const entry = EffectRegistry.get('quirk', quirk.name);
    console.log(`Quirk "${quirk.name}":`, entry ? `✓ (${entry.effects.length} effects)` : '✗ NOT FOUND');
  }

  // Powers
  for (const power of character.powers || []) {
    const entry = EffectRegistry.get('power', power.name);
    console.log(`Power "${power.name}":`, entry ? `✓ (${entry.effects.length} effects)` : '✗ NOT FOUND');
  }

  // Weapons
  for (const weapon of character.weapons || []) {
    const entry = EffectRegistry.get('weapon', weapon.name);
    console.log(`Weapon "${weapon.name}":`, entry ? `✓ (${entry.effects.length} effects)` : '✗ NOT FOUND');
  }

  // Houses
  for (const house of character.houses || []) {
    const entry = EffectRegistry.get('house', house.name);
    console.log(`House "${house.name}":`, entry ? `✓ (${entry.effects.length} effects)` : '✗ NOT FOUND');
  }

  // Runes
  for (const rune of character.runes?.runes || []) {
    const entry = EffectRegistry.get('rune', rune.name);
    console.log(`Rune "${rune.name}":`, entry ? `✓ (${entry.effects.length} effects)` : '✗ NOT FOUND');
  }

  // Runeword
  if (character.runes?.runeword) {
    const entry = EffectRegistry.get('runeword', character.runes.runeword);
    console.log(`Runeword "${character.runes.runeword}":`, entry ? `✓ (${entry.effects.length} effects)` : '✗ NOT FOUND');
  }

  console.log('\n');
}

/**
 * Test với character No.1
 */
export function testWithCharacterNo1(): void {
  // Mock character data cho No.1
  const characterNo1: Character = {
    no: 1,
    name: 'Đừng Nhờn với Two Fingers',
    username: 'unknown',
    isParasite: false,
    race: {
      race: 'Uma',
      subRace: 'Rice Shower + Agnes Tachyon'
    },
    archetypes: ['Egoist'],
    quirks: [{ name: 'Resilient' }],
    stats: {
      str: 6,
      spd: 10,
      dur: 3,
      iq: 5,
      biq: 6,
      ma: 5
    },
    houses: [{ name: 'Tracen Academy' }],
    gear: {
      normalGear: [],
      legacyGear: []
    },
    weapons: [{
      type: 'Unique',
      name: 'Battlefury',
      usable: true
    }],
    runes: {
      runes: [],
      runeword: undefined
    },
    powers: [{ name: 'U=ma2' }, { name: 'Baldening' }, { name: 'Memory Freeze' }, { name: 'Metamagic' }],
    charDevs: [{ name: 'Become Woke' }],
    team: 23
  };

  console.log('\n');
  console.log('='.repeat(60));
  console.log('  EFFECT SYSTEM TEST - CHARACTER No.1');
  console.log('='.repeat(60));

  // Check registered effects
  checkRegisteredEffects(characterNo1);

  // Analyze effects
  const effects = analyzeCharacterEffects(characterNo1);

  // Format and display
  console.log(formatEffectAnalysis(characterNo1, effects));

  // Detailed stat breakdown
  console.log('\n=== DETAILED STAT CALCULATION ===\n');
  console.log('Base Stats (từ file):');
  console.log(`  STR: ${characterNo1.stats.str}, SPD: ${characterNo1.stats.spd}, DUR: ${characterNo1.stats.dur}`);
  console.log(`  IQ: ${characterNo1.stats.iq}, BIQ: ${characterNo1.stats.biq}, MA: ${characterNo1.stats.ma}`);

  console.log('\nApplied Modifiers:');
  for (const mod of effects.statModifiers) {
    const sign = mod.value >= 0 ? '+' : '';
    console.log(`  ${mod.source}: ${sign}${mod.value} ${mod.stat}${mod.isBase ? ' (Base)' : ''}`);
  }

  console.log('\nFinal Total Stats:');
  console.log(`  STR: ${effects.totalStats.strength}, SPD: ${effects.totalStats.speed}, DUR: ${effects.totalStats.durability}`);
  console.log(`  IQ: ${effects.totalStats.iq}, BIQ: ${effects.totalStats.biq}, MA: ${effects.totalStats.ma}`);
}

// Run test if this file is executed directly (for Node.js/ts-node)
if (typeof require !== 'undefined' && require.main === module) {
  testWithCharacterNo1();
}
