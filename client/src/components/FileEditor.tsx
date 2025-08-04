import { useState, useEffect } from 'react';

export default function TextEditorPage() {
  const [name, setName] = useState('');
  const [extension, setExtension] = useState<'txt' | 'md'>('txt');
  const [content, setContent] = useState('');

  // Charge un fichier si on a des paramètres
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fileId = params.get('id');
    if (fileId) {
      fetch(`/api/file?id=${fileId}`)
        .then(res => res.json())
        .then(data => {
          setName(data.name || '');
          setExtension(data.extension || 'txt');
          setContent(data.content || '');
        });
    }
  }, []);

  const handleSave = async () => {
    if (!name.trim()) {
      alert("Nom requis.");
      return;
    }

    const fileData = { name, extension, content };

    const res = await fetch('/api/save-text-file', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fileData),
    });

    if (res.ok) alert("Fichier enregistré !");
    else alert("Erreur lors de la sauvegarde.");
  };

  return (
    <div style={{ padding: 20, fontFamily: 'monospace' }}>
      <label>Nom du fichier</label>
      <input
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="ex: note-du-jour"
        style={{ width: '100%' }}
      />

      <label>Extension</label>
      <select value={extension} onChange={e => setExtension(e.target.value as 'txt' | 'md')}>
        <option value="txt">.txt</option>
        <option value="md">.md</option>
      </select>

      <label>Contenu</label>
      <textarea
        rows={20}
        value={content}
        onChange={e => setContent(e.target.value)}
        style={{ width: '100%' }}
      />

      <button onClick={handleSave}>💾 Enregistrer</button>
    </div>
  );
}