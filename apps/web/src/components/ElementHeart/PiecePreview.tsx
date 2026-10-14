import { SHAPE_TEMPLATES } from '../../utils/elementHeart/elements';
import type { ShapeTemplateId } from '../../utils/elementHeart/types';

const CELL_PX: Record<string, number> = {
  sm: 8,
  md: 10,
  slot: 11,
  ghost: 12,
};

const GAP_PX = 2;

type Props = {
  templateId: ShapeTemplateId;
  shapeIndex: number;
  size?: 'sm' | 'md' | 'slot' | 'ghost';
  elementClass?: string;
};

const PiecePreview = ({ templateId, shapeIndex, size = 'sm', elementClass = 'astral' }: Props) => {
  const template = SHAPE_TEMPLATES[templateId];
  const shape = template.rotations[shapeIndex] ?? template.rotations[0];
  const maxRow = Math.max(...shape.map(c => c.row), 0);
  const maxCol = Math.max(...shape.map(c => c.col), 0);
  const filled = new Set(shape.map(c => `${c.row},${c.col}`));
  const cellPx = CELL_PX[size];
  const rows = maxRow + 1;
  const cols = maxCol + 1;

  return (
    <div
      className={`eh-preview eh-preview--${size}`}
      style={{
        gridTemplateRows: `repeat(${rows}, ${cellPx}px)`,
        gridTemplateColumns: `repeat(${cols}, ${cellPx}px)`,
        gap: `${GAP_PX}px`,
        width: cols * cellPx + (cols - 1) * GAP_PX,
        height: rows * cellPx + (rows - 1) * GAP_PX,
      }}
      aria-hidden
    >
      {Array.from({ length: rows }, (_, row) =>
        Array.from({ length: cols }, (_, col) => (
          <div
            key={`${row}-${col}`}
            className={
              filled.has(`${row},${col}`)
                ? `eh-preview-cell eh-preview-cell--${elementClass}`
                : 'eh-preview-cell'
            }
          />
        ))
      )}
    </div>
  );
};

export default PiecePreview;
