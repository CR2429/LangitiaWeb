import { useEffect, useState } from 'react';
import './Home.css';
import MenuBar from './MenuBar';
import DraggableWindow from './DraggableWindow';
import { syncFiles } from '../utils/syncClient';
import { FileEarmarkFont, FileEarmarkImage, FileEarmarkPlay, Folder2 } from "react-bootstrap-icons";

type WindowData = {
  id: string;
  title: string;
  type: string;
  content: string;
  updatedAt: string;
  x: number;
  y: number;
  z: number;
  hidden: boolean;
  ephemeral?: boolean; // ✅ Pour savoir si elle doit être détruite à la fermeture
};

const Home = () => {
  const [step, setStep] = useState<'boot' | 'interface'>(
    localStorage.getItem('protocolApproved') === 'true' ? 'interface' : 'boot'
  );

  // --- Gestion du système de fichiers local ---
  const [localFS, setLocalFS] = useState(() => {
    const saved = localStorage.getItem("localFS");
    return saved
      ? JSON.parse(saved)
      : { root: { type: "dir", children: { home: { type: "dir", children: {} } } } };
  });

  const [windows, setWindows] = useState<WindowData[]>([]);
  const [nextZ, setNextZ] = useState(1);

  // --- 1️⃣ Synchronisation initiale + auto toutes les minutes ---
  useEffect(() => {
    if (step !== 'interface') return;

    const doSync = async () => {
      const localFiles = windows.map(w => ({ id: w.id, updated_at: w.updatedAt }));
      const { new_files = [], updated_files = [], deleted_files = [] } = await syncFiles(localFiles);

      setWindows(prev => {
        let result = prev.filter(w => !deleted_files.includes(w.id));
        result = result.map(w => {
          const update = updated_files.find(f => f.id === w.id);
          return update
            ? { ...w, title: update.title, content: update.content, updatedAt: update.updated_at }
            : w;
        });
        const maxZ = result.length ? Math.max(...result.map(w => w.z)) : 1;
        result = [
          ...result,
          ...new_files.map((f, i) => ({
            id: f.id,
            title: f.title,
            type: f.type,
            content: f.content,
            updatedAt: f.updated_at,
            x: window.innerWidth / 2 - 300,
            y: window.innerHeight / 2 - 200,
            z: maxZ + i + 1,
            hidden: true,
            ephemeral: false
          }))
        ];
        return result;
      });
    };

    doSync();
    const interval = setInterval(doSync, 60000);
    return () => clearInterval(interval);
  }, [step]);

  // --- 2️⃣ Écouter les changements de localStorage ---
  useEffect(() => {
    const handleStorage = () => {
      const saved = localStorage.getItem("localFS");
      if (saved) setLocalFS(JSON.parse(saved));
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // --- 3️⃣ Extraire les fichiers/dossiers d’un chemin ---
  const getFilesInPath = (fs: any, path: string) => {
    const parts = path.split("/").filter(Boolean);
    let current = fs.root;
    for (const part of parts) {
      if (current.children?.[part]) current = current.children[part];
      else return [];
    }
    return Object.entries(current.children || {}).map(([name, node]: [string, any]) => ({
      name,
      type: node.type,
    }));
  };

  // --- 4️⃣ Ouvrir un fichier/dossier depuis le bureau ---
  const handleFileClick = (fileName: string) => {
    const fileId = crypto.randomUUID();
    const maxZ = windows.length ? Math.max(...windows.map(w => w.z)) + 1 : 1;

    setWindows(prev => [
      ...prev,
      {
        id: fileId,
        title: fileName,
        type: "folder",
        content: "",
        updatedAt: new Date().toISOString(),
        x: window.innerWidth / 2 - 300,
        y: window.innerHeight / 2 - 200,
        z: maxZ,
        hidden: false,
        ephemeral: false,
      }
    ]);
  };

  // --- 5️⃣ Fermer une fenêtre ---
  const closeWindow = (id: string) => {
    setWindows(prev => {
      const target = prev.find(w => w.id === id);
      if (!target) return prev;
      if (target.ephemeral) return prev.filter(w => w.id !== id); // Supprime complètement
      return prev.map(w => (w.id === id ? { ...w, hidden: true } : w)); // Cache sinon
    });
  };

  // --- 6️⃣ Focus ---
  const bringToFront = (id: string) => {
    setWindows(prev => {
      const maxZ = Math.max(...prev.map(w => w.z));
      setNextZ(maxZ + 1);
      return prev.map(w => (w.id === id ? { ...w, z: maxZ + 1 } : w));
    });
  };

  // --- 7️⃣ Ouvrir un nouveau Terminal ---
  const openTerminalWindow = () => {
    setWindows(prev => {
      const newWin: WindowData = {
        id: crypto.randomUUID(),
        title: 'Terminal',
        type: 'terminal',
        content: '',
        updatedAt: new Date().toISOString(),
        x: window.innerWidth / 2 - 300 + Math.random() * 100 - 50,
        y: window.innerHeight / 2 - 200 + Math.random() * 100 - 50,
        z: prev.length ? Math.max(...prev.map(w => w.z)) + 1 : 1,
        hidden: false,
        ephemeral: true,
      };
      return [...prev, newWin];
    });
  };

  // --- 8️⃣ Icônes du bureau ---
  const getFileIcon = (type: string, className: string) => {
    switch (type) {
      case 'txt': return <FileEarmarkFont className={className} />;
      case 'png': return <FileEarmarkImage className={className} />;
      case 'mp4': return <FileEarmarkPlay className={className} />;
      case 'dir': return <Folder2 className={className} />;
      default: return <div />;
    }
  };

  // --- 9️⃣ Validation du protocole ---
  const handleApproveProtocol = () => {
    localStorage.setItem('protocolApproved', 'true');
    setStep('interface');
  };

  // --- 🔟 Rendu ---
  return (
    <>
      {step === 'boot' && (
        <div className="main-interface">
          <div className="boot-screen">
            <h2>Bienvenue dans le système Cartage</h2>
            <p className="boot-text">
              En cliquant sur <strong>Connexion au système</strong>, vous reconnaissez avoir lu et accepté les{' '}
              <a href="/protocoles_de_securite" target="_blank" rel="noopener noreferrer">
                Protocoles de Sécurité
              </a>.
            </p>
            <button className="boot-button" onClick={handleApproveProtocol}>
              Connexion au système
            </button>
          </div>
        </div>
      )}

      {step === 'interface' && (
        <div className="main-interface">
          {/* Icônes du bureau depuis le localFS */}
          <div className="desktop-grid">
            {getFilesInPath(localFS, "/home").map(item => (
              <div
                key={item.name}
                className="desktop-icon"
                onClick={() => handleFileClick(item.name)}
              >
                <div className="icon-stack-large">
                  {getFileIcon(item.type, 'icon-back')}
                  {getFileIcon(item.type, 'icon-front')}
                </div>
                <span>{item.name}</span>
              </div>
            ))}
          </div>

          {/* Fenêtres ouvertes */}
          {windows.map(win => (
            <DraggableWindow
              key={win.id}
              id={win.id}
              title={win.ephemeral ? win.title : `${win.title}.${win.type}`}
              type={win.type}
              content={win.content}
              x={win.x}
              y={win.y}
              z={win.z}
              hidden={win.hidden}
              onClose={closeWindow}
              onFocus={bringToFront}
            />
          ))}

          {/* Barre de menu */}
          <MenuBar
            onOpenTerminal={openTerminalWindow}
            onOpenLogin={() => console.log("Login à venir")}
            onOpenEditText={() => console.log("Éditeur à venir")}
          />
        </div>
      )}
    </>
  );
};

export default Home;
