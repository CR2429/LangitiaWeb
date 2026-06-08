import { useCallback, useMemo, useState } from 'react';
import './ElementHeart.css';
import AstralCubeIcon from './AstralCubeIcon';
import {
  DEFAULT_CORRUPTED,
  DEFAULT_INVENTORY,
  ELEMENTS,
  GRID_SIZE,
  coordKey,
  getShapeCells,
  isInBounds,
} from '../../utils/elementHeart/elements';
import type { ElementId, GridCoord, PlacedPiece } from '../../utils/elementHeart/types';

function countPlaced(placed: PlacedPiece[], elementId: ElementId): number {
  return placed.filter(p => p.elementId === elementId).length;
}

function remainingInInventory(
  inventory: Record<string, number>,
  placed: PlacedPiece[],
  elementId: ElementId
): number {
  const total = inventory[elementId] ?? 0;
  return total - countPlaced(placed, elementId);
}

const ElementHeart = () => {
  const [inventory] = useState<Record<string, number>>(() => ({ ...DEFAULT_INVENTORY }));
  const [selectedElement, setSelectedElement] = useState<ElementId | null>('astral');
  const [shapeIndex] = useState(0);
  const [placed, setPlaced] = useState<PlacedPiece[]>([]);
  const [hoverCell, setHoverCell] = useState<GridCoord | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const astralRemaining = remainingInInventory(inventory, placed, 'astral');

  const corrupted = useMemo(
    () => new Set(DEFAULT_CORRUPTED.map(coordKey)),
    []
  );

  const occupiedCells = useMemo(() => {
    const set = new Set<string>();
    for (const piece of placed) {
      for (const cell of getShapeCells(piece.elementId, piece.shapeIndex, piece.anchor)) {
        set.add(coordKey(cell));
      }
    }
    return set;
  }, [placed]);

  const previewCells = useMemo(() => {
    if (!selectedElement || !hoverCell || remainingInInventory(inventory, placed, selectedElement) <= 0) {
      return new Set<string>();
    }
    const cells = getShapeCells(selectedElement, shapeIndex, hoverCell);
    return new Set(cells.map(coordKey));
  }, [selectedElement, shapeIndex, hoverCell, inventory, placed]);

  const canPlaceAt = useCallback(
    (anchor: GridCoord): boolean => {
      if (!selectedElement) return false;
      if (remainingInInventory(inventory, placed, selectedElement) <= 0) return false;

      const cells = getShapeCells(selectedElement, shapeIndex, anchor);
      if (cells.length === 0) return false;

      for (const cell of cells) {
        if (!isInBounds(cell.row, cell.col, GRID_SIZE)) return false;
        if (corrupted.has(coordKey(cell))) return false;
        if (occupiedCells.has(coordKey(cell))) return false;
      }
      return true;
    },
    [selectedElement, shapeIndex, corrupted, occupiedCells, inventory, placed]
  );

  const previewValid = hoverCell ? canPlaceAt(hoverCell) : false;

  const handleCellClick = (row: number, col: number) => {
    const anchor = { row, col };

    const existing = placed.find(p =>
      getShapeCells(p.elementId, p.shapeIndex, p.anchor).some(
        c => c.row === row && c.col === col
      )
    );
    if (existing) {
      setPlaced(prev => prev.filter(p => p.id !== existing.id));
      const name = ELEMENTS[existing.elementId].name;
      setMessage(`${name} retiré — retour à l'inventaire.`);
      return;
    }

    if (!selectedElement) {
      setMessage('Sélectionnez un élément dans l\'inventaire.');
      return;
    }

    if (remainingInInventory(inventory, placed, selectedElement) <= 0) {
      setMessage('Plus de cubes disponibles dans l\'inventaire.');
      return;
    }

    if (!canPlaceAt(anchor)) {
      setMessage('Placement impossible — zone corrompue, hors limites ou occupée.');
      return;
    }

    setPlaced(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        elementId: selectedElement,
        anchor,
        shapeIndex,
      },
    ]);
    const left = remainingInInventory(inventory, placed, selectedElement) - 1;
    setMessage(`${ELEMENTS[selectedElement].name} ancré. Reste : ${left}.`);
  };

  const getCellClass = (row: number, col: number): string => {
    const key = coordKey({ row, col });
    const classes = ['eh-cell'];

    if (corrupted.has(key)) {
      classes.push('eh-cell--corrupted');
      return classes.join(' ');
    }

    if (occupiedCells.has(key)) {
      const piece = placed.find(p =>
        getShapeCells(p.elementId, p.shapeIndex, p.anchor).some(
          c => c.row === row && c.col === col
        )
      );
      if (piece) classes.push(`eh-cell--filled eh-cell--${piece.elementId}`);
      return classes.join(' ');
    }

    if (previewCells.has(key)) {
      classes.push(previewValid ? 'eh-cell--preview-valid' : 'eh-cell--preview-invalid');
    }

    return classes.join(' ');
  };

  return (
    <div className="element-heart">
      <header className="eh-header">
        <AstralCubeIcon size={36} />
        <div>
          <h2>Cœur Élémentaire</h2>
          <p className="eh-subtitle">Noyau informatique — matrice 5×5</p>
        </div>
      </header>

      <div className="eh-layout">
        <aside className="eh-inventory">
          <h3>Inventaire</h3>
          <button
            type="button"
            className={`eh-piece-btn${selectedElement === 'astral' ? ' eh-piece-btn--selected' : ''}${astralRemaining <= 0 ? ' eh-piece-btn--empty' : ''}`}
            onClick={() => {
              if (astralRemaining <= 0) {
                setMessage('Aucun Cube Astral en stock.');
                return;
              }
              setSelectedElement('astral');
              setMessage('Cube Astral sélectionné.');
            }}
            disabled={astralRemaining <= 0 && selectedElement !== 'astral'}
          >
            <AstralCubeIcon size={40} glowing={astralRemaining > 0} />
            <span>Cube Astral</span>
            <span className="eh-piece-count">
              {astralRemaining} / {inventory.astral ?? 0}
            </span>
          </button>

          <div className="eh-controls">
            <button
              type="button"
              onClick={() => {
                setPlaced([]);
                setMessage('Cœur réinitialisé — tous les cubes sont revenus à l\'inventaire.');
              }}
            >
              Effacer
            </button>
          </div>

          <p className="eh-hint">
            Cliquez sur le cœur pour ancrer un cube. Cliquez sur un cube posé pour le récupérer.
          </p>
        </aside>

        <main className="eh-core">
          <div className="eh-grid-wrap">
            <div
              className="eh-grid"
              style={{
                gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`,
                gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
              }}
            >
              {Array.from({ length: GRID_SIZE }, (_, row) =>
                Array.from({ length: GRID_SIZE }, (_, col) => (
                  <button
                    key={`${row}-${col}`}
                    type="button"
                    className={getCellClass(row, col)}
                    onClick={() => handleCellClick(row, col)}
                    onMouseEnter={() => setHoverCell({ row, col })}
                    onMouseLeave={() => setHoverCell(null)}
                    disabled={corrupted.has(coordKey({ row, col }))}
                    aria-label={
                      corrupted.has(coordKey({ row, col }))
                        ? `Cellule ${row + 1},${col + 1} — corrompue`
                        : `Cellule ${row + 1},${col + 1}`
                    }
                  />
                ))
              )}
            </div>
          </div>

          <div className="eh-legend">
            <span className="eh-legend-item eh-legend-item--empty">Libre</span>
            <span className="eh-legend-item eh-legend-item--corrupted">Corrompue</span>
            <span className="eh-legend-item eh-legend-item--astral">Astral</span>
          </div>
        </main>
      </div>

      {message && <p className="eh-message">{message}</p>}
    </div>
  );
};

export default ElementHeart;
