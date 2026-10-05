import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { settingsStorage, type PersistedSettings } from './settingsStorage';

interface SettingsState {
  openaiApiKey: string;
  rememberApiKey: boolean;
  ftp: number;
  showApiKeyModal: boolean;

  setOpenaiApiKey: (key: string, remember: boolean) => void;
  setFtp: (ftp: number) => void;
  setShowApiKeyModal: (show: boolean) => void;
  hasApiKey: () => boolean;
}

const DEFAULT_FTP = 200;
const STORAGE_VERSION = 1;

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      openaiApiKey: '',
      rememberApiKey: false,
      ftp: DEFAULT_FTP,
      showApiKeyModal: false,

      setOpenaiApiKey: (key, remember) => {
        set({ openaiApiKey: key, rememberApiKey: remember && key.length > 0, showApiKeyModal: false });
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
      version: STORAGE_VERSION,
      storage: settingsStorage,
      migrate: (persisted) => persisted as PersistedSettings,
      partialize: (state): PersistedSettings => ({
        openaiApiKey: state.openaiApiKey,
        rememberApiKey: state.rememberApiKey,
        ftp: state.ftp,
      }),
    }
  )
);
