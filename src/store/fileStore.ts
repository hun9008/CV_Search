import { create } from 'zustand';

interface fileStore {
    file: string;
    fileName: string;
}

const useFileStore = create<fileStore>((set, get) => ({}));
