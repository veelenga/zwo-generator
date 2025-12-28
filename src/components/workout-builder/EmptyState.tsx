import { LightningIcon } from '../ui/Icons';

interface EmptyStateProps {
  onExampleClick: (prompt: string) => void;
}

const EXAMPLE_PROMPTS = [
  { label: '30min Recovery', prompt: '30 minute easy recovery ride, keep power below 60%' },
  { label: '1hr Endurance', prompt: '1 hour endurance ride with steady zone 2 power' },
  { label: 'Sweet Spot', prompt: '45 minute sweet spot workout with 3x10 minute intervals at 88-93%' },
  { label: 'VO2max Intervals', prompt: '45 minute VO2max workout with 5x3 minute intervals at 110-120%' },
  { label: 'Threshold', prompt: '1 hour threshold workout with 2x20 minute intervals at FTP' },
  { label: 'Sprint Training', prompt: '30 minute sprint workout with 8x30 second max efforts' },
];

export function EmptyState({ onExampleClick }: EmptyStateProps) {
  return (
    <div className="text-center py-12 px-4 animate-slide-in">
      <div className="mb-6">
        <LightningIcon className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600" />
      </div>

      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
        Create Your Workout
      </h2>
      <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
        Describe your workout in plain English, or click one of the examples below to get started.
      </p>

      <div className="flex flex-wrap justify-center gap-2 max-w-2xl mx-auto">
        {EXAMPLE_PROMPTS.map((example) => (
          <button
            key={example.label}
            onClick={() => onExampleClick(example.prompt)}
            className="
              px-4 py-2 rounded-full text-sm
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
