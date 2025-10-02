import React, { useState, useRef, useEffect } from 'react';
import { clsx } from 'clsx';
import { format, isValid, parse } from 'date-fns';

export interface DatePickerProps {
  value?: Date;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  label?: string;
  required?: boolean;
  format?: string;
  minDate?: Date;
  maxDate?: Date;
  className?: string;
  inputClassName?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  placeholder = 'Select date...',
  disabled = false,
  error,
  label,
  required = false,
  format: dateFormat = 'MMM dd, yyyy',
  minDate,
  maxDate,
  className,
  inputClassName,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(
    value ? format(value, dateFormat) : ''
  );
  const containerRef = useRef<HTMLDivElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    try {
      const parsedDate = parse(newValue, dateFormat, new Date());
      if (isValid(parsedDate)) {
        onChange(parsedDate);
      }
    } catch {
      // Invalid date format
    }
  };

  const handleInputClick = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  // Close datepicker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update input value when prop value changes
  useEffect(() => {
    setInputValue(value ? format(value, dateFormat) : '');
  }, [value, dateFormat]);

  const inputId = `datepicker-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div ref={containerRef} className={clsx('relative', className)}>
      {label && (
        <label
          htmlFor={inputId}
          className={clsx(
            'form-label',
            required && "after:content-['*'] after:text-danger-500 after:ml-1",
            disabled && 'opacity-50'
          )}
        >
          {label}
        </label>
      )}

      <div className="relative">
        <input
          id={inputId}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onClick={handleInputClick}
          placeholder={placeholder}
          disabled={disabled}
          className={clsx(
            'form-input pr-10',
            error && 'border-danger-300 focus:ring-danger-500',
            disabled && 'opacity-50 cursor-not-allowed',
            inputClassName
          )}
        />
        
        <button
          type="button"
          onClick={handleInputClick}
          disabled={disabled}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </button>
      </div>

      {error && (
        <p className="form-error">
          {error}
        </p>
      )}

      {isOpen && (
        <div className="absolute z-50 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
          <div className="p-4">
            <input
              type="date"
              value={value ? format(value, 'yyyy-MM-dd') : ''}
              onChange={(e) => {
                const newDate = e.target.value ? new Date(e.target.value) : null;
                onChange(newDate);
                setIsOpen(false);
              }}
              min={minDate ? format(minDate, 'yyyy-MM-dd') : undefined}
              max={maxDate ? format(maxDate, 'yyyy-MM-dd') : undefined}
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default DatePicker;