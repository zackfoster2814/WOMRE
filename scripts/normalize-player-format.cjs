/**
 * Script to normalize player file format
 * Standardizes format for files No1.txt to No115.txt
 */

const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'public', 'data');

/**
 * Standard format template:
 *
 * No.X
 * Name: PlayerName (username)
 * ```
 * Ký Sinh:
 * +
 * ```
 * ```
 * Race: X
 * Sub-race: X
 * ```
 *
 * ```
 * Archetype:
 * + X
 * ```
 * ```
 * N Quirk:
 * + X
 * ```
 * ```
 * Str: X
 * Spd: X
 * Dur: X
 * IQ: X
 * BIQ: X
 * MA: X
 * ```
 *
 * ```
 * Houses:
 * + X
 * ```
 *
 * ```
 * N Gear:
 *  + N Normal gear:
 *   - X
 *  + N Legacy gear:
 *   - X
 * ```
 *
 * ```
 * N Normal/Unique Weapon
 * + X
 * ```
 *
 * ```
 * N Rune:
 * + X
 * Runeword: X
 * ```
 *
 * ```
 * N Power:
 * + X
 * ```
 *
 * ```
 * Char dev:
 * + X
 * ```
 *
 * ```
 * Team: X
 * ```
 *
 * ```
 * Lover:
 * + X
 * ```
 *
 * (Optional)
 * ```
 * PvP Reward:
 * - X
 * ```
 */

function parsePlayerFile(content) {
  const lines = content.split('\n');
  const data = {
    number: '',
    name: '',
    kysinh: [],
    race: '',
    subrace: '',
    archetypes: [],
    quirks: [],
    stats: { str: '', spd: '', dur: '', iq: '', biq: '', ma: '' },
    houses: [],
    houseEffects: [],
    normalGear: [],
    legacyGear: [],
    weaponType: 'Normal', // Normal or Unique
    weapons: [],
    runes: [],
    runeword: '',
    powers: [],
    chardev: [],
    team: '',
    lovers: [],
    pvpReward: []
  };

  let currentSection = '';
  let inCodeBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const originalLine = lines[i];

    // Parse No.X
    if (line.match(/^No\.?\s*\d+/i)) {
      data.number = line.match(/\d+/)[0];
      continue;
    }

    // Parse Name
    if (line.startsWith('Name:')) {
      data.name = line.substring(5).trim();
      continue;
    }

    // Track code blocks
    if (line === '```') {
      inCodeBlock = !inCodeBlock;
      if (!inCodeBlock) currentSection = '';
      continue;
    }

    // Detect sections
    if (line.startsWith('Ký Sinh')) {
      currentSection = 'kysinh';
      continue;
    }
    if (line.startsWith('Race:')) {
      currentSection = 'race';
      data.race = line.substring(5).trim();
      continue;
    }
    if (line.startsWith('Sub-race:')) {
      data.subrace = line.substring(9).trim();
      continue;
    }
    if (line.match(/^Archetype/i)) {
      currentSection = 'archetype';
      const match = line.match(/Archetype:\s*(.+)/i);
      if (match && match[1].trim()) {
        data.archetypes.push(match[1].trim());
      }
      continue;
    }
    if (line.match(/^\d*\s*Quirk/i)) {
      currentSection = 'quirk';
      continue;
    }
    if (line.startsWith('Str:') || line.startsWith('Str :')) {
      currentSection = 'stats';
      data.stats.str = extractStatValue(line);
      continue;
    }
    if (line.startsWith('Spd:') || line.startsWith('Spd :')) {
      data.stats.spd = extractStatValue(line);
      continue;
    }
    if (line.startsWith('Dur:') || line.startsWith('Dur :')) {
      data.stats.dur = extractStatValue(line);
      continue;
    }
    if (line.startsWith('IQ:') || line.startsWith('IQ :')) {
      data.stats.iq = extractStatValue(line);
      continue;
    }
    if (line.startsWith('BIQ:') || line.startsWith('BIQ :')) {
      data.stats.biq = extractStatValue(line);
      continue;
    }
    if (line.startsWith('MA:') || line.startsWith('MA :')) {
      data.stats.ma = extractStatValue(line);
      continue;
    }
    if (line.match(/^Houses/i)) {
      currentSection = 'houses';
      const match = line.match(/Houses:\s*(.+)/i);
      if (match && match[1].trim() && !match[1].trim().startsWith('+')) {
        data.houses.push(match[1].trim());
      }
      continue;
    }
    if (line.match(/^\d*\s*Gear/i)) {
      currentSection = 'gear';
      continue;
    }
    if (line.match(/\+\s*\d*\s*Normal gear/i)) {
      currentSection = 'normalgear';
      continue;
    }
    if (line.match(/\+\s*\d*\s*Legacy gear/i)) {
      currentSection = 'legacygear';
      continue;
    }
    if (line.match(/^\d*\s*(Normal|Unique)\s*Weapon/i)) {
      currentSection = 'weapon';
      if (line.toLowerCase().includes('unique')) {
        data.weaponType = 'Unique';
      }
      continue;
    }
    if (line.match(/^\d*\s*Rune/i)) {
      currentSection = 'rune';
      continue;
    }
    if (line.startsWith('Runeword:')) {
      data.runeword = line.substring(9).trim();
      continue;
    }
    if (line.match(/^\d*\s*Power/i)) {
      currentSection = 'power';
      continue;
    }
    if (line.match(/^Char\s*dev/i)) {
      currentSection = 'chardev';
      const match = line.match(/Char\s*dev:\s*(.+)/i);
      if (match && match[1].trim()) {
        data.chardev.push(match[1].trim());
      }
      continue;
    }
    if (line.match(/^Team/i)) {
      currentSection = 'team';
      const match = line.match(/Team:\s*(\d+)/i);
      if (match) data.team = match[1];
      continue;
    }
    if (line.match(/^Lover/i)) {
      currentSection = 'lover';
      continue;
    }
    if (line.match(/^PvP\s*Reward/i)) {
      currentSection = 'pvpreward';
      continue;
    }

    // Parse items within sections
    if (line.startsWith('+') || line.startsWith('-')) {
      const value = line.substring(1).trim();
      if (!value) continue;

      switch (currentSection) {
        case 'kysinh':
          data.kysinh.push(value);
          break;
        case 'archetype':
          data.archetypes.push(value);
          break;
        case 'quirk':
          data.quirks.push(value);
          break;
        case 'houses':
          data.houses.push(value);
          break;
        case 'normalgear':
          data.normalGear.push(value);
          break;
        case 'legacygear':
          data.legacyGear.push(value);
          break;
        case 'weapon':
          data.weapons.push(value);
          break;
        case 'rune':
          data.runes.push(value);
          break;
        case 'power':
          data.powers.push(value);
          break;
        case 'chardev':
          data.chardev.push(value);
          break;
        case 'lover':
          data.lovers.push(value);
          break;
        case 'pvpreward':
          data.pvpReward.push(value);
          break;
      }
    }

    // Parse house effects (=> lines)
    if (line.startsWith('=>') && currentSection === 'houses') {
      data.houseEffects.push(line);
    }
  }

  return data;
}

