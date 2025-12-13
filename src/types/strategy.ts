import { Timestamp } from 'firebase/firestore';

export const StrategyType = {
    MOMENTUM: 'MOMENTUM',
    VALUE: 'VALUE',
    GROWTH: 'GROWTH',
    DIVIDEND: 'DIVIDEND',
    SECTOR_ROTATION: 'SECTOR_ROTATION',
} as const;

export type StrategyType = typeof StrategyType[keyof typeof StrategyType];


export interface StrategyPerformance {
    totalReturn: number; // Porcentaje de retorno total
    totalInvested: number; // Total invertido en MXN
    currentValue: number; // Valor actual del portafolio en MXN
    realizedGains: number; // Ganancias realizadas (después de impuestos) en MXN
    unrealizedGains: number; // Ganancias no realizadas en MXN
    totalTrades: number; // Número total de operaciones
    winRate: number; // Porcentaje de operaciones ganadoras
    sharpeRatio?: number; // Ratio de Sharpe (opcional)
    maxDrawdown?: number; // Máxima caída (opcional)
}

export interface Strategy {
    id: string;
    name: string; // "Momentum Trading", "Value Investing", etc.
    type: StrategyType;
    description: string;
    isActive: boolean;
    telegramNotificationsEnabled: boolean;
    liveAlertsEnabled: boolean; // Alertas en vivo activadas
    virtualCapital: number; // Capital virtual para paper trading (MXN)
    lastUpdate: Timestamp;
    performance: StrategyPerformance;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface StrategyConfig {
    // Configuración específica de cada estrategia
    indicators?: string[]; // Indicadores técnicos a usar
    symbols?: string[]; // Símbolos a monitorear
    buyThreshold?: number; // Umbral de compra
    sellThreshold?: number; // Umbral de venta
    maxPositionSize?: number; // Tamaño máximo de posición en MXN
}
