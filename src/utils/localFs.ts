// utils/localFs.ts
// Gestion du système de fichiers LOCAL côté client,
// basé sur un tableau plat de fichiers/dossiers.

export type LocalFileType = 'file-text' | 'file-image' | 'file-video' | 'folder';

export interface LocalFile {
  id: string;
  name: string;
  type: LocalFileType;
  path: string;          // ex: "/home", "/home/docs"
  content?: string;
  url?: string;
  updatedAt?: string;
}

export interface LocalFsState {
  files: LocalFile[];
}

const STORAGE_KEY = 'localFS';

// ----------------------------------------------------------
// 🔄 Lecture / écriture dans localStorage
// ----------------------------------------------------------
export function loadLocalFS(): LocalFsState {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const initial: LocalFsState = { files: [] };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    return initial;
  }

  try {
    const parsed = JSON.parse(raw);
    if (!parsed.files) {
      parsed.files = [];
    }
    return parsed;
  } catch {
    const fallback: LocalFsState = { files: [] };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fallback));
    return fallback;
  }
}

export function saveLocalFS(fs: LocalFsState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(fs));
}

// ----------------------------------------------------------
// 🧭 Normalisation et résolutions de chemins
// ----------------------------------------------------------
/**
 * Normalise un chemin pour rester dans /home et enlever . / ..
 * - Toujours retourne un chemin absolu
 * - Ne remonte jamais au-dessus de /home
 */
export function normalizePath(input: string): string {
  if (!input || input === '~') return '/home';

  let path = input.trim();

  // Chemin absolu
  if (!path.startsWith('/')) {
    // Relatif depuis /home si aucune base
    path = '/home/' + path;
  }

  const segments = path.split('/');
  const result: string[] = [];

  for (const seg of segments) {
    if (!seg || seg === '.') continue;
    if (seg === '..') {
      // On ne remonte pas au-dessus de /home
      if (result.length > 1) {
        result.pop();
      }
      continue;
    }
    result.push(seg);
  }

  if (result.length === 0) return '/home';

  // Reconstituer avec un slash initial
  return '/' + result.join('/');
}

/**
 * Retourne le parent de path, sans sortir de /home.
 */
export function parentPath(path: string): string {
  const norm = normalizePath(path);
  if (norm === '/home') return '/home';

  const parts = norm.split('/').filter(Boolean);
  if (parts.length <= 1) return '/home'; // "/home" ou moins

  parts.pop(); // retire le dernier segment
  return '/' + parts.join('/');
}

/**
 * Résout un target (relatif ou absolu) par rapport à currentPath.
 */
export function resolveFullPath(currentPath: string, target: string): string {
  if (!target || target === '.') return normalizePath(currentPath);

  // Absolu
  if (target.startsWith('/')) {
    return normalizePath(target);
  }

  // Relatif
  const base = normalizePath(currentPath).replace(/\/+$/, '');
  return normalizePath(base + '/' + target);
}

/**
 * Chemin complet d'un dossier à partir de son LocalFile :
 * path (parent) + "/" + name
 */
export function folderFullPath(folder: LocalFile): string {
  return normalizePath(folder.path.replace(/\/+$/, '') + '/' + folder.name);
}

/**
 * Vérifie si un dossier existe à ce chemin complet.
 * "/home" existe toujours même s'il n'a pas d'entrée dédiée.
 */
export function folderExists(fs: LocalFsState, fullPath: string): boolean {
  const norm = normalizePath(fullPath);
  if (norm === '/home') return true;

  return fs.files.some(
    (f) => f.type === 'folder' && folderFullPath(f) === norm
  );
}

// ----------------------------------------------------------
// 📂 Opérations de base
// ----------------------------------------------------------
/**
 * Liste les éléments présents **directement** dans un path donné.
 */
export function listAtPath(fs: LocalFsState, path: string): LocalFile[] {
  const norm = normalizePath(path);
  return fs.files.filter((f) => normalizePath(f.path) === norm);
}

/**
 * Crée un dossier dans currentPath.
 */
