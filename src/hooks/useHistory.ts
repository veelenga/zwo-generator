import { useCallback } from 'react';
import type { Workout } from '../types/workout';
import { useWorkoutStore } from '../store/workoutStore';
import { useHistoryStore } from '../store/historyStore';

interface UseHistoryReturn {
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
}

function restoreWorkout(workout: Workout | null): void {
  if (!workout) return;

  const { selectedSegmentId, setWorkout, selectSegment } = useWorkoutStore.getState();
  setWorkout(workout);
  if (selectedSegmentId && workout.segments.some((s) => s.id === selectedSegmentId)) {
    selectSegment(selectedSegmentId);
  }
}

export function useHistory(): UseHistoryReturn {
  const canUndo = useHistoryStore((state) => state.canUndo());
  const canRedo = useHistoryStore((state) => state.canRedo());

  const undo = useCallback(() => restoreWorkout(useHistoryStore.getState().undo()), []);
  const redo = useCallback(() => restoreWorkout(useHistoryStore.getState().redo()), []);

  return { canUndo, canRedo, undo, redo };
}
