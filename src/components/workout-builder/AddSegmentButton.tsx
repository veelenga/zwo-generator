import { useState, useRef, useEffect } from 'react';
import type { WorkoutSegment } from '../../types/workout';
import { PlusIcon } from '../ui/Icons';

interface AddSegmentButtonProps {
  onAddSegment: (type: WorkoutSegment['type']) => void;
}

const SEGMENT_OPTIONS: { type: WorkoutSegment['type']; label: string; description: string }[] = [
  { type: 'warmup', label: 'Warm Up', description: 'Gradual power increase' },
  { type: 'steadystate', label: 'Steady State', description: 'Constant power' },
  { type: 'intervals', label: 'Intervals', description: 'Repeated on/off efforts' },
  { type: 'ramp', label: 'Ramp', description: 'Linear power change' },
  { type: 'freeride', label: 'Free Ride', description: 'No target power' },
  { type: 'maxeffort', label: 'Max Effort', description: 'All-out sprint' },
  { type: 'cooldown', label: 'Cool Down', description: 'Gradual power decrease' },
];

export function AddSegmentButton({ onAddSegment }: AddSegmentButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (type: WorkoutSegment['type']) => {
    onAddSegment(type);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="
          w-full py-3 px-4 rounded-lg border-2 border-dashed cursor-pointer
          border-gray-300 dark:border-gray-600
          text-gray-500 dark:text-gray-400
          hover:border-blue-500 hover:text-blue-500
          dark:hover:border-blue-400 dark:hover:text-blue-400
          transition-colors flex items-center justify-center gap-2
        "
      >
        <PlusIcon className="w-5 h-5" />
        Add Segment
      </button>

      {isOpen && (
        <div
          className="
            absolute bottom-full left-0 right-0 mb-2 z-10
            bg-white dark:bg-gray-800 rounded-lg shadow-lg
            border border-gray-200 dark:border-gray-700
            overflow-hidden animate-fade-in
          "
        >
          {SEGMENT_OPTIONS.map((option) => (
            <button
              key={option.type}
              onClick={() => handleSelect(option.type)}
              className="
                w-full px-4 py-3 text-left cursor-pointer
                hover:bg-gray-50 dark:hover:bg-gray-700
                transition-colors
              "
            >
              <div className="font-medium text-gray-900 dark:text-gray-100">
                {option.label}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {option.description}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
