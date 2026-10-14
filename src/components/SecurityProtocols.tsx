import { useEffect, useState } from 'react';

function SecurityProtocols() {
  const [htmlContent, setHtmlContent] = useState<string>('');

  // 🔧 Change ici la version du protocole
  const latestVersion = 'v1.2.html';

  useEffect(() => {
    const fetchProtocol = async () => {
      try {
        const response = await fetch(`/protocoles_de_securite/${latestVersion}`);
        if (!response.ok) throw new Error('Fichier introuvable.');
        const content = await response.text();
        setHtmlContent(content);
      } catch (err) {
        setHtmlContent('<p style="color: red;">Erreur : impossible de charger les protocoles de sécurité.</p>');
        console.error(err);
      }
    };

    fetchProtocol();
  }, [latestVersion]);

  return (
    <div
      style={{
        backgroundColor: '#000',
        color: '#fff',
        padding: '2rem',
        height: '100vh',
        overflowY: 'auto',
      }}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
}

export default SecurityProtocols;
