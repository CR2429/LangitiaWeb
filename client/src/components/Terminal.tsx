import React, { useState, useRef, useEffect } from 'react';
import './Terminal.css';

const Terminal: React.FC = () => {
  const [username, setUsername] = useState(() => {
    return localStorage.getItem('authUser') || 'unlog';
  });

  const [systemName] = useState('CartageOS');
  const [currentPath] = useState('/home');
  const [userInput, setUserInput] = useState('');
  const [output, setOutput] = useState<React.ReactNode[]>([]);
  const [isWaiting, setIsWaiting] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [cursorIndex, setCursorIndex] = useState(0);


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

  const handleCommand = async (command: string) => {
    if (!command.trim()) return;

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

    // commande spéciale : login
    if (command.startsWith('login ')) {
      const newUser = command.split(' ')[1];
      setUsername(newUser);
      setOutput(prev => [...prev, `Utilisateur connecté : ${newUser}`]);
      setUserInput('');
      setIsWaiting(false);
      return;
    }

    try {
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

      const data = await response.ok ? await response.json() : { output: `Erreur : ${response.statusText}` };
      setOutput(prev => [...prev, data.output]);
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

  const updateUserInput = (text: string) => {
    setUserInput(text);
    setCursorIndex(text.length);
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
            <span className="cursor" />
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
      />

    </div>
  );
};

export default Terminal;