function extractStatValue(line) {
  // Extract stat value, keeping any notes in parentheses
  const match = line.match(/:\s*(.+)/);
  return match ? match[1].trim() : '';
}

function generateNormalizedFile(data) {
  const lines = [];

  // Header
  lines.push(`No.${data.number}`);
  lines.push(`Name: ${data.name}`);

  // Ký Sinh
  lines.push('```');
  lines.push('Ký Sinh:');
  if (data.kysinh.length > 0) {
    data.kysinh.forEach(k => lines.push(`+ ${k}`));
  } else {
    lines.push('+ ');
  }
  lines.push('```');

  // Race/Sub-race
  lines.push('```');
  lines.push(`Race: ${data.race || ''}`);
  lines.push(`Sub-race: ${data.subrace || ''}`);
  lines.push('```');
  lines.push('');

  // Archetype
  lines.push('```');
  lines.push('Archetype: ');
  if (data.archetypes.length > 0) {
    data.archetypes.forEach(a => lines.push(`+ ${a}`));
  } else {
    lines.push('+ ');
  }
  lines.push('```');

  // Quirks
  lines.push('``` ');
  lines.push(`${data.quirks.length || 0} Quirk:  `);
  if (data.quirks.length > 0) {
    data.quirks.forEach(q => lines.push(`+ ${q}`));
  } else {
    lines.push('+ ');
  }
  lines.push('```');

  // Stats
  lines.push('```');
  lines.push(`Str: ${data.stats.str || ''}`);
  lines.push(`Spd: ${data.stats.spd || ''}`);
  lines.push(`Dur: ${data.stats.dur || ''}`);
  lines.push(`IQ: ${data.stats.iq || ''}`);
  lines.push(`BIQ: ${data.stats.biq || ''}`);
  lines.push(`MA: ${data.stats.ma || ''}`);
  lines.push('```');
  lines.push('');

  // Houses
  lines.push('```');
  lines.push('Houses: ');
  if (data.houses.length > 0) {
    data.houses.forEach(h => lines.push(`+ ${h}`));
    data.houseEffects.forEach(e => lines.push(` ${e}`));
  } else {
    lines.push('+ ');
  }
  lines.push('```');
  lines.push('');

  // Gear
  const totalGear = data.normalGear.length + data.legacyGear.length;
  lines.push('```');
  lines.push(`${totalGear} Gear: `);
  lines.push(` + ${data.normalGear.length} Normal gear:`);
  if (data.normalGear.length > 0) {
    data.normalGear.forEach(g => lines.push(`  - ${g}`));
  } else {
    lines.push('  - ');
  }
  lines.push(` + ${data.legacyGear.length} Legacy gear:`);
  if (data.legacyGear.length > 0) {
    data.legacyGear.forEach(g => lines.push(`  - ${g}`));
  } else {
    lines.push('  - ');
  }
  lines.push('```');
  lines.push('');

  // Weapon
  lines.push('```');
  lines.push(`${data.weapons.length} ${data.weaponType} Weapon`);
  if (data.weapons.length > 0) {
    data.weapons.forEach(w => lines.push(`+ ${w}`));
  } else {
    lines.push('+ ');
  }
  lines.push('```');
  lines.push('');

  // Rune
  lines.push('``` ');
  lines.push(`${data.runes.length} Rune: `);
  if (data.runes.length > 0) {
    data.runes.forEach(r => lines.push(`+ ${r}`));
  } else {
    lines.push('+ ');
  }
  lines.push(`Runeword: ${data.runeword || 'Không'}`);
  lines.push('```');
  lines.push('');

  // Power
  lines.push('```');
  lines.push(`${data.powers.length} Power: `);
  if (data.powers.length > 0) {
    data.powers.forEach(p => lines.push(`+ ${p}`));
  } else {
    lines.push('+ ');
  }
  lines.push('```');
  lines.push('');

  // Char dev
  lines.push('```');
  lines.push('Char dev: ');
  if (data.chardev.length > 0) {
    data.chardev.forEach(c => lines.push(`+ ${c}`));
  } else {
    lines.push('+ ');
  }
  lines.push('```');
  lines.push('');

  // Team
  lines.push('```');
  lines.push(`Team: ${data.team || ''}`);
  lines.push('```');
  lines.push('');

  // Lover
  lines.push('```');
  lines.push('Lover:');
  if (data.lovers.length > 0) {
    data.lovers.forEach(l => lines.push(`+ ${l}`));
  } else {
    lines.push('+ ');
  }
  lines.push('```');

  // PvP Reward (optional)
  if (data.pvpReward.length > 0) {
    lines.push('');
    lines.push('```');
    lines.push('PvP Reward:');
    data.pvpReward.forEach(p => lines.push(`- ${p}`));
    lines.push('```');
  }

  return lines.join('\n');
}

function normalizeFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const data = parsePlayerFile(content);
    const normalized = generateNormalizedFile(data);
    return normalized;
  } catch (error) {
    console.error(`Error processing ${filePath}: ${error.message}`);
    return null;
  }
}

// Main execution
function main() {
  const startNum = 1;
  const endNum = 115;
  let processed = 0;
  let errors = 0;

  console.log(`Normalizing player files from No${startNum}.txt to No${endNum}.txt...`);
  console.log('');

  for (let i = startNum; i <= endNum; i++) {
    const filename = `No${i}.txt`;
    const filePath = path.join(dataDir, filename);

    if (!fs.existsSync(filePath)) {
      console.log(`[SKIP] ${filename} - File not found`);
      continue;
    }

    const normalized = normalizeFile(filePath);
    if (normalized) {
      fs.writeFileSync(filePath, normalized, 'utf-8');
      console.log(`[OK] ${filename}`);
      processed++;
    } else {
      console.log(`[ERROR] ${filename}`);
      errors++;
    }
  }

  console.log('');
  console.log(`Done! Processed: ${processed}, Errors: ${errors}`);
}

main();
