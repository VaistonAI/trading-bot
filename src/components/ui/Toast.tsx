import React, { useState, useEffect } from 'react';
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaTimes } from 'react-icons/fa';

interface ToastProps {
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 5000);

        return () => clearTimeout(timer);
    }, [onClose]);

    const icons = {
        success: <FaCheckCircle className="text-2xl" />,
        error: <FaExclamationCircle className="text-2xl" />,
        info: <FaInfoCircle className="text-2xl" />,
        warning: <FaExclamationCircle className="text-2xl" />
    };

    const styles = {
        success: 'bg-gradient-to-r from-green-500 to-green-600 text-white',
        error: 'bg-gradient-to-r from-red-500 to-red-600 text-white',
        info: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white',
        warning: 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white'
    };

    return (
        <div className={`fixed top-4 right-4 z-50 animate-slide-in-right`}>
            <div className={`${styles[type]} rounded-lg shadow-2xl p-4 pr-12 min-w-[320px] max-w-md relative`}>
                <div className="flex items-center gap-3">
                    {icons[type]}
                    <p className="font-semibold text-sm">{message}</p>
                </div>
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 hover:opacity-75 transition-opacity"
                >
                    <FaTimes />
                </button>
            </div>
        </div>
    );
};

interface ToastContainerProps {
    toasts: Array<{ id: number; message: string; type: 'success' | 'error' | 'info' | 'warning' }>;
    removeToast: (id: number) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, removeToast }) => {
    return (
        <div className="fixed top-4 right-4 z-50 space-y-2">
            {toasts.map((toast, index) => (
                <div
                    key={toast.id}
                    style={{ transform: `translateY(${index * 80}px)` }}
                    className="transition-transform duration-300"
                >
                    <Toast
                        message={toast.message}
                        type={toast.type}
                        onClose={() => removeToast(toast.id)}
                    />
                </div>
            ))}
        </div>
    );
};

// Hook para usar toasts
export const useToast = () => {
    const [toasts, setToasts] = useState<Array<{ id: number; message: string; type: 'success' | 'error' | 'info' | 'warning' }>>([]);

    const addToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
    };

    const removeToast = (id: number) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    };

    return { toasts, addToast, removeToast };
};
