import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { Workout, WorkoutVersion } from '../types/workout';

const MAX_HISTORY_SIZE = 50;

interface HistoryState {
  versions: WorkoutVersion[];
  currentIndex: number;

  saveVersion: (workout: Workout, source: 'manual' | 'ai', description?: string) => void;
  undo: () => Workout | null;
  redo: () => Workout | null;
  canUndo: () => boolean;
  canRedo: () => boolean;
  restoreVersion: (id: string) => Workout | null;
  clearHistory: () => void;
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set, get) => ({
      versions: [],
      currentIndex: -1,

      saveVersion: (workout, source, description) => {
        const version: WorkoutVersion = {
          id: uuidv4(),
          workoutSnapshot: JSON.parse(JSON.stringify(workout)),
          timestamp: new Date().toISOString(),
          source,
          description,
        };

        set((state) => {
          const versionsUpToCurrent = state.versions.slice(0, state.currentIndex + 1);
          const newVersions = [...versionsUpToCurrent, version];

          if (newVersions.length > MAX_HISTORY_SIZE) {
            newVersions.shift();
            return {
              versions: newVersions,
              currentIndex: newVersions.length - 1,
            };
          }

          return {
            versions: newVersions,
            currentIndex: newVersions.length - 1,
          };
        });
      },

      undo: () => {
        const { versions, currentIndex } = get();
        if (currentIndex <= 0) return null;

        const newIndex = currentIndex - 1;
        set({ currentIndex: newIndex });
        return JSON.parse(JSON.stringify(versions[newIndex].workoutSnapshot));
      },

      redo: () => {
        const { versions, currentIndex } = get();
        if (currentIndex >= versions.length - 1) return null;

        const newIndex = currentIndex + 1;
        set({ currentIndex: newIndex });
        return JSON.parse(JSON.stringify(versions[newIndex].workoutSnapshot));
      },

      canUndo: () => {
        const { currentIndex } = get();
        return currentIndex > 0;
      },

      canRedo: () => {
        const { versions, currentIndex } = get();
        return currentIndex < versions.length - 1;
      },

      restoreVersion: (id) => {
        const { versions } = get();
        const index = versions.findIndex((v) => v.id === id);
        if (index === -1) return null;

        set({ currentIndex: index });
        return JSON.parse(JSON.stringify(versions[index].workoutSnapshot));
      },

      clearHistory: () => {
        set({ versions: [], currentIndex: -1 });
      },
    }),
    {
      name: 'zwift-workout-history',
    }
  )
);
