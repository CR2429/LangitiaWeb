import React, { useState, useRef, useEffect } from 'react';
import './Terminal.css';

const Terminal: React.FC = () => {
  const [username, setUsername] = useState(() => localStorage.getItem('authUser') || 'unlog');
  const [systemName] = useState('CartageOS');
  const [currentPath, setCurrentPath] = useState('/home');
  const [text, setText] = useState('');
  const [cursorIndex, setCursorIndex] = useState(0);
  const [hasFocus, setHasFocus] = useState(false);
  const [output, setOutput] = useState<React.ReactNode[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const [nanoMode, setNanoMode] = useState(false);
  const [nanoText, setNanoText] = useState('');
  const [nanoFilename, setNanoFilename] = useState('');

  const terminalRef = useRef<HTMLDivElement>(null);
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const token = localStorage.getItem('authToken') || '';

  const prompt = (
    <>
      <span className="prompt-user-host">{username}@CartageOS:</span>
      <span className="prompt-path">~{currentPath} $ </span>
    </>
  );

  // Focus sur clic
  useEffect(() => {
    const handleClick = () => terminalRef.current?.focus();
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  // Gestion clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!hasFocus) return;

      scrollToBottom();

      // === MODE NANO ===
      if (nanoMode) {
        if (e.ctrlKey && e.key === 's') {
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
          }).then(() => {
            setNanoMode(false);
            setNanoText('');
            setNanoFilename('');
          }).catch((err) => {
            console.error('Erreur lors de l’enregistrement :', err);
            alert("Erreur lors de l'enregistrement du fichier.");
          });
          return;
        }

        if (e.ctrlKey && e.key === 'q') {
          e.preventDefault();
          setNanoMode(false);
          setNanoText('');
          setNanoFilename('');
          return;
        }

        if (e.key === 'Backspace') {
          e.preventDefault();
          setNanoText(prev => prev.slice(0, -1));
        } else if (e.key.length === 1) {
          e.preventDefault();
          setNanoText(prev => prev + e.key);
        } else if (e.key === 'Enter') {
          e.preventDefault();
          setNanoText(prev => prev + '\n');
        }

        return;
      }
      // === TERMINAL NORMAL ===
      else {
        
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
      }

    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasFocus, nanoMode, text, cursorIndex, nanoText, nanoFilename, currentPath, history, historyIndex]);

  // Mettre a jour le nom de l'utilisateur
  useEffect(() => {
    const syncUsername = () => {
      const storedUser = localStorage.getItem('authUser') || 'unlog';
      setUsername(storedUser);
    };

    window.addEventListener('storage', syncUsername);
    return () => window.removeEventListener('storage', syncUsername);
  }, []);

  // Scroll down
  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    });
  };

  // Executer les commandes
  const executeCommand = async (command: string) => {
    // Ajoute la ligne avec le prompt et la commande tapée
    const commandLine = (
      <p className="terminal-line">
        <span className="prompt-user-host">{username}@{systemName}:</span>
        <span className="prompt-path">~{currentPath} $ </span>
        <span>{command}</span>
      </p>
    );
    setOutput(prev => [...prev, commandLine]);
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

      if (data.action === 'openEditor') {
        if (data.appendOnly) {
          setNanoText('');
          setNanoFilename(data.filename);
          setNanoMode(true);
          setText('');
          setHistory(prev => [...prev.filter(c => c !== command), command]);
          setHistoryIndex(-1);
          setCursorIndex(0);
          return;
        }

        const fileRes = await fetch(`/api/terminal/nano?filename=${data.filename}&path=${currentPath}`);
        const fileData = await fileRes.json();

        const initial = fileData.appendOnly ? fileData.content + '\n' : fileData.content;
        setNanoText(initial);
        setNanoFilename(data.filename);
        setNanoMode(true);
        setText('');
        setHistory(prev => [...prev.filter(c => c !== command), command]);
        setHistoryIndex(-1);
        setCursorIndex(0);
        return;
      }

      if (data.output) {
        const lines = String(data.output).split('\n');
        const outputLines = lines.map((line, index) => (
          <p key={`out-${index}`} className="terminal-line">{line}</p>
        ));
        setOutput(prev => [...prev, ...outputLines]);
      }

    } catch (err) {
      setOutput(prev => [...prev, <p className="terminal-line">Erreur : {(err as Error).message}</p>]);
    }

    setHistory(prev => [...prev.filter(c => c !== command), command]);
    setHistoryIndex(-1);
    setText('');
    setCursorIndex(0);
    scrollToBottom();
  };

  // Render text with cursor
  const renderCurrentLine = () => {
    const before = text.slice(0, cursorIndex);
    const after = text.slice(cursorIndex);
    return (
      <>
        {prompt}
        <span>{before}</span>
        <span className="cursor"></span>
        <span>{after}</span>
      </>
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
      {!nanoMode && output.map((line, index) => (
        <div key={index}>{line}</div>
      ))}
      {!nanoMode && renderCurrentLine()}
      {nanoMode && (
        <>
          {(() => {
            const lines = nanoText.split('\n');
            const lastLine = lines.pop() || '';
            return (
              <>
                {lines.map((line, i) => (
                  <p key={`nano-line-${i}`} className="nano-line">{line}</p>
                ))}
                <p className="nano-line">
                  {lastLine}
                  <span className="cursor" />
                </p>
              </>
            );
          })()}

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
