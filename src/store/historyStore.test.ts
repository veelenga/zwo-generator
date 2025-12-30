import { describe, it, expect, beforeEach } from 'vitest';
import { useHistoryStore } from './historyStore';
import type { Workout } from '../types/workout';

const createMockWorkout = (name: string, segmentCount: number): Workout => ({
  id: `workout-${name}`,
  name,
  description: '',
  author: 'Test Author',
  sportType: 'bike',
  tags: [],
  segments: Array.from({ length: segmentCount }, (_, i) => ({
    id: `segment-${i}`,
    type: 'steadystate' as const,
    duration: 300,
    power: 0.75,
  })),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

describe('historyStore', () => {
  beforeEach(() => {
    useHistoryStore.setState({
      versions: [],
      currentIndex: -1,
      lastSavedSnapshot: '',
      isUndoRedoAction: false,
    });
  });

  describe('saveVersion', () => {
    it('saves first version correctly', () => {
      const workout = createMockWorkout('Test', 2);
      useHistoryStore.getState().saveVersion(workout, 'manual');

      const state = useHistoryStore.getState();
      expect(state.versions).toHaveLength(1);
      expect(state.currentIndex).toBe(0);
      expect(state.versions[0].workoutSnapshot.name).toBe('Test');
    });

    it('saves multiple versions correctly', () => {
      const workout1 = createMockWorkout('First', 1);
      const workout2 = createMockWorkout('Second', 2);

      useHistoryStore.getState().saveVersion(workout1, 'manual');
      useHistoryStore.getState().saveVersion(workout2, 'manual');

      const state = useHistoryStore.getState();
      expect(state.versions).toHaveLength(2);
      expect(state.currentIndex).toBe(1);
    });

    it('updates lastSavedSnapshot', () => {
      const workout = createMockWorkout('Test', 1);
      useHistoryStore.getState().saveVersion(workout, 'manual');

      const state = useHistoryStore.getState();
      expect(state.lastSavedSnapshot).toBe(JSON.stringify(workout));
    });

    it('truncates history after undo when new version is saved', () => {
      const workout1 = createMockWorkout('First', 1);
      const workout2 = createMockWorkout('Second', 2);
      const workout3 = createMockWorkout('Third', 3);

      useHistoryStore.getState().saveVersion(workout1, 'manual');
      useHistoryStore.getState().saveVersion(workout2, 'manual');
      useHistoryStore.getState().undo(); // Go back to workout1
      useHistoryStore.getState().saveVersion(workout3, 'manual'); // Should replace workout2

      const state = useHistoryStore.getState();
      expect(state.versions).toHaveLength(2);
      expect(state.versions[1].workoutSnapshot.name).toBe('Third');
    });
  });

  describe('undo', () => {
    it('returns null when no history', () => {
      const result = useHistoryStore.getState().undo();
      expect(result).toBeNull();
    });

    it('returns null when at first version', () => {
      const workout = createMockWorkout('Test', 1);
      useHistoryStore.getState().saveVersion(workout, 'manual');

      const result = useHistoryStore.getState().undo();
      expect(result).toBeNull();
    });

    it('returns previous workout when history exists', () => {
      const workout1 = createMockWorkout('First', 1);
      const workout2 = createMockWorkout('Second', 2);

      useHistoryStore.getState().saveVersion(workout1, 'manual');
      useHistoryStore.getState().saveVersion(workout2, 'manual');

      const result = useHistoryStore.getState().undo();
      expect(result?.name).toBe('First');
      expect(useHistoryStore.getState().currentIndex).toBe(0);
    });

    it('sets isUndoRedoAction flag', () => {
      const workout1 = createMockWorkout('First', 1);
      const workout2 = createMockWorkout('Second', 2);

      useHistoryStore.getState().saveVersion(workout1, 'manual');
      useHistoryStore.getState().saveVersion(workout2, 'manual');
      useHistoryStore.getState().undo();

      expect(useHistoryStore.getState().isUndoRedoAction).toBe(true);
    });

    it('updates lastSavedSnapshot', () => {
      const workout1 = createMockWorkout('First', 1);
      const workout2 = createMockWorkout('Second', 2);

      useHistoryStore.getState().saveVersion(workout1, 'manual');
      useHistoryStore.getState().saveVersion(workout2, 'manual');
      useHistoryStore.getState().undo();

      expect(useHistoryStore.getState().lastSavedSnapshot).toBe(JSON.stringify(workout1));
    });
  });

  describe('redo', () => {
    it('returns null when no future history', () => {
      const workout = createMockWorkout('Test', 1);
      useHistoryStore.getState().saveVersion(workout, 'manual');

      const result = useHistoryStore.getState().redo();
      expect(result).toBeNull();
    });

    it('returns next workout after undo', () => {
      const workout1 = createMockWorkout('First', 1);
      const workout2 = createMockWorkout('Second', 2);

      useHistoryStore.getState().saveVersion(workout1, 'manual');
      useHistoryStore.getState().saveVersion(workout2, 'manual');
      useHistoryStore.getState().undo();

      const result = useHistoryStore.getState().redo();
      expect(result?.name).toBe('Second');
      expect(useHistoryStore.getState().currentIndex).toBe(1);
    });

    it('sets isUndoRedoAction flag', () => {
      const workout1 = createMockWorkout('First', 1);
      const workout2 = createMockWorkout('Second', 2);

      useHistoryStore.getState().saveVersion(workout1, 'manual');
      useHistoryStore.getState().saveVersion(workout2, 'manual');
      useHistoryStore.getState().undo();
      useHistoryStore.getState().redo();

      expect(useHistoryStore.getState().isUndoRedoAction).toBe(true);
    });
  });

  describe('canUndo / canRedo', () => {
    it('canUndo returns false when no history', () => {
      expect(useHistoryStore.getState().canUndo()).toBe(false);
    });

    it('canUndo returns false with single version', () => {
      const workout = createMockWorkout('Test', 1);
      useHistoryStore.getState().saveVersion(workout, 'manual');

      expect(useHistoryStore.getState().canUndo()).toBe(false);
    });

    it('canUndo returns true with multiple versions', () => {
      const workout1 = createMockWorkout('First', 1);
      const workout2 = createMockWorkout('Second', 2);

      useHistoryStore.getState().saveVersion(workout1, 'manual');
      useHistoryStore.getState().saveVersion(workout2, 'manual');

      expect(useHistoryStore.getState().canUndo()).toBe(true);
    });

    it('canRedo returns false at latest version', () => {
      const workout = createMockWorkout('Test', 1);
      useHistoryStore.getState().saveVersion(workout, 'manual');

      expect(useHistoryStore.getState().canRedo()).toBe(false);
    });

    it('canRedo returns true after undo', () => {
      const workout1 = createMockWorkout('First', 1);
      const workout2 = createMockWorkout('Second', 2);

      useHistoryStore.getState().saveVersion(workout1, 'manual');
      useHistoryStore.getState().saveVersion(workout2, 'manual');
      useHistoryStore.getState().undo();

      expect(useHistoryStore.getState().canRedo()).toBe(true);
    });
  });

  describe('clearHistory', () => {
    it('clears all versions', () => {
      const workout = createMockWorkout('Test', 1);
      useHistoryStore.getState().saveVersion(workout, 'manual');
      useHistoryStore.getState().clearHistory();

      const state = useHistoryStore.getState();
      expect(state.versions).toHaveLength(0);
      expect(state.currentIndex).toBe(-1);
      expect(state.lastSavedSnapshot).toBe('');
    });
  });

  describe('markUndoRedoComplete', () => {
    it('resets isUndoRedoAction flag', () => {
      useHistoryStore.setState({ isUndoRedoAction: true });
      useHistoryStore.getState().markUndoRedoComplete();

      expect(useHistoryStore.getState().isUndoRedoAction).toBe(false);
    });
  });
});
