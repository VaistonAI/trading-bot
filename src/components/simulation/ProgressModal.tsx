import React from 'react';
import { FaCheckCircle } from 'react-icons/fa';
import type { ScreenerProgress } from '../../services/stockScreenerService';

interface ProgressModalProps {
    isOpen: boolean;
    progress: ScreenerProgress | null;
}

export const ProgressModal: React.FC<ProgressModalProps> = ({ isOpen, progress }) => {
    if (!isOpen || !progress) return null;

    const getStageIcon = (stage: string) => {
        switch (stage) {
            case 'scanning':
                return '🔍';
            case 'ranking':
                return '📊';
            case 'selecting':
                return '✨';
            case 'complete':
                return '✅';
            default:
                return '⏳';
        }
    };

    const getStageLabel = (stage: string) => {
        switch (stage) {
            case 'scanning':
                return 'Escaneando Mercado';
            case 'ranking':
                return 'Rankeando Símbolos';
            case 'selecting':
                return 'Seleccionando Mejores';
            case 'complete':
                return 'Completado';
            default:
                return 'Procesando';
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                {/* Header */}
                <div className="text-center mb-6">
                    <div className="text-6xl mb-4 animate-pulse">
                        {getStageIcon(progress.stage)}
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">
                        {getStageLabel(progress.stage)}
                    </h2>
                    <p className="text-sm text-gray-600">
                        {progress.message}
                    </p>
                </div>

                {/* Progress Bar */}
                <div className="mb-6">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span>Progreso</span>
                        <span className="font-bold text-primary">{progress.percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                        <div
                            className="bg-gradient-to-r from-primary to-blue-600 h-4 rounded-full transition-all duration-300 ease-out flex items-center justify-end pr-2"
                            style={{ width: `${progress.percentage}%` }}
                        >
                            {progress.percentage > 10 && (
                                <span className="text-xs text-white font-bold">
                                    {progress.percentage}%
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Details */}
                <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Símbolos procesados:</span>
                        <span className="font-bold text-gray-800">
                            {progress.current} / {progress.total}
                        </span>
                    </div>
                </div>

                {/* Stages Checklist */}
                <div className="mt-6 space-y-2">
                    {['scanning', 'ranking', 'selecting', 'complete'].map((stage) => (
                        <div
                            key={stage}
                            className={`flex items-center gap-3 text-sm ${progress.stage === stage
                                ? 'text-primary font-semibold'
                                : progress.percentage > getStagePercentage(stage)
                                    ? 'text-green-600'
                                    : 'text-gray-400'
                                }`}
                        >
                            {progress.percentage > getStagePercentage(stage) ? (
                                <FaCheckCircle className="text-green-600" />
                            ) : progress.stage === stage ? (
                                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <div className="w-4 h-4 border-2 border-gray-300 rounded-full" />
                            )}
                            <span>{getStageLabel(stage)}</span>
                        </div>
                    ))}
                </div>

                {/* Info */}
                <div className="mt-6 text-center text-xs text-gray-500">
                    <p>Este proceso puede tardar 1-2 minutos</p>
                    <p>Por favor, no cierres esta ventana</p>
                </div>
            </div>
        </div>
    );
};

function getStagePercentage(stage: string): number {
    switch (stage) {
        case 'scanning':
            return 0;
        case 'ranking':
            return 70;
        case 'selecting':
            return 90;
        case 'complete':
            return 100;
        default:
            return 0;
    }
}
