import { Timestamp } from 'firebase/firestore';

/**
 * Tipos de alertas de trading
 */
export const AlertType = {
    BUY: 'BUY',
    SELL: 'SELL',
} as const;

export type AlertTypeValue = typeof AlertType[keyof typeof AlertType];

/**
 * Nivel de confianza de la señal
 */
export interface SignalConfidence {
    level: 'HIGH' | 'MEDIUM' | 'LOW';
    score: number; // 0-100
    reasons: string[];
}

/**
 * Alerta de trading
 */
export interface TradingAlert {
    id?: string;
    strategyId: string;
    strategyName: string;
    type: AlertTypeValue;
    symbol: string;
    companyName?: string;
    price: number;
    confidence: SignalConfidence;
    timestamp: Timestamp;
    read: boolean;
    autoExecuted: boolean;
    executedAt?: Timestamp;
    tradeId?: string; // ID del trade creado si se ejecutó
}

/**
 * Datos para crear una alerta
 */
export interface AlertFormData {
    strategyId: string;
    strategyName: string;
    type: AlertTypeValue;
    symbol: string;
    companyName?: string;
    price: number;
    confidence: SignalConfidence;
}

/**
 * Señal de trading detectada
 */
export interface TradingSignal {
    symbol: string;
    companyName?: string;
    type: AlertTypeValue;
    price: number;
    confidence: SignalConfidence;
    indicators: {
        [key: string]: number | string;
    };
}

/**
 * Configuración de monitoreo de una estrategia
 */
export interface MonitoringConfig {
    strategyId: string;
    symbols: string[]; // Símbolos a monitorear
    interval: number; // Intervalo en minutos
    enabled: boolean;
}
