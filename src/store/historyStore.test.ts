import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
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
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
});

describe('historyStore', () => {
  beforeEach(() => {
    useHistoryStore.getState().clearHistory();
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
      useHistoryStore.getState().saveVersion(createMockWorkout('First', 1), 'manual');
      useHistoryStore.getState().saveVersion(createMockWorkout('Second', 2), 'manual');

      const state = useHistoryStore.getState();
      expect(state.versions).toHaveLength(2);
      expect(state.currentIndex).toBe(1);
    });

    it('skips saving when snapshot equals the current version', () => {
      const workout = createMockWorkout('Test', 1);
      useHistoryStore.getState().saveVersion(workout, 'manual');
      useHistoryStore.getState().saveVersion(workout, 'manual');

      expect(useHistoryStore.getState().versions).toHaveLength(1);
    });

    it('truncates history after undo when new version is saved', () => {
      useHistoryStore.getState().saveVersion(createMockWorkout('First', 1), 'manual');
      useHistoryStore.getState().saveVersion(createMockWorkout('Second', 2), 'manual');
      useHistoryStore.getState().undo();
      useHistoryStore.getState().saveVersion(createMockWorkout('Third', 3), 'manual');

      const state = useHistoryStore.getState();
      expect(state.versions).toHaveLength(2);
      expect(state.versions[1].workoutSnapshot.name).toBe('Third');
    });
  });

  describe('scheduleSave', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('commits the workout after the debounce delay', () => {
      useHistoryStore.getState().scheduleSave(createMockWorkout('Debounced', 1));
      expect(useHistoryStore.getState().versions).toHaveLength(0);
      expect(useHistoryStore.getState().hasPendingSave).toBe(true);

      vi.advanceTimersByTime(1000);

      const state = useHistoryStore.getState();
      expect(state.versions).toHaveLength(1);
      expect(state.versions[0].workoutSnapshot.name).toBe('Debounced');
      expect(state.hasPendingSave).toBe(false);
    });

    it('keeps only the latest scheduled workout', () => {
      useHistoryStore.getState().scheduleSave(createMockWorkout('First', 1));
      useHistoryStore.getState().scheduleSave(createMockWorkout('Second', 2));

      vi.advanceTimersByTime(1000);

      const state = useHistoryStore.getState();
      expect(state.versions).toHaveLength(1);
      expect(state.versions[0].workoutSnapshot.name).toBe('Second');
    });

    it('does not schedule for empty workouts', () => {
      useHistoryStore.getState().scheduleSave(createMockWorkout('Empty', 0));
      expect(useHistoryStore.getState().hasPendingSave).toBe(false);

      vi.advanceTimersByTime(1000);
      expect(useHistoryStore.getState().versions).toHaveLength(0);
    });

    it('does not schedule when workout equals the current version', () => {
      const workout = createMockWorkout('Same', 1);
      useHistoryStore.getState().saveVersion(workout, 'manual');
      useHistoryStore.getState().scheduleSave(workout);

      expect(useHistoryStore.getState().hasPendingSave).toBe(false);

      vi.advanceTimersByTime(1000);
      expect(useHistoryStore.getState().versions).toHaveLength(1);
    });

    it('flushes pending save before an explicit saveVersion', () => {
      useHistoryStore.getState().scheduleSave(createMockWorkout('Edit', 1));
      useHistoryStore.getState().saveVersion(createMockWorkout('AI result', 2), 'ai');

      const state = useHistoryStore.getState();
      expect(state.versions).toHaveLength(2);
      expect(state.versions[0].workoutSnapshot.name).toBe('Edit');
      expect(state.versions[1].workoutSnapshot.name).toBe('AI result');
    });
  });

  describe('undo', () => {
    it('returns null when no history', () => {
      expect(useHistoryStore.getState().undo()).toBeNull();
    });

    it('returns null when at first version', () => {
      useHistoryStore.getState().saveVersion(createMockWorkout('Test', 1), 'manual');
      expect(useHistoryStore.getState().undo()).toBeNull();
    });

    it('returns previous workout when history exists', () => {
      useHistoryStore.getState().saveVersion(createMockWorkout('First', 1), 'manual');
      useHistoryStore.getState().saveVersion(createMockWorkout('Second', 2), 'manual');

      const result = useHistoryStore.getState().undo();
      expect(result?.name).toBe('First');
      expect(useHistoryStore.getState().currentIndex).toBe(0);
    });

    it('commits a pending save first so the latest edit is not lost', () => {
      vi.useFakeTimers();
      useHistoryStore.getState().saveVersion(createMockWorkout('Committed', 1), 'manual');
      useHistoryStore.getState().scheduleSave(createMockWorkout('Pending edit', 2));

      const result = useHistoryStore.getState().undo();

      expect(result?.name).toBe('Committed');
      const state = useHistoryStore.getState();
      expect(state.versions).toHaveLength(2);
      expect(state.versions[1].workoutSnapshot.name).toBe('Pending edit');
      expect(useHistoryStore.getState().redo()?.name).toBe('Pending edit');
      vi.useRealTimers();
    });
  });

  describe('redo', () => {
    it('returns null when no future history', () => {
      useHistoryStore.getState().saveVersion(createMockWorkout('Test', 1), 'manual');
      expect(useHistoryStore.getState().redo()).toBeNull();
    });

    it('returns next workout after undo', () => {
      useHistoryStore.getState().saveVersion(createMockWorkout('First', 1), 'manual');
      useHistoryStore.getState().saveVersion(createMockWorkout('Second', 2), 'manual');
      useHistoryStore.getState().undo();

      const result = useHistoryStore.getState().redo();
      expect(result?.name).toBe('Second');
      expect(useHistoryStore.getState().currentIndex).toBe(1);
    });
  });

  describe('canUndo / canRedo', () => {
    it('canUndo returns false when no history', () => {
      expect(useHistoryStore.getState().canUndo()).toBe(false);
    });

    it('canUndo returns false with single version', () => {
      useHistoryStore.getState().saveVersion(createMockWorkout('Test', 1), 'manual');
      expect(useHistoryStore.getState().canUndo()).toBe(false);
    });

    it('canUndo returns true with multiple versions', () => {
      useHistoryStore.getState().saveVersion(createMockWorkout('First', 1), 'manual');
      useHistoryStore.getState().saveVersion(createMockWorkout('Second', 2), 'manual');
      expect(useHistoryStore.getState().canUndo()).toBe(true);
    });

    it('canUndo returns true when an edit is pending over a saved version', () => {
      vi.useFakeTimers();
      useHistoryStore.getState().saveVersion(createMockWorkout('Committed', 1), 'manual');
      useHistoryStore.getState().scheduleSave(createMockWorkout('Pending', 2));

      expect(useHistoryStore.getState().canUndo()).toBe(true);
      vi.useRealTimers();
    });

    it('canRedo returns false at latest version', () => {
      useHistoryStore.getState().saveVersion(createMockWorkout('Test', 1), 'manual');
      expect(useHistoryStore.getState().canRedo()).toBe(false);
    });

    it('canRedo returns true after undo', () => {
      useHistoryStore.getState().saveVersion(createMockWorkout('First', 1), 'manual');
      useHistoryStore.getState().saveVersion(createMockWorkout('Second', 2), 'manual');
      useHistoryStore.getState().undo();
      expect(useHistoryStore.getState().canRedo()).toBe(true);
    });

    it('canRedo returns false while an edit is pending', () => {
      vi.useFakeTimers();
      useHistoryStore.getState().saveVersion(createMockWorkout('First', 1), 'manual');
      useHistoryStore.getState().saveVersion(createMockWorkout('Second', 2), 'manual');
      useHistoryStore.getState().undo();
      useHistoryStore.getState().scheduleSave(createMockWorkout('Pending', 3));

      expect(useHistoryStore.getState().canRedo()).toBe(false);
      vi.useRealTimers();
    });
  });

  describe('clearHistory', () => {
    it('clears all versions and pending saves', () => {
      vi.useFakeTimers();
      useHistoryStore.getState().saveVersion(createMockWorkout('Test', 1), 'manual');
      useHistoryStore.getState().scheduleSave(createMockWorkout('Pending', 2));
      useHistoryStore.getState().clearHistory();

      vi.advanceTimersByTime(1000);

      const state = useHistoryStore.getState();
      expect(state.versions).toHaveLength(0);
      expect(state.currentIndex).toBe(-1);
      expect(state.hasPendingSave).toBe(false);
      vi.useRealTimers();
    });
  });
});
