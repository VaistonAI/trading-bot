/**
 * Servicio de Posiciones - OPTIMIZADO
 * Obtiene datos en tiempo real del backend (Alpaca API)
 * NO USA FIREBASE - Solo backend para datos actuales
 * Firebase solo se usa para historial de trades
 */

import { backendDataService } from './backendDataService';
import type { Position, PositionMetrics, PositionSummary } from '../types/position';
import { alphaVantageService } from './alphaVantageService';

export const positionService = {
    /**
     * Obtiene todas las posiciones actuales desde el backend (Alpaca)
     * NO USA FIREBASE - Datos siempre en tiempo real
     */
    async getByStrategy(strategyId?: string): Promise<Position[]> {
        try {
            // Obtener posiciones directamente del backend (Alpaca API)
            const backendPositions = await backendDataService.getPositions();

            // Convertir formato del backend al formato de la aplicación
            const positions: Position[] = await Promise.all(
                backendPositions.map(async (bp) => {
                    const exchangeRate = await alphaVantageService.getExchangeRate();

                    const avgBuyPrice = parseFloat(bp.avg_entry_price);
                    const currentPrice = parseFloat(bp.current_price);
                    const quantity = parseFloat(bp.qty);

                    const avgBuyPriceInMXN = avgBuyPrice * exchangeRate;
                    const currentPriceInMXN = currentPrice * exchangeRate;

                    const totalValue = currentPriceInMXN * quantity;
                    const totalCost = avgBuyPriceInMXN * quantity;
                    const unrealizedGain = totalValue - totalCost;
                    const unrealizedGainPercent = (unrealizedGain / totalCost) * 100;

                    const metrics: PositionMetrics = {
                        unrealizedGain,
                        unrealizedGainPercent,
                        totalValue,
                        dayChange: 0, // Calcular si es necesario
                        dayChangePercent: 0,
                    };

                    return {
                        id: bp.symbol, // Usar symbol como ID temporal
                        strategyId: strategyId || 'default',
                        symbol: bp.symbol,
                        companyName: bp.symbol, // Podría mejorarse con lookup
                        quantity,
                        avgBuyPrice,
                        avgBuyPriceInMXN,
                        currentPrice,
                        currentPriceInMXN,
                        exchangeRate,
                        metrics,
                        lastUpdate: new Date() as any, // Timestamp actual
                        createdAt: new Date() as any,
                    };
                })
            );

            return positions;
        } catch (error) {
            console.error('Error getting positions from backend:', error);
            return []; // Retornar array vacío en caso de error
        }
    },

    /**
     * Obtiene una posición por símbolo desde el backend
     * NO USA FIREBASE - Datos siempre en tiempo real
     */
    async getBySymbol(strategyId: string, symbol: string): Promise<Position | null> {
        try {
            const positions = await this.getByStrategy(strategyId);
            return positions.find(p => p.symbol === symbol.toUpperCase()) || null;
        } catch (error) {
            console.error('Error getting position by symbol:', error);
            return null;
        }
    },

    /**
     * Calcula el resumen de posiciones
     * Usa datos en tiempo real del backend
     */
    async getSummary(strategyId?: string): Promise<PositionSummary> {
        try {
            const positions = await this.getByStrategy(strategyId);

            const summary: PositionSummary = {
                totalPositions: positions.length,
                totalValue: 0,
                totalCost: 0,
                totalUnrealizedGain: 0,
                totalUnrealizedGainPercent: 0,
            };

            positions.forEach(position => {
                summary.totalValue += position.metrics.totalValue;
                summary.totalCost += position.avgBuyPriceInMXN * position.quantity;
                summary.totalUnrealizedGain += position.metrics.unrealizedGain;
            });

            if (summary.totalCost > 0) {
                summary.totalUnrealizedGainPercent = (summary.totalUnrealizedGain / summary.totalCost) * 100;
            }

            return summary;
        } catch (error) {
            console.error('Error getting position summary:', error);
            return {
                totalPositions: 0,
                totalValue: 0,
                totalCost: 0,
                totalUnrealizedGain: 0,
                totalUnrealizedGainPercent: 0,
            };
        }
    },

    /**
     * Calcula métricas de una posición
     */
    calculateMetrics(
        quantity: number,
        avgBuyPriceInMXN: number,
        currentPriceInMXN: number,
        dayChange: number,
        dayChangePercent: number
    ): PositionMetrics {
        const totalValue = currentPriceInMXN * quantity;
        const totalCost = avgBuyPriceInMXN * quantity;
        const unrealizedGain = totalValue - totalCost;
        const unrealizedGainPercent = totalCost > 0 ? (unrealizedGain / totalCost) * 100 : 0;

        return {
            unrealizedGain,
            unrealizedGainPercent,
            totalValue,
            dayChange: dayChange * quantity,
            dayChangePercent,
        };
    },
};
