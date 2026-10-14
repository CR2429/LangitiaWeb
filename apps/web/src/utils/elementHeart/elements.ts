import type { ElementDefinition, GridCoord, PentominoShape } from './types';

/** Fait tourner une forme de 90° dans le sens horaire */
function rotateShape(shape: PentominoShape): PentominoShape {
  return shape.map(({ row, col }) => ({ row: col, col: -row }));
}

/** Normalise une forme pour que l'ancre soit en (0,0) */
function normalizeShape(shape: PentominoShape): PentominoShape {
  const minRow = Math.min(...shape.map(c => c.row));
  const minCol = Math.min(...shape.map(c => c.col));
  return shape.map(({ row, col }) => ({ row: row - minRow, col: col - minCol }));
}

/** Génère les 4 rotations uniques d'une forme de base */
function allRotations(base: PentominoShape): PentominoShape[] {
  const seen = new Set<string>();
  const result: PentominoShape[] = [];
  let current = base;

  for (let i = 0; i < 4; i++) {
    const normalized = normalizeShape(current);
    const key = normalized.map(c => `${c.row},${c.col}`).sort().join('|');
    if (!seen.has(key)) {
      seen.add(key);
      result.push(normalized);
    }
    current = rotateShape(current);
  }
  return result;
}

/** Cube Astral — cellule unique 1×1 */
const ASTRAL_CUBE_BASE: PentominoShape = [{ row: 0, col: 0 }];

export const ELEMENTS: Record<string, ElementDefinition> = {
  astral: {
    id: 'astral',
    name: 'Cube Astral',
    shapes: allRotations(ASTRAL_CUBE_BASE),
    color: '#c4a0ff',
    glow: '#9b59ff',
  },
};

/** Stock initial par élément (démo — plus tard : trouvé dans des dossiers) */
export const DEFAULT_INVENTORY: Record<string, number> = {
  astral: 2,
};

/** Cellules corrompues par défaut (démo) */
export const DEFAULT_CORRUPTED: GridCoord[] = [
  { row: 0, col: 0 },
  { row: 4, col: 4 },
  { row: 2, col: 2 },
];

export const GRID_SIZE = 5;

export function getShapeCells(
  elementId: string,
  shapeIndex: number,
  anchor: GridCoord
): GridCoord[] {
  const element = ELEMENTS[elementId];
  if (!element) return [];
  const shape = element.shapes[shapeIndex] ?? element.shapes[0];
  return shape.map(({ row, col }) => ({
    row: anchor.row + row,
    col: anchor.col + col,
  }));
}

export function isInBounds(row: number, col: number, gridSize: number): boolean {
  return row >= 0 && row < gridSize && col >= 0 && col < gridSize;
}

export function coordKey(c: GridCoord): string {
  return `${c.row},${c.col}`;
}
