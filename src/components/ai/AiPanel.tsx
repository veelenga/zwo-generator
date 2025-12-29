import { useAI } from '../../hooks/useAI';
import { useWorkoutStore } from '../../store/workoutStore';
import { PromptInput } from './PromptInput';
import { CloseIcon } from '../ui/Icons';

export function AiPanel() {
  const { workout } = useWorkoutStore();
  const { isLoading, error, interpretation, refine, clearError } = useAI();

  const hasWorkout = workout.segments.length > 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <div className="space-y-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {hasWorkout
            ? 'Describe how you want to modify your workout'
            : 'Use the main input above to generate a workout first'}
        </p>

        {hasWorkout && (
          <PromptInput
            onSubmit={refine}
            isLoading={isLoading}
            placeholder="e.g., Make the intervals harder, add more recovery..."
          />
        )}

        {error && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 animate-fade-in">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              <button
                onClick={clearError}
                className="text-red-400 hover:text-red-600 dark:hover:text-red-300"
              >
                <CloseIcon />
              </button>
            </div>
          </div>
        )}

        {interpretation && (
          <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 animate-fade-in">
            <p className="text-sm text-green-600 dark:text-green-400">{interpretation}</p>
          </div>
        )}

        {hasWorkout && !isLoading && (
          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-400 mb-2">Quick suggestions:</p>
            <div className="flex flex-wrap gap-2">
              {[
                'Make it harder',
                'Add more recovery',
                'Extend the warmup',
                'Add cool down',
                'More intervals',
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => refine(suggestion)}
                  className="
                    px-2 py-1 text-xs rounded-full
                    bg-gray-100 dark:bg-gray-700
                    text-gray-600 dark:text-gray-300
                    hover:bg-gray-200 dark:hover:bg-gray-600
                    transition-colors
                  "
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
