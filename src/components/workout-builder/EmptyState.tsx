import { LightningIcon, CloseIcon } from '../ui/Icons';
import { PromptInput } from '../ai/PromptInput';

interface EmptyStateProps {
  onGenerate: (prompt: string) => void;
  isLoading: boolean;
  error: string | null;
  onClearError: () => void;
}

const EXAMPLE_PROMPTS = [
  { label: '30min Recovery', prompt: '30 minute easy recovery ride, keep power below 60%' },
  { label: '1hr Endurance', prompt: '1 hour endurance ride with steady zone 2 power' },
  { label: 'Sweet Spot', prompt: '45 minute sweet spot workout with 3x10 minute intervals at 88-93%' },
  { label: 'VO2max Intervals', prompt: '45 minute VO2max workout with 5x3 minute intervals at 110-120%' },
  { label: 'Threshold', prompt: '1 hour threshold workout with 2x20 minute intervals at FTP' },
  { label: 'Sprint Training', prompt: '30 minute sprint workout with 8x30 second max efforts' },
];

export function EmptyState({ onGenerate, isLoading, error, onClearError }: EmptyStateProps) {
  return (
    <div className="text-center py-8 sm:py-12 px-2 animate-slide-in max-w-2xl mx-auto">
      {/* Icon */}
      <div className="mb-4 sm:mb-6">
        <LightningIcon className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-orange-500" />
      </div>

      {/* Title */}
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
        Create Your Workout
      </h1>

      {/* Description */}
      <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-6 sm:mb-8 max-w-md mx-auto">
        Describe your workout in plain English, or click one of the examples below to get started.
      </p>

      {/* Input */}
      <div className="mb-6">
        <PromptInput
          onSubmit={onGenerate}
          isLoading={isLoading}
          placeholder="e.g., 45 minute threshold workout with 3x8 minute intervals..."
        />
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 animate-fade-in text-left">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            <button
              onClick={onClearError}
              aria-label="Close error"
              className="text-red-400 hover:text-red-600 dark:hover:text-red-300 shrink-0 cursor-pointer"
            >
              <CloseIcon />
            </button>
          </div>
        </div>
      )}

      {/* Example buttons */}
      <div className="flex flex-wrap justify-center gap-2 max-w-2xl mx-auto">
        {EXAMPLE_PROMPTS.map((example) => (
          <button
            key={example.label}
            onClick={() => onGenerate(example.prompt)}
            className="
              px-4 py-2 rounded-full text-sm cursor-pointer
              bg-gray-100 dark:bg-gray-800
              text-gray-700 dark:text-gray-300
              hover:bg-blue-100 hover:text-blue-700
              dark:hover:bg-blue-900/30 dark:hover:text-blue-300
              transition-colors
            "
          >
            {example.label}
          </button>
        ))}
      </div>
    </div>
  );
}
