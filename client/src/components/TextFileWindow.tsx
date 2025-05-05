import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FileItem } from '../object/FileSystem';

const TextFileWindow = () => {
  const { id } = useParams<{ id: string }>();
  const [file, setFile] = useState<FileItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFile = async () => {
      try {
        const response = await fetch(`/api/file?id=${encodeURIComponent(id || '')}`);
        if (!response.ok) {
          throw new Error('Erreur de récupération');
        }
        const data: FileItem = await response.json();
        setFile(data);
      } catch (error) {
        console.error('Erreur lors de la récupération du fichier :', error);
        setFile(null);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchFile();
    }
  }, [id]);

  if (loading) return <div style={{ padding: '10px' }}>Chargement...</div>;
  if (!file) return <div style={{ padding: '10px' }}>Fichier introuvable.</div>;

  return (
    <div style={{ padding: '10px', color: '#00ffd0', fontFamily: 'Courier New', height: '100%', overflowY: 'auto' }}>
      {file.content}
    </div>
  );
};

export default TextFileWindow;
