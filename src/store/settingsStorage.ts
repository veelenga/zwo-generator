import type { PersistStorage, StorageValue } from 'zustand/middleware';

export interface PersistedSettings {
  openaiApiKey: string;
  ftp: number;
}

const sessionKeyName = (name: string) => `${name}-api-key`;

export const settingsStorage: PersistStorage<PersistedSettings> = {
  getItem: (name) => {
    const durable = localStorage.getItem(name);
    const sessionApiKey = sessionStorage.getItem(sessionKeyName(name));
    if (durable === null && sessionApiKey === null) {
      return null;
    }

    const stored: StorageValue<Partial<PersistedSettings>> = durable ? JSON.parse(durable) : { state: {} };
    const openaiApiKey = sessionApiKey ?? stored.state.openaiApiKey ?? '';

    return { ...stored, state: { ...stored.state, openaiApiKey } } as StorageValue<PersistedSettings>;
  },

  setItem: (name, value) => {
    const { openaiApiKey, ...durableState } = value.state;
    localStorage.setItem(name, JSON.stringify({ ...value, state: durableState }));

    if (openaiApiKey) {
      sessionStorage.setItem(sessionKeyName(name), openaiApiKey);
    } else {
      sessionStorage.removeItem(sessionKeyName(name));
    }
  },

  removeItem: (name) => {
    localStorage.removeItem(name);
    sessionStorage.removeItem(sessionKeyName(name));
  },
};
