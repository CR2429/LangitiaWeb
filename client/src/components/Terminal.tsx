import React, { useState, useRef, useEffect, useMemo } from 'react';
import './Terminal.css';

// =============================================================
// 🔧 UTIL - ID DRAGGABLE (optionnel pour compatibilité future)
// =============================================================
const useDraggableId = () => {
  return useMemo(() => {
    const p = new URLSearchParams(window.location.search);
    const v = Number(p.get('draggableId'));
    return Number.isFinite(v) ? v : undefined;
  }, []);
};

// =============================================================
// 💾 GESTION DU SYSTÈME DE FICHIERS LOCAL
// =============================================================
const getLocalFS = (): any => {
  const raw = localStorage.getItem('localFS');
  if (!raw) {
    const base = { root: { type: 'dir', children: { home: { type: 'dir', children: {} } } } };
    localStorage.setItem('localFS', JSON.stringify(base));
    return base;
  }
  return JSON.parse(raw);
};

const saveLocalFS = (fs: any) => localStorage.setItem('localFS', JSON.stringify(fs));

const resolvePath = (fs: any, path: string): any => {
  const parts = path.replace(/^\/+/, '').split('/').filter(Boolean);
  let node = fs.root;
  for (const part of parts) {
    if (!node.children[part]) return null;
    node = node.children[part];
  }
  return node;
};

