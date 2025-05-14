import React, { useState, useRef, useEffect } from 'react';

interface TerminalProps {
  token: string;
}

const Terminal: React.FC<TerminalProps> = ({ token }) => {
  const [output, setOutput] = useState<React.ReactNode[]>([]);
  const [input, setInput] = useState('');
  const [username] = useState('unlog');
  const [currentPath] = useState('/home');
  const terminalEndRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [output]);

  useEffect(() => {
    const root = document.getElementById('root');
    if (root) {
      root.style.width = '100vw';
      root.style.height = '100vh';
      root.style.margin = '0';
      root.style.padding = '0';
    }
  }, []);

  const handleCommand = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (input.trim() === '') return;

    const promptElement = (
      <div>
        <span style={{ color: '#8add38', fontWeight: 'bold' }}>{username}@langitia.com</span>
        <span style={{ color: '#5f98ce', fontWeight: 'bold', paddingRight: '8px' }}>: {currentPath} $</span>
        <span>{input}</span>
      </div>
    );

    setOutput((prev) => [...prev, promptElement]);

    try {
      const response = await fetch('/api/terminal', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ command: input, path: currentPath })
      });

      if (!response.ok) {
        throw new Error('Erreur serveur');
      }

      const data = await response.json();
      setOutput((prev) => [...prev, data.output]);
    } catch (error: any) {
      setOutput((prev) => [...prev, `Erreur : ${error.message}`]);
    }

    setInput('');
  };

  return (
    <div style={{
      backgroundColor: 'black',
      color: 'white',
      fontFamily: 'monospace',
      fontSize: '13pt',
      width: '100%',
      height: '100%',
      margin: 0,
      padding: '1em',
      boxSizing: 'border-box',
      overflowY: 'auto'
    }}>
      <div id="output">
        {output.map((line, index) => (
          <div key={index}>{line}</div>
        ))}
        <div ref={terminalEndRef} />
      </div>
      <form onSubmit={handleCommand} style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
        <div id="prompt" style={{ whiteSpace: 'nowrap', userSelect: 'none' }}>
          <span style={{ color: '#8add38', fontWeight: 'bold' }}>{username}@langitia.com</span>
          <span style={{ color: '#5f98ce', fontWeight: 'bold', paddingRight: '8px' }}>: {currentPath} $ </span>
        </div>
        <div style={{ flexGrow: 1 }}>
          <input
            id="cmdline"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            style={{
              width: '100%',
              outline: 'none',
              backgroundColor: 'transparent',
              margin: 0,
              font: 'inherit',
              border: 'none',
              color: 'inherit'
            }}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            autoFocus
          />
        </div>
      </form>
    </div>
  );
};

export default Terminal;
