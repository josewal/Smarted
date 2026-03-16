const LEECH_THRESHOLD = 5;

export function isLeech(lapses: number, threshold = LEECH_THRESHOLD): boolean {
  return lapses >= threshold;
}
