import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { Workout, WorkoutVersion } from '../types/workout';

const MAX_HISTORY_SIZE = 50;

interface HistoryState {
  versions: WorkoutVersion[];
  currentIndex: number;
  lastSavedSnapshot: string;
  isUndoRedoAction: boolean;

  saveVersion: (workout: Workout, source: 'manual' | 'ai', description?: string) => void;
  undo: () => Workout | null;
  redo: () => Workout | null;
  canUndo: () => boolean;
  canRedo: () => boolean;
  restoreVersion: (id: string) => Workout | null;
  clearHistory: () => void;
  setLastSavedSnapshot: (snapshot: string) => void;
  markUndoRedoComplete: () => void;
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set, get) => ({
      versions: [],
      currentIndex: -1,
      lastSavedSnapshot: '',
      isUndoRedoAction: false,

      setLastSavedSnapshot: (snapshot) => {
        set({ lastSavedSnapshot: snapshot });
      },

      markUndoRedoComplete: () => {
        set({ isUndoRedoAction: false });
      },

      saveVersion: (workout, source, description) => {
        const workoutSnapshot = JSON.parse(JSON.stringify(workout));
        const snapshotString = JSON.stringify(workoutSnapshot);

        const version: WorkoutVersion = {
          id: uuidv4(),
          workoutSnapshot,
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
              lastSavedSnapshot: snapshotString,
            };
          }

          return {
            versions: newVersions,
            currentIndex: newVersions.length - 1,
            lastSavedSnapshot: snapshotString,
          };
        });
      },

      undo: () => {
        const { versions, currentIndex } = get();
        if (currentIndex <= 0) return null;

        const newIndex = currentIndex - 1;
        const workout = JSON.parse(JSON.stringify(versions[newIndex].workoutSnapshot));
        const snapshotString = JSON.stringify(workout);
        set({ currentIndex: newIndex, isUndoRedoAction: true, lastSavedSnapshot: snapshotString });
        return workout;
      },

      redo: () => {
        const { versions, currentIndex } = get();
        if (currentIndex >= versions.length - 1) return null;

        const newIndex = currentIndex + 1;
        const workout = JSON.parse(JSON.stringify(versions[newIndex].workoutSnapshot));
        const snapshotString = JSON.stringify(workout);
        set({ currentIndex: newIndex, isUndoRedoAction: true, lastSavedSnapshot: snapshotString });
        return workout;
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
        set({ versions: [], currentIndex: -1, lastSavedSnapshot: '' });
      },
    }),
    {
      name: 'zwift-workout-history',
      partialize: (state) => ({
        versions: state.versions,
        currentIndex: state.currentIndex,
      }),
    }
  )
);
