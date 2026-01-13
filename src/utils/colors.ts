// Convert HSL to Hex color
export const hslToHex = (h: number, s: number, l: number): string => {
  s /= 100;
  l /= 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;

  if (h >= 0 && h < 60) {
    r = c; g = x; b = 0;
  } else if (h >= 60 && h < 120) {
    r = x; g = c; b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0; g = c; b = x;
  } else if (h >= 180 && h < 240) {
    r = 0; g = x; b = c;
  } else if (h >= 240 && h < 300) {
    r = x; g = 0; b = c;
  } else if (h >= 300 && h < 360) {
    r = c; g = 0; b = x;
  }

  const toHex = (n: number) => {
    const hex = Math.round((n + m) * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

// Generate vibrant colors for wheel segments
export const generateColors = (count: number): string[] => {
  const colors: string[] = [];
  const saturation = 70;
  const lightness = 60;

  for (let i = 0; i < count; i++) {
    const hue = (i * 360) / count;
    colors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
  }

  return colors;
};

// Generate colors in hex format for color pickers
export const generateColorsHex = (count: number): string[] => {
  const colors: string[] = [];
  const saturation = 70;
  const lightness = 60;

  for (let i = 0; i < count; i++) {
    const hue = (i * 360) / count;
    colors.push(hslToHex(hue, saturation, lightness));
  }

  return colors;
};

export const getContrastColor = (hsl: string): string => {
  // Extract lightness from HSL string
  const match = hsl.match(/hsl\(\d+,\s*\d+%,\s*(\d+)%\)/);
  if (match) {
    const lightness = parseInt(match[1]);
    return lightness > 50 ? '#000000' : '#FFFFFF';
  }
  return '#FFFFFF';
};
