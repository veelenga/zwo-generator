import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { SpinnerIcon, ArrowRightIcon } from '../ui/Icons';
import { sanitizePrompt, isPromptValid, MAX_PROMPT_LENGTH } from '../../lib/validation';

interface PromptInputProps {
  onSubmit: (prompt: string) => void;
  isLoading: boolean;
  placeholder?: string;
}

const SINGLE_LINE_HEIGHT_THRESHOLD = 60;

export function PromptInput({
  onSubmit,
  isLoading,
  placeholder = 'Describe your workout...',
}: PromptInputProps) {
  const [value, setValue] = useState('');
  const [isMultiline, setIsMultiline] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${scrollHeight}px`;
      setIsMultiline(scrollHeight > SINGLE_LINE_HEIGHT_THRESHOLD);
    }
  }, [value]);

  const handleSubmit = () => {
    const sanitized = sanitizePrompt(value);
    if (isPromptValid(sanitized) && !isLoading) {
      onSubmit(sanitized);
      setValue('');
    }
  };

  const charCount = value.length;
  const isOverLimit = charCount > MAX_PROMPT_LENGTH;

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="space-y-1">
      <div className={`flex gap-2 rounded-xl border bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent ${isMultiline ? 'items-start' : 'items-center'}`}>
        <textarea
          ref={textareaRef}
          id="workout-prompt"
          name="workout-prompt"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
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
          disabled={!value.trim() || isLoading || isOverLimit}
          className={`
            p-2 m-2 rounded-lg shrink-0 cursor-pointer
            bg-blue-600 text-white
            hover:bg-blue-700
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors
          `}
        >
          {isLoading ? (
            <SpinnerIcon className="h-5 w-5" />
          ) : (
            <ArrowRightIcon className="h-5 w-5" />
          )}
        </button>
      </div>
      {charCount > 0 && (
        <div
          className={`text-right text-xs ${
            isOverLimit ? 'text-red-500' : 'text-gray-400'
          }`}
        >
          {charCount}/{MAX_PROMPT_LENGTH}
        </div>
      )}
    </div>
  );
}
