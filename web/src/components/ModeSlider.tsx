import { clsx } from 'clsx';

interface ModeSliderProps {
    value: 'professional' | 'all' | 'personal';
    onChange: (mode: 'professional' | 'all' | 'personal') => void;
    className?: string;
}

export default function ModeSlider({ value, onChange, className }: ModeSliderProps) {
    const positions = ['professional', 'all', 'personal'] as const;
    const labels = { professional: 'Work', all: 'All', personal: 'Personal' };

    return (
        <div className={clsx('flex items-center p-0.5 bg-gray-50 border border-gray-200 rounded-full', className)}>
            {positions.map((pos) => (
                <button
                    key={pos}
                    onClick={() => onChange(pos)}
                    className={clsx(
                        'flex-1 px-3 py-1 text-xs sm:text-sm font-medium rounded-full transition-all duration-200',
                        value === pos
                            ? 'bg-white shadow-sm text-gray-900 border border-gray-200/50'
                            : 'text-gray-400 hover:text-gray-600'
                    )}
                >
                    {labels[pos]}
                </button>
            ))}
        </div>
    );
}
