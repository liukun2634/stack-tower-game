export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

// Seeded random for procedural generation (mulberry32)
export function seededRandom(seed) {
  let t = seed + 0x6D2B79F5;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

// Calculate horizontal overlap between two blocks
// Returns { overlapX, overlapWidth } or null if no overlap
export function calcOverlap(block, target) {
  const blockLeft = block.x;
  const blockRight = block.x + block.width;
  const targetLeft = target.x;
  const targetRight = target.x + target.width;

  const overlapLeft = Math.max(blockLeft, targetLeft);
  const overlapRight = Math.min(blockRight, targetRight);
  const overlapWidth = overlapRight - overlapLeft;

  if (overlapWidth < 12) return null;

  return { overlapX: overlapLeft, overlapWidth };
}
