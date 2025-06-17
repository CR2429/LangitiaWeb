import "./MenuBar.css";
import { Terminal, PersonSquare } from "react-bootstrap-icons";

interface MenuBarProps {
  onOpenTerminal: () => void;
  onOpenLogin: () => void;
}

const MenuBar = ({ onOpenTerminal, onOpenLogin }: MenuBarProps) => {
  return (
    <div className="menu-bar">
      <button onClick={onOpenTerminal}>
        <span className="icon-stack">
          <Terminal className="icon-back" />
          <Terminal className="icon-front" />
        </span>
      </button>
      <button onClick={onOpenLogin} >
        <span className="icon-stack">
          <PersonSquare className="icon-back" />
          <PersonSquare className="icon-front" />
        </span>
      </button>
    </div>
  );
};

export default MenuBar;
