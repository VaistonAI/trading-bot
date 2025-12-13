import { Timestamp } from 'firebase/firestore';

export interface PositionMetrics {
    unrealizedGain: number; // Ganancia no realizada en MXN
    unrealizedGainPercent: number; // Ganancia no realizada en %
    totalValue: number; // Valor total de la posición en MXN
    dayChange: number; // Cambio del día en MXN
    dayChangePercent: number; // Cambio del día en %
}

export interface Position {
    id: string;
    strategyId: string;
    symbol: string; // Símbolo de la acción
    companyName: string; // Nombre de la empresa
    quantity: number; // Cantidad de acciones
    avgBuyPrice: number; // Precio promedio de compra en USD
    avgBuyPriceInMXN: number; // Precio promedio de compra en MXN
    currentPrice: number; // Precio actual en USD
    currentPriceInMXN: number; // Precio actual en MXN
    exchangeRate: number; // Tipo de cambio actual USD/MXN
    metrics: PositionMetrics;
    lastUpdate: Timestamp;
    createdAt: Timestamp;
}

export interface PositionSummary {
    totalPositions: number;
    totalValue: number; // Valor total de todas las posiciones en MXN
    totalCost: number; // Costo total de todas las posiciones en MXN
    totalUnrealizedGain: number; // Ganancia total no realizada en MXN
    totalUnrealizedGainPercent: number; // Ganancia total no realizada en %
}
