import "./MenuBar.css";
import { Terminal, PersonSquare, ShieldShaded } from "react-bootstrap-icons";

interface MenuBarProps {
  onOpenTerminal: () => void;
  onOpenLogin: () => void;
}

const MenuBar = ({ onOpenTerminal, onOpenLogin }: MenuBarProps) => {
  return (
    <div className="menu-bar">
      <button
        onClick={onOpenTerminal}
        title="Terminal"
      >
        <span className="icon-stack">
          <Terminal className="icon-back" />
          <Terminal className="icon-front" />
        </span>
      </button>
      <button
        onClick={onOpenLogin}
        title="Connexion"
      >
        <span className="icon-stack">
          <PersonSquare className="icon-back" />
          <PersonSquare className="icon-front" />
        </span>
      </button>
      <button
        onClick={() => window.open('/protocoles_de_securite', '_blank')}
        title="Protocoles de sécurité"
      >
        <span className="icon-stack">
          <ShieldShaded className="icon-back" />
          <ShieldShaded className="icon-front" />
        </span>
      </button>
    </div>
  );
};

export default MenuBar;
