import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './ElementHeart.css';
import { MouseLeftClickIcon, MouseRightClickIcon } from './ClickHintIcons';
import PiecePreview from './PiecePreview';
import {
  DEFAULT_CORRUPTED,
  ELEMENT_META,
  GRID_SIZE,
  SHAPE_TEMPLATES,
  anchorFromHover,
  canPlacePiece,
  computeActiveTally,
  coordKey,
  createDefaultInventory,
  getPieceCells,
  pieceTouchesCorruption,
} from '../../utils/elementHeart/elements';
import type { GridCoord, InventoryPiece, PlacedPiece } from '../../utils/elementHeart/types';

type DragState = {
  source: 'inventory' | 'grid';
  pieceId: string;
  templateId: InventoryPiece['templateId'];
  shapeIndex: number;
};

function findCellFromPoint(x: number, y: number): GridCoord | null {
  const el = document.elementFromPoint(x, y)?.closest('[data-eh-row][data-eh-col]');
  if (!el) return null;
  const row = el.getAttribute('data-eh-row');
  const col = el.getAttribute('data-eh-col');
  if (row === null || col === null) return null;
  return { row: Number(row), col: Number(col) };
}

const ElementHeart = () => {
  const boardRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef<DragState | null>(null);
  const pointerPosRef = useRef<{ x: number; y: number } | null>(null);

  const [inventory, setInventory] = useState<InventoryPiece[]>(() => createDefaultInventory());
  const [placed, setPlaced] = useState<PlacedPiece[]>([]);
  const [hoverAnchor, setHoverAnchor] = useState<GridCoord | null>(null);
  const [dragging, setDragging] = useState<DragState | null>(null);
  const [pointerPos, setPointerPos] = useState<{ x: number; y: number } | null>(null);

  const corrupted = useMemo(() => new Set(DEFAULT_CORRUPTED.map(coordKey)), []);

  const visiblePlaced = useMemo(() => {
    if (dragging?.source === 'grid') {
      return placed.filter(p => p.id !== dragging.pieceId);
    }
    return placed;
  }, [placed, dragging]);

  const activeTally = useMemo(
    () => computeActiveTally(placed, corrupted),
    [placed, corrupted]
  );

  const occupiedCells = useMemo(() => {
    const map = new Map<string, PlacedPiece>();
    for (const piece of visiblePlaced) {
      for (const cell of getPieceCells(piece.templateId, piece.shapeIndex, piece.anchor)) {
        map.set(coordKey(cell), piece);
      }
    }
    return map;
  }, [visiblePlaced]);

  const previewCells = useMemo(() => {
    if (!dragging || !hoverAnchor) return new Set<string>();
    return new Set(
      getPieceCells(dragging.templateId, dragging.shapeIndex, hoverAnchor).map(coordKey)
    );
  }, [dragging, hoverAnchor]);

  const previewValid = useMemo(() => {
    if (!dragging || !hoverAnchor) return false;
    return canPlacePiece(
      dragging.templateId,
      dragging.shapeIndex,
      hoverAnchor,
      visiblePlaced,
      GRID_SIZE
    );
  }, [dragging, hoverAnchor, visiblePlaced]);

  const updateHoverFromPointer = useCallback((clientX: number, clientY: number) => {
    const d = draggingRef.current;
    if (!d) return;
    const hover = findCellFromPoint(clientX, clientY);
    setHoverAnchor(
      hover ? anchorFromHover(hover, d.templateId, d.shapeIndex) : null
    );
  }, []);

  const startDrag = useCallback(
    (
      source: 'inventory' | 'grid',
      piece: { id: string; templateId: InventoryPiece['templateId']; shapeIndex: number },
      x: number,
      y: number
    ) => {
      const next: DragState = {
        source,
        pieceId: piece.id,
        templateId: piece.templateId,
        shapeIndex: piece.shapeIndex,
      };
      draggingRef.current = next;
      setDragging(next);
      pointerPosRef.current = { x, y };
      setPointerPos({ x, y });
      updateHoverFromPointer(x, y);
    },
    [updateHoverFromPointer]
  );

  const endDrag = useCallback(() => {
    draggingRef.current = null;
    pointerPosRef.current = null;
    setDragging(null);
    setHoverAnchor(null);
    setPointerPos(null);
  }, []);

  const placeFromInventory = useCallback(
    (inventoryPieceId: string, anchor: GridCoord, shapeIndex: number) => {
      const item = inventory.find(p => p.id === inventoryPieceId);
      if (!item) return false;
      if (!canPlacePiece(item.templateId, shapeIndex, anchor, placed, GRID_SIZE)) return false;

      setPlaced(prev => [
        ...prev,
        {
          id: crypto.randomUUID(),
          inventoryPieceId: item.id,
          templateId: item.templateId,
          anchor,
          shapeIndex,
        },
      ]);
      setInventory(prev => prev.filter(p => p.id !== item.id));
      return true;
    },
    [inventory, placed]
  );

  const moveOnGrid = useCallback(
    (placedId: string, anchor: GridCoord, shapeIndex: number) => {
      const piece = placed.find(p => p.id === placedId);
      if (!piece) return false;
      const others = placed.filter(p => p.id !== placedId);
      if (!canPlacePiece(piece.templateId, shapeIndex, anchor, others, GRID_SIZE)) return false;
      setPlaced(prev =>
        prev.map(p => (p.id === placedId ? { ...p, anchor, shapeIndex } : p))
      );
      return true;
    },
    [placed]
  );

  const returnToInventory = useCallback((placedId: string, shapeIndex?: number) => {
    const piece = placed.find(p => p.id === placedId);
    if (!piece) return;
    const idx = shapeIndex ?? piece.shapeIndex;
    setPlaced(prev => prev.filter(p => p.id !== placedId));
    setInventory(prev => [
      ...prev,
      { id: piece.inventoryPieceId, templateId: piece.templateId, shapeIndex: idx },
    ]);
  }, [placed]);

  const rotateDraggingPiece = useCallback(
    (clientX: number, clientY: number) => {
      const prev = draggingRef.current;
      if (!prev) return;

      const max = SHAPE_TEMPLATES[prev.templateId].rotations.length;
      const shapeIndex = (prev.shapeIndex + 1) % max;
      const next = { ...prev, shapeIndex };

      draggingRef.current = next;
      setDragging(next);

      if (prev.source === 'inventory') {
        setInventory(inv =>
          inv.map(p => (p.id === prev.pieceId ? { ...p, shapeIndex } : p))
        );
      }

      const px = clientX || pointerPosRef.current?.x || 0;
      const py = clientY || pointerPosRef.current?.y || 0;
      updateHoverFromPointer(px, py);
    },
    [updateHoverFromPointer]
  );

  const rotateInventoryPiece = useCallback((pieceId: string) => {
    setInventory(prev =>
      prev.map(p => {
        if (p.id !== pieceId) return p;
        const max = SHAPE_TEMPLATES[p.templateId].rotations.length;
        return { ...p, shapeIndex: (p.shapeIndex + 1) % max };
      })
    );
  }, []);

  const rotateGridPiece = useCallback((piece: PlacedPiece) => {
    const nextIndex = (piece.shapeIndex + 1) % SHAPE_TEMPLATES[piece.templateId].rotations.length;
    const others = placed.filter(p => p.id !== piece.id);
    if (!canPlacePiece(piece.templateId, nextIndex, piece.anchor, others, GRID_SIZE)) return;
    setPlaced(prev => prev.map(p => (p.id === piece.id ? { ...p, shapeIndex: nextIndex } : p)));
  }, [placed]);

  const clearHeart = () => {
    const returned: InventoryPiece[] = placed.map(p => ({
      id: p.inventoryPieceId,
      templateId: p.templateId,
      shapeIndex: p.shapeIndex,
    }));
    setInventory(prev => [...prev, ...returned]);
    setPlaced([]);
  };

  const dragActive = dragging !== null;

  useEffect(() => {
    if (!dragActive) return;

    const onMove = (e: PointerEvent) => {
      pointerPosRef.current = { x: e.clientX, y: e.clientY };
      setPointerPos({ x: e.clientX, y: e.clientY });
      updateHoverFromPointer(e.clientX, e.clientY);
    };

    const onContextMenu = (e: MouseEvent) => {
      if (!draggingRef.current) return;
      e.preventDefault();
      e.stopPropagation();
      rotateDraggingPiece(e.clientX, e.clientY);
    };

    const onUp = (e: PointerEvent) => {
      if (e.button !== 0) return;
      const d = draggingRef.current;
      if (!d) return;

      const hover = findCellFromPoint(e.clientX, e.clientY);

      if (hover) {
        const anchor = anchorFromHover(hover, d.templateId, d.shapeIndex);
        const placedOk =
          d.source === 'inventory'
            ? placeFromInventory(d.pieceId, anchor, d.shapeIndex)
            : moveOnGrid(d.pieceId, anchor, d.shapeIndex);

        if (!placedOk && d.source === 'grid') {
          returnToInventory(d.pieceId, d.shapeIndex);
        }
      } else if (d.source === 'grid') {
        returnToInventory(d.pieceId, d.shapeIndex);
      }

      endDrag();
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    window.addEventListener('contextmenu', onContextMenu, true);

    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      window.removeEventListener('contextmenu', onContextMenu, true);
    };
  }, [
    dragActive,
    endDrag,
    moveOnGrid,
    placeFromInventory,
    returnToInventory,
    rotateDraggingPiece,
    updateHoverFromPointer,
  ]);

  const getCellClass = (row: number, col: number): string => {
    const key = coordKey({ row, col });
    const classes = ['eh-cell'];
    if (corrupted.has(key)) classes.push('eh-cell--corrupted');

    const occupant = occupiedCells.get(key);
    if (occupant) {
      const elementId = SHAPE_TEMPLATES[occupant.templateId].elementId;
      const incompatible = pieceTouchesCorruption(occupant, corrupted);
      classes.push(`eh-cell--filled eh-cell--${elementId}`);
      if (incompatible) classes.push('eh-cell--incompatible');
    } else if (previewCells.has(key)) {
      classes.push(previewValid ? 'eh-cell--preview-valid' : 'eh-cell--preview-invalid');
    }

    return classes.join(' ');
  };

  const handleDragStart = (
    e: React.PointerEvent,
    source: 'inventory' | 'grid',
    piece: { id: string; templateId: InventoryPiece['templateId']; shapeIndex: number }
  ) => {
    if (e.button !== 0) return;
    e.preventDefault();
    startDrag(source, piece, e.clientX, e.clientY);
  };

  const handleRotate = (e: React.PointerEvent, action: () => void) => {
    if (draggingRef.current) return;
    if (e.button !== 2) return;
    e.preventDefault();
    action();
  };

  const activeEntries = Object.entries(activeTally).filter(([, v]) => (v ?? 0) > 0);

  return (
    <div className="element-heart" ref={boardRef} onContextMenu={e => e.preventDefault()}>
      <div className="eh-layout">
        <section className="eh-board" aria-label="Matrice du cœur">
          {activeEntries.length > 0 && (
            <div className="eh-active-bar" aria-live="polite">
              {activeEntries.map(([elementId, value]) => (
                <span key={elementId} className={`eh-active-chip eh-active-chip--${elementId}`}>
                  {ELEMENT_META[elementId as keyof typeof ELEMENT_META].name} · {value}
                </span>
              ))}
            </div>
          )}

          <div className="eh-grid-wrap">
            <div
              className="eh-grid"
              style={{
                gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`,
                gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
              }}
            >
              {Array.from({ length: GRID_SIZE }, (_, row) =>
                Array.from({ length: GRID_SIZE }, (_, col) => {
                  const key = coordKey({ row, col });
                  const occupant = occupiedCells.get(key);

                  return (
                    <div
                      key={key}
                      className={getCellClass(row, col)}
                      data-eh-row={row}
                      data-eh-col={col}
                      onPointerDown={e => {
                        if (e.button === 0 && occupant) {
                          handleDragStart(e, 'grid', occupant);
                        } else if (e.button === 2 && occupant) {
                          handleRotate(e, () => rotateGridPiece(occupant));
                        }
                      }}
                      onDoubleClick={() => {
                        if (occupant) returnToInventory(occupant.id);
                      }}
                    />
                  );
                })
              )}
            </div>
          </div>
        </section>

        <aside className="eh-inventory" aria-label="Inventaire élémentaire">
          <div className="eh-inventory-panel">
            <div className="eh-inventory-grid">
              {inventory.map(piece => {
                const elementId = SHAPE_TEMPLATES[piece.templateId].elementId;
                const isDragging =
                  dragging?.source === 'inventory' && dragging.pieceId === piece.id;

                return (
                  <div
                    key={piece.id}
                    className={`eh-slot${isDragging ? ' eh-slot--dragging' : ''}`}
                    onPointerDown={e => {
                      if (e.button === 0) handleDragStart(e, 'inventory', piece);
                      if (e.button === 2) handleRotate(e, () => rotateInventoryPiece(piece.id));
                    }}
                  >
                    <div className="eh-slot-frame">
                      <span className="eh-corner eh-corner--tl" />
                      <span className="eh-corner eh-corner--tr" />
                      <span className="eh-corner eh-corner--bl" />
                      <span className="eh-corner eh-corner--br" />
                      <PiecePreview
                        templateId={piece.templateId}
                        shapeIndex={piece.shapeIndex}
                        size="slot"
                        elementClass={elementId}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="eh-controls-hint">
              <div className="eh-hint-row">
                <MouseLeftClickIcon size={16} />
                <span>Déposer</span>
              </div>
              <div className="eh-hint-row">
                <MouseRightClickIcon size={16} />
                <span>Pivotage</span>
              </div>
            </div>

            <button type="button" className="eh-clear-btn" onClick={clearHeart}>
              Effacer
            </button>
          </div>
        </aside>
      </div>

      {dragging && pointerPos && (
        <div
          className="eh-drag-ghost"
          style={{ left: pointerPos.x, top: pointerPos.y }}
          aria-hidden
        >
          <PiecePreview
            templateId={dragging.templateId}
            shapeIndex={dragging.shapeIndex}
            size="ghost"
            elementClass={SHAPE_TEMPLATES[dragging.templateId].elementId}
          />
        </div>
      )}
    </div>
  );
};

export default ElementHeart;
