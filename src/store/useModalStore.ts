import { create } from 'zustand';

interface ModalState {
  isDeployModalOpen: boolean;
  openDeployModal: () => void;
  closeDeployModal: () => void;
}

export const useModalStore = create<ModalState>()((set) => ({
  isDeployModalOpen: false,
  openDeployModal: () => set({ isDeployModalOpen: true }),
  closeDeployModal: () => set({ isDeployModalOpen: false }),
}));
