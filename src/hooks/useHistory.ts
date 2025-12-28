import { useCallback, useEffect, useRef } from 'react';
import { useWorkoutStore } from '../store/workoutStore';
import { useHistoryStore } from '../store/historyStore';

const DEBOUNCE_DELAY_MS = 1000;

interface UseHistoryReturn {
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  saveManualChange: () => void;
}

export function useHistory(): UseHistoryReturn {
  const { workout, setWorkout } = useWorkoutStore();
  const { saveVersion, undo: historyUndo, redo: historyRedo, canUndo, canRedo } = useHistoryStore();
  const lastSavedRef = useRef<string>('');
  const debounceTimerRef = useRef<number | null>(null);

  const saveManualChange = useCallback(() => {
    const workoutJson = JSON.stringify(workout);
    if (workoutJson !== lastSavedRef.current) {
      saveVersion(workout, 'manual');
      lastSavedRef.current = workoutJson;
    }
  }, [workout, saveVersion]);

  useEffect(() => {
    const workoutJson = JSON.stringify(workout);

    if (workoutJson === lastSavedRef.current) {
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = window.setTimeout(() => {
      saveManualChange();
    }, DEBOUNCE_DELAY_MS);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [workout, saveManualChange]);

  const undo = useCallback(() => {
    const previousWorkout = historyUndo();
    if (previousWorkout) {
      lastSavedRef.current = JSON.stringify(previousWorkout);
      setWorkout(previousWorkout);
    }
  }, [historyUndo, setWorkout]);

  const redo = useCallback(() => {
    const nextWorkout = historyRedo();
    if (nextWorkout) {
      lastSavedRef.current = JSON.stringify(nextWorkout);
      setWorkout(nextWorkout);
    }
  }, [historyRedo, setWorkout]);

  return {
    canUndo: canUndo(),
    canRedo: canRedo(),
    undo,
    redo,
    saveManualChange,
  };
}
