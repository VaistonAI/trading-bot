export interface StockResearch {
    symbol: string;
    name: string;

    // Rendimiento
    totalReturn5Y: number;      // % total 5 años
    cagr: number;               // Compound Annual Growth Rate
    yearlyReturns: number[];    // Rendimiento por año

    // Estabilidad
    volatility: number;         // Desviación estándar
    sharpeRatio: number;        // Retorno ajustado por riesgo
    maxDrawdown: number;        // Caída máxima

    // Consistencia
    positiveYears: number;      // Años con ganancia
    consistencyScore: number;   // 0-100

    // Estrategias
    strategyPerformance: {
        momentum: number;
        value: number;
        growth: number;
        dividend: number;
        sectorRotation: number;
        buyAndHold: number;
    };

    // Predicción
    stabilityScore: number;     // 0-100
    recommendation: 'BUY' | 'HOLD' | 'AVOID';

    // Datos históricos
    historicalPrices?: Array<{
        date: string;
        close: number;
    }>;
}

export interface ResearchFilters {
    sortBy: 'totalReturn' | 'stability' | 'volatility' | 'sharpeRatio' | 'consistency';
    minReturn?: number;
    maxVolatility?: number;
    minStability?: number;
}
