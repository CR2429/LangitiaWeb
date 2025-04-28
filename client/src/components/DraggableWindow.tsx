import { useRef, useState, useEffect, useCallback } from 'react';
import './DraggableWindow.css';

type Props = {
  id: number;
  title: string;
  src: string;
  x: number;
  y: number;
  z: number;
  onClose: (id: number) => void;
  onFocus: (id: number) => void;
};

const DraggableWindow = ({ id, title, src, x, y, z, onClose, onFocus }: Props) => {
  const windowRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x, y });
  const [size, setSize] = useState({ width: 600, height: 400 });

  // Refs pour stocker l'état de drag et resize
  const dragState = useRef<{ startMouseX: number; startMouseY: number; startX: number; startY: number; } | null>(null);
  const resizeState = useRef<{ startMouseX: number; startMouseY: number; startWidth: number; startHeight: number; } | null>(null);

  // Gestion unifiée du mouvement (drag & resize)
  const onPointerMove = useCallback((e: PointerEvent) => {
    if (dragState.current) {
      const dx = e.clientX - dragState.current.startMouseX;
      const dy = e.clientY - dragState.current.startMouseY;
      setPosition({ x: dragState.current.startX + dx, y: dragState.current.startY + dy });
    } else if (resizeState.current) {
      const dx = e.clientX - resizeState.current.startMouseX;
      const dy = e.clientY - resizeState.current.startMouseY;
      setSize({
        width: Math.max(resizeState.current.startWidth + dx, 300),
        height: Math.max(resizeState.current.startHeight + dy, 200),
      });
    }
  }, []);

  // Relâchement du pointeur => arrêt du drag/resize
  const onPointerUp = useCallback(() => {
    dragState.current = null;
    resizeState.current = null;
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
  }, [onPointerMove]);

  // Démarrage du drag via Pointer Events + pointer capture
  const startDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onFocus(id);
    dragState.current = {
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startX: position.x,
      startY: position.y,
    };
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  // Démarrage du resize via Pointer Events + pointer capture
  const startResize = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    resizeState.current = {
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startWidth: size.width,
      startHeight: size.height,
    };
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  // Cleanup en cas de démontage
  useEffect(() => {
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [onPointerMove, onPointerUp]);

  return (
    <div
      ref={windowRef}
      className="window"
      style={{ top: position.y, left: position.x, width: size.width, height: size.height, zIndex: z }}
      onPointerDown={() => onFocus(id)}
    >
      <div className="window-header" onPointerDown={startDrag} style={{ touchAction: 'none', cursor: 'move' }}>
        <span>{title}</span>
        <button onPointerDown={e => e.stopPropagation()} onClick={() => onClose(id)}>✕</button>
      </div>
      <iframe src={src} title={title} style={{ width: '100%', height: '100%' }} />
      <div className="resize-handle" onPointerDown={startResize} style={{ touchAction: 'none', cursor: 'se-resize' }} />
    </div>
  );
};

export default DraggableWindow;
