import { useState, useRef, useEffect, useCallback, type KeyboardEvent, type DragEvent } from 'react';
import { SpinnerIcon, ArrowRightIcon, FileIcon, CloseIcon } from '../ui/Icons';
import { sanitizePrompt, isPromptValid, MAX_PROMPT_LENGTH } from '../../lib/validation';
import { importZwoFile } from '../../lib/zwoImport';
import { getTotalDuration } from '../../utils/workoutUtils';
import { formatDurationShort } from '../../utils/formatters';
import type { Workout } from '../../types/workout';

interface PromptInputProps {
  onSubmit: (prompt: string) => void;
  onFileImport?: (workout: Workout, refinementPrompt?: string) => void;
  onFileStateChange?: (hasFile: boolean) => void;
  isLoading: boolean;
  placeholder?: string;
  showFileHint?: boolean;
}

const SINGLE_LINE_HEIGHT_THRESHOLD = 60;
const DRAG_OVER_BORDER_CLASS = 'border-blue-500 ring-2 ring-blue-500';

export function PromptInput({
  onSubmit,
  onFileImport,
  onFileStateChange,
  isLoading,
  placeholder = 'Describe your workout...',
  showFileHint = false,
}: PromptInputProps) {
  const [value, setValue] = useState('');
  const [isMultiline, setIsMultiline] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [importedFile, setImportedFile] = useState<{ name: string; workout: Workout } | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${scrollHeight}px`;
      setIsMultiline(scrollHeight > SINGLE_LINE_HEIGHT_THRESHOLD);
    }
  }, [value]);

  const handleSubmit = useCallback(async () => {
    if (isLoading) return;

    if (importedFile && onFileImport) {
      const refinementPrompt = value.trim() ? sanitizePrompt(value) : undefined;
      const workoutToImport = importedFile.workout;
      setValue('');
      setImportedFile(null);
      onFileStateChange?.(false);
      await onFileImport(workoutToImport, refinementPrompt);
      return;
    }

    const sanitized = sanitizePrompt(value);
    if (isPromptValid(sanitized)) {
      onSubmit(sanitized);
      setValue('');
    }
  }, [isLoading, importedFile, onFileImport, onFileStateChange, value, onSubmit]);

  const processFile = useCallback(async (file: File) => {
    setFileError(null);

    const result = await importZwoFile(file);

    if (result.success) {
      setImportedFile({ name: file.name, workout: result.workout });
      onFileStateChange?.(true);
    } else {
      setFileError(result.error);
      setTimeout(() => setFileError(null), 5000);
    }
  }, [onFileStateChange]);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!onFileImport) return;

    const items = e.dataTransfer.items;
    if (items.length > 0) {
      setIsDragging(true);
    }
  }, [onFileImport]);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    async (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (!onFileImport) return;

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        await processFile(files[0]);
      }
    },
    [onFileImport, processFile]
  );

  const handleRemoveFile = useCallback(() => {
    setImportedFile(null);
    setFileError(null);
    onFileStateChange?.(false);
  }, [onFileStateChange]);

  const charCount = value.length;
  const isOverLimit = charCount > MAX_PROMPT_LENGTH;

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const canSubmit = importedFile
    ? !isLoading
    : value.trim() && !isLoading && !isOverLimit;

  const getPlaceholder = () => {
    if (importedFile) {
      return 'Optional: describe how to modify this workout...';
    }
    return placeholder;
  };

  return (
    <div className="space-y-2">
      {fileError && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 animate-fade-in">
          <p className="text-sm text-red-600 dark:text-red-400 flex-1">{fileError}</p>
          <button
            onClick={() => setFileError(null)}
            className="text-red-400 hover:text-red-600 dark:hover:text-red-300 cursor-pointer"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          flex gap-2 rounded-xl border bg-white dark:bg-gray-800
          transition-all duration-200
          ${isDragging
            ? DRAG_OVER_BORDER_CLASS
            : 'border-gray-300 dark:border-gray-600 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent'
          }
          ${isMultiline ? 'items-start' : 'items-center'}
        `}
      >
        <textarea
          ref={textareaRef}
          id="workout-prompt"
          name="workout-prompt"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={getPlaceholder()}
          disabled={isLoading}
          rows={1}
          className="
            flex-1 px-3 sm:px-4 py-3 bg-transparent
            text-gray-900 dark:text-gray-100
            placeholder-gray-400 dark:placeholder-gray-500
            disabled:opacity-50 disabled:cursor-not-allowed
            resize-none overflow-hidden
            max-h-[200px]
            text-sm sm:text-base
            focus:outline-none
          "
        />
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={`
            p-2 m-2 rounded-lg shrink-0 cursor-pointer
            bg-blue-600 text-white
            hover:bg-blue-700
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors
          `}
          title={importedFile ? (value.trim() ? 'Import & Refine' : 'Import') : 'Generate'}
        >
          {isLoading ? (
            <SpinnerIcon className="h-5 w-5" />
          ) : (
            <ArrowRightIcon className="h-5 w-5" />
          )}
        </button>
      </div>

      {importedFile && (
        <div className="flex items-center animate-fade-in">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
            <FileIcon className="w-4 h-4 text-orange-500" />
            <div className="flex flex-col">
              <span className="text-sm font-medium text-orange-700 dark:text-orange-300">
                {importedFile.name}
              </span>
              <span className="text-xs text-orange-500 dark:text-orange-400">
                {importedFile.workout.segments.length} segments · {formatDurationShort(getTotalDuration(importedFile.workout.segments))}
              </span>
            </div>
            <button
              onClick={handleRemoveFile}
              className="ml-1 p-0.5 text-orange-400 hover:text-orange-600 dark:hover:text-orange-300 cursor-pointer"
              title="Remove file"
            >
              <CloseIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center text-xs">
        {showFileHint && !importedFile && !isDragging && (
          <span className="text-gray-400 dark:text-gray-500">
            Drop a .zwo file to import and fine-tune
          </span>
        )}
        {isDragging && (
          <span className="text-blue-500 font-medium">
            Drop to import workout
          </span>
        )}
        {!showFileHint && !isDragging && <span />}

        {charCount > 0 && (
          <span className={isOverLimit ? 'text-red-500' : 'text-gray-400'}>
            {charCount}/{MAX_PROMPT_LENGTH}
          </span>
        )}
      </div>
    </div>
  );
}
