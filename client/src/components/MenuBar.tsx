import "./MenuBar.css";
import { Terminal } from "react-bootstrap-icons";

interface MenuBarProps {
  onOpenTerminal: () => void;
}

const MenuBar = ({ onOpenTerminal }: MenuBarProps) => {
  return (
    <div className="menu-bar">
      <button onClick={onOpenTerminal}>
        <span className="icon-stack">
          <Terminal className="icon-back" />
          <Terminal className="icon-front" />
        </span>
      </button>
    </div>
  );
};

export default MenuBar;
