import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { Workout, WorkoutVersion } from '../types/workout';

const MAX_HISTORY_SIZE = 50;
const AUTO_SAVE_DEBOUNCE_MS = 1000;

interface HistoryState {
  versions: WorkoutVersion[];
  currentIndex: number;
  hasPendingSave: boolean;

  saveVersion: (workout: Workout, source: 'manual' | 'ai', description?: string) => void;
  scheduleSave: (workout: Workout) => void;
  flushPendingSave: () => void;
  undo: () => Workout | null;
  redo: () => Workout | null;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clearHistory: () => void;
}

let pendingWorkout: Workout | null = null;
let pendingTimer: ReturnType<typeof setTimeout> | null = null;

function clearPending(): void {
  if (pendingTimer !== null) {
    clearTimeout(pendingTimer);
  }
  pendingTimer = null;
  pendingWorkout = null;
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set, get) => {
      const currentSnapshotString = (): string | null => {
        const { versions, currentIndex } = get();
        const currentVersion = versions[currentIndex];
        return currentVersion ? JSON.stringify(currentVersion.workoutSnapshot) : null;
      };

      const commitVersion = (
        workout: Workout,
        source: 'manual' | 'ai',
        description?: string
      ): void => {
        const workoutSnapshot: Workout = JSON.parse(JSON.stringify(workout));
        if (JSON.stringify(workoutSnapshot) === currentSnapshotString()) return;

        const version: WorkoutVersion = {
          id: uuidv4(),
          workoutSnapshot,
          timestamp: new Date().toISOString(),
          source,
          description,
        };

        set((state) => {
          const newVersions = [...state.versions.slice(0, state.currentIndex + 1), version];
          if (newVersions.length > MAX_HISTORY_SIZE) {
            newVersions.shift();
          }
          return { versions: newVersions, currentIndex: newVersions.length - 1 };
        });
      };

      const setPendingFlag = (hasPendingSave: boolean): void => {
        if (get().hasPendingSave !== hasPendingSave) {
          set({ hasPendingSave });
        }
      };

      return {
        versions: [],
        currentIndex: -1,
        hasPendingSave: false,

        saveVersion: (workout, source, description) => {
          get().flushPendingSave();
          commitVersion(workout, source, description);
        },

        scheduleSave: (workout) => {
          clearPending();

          const isUnsavedChange =
            workout.segments.length > 0 && JSON.stringify(workout) !== currentSnapshotString();

          if (!isUnsavedChange) {
            setPendingFlag(false);
            return;
          }

          pendingWorkout = workout;
          pendingTimer = setTimeout(() => get().flushPendingSave(), AUTO_SAVE_DEBOUNCE_MS);
          setPendingFlag(true);
        },

        flushPendingSave: () => {
          const workoutToSave = pendingWorkout;
          clearPending();
          setPendingFlag(false);
          if (workoutToSave) {
            commitVersion(workoutToSave, 'manual');
          }
        },

        undo: () => {
          get().flushPendingSave();
          const { versions, currentIndex } = get();
          if (currentIndex <= 0) return null;

          const newIndex = currentIndex - 1;
          set({ currentIndex: newIndex });
          return JSON.parse(JSON.stringify(versions[newIndex].workoutSnapshot));
        },

        redo: () => {
          get().flushPendingSave();
          const { versions, currentIndex } = get();
          if (currentIndex >= versions.length - 1) return null;

          const newIndex = currentIndex + 1;
          set({ currentIndex: newIndex });
          return JSON.parse(JSON.stringify(versions[newIndex].workoutSnapshot));
        },

        canUndo: () => {
          const { currentIndex, hasPendingSave } = get();
          return currentIndex > 0 || (hasPendingSave && currentIndex >= 0);
        },

        canRedo: () => {
          const { versions, currentIndex, hasPendingSave } = get();
          return !hasPendingSave && currentIndex < versions.length - 1;
        },

        clearHistory: () => {
          clearPending();
          set({ versions: [], currentIndex: -1, hasPendingSave: false });
        },
      };
    },
    {
      name: 'zwift-workout-history',
      partialize: (state) => ({
        versions: state.versions,
        currentIndex: state.currentIndex,
      }),
    }
  )
);
