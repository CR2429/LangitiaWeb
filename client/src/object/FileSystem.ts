export type FileItem = {
    id: string;
    name: string;
    type: 'file-text' | 'file-image' | 'file-video' | 'folder';
    content?: string;
    url: string;
};

export const desktopFiles: FileItem[] = [
    {
        id: 'e4f1b72e-5a7b-4f8c-9aab-1f2c674a9de1',
        name: 'Lorem.txt',
        type: 'file-text',
        content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
        url: '/textfile/e4f1b72e-5a7b-4f8c-9aab-1f2c674a9de1'
    }
];
