import { tradeService } from './tradeService';
import { positionService } from './positionService';
import { strategyService } from './strategyService';
// import { alertService } from './alertService'; // TODO: Create alertService
import { alphaVantageService } from './alphaVantageService';
import { telegramService } from './telegramService';
import type { TradingAlert } from '../types/alert';
import type { TradeFormData } from '../types/trade';
import { TradeType } from '../types/trade';

/**
 * Servicio de trading automático (paper trading)
 * Ejecuta operaciones simuladas basadas en alertas
 */

const MAX_TRADES_PER_DAY = 5;
const MAX_POSITION_SIZE_PERCENT = 0.20; // 20% del capital

export const autoTradeService = {
    /**
     * Ejecuta una alerta automáticamente (paper trading)
     */
    async executeAlert(alert: TradingAlert): Promise<string | null> {
        try {
            // Obtener estrategia
            const strategy = await strategyService.getById(alert.strategyId);
            if (!strategy) {
                throw new Error('Estrategia no encontrada');
            }

            // Verificar límite de operaciones diarias
            const todayTrades = await this.getTodayTradesCount(alert.strategyId);
            if (todayTrades >= MAX_TRADES_PER_DAY) {
                console.log('Límite de operaciones diarias alcanzado');
                return null;
            }

            // Obtener precio actual
            const quote = await alphaVantageService.getQuote(alert.symbol);
            if (!quote) {
                throw new Error('No se pudo obtener precio actual');
            }

            const currentPrice = quote.price;

            // Calcular cantidad de acciones
            let quantity = 0;
            let totalCost = 0;

            if (alert.type === TradeType.BUY) {
                // Para compra: usar máximo 20% del capital virtual
                const maxInvestment = strategy.virtualCapital * MAX_POSITION_SIZE_PERCENT;
                quantity = Math.floor(maxInvestment / currentPrice);
                totalCost = quantity * currentPrice;

                // Verificar que hay capital suficiente
                if (totalCost > strategy.virtualCapital) {
                    console.log('Capital insuficiente');
                    return null;
                }
            } else {
                // Para venta: obtener posición actual
                const positions = await positionService.getByStrategy(alert.strategyId);
                const position = positions.find(p => p.symbol === alert.symbol);

                if (!position || position.quantity <= 0) {
                    console.log('No hay posición para vender');
                    return null;
                }

                quantity = position.quantity;
                totalCost = quantity * currentPrice;
            }

            if (quantity <= 0) {
                console.log('Cantidad inválida');
                return null;
            }

            // Crear trade
            const tradeData: TradeFormData = {
                type: alert.type,
                symbol: alert.symbol,
                companyName: alert.companyName || alert.symbol,
                quantity,
                price: currentPrice,
                date: new Date().toISOString().split('T')[0],
                notes: `Auto-ejecutado por alerta. Confianza: ${alert.confidence.level} (${alert.confidence.score}%). Razones: ${alert.confidence.reasons.join(', ')}`,
            };

            const tradeId = await tradeService.create(alert.strategyId, tradeData);

            // Marcar alerta como ejecutada
            // TODO: Implement alertService.markAsExecuted
            // await alertService.markAsExecuted(alert.id!, tradeId);

            // Actualizar capital virtual
            if (alert.type === TradeType.BUY) {
                await this.updateVirtualCapital(alert.strategyId, -totalCost);
            } else {
                await this.updateVirtualCapital(alert.strategyId, totalCost);
            }

            // Enviar notificación a Telegram si está habilitado
            if (strategy.telegramNotificationsEnabled) {
                const action = alert.type === TradeType.BUY ? 'COMPRA' : 'VENTA';
                await telegramService.sendMessage(
                    `🤖 <b>OPERACIÓN AUTOMÁTICA - ${strategy.name}</b>\n\n` +
                    `${action}: ${alert.symbol}\n` +
                    `Cantidad: ${quantity} acciones\n` +
                    `Precio: $${currentPrice.toFixed(2)} USD\n` +
                    `Total: $${totalCost.toFixed(2)} USD\n` +
                    `Confianza: ${alert.confidence.level} (${alert.confidence.score}%)\n\n` +
                    `Razones:\n${alert.confidence.reasons.map(r => `• ${r}`).join('\n')}`
                );
            }

            console.log(`✅ Trade ejecutado: ${alert.type} ${quantity} ${alert.symbol} @ $${currentPrice}`);
            return tradeId;
        } catch (error) {
            console.error('Error executing alert:', error);
            return null;
        }
    },

    /**
     * Obtiene el número de trades realizados hoy
     */
    async getTodayTradesCount(strategyId: string): Promise<number> {
        try {
            const trades = await tradeService.getByStrategy(strategyId);
            const today = new Date().toISOString().split('T')[0];
            return trades.filter(t => t.date === today).length;
        } catch (error) {
            console.error('Error getting today trades count:', error);
            return 0;
        }
    },

    /**
     * Actualiza el capital virtual de una estrategia
     */
    async updateVirtualCapital(strategyId: string, change: number): Promise<void> {
        try {
            const strategy = await strategyService.getById(strategyId);
            if (!strategy) return;

            const newCapital = strategy.virtualCapital + change;
            await strategyService.update(strategyId, {
                virtualCapital: newCapital,
            });
        } catch (error) {
            console.error('Error updating virtual capital:', error);
        }
    },

    /**
     * Calcula el capital disponible para trading
     */
    async getAvailableCapital(strategyId: string): Promise<number> {
        try {
            const strategy = await strategyService.getById(strategyId);
            if (!strategy) return 0;

            // Capital virtual menos el valor de posiciones abiertas
            const positions = await positionService.getByStrategy(strategyId);
            const investedCapital = positions.reduce((sum, pos) => sum + (pos.quantity * pos.avgBuyPrice), 0);

            return strategy.virtualCapital - investedCapital;
        } catch (error) {
            console.error('Error getting available capital:', error);
            return 0;
        }
    },
};
