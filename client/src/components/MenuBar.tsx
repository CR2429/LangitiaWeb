import './MenuBar.css';

interface MenuBarProps {
  onOpenTerminal: () => void;
}

const MenuBar = ({ onOpenTerminal }: MenuBarProps) => {
  return (
    <div className="menu-bar">
      <button onClick={onOpenTerminal}>Terminal</button>
    </div>
  );
};

export default MenuBar;