import React from 'react';

type ContextMenuProps = {
    x: number;
    y: number;
    visible: boolean;
    isLoggedIn: boolean;
    onClose: () => void;
    onOpenTerminal: () => void;
};

const ContextMenu: React.FC<ContextMenuProps> = ({
    x,
    y,
    visible,
    isLoggedIn,
    onClose,
    onOpenTerminal,
}) => {
    if (!visible) return null;

    const handleInspect = () => {
        console.log('Inspecter cliqué');
        onClose();
    };

    const handleOpenTerminal = () => {
        console.log('Ouvrir terminal');
        onOpenTerminal();
        onClose();
    };

    return (
        <div
            className="custom-context-menu"
            style={{
                position: 'absolute',
                top: y,
                left: x,
                background: '#333',
                color: '#fff',
                padding: '10px',
                borderRadius: '5px',
                zIndex: 9999,
            }}
            onClick={(e) => e.stopPropagation()}
        >
            <div onClick={handleInspect} style={{ padding: '5px', cursor: 'pointer' }}>
                Inspecter
            </div>
            {isLoggedIn && (
                <div onClick={handleOpenTerminal} style={{ padding: '5px', cursor: 'pointer' }}>
                    Ouvrir Terminal
                </div>
            )}
        </div>
    );
};

export default ContextMenu;
