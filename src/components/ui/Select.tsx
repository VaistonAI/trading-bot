import React, { type SelectHTMLAttributes } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
}

export const Select: React.FC<SelectProps> = ({
    label,
    error,
    className = '',
    children,
    ...props
}) => {
    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm font-medium text-text-primary mb-1">
                    {label}
                    {props.required && <span className="text-danger ml-1">*</span>}
                </label>
            )}
            <select
                className={`w-full px-4 py-2 border rounded-lg transition-all duration-200
          ${error
                        ? 'border-danger focus:ring-2 focus:ring-danger/20'
                        : 'border-border focus:border-primary focus:ring-2 focus:ring-primary/20'
                    }
          outline-none bg-white text-text-primary
          ${className}`}
                {...props}
            >
                {children}
            </select>
            <div className="min-h-[20px] mt-1">
                {error && (
                    <p className="text-sm text-danger">{error}</p>
                )}
            </div>
        </div>
    );
};
