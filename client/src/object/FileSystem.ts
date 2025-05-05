export type FileItem = {
    id: string;
    name: string;
    type: 'file-text' | 'file-image' | 'file-video' | 'folder';
    content?: string;
    url: string;
    path: string;    
};

export async function fetchFilesByPath(path: string): Promise<FileItem[]> {
    try {
        const response = await fetch(`/api/files?path=${encodeURIComponent(path)}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch files: ${response.statusText}`);
        }
        const data: FileItem[] = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching files:', error);
        return []; // On renvoie une liste vide en cas d'erreur
    }
}