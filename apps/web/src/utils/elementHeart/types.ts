export type ElementId = 'astral';

export type GridCoord = { row: number; col: number };

export type ElementShape = GridCoord[];

export type ShapeTemplateId =
  | 'astral-cube-1'
  | 'astral-arch'
  | 'astral-hook'
  | 'astral-block';

export type ShapeTemplate = {
  id: ShapeTemplateId;
  elementId: ElementId;
  label: string;
  /** Rotations uniques (cellules relatives, ancre coin haut-gauche normalisé) */
  rotations: ElementShape[];
};

export type InventoryPiece = {
  id: string;
  templateId: ShapeTemplateId;
  shapeIndex: number;
};

export type PlacedPiece = {
  id: string;
  inventoryPieceId: string;
  templateId: ShapeTemplateId;
  anchor: GridCoord;
  shapeIndex: number;
};

export type ActiveElementTally = Partial<Record<ElementId, number>>;
