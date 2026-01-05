import { useState, useCallback } from 'react';
import { useWorkoutStore } from '../store/workoutStore';
import { useHistoryStore } from '../store/historyStore';
import { useSettingsStore } from '../store/settingsStore';
import { generateWorkout } from '../lib/openai';
import type { Workout } from '../types/workout';

interface UseAIReturn {
  isLoading: boolean;
  error: string | null;
  interpretation: string | null;
  generate: (prompt: string) => Promise<void>;
  refine: (prompt: string) => Promise<void>;
  importWorkout: (workout: Workout, refinementPrompt?: string) => Promise<void>;
  clearError: () => void;
}

export function useAI(): UseAIReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [interpretation, setInterpretation] = useState<string | null>(null);

  const { workout, setWorkout, setIsGenerating } = useWorkoutStore();
  const { saveVersion } = useHistoryStore();
  const { openaiApiKey, ftp, hasApiKey, setShowApiKeyModal } = useSettingsStore();

  const generate = useCallback(
    async (prompt: string) => {
      if (!hasApiKey()) {
        setShowApiKeyModal(true);
        return;
      }

      setIsLoading(true);
      setIsGenerating(true);
      setError(null);
      setInterpretation(null);

      try {
        const result = await generateWorkout({
          apiKey: openaiApiKey,
          prompt,
          ftp,
        });
        setWorkout(result.workout);
        saveVersion(result.workout, 'ai', `Generated: ${prompt.slice(0, 50)}`);
        setInterpretation(result.interpretation);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to generate workout';
        setError(message);
      } finally {
        setIsLoading(false);
        setIsGenerating(false);
      }
    },
    [openaiApiKey, ftp, hasApiKey, setShowApiKeyModal, setWorkout, saveVersion, setIsGenerating]
  );

  const refine = useCallback(
    async (prompt: string) => {
      if (!hasApiKey()) {
        setShowApiKeyModal(true);
        return;
      }

      if (workout.segments.length === 0) {
        setError('No workout to refine. Generate a workout first.');
        return;
      }

      setIsLoading(true);
      setIsGenerating(true);
      setError(null);
      setInterpretation(null);

      try {
        const result = await generateWorkout({
          apiKey: openaiApiKey,
          prompt,
          ftp,
          existingWorkout: workout,
        });
        setWorkout(result.workout);
        saveVersion(result.workout, 'ai', `Refined: ${prompt.slice(0, 50)}`);
        setInterpretation(result.interpretation);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to refine workout';
        setError(message);
      } finally {
        setIsLoading(false);
        setIsGenerating(false);
      }
    },
    [openaiApiKey, ftp, hasApiKey, setShowApiKeyModal, workout, setWorkout, saveVersion, setIsGenerating]
  );

  const importWorkout = useCallback(
    async (importedWorkout: Workout, refinementPrompt?: string) => {
      const hasRefinement = Boolean(refinementPrompt?.trim());

      // Check API key early if we need to refine
      if (hasRefinement && !hasApiKey()) {
        // Still import the workout, but show API key modal for refinement
        setWorkout(importedWorkout);
        saveVersion(importedWorkout, 'manual', `Imported: ${importedWorkout.name}`);
        setInterpretation(`Imported "${importedWorkout.name}" - configure API key to refine`);
        setShowApiKeyModal(true);
        return;
      }

      // If we're going to refine, show loading from the start
      if (hasRefinement) {
        setIsLoading(true);
        setIsGenerating(true);
        setError(null);
        setInterpretation(null);
      }

      // Import the workout
      setWorkout(importedWorkout);
      saveVersion(importedWorkout, 'manual', `Imported: ${importedWorkout.name}`);

      // If no refinement, just show import message
      if (!hasRefinement) {
        setInterpretation(`Imported "${importedWorkout.name}" with ${importedWorkout.segments.length} segments`);
        return;
      }

      // Refine the imported workout
      try {
        const result = await generateWorkout({
          apiKey: openaiApiKey,
          prompt: refinementPrompt!,
          ftp,
          existingWorkout: importedWorkout,
        });
        setWorkout(result.workout);
        saveVersion(result.workout, 'ai', `Refined import: ${refinementPrompt!.slice(0, 50)}`);
        setInterpretation(result.interpretation);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to refine workout';
        setError(message);
      } finally {
        setIsLoading(false);
        setIsGenerating(false);
      }
    },
    [openaiApiKey, ftp, hasApiKey, setShowApiKeyModal, setWorkout, saveVersion, setIsGenerating]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isLoading,
    error,
    interpretation,
    generate,
    refine,
    importWorkout,
    clearError,
  };
}
