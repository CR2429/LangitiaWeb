import { useEffect, useState } from 'react';
import './Home.css';
import MenuBar from './MenuBar';
import DraggableWindow from './DraggableWindow';
import { Terminal, FileText, Image, Folder, Film } from "react-bootstrap-icons";


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