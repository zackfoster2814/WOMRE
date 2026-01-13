# 🎡 Wheel of Name

A beautiful, feature-rich wheel spinner application built with Tauri, React, and Vite.

## Features

✅ **Custom Weights** - Set different probabilities for each item
✅ **Custom Sound Effects** - Upload your own sound when result is revealed
✅ **Save/Load Presets** - Export and import wheel configurations as JSON
✅ **Shuffle** - Randomize item order while keeping weights
✅ **Beautiful UI** - Modern dark theme with smooth animations
✅ **Bulk Add** - Add multiple items at once
✅ **Lightweight** - Desktop app only ~3-5MB (thanks to Tauri)

## Running the App

### Web Version (No Desktop Install)
```bash
npm run dev
```
Then open http://localhost:1420 in your browser

### Desktop Version (Tauri)
```bash
npm run tauri:dev
```

## Building

### Build for Desktop
```bash
npm run tauri:build
```

The built app will be in `src-tauri/target/release/bundle/`

## How to Use

1. **Add Items**: Type item name and weight, then click "Add"
   - Weight = probability (higher = more likely to win)
   - Use "Bulk add" to paste multiple items

2. **Custom Sound**: Click "Choose File" to upload your win sound
   - Supports MP3, WAV, OGG
   - Default sound plays if none uploaded

3. **Spin**: Click the big "SPIN!" button and wait for result

4. **Save Preset**: Enter preset name and click "Save" to export JSON

5. **Load Preset**: Click "Load Preset" to import saved configuration

6. **Shuffle**: Randomize item order (keeps weights unchanged)

## Tech Stack

- **Tauri** - Lightweight desktop framework
- **React** - UI framework
- **TypeScript** - Type safety
- **Vite** - Fast build tool
- **Tailwind CSS** - Styling
- **Canvas API** - Wheel animation
- **Web Audio API** - Sound effects

## License

MIT
