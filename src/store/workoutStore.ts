import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Workout, WorkoutSegment } from '../types/workout';
import { createEmptyWorkout, createSegment, duplicateSegment } from '../utils/workoutUtils';

interface WorkoutState {
  workout: Workout;
  selectedSegmentId: string | null;
  isGenerating: boolean;

  setWorkout: (workout: Workout) => void;
  updateWorkout: (updates: Partial<Workout>) => void;
  setSegments: (segments: WorkoutSegment[]) => void;
  addSegment: (type: WorkoutSegment['type'], index?: number) => void;
  updateSegment: (id: string, updates: Partial<WorkoutSegment>) => void;
  removeSegment: (id: string) => void;
  duplicateSegmentById: (id: string) => void;
  moveSegment: (fromIndex: number, toIndex: number) => void;
  selectSegment: (id: string | null) => void;
  setIsGenerating: (isGenerating: boolean) => void;
  resetWorkout: () => void;
}

export const useWorkoutStore = create<WorkoutState>()(
  persist(
    (set, get) => ({
      workout: createEmptyWorkout(),
      selectedSegmentId: null,
      isGenerating: false,

      setWorkout: (workout) => {
        set({ workout, selectedSegmentId: null });
      },

      updateWorkout: (updates) => {
        set((state) => ({
          workout: {
            ...state.workout,
            ...updates,
            updatedAt: new Date().toISOString(),
          },
        }));
      },

      setSegments: (segments) => {
        set((state) => ({
          workout: {
            ...state.workout,
            segments,
            updatedAt: new Date().toISOString(),
          },
        }));
      },

      addSegment: (type, index) => {
        const newSegment = createSegment(type);
        set((state) => {
          const segments = [...state.workout.segments];
          const insertIndex = index !== undefined ? index : segments.length;
          segments.splice(insertIndex, 0, newSegment);
          return {
            workout: {
              ...state.workout,
              segments,
              updatedAt: new Date().toISOString(),
            },
            selectedSegmentId: newSegment.id,
          };
        });
      },

      updateSegment: (id, updates) => {
        set((state) => ({
          workout: {
            ...state.workout,
            segments: state.workout.segments.map((segment) =>
              segment.id === id ? ({ ...segment, ...updates } as WorkoutSegment) : segment
            ),
            updatedAt: new Date().toISOString(),
          },
        }));
      },

      removeSegment: (id) => {
        set((state) => ({
          workout: {
            ...state.workout,
            segments: state.workout.segments.filter((segment) => segment.id !== id),
            updatedAt: new Date().toISOString(),
          },
          selectedSegmentId: state.selectedSegmentId === id ? null : state.selectedSegmentId,
        }));
      },

      duplicateSegmentById: (id) => {
        const { workout } = get();
        const segment = workout.segments.find((s) => s.id === id);
        if (!segment) return;

        const duplicated = duplicateSegment(segment);
        const index = workout.segments.findIndex((s) => s.id === id);

        set((state) => {
          const segments = [...state.workout.segments];
          segments.splice(index + 1, 0, duplicated);
          return {
            workout: {
              ...state.workout,
              segments,
              updatedAt: new Date().toISOString(),
            },
            selectedSegmentId: duplicated.id,
          };
        });
      },

      moveSegment: (fromIndex, toIndex) => {
        set((state) => {
          const segments = [...state.workout.segments];
          const [movedSegment] = segments.splice(fromIndex, 1);
          segments.splice(toIndex, 0, movedSegment);
          return {
            workout: {
              ...state.workout,
              segments,
              updatedAt: new Date().toISOString(),
            },
          };
        });
      },

      selectSegment: (id) => {
        set({ selectedSegmentId: id });
      },

      setIsGenerating: (isGenerating) => {
        set({ isGenerating });
      },

      resetWorkout: () => {
        set({
          workout: createEmptyWorkout(),
          selectedSegmentId: null,
        });
      },
    }),
    {
      name: 'zwift-workout-storage',
      partialize: (state) => ({ workout: state.workout }),
    }
  )
);
