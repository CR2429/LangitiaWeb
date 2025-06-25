import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { marked } from 'marked';
import './FileWindow.css';


type FileType = 'file-text' | 'file-md' | 'file-image' | 'file-video' | 'file-audio' | 'folder';

interface FileData {
  id: string;
  name: string;
  type: FileType;
  content: string | null;
  url: string | null;
  path: string;
}

function FileWindow() {
  const { id } = useParams();
  const [file, setFile] = useState<FileData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFile = async () => {
      try {
        const res = await fetch(`/api/file?id=${id}`);

        if (!res.ok) throw new Error(`Erreur ${res.status} : fichier introuvable.`);

        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await res.json();
          setFile(data);
        } else {
          const html = await res.text();
          console.error('Réponse inattendue HTML :', html.slice(0, 200));
          throw new Error("Réponse inattendue du serveur : HTML au lieu de JSON.");
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Erreur inconnue.");
      }
    };

    fetchFile();
  }, [id]);

  if (error) {
    return (
      <div className="baseStyle">
        <p style={{ color: 'red' }}>Erreur : {error}</p>
      </div>
    );
  }

  if (!file) {
    return (
      <div className="baseStyle">
        <p style={{ color: '#ccc' }}>Chargement...</p>
      </div>
    );
  }

  const renderContent = () => {
    switch (file.type) {
      case 'file-text':
        return <pre className="file-text-content">{file.content}</pre>;

      case 'file-md':
        return (
          <div
            className="file-text-content"
            dangerouslySetInnerHTML={{ __html: marked(file.content || '') }}
          />
        );

      case 'file-image':
        return <img src={file.url || ''} alt={file.name} className="file-image" />;

      case 'file-video':
        return (
          <video controls className="file-media">
            <source src={file.url || ''} />
          </video>
        );

      case 'file-audio':
        return (
          <audio controls className="file-media">
            <source src={file.url || ''} />
          </audio>
        );

      case 'folder':
        return <p style={{ padding: '1rem' }}>📁 Ceci est un dossier.</p>;

      default:
        return <p style={{ padding: '1rem' }}>❓ Type de fichier inconnu.</p>;
    }
  };

  return (
    <div className="file-window">
      <div className="file-window-content file-scroll">{renderContent()}</div>
    </div>
  );

}

export default FileWindow;
