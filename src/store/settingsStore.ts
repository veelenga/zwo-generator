import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  openaiApiKey: string;
  ftp: number;
  showApiKeyModal: boolean;

  setOpenaiApiKey: (key: string) => void;
  setFtp: (ftp: number) => void;
  setShowApiKeyModal: (show: boolean) => void;
  hasApiKey: () => boolean;
}

const DEFAULT_FTP = 200;

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      openaiApiKey: '',
      ftp: DEFAULT_FTP,
      showApiKeyModal: false,

      setOpenaiApiKey: (key) => {
        set({ openaiApiKey: key, showApiKeyModal: false });
      },

      setFtp: (ftp) => {
        set({ ftp });
      },

      setShowApiKeyModal: (show) => {
        set({ showApiKeyModal: show });
      },

      hasApiKey: () => {
        return get().openaiApiKey.length > 0;
      },
    }),
    {
      name: 'zwift-workout-settings',
      partialize: (state) => ({
        openaiApiKey: state.openaiApiKey,
        ftp: state.ftp,
      }),
    }
  )
);
