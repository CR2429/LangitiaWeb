import React, { useState, useRef, useEffect } from 'react';

const Terminal = () => {
  const [output, setOutput] = useState([]);
  const [input, setInput] = useState('');
  const [username, setUsername] = useState('unlog');
  const terminalEndRef = useRef(null);

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

  const handleCommand = (e) => {
    e.preventDefault();
    if (input.trim() === '') return;

    const promptLine = (
      <div>
        <span style={{ color: '#8add38', fontWeight: 'bold' }}>{username}@langitia.com</span>
        <span style={{ color: '#5f98ce', fontWeight: 'bold', paddingInline: '8px' }}> : /home $ </span>
        <span>{input}</span>
      </div>
    );

    const newOutput = [...output, promptLine];

    if (input === 'help') {
      newOutput.push(<div>Available commands: help, clear, user</div>);
    } else if (input === 'clear') {
      setOutput([]);
      setInput('');
      return;
    } else if (input.startsWith('user ')) {
      const newUser = input.split(' ')[1];
      if (newUser) {
        setUsername(newUser);
        newOutput.push(<div>Switched user to {newUser}</div>);
      } else {
        newOutput.push(<div>Usage: user &lt;username&gt;</div>);
      }
    } else {
      newOutput.push(<div>Command not found: {input}</div>);
    }

    setOutput(newOutput);
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
      padding: '0.1em 1.5em 1em 1em',
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
          <span style={{ color: '#5f98ce', fontWeight: 'bold', paddingInline: '8px' }}> : /home $ </span>
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
