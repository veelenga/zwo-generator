import { useCallback, useEffect, useRef } from 'react';
import { useWorkoutStore } from '../store/workoutStore';
import { useHistoryStore } from '../store/historyStore';

const DEBOUNCE_DELAY_MS = 1000;

interface UseHistoryReturn {
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
}

export function useHistory(): UseHistoryReturn {
  const { workout, setWorkout, selectedSegmentId, selectSegment } = useWorkoutStore();
  const { saveVersion, undo: historyUndo, redo: historyRedo, markUndoRedoComplete } = useHistoryStore();
  // Subscribe to state changes to ensure re-renders when history changes
  const canUndo = useHistoryStore((state) => state.currentIndex > 0);
  const canRedo = useHistoryStore((state) => state.currentIndex < state.versions.length - 1);
  const lastSavedSnapshot = useHistoryStore((state) => state.lastSavedSnapshot);
  const isUndoRedoAction = useHistoryStore((state) => state.isUndoRedoAction);
  const debounceTimerRef = useRef<number | null>(null);

  useEffect(() => {
    // Skip saving if this change was from undo/redo
    if (isUndoRedoAction) {
      markUndoRedoComplete();
      return;
    }

    // Don't save empty workouts to history
    if (workout.segments.length === 0) {
      return;
    }

    const workoutJson = JSON.stringify(workout);

    // Skip if workout hasn't changed from last saved
    if (workoutJson === lastSavedSnapshot) {
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = window.setTimeout(() => {
      saveVersion(workout, 'manual');
    }, DEBOUNCE_DELAY_MS);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [workout, lastSavedSnapshot, isUndoRedoAction, saveVersion, markUndoRedoComplete]);

  const undo = useCallback(() => {
    const previousWorkout = historyUndo();
    if (previousWorkout) {
      const currentSelection = selectedSegmentId;
      setWorkout(previousWorkout);
      // Preserve selection if segment still exists
      if (currentSelection && previousWorkout.segments.some(s => s.id === currentSelection)) {
        selectSegment(currentSelection);
      }
    }
  }, [historyUndo, setWorkout, selectedSegmentId, selectSegment]);

  const redo = useCallback(() => {
    const nextWorkout = historyRedo();
    if (nextWorkout) {
      const currentSelection = selectedSegmentId;
      setWorkout(nextWorkout);
      // Preserve selection if segment still exists
      if (currentSelection && nextWorkout.segments.some(s => s.id === currentSelection)) {
        selectSegment(currentSelection);
      }
    }
  }, [historyRedo, setWorkout, selectedSegmentId, selectSegment]);

  return {
    canUndo,
    canRedo,
    undo,
    redo,
  };
}
