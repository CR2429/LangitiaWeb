import React, { useState, useRef, useEffect } from 'react';
import './Terminal.css';

const Terminal: React.FC = () => {
  const [username, setUsername] = useState(() => {
    return localStorage.getItem('authUser') || 'unlog';
  });

  const [systemName] = useState('CartageOS');
  const [currentPath, setCurrentPath] = useState('/home');
  const [userInput, setUserInput] = useState('');
  const [output, setOutput] = useState<React.ReactNode[]>([]);
  const [isWaiting, setIsWaiting] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [cursorIndex, setCursorIndex] = useState(0);
  const [hasFocus, setHasFocus] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorContent, setEditorContent] = useState('');
  const [editorFilename, setEditorFilename] = useState('');
  const [editorAppendOnly, setEditorAppendOnly] = useState(false);

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const hiddenInputRef = useRef<HTMLTextAreaElement>(null);
  const token = localStorage.getItem('authToken') || '';
  const prompt = `${username}@${systemName}: ${currentPath} $`;

  useEffect(() => {
    hiddenInputRef.current?.focus();
  }, [userInput]);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [output]);

  useEffect(() => {
    const syncUsername = () => {
      const storedUser = localStorage.getItem('authUser') || 'unlog';
      setUsername(storedUser);
    };

    window.addEventListener('storage', syncUsername);
    return () => window.removeEventListener('storage', syncUsername);
  }, []);

  // CTRL + S pour sauvegarder avec nano
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (editorOpen && e.ctrlKey && e.key === 's') {
        e.preventDefault();

        await fetch('/api/terminal/nano', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: editorFilename,
            path: currentPath,
            content: editorContent
          })
        });

        setEditorOpen(false);
        setEditorContent('');
        setEditorFilename('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editorOpen, editorContent, editorFilename, currentPath]);

  // traiter la commande
  const handleCommand = async (command: string) => {
    if (!command.trim()) return;

    // affichage du prompre (exemple => CR2429@CartageOS : /home $)
    const promptElement = (
      <div className="line">
        <span className="prompt">
          <span className="user">{username}</span>
          @
          <span className="host">{systemName}</span>
          : <span className="path">{currentPath}</span> $
        </span>
        <span className="input"> {command}</span>
      </div>
    );

    setOutput(prev => [...prev, promptElement]);
    setHistory(prev => [...prev, command]);
    setHistoryIndex(-1);
    setIsWaiting(true);

    try {
      //envoie de la requete a l'api
      console.log('Token utilisé :', token);
      const response = await fetch('/api/terminal', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ command, path: currentPath })
      });

      //traitement de la requete
      const data = await response.ok ? await response.json() : { output: `Erreur : ${response.statusText}` };

      // commande cd
      if (data.newPath) {
        setCurrentPath(data.newPath);
      }

      // commande nano
      if (data.action === 'openEditor') {
        setEditorOpen(true);
        setEditorFilename(data.filename);

        const fileRes = await fetch(`/api/terminal/nano?filename=${data.filename}&path=${currentPath}`);
        const fileData = await fileRes.json();

        const initial = fileData.appendOnly ? (fileData.content + '\n') : fileData.content;
        setEditorContent(initial);
        setEditorAppendOnly(fileData.appendOnly);
      } else if (data.output) {
        // autre commande
        setOutput(prev => [...prev, data.output]);
      }
    } catch (error: any) {
      setOutput(prev => [...prev, `Erreur : ${error.message}`]);
    }

    setUserInput('');
    setIsWaiting(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (isWaiting) return;

    if (e.key === 'Enter') {
      e.preventDefault();
      handleCommand(userInput);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0) {
        const newIndex = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1);
        setUserInput(history[newIndex]);
        setHistoryIndex(newIndex);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (history.length > 0) {
        const newIndex = historyIndex === -1 ? -1 : Math.min(history.length - 1, historyIndex + 1);
        if (newIndex >= 0) {
          setUserInput(history[newIndex]);
          setHistoryIndex(newIndex);
        } else {
          setUserInput('');
          setHistoryIndex(-1);
        }
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setCursorIndex((prev) => Math.max(0, prev - 1));
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setCursorIndex((prev) => Math.min(userInput.length, prev + 1));
    }
  };

  return (
    <div className="terminal-container" onClick={() => hiddenInputRef.current?.focus()}>
      <div className="terminal-output">
        {output.map((line, index) => (
          <div key={index}>{line}</div>
        ))}
        <div className="line">
          <span className="prompt">
            <span className="user">{username}</span>
            @
            <span className="host">{systemName}</span>
            : <span className="path">{currentPath}</span> $
          </span>
          <span className="input">
            {userInput.slice(0, cursorIndex)}
            {hasFocus && <span className="cursor" />}
            {userInput.slice(cursorIndex)}
          </span>
        </div>
        <div ref={terminalEndRef} />
      </div>

      {/* Invisible textarea to capture input */}
      <textarea
        ref={hiddenInputRef}
        value={userInput}
        onChange={(e) => {
          const newText = e.target.value;
          const diff = newText.length - userInput.length;

          // ajuster en fonction de l'action à la position du curseur
          const newIndex = cursorIndex + diff;
          setUserInput(newText);
          setCursorIndex(Math.max(0, Math.min(newText.length, newIndex)));
        }}
        onKeyDown={handleKeyDown}
        className="hidden-textarea"
        spellCheck={false}
        autoCorrect="off"
        autoCapitalize="off"
        autoFocus
        onFocus={() => setHasFocus(true)}
        onBlur={() => setHasFocus(false)}
        disabled={editorOpen}
      />

      {/* ✅ ÉDITEUR NANO PAR DESSUS */}
      {editorOpen && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#000',
          zIndex: 999,
          display: 'flex',
          flexDirection: 'column'
        }}>
          <textarea
            autoFocus
            value={editorContent}
            onChange={(e) => {
              if (editorAppendOnly) {
                const lines = editorContent.split('\n');
                const preserved = lines.slice(0, -1).join('\n') + '\n';
                const newValue = e.target.value;
                if (!newValue.startsWith(preserved)) return;
              }
              setEditorContent(e.target.value);
            }}
            style={{
              flexGrow: 1,
              backgroundColor: '#000',
              color: '#fff',
              fontFamily: 'monospace',
              border: 'none',
              resize: 'none',
              padding: '10px',
              fontSize: '14px',
              outline: 'none',
            }}
          />
          <div style={{
            backgroundColor: '#111',
            color: '#ccc',
            textAlign: 'center',
            padding: '6px',
            fontFamily: 'monospace',
            fontSize: '13px'
          }}>
            CTRL + S : Quitter et Sauvegarder
          </div>
        </div>
      )}

    </div>
  );
};

export default Terminal;
