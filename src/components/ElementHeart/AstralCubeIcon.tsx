import './AstralCubeIcon.css';

type Props = {
  size?: number;
  glowing?: boolean;
};

/** Cube astral stylisé en CSS 3D */
const AstralCubeIcon = ({ size = 48, glowing = true }: Props) => (
  <div
    className={`astral-cube-wrap${glowing ? ' astral-cube-wrap--glow' : ''}`}
    style={{ width: size, height: size }}
    aria-hidden
  >
    <div className="astral-cube">
      <div className="astral-cube-face astral-cube-face--front" />
      <div className="astral-cube-face astral-cube-face--back" />
      <div className="astral-cube-face astral-cube-face--right" />
      <div className="astral-cube-face astral-cube-face--left" />
      <div className="astral-cube-face astral-cube-face--top" />
      <div className="astral-cube-face astral-cube-face--bottom" />
    </div>
  </div>
);

export default AstralCubeIcon;
