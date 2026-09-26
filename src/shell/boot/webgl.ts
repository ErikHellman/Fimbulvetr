/** Phaser 4 filters (tints, day-night) need WebGL; there is deliberately no Canvas fallback. */
export function hasWebGL(doc: Document = document): boolean {
  try {
    return doc.createElement('canvas').getContext('webgl') !== null;
  } catch {
    return false;
  }
}
