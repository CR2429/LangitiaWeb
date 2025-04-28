import { useEffect, useState } from 'react';
import './Home.css';
import MenuBar from './MenuBar';
import DraggableWindow from './DraggableWindow';
import { desktopFiles, FileItem } from '../object/FileSystem';
import { FileEarmarkFont, FileEarmarkImage, FileEarmarkPlay, Folder2 } from "react-bootstrap-icons";


type WindowData = {
    id: number;
    title: string;
    src: string;
    x: number;
    y: number;
    z: number;
};


const Home = () => {
    const [step, setStep] = useState<'loading' | 'welcome' | 'interface'>('loading');
    const [welcomeText, setWelcomeText] = useState('');
    const [showWelcome, setShowWelcome] = useState(false);
    const fullMessage = "Bienvenue dans le système Cartage";
    const [windows, setWindows] = useState<WindowData[]>([]);
    const [nextId, setNextId] = useState(1);
    const [nextZ, setNextZ] = useState(1);


    // Transition : chargement → message
    useEffect(() => {
        if (step === 'loading') {
            setTimeout(() => {
                setStep('interface');
                setShowWelcome(true);
            }, 3000);
        }
    }, [step]);

    // Affichage du message lettre par lettre
    useEffect(() => {
        if (showWelcome) {
            let i = 0;
            let actualMessage = "";
            const writeInterval = setInterval(() => {
                if (i < fullMessage.length) {
                    actualMessage += fullMessage[i]
                    setWelcomeText(actualMessage);
                    i++;
                } else {
                    clearInterval(writeInterval);
                }
            }, 50);

            // Cacher le message après 3 secondes
            const hideTimer = setTimeout(() => {
                setShowWelcome(false);
            }, 3000);

            return () => {
                clearInterval(writeInterval);
                clearTimeout(hideTimer);
            };
        }
    }, [showWelcome]);

    //Ouvrire une nouvelle fenetre
    const openWindow = (title: string, src: string) => {
        const newWindow: WindowData = {
            id: nextId,
            title,
            src,
            x: window.innerWidth / 2 - 300,
            y: window.innerHeight / 2 - 200,
            z: nextZ,
        };
        setWindows(prev => [...prev, newWindow]);
        setNextId(prev => prev + 1);
        setNextZ(prev => prev + 1);
    };

    //fermer une fenetre
    const closeWindow = (id: number) => {
        setWindows(prev => prev.filter(win => win.id !== id));
    };

    //Mettre une page au premier plan
    const bringToFront = (id: number) => {
        setWindows(prev => {
            const maxZ = Math.max(...prev.map(w => w.z));
            return prev.map(w =>
                w.id === id ? { ...w, z: maxZ + 1 } : w
            );
        });
    };

    //Mettre la bonne icone
    const getFileIcon = (type: string, className: string) => {
        switch (type) {
          case 'file-text':
            return <FileEarmarkFont className={className} />;
          case 'file-image':
            return <FileEarmarkImage className={className} />;
          case 'file-video':
            return <FileEarmarkPlay className={className} />;
          case 'folder':
            return <Folder2 className={className} />;
          default:
            return <FileEarmarkFont className={className} />;
        }
      };

    return (
        <>
            {step === 'loading' && (
                <div className="main-interface">
                    <div className='boot-screen'>
                        <h2>Initialisation du système Cartage...</h2>
                        <div className="loader-bar">
                            <div className="loader-progress" />
                        </div>
                    </div>

                </div>
            )}

            {step === 'interface' && (
                <div className="main-interface">
                    {showWelcome && (
                        <div className="boot-welcome">{welcomeText}</div>
                    )}

                    {/* gestion des icones dans le bureau */}
                    <div className="desktop-grid">
                        {desktopFiles.map(file => (
                            <div
                                key={file.id}
                                className="desktop-icon"
                                onClick={() => openWindow(file.name, file.url)}
                            >
                                <div className="icon-stack-large">
                                    {getFileIcon(file.type, 'icon-back')}
                                    {getFileIcon(file.type, 'icon-front')}
                                </div>
                                <span>{file.name}</span>
                            </div>
                        ))}
                    </div>


                    {/* Boucle  qui gere dynamiquement mes fenetre */}
                    {windows.map(win => (
                        <DraggableWindow
                            key={win.id}
                            id={win.id}
                            title={win.title}
                            src={win.src}
                            x={win.x}
                            y={win.y}
                            z={win.z}
                            onClose={closeWindow}
                            onFocus={bringToFront}
                        />
                    ))}

                    <MenuBar onOpenTerminal={() => openWindow("Terminal", "/terminal")} />
                </div>
            )}
        </>
    );
};

//retourne la page html
export default Home;