// =============================================================
// 🧠 TERMINAL PRINCIPAL
// =============================================================
const Terminal: React.FC = () => {
  const [username] = useState(() => localStorage.getItem('authUser') || 'unlog');
  const [systemName] = useState('CartageOS');
  const [currentPath, setCurrentPath] = useState('/home');
  const [text, setText] = useState('');
  const [cursorIndex, setCursorIndex] = useState(0);
  const [output, setOutput] = useState<React.ReactNode[]>([]);
  const [hasFocus, setHasFocus] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // === Mode Nano ===
  const [nanoMode, setNanoMode] = useState(false);
  const [nanoText, setNanoText] = useState('');
  const [nanoFilename, setNanoFilename] = useState('');

  const terminalRef = useRef<HTMLDivElement>(null);
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const token = localStorage.getItem('authToken') || '';
  const draggableId = useDraggableId();

  // === Scroll automatique ===
  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    });
  };

  // === Focus sur clic ===
  useEffect(() => {
    const handleClick = () => terminalRef.current?.focus();
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  // =============================================================
  // 🎹 GESTION CLAVIER
  // =============================================================
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!hasFocus) return;
      scrollToBottom();

      // === MODE NANO ===
      if (nanoMode) {
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
            .catch(() => alert("Erreur lors de l'enregistrement du fichier."));
          return;
        }

        if (e.ctrlKey && e.key.toLowerCase() === 'q') {
          e.preventDefault();
          setNanoMode(false);
          setNanoText('');
          setNanoFilename('');
          return;
        }

        return;
      }

      // === MODE TERMINAL CLASSIQUE ===
      if (e.ctrlKey && e.key.toLowerCase() === 'v') return;

      if (e.key === 'Enter') {
        e.preventDefault();
        executeCommand(text);
        return;
      }

      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        const newText = text.slice(0, cursorIndex) + e.key + text.slice(cursorIndex);
        setText(newText);
        setCursorIndex(cursorIndex + 1);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        if (cursorIndex > 0) {
          const newText = text.slice(0, cursorIndex - 1) + text.slice(cursorIndex);
          setText(newText);
          setCursorIndex(cursorIndex - 1);
        }
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setCursorIndex(Math.max(0, cursorIndex - 1));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setCursorIndex(Math.min(text.length, cursorIndex + 1));
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
      if (nanoMode) setNanoText((prev) => prev + pasted);
      else {
        const newText = text.slice(0, cursorIndex) + pasted + text.slice(cursorIndex);
        setText(newText);
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

  // =============================================================
  // 📁 COMMANDES LOCALES
  // =============================================================
  const handleLocalCommand = (cmd: string, args: string[]): string => {
    const fs = getLocalFS();
    const dir = resolvePath(fs, currentPath);
    if (!dir) return `Chemin invalide (${currentPath})`;

    switch (cmd) {
      case 'ls':
        return Object.keys(dir.children).join('  ') || 'Dossier vide.';
      case 'cd': {
        const target = args[0];
        if (!target) return 'Usage : cd <dossier>';
        if (target === '..') {
          if (currentPath === '/home') return 'Déjà à la racine.';
          const newPath = currentPath.split('/').slice(0, -1).join('/') || '/';
          setCurrentPath(newPath);
          return '';
        }
        const next = dir.children[target];
        if (!next || next.type !== 'dir') return `Aucun dossier nommé "${target}".`;
        setCurrentPath(`${currentPath}/${target}`.replace(/\/+/g, '/'));
        return '';
      }
      case 'mkdir': {
        const name = args[0];
        if (!name) return 'Usage : mkdir <nom>';
        if (dir.children[name]) return 'Dossier déjà existant.';
        dir.children[name] = { type: 'dir', children: {} };
        saveLocalFS(fs);
        return `Dossier "${name}" créé.`;
      }
      case 'rmdir': {
        const name = args[0];
        if (!name) return 'Usage : rmdir <nom>';
        const target = dir.children[name];
        if (!target || target.type !== 'dir') return 'Dossier introuvable.';
        if (Object.keys(target.children).length > 0) return 'Dossier non vide.';
        delete dir.children[name];
        saveLocalFS(fs);
        return `Dossier "${name}" supprimé.`;
      }
      case 'mv': {
        const [src, dest] = args;
        if (!src || !dest) return 'Usage : mv <source> <destination>';
        if (!dir.children[src]) return `Aucun élément nommé "${src}".`;
        dir.children[dest] = dir.children[src];
        delete dir.children[src];
        saveLocalFS(fs);
        return `Déplacé/renommé "${src}" → "${dest}".`;
      }
      default:
        return '';
    }
  };

  // =============================================================
  // ⚙️ EXÉCUTION DE COMMANDE
  // =============================================================
  const executeCommand = async (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;

    const [cmd, ...args] = trimmed.split(/\s+/);

    const commandLine = (
      <pre className="terminal-line">
        <samp>
          <span className="prompt-user-host">{username}@{systemName}</span>:
          <span className="prompt-path">~{currentPath}$ </span>
          <kbd>{trimmed}</kbd>
        </samp>
      </pre>
    );
    setOutput((prev) => [...prev, commandLine]);
    setText('');

    const localCommands = ['ls', 'cd', 'mkdir', 'rmdir', 'mv'];

    try {
      if (localCommands.includes(cmd)) {
        const result = handleLocalCommand(cmd, args);
        if (result) {
          setOutput((prev) => [...prev, <pre className="terminal-line"><samp>{result}</samp></pre>]);
        }
      } else {
        const response = await fetch('/api/terminal', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ command: trimmed, path: currentPath }),
        });
        const data = await response.ok ? await response.json() : { output: `Erreur : ${response.statusText}` };

        // Mode nano
        if (data.action === 'openEditor') {
          const fileRes = await fetch(`/api/terminal/nano?filename=${data.filename}&path=${currentPath}`);
          const fileData = await fileRes.json();
          setNanoText(fileData.content || '');
          setNanoFilename(data.filename);
          setNanoMode(true);
          return;
        }

        if (data.output) {
          const lines = String(data.output).split('\n');
          const out = lines.map((line, i) => (
            <pre key={`out-${i}`} className="terminal-line"><samp>{line}</samp></pre>
          ));
          setOutput((prev) => [...prev, ...out]);
        }
      }
    } catch (err) {
      setOutput((prev) => [
        ...prev,
        <pre className="terminal-line"><samp>Erreur : {(err as Error).message}</samp></pre>,
      ]);
    }

    setHistory((prev) => [...prev.filter((c) => c !== trimmed), trimmed]);
    setHistoryIndex(-1);
    setText('');
    setCursorIndex(0);
    scrollToBottom();
  };

  // =============================================================
  // 🖥️ RENDU
  // =============================================================
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

      {/* === MODE NANO === */}
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
