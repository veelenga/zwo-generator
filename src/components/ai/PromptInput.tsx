import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { SpinnerIcon } from '../ui/Icons';
import { sanitizePrompt, isPromptValid, MAX_PROMPT_LENGTH } from '../../lib/validation';

interface PromptInputProps {
  onSubmit: (prompt: string) => void;
  isLoading: boolean;
  placeholder?: string;
  submitLabel?: string;
}

export function PromptInput({
  onSubmit,
  isLoading,
  placeholder = 'Describe your workout...',
  submitLabel = 'Generate',
}: PromptInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
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
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={isLoading}
        rows={1}
        className="
          w-full px-4 py-3 pr-24 rounded-xl border
          bg-white dark:bg-gray-800
          text-gray-900 dark:text-gray-100
          border-gray-300 dark:border-gray-600
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          placeholder-gray-400 dark:placeholder-gray-500
          disabled:opacity-50 disabled:cursor-not-allowed
          resize-none overflow-hidden
          min-h-[48px] max-h-[200px]
        "
      />
      <button
        onClick={handleSubmit}
        disabled={!value.trim() || isLoading || isOverLimit}
        className="
          absolute right-2 top-1/2 -translate-y-1/2
          px-4 py-1.5 rounded-lg
          bg-blue-600 text-white text-sm font-medium
          hover:bg-blue-700
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-colors
        "
      >
        {isLoading ? <SpinnerIcon className="h-4 w-4" /> : submitLabel}
      </button>
      {charCount > 0 && (
        <div
          className={`absolute right-2 -bottom-5 text-xs ${
            isOverLimit ? 'text-red-500' : 'text-gray-400'
          }`}
        >
          {charCount}/{MAX_PROMPT_LENGTH}
        </div>
      )}
    </div>
  );
}
