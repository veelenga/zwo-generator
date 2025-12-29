import { useState } from 'react';
import { useWorkoutStore } from '../../store/workoutStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useHistory } from '../../hooks/useHistory';
import { Button } from '../ui/Button';
import { LightningIcon, UndoIcon, RedoIcon, PlusIcon, SettingsIcon, DownloadIcon } from '../ui/Icons';
import { downloadZwoFile } from '../../lib/zwoExport';

export function Header() {
  const { workout, updateWorkout, resetWorkout } = useWorkoutStore();
  const { setShowApiKeyModal, hasApiKey } = useSettingsStore();
  const { canUndo, canRedo, undo, redo } = useHistory();
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(workout.name);

  const hasSegments = workout.segments.length > 0;

  const handleNameSave = () => {
    updateWorkout({ name: tempName || 'New Workout' });
    setIsEditingName(false);
  };

  const handleExport = () => {
    if (!hasSegments) return;
    downloadZwoFile(workout);
  };

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <LightningIcon className="w-8 h-8 text-orange-500" />
            <span className="font-bold text-lg text-gray-900 dark:text-white hidden sm:inline">
              ZWO Generator
            </span>
          </div>

          {hasSegments && (
            <>
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 hidden sm:block" />

              {isEditingName ? (
                <input
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  onBlur={handleNameSave}
                  onKeyDown={(e) => e.key === 'Enter' && handleNameSave()}
                  className="
                    px-2 py-1 rounded border border-blue-500
                    bg-white dark:bg-gray-700
                    text-gray-900 dark:text-gray-100
                    focus:outline-none focus:ring-2 focus:ring-blue-500
                    text-sm
                  "
                  autoFocus
                />
              ) : (
                <button
                  onClick={() => {
                    setTempName(workout.name);
                    setIsEditingName(true);
                  }}
                  className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white truncate max-w-[200px]"
                  title="Click to rename"
                >
                  {workout.name || 'Untitled Workout'}
                </button>
              )}
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {hasSegments && (
            <div className="flex items-center gap-1 mr-2">
              <button
                onClick={undo}
                disabled={!canUndo}
                className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed"
                title="Undo (Cmd+Z)"
              >
                <UndoIcon />
              </button>
              <button
                onClick={redo}
                disabled={!canRedo}
                className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed"
                title="Redo (Cmd+Shift+Z)"
              >
                <RedoIcon />
              </button>
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={resetWorkout}
            title="New workout"
          >
            <PlusIcon />
            <span className="hidden sm:inline ml-1">New</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowApiKeyModal(true)}
            title="API Key Settings"
          >
            <SettingsIcon />
            {!hasApiKey() && (
              <span className="w-2 h-2 bg-red-500 rounded-full absolute -top-1 -right-1" />
            )}
          </Button>

          <Button
            size="sm"
            onClick={handleExport}
            disabled={!hasSegments}
          >
            <DownloadIcon />
            <span className="hidden sm:inline ml-1">Export</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