export function createFolder(
  fs: LocalFsState,
  currentPath: string,
  name: string
): { fs: LocalFsState; error?: string } {
  const norm = normalizePath(currentPath);
  const trimmed = name.trim();

  if (!trimmed) {
    return { fs, error: 'Nom de dossier invalide.' };
  }

  const already = fs.files.find(
    (f) => normalizePath(f.path) === norm && f.name === trimmed
  );
  if (already) {
    return { fs, error: 'Dossier déjà existant.' };
  }

  const folder: LocalFile = {
    id: crypto.randomUUID(),
    name: trimmed,
    type: 'folder',
    path: norm,
    content: '',
    url: '',
    updatedAt: new Date().toISOString(),
  };

  const newFs: LocalFsState = {
    ...fs,
    files: [...fs.files, folder],
  };

  saveLocalFS(newFs);
  return { fs: newFs };
}

/**
 * Supprime un dossier **vide** dans currentPath.
 */
export function removeFolder(
  fs: LocalFsState,
  currentPath: string,
  name: string
): { fs: LocalFsState; error?: string } {
  const norm = normalizePath(currentPath);

  const folder = fs.files.find(
    (f) => normalizePath(f.path) === norm && f.name === name && f.type === 'folder'
  );
  if (!folder) {
    return { fs, error: 'Dossier introuvable.' };
  }

  const folderPath = folderFullPath(folder);
  const hasChildren = fs.files.some(
    (f) => normalizePath(f.path) === folderPath
  );
  if (hasChildren) {
    return { fs, error: 'Dossier non vide.' };
  }

  const newFs: LocalFsState = {
    ...fs,
    files: fs.files.filter((f) => f !== folder),
  };

  saveLocalFS(newFs);
  return { fs: newFs };
}

/**
 * Déplace/renomme une entrée avec la sémantique "option 2".
 * - mv src newName
 * - mv src ../
 * - mv src /home
 * - mv src /docs/test2
 */
export function moveEntry(
  fs: LocalFsState,
  currentPath: string,
  srcName: string,
  destSpec: string
): { fs: LocalFsState; error?: string } {
  const normCurrent = normalizePath(currentPath);

  const src = fs.files.find(
    (f) => normalizePath(f.path) === normCurrent && f.name === srcName
  );
  if (!src) {
    return { fs, error: `Aucun élément nommé "${srcName}" dans ${normCurrent}.` };
  }

  const dest = destSpec.trim();
  if (!dest) return { fs, error: 'Usage : mv <source> <destination>' };

  // Cas 1 : rename simple (pas de /, pas de ..)
  const isPathLike = dest.includes('/') || dest === '.' || dest === '..';
  if (!isPathLike) {
    const conflict = fs.files.find(
      (f) => normalizePath(f.path) === normCurrent && f.name === dest
    );
    if (conflict) {
      return { fs, error: `Un élément "${dest}" existe déjà dans ${normCurrent}.` };
    }
    src.name = dest;
    src.updatedAt = new Date().toISOString();
    saveLocalFS(fs);
    return { fs };
  }

  // Cas 2 : déplacement (relatif ou absolu)
  const resolved = resolveFullPath(normCurrent, dest);

  // 2a) Si resolved correspond à un dossier existant → on y met src, même nom
  if (folderExists(fs, resolved)) {
    const conflict = fs.files.find(
      (f) => normalizePath(f.path) === resolved && f.name === src.name
    );
    if (conflict && conflict !== src) {
      return { fs, error: `Un élément "${src.name}" existe déjà dans ${resolved}.` };
    }

    src.path = resolved;
    src.updatedAt = new Date().toISOString();
    saveLocalFS(fs);
    return { fs };
  }

  // 2b) Sinon, on considère que le dernier segment est le nouveau nom,
  // et que son parent doit être un dossier existant.
  const parent = parentPath(resolved);
  const newName = resolved.split('/').filter(Boolean).slice(-1)[0];

  if (!folderExists(fs, parent)) {
    return { fs, error: `Dossier de destination introuvable (${parent}).` };
  }

  const conflict = fs.files.find(
    (f) => normalizePath(f.path) === parent && f.name === newName
  );
  if (conflict && conflict !== src) {
    return { fs, error: `Un élément "${newName}" existe déjà dans ${parent}.` };
  }

  src.path = parent;
  src.name = newName;
  src.updatedAt = new Date().toISOString();
  saveLocalFS(fs);
  return { fs };
}
