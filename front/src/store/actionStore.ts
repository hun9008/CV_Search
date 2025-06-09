import { create } from 'zustand';

interface actionStore {
    cvAction: boolean;
    isJobListLoad: boolean;
    setIsJobListLoad: (status: boolean) => void;
    setCVAction: (action: boolean | ((prev: boolean) => boolean)) => void;
}

const useActionStore = create<actionStore>((set) => ({
    cvAction: false,
    isJobListLoad: true,
    setIsJobListLoad: (status) => set({ isJobListLoad: status }),
    setCVAction: (actionOrUpdater) => {
        set((state) => ({
            cvAction:
                typeof actionOrUpdater === 'function'
                    ? actionOrUpdater(state.cvAction)
                    : actionOrUpdater,
        }));
    },
}));

export default useActionStore;
