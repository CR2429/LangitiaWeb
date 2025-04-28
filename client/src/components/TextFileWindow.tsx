import { useParams } from 'react-router-dom';
import { desktopFiles } from '../object/FileSystem';

const TextFileWindow = () => {
  const { id } = useParams<{ id: string }>();
  const file = desktopFiles.find(f => f.id === id);

  if (!file) return <div>Fichier introuvable.</div>;

  return (
    <div style={{ padding: '10px', color: '#00ffd0', fontFamily: 'Courier New', height: '100%', overflowY: 'auto' }}>
      {file.content}
    </div>
  );
};

export default TextFileWindow;
