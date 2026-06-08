export type ElementId = 'astral';

export type CellState = 'empty' | 'corrupted';

export type GridCoord = { row: number; col: number };

/** Pentomino : 5 cellules relatives à l'ancre (0,0) */
export type PentominoShape = GridCoord[];

export type ElementDefinition = {
  id: ElementId;
  name: string;
  /** Formes possibles (rotations pré-calculées) */
  shapes: PentominoShape[];
  color: string;
  glow: string;
};

export type PlacedPiece = {
  id: string;
  elementId: ElementId;
  /** Ancre sur la grille 5×5 */
  anchor: GridCoord;
  /** Index dans element.shapes */
  shapeIndex: number;
};

export type ElementInventory = Record<ElementId, number>;

export type ElementHeartState = {
  gridSize: number;
  corrupted: GridCoord[];
  placed: PlacedPiece[];
  inventory: ElementInventory;
};
