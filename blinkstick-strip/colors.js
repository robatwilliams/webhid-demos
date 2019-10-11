export const OFF = [0, 0, 0];
export const WHITE = [255, 255, 255];

export const RAINBOW = [
  [148, 0, 211],
  [75, 0, 130],
  [0, 0, 255],
  [0, 255, 0],
  [255, 255, 0],
  [255, 127, 0],
  [255, 0, 0],
];

export const [VIOLET, INDIGO, BLUE, GREEN, YELLOW, ORANGE, RED] = RAINBOW;

export function shade(color, factor) {
  return color.map(component => component * factor);
}
