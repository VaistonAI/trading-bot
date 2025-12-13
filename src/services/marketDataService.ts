/**
 * Adaptador para usar Alpaca en lugar de Alpha Vantage
 * Mantiene la misma interfaz para compatibilidad con código existente
 */

import { alpacaService } from './alpacaService';
import type { QuoteData, TimeSeriesData } from './alphaVantageService';

export const marketDataService = {
    /**
     * Obtiene cotización actual (compatible con Alpha Vantage)
     */
    async getQuote(symbol: string): Promise<QuoteData> {
        try {
            const alpacaQuote = await alpacaService.getQuote(symbol);

            // Convertir formato de Alpaca a formato Alpha Vantage
            return {
                symbol: alpacaQuote.symbol,
                price: alpacaQuote.price,
                change: alpacaQuote.change,
                changePercent: alpacaQuote.changePercent,
                volume: alpacaQuote.volume,
                high: alpacaQuote.price, // Fallback: usar price actual
                low: alpacaQuote.price, // Fallback: usar price actual
                open: alpacaQuote.price, // Fallback: usar price actual
                previousClose: alpacaQuote.price, // Fallback: usar price actual
                latestTradingDay: alpacaQuote.latestTradingDay,
            };
        } catch (error) {
            console.error(`Error getting quote for ${symbol}:`, error);
            throw error;
        }
    },

    /**
     * Obtiene datos históricos (compatible con Alpha Vantage)
     */
    async getTimeSeries(symbol: string, outputSize: 'compact' | 'full' = 'compact'): Promise<TimeSeriesData[]> {
        try {
            const endDate = new Date().toISOString().split('T')[0];
            const startDate = outputSize === 'full'
                ? new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 1 año
                : new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 100 días

            const bars = await alpacaService.getHistoricalBars(symbol, '1Day', startDate, endDate);

            // Convertir formato de Alpaca a formato Alpha Vantage
            return bars.map(bar => ({
                date: new Date(bar.t).toISOString().split('T')[0],
                open: bar.o,
                high: bar.h,
                low: bar.l,
                close: bar.c,
                volume: bar.v,
            }));
        } catch (error) {
            console.error(`Error getting time series for ${symbol}:`, error);
            throw error;
        }
    },

    /**
     * Calcula RSI (Relative Strength Index)
     */
    calculateRSI(data: TimeSeriesData[], period: number = 14): number {
        if (data.length < period + 1) return 50; // Default si no hay suficientes datos

        let gains = 0;
        let losses = 0;

        for (let i = data.length - period; i < data.length; i++) {
            const change = data[i].close - data[i - 1].close;
            if (change > 0) {
                gains += change;
            } else {
                losses += Math.abs(change);
            }
        }

        const avgGain = gains / period;
        const avgLoss = losses / period;

        if (avgLoss === 0) return 100;

        const rs = avgGain / avgLoss;
        return 100 - (100 / (1 + rs));
    },

    /**
     * Calcula Moving Average
     */
    calculateMA(data: TimeSeriesData[], period: number): number {
        if (data.length < period) return data[data.length - 1]?.close || 0;

        let sum = 0;
        for (let i = data.length - period; i < data.length; i++) {
            sum += data[i].close;
        }
        return sum / period;
    },

    /**
     * Obtiene múltiples cotizaciones
     */
    async getMultipleQuotes(symbols: string[]): Promise<Map<string, QuoteData>> {
        const quotes = new Map<string, QuoteData>();

        for (const symbol of symbols) {
            try {
                const quote = await this.getQuote(symbol);
                quotes.set(symbol, quote);
            } catch (error) {
                console.error(`Error getting quote for ${symbol}:`, error);
            }
        }

        return quotes;
    },
};
