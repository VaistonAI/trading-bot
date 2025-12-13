import { apiConfig } from '../config/api';
import { stockScreenerService } from './stockScreenerService';
import type {
    SimulationConfig,
    SimulationResult,
    SimulationTrade,
    SimulationPosition,
    PortfolioSnapshot,
    SimulationMetrics,
    HistoricalData,
    MarketDataPoint,
    TechnicalIndicators,
} from '../types/simulation';
import { StrategyType } from '../types/strategy';
import { Timestamp } from 'firebase/firestore';

const COMMISSION_RATE = 0.0025; // 0.25%
const TAX_RATE = 0.10; // 10% ISR

/**
 * Servicio de backtesting/simulación histórica
 */
export const backtestingService = {
    /**
     * Ejecuta una simulación completa
     */
    async runSimulation(
        config: SimulationConfig,
        onProgress?: (progress: any) => void
    ): Promise<SimulationResult> {
        console.log('🚀 Iniciando simulación...', config);

        // 1. Escanear mercado para obtener mejores símbolos
        console.log('🔍 Escaneando mercado...');
        const symbols = await stockScreenerService.scanMarket(
            config.strategyType,
            config.universe,
            config.topN,
            config.startDate,
            config.endDate,
            onProgress
        );

        console.log(`📊 Símbolos seleccionados: ${symbols.join(', ')}`);

        // 2. Obtener datos históricos
        const historicalDataMap = await this.getHistoricalData(symbols, config.startDate, config.endDate);

        // 3. Preparar datos con indicadores
        const marketData = this.prepareMarketData(historicalDataMap);

        // 4. Ejecutar simulación
        const { trades, snapshots } = await this.executeSimulation(config, marketData);

        // 5. Calcular métricas
        const metrics = this.calculateMetrics(config, trades, snapshots, historicalDataMap);

        // 6. Capital final
        const finalCapital = snapshots[snapshots.length - 1]?.totalValue || config.initialCapital;

        return {
            config,
            trades,
            snapshots,
            metrics,
            finalCapital,
            executedAt: Timestamp.now(),
        };
    },

    /**
     * Obtiene datos históricos usando el backend API
     */
    async getHistoricalData(
        symbols: string[],
        startDate: string,
        endDate: string
    ): Promise<Map<string, HistoricalData[]>> {
        const dataMap = new Map<string, HistoricalData[]>();

        for (const symbol of symbols) {
            try {
                console.log(`📊 Obteniendo datos históricos de ${symbol} desde API...`);

                // Llamar al backend API en lugar de Alpaca directamente
                const url = `${apiConfig.endpoints.alpacaBars(symbol)}?timeframe=1Day&start=${startDate}&end=${endDate}`;

                interface AlpacaBarsResponse {
                    bars: Array<{
                        t: string;
                        o: number;
                        h: number;
                        l: number;
                        c: number;
                        v: number;
                    }>;
                }

                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data: AlpacaBarsResponse = await response.json();

                if (!data.bars || data.bars.length === 0) {
                    console.warn(`No hay datos para ${symbol}`);
                    continue;
                }

                // Convertir formato de Alpaca a HistoricalData
                const historicalData: HistoricalData[] = data.bars.map((bar: { t: string; o: number; h: number; l: number; c: number; v: number }) => ({
                    date: bar.t.split('T')[0], // Extraer solo la fecha (YYYY-MM-DD)
                    open: bar.o,
                    high: bar.h,
                    low: bar.l,
                    close: bar.c,
                    volume: bar.v,
                }));

                // Filtrar por rango de fechas y ordenar
                const filtered = historicalData
                    .filter(d => d.date >= startDate && d.date <= endDate)
                    .sort((a, b) => a.date.localeCompare(b.date));

                dataMap.set(symbol, filtered);
                console.log(`✅ Obtenidos ${filtered.length} días de datos para ${symbol}`);

                // Pequeño delay para no saturar la API
                await new Promise(resolve => setTimeout(resolve, 200));
            } catch (error) {
                console.error(`Error obteniendo datos de ${symbol}:`, error);
            }
        }

        return dataMap;
    },

    /**
     * Prepara datos de mercado con indicadores técnicos
     */
    prepareMarketData(historicalDataMap: Map<string, HistoricalData[]>): Map<string, MarketDataPoint[]> {
        const marketData = new Map<string, MarketDataPoint[]>();

        for (const [symbol, data] of historicalDataMap.entries()) {
            const dataWithIndicators: MarketDataPoint[] = data.map((point, index) => {
                const indicators = this.calculateIndicators(data, index);
                return {
                    ...point,
                    indicators,
                };
            });

            marketData.set(symbol, dataWithIndicators);
        }

        return marketData;
    },

    /**
     * Calcula indicadores técnicos
     */
    calculateIndicators(data: HistoricalData[], currentIndex: number): TechnicalIndicators {
        const indicators: TechnicalIndicators = {};

        // RSI (14 períodos)
        if (currentIndex >= 14) {
            indicators.rsi = this.calculateRSI(data, currentIndex, 14);
        }

        // MA20
        if (currentIndex >= 19) {
            indicators.ma20 = this.calculateMA(data, currentIndex, 20);
        }

        // MA50
        if (currentIndex >= 49) {
            indicators.ma50 = this.calculateMA(data, currentIndex, 50);
        }

        return indicators;
    },

    /**
     * Calcula RSI
     */
    calculateRSI(data: HistoricalData[], currentIndex: number, period: number): number {
        let gains = 0;
        let losses = 0;

        for (let i = currentIndex - period + 1; i <= currentIndex; i++) {
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
    calculateMA(data: HistoricalData[], currentIndex: number, period: number): number {
        let sum = 0;
        for (let i = currentIndex - period + 1; i <= currentIndex; i++) {
            sum += data[i].close;
        }
        return sum / period;
    },

    /**
     * Ejecuta la simulación día por día
     */
    async executeSimulation(
        config: SimulationConfig,
        marketData: Map<string, MarketDataPoint[]>
    ): Promise<{ trades: SimulationTrade[]; snapshots: PortfolioSnapshot[] }> {
        const trades: SimulationTrade[] = [];
        const snapshots: PortfolioSnapshot[] = [];

        let cash = config.initialCapital;
        const positions: Map<string, SimulationPosition> = new Map();

        // Obtener todas las fechas únicas y ordenarlas
        const allDates = new Set<string>();
        for (const data of marketData.values()) {
            data.forEach(d => allDates.add(d.date));
        }
        const sortedDates = Array.from(allDates).sort();

        // Simular día por día
        for (const date of sortedDates) {
            // Actualizar precios de posiciones
            for (const [symbol, position] of positions.entries()) {
                const symbolData = marketData.get(symbol);
                const dayData = symbolData?.find(d => d.date === date);

                if (dayData) {
                    position.currentPrice = dayData.close;
                    position.unrealizedProfit = (dayData.close - position.averagePrice) * position.quantity;
                    position.unrealizedProfitPercent = ((dayData.close - position.averagePrice) / position.averagePrice) * 100;
                }
            }

            // Evaluar cada símbolo
            for (const symbol of marketData.keys()) {
                const symbolData = marketData.get(symbol);
                const dayData = symbolData?.find(d => d.date === date);

                if (!dayData) continue;

                // Aplicar estrategia
                const signal = this.applyStrategy(config.strategyType, dayData, positions.has(symbol));

                // Ejecutar señal
                if (signal === 'BUY' && positions.size < config.maxPositions) {
                    const trade = this.executeBuy(symbol, dayData, cash, config.maxPositions, date);
                    if (trade) {
                        trades.push(trade);
                        cash -= trade.total;

                        // Crear o actualizar posición
                        const existingPos = positions.get(symbol);
                        if (existingPos) {
                            const totalQuantity = existingPos.quantity + trade.quantity;
                            const totalCost = (existingPos.averagePrice * existingPos.quantity) + (trade.price * trade.quantity);
                            existingPos.quantity = totalQuantity;
                            existingPos.averagePrice = totalCost / totalQuantity;
                            existingPos.currentPrice = trade.price;
                        } else {
                            positions.set(symbol, {
                                symbol,
                                quantity: trade.quantity,
                                averagePrice: trade.price,
                                currentPrice: trade.price,
                                unrealizedProfit: 0,
                                unrealizedProfitPercent: 0,
                            });
                        }
                    }
                } else if (signal === 'SELL' && positions.has(symbol)) {
                    const position = positions.get(symbol)!;
                    const trade = this.executeSell(symbol, dayData, position, date);
                    if (trade) {
                        trades.push(trade);
                        cash += trade.total;
                        positions.delete(symbol);
                    }
                }
            }

            // Crear snapshot del día
            const positionsValue = Array.from(positions.values()).reduce(
                (sum, pos) => sum + (pos.currentPrice * pos.quantity),
                0
            );

            snapshots.push({
                date,
                cash,
                positionsValue,
                totalValue: cash + positionsValue,
                positions: Array.from(positions.values()),
            });
        }

        return { trades, snapshots };
    },

    /**
     * Aplica la lógica de la estrategia
     */
    applyStrategy(strategyType: StrategyType, data: MarketDataPoint, hasPosition: boolean): 'BUY' | 'SELL' | null {
        const { indicators, close } = data;

        switch (strategyType) {
            case StrategyType.MOMENTUM:
                if (!hasPosition && indicators.rsi && indicators.ma20) {
                    if (indicators.rsi > 60 && close > indicators.ma20) {
                        return 'BUY';
                    }
                } else if (hasPosition && indicators.rsi) {
                    if (indicators.rsi < 40) {
                        return 'SELL';
                    }
                }
                break;

            case StrategyType.VALUE:
                // Para value, usamos señales simplificadas basadas en MA
                if (!hasPosition && indicators.ma20 && indicators.ma50) {
                    if (close < indicators.ma20 && indicators.ma20 < indicators.ma50) {
                        return 'BUY'; // Precio bajo, potencial value
                    }
                } else if (hasPosition && indicators.ma20) {
                    if (close > indicators.ma20 * 1.15) {
                        return 'SELL'; // 15% de ganancia
                    }
                }
                break;

            case StrategyType.GROWTH:
                if (!hasPosition && indicators.rsi && indicators.ma20) {
                    if (indicators.rsi > 55 && close > indicators.ma20) {
                        return 'BUY';
                    }
                } else if (hasPosition && indicators.rsi) {
                    if (indicators.rsi < 45) {
                        return 'SELL';
                    }
                }
                break;

            case StrategyType.DIVIDEND:
            case StrategyType.SECTOR_ROTATION:
                // Estrategias simplificadas para backtesting
                if (!hasPosition && indicators.ma20) {
                    if (close > indicators.ma20) {
                        return 'BUY';
                    }
                } else if (hasPosition && indicators.ma20) {
                    if (close < indicators.ma20) {
                        return 'SELL';
                    }
                }
                break;
        }

        return null;
    },

    /**
     * Ejecuta una compra
     */
    executeBuy(
        symbol: string,
        data: MarketDataPoint,
        availableCash: number,
        maxPositions: number,
        date: string
    ): SimulationTrade | null {
        const capitalPerPosition = availableCash / maxPositions;
        const price = data.close;
        const quantity = Math.floor(capitalPerPosition / price);

        if (quantity <= 0) return null;

        const subtotal = quantity * price;
        const commission = subtotal * COMMISSION_RATE;
        const total = subtotal + commission;

        if (total > availableCash) return null;

        return {
            date,
            symbol,
            type: 'BUY',
            quantity,
            price,
            commission,
            total,
            reason: `RSI: ${data.indicators.rsi?.toFixed(2) || 'N/A'}, MA20: ${data.indicators.ma20?.toFixed(2) || 'N/A'}`,
        };
    },

    /**
     * Ejecuta una venta
     */
    executeSell(
        symbol: string,
        data: MarketDataPoint,
        position: SimulationPosition,
        date: string
    ): SimulationTrade | null {
        const price = data.close;
        const quantity = position.quantity;
        const subtotal = quantity * price;
        const commission = subtotal * COMMISSION_RATE;

        const grossProfit = (price - position.averagePrice) * quantity;
        const tax = grossProfit > 0 ? grossProfit * TAX_RATE : 0;

        const total = subtotal - commission - tax;
        const netProfit = grossProfit - commission - tax;

        return {
            date,
            symbol,
            type: 'SELL',
            quantity,
            price,
            commission,
            total,
            profit: netProfit,
            reason: `Profit: ${netProfit.toFixed(2)} MXN (${((netProfit / (position.averagePrice * quantity)) * 100).toFixed(2)}%)`,
        };
    },

    /**
     * Calcula métricas de la simulación
     */
    calculateMetrics(
        config: SimulationConfig,
        trades: SimulationTrade[],
        snapshots: PortfolioSnapshot[],
        historicalData: Map<string, HistoricalData[]>
    ): SimulationMetrics {
        const initialCapital = config.initialCapital;
        const finalCapital = snapshots[snapshots.length - 1]?.totalValue || initialCapital;

        // Operaciones ganadoras/perdedoras
        const sellTrades = trades.filter(t => t.type === 'SELL');
        const winningTrades = sellTrades.filter(t => (t.profit || 0) > 0);
        const losingTrades = sellTrades.filter(t => (t.profit || 0) <= 0);

        // Mejor y peor operación
        const profits = sellTrades.map(t => t.profit || 0);
        const bestTrade = profits.length > 0 ? Math.max(...profits) : 0;
        const worstTrade = profits.length > 0 ? Math.min(...profits) : 0;

        // Promedios
        const avgWin = winningTrades.length > 0
            ? winningTrades.reduce((sum, t) => sum + (t.profit || 0), 0) / winningTrades.length
            : 0;
        const avgLoss = losingTrades.length > 0
            ? losingTrades.reduce((sum, t) => sum + (t.profit || 0), 0) / losingTrades.length
            : 0;

        // Comisiones e impuestos
        const totalCommissions = trades.reduce((sum, t) => sum + t.commission, 0);
        const totalTaxes = sellTrades.reduce((sum, t) => {
            const grossProfit = (t.profit || 0) + t.commission;
            return sum + (grossProfit > 0 ? grossProfit * TAX_RATE : 0);
        }, 0);

        // Drawdown máximo
        let peak = initialCapital;
        let maxDrawdown = 0;
        for (const snapshot of snapshots) {
            if (snapshot.totalValue > peak) {
                peak = snapshot.totalValue;
            }
            const drawdown = ((peak - snapshot.totalValue) / peak) * 100;
            if (drawdown > maxDrawdown) {
                maxDrawdown = drawdown;
            }
        }

        // Buy & Hold (usar primer símbolo como referencia)
        let buyAndHoldReturn = 0;
        const symbols = Array.from(historicalData.keys());
        if (symbols.length > 0) {
            const firstSymbol = symbols[0];
            const symbolData = historicalData.get(firstSymbol);
            if (symbolData && symbolData.length > 0) {
                const firstPrice = symbolData[0].close;
                const lastPrice = symbolData[symbolData.length - 1].close;
                buyAndHoldReturn = ((lastPrice - firstPrice) / firstPrice) * 100;
            }
        }

        const totalReturn = ((finalCapital - initialCapital) / initialCapital) * 100;
        const totalReturnMXN = finalCapital - initialCapital;

        return {
            totalReturn,
            totalReturnMXN,
            totalTrades: trades.length,
            winningTrades: winningTrades.length,
            losingTrades: losingTrades.length,
            winRate: sellTrades.length > 0 ? (winningTrades.length / sellTrades.length) * 100 : 0,
            bestTrade,
            worstTrade,
            averageWin: avgWin,
            averageLoss: avgLoss,
            maxDrawdown,
            sharpeRatio: 0, // Simplificado
            buyAndHoldReturn,
            vsMarket: totalReturn - buyAndHoldReturn,
            totalCommissions,
            totalTaxes,
        };
    },
};
