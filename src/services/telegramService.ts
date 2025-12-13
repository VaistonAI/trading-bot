import axios from 'axios';
import type { Trade } from '../types/trade';
import type { Strategy } from '../types/strategy';

const BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
const CHAT_ID = import.meta.env.VITE_TELEGRAM_CHAT_ID;
const BASE_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

export const telegramService = {
    /**
     * Envía un mensaje genérico a Telegram
     */
    async sendMessage(message: string, parseMode: 'HTML' | 'Markdown' = 'HTML'): Promise<number | null> {
        if (!BOT_TOKEN || !CHAT_ID) {
            console.warn('Telegram no configurado. Mensaje no enviado:', message);
            return null;
        }

        try {
            const response = await axios.post(`${BASE_URL}/sendMessage`, {
                chat_id: CHAT_ID,
                text: message,
                parse_mode: parseMode,
            });

            return response.data.result.message_id;
        } catch (error) {
            console.error('Error sending Telegram message:', error);
            throw new Error('Error al enviar mensaje a Telegram');
        }
    },

    /**
     * Envía alerta de compra
     */
    async sendBuyAlert(trade: Trade, strategyName: string): Promise<number | null> {
        const message = `
🟢 <b>SEÑAL DE COMPRA</b> 🟢

📊 <b>Estrategia:</b> ${strategyName}
🏢 <b>Acción:</b> ${trade.symbol}${trade.companyName ? ` (${trade.companyName})` : ''}
📈 <b>Cantidad:</b> ${trade.quantity} acciones
💵 <b>Precio:</b> $${trade.price.toFixed(2)} USD ($${trade.priceInMXN.toFixed(2)} MXN)
💰 <b>Total:</b> $${trade.totalCost.toFixed(2)} MXN
📅 <b>Fecha:</b> ${new Date(trade.timestamp.toDate()).toLocaleString('es-MX')}

${trade.notes ? `📝 <b>Notas:</b> ${trade.notes}` : ''}
        `.trim();

        return this.sendMessage(message);
    },

    /**
     * Envía alerta de venta
     */
    async sendSellAlert(trade: Trade, strategyName: string, profit?: number): Promise<number | null> {
        const profitText = profit !== undefined
            ? `\n💹 <b>Ganancia:</b> $${profit.toFixed(2)} MXN (${profit > 0 ? '+' : ''}${((profit / trade.totalCost) * 100).toFixed(2)}%)`
            : '';

        const message = `
🔴 <b>SEÑAL DE VENTA</b> 🔴

📊 <b>Estrategia:</b> ${strategyName}
🏢 <b>Acción:</b> ${trade.symbol}${trade.companyName ? ` (${trade.companyName})` : ''}
📉 <b>Cantidad:</b> ${trade.quantity} acciones
💵 <b>Precio:</b> $${trade.price.toFixed(2)} USD ($${trade.priceInMXN.toFixed(2)} MXN)
💰 <b>Total:</b> $${trade.totalCost.toFixed(2)} MXN${profitText}
📅 <b>Fecha:</b> ${new Date(trade.timestamp.toDate()).toLocaleString('es-MX')}

${trade.notes ? `📝 <b>Notas:</b> ${trade.notes}` : ''}
        `.trim();

        return this.sendMessage(message);
    },

    /**
     * Envía actualización de estado de una estrategia (cada 60 min)
     */
    async sendStatusUpdate(strategy: Strategy): Promise<number | null> {
        const { performance } = strategy;
        const returnPercent = performance.totalReturn;
        const emoji = returnPercent > 0 ? '📈' : returnPercent < 0 ? '📉' : '➡️';
        const color = returnPercent > 0 ? '🟢' : returnPercent < 0 ? '🔴' : '🟡';

        const message = `
${emoji} <b>REPORTE DE ESTADO</b> ${emoji}

📊 <b>Estrategia:</b> ${strategy.name}
${color} <b>Rendimiento:</b> ${returnPercent > 0 ? '+' : ''}${returnPercent.toFixed(2)}%

💼 <b>Capital Invertido:</b> $${performance.totalInvested.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
💰 <b>Valor Actual:</b> $${performance.currentValue.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
✅ <b>Ganancias Realizadas:</b> $${performance.realizedGains.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
📊 <b>Ganancias No Realizadas:</b> $${performance.unrealizedGains.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN

🔢 <b>Total de Operaciones:</b> ${performance.totalTrades}
🎯 <b>Tasa de Éxito:</b> ${performance.winRate.toFixed(1)}%

📅 <b>Última Actualización:</b> ${new Date().toLocaleString('es-MX')}
        `.trim();

        return this.sendMessage(message);
    },

    /**
     * Envía alerta de error o advertencia
     */
    async sendAlert(title: string, message: string, type: 'warning' | 'error' = 'warning'): Promise<number | null> {
        const emoji = type === 'error' ? '🚨' : '⚠️';
        const formattedMessage = `
${emoji} <b>${title}</b> ${emoji}

${message}

📅 ${new Date().toLocaleString('es-MX')}
        `.trim();

        return this.sendMessage(formattedMessage);
    },

    /**
     * Verifica si el bot está configurado correctamente
     */
    async testConnection(): Promise<boolean> {
        if (!BOT_TOKEN || !CHAT_ID) {
            return false;
        }

        try {
            await axios.get(`${BASE_URL}/getMe`);
            return true;
        } catch (error) {
            console.error('Error testing Telegram connection:', error);
            return false;
        }
    },
};
