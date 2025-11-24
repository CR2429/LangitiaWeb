import { useRef, useState, useEffect, useCallback } from 'react';
import './DraggableWindow.css';
import { marked } from 'marked';
import Terminal from './Terminal';

type Props = {
  id: string;
  title: string;
  type: string;
  content: string;
  x: number;
  y: number;
  z: number;
  hidden: boolean;
  onClose: (id: string) => void;
  onFocus: (id: string) => void;
};

const DraggableWindow = ({ id, title, type, content, x, y, z, hidden, onClose, onFocus }: Props) => {
  const windowRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x, y });
  const [size, setSize] = useState({ width: 600, height: 400 });

  const dragState = useRef<{ startMouseX: number; startMouseY: number; startX: number; startY: number; } | null>(null);
  const resizeState = useRef<{ startMouseX: number; startMouseY: number; startWidth: number; startHeight: number; } | null>(null);

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

  const onPointerUp = useCallback(() => {
    dragState.current = null;
    resizeState.current = null;
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
  }, [onPointerMove]);

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
  };

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
  };

  useEffect(() => {
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [onPointerMove, onPointerUp]);

  if (hidden) return null;

  const renderContent = () => {
    switch (type) {
      case 'terminal': return <Terminal />;
      case 'text/plain':
      case 'file-text': return <pre className="file-text-content">{content}</pre>;
      case 'markdown':
      case 'file-md': return <div className="file-text-content" dangerouslySetInnerHTML={{ __html: marked(content || '') }} />;
      case 'image/png':
      case 'file-image': return <img src={content} alt={title} className="file-image" />;
      case 'video/mp4':
      case 'file-video': return <video controls className="file-media"><source src={content} /></video>;
      default: return <p style={{ padding: '1rem' }}>Fichier sans rendu spécifique.</p>;
    }
  };

  return (
    <div
      ref={windowRef}
      className="window"
      style={{ top: position.y, left: position.x, width: size.width, height: size.height, zIndex: z }}
      onPointerDown={() => onFocus(id)}
    >
      <div className="window-header" onPointerDown={startDrag}>
        <span>{title}</span>
        <button onClick={() => onClose(id)}>X</button>
      </div>
      <div className="window-body">{renderContent()}</div>
      <div className="resize-handle" onPointerDown={startResize} />
    </div>
  );
};

export default DraggableWindow;
