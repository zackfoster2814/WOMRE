/**
 * Script to auto-generate player-index.json from No*.txt files
 * Run with: node scripts/generate-player-index.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '..', 'public', 'data');
const OUTPUT_FILE = path.join(DATA_DIR, 'player-index.json');

function generatePlayerIndex() {
  console.log('Scanning for player files in:', DATA_DIR);

  // Read all files in data directory
  const files = fs.readdirSync(DATA_DIR);

  // Filter and extract player numbers from No*.txt files
  const playerNumbers = files
    .filter(file => /^No\d+\.txt$/i.test(file))
    .map(file => {
      const match = file.match(/^No(\d+)\.txt$/i);
      return match ? parseInt(match[1], 10) : null;
    })
    .filter(num => num !== null)
    .sort((a, b) => a - b);

  console.log(`Found ${playerNumbers.length} player files`);

  // Generate JSON
  const indexData = {
    players: playerNumbers
  };

  // Write to file
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(indexData, null, 2) + '\n');

  console.log(`Generated ${OUTPUT_FILE}`);
  console.log(`Player range: ${playerNumbers[0]} - ${playerNumbers[playerNumbers.length - 1]}`);
}

generatePlayerIndex();
