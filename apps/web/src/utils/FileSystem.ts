// utils/FileSystem.ts
// Gestion du système de fichiers local basé sur une liste à plat.

export type FileType = 'dir' | 'txt' | 'png' | 'mp4' | string;

export type FileNode = {
  id: string;
  nom: string;
  type: FileType;
  path: string;            // Exemple: "/", "/home", "/home/test"
  content?: string;
  updatedAt?: string | null;
  url?: string;
};

export type LocalFS = {
  files: FileNode[];
};

const STORAGE_KEY = 'localFS';
export const LOCAL_FS_UPDATED_EVENT = 'localFS-updated';

// Normalise un chemin: gestion de /, ., ..
export function normalizePath(path: string): string {
  if (!path) return '/';

  let p = path.replace(/\\/g, '/');

  if (!p.startsWith('/')) {
    p = '/' + p;
  }

  const parts = p.split('/');
  const stack: string[] = [];

  for (const part of parts) {
    if (!part || part === '.') continue;
    if (part === '..') {
      if (stack.length > 0) stack.pop();
      continue;
    }
    stack.push(part);
  }

  return '/' + stack.join('/');
}

export function parentPath(path: string): string {
  const normalized = normalizePath(path);
  const parts = normalized.split('/').filter(Boolean);
  if (parts.length <= 1) return '/';
  parts.pop();
  return '/' + parts.join('/');
}

// Chemin complet d'un noeud (utile pour comparer)
export function getFullPath(node: FileNode): string {
  // Pour un dossier, son "full path" est path + "/" + nom
  return normalizePath((node.path || '/') + '/' + node.nom);
}

// Charge le FS depuis localStorage, ou initialise si absent
export function loadLocalFS(): LocalFS {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const initial: LocalFS = {
      files: [
        {
          id: crypto.randomUUID(),
          nom: 'home',
          type: 'dir',
          path: '/',           // "/" contient "home"
          updatedAt: new Date().toISOString()
        }
      ]
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    return initial;
  }
  try {
    const parsed: LocalFS = JSON.parse(raw);
    if (!Array.isArray(parsed.files)) {
      throw new Error('Invalid localFS structure');
    }
    return parsed;
  } catch {
    const reset: LocalFS = { files: [] };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reset));
    return reset;
  }
}

// Sauvegarde et émet un event pour prévenir le reste de l'app
export function saveLocalFS(fs: LocalFS): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(fs));
  // Event custom pour prévenir Home, Terminal, etc.
  window.dispatchEvent(new CustomEvent(LOCAL_FS_UPDATED_EVENT));
}

// Liste le contenu immédiat d'un chemin donné
export function listFilesAtPath(fs: LocalFS, path: string): FileNode[] {
  const normalized = normalizePath(path);
  return fs.files.filter(f => normalizePath(f.path) === normalized);
}

// Vérifie si un dossier existe à un chemin donné
export function directoryExists(fs: LocalFS, dirPath: string): boolean {
  const normalized = normalizePath(dirPath);
  if (normalized === '/') return true;

  const parent = parentPath(normalized);
  const parts = normalized.split('/').filter(Boolean);
  if (parts.length === 0) return true;

  const name = parts[parts.length - 1];

  return fs.files.some(
    f =>
      f.type === 'dir' &&
      normalizePath(f.path) === parent &&
      f.nom === name
  );
}
