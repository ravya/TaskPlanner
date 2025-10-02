import React, { useState, useRef, useEffect } from 'react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '../../../store/slices/uiSlice';
import Input from '../../ui/Input';

export interface SearchInputProps {
  value?: string;
  onChange: (value: string) => void;
  onSearch?: (value: string) => void;
  onClear?: () => void;
  placeholder?: string;
  debounceDelay?: number;
  showSearchButton?: boolean;
  showClearButton?: boolean;
  suggestions?: SearchSuggestion[];
  onSuggestionSelect?: (suggestion: SearchSuggestion) => void;
  loading?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  inputClassName?: string;
  autoFocus?: boolean;
}

export interface SearchSuggestion {
  id: string;
  title: string;
  description?: string;
  category?: string;
  icon?: React.ReactNode;
  data?: any;
}

// Custom hook for debounced search
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export const SearchInput: React.FC<SearchInputProps> = ({
  value = '',
  onChange,
  onSearch,
  onClear,
  placeholder = 'Search...',
  debounceDelay = 300,
  showSearchButton = false,
  showClearButton = true,
  suggestions = [],
  onSuggestionSelect,
  loading = false,
  disabled = false,
  size = 'md',
  className,
  inputClassName,
  autoFocus = false,
}) => {
  const [localValue, setLocalValue] = useState(value);
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const debouncedValue = useDebounce(localValue, debounceDelay);
  
  // Sync with external value
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Trigger search on debounced value change
  useEffect(() => {
    if (debouncedValue !== value) {
      onChange(debouncedValue);
      if (onSearch && debouncedValue.trim()) {
        onSearch(debouncedValue);
      }
    }
  }, [debouncedValue, onChange, onSearch, value]);

  // Auto focus
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    setShowSuggestions(true);
    setSelectedSuggestionIndex(-1);
  };

  const handleInputFocus = () => {
    setIsFocused(true);
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleInputBlur = () => {
    setIsFocused(false);
    // Delay hiding suggestions to allow for suggestion clicks
    setTimeout(() => {
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);
    }, 200);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter' && onSearch) {
        onSearch(localValue);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
        
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestionIndex >= 0) {
          handleSuggestionClick(suggestions[selectedSuggestionIndex]);
        } else if (onSearch) {
          onSearch(localValue);
        }
        break;
        
      case 'Escape':
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setLocalValue(suggestion.title);
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
    onSuggestionSelect?.(suggestion);
    onChange(suggestion.title);
  };

  const handleClear = () => {
    setLocalValue('');
    onChange('');
    onClear?.();
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleSearchClick = () => {
    if (onSearch) {
      onSearch(localValue);
    }
  };

  // Scroll selected suggestion into view
  useEffect(() => {
    if (selectedSuggestionIndex >= 0 && suggestionRefs.current[selectedSuggestionIndex]) {
      suggestionRefs.current[selectedSuggestionIndex]?.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      });
    }
  }, [selectedSuggestionIndex]);

  const searchIcon = (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );

  const clearIcon = (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );

  const loadingSpinner = (
    <div className="w-4 h-4 border-2 border-gray-300 border-t-primary-600 rounded-full animate-spin" />
  );

  return (
    <div ref={containerRef} className={clsx('relative', className)}>
      <Input
        ref={inputRef}
        value={localValue}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        size={size}
        className={inputClassName}
        leftIcon={loading ? loadingSpinner : searchIcon}
        rightIcon={
          <div className="flex items-center space-x-1">
            {showClearButton && localValue && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 text-gray-400 hover:text-gray-600 focus:outline-none"
                tabIndex={-1}
              >
                {clearIcon}
              </button>
            )}
            
            {showSearchButton && (
              <button
                type="button"
                onClick={handleSearchClick}
                disabled={disabled || loading}
                className="px-2 py-1 text-primary-600 hover:text-primary-700 focus:outline-none disabled:opacity-50"
              >
                Search
              </button>
            )}
          </div>
        }
      />

      {/* Search Suggestions */}
      <AnimatePresence>
        {showSuggestions && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-auto"
          >
            {suggestions.map((suggestion, index) => (
              <div
                key={suggestion.id}
                ref={(el) => (suggestionRefs.current[index] = el)}
                onClick={() => handleSuggestionClick(suggestion)}
                className={clsx(
                  'flex items-center px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0',
                  'hover:bg-gray-50 transition-colors',
                  index === selectedSuggestionIndex && 'bg-primary-50 text-primary-900'
                )}
              >
                {suggestion.icon && (
                  <div className="flex-shrink-0 mr-3 text-gray-400">
                    {suggestion.icon}
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {suggestion.title}
                    </p>
                    {suggestion.category && (
                      <span className="ml-2 px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                        {suggestion.category}
                      </span>
                    )}
                  </div>
                  {suggestion.description && (
                    <p className="text-sm text-gray-600 truncate mt-0.5">
                      {suggestion.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Quick search component for global search
export const QuickSearch: React.FC<{
  onSearch: (query: string) => void;
  suggestions?: SearchSuggestion[];
  className?: string;
}> = ({ onSearch, suggestions = [], className }) => {
  const { searchQuery, setSearchQuery } = useUIStore();

  return (
    <SearchInput
      value={searchQuery}
      onChange={setSearchQuery}
      onSearch={onSearch}
      placeholder="Quick search..."
      suggestions={suggestions}
      className={className}
      showSearchButton
      size="sm"
    />
  );
};

export default SearchInput;