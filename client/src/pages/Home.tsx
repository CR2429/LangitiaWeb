import { useEffect, useState } from 'react';
import './Home.css';
import MenuBar from '../components/MenuBar';

type WindowData = {
    id: number;
    title: string;
    src: string;
};

const Home = () => {
    const [step, setStep] = useState<'loading' | 'welcome' | 'interface'>('loading');
    const [welcomeText, setWelcomeText] = useState('');
    const [showWelcome, setShowWelcome] = useState(false);
    const fullMessage = "Bienvenue dans le système Cartage";
    const [windows, setWindows] = useState<WindowData[]>([]);
    const [nextId, setNextId] = useState(1);

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
            src
        };
        setWindows(prev => [...prev, newWindow]);
        setNextId(prev => prev + 1);
    };

    //fermer une fenetre
    const closeWindow = (id: number) => {
        setWindows(prev => prev.filter(win => win.id !== id));
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
                    {windows.map((win) => (
                        <div key={win.id} className="window-terminal" style={{ top: 60 + win.id * 20, left: 60 + win.id * 20 }}>
                            <div className="window-header">
                                <span>{win.title}</span>
                                <button onClick={() => closeWindow(win.id)}>✕</button>
                            </div>
                            <iframe src={win.src} title={win.title} />
                        </div>
                    ))}

                    <MenuBar onOpenTerminal={() => openWindow("Terminal", "/terminal")} />
                </div>
            )}
        </>
    );
};

//retourne la page html
export default Home;