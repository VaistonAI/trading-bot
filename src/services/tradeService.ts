import {
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    Timestamp,
    limit,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Trade, TradeFormData, TradeFees } from '../types/trade';
import { BROKER_COMMISSION_RATE, MEXICO_CAPITAL_GAINS_TAX } from '../types/trade';
import { alphaVantageService } from './alphaVantageService';

/**
 * Servicio de Trades - OPTIMIZADO
 * 
 * ESCRITURA: Solo escribe en Firebase al ejecutar una compra/venta
 * LECTURA: Lee historial de trades desde Firebase (datos históricos)
 * 
 * NO guarda posiciones ni datos de cuenta en Firebase
 * Esos datos se obtienen en tiempo real del backend (ver backendDataService)
 */

const COLLECTION_NAME = 'trades';

export const tradeService = {
    /**
     * Calcula las comisiones de una operación
     */
    calculateFees(totalCost: number, profit: number = 0): TradeFees {
        const commission = totalCost * BROKER_COMMISSION_RATE;
        const tax = profit > 0 ? profit * MEXICO_CAPITAL_GAINS_TAX : 0;

        return {
            commission,
            tax,
            total: commission + tax,
        };
    },

    /**
     * Crea una nueva operación
     */
    async create(strategyId: string, formData: TradeFormData): Promise<string> {
        try {
            // Obtener tipo de cambio actual
            const exchangeRate = await alphaVantageService.getExchangeRate();

            // Calcular precios en MXN
            const priceInMXN = formData.price * exchangeRate;
            const subtotal = formData.price * formData.quantity;
            const subtotalMXN = subtotal * exchangeRate;

            // Calcular fees (sin impuestos en compra, solo comisión)
            const fees = this.calculateFees(subtotalMXN);
            const totalCost = subtotalMXN + fees.commission;

            const trade: Omit<Trade, 'id'> = {
                strategyId,
                symbol: formData.symbol.toUpperCase(),
                companyName: formData.companyName,
                type: formData.type,
                quantity: formData.quantity,
                price: formData.price,
                priceInMXN,
                exchangeRate,
                timestamp: Timestamp.now(),
                date: formData.date,
                fees: {
                    commission: fees.commission,
                    tax: 0, // El impuesto se calcula al vender
                    total: fees.commission,
                },
                totalCost,
                notes: formData.notes,
                createdAt: Timestamp.now(),
            };

            const docRef = await addDoc(collection(db, COLLECTION_NAME), trade);
            return docRef.id;
        } catch (error) {
            console.error('Error creating trade:', error);
            throw new Error('Error al crear operación');
        }
    },

    /**
     * Obtiene todas las operaciones de una estrategia
     */
    async getByStrategy(strategyId: string): Promise<Trade[]> {
        try {
            const q = query(
                collection(db, COLLECTION_NAME),
                where('strategyId', '==', strategyId),
                orderBy('timestamp', 'desc')
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Trade));
        } catch (error) {
            console.error('Error getting trades:', error);
            throw new Error('Error al obtener operaciones');
        }
    },

    /**
     * Obtiene las últimas N operaciones de una estrategia
     */
    async getRecentByStrategy(strategyId: string, limitCount: number = 10): Promise<Trade[]> {
        try {
            const q = query(
                collection(db, COLLECTION_NAME),
                where('strategyId', '==', strategyId),
                orderBy('timestamp', 'desc'),
                limit(limitCount)
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Trade));
        } catch (error) {
            console.error('Error getting recent trades:', error);
            throw new Error('Error al obtener operaciones recientes');
        }
    },

    /**
     * Obtiene operaciones por símbolo
     */
    async getBySymbol(strategyId: string, symbol: string): Promise<Trade[]> {
        try {
            const q = query(
                collection(db, COLLECTION_NAME),
                where('strategyId', '==', strategyId),
                where('symbol', '==', symbol.toUpperCase()),
                orderBy('timestamp', 'desc')
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Trade));
        } catch (error) {
            console.error('Error getting trades by symbol:', error);
            throw new Error('Error al obtener operaciones por símbolo');
        }
    },

    /**
     * Obtiene una operación por ID
     */
    async getById(id: string): Promise<Trade | null> {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                return { id: docSnap.id, ...docSnap.data() } as Trade;
            }
            return null;
        } catch (error) {
            console.error('Error getting trade:', error);
            throw new Error('Error al obtener operación');
        }
    },

    /**
     * Actualiza una operación
     */
    async update(id: string, updates: Partial<Trade>): Promise<void> {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            await updateDoc(docRef, updates);
        } catch (error) {
            console.error('Error updating trade:', error);
            throw new Error('Error al actualizar operación');
        }
    },

    /**
     * Elimina una operación
     */
    async delete(id: string): Promise<void> {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            await deleteDoc(docRef);
        } catch (error) {
            console.error('Error deleting trade:', error);
            throw new Error('Error al eliminar operación');
        }
    },

    /**
     * Calcula el profit de una venta
     */
    calculateProfit(buyTrades: Trade[], sellQuantity: number, sellPrice: number, exchangeRate: number): number {
        let remainingQuantity = sellQuantity;
        let totalCost = 0;

        // FIFO (First In, First Out)
        for (const buyTrade of buyTrades) {
            if (remainingQuantity <= 0) break;

            const quantityToUse = Math.min(remainingQuantity, buyTrade.quantity);
            totalCost += (buyTrade.price * quantityToUse * exchangeRate);
            remainingQuantity -= quantityToUse;
        }

        const sellRevenue = sellPrice * sellQuantity * exchangeRate;
        return sellRevenue - totalCost;
    },

    /**
     * Obtiene estadísticas de trading para una estrategia
     */
    async getStats(strategyId: string): Promise<{
        totalTrades: number;
        totalBuys: number;
        totalSells: number;
        totalInvested: number;
        totalRevenue: number;
        netProfit: number;
    }> {
        try {
            const trades = await this.getByStrategy(strategyId);

            const stats = {
                totalTrades: trades.length,
                totalBuys: trades.filter(t => t.type === 'BUY').length,
                totalSells: trades.filter(t => t.type === 'SELL').length,
                totalInvested: 0,
                totalRevenue: 0,
                netProfit: 0,
            };

            trades.forEach(trade => {
                if (trade.type === 'BUY') {
                    stats.totalInvested += trade.totalCost;
                } else {
                    stats.totalRevenue += trade.totalCost;
                }
            });

            stats.netProfit = stats.totalRevenue - stats.totalInvested;

            return stats;
        } catch (error) {
            console.error('Error getting trade stats:', error);
            throw new Error('Error al obtener estadísticas');
        }
    },
};
