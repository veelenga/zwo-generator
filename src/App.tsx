import { useRef } from 'react';
import { Layout } from './components/layout/Layout';
import { WorkoutBuilder } from './components/workout-builder/WorkoutBuilder';
import { PromptInput } from './components/ai/PromptInput';
import { CloseIcon } from './components/ui/Icons';
import { useAI } from './hooks/useAI';
import { useWorkoutStore } from './store/workoutStore';

function App() {
  const { workout } = useWorkoutStore();
  const { isLoading, error, generate, clearError } = useAI();
  const promptInputRef = useRef<HTMLDivElement>(null);

  const handleExampleClick = (prompt: string) => {
    generate(prompt);
  };

  const handleGenerate = (prompt: string) => {
    if (workout.segments.length === 0) {
      generate(prompt);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {workout.segments.length === 0 && (
          <div
            ref={promptInputRef}
            className="max-w-2xl mx-auto animate-slide-in"
          >
            <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-gray-100 mb-2">
              Generate Your Workout
            </h1>
            <p className="text-center text-gray-500 dark:text-gray-400 mb-6">
              Describe the workout you want to create
            </p>
            <PromptInput
              onSubmit={handleGenerate}
              isLoading={isLoading}
              placeholder="e.g., 45 minute threshold workout with 3x8 minute intervals..."
              submitLabel="Generate"
            />
            {error && (
              <div className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 animate-fade-in">
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
          </div>
        )}

        <WorkoutBuilder onExampleClick={handleExampleClick} />
      </div>
    </Layout>
  );
}

export default App;
