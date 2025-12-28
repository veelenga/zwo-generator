import { forwardRef, type InputHTMLAttributes } from 'react';

interface SliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  showValue?: boolean;
  formatValue?: (value: number) => string;
}

export const Slider = forwardRef<HTMLInputElement, SliderProps>(
  ({ label, showValue = true, formatValue, value, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const displayValue = formatValue
      ? formatValue(Number(value))
      : String(value);

    return (
      <div className="w-full">
        {(label || showValue) && (
          <div className="flex items-center justify-between mb-2">
            {label && (
              <label
                htmlFor={inputId}
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                {label}
              </label>
            )}
            {showValue && (
              <span className="text-sm font-mono text-gray-600 dark:text-gray-400">
                {displayValue}
              </span>
            )}
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          type="range"
          value={value}
          className={`
            w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer
            accent-blue-600
            ${className}
          `}
          {...props}
        />
      </div>
    );
  }
);

Slider.displayName = 'Slider';
