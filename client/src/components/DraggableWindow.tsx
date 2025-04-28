import { useRef, useState } from 'react';
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

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();

    onFocus(id);

    const startMouseX = e.clientX;
    const startMouseY = e.clientY;
    const startWindowX = position.x;
    const startWindowY = position.y;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - startMouseX;
      const dy = moveEvent.clientY - startMouseY;

      setPosition({
        x: startWindowX + dx,
        y: startWindowY + dy,
      });
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };


  return (
    <div
      ref={windowRef}
      className="window"
      style={{ top: position.y, left: position.x, zIndex: z}}
      onMouseDown={() => onFocus(id)}
    >
      <div className="window-header" onMouseDown={handleMouseDown}>
        <span>{title}</span>
        <button onClick={() => onClose(id)}>✕</button>
      </div>
      <iframe src={src} title={title} />
    </div>
  );
};

export default DraggableWindow;
