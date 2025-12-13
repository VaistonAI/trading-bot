import { Timestamp } from 'firebase/firestore';
import type { StrategyType } from './strategy';
import type { UniverseType } from '../config/universes';

/**
 * Configuración de simulación
 */
export interface SimulationConfig {
    strategyType: StrategyType;
    strategyName: string;
    initialCapital: number; // MXN
    maxPositions: number; // Posiciones simultáneas
    startDate: string; // YYYY-MM-DD
    endDate: string; // YYYY-MM-DD
    universe: UniverseType; // Universo de acciones
    topN: number; // Top N símbolos a seleccionar
}

/**
 * Operación simulada
 */
export interface SimulationTrade {
    date: string;
    symbol: string;
    type: 'BUY' | 'SELL';
    quantity: number;
    price: number;
    commission: number;
    total: number;
    profit?: number; // Solo para ventas
    reason: string;
}

/**
 * Posición durante simulación
 */
export interface SimulationPosition {
    symbol: string;
    quantity: number;
    averagePrice: number;
    currentPrice: number;
    unrealizedProfit: number;
    unrealizedProfitPercent: number;
}

/**
 * Snapshot del portafolio en un día
 */
export interface PortfolioSnapshot {
    date: string;
    cash: number;
    positionsValue: number;
    totalValue: number;
    positions: SimulationPosition[];
}

/**
 * Métricas de la simulación
 */
export interface SimulationMetrics {
    totalReturn: number; // %
    totalReturnMXN: number; // MXN
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    winRate: number; // %
    bestTrade: number; // MXN
    worstTrade: number; // MXN
    averageWin: number; // MXN
    averageLoss: number; // MXN
    maxDrawdown: number; // %
    sharpeRatio: number;
    buyAndHoldReturn: number; // %
    vsMarket: number; // % diferencia vs buy & hold
    totalCommissions: number; // MXN
    totalTaxes: number; // MXN
}

/**
 * Resultado completo de simulación
 */
export interface SimulationResult {
    config: SimulationConfig;
    trades: SimulationTrade[];
    snapshots: PortfolioSnapshot[];
    metrics: SimulationMetrics;
    finalCapital: number;
    executedAt: Timestamp;
}

/**
 * Datos históricos de mercado
 */
export interface HistoricalData {
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

/**
 * Indicadores técnicos calculados
 */
export interface TechnicalIndicators {
    rsi?: number;
    macd?: number;
    signal?: number;
    ma20?: number;
    ma50?: number;
    ma200?: number;
}

/**
 * Datos de mercado con indicadores
 */
export interface MarketDataPoint extends HistoricalData {
    indicators: TechnicalIndicators;
}
