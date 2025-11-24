// Terminal.tsx
import React, { useState, useRef, useEffect, useMemo } from 'react';
import './Terminal.css';
import {
  loadLocalFS,
  saveLocalFS,
  listFilesAtPath,
  directoryExists,
  normalizePath,
  parentPath,
  getFullPath,
  FileNode,
  LocalFS
} from '../utils/FileSystem';

// Id draggable, au cas où tu veux t'en servir plus tard
const useDraggableId = () => {
  return useMemo(() => {
    const p = new URLSearchParams(window.location.search);
    const v = Number(p.get('draggableId'));
    return Number.isFinite(v) ? v : undefined;
  }, []);
};

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

  // Mode "nano" simplifié
  const [nanoMode, setNanoMode] = useState(false);
  const [nanoText, setNanoText] = useState('');
  const [nanoFilename, setNanoFilename] = useState('');

  const terminalRef = useRef<HTMLDivElement>(null);
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const draggableId = useDraggableId();

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    });
  };

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

      // Mode nano
      if (nanoMode) {
        if (e.ctrlKey && e.key.toLowerCase() === 's') {
          e.preventDefault();
          // Ici, tu pourras plus tard brancher la sauvegarde sur le FS
          setNanoMode(false);
          setNanoText('');
          setNanoFilename('');
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

      // Terminal classique
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
      if (nanoMode) setNanoText(prev => prev + pasted);
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
  }, [hasFocus, nanoMode, text, cursorIndex, nanoText, nanoFilename, currentPath, history, historyIndex]);

  // Commandes locales
  const handleLocalCommand = (cmd: string, args: string[]): string => {
    let fs = loadLocalFS();

    switch (cmd) {
      case 'ls': {
        const entries = listFilesAtPath(fs, currentPath);
        if (entries.length === 0) return 'Dossier vide.';
        return entries.map(e => e.nom).join('  ');
      }

      case 'cd': {
        const target = args[0];
        if (!target) return 'Usage : cd <dossier>';

        if (target === '..') {
          if (currentPath === '/home' || currentPath === '/') {
            return 'Deja a la racine.';
          }
          const newPath = parentPath(currentPath);
          setCurrentPath(newPath);
          return '';
        }

        const newPath = normalizePath(
          target.startsWith('/') ? target : currentPath + '/' + target
        );

        if (!directoryExists(fs, newPath)) {
          return `Aucun dossier nommé "${target}".`;
        }

        setCurrentPath(newPath);
        return '';
      }

      case 'mkdir': {
        const name = args[0];
        if (!name) return 'Usage : mkdir <nom>';

        if (name.includes('/') || name.includes('\\')) {
          return 'Nom invalide.';
        }

        const existing = listFilesAtPath(fs, currentPath).find(f => f.nom === name);
        if (existing) return 'Element deja existant.';

        const newDir: FileNode = {
          id: crypto.randomUUID(),
          nom: name,
          type: 'dir',
          path: normalizePath(currentPath),
          updatedAt: new Date().toISOString()
        };

        const newFS: LocalFS = { files: [...fs.files, newDir] };
        saveLocalFS(newFS);
        return `Dossier "${name}" créé.`;
      }

      case "rmdir": {
        const name = args[0];
        if (!name) return 'Usage : rmdir <nom>';

        const dirNode = fs.files.find(
          f =>
            f.type === 'dir' &&
            f.nom === name &&
            normalizePath(f.path) === normalizePath(currentPath)
        );
        if (!dirNode) return 'Dossier introuvable.';

        const dirFullPath = getFullPath(dirNode);   // ex: "/home/test"
        const parentPath = normalizePath(currentPath); // ex: "/home"

        // 1️⃣ On modifie tous les enfants pour les remonter d’un niveau
        const updatedFiles = fs.files.map(f => {
          const fPath = normalizePath(f.path);

          // Si l'élément est un enfant direct ou en profondeur
          if (fPath.startsWith(dirFullPath)) {
            const rest = fPath.substring(dirFullPath.length);   // ex: "/test2"
            const newPath = normalizePath(parentPath + rest);   // ex: "/home/test2"
            return { ...f, path: newPath };
          }

          return f;
        });

        // 2️⃣ On supprime uniquement le dossier ciblé
        const newFS: LocalFS = {
          files: updatedFiles.filter(f => f.id !== dirNode.id)
        };

        saveLocalFS(newFS);
        return `Dossier "${name}" supprimé.`;
      }

      case 'mv': {
        const [srcName, destArg] = args;
        if (!srcName || !destArg) return 'Usage : mv <source> <destination>';

        const srcNode = fs.files.find(
          f =>
            f.nom === srcName &&
            normalizePath(f.path) === normalizePath(currentPath)
        );
        if (!srcNode) return `Aucun élément nommé "${srcName}".`;

        let destPath: string;
        let destName: string;

        if (destArg === '..' || destArg === '../') {
          destPath = parentPath(currentPath);
          destName = srcName;
        } else {
          const rawFull = destArg.startsWith('/')
            ? destArg
            : currentPath.replace(/\/+$/, '') + '/' + destArg;

          const full = normalizePath(rawFull);
          const parts = full.split('/').filter(Boolean);
          if (parts.length === 0) return 'Destination invalide.';

          const last = parts[parts.length - 1];
          const dirCandidate = '/' + parts.slice(0, -1).join('/');
          const dirCandidateNormalized = dirCandidate === '/' ? '/' : normalizePath(dirCandidate);

          const hasDir = fs.files.some(
            f => f.type === 'dir' && getFullPath(f) === full
          );

          if (hasDir) {
            destPath = full;
            destName = srcName;
          } else {
            destPath = dirCandidateNormalized;
            destName = last;
          }
        }

        if (!directoryExists(fs, destPath)) {
          return 'Dossier de destination introuvable.';
        }

        const conflict = fs.files.find(
          f =>
            f.nom === destName &&
            normalizePath(f.path) === normalizePath(destPath)
        );
        if (conflict && conflict.id !== srcNode.id) {
          return 'Un element existe deja a cet emplacement.';
        }

        const newFS: LocalFS = {
          files: fs.files.map(f =>
            f.id === srcNode.id
              ? {
                  ...f,
                  nom: destName,
                  path: normalizePath(destPath),
                  updatedAt: new Date().toISOString()
                }
              : f
          )
        };

        saveLocalFS(newFS);
        return `Deplacé/renommé "${srcName}" vers ${normalizePath(destPath)}/${destName}.`;
      }

      default:
        return `Commande inconnue: ${cmd}`;
    }
  };

  const executeCommand = (raw: string) => {
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
    setOutput(prev => [...prev, commandLine]);
    setText('');

    try {
      const result = handleLocalCommand(cmd, args);
      if (result) {
        setOutput(prev => [
          ...prev,
          <pre className="terminal-line" key={prev.length + 1}>
            <samp>{result}</samp>
          </pre>
        ]);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erreur inconnue.';
      setOutput(prev => [
        ...prev,
        <pre className="terminal-line" key={prev.length + 1}>
          <samp>Erreur : {message}</samp>
        </pre>
      ]);
    }

    setHistory(prev => [...prev.filter(c => c !== trimmed), trimmed]);
    setHistoryIndex(-1);
    setText('');
    setCursorIndex(0);
    scrollToBottom();
  };

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

      {nanoMode && (
        <>
          <pre
            className="nano-line"
            contentEditable
            suppressContentEditableWarning
            onInput={e => setNanoText(e.currentTarget.textContent || '')}
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
