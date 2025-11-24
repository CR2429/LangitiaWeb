// Home.tsx
import { useEffect, useState } from 'react';
import './Home.css';
import MenuBar from './MenuBar';
import DraggableWindow from './DraggableWindow';
import { syncFiles } from '../utils/syncClient';
import {
  FileEarmarkFont,
  FileEarmarkImage,
  FileEarmarkPlay,
  Folder2
} from 'react-bootstrap-icons';

import {
  LocalFS,
  FileNode,
  loadLocalFS,
  saveLocalFS,
  listFilesAtPath,
  normalizePath,
  LOCAL_FS_UPDATED_EVENT
} from '../utils/FileSystem';

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
  ephemeral?: boolean;
};

const Home = () => {
  const [step, setStep] = useState<'boot' | 'interface'>(
    localStorage.getItem('protocolApproved') === 'true' ? 'interface' : 'boot'
  );

  const [localFS, setLocalFS] = useState<LocalFS>(() => loadLocalFS());
  const [windows, setWindows] = useState<WindowData[]>([]);

  // Met à jour le state quand le FS local change (via Terminal ou sync)
  useEffect(() => {
    const handleUpdate = () => {
      setLocalFS(loadLocalFS());
    };

    window.addEventListener(LOCAL_FS_UPDATED_EVENT, handleUpdate as EventListener);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener(LOCAL_FS_UPDATED_EVENT, handleUpdate as EventListener);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // SYNC AUTO toutes les 10 secondes, uniquement si interface affichée
  useEffect(() => {
    if (step !== 'interface') return;

    const interval = setInterval(async () => {
      try {
        const currentFS = loadLocalFS();

        // On ne synchronise que les fichiers, pas les dossiers
        const clientList = currentFS.files
          .filter(f => f.type !== 'dir' && normalizePath(f.path).startsWith('/home'))
          .map(f => ({
            id: f.id,
            updated_at: f.updatedAt || null
          }));

        const {
          new_files = [],
          updated_files = [],
          deleted_files = []
        } = await syncFiles(clientList);

        if (
          new_files.length === 0 &&
          updated_files.length === 0 &&
          deleted_files.length === 0
        ) {
          return;
        }

        const newFS: LocalFS = {
          files: [...currentFS.files]
        };

        // Supprime les fichiers supprimés côté serveur
        deleted_files.forEach((id: string) => {
          newFS.files = newFS.files.filter(f => f.id !== id);
        });

        // Ajoute les nouveaux fichiers
        new_files.forEach((f: any) => {
          newFS.files.push({
            id: f.id,
            nom: f.title,
            type: f.type,
            path: '/home',
            content: f.content || '',
            updatedAt: f.updated_at || null
          });
        });

        // Met à jour les fichiers existants
        updated_files.forEach((f: any) => {
          const index = newFS.files.findIndex(ff => ff.id === f.id);
          if (index >= 0) {
            newFS.files[index] = {
              ...newFS.files[index],
              type: f.type,
              content: f.content || '',
              updatedAt: f.updated_at || null
            };
          }
        });

        saveLocalFS(newFS);
        setLocalFS(newFS);
      } catch (err) {
        console.error('Erreur sync :', err);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [step]);

  // Ouverture d'une fenêtre dossier
  const openFolderWindow = (file: FileNode) => {
    const maxZ = windows.length ? Math.max(...windows.map(w => w.z)) + 1 : 1;

    setWindows(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        title: file.nom,
        type: 'folder',
        content: '',
        updatedAt: new Date().toISOString(),
        x: window.innerWidth / 2 - 300,
        y: window.innerHeight / 2 - 200,
        z: maxZ,
        hidden: false,
        ephemeral: false
      }
    ]);
  };

  // Terminal
  const openTerminal = () => {
    const maxZ = windows.length ? Math.max(...windows.map(w => w.z)) + 1 : 1;

    setWindows(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        title: 'Terminal',
        type: 'terminal',
        content: '',
        updatedAt: new Date().toISOString(),
        x: window.innerWidth / 2 - 300 + Math.random() * 100 - 50,
        y: window.innerHeight / 2 - 200 + Math.random() * 100 - 50,
        z: maxZ,
        hidden: false,
        ephemeral: true
      }
    ]);
  };

  const closeWindow = (id: string) => {
    setWindows(prev => {
      const win = prev.find(w => w.id === id);
      if (!win) return prev;
      if (win.ephemeral) return prev.filter(w => w.id !== id);
      return prev.map(w => (w.id === id ? { ...w, hidden: true } : w));
    });
  };

  const bringToFront = (id: string) => {
    setWindows(prev => {
      const maxZ = Math.max(...prev.map(w => w.z));
      return prev.map(w => (w.id === id ? { ...w, z: maxZ + 1 } : w));
    });
  };

  const getFileIcon = (type: string, className: string) => {
    switch (type) {
      case 'txt':
        return <FileEarmarkFont className={className} />;
      case 'png':
        return <FileEarmarkImage className={className} />;
      case 'mp4':
        return <FileEarmarkPlay className={className} />;
      case 'dir':
        return <Folder2 className={className} />;
      default:
        return <div />;
    }
  };

  const handleApproveProtocol = () => {
    localStorage.setItem('protocolApproved', 'true');
    setStep('interface');
  };

  const desktopFiles = listFilesAtPath(localFS, '/home');

  return (
    <>
      {step === 'boot' && (
        <div className="main-interface">
          <div className="boot-screen">
            <h2>Bienvenue dans le système Cartage</h2>
            <p className="boot-text">
              En cliquant sur <strong>Connexion au système</strong>, vous reconnaissez avoir lu et accepté les{' '}
              <a href="/protocoles_de_securite">Protocoles de Sécurité</a>.
            </p>
            <button className="boot-button" onClick={handleApproveProtocol}>
              Connexion au système
            </button>
          </div>
        </div>
      )}

      {step === 'interface' && (
        <div className="main-interface">
          <div className="desktop-grid">
            {desktopFiles.map(f => (
              <div
                key={f.id}
                className="desktop-icon"
                onClick={() => openFolderWindow(f)}
              >
                <div className="icon-stack-large">
                  {getFileIcon(f.type, 'icon-back')}
                  {getFileIcon(f.type, 'icon-front')}
                </div>
                <span>{f.nom}</span>
              </div>
            ))}
          </div>

          {windows.map(win => {
            const title =
              win.type === 'terminal'
                ? win.title
                : win.type === 'folder'
                  ? win.title
                  : `${win.title}.${win.type}`;

            return (
              <DraggableWindow
                key={win.id}
                id={win.id}
                title={title}
                type={win.type}
                content={win.content}
                x={win.x}
                y={win.y}
                z={win.z}
                hidden={win.hidden}
                onClose={closeWindow}
                onFocus={bringToFront}
              />
            );
          })}

          <MenuBar
            onOpenTerminal={openTerminal}
            onOpenLogin={() => console.log('login soon')}
            onOpenEditText={() => console.log('edit soon')}
          />
        </div>
      )}
    </>
  );
};

export default Home;
