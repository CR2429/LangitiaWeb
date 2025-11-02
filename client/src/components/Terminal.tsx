import React, { useState, useRef, useEffect, useMemo } from 'react';
import './Terminal.css';

const useDraggableId = () => {
  return useMemo(() => {
    const p = new URLSearchParams(window.location.search);
    const v = Number(p.get('draggableId'));
    return Number.isFinite(v) ? v : undefined;
  }, []);
};

const Terminal: React.FC = () => {
  // === États principaux ===
  const [username, setUsername] = useState(() => localStorage.getItem('authUser') || 'unlog');
  const [systemName] = useState('CartageOS');
  const [currentPath, setCurrentPath] = useState('/home');
  const [text, setText] = useState('');
  const [cursorIndex, setCursorIndex] = useState(0);
  const [hasFocus, setHasFocus] = useState(false);
  const [output, setOutput] = useState<React.ReactNode[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // === Mode Nano ===
  const [nanoMode, setNanoMode] = useState(false);
  const [nanoText, setNanoText] = useState('');
  const [nanoFilename, setNanoFilename] = useState('');

  // === Références ===
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const token = localStorage.getItem('authToken') || '';
  const draggableId = useDraggableId();

  // === Focus sur clic ===
  useEffect(() => {
    const handleClick = () => terminalRef.current?.focus();
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  // === Scroll vers le bas ===
  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    });
  };

  // === Gestion clavier ===
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!hasFocus) return;

      scrollToBottom();

      // === MODE NANO SIMPLIFIÉ ===
      if (nanoMode) {
        // CTRL + S → Sauvegarder
        if (e.ctrlKey && e.key.toLowerCase() === 's') {
          e.preventDefault();
          fetch('/api/terminal/nano', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              filename: nanoFilename,
              path: currentPath,
              content: nanoText,
            }),
          })
            .then(() => {
              setNanoMode(false);
              setNanoText('');
              setNanoFilename('');
            })
            .catch((err) => {
              console.error('Erreur lors de l’enregistrement :', err);
              alert("Erreur lors de l'enregistrement du fichier.");
            });
          return;
        }

        // CTRL + Q → Quitter
        if (e.ctrlKey && e.key.toLowerCase() === 'q') {
          e.preventDefault();
          setNanoMode(false);
          setNanoText('');
          setNanoFilename('');
          return;
        }

        // Le reste est géré directement par contentEditable → aucune action ici
        return;
      }

      // === TERMINAL NORMAL ===
      if (e.ctrlKey && e.key.toLowerCase() === 'v') {
        // Laisse le paste handler gérer ça
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        executeCommand(text);
        return;
      }

      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        const before = text.slice(0, cursorIndex);
        const after = text.slice(cursorIndex);
        const newText = before + e.key + after;
        setText(newText);
        setCursorIndex(cursorIndex + 1);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        if (cursorIndex > 0) {
          const before = text.slice(0, cursorIndex - 1);
          const after = text.slice(cursorIndex);
          setText(before + after);
          setCursorIndex(cursorIndex - 1);
        }
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setCursorIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setCursorIndex((prev) => Math.min(text.length, prev + 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (history.length > 0) {
          const newIndex = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1);
          setText(history[newIndex]);
          setCursorIndex(history[newIndex].length);
          setHistoryIndex(newIndex);
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (history.length > 0) {
          const newIndex = historyIndex === -1 ? -1 : Math.min(history.length - 1, historyIndex + 1);
          if (newIndex >= 0) {
            setText(history[newIndex]);
            setCursorIndex(history[newIndex].length);
          } else {
            setText('');
            setCursorIndex(0);
          }
          setHistoryIndex(newIndex);
        }
      }
    };

    const handlePaste = (e: ClipboardEvent) => {
      const pasted = e.clipboardData?.getData('text') || '';
      if (!pasted) return;
      e.preventDefault();

      if (nanoMode) {
        setNanoText((prev) => prev + pasted);
      } else {
        const before = text.slice(0, cursorIndex);
        const after = text.slice(cursorIndex);
        setText(before + pasted + after);
        setCursorIndex(cursorIndex + pasted.length);
      }

      scrollToBottom();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('paste', handlePaste);
    };
  }, [hasFocus, nanoMode, text, cursorIndex, nanoText, nanoFilename, currentPath, history, historyIndex, token]);

  // === Exécution des commandes ===
  const executeCommand = async (command: string) => {
    // Ajoute la ligne avec le prompt et la commande tapée
    const commandLine = (
      <pre className="terminal-line">
        <samp>
          <span className="prompt-user-host">{username}@{systemName}</span>:
          <span className="prompt-path">~{currentPath}$ </span>
          <kbd>{command}</kbd>
        </samp>
      </pre>
    );
    setOutput((prev) => [...prev, commandLine]);
    setText('');

    try {
      const response = await fetch('/api/terminal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ command, path: currentPath }),
      });

      const data = await response.ok ? await response.json() : { output: `Erreur : ${response.statusText}` };

      if (data.newPath) setCurrentPath(data.newPath);

      // === Action : ouvrir le mode nano ===
      if (data.action === 'openEditor') {
        const fileRes = await fetch(`/api/terminal/nano?filename=${data.filename}&path=${currentPath}`);
        const fileData = await fileRes.json();
        setNanoText(fileData.content || '');
        setNanoFilename(data.filename);
        setNanoMode(true);
        setText('');
        return;
      }

      // === Action : ouvrir une fenêtre ===
      if (data.action === 'openWindow') {
        const payload = {
          type: 'openWindow',
          payload: {
            title: 'Éditeur de fichier',
            src: data.src,
          },
        };
        window.parent.postMessage(payload, '*');
      }

      // === Affichage du résultat ===
      if (data.output) {
        const lines = String(data.output).split('\n');
        const outputLines = lines.map((line, index) => (
          <pre key={`out-${index}`} className="terminal-line"><samp>{line}</samp></pre>
        ));
        setOutput((prev) => [...prev, ...outputLines]);
      }
    } catch (err) {
      setOutput((prev) => [
        ...prev,
        <pre className="terminal-line"><samp>Erreur : {(err as Error).message}</samp></pre>,
      ]);
    }

    setHistory((prev) => [...prev.filter((c) => c !== command), command]);
    setHistoryIndex(-1);
    setText('');
    setCursorIndex(0);
    scrollToBottom();
  };

  // === Rendu du texte courant avec curseur ===
  const renderCurrentLine = () => {
    const before = text.slice(0, cursorIndex);
    const after = text.slice(cursorIndex);
    return (
      <pre className="terminal-line">
        <samp>
          <span className="prompt-user-host">{username}@{systemName}</span>:
          <span className="prompt-path">~{currentPath}$ </span>
          <kbd>{before}</kbd>
          <span className={`cursor ${!hasFocus ? 'hidden' : ''}`} />
          <kbd>{after}</kbd>
        </samp>
      </pre>
    );
  };

  return (
    <div
      className="terminal-container"
      tabIndex={0}
      ref={terminalRef}
      onFocus={() => setHasFocus(true)}
      onBlur={() => setHasFocus(false)}
    >
      {!nanoMode && output.map((line, index) => <div key={index}>{line}</div>)}
      {!nanoMode && renderCurrentLine()}

      {/* === MODE NANO SIMPLIFIÉ === */}
      {nanoMode && (
        <>
          <pre
            className="nano-line"
            contentEditable
            suppressContentEditableWarning
            onInput={(e) => setNanoText(e.currentTarget.textContent || '')}
          >
            {nanoText}
          </pre>

          <div className="nano-instructions-fixed">
            CTRL+S: Sauvegarder | CTRL+Q: Quitter
          </div>
        </>
      )}

      <div ref={terminalEndRef} />
    </div>
  );
};

export default Terminal;
