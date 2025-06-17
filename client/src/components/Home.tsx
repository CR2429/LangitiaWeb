import { useEffect, useState } from 'react';
import './Home.css';
import MenuBar from './MenuBar';
import DraggableWindow from './DraggableWindow';
import { FileItem, fetchFilesByPath } from '../object/FileSystem';
import { FileEarmarkFont, FileEarmarkImage, FileEarmarkPlay, Folder2 } from "react-bootstrap-icons";
import ContextMenu from './ContextMenu';


type WindowData = {
    id: number;
    title: string;
    src: string;
    x: number;
    y: number;
    z: number;
};


const Home = () => {
    const [step, setStep] = useState<'boot' | 'interface'>(
        localStorage.getItem('protocolApproved') === 'true' ? 'interface' : 'boot'
    );
    const [welcomeText, setWelcomeText] = useState('');
    const [showWelcome, setShowWelcome] = useState(false);
    const fullMessage = "Bienvenue dans le système Cartage";
    const [windows, setWindows] = useState<WindowData[]>([]);
    const [nextId, setNextId] = useState(1);
    const [nextZ, setNextZ] = useState(1);
    const [showLoginDiv, setShowLoginDiv] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [username, setUsername] = useState('');
    const [desktopFiles, setDesktopFiles] = useState<FileItem[]>([]);
    const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0 });

    // Faire apparaitre le menu contextuel
    useEffect(() => {
        const handleContextMenu = (event: MouseEvent) => {
            event.preventDefault();
            setContextMenu({ visible: true, x: event.clientX, y: event.clientY });
        };

        const handleClick = () => {
            setContextMenu((prev) => ({ ...prev, visible: false }));
        };

        document.addEventListener('contextmenu', handleContextMenu);
        document.addEventListener('click', handleClick);

        return () => {
            document.removeEventListener('contextmenu', handleContextMenu);
            document.removeEventListener('click', handleClick);
        };
    }, []);

    // Vérifier login local + backend
    useEffect(() => {
        const checkLogin = async () => {
            const token = localStorage.getItem('authToken');
            const savedUser = localStorage.getItem('authUser');

            if (token && savedUser) {
                setIsLoggedIn(true);
                setUsername(savedUser);

                try {
                    const res = await fetch('/api/validate-token', {
                        method: 'GET',
                        headers: { Authorization: `Bearer ${token}` },
                    });

                    if (res.ok) {
                        setIsLoggedIn(true);
                    } else {
                        localStorage.removeItem('authToken');
                        localStorage.removeItem('authUser');
                        setIsLoggedIn(false);
                        setUsername('');
                    }
                } catch (err) {
                    console.error('Erreur de validation du token :', err);
                }
            } else {
                setIsLoggedIn(false);
                setUsername('');
            }
        };

        checkLogin();
    }, []);

    // Transition : chargement → message
    // useEffect(() => {
    //     if (step === 'loading') {
    //         setTimeout(() => {
    //             setStep('interface');
    //             setShowWelcome(true);
    //         }, 3000);
    //     }
    // }, [step]);

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

    //Recuperer les fichiers et dossier
    useEffect(() => {
        if (step === 'interface') {
            const loadFiles = async () => {
                const files = await fetchFilesByPath('/home');

                // Tri alphabétique
                const sortedFiles = files.sort((a, b) =>
                    a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' })
                );

                setDesktopFiles(sortedFiles);
            };
            loadFiles();
        }
    }, [step]);

    //update toute les minutes
    useEffect(() => {
        if (step !== 'interface') return;

        const interval = setInterval(async () => {
            try {
                const latestFiles = await fetchFilesByPath('/home');

                // Tri alphabétique
                const sortedFiles = latestFiles.sort((a, b) =>
                    a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' })
                );

                const currentIds = desktopFiles.map(f => f.id).sort().join(',');
                const newIds = sortedFiles.map(f => f.id).sort().join(',');

                if (currentIds !== newIds) {
                    setDesktopFiles(sortedFiles);
                    console.log('✅ Mise à jour du bureau détectée');
                } else {
                    console.log('🟢 Aucun changement détecté');
                }

            } catch (err) {
                console.error('Erreur pendant la vérification des fichiers :', err);
            }
        }, 60000);

        return () => clearInterval(interval);
    }, [step, desktopFiles]);

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

    //Page de login - Open
    const handleOpenLogin = () => {
        setShowLoginDiv(true);
    };

    //Page de login - Close
    const handleCloseLogin = () => {
        setShowLoginDiv(false);
    };

    //Page de login - Submit
    const handleLoginSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        const user = (event.target as any).elements.user.value;
        const password = (event.target as any).elements.password.value;

        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user, password }),
            });
            const data = await res.json();

            if (res.ok) {
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('authUser', user);
                setUsername(user);
                setIsLoggedIn(true);
            } else {
                alert(`Erreur : ${data.message}`);
            }
        } catch (err) {
            console.error(err);
            alert('Erreur lors de la connexion.');
        }
    };

    //Page de login - Logout
    const handleLogout = () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
        setIsLoggedIn(false);
        setUsername('');
        setShowLoginDiv(false);
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
                return <div />;
        }
    };

    //clique sur le bouton de connexion
    const handleApproveProtocol = () => {
        localStorage.setItem('protocolApproved', 'true');
        setStep('interface');
    };


    return (
        <>
            {step === 'boot' && (
                <div className="main-interface">
                    <div className="boot-screen">
                        <h2>Bienvenue dans le système Cartage</h2>
                        <p className="boot-text">
                            En cliquant sur <strong>Connexion au système</strong>, vous reconnaissez avoir lu et accepté les <a href="/protocoles_de_securite" target="_blank" rel="noopener noreferrer">Protocoles de Sécurité</a>.
                        </p>
                        <button className="boot-button" onClick={handleApproveProtocol}>
                            Connexion au système
                        </button>
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

                    {/* Div login */}
                    {showLoginDiv && (
                        <div className="login-modal">
                            <div className="window-header">
                                <span>Connexion</span>
                                <button onClick={handleCloseLogin}>X</button>
                            </div>
                            {isLoggedIn ? (
                                <div className="login-modal-content">
                                    <p style={{ textAlign: "center", marginBottom: "10px" }}>Connecté en tant que <strong>{username}</strong></p>
                                    <button onClick={handleLogout}>Se déconnecter</button>
                                </div>
                            ) : (
                                <form onSubmit={handleLoginSubmit} className="login-modal-content">
                                    <input type="text" name="user" placeholder="Nom d’utilisateur" required />
                                    <input type="password" name="password" placeholder="Mot de passe" required />
                                    <button type="submit">Se connecter</button>
                                </form>
                            )}
                        </div>
                    )}

                    {/* Barre de menu */}
                    <MenuBar
                        onOpenTerminal={() => openWindow("Terminal", "/terminal")}
                        onOpenLogin={handleOpenLogin}
                    />

                    {/* Menu contextuel */}
                    <ContextMenu
                        x={contextMenu.x}
                        y={contextMenu.y}
                        visible={contextMenu.visible}
                        isLoggedIn={isLoggedIn}
                        onClose={() => setContextMenu((prev) => ({ ...prev, visible: false }))}
                        onOpenTerminal={() => openWindow("Terminal", "/terminal")}
                    />
                </div>
            )}
        </>
    );
};

//retourne la page html
export default Home;