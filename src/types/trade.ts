import { Timestamp } from 'firebase/firestore';

export const TradeType = {
    BUY: 'BUY',
    SELL: 'SELL',
} as const;

export type TradeType = typeof TradeType[keyof typeof TradeType];


export interface TradeFees {
    commission: number; // Comisión del broker en MXN
    tax: number; // ISR (10% sobre ganancias) en MXN
    total: number; // Total de fees en MXN
}

export interface Trade {
    id: string;
    strategyId: string;
    symbol: string; // Símbolo de la acción (ej: "AAPL", "TSLA")
    companyName?: string; // Nombre de la empresa (opcional)
    type: TradeType;
    quantity: number; // Cantidad de acciones
    price: number; // Precio por acción en USD
    priceInMXN: number; // Precio por acción en MXN
    exchangeRate: number; // Tipo de cambio USD/MXN al momento de la operación
    timestamp: Timestamp;
    date: string; // Fecha en formato ISO (YYYY-MM-DD)
    fees: TradeFees;
    totalCost: number; // Costo total en MXN (precio * cantidad + fees)
    notes?: string; // Notas adicionales (opcional)
    createdAt: Timestamp;
}

export interface TradeFormData {
    symbol: string;
    companyName?: string;
    type: TradeType;
    quantity: number;
    price: number;
    date: string;
    notes?: string;
}

// Constantes para cálculos
export const BROKER_COMMISSION_RATE = 0.0025; // 0.25%
export const MEXICO_CAPITAL_GAINS_TAX = 0.10; // 10% ISR sobre ganancias
