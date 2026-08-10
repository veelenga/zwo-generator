import { useWorkoutStore } from './workoutStore';
import { useHistoryStore } from './historyStore';

export function initHistoryAutoSave(): () => void {
  useHistoryStore.getState().scheduleSave(useWorkoutStore.getState().workout);

  return useWorkoutStore.subscribe((state, prevState) => {
    if (state.workout === prevState.workout) return;
    useHistoryStore.getState().scheduleSave(state.workout);
  });
}
