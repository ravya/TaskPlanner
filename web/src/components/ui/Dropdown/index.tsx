import React, { useState, useRef, useEffect } from 'react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

export interface DropdownItem {
  id: string;
  label: string;
  value: any;
  disabled?: boolean;
  icon?: React.ReactNode;
  divider?: boolean;
}

export interface DropdownProps {
  items: DropdownItem[];
  value?: any;
  onSelect: (item: DropdownItem) => void;
  placeholder?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  searchable?: boolean;
  maxHeight?: string;
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
  children?: React.ReactNode;
}

const dropdownVariants = {
  hidden: { opacity: 0, scale: 0.95, y: -5 },
  visible: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, y: -5 }
};

export const Dropdown: React.FC<DropdownProps> = ({
  items,
  value,
  onSelect,
  placeholder = 'Select option...',
  disabled = false,
  fullWidth = false,
  searchable = false,
  maxHeight = '16rem',
  className,
  buttonClassName,
  menuClassName,
  children,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedItem = items.find(item => item.value === value);

  const filteredItems = searchable
    ? items.filter(item =>
      item.label.toLowerCase().includes(searchTerm.toLowerCase())
    )
    : items;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when opening
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, searchable]);

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleSelect = (item: DropdownItem) => {
    if (!item.disabled) {
      onSelect(item);
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  return (
    <div
      ref={dropdownRef}
      className={clsx('relative', fullWidth ? 'w-full' : 'inline-block', className)}
    >
      {/* Dropdown Button */}
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={clsx(
          'flex items-center justify-between w-full px-3 py-2 text-left bg-white border border-gray-300 rounded-lg shadow-sm',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
          'hover:bg-gray-50 transition-colors',
          disabled && 'opacity-50 cursor-not-allowed hover:bg-white',
          buttonClassName
        )}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        {children ? (
          children
        ) : (
          <span className="flex items-center">
            {selectedItem?.icon && (
              <span className="mr-2 flex-shrink-0">
                {selectedItem.icon}
              </span>
            )}
            <span className={selectedItem ? 'text-gray-900' : 'text-gray-500'}>
              {selectedItem?.label || placeholder}
            </span>
          </span>
        )}
        {!children && (
          <svg
            className={clsx(
              'ml-2 h-5 w-5 text-gray-400 transition-transform',
              isOpen && 'rotate-180'
            )}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={dropdownVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.15 }}
            className={clsx(
              'absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg',
              'ring-1 ring-black ring-opacity-5 focus:outline-none',
              menuClassName
            )}
            style={{ maxHeight }}
          >
            <div className="overflow-auto" style={{ maxHeight }}>
              {searchable && (
                <div className="p-2 border-b border-gray-200">
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search..."
                    className="w-full px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>
              )}

              <div className="py-1" role="listbox">
                {filteredItems.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-gray-500">
                    No options found
                  </div>
                ) : (
                  filteredItems.map((item, index) => (
                    <React.Fragment key={item.id}>
                      {item.divider && index > 0 && (
                        <hr className="border-gray-200" />
                      )}
                      <button
                        type="button"
                        onClick={() => handleSelect(item)}
                        disabled={item.disabled}
                        className={clsx(
                          'w-full px-3 py-2 text-left text-sm flex items-center',
                          'hover:bg-gray-100 focus:outline-none focus:bg-gray-100',
                          item.disabled && 'opacity-50 cursor-not-allowed hover:bg-white',
                          item.value === value && 'bg-primary-50 text-primary-900'
                        )}
                        role="option"
                        aria-selected={item.value === value}
                      >
                        {item.icon && (
                          <span className="mr-2 flex-shrink-0">
                            {item.icon}
                          </span>
                        )}
                        {item.label}
                        {item.value === value && (
                          <svg className="ml-auto h-4 w-4 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    </React.Fragment>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dropdown;