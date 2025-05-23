import { create } from 'zustand';

interface actionStore {
    cvAction: boolean;
    setCVAction: (action: boolean | ((prev: boolean) => boolean)) => void;
}

const useActionStore = create<actionStore>((set) => ({
    cvAction: false,
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
