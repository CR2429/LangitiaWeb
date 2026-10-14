import type {
  ActiveElementTally,
  ElementId,
  ElementShape,
  GridCoord,
  InventoryPiece,
  PlacedPiece,
  ShapeTemplate,
  ShapeTemplateId,
} from './types';

function rotateShape(shape: ElementShape): ElementShape {
  return shape.map(({ row, col }) => ({ row: col, col: -row }));
}

function normalizeShape(shape: ElementShape): ElementShape {
  const minRow = Math.min(...shape.map(c => c.row));
  const minCol = Math.min(...shape.map(c => c.col));
  return shape.map(({ row, col }) => ({ row: row - minRow, col: col - minCol }));
}

function allRotations(base: ElementShape): ElementShape[] {
  const seen = new Set<string>();
  const result: ElementShape[] = [];
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

/** x = vide, o = cellule pleine */
function parseAsciiShape(rows: string[]): ElementShape {
  const cells: GridCoord[] = [];
  for (let r = 0; r < rows.length; r++) {
    for (let c = 0; c < rows[r].length; c++) {
      if (rows[r][c] === 'o') cells.push({ row: r, col: c });
    }
  }
  return normalizeShape(cells);
}

export const ELEMENT_META: Record<ElementId, { name: string; color: string; glow: string }> = {
  astral: { name: 'Astral', color: '#c4a0ff', glow: '#9b59ff' },
};

const SHAPE_DEFS: Array<{ id: ShapeTemplateId; elementId: ElementId; label: string; ascii: string[] }> = [
  { id: 'astral-cube-1', elementId: 'astral', label: 'Cube', ascii: ['o'] },
  { id: 'astral-arch', elementId: 'astral', label: 'Arc', ascii: ['xox', 'ooo'] },
  { id: 'astral-hook', elementId: 'astral', label: 'Crochet', ascii: ['oxx', 'ooo'] },
  { id: 'astral-block', elementId: 'astral', label: 'Bloc', ascii: ['oxxx', 'oooo', 'xxxo'] },
];

export const SHAPE_TEMPLATES: Record<ShapeTemplateId, ShapeTemplate> = Object.fromEntries(
  SHAPE_DEFS.map(def => [
    def.id,
    {
      id: def.id,
      elementId: def.elementId,
      label: def.label,
      rotations: allRotations(parseAsciiShape(def.ascii)),
    } satisfies ShapeTemplate,
  ])
) as Record<ShapeTemplateId, ShapeTemplate>;

/** Pièces séparées en démo — même forme = entrées distinctes */
export function createDefaultInventory(): InventoryPiece[] {
  const specs: Array<{ templateId: ShapeTemplateId; shapeIndex: number }> = [
    { templateId: 'astral-cube-1', shapeIndex: 0 },
    { templateId: 'astral-cube-1', shapeIndex: 0 },
    { templateId: 'astral-arch', shapeIndex: 0 },
    { templateId: 'astral-hook', shapeIndex: 0 },
    { templateId: 'astral-block', shapeIndex: 0 },
  ];
  return specs.map(spec => ({ id: crypto.randomUUID(), ...spec }));
}

export const DEFAULT_CORRUPTED: GridCoord[] = [
  { row: 0, col: 0 },
  { row: 4, col: 4 },
  { row: 2, col: 2 },
];

export const GRID_SIZE = 5;

/** Centre de masse de la forme (coordonnées relatives à l'ancre) */
export function getShapeCentroid(
  templateId: ShapeTemplateId,
  shapeIndex: number
): GridCoord {
  const template = SHAPE_TEMPLATES[templateId];
  const shape = template.rotations[shapeIndex] ?? template.rotations[0];
  const n = shape.length;
  const row = shape.reduce((s, c) => s + c.row, 0) / n;
  const col = shape.reduce((s, c) => s + c.col, 0) / n;
  return { row, col };
}

/** Ancre pour que le centre de la pièce soit sous le curseur */
export function anchorFromHover(
  hover: GridCoord,
  templateId: ShapeTemplateId,
  shapeIndex: number
): GridCoord {
  const c = getShapeCentroid(templateId, shapeIndex);
  return {
    row: Math.round(hover.row - c.row),
    col: Math.round(hover.col - c.col),
  };
}

export function getPieceCells(
  templateId: ShapeTemplateId,
  shapeIndex: number,
  anchor: GridCoord
): GridCoord[] {
  const template = SHAPE_TEMPLATES[templateId];
  const shape = template.rotations[shapeIndex] ?? template.rotations[0];
  return shape.map(({ row, col }) => ({
    row: anchor.row + row,
    col: anchor.col + col,
  }));
}

export function getPiecePower(templateId: ShapeTemplateId, shapeIndex: number): number {
  const template = SHAPE_TEMPLATES[templateId];
  const shape = template.rotations[shapeIndex] ?? template.rotations[0];
  return shape.length;
}

export function isInBounds(row: number, col: number, gridSize: number): boolean {
  return row >= 0 && row < gridSize && col >= 0 && col < gridSize;
}

export function coordKey(c: GridCoord): string {
  return `${c.row},${c.col}`;
}

export function pieceTouchesCorruption(
  piece: Pick<PlacedPiece, 'templateId' | 'shapeIndex' | 'anchor'>,
  corrupted: Set<string>
): boolean {
  return getPieceCells(piece.templateId, piece.shapeIndex, piece.anchor).some(cell =>
    corrupted.has(coordKey(cell))
  );
}

export function computeActiveTally(
  placed: PlacedPiece[],
  corrupted: Set<string>
): ActiveElementTally {
  const tally: ActiveElementTally = {};

  for (const piece of placed) {
    if (pieceTouchesCorruption(piece, corrupted)) continue;

    const elementId = SHAPE_TEMPLATES[piece.templateId].elementId;
    const power = getPiecePower(piece.templateId, piece.shapeIndex);
    tally[elementId] = (tally[elementId] ?? 0) + power;
  }

  return tally;
}

export function canPlacePiece(
  templateId: ShapeTemplateId,
  shapeIndex: number,
  anchor: GridCoord,
  placed: PlacedPiece[],
  gridSize: number
): boolean {
  const cells = getPieceCells(templateId, shapeIndex, anchor);
  if (cells.length === 0) return false;

  const occupied = new Set<string>();
  for (const p of placed) {
    for (const cell of getPieceCells(p.templateId, p.shapeIndex, p.anchor)) {
      occupied.add(coordKey(cell));
    }
  }

  for (const cell of cells) {
    if (!isInBounds(cell.row, cell.col, gridSize)) return false;
    if (occupied.has(coordKey(cell))) return false;
  }
  return true;
}
