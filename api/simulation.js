const fetch = require('node-fetch');
const { admin, db } = require('./firebase-admin');

const ALPACA_DATA_URL = 'https://data.alpaca.markets';

/**
 * Obtiene datos históricos INTRADAY de Alpaca (1 hora)
 * Incluye ajustes por splits y dividendos
 */
async function getHistoricalBars(symbol, start, end, alpacaHeaders) {
    // INSTITUCIONAL: Usar barras de 1 hora con ajustes corporativos
    const url = `${ALPACA_DATA_URL}/v2/stocks/${symbol}/bars?start=${start}&end=${end}&timeframe=1Hour&adjustment=all&limit=10000`;
    const response = await fetch(url, { headers: alpacaHeaders });

    if (!response.ok) {
        throw new Error(`Error fetching data for ${symbol}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.bars || [];
}

/**
 * Calcula indicadores de Value Investing
 */
function calculateValueSignal(bars) {
    if (bars.length < 20) return null;

    const recentBars = bars.slice(-20);
    const currentPrice = recentBars[recentBars.length - 1].c;
    const avgPrice = recentBars.reduce((sum, bar) => sum + bar.c, 0) / recentBars.length;
    const avgVolume = recentBars.reduce((sum, bar) => sum + bar.v, 0) / recentBars.length;

    // Señal de compra: precio por debajo del promedio y volumen alto
    const priceDiscount = ((avgPrice - currentPrice) / avgPrice) * 100;
    const volumeRatio = recentBars[recentBars.length - 1].v / avgVolume;

    if (priceDiscount > 5 && volumeRatio > 1.2) {
        return { signal: 'BUY', strength: priceDiscount };
    }

    // Señal de venta: precio por encima del promedio
    if (priceDiscount < -10) {
        return { signal: 'SELL', strength: Math.abs(priceDiscount) };
    }

    return null;
}

/**
 * Calcula indicadores de Momentum
 */
function calculateMomentumSignal(bars) {
    if (bars.length < 50) return null;

    const recentBars = bars.slice(-50);
    const currentPrice = recentBars[recentBars.length - 1].c;

    // Calcular MA20 y MA50
    const ma20Bars = recentBars.slice(-20);
    const ma50Bars = recentBars;
    const ma20 = ma20Bars.reduce((sum, bar) => sum + bar.c, 0) / 20;
    const ma50 = ma50Bars.reduce((sum, bar) => sum + bar.c, 0) / 50;

    // Calcular RSI simplificado (últimos 14 días)
    const rsiPeriod = 14;
    const rsiBars = recentBars.slice(-rsiPeriod);
    let gains = 0, losses = 0;
    for (let i = 1; i < rsiBars.length; i++) {
        const change = rsiBars[i].c - rsiBars[i - 1].c;
        if (change > 0) gains += change;
        else losses += Math.abs(change);
    }
    const avgGain = gains / rsiPeriod;
    const avgLoss = losses / rsiPeriod;
    const rs = avgGain / (avgLoss || 1);
    const rsi = 100 - (100 / (1 + rs));

    // Señal de compra: precio > MA20 > MA50 y RSI > 50 (tendencia alcista fuerte)
    if (currentPrice > ma20 && ma20 > ma50 && rsi > 50) {
        const strength = ((currentPrice - ma50) / ma50) * 100;
        return { signal: 'BUY', strength };
    }

    // Señal de venta: precio < MA20 o RSI < 40 (perdiendo momentum)
    if (currentPrice < ma20 || rsi < 40) {
        const strength = ((ma20 - currentPrice) / ma20) * 100;
        return { signal: 'SELL', strength };
    }

    return null;
}

/**
 * Calcula indicadores de Growth
 */
function calculateGrowthSignal(bars) {
    if (bars.length < 30) return null;

    const recentBars = bars.slice(-30);
    const currentPrice = recentBars[recentBars.length - 1].c;

    // Calcular tasa de crecimiento de precio (últimos 30 días)
    const oldPrice = recentBars[0].c;
    const priceGrowth = ((currentPrice - oldPrice) / oldPrice) * 100;

    // Calcular volatilidad (desviación estándar)
    const prices = recentBars.map(b => b.c);
    const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
    const variance = prices.reduce((sum, p) => sum + Math.pow(p - avgPrice, 2), 0) / prices.length;
    const volatility = Math.sqrt(variance);

    // Calcular tendencia de volumen (creciente = interés)
    const firstHalfVolume = recentBars.slice(0, 15).reduce((sum, b) => sum + b.v, 0) / 15;
    const secondHalfVolume = recentBars.slice(15).reduce((sum, b) => sum + b.v, 0) / 15;
    const volumeGrowth = ((secondHalfVolume - firstHalfVolume) / firstHalfVolume) * 100;

    // Señal de compra: crecimiento fuerte (>10%) con volumen creciente
    if (priceGrowth > 10 && volumeGrowth > 20) {
        return { signal: 'BUY', strength: priceGrowth };
    }

    // Señal de venta: crecimiento negativo o volatilidad muy alta
    if (priceGrowth < -5 || (volatility / avgPrice) > 0.15) {
        return { signal: 'SELL', strength: Math.abs(priceGrowth) };
    }

    return null;
}

/**
 * Calcula indicadores de Mean Reversion (Reversión a la Media)
 */
function calculateMeanReversionSignal(bars) {
    if (bars.length < 20) return null;

    const recentBars = bars.slice(-20);
    const prices = recentBars.map(b => b.c);
    const mean = prices.reduce((a, b) => a + b, 0) / 20;
    const variance = prices.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / 20;
    const stdDev = Math.sqrt(variance);
    const currentPrice = prices[prices.length - 1];

    // Señal de compra: precio por debajo de 2 desviaciones estándar
    if (currentPrice < mean - 2 * stdDev) {
        return { signal: 'BUY', strength: Math.abs((currentPrice - mean) / stdDev) };
    }

    // Señal de venta: precio vuelve a la media o la supera
    if (currentPrice > mean) {
        return { signal: 'SELL', strength: (currentPrice - mean) / stdDev };
    }

    return null;
}

/**
 * Calcula indicadores de Breakout (Ruptura)
 */
function calculateBreakoutSignal(bars) {
    if (bars.length < 50) return null;

    const recentBars = bars.slice(-50);
    const currentBar = recentBars[recentBars.length - 1];
    const max50 = Math.max(...recentBars.map(b => b.h));
    const min20 = Math.min(...recentBars.slice(-20).map(b => b.l));
    const avgVolume = recentBars.reduce((sum, b) => sum + b.v, 0) / 50;

    // Señal de compra: rompe máximo de 50 días con volumen alto
    if (currentBar.c > max50 && currentBar.v > avgVolume * 1.5) {
        return { signal: 'BUY', strength: ((currentBar.c - max50) / max50) * 100 };
    }

    // Señal de venta: rompe mínimo de 20 días
    if (currentBar.c < min20) {
        return { signal: 'SELL', strength: ((min20 - currentBar.c) / min20) * 100 };
    }

    return null;
}

/**
 * Calcula indicadores de RSI (Relative Strength Index)
 */
function calculateRSIOnlySignal(bars) {
    if (bars.length < 15) return null;

    const period = 14;
    const recentBars = bars.slice(-period - 1);
    let gains = 0, losses = 0;

    for (let i = 1; i < recentBars.length; i++) {
        const change = recentBars[i].c - recentBars[i - 1].c;
        if (change > 0) gains += change;
        else losses += Math.abs(change);
    }

    const avgGain = gains / period;
    const avgLoss = losses / period;
    const rs = avgGain / (avgLoss || 1);
    const rsi = 100 - (100 / (1 + rs));

    // Señal de compra: RSI < 30 (sobreventa)
    if (rsi < 30) {
        return { signal: 'BUY', strength: 30 - rsi };
    }

    // Señal de venta: RSI > 70 (sobrecompra)
    if (rsi > 70) {
        return { signal: 'SELL', strength: rsi - 70 };
    }

    return null;
}

/**
 * Calcula indicadores de MACD (Moving Average Convergence Divergence)
 */
function calculateMACDOnlySignal(bars) {
    if (bars.length < 35) return null;

    const calculateEMA = (data, period) => {
        const k = 2 / (period + 1);
        let ema = data[0];
        for (let i = 1; i < data.length; i++) {
            ema = data[i] * k + ema * (1 - k);
        }
        return ema;
    };

    const prices = bars.map(b => b.c);

    // Calcular MACD line
    const macdLine = [];
    for (let i = 26; i <= prices.length; i++) {
        const slice = prices.slice(Math.max(0, i - 26), i);
        if (slice.length >= 26) {
            const ema12 = calculateEMA(slice.slice(-12), 12);
            const ema26 = calculateEMA(slice, 26);
            macdLine.push(ema12 - ema26);
        }
    }

    if (macdLine.length < 9) return null;

    // Calcular signal line
    const signalLine = calculateEMA(macdLine.slice(-9), 9);
    const currentMACD = macdLine[macdLine.length - 1];
    const prevMACD = macdLine[macdLine.length - 2];

    // Señal de compra: MACD cruza señal hacia arriba
    if (currentMACD > signalLine && prevMACD <= signalLine) {
        return { signal: 'BUY', strength: Math.abs(currentMACD - signalLine) };
    }

    // Señal de venta: MACD cruza señal hacia abajo
    if (currentMACD < signalLine && prevMACD >= signalLine) {
        return { signal: 'SELL', strength: Math.abs(currentMACD - signalLine) };
    }

    return null;
}

/**
 * Calcula indicadores de Volume Weighted (Ponderado por Volumen)
 */
function calculateVolumeWeightedSignal(bars) {
    if (bars.length < 20) return null;

    const recentBars = bars.slice(-20);
    const currentBar = recentBars[recentBars.length - 1];
    const prevBar = recentBars[recentBars.length - 2];

    const priceChange = ((currentBar.c - prevBar.c) / prevBar.c) * 100;
    const avgVolume = recentBars.slice(0, -1).reduce((sum, b) => sum + b.v, 0) / 19;
    const volumeChange = ((currentBar.v - avgVolume) / avgVolume) * 100;

    // Señal de compra: precio y volumen crecen juntos
    if (priceChange > 2 && volumeChange > 20) {
        return { signal: 'BUY', strength: (priceChange + volumeChange) / 2 };
    }

    // Señal de venta: precio cae o volumen cae significativamente
    if (priceChange < -2 || volumeChange < -20) {
        return { signal: 'SELL', strength: Math.abs((priceChange + volumeChange) / 2) };
    }

    return null;
}

/**
 * Calcula indicadores de Pairs Trading (Arbitraje de Pares)
 * Nota: Versión simplificada usando correlación entre símbolos
 */
function calculatePairsTradingSignal(bars) {
    if (bars.length < 30) return null;

    const recentBars = bars.slice(-30);
    const prices = recentBars.map(b => b.c);

    // Calcular ratio de precio vs promedio móvil
    const ma20 = prices.slice(-20).reduce((a, b) => a + b, 0) / 20;
    const currentPrice = prices[prices.length - 1];
    const ratio = currentPrice / ma20;

    // Calcular desviación del ratio
    const ratios = [];
    for (let i = 20; i < prices.length; i++) {
        const ma = prices.slice(i - 20, i).reduce((a, b) => a + b, 0) / 20;
        ratios.push(prices[i] / ma);
    }

    const meanRatio = ratios.reduce((a, b) => a + b, 0) / ratios.length;
    const variance = ratios.reduce((sum, r) => sum + Math.pow(r - meanRatio, 2), 0) / ratios.length;
    const stdDev = Math.sqrt(variance);

    // Señal de compra: ratio muy por debajo de la media (par barato)
    if (ratio < meanRatio - 1.5 * stdDev) {
        return { signal: 'BUY', strength: Math.abs((ratio - meanRatio) / stdDev) };
    }

    // Señal de venta: ratio muy por encima de la media (par caro)
    if (ratio > meanRatio + 1.5 * stdDev) {
        return { signal: 'SELL', strength: (ratio - meanRatio) / stdDev };
    }

    return null;
}

/**
 * INSTITUCIONAL: Valida si una barra está dentro del horario de mercado
 * NYSE: 9:30 AM - 4:00 PM EST (lunes a viernes)
 */
function isMarketHours(timestamp) {
    const date = new Date(timestamp);
    const dayOfWeek = date.getUTCDay();

    // Solo lunes (1) a viernes (5)
    if (dayOfWeek < 1 || dayOfWeek > 5) return false;

    // Convertir a EST (UTC-5)
    const hour = date.getUTCHours() - 5;
    const minute = date.getUTCMinutes();

    // 9:30 AM - 4:00 PM EST
    if (hour < 9 || hour > 16) return false;
    if (hour === 9 && minute < 30) return false;
    if (hour === 16 && minute > 0) return false;

    return true;
}

/**
 * INSTITUCIONAL: Calcula fees regulatorios completos
 */
function calculateRegulatoryFees(sellValue, shares) {
    const SEC_FEE_RATE = 0.0000278;  // $27.80 por millón de dólares vendidos
    const TAF_FEE_RATE = 0.000166;   // $0.000166 por acción vendida
    const TAF_MAX = 7.27;            // Máximo TAF fee

    const secFee = sellValue * SEC_FEE_RATE;
    const tafFee = Math.min(shares * TAF_FEE_RATE, TAF_MAX);

    return {
        secFee: parseFloat(secFee.toFixed(4)),
        tafFee: parseFloat(tafFee.toFixed(4)),
        total: parseFloat((secFee + tafFee).toFixed(4))
    };
}

/**
 * INSTITUCIONAL: Calcula slippage dinámico basado en market impact
 */
function calculateDynamicSlippage(orderShares, avgVolume, baseSlippage = 0.05) {
    // Slippage aumenta con el tamaño relativo de la orden
    const volumeImpact = orderShares / avgVolume;

    // Slippage base + impacto adicional
    const impactSlippage = volumeImpact * 0.5;  // 0.5% por cada 1% del volumen
    const totalSlippage = baseSlippage + impactSlippage;

    // Máximo 2% de slippage
    return Math.min(totalSlippage, 2.0);
}

/**
 * INSTITUCIONAL: Calcula métricas profesionales de riesgo/retorno
 */
function calculateProfessionalMetrics(trades, initialCapital, finalCapital) {
    if (trades.length === 0) {
        return {
            sharpeRatio: 0,
            maxDrawdown: 0,
            calmarRatio: 0,
            profitFactor: 0,
            avgWin: 0,
            avgLoss: 0,
            winLossRatio: 0,
            avgTradeDuration: 0
        };
    }

    // Calcular returns por trade
    const returns = trades.map(t => t.pnlPercent / 100);
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);

    // Sharpe Ratio (anualizado, asumiendo risk-free rate = 0)
    const sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0;

    // Max Drawdown
    let peak = initialCapital;
    let maxDrawdown = 0;
    let runningCapital = initialCapital;

    trades.forEach(trade => {
        runningCapital += trade.pnl;
        if (runningCapital > peak) peak = runningCapital;
        const drawdown = (peak - runningCapital) / peak;
        if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    });

    // Calmar Ratio (ROI / Max Drawdown)
    const roi = ((finalCapital - initialCapital) / initialCapital) * 100;
    const calmarRatio = maxDrawdown > 0 ? roi / (maxDrawdown * 100) : 0;

    // Profit Factor
    const grossProfit = trades.filter(t => t.pnl > 0).reduce((sum, t) => sum + t.pnl, 0);
    const grossLoss = Math.abs(trades.filter(t => t.pnl < 0).reduce((sum, t) => sum + t.pnl, 0));
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 999 : 0;

    // Win/Loss Ratio
    const wins = trades.filter(t => t.pnl > 0);
    const losses = trades.filter(t => t.pnl < 0);
    const avgWin = wins.length > 0 ? wins.reduce((sum, t) => sum + t.pnl, 0) / wins.length : 0;
    const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((sum, t) => sum + t.pnl, 0) / losses.length) : 0;
    const winLossRatio = avgLoss > 0 ? avgWin / avgLoss : avgWin > 0 ? 999 : 0;

    // Average Trade Duration (en días)
    const durations = trades.map(t => {
        const entry = new Date(t.entryDate);
        const exit = new Date(t.date);
        return (exit - entry) / (1000 * 60 * 60 * 24);
    });
    const avgTradeDuration = durations.reduce((a, b) => a + b, 0) / durations.length;

    return {
        sharpeRatio: parseFloat(sharpeRatio.toFixed(2)),
        maxDrawdown: parseFloat((maxDrawdown * 100).toFixed(2)),
        calmarRatio: parseFloat(calmarRatio.toFixed(2)),
        profitFactor: parseFloat(profitFactor.toFixed(2)),
        avgWin: parseFloat(avgWin.toFixed(2)),
        avgLoss: parseFloat(avgLoss.toFixed(2)),
        winLossRatio: parseFloat(winLossRatio.toFixed(2)),
        avgTradeDuration: parseFloat(avgTradeDuration.toFixed(1))
    };
}

/**
 * Ejecuta una simulación de backtesting INSTITUCIONAL para periodo completo 2023-2025
 * INCLUYE: Datos intraday, Horarios de mercado, Fees completos, Market impact, Métricas profesionales
 */
async function runSimulation(year, strategy, symbols, initialCapital, alpacaHeaders) {
    console.log(`\n🔄 ============================================`);
    console.log(`   BACKTESTING PROFESIONAL 2023-2025`);
    console.log(`   ============================================`);
    console.log(`   Estrategia: ${strategy.toUpperCase()}`);
    console.log(`   Capital inicial: $${initialCapital.toLocaleString()}`);
    console.log(`   Símbolos: ${symbols.length}`);

    // INSTITUCIONAL: Periodo completo 2023-2025 para todas las estrategias
    const startDate = '2023-01-01T00:00:00Z';
    const endDate = '2025-12-15T23:59:59Z';

    // ============================================
    // PARÁMETROS PROFESIONALES
    // ============================================
    const COMMISSION_PER_TRADE = 1.00;      // $1 por operación (Alpaca comisión)
    const SLIPPAGE_PERCENT = 0.1;           // 0.1% slippage realista
    const MIN_VOLUME_THRESHOLD = 100000;    // Mínimo 100k acciones/día
    const MAX_POSITION_PERCENT = 0.15;      // Máximo 15% del capital por posición
    const MAX_POSITIONS = 10;               // Máximo 10 posiciones simultáneas

    let capital = initialCapital;
    let totalCommissions = 0;
    const trades = [];

    // INSTITUCIONAL: Desglose mensual para 3 años (2023-2025) = 36 meses
    const monthlyBreakdown = [];
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    for (let year = 2023; year <= 2025; year++) {
        for (let month = 0; month < 12; month++) {
            monthlyBreakdown.push({
                year,
                month: monthNames[month],
                monthYear: `${monthNames[month]} ${year}`,
                trades: 0,
                pnl: 0,
                grossPnl: 0,
                commissions: 0
            });
        }
    }

    let bestTrade = { symbol: '', pnl: -Infinity };
    let worstTrade = { symbol: '', pnl: Infinity };
    const positions = new Map();

    console.log(`\n📊 Descargando datos históricos de Alpaca...`);

    // Obtener datos históricos
    const historicalData = new Map();
    for (const symbol of symbols) {
        try {
            const bars = await getHistoricalBars(symbol, startDate, endDate, alpacaHeaders);
            if (bars && bars.length > 0) {
                historicalData.set(symbol, bars);
                console.log(`   ✓ ${symbol}: ${bars.length} días`);
            }
            await new Promise(resolve => setTimeout(resolve, 200));
        } catch (error) {
            console.error(`   ✗ ${symbol}: ${error.message}`);
        }
    }

    console.log(`\n✅ Datos descargados: ${historicalData.size} símbolos`);

    // Obtener fechas únicas y filtrar solo días hábiles
    const allDates = new Set();
    historicalData.forEach(bars => {
        bars.forEach(bar => {
            const dateStr = bar.t.split('T')[0];
            const date = new Date(dateStr + 'T12:00:00Z');
            const dayOfWeek = date.getUTCDay();
            // Solo lunes (1) a viernes (5)
            if (dayOfWeek >= 1 && dayOfWeek <= 5) {
                allDates.add(dateStr);
            }
        });
    });

    const tradingDays = Array.from(allDates).sort();
    console.log(`📅 Días de trading (lun-vie): ${tradingDays.length}`);
    console.log(`\n🤖 Ejecutando estrategia ${strategy.toUpperCase()}...\n`);

    // ============================================
    // SIMULACIÓN HORA POR HORA (INTRADAY)
    // ============================================
    let processedBars = 0;
    for (const [symbol, bars] of historicalData.entries()) {
        for (const bar of bars) {
            // INSTITUCIONAL: Validar horarios de mercado
            if (!isMarketHours(bar.t)) {
                continue; // Saltar barras fuera de horario
            }

            processedBars++;
            const historicalBars = bars.slice(0, bars.indexOf(bar) + 1);

            // VALIDACIÓN DE VOLUMEN
            if (bar.v < MIN_VOLUME_THRESHOLD) {
                continue; // Saltar si no hay liquidez suficiente
            }

            // Calcular volumen promedio para slippage dinámico
            const recentBars = historicalBars.slice(-20);
            const avgVolume = recentBars.reduce((sum, b) => sum + b.v, 0) / recentBars.length;

            // Calcular señal según estrategia
            let signal;
            if (strategy === 'momentum') {
                signal = calculateMomentumSignal(historicalBars);
            } else if (strategy === 'growth') {
                signal = calculateGrowthSignal(historicalBars);
            } else if (strategy === 'meanreversion') {
                signal = calculateMeanReversionSignal(historicalBars);
            } else if (strategy === 'breakout') {
                signal = calculateBreakoutSignal(historicalBars);
            } else if (strategy === 'rsi') {
                signal = calculateRSIOnlySignal(historicalBars);
            } else if (strategy === 'macd') {
                signal = calculateMACDOnlySignal(historicalBars);
            } else if (strategy === 'volumeweighted') {
                signal = calculateVolumeWeightedSignal(historicalBars);
            } else if (strategy === 'pairs') {
                signal = calculatePairsTradingSignal(historicalBars);
            } else {
                signal = calculateValueSignal(historicalBars);
            }

            // ============================================
            // LÓGICA DE COMPRA INSTITUCIONAL
            // ============================================
            if (signal && signal.signal === 'BUY' && !positions.has(symbol) && positions.size < MAX_POSITIONS) {
                // Calcular tamaño de posición dinámico
                const maxPositionValue = capital * MAX_POSITION_PERCENT;
                const basePositionValue = initialCapital / MAX_POSITIONS;
                const positionValue = Math.min(maxPositionValue, basePositionValue);

                const shares = Math.floor(positionValue / bar.c);

                // INSTITUCIONAL: Slippage dinámico basado en market impact
                const slippagePercent = calculateDynamicSlippage(shares, avgVolume);
                const executionPrice = bar.c * (1 + slippagePercent / 100);

                const totalCost = (shares * executionPrice) + COMMISSION_PER_TRADE;

                if (shares > 0 && totalCost <= capital) {
                    positions.set(symbol, {
                        shares,
                        entryPrice: executionPrice,
                        entryDate: bar.t,
                        buyCommission: COMMISSION_PER_TRADE,
                        slippage: slippagePercent
                    });

                    capital -= totalCost;
                    totalCommissions += COMMISSION_PER_TRADE;

                    console.log(`📈 BUY  ${symbol.padEnd(6)} | ${shares} @ $${executionPrice.toFixed(2)} | Slippage: ${slippagePercent.toFixed(3)}% | Capital: $${capital.toFixed(2)}`);
                }
            }
            // ============================================
            // LÓGICA DE VENTA INSTITUCIONAL
            // ============================================
            else if (positions.has(symbol)) {
                const position = positions.get(symbol);

                // INSTITUCIONAL: Slippage dinámico en venta
                const slippagePercent = calculateDynamicSlippage(position.shares, avgVolume);
                const executionPrice = bar.c * (1 - slippagePercent / 100);
                const pnlPercent = ((executionPrice - position.entryPrice) / position.entryPrice) * 100;

                // Vender si: señal SELL, stop-loss (-5%), o take-profit (+15%)
                if ((signal && signal.signal === 'SELL') || pnlPercent <= -5 || pnlPercent >= 15) {
                    const sellValue = position.shares * executionPrice;
                    const buyValue = position.shares * position.entryPrice;

                    // P&L BRUTO (sin fees)
                    const grossPnl = sellValue - buyValue;

                    // INSTITUCIONAL: Calcular fees regulatorios completos
                    const regFees = calculateRegulatoryFees(sellValue, position.shares);
                    const sellCommission = COMMISSION_PER_TRADE;
                    const totalFees = position.buyCommission + sellCommission + regFees.total;
                    const netPnl = grossPnl - totalFees;

                    capital += sellValue - sellCommission - regFees.total;
                    totalCommissions += sellCommission + regFees.total;
                    positions.delete(symbol);

                    const trade = {
                        symbol,
                        date: bar.t.split('T')[0],
                        time: bar.t,
                        entryDate: position.entryDate.split('T')[0],
                        entryTime: position.entryDate,
                        entryPrice: position.entryPrice,
                        exitPrice: executionPrice,
                        shares: position.shares,
                        grossPnl: parseFloat(grossPnl.toFixed(2)),
                        fees: {
                            buyCommission: position.buyCommission,
                            sellCommission: sellCommission,
                            secFee: regFees.secFee,
                            tafFee: regFees.tafFee,
                            total: parseFloat(totalFees.toFixed(2))
                        },
                        slippage: {
                            buy: position.slippage,
                            sell: slippagePercent
                        },
                        pnl: parseFloat(netPnl.toFixed(2)),
                        pnlPercent: parseFloat(pnlPercent.toFixed(2))
                    };

                    trades.push(trade);

                    // Actualizar mejor/peor trade
                    if (netPnl > bestTrade.pnl) {
                        bestTrade = { symbol, pnl: netPnl };
                    }
                    if (netPnl < worstTrade.pnl) {
                        worstTrade = { symbol, pnl: netPnl };
                    }

                    // Actualizar desglose mensual
                    const month = parseInt(trade.date.split('-')[1]) - 1;
                    monthlyBreakdown[month].trades++;
                    monthlyBreakdown[month].grossPnl += grossPnl;
                    monthlyBreakdown[month].commissions += totalFees;
                    monthlyBreakdown[month].pnl += netPnl;

                    const reason = signal && signal.signal === 'SELL' ? 'SEÑAL' : (pnlPercent <= -5 ? 'STOP-LOSS' : 'TAKE-PROFIT');
                    console.log(`📉 SELL ${symbol.padEnd(6)} | ${position.shares} shares @ $${executionPrice.toFixed(2)} | P&L: $${netPnl.toFixed(2)} (${pnlPercent.toFixed(2)}%) | ${reason}`);
                }
            }
        }
    }

    // ============================================
    // CERRAR POSICIONES ABIERTAS AL FINAL
    // ============================================
    console.log(`\n🔒 Cerrando posiciones abiertas al final del período...`);
    for (const [symbol, position] of positions.entries()) {
        const bars = historicalData.get(symbol);
        if (!bars || bars.length === 0) continue;

        const lastBar = bars[bars.length - 1];

        // Calcular volumen promedio para slippage
        const recentBars = bars.slice(-20);
        const avgVolume = recentBars.reduce((sum, b) => sum + b.v, 0) / recentBars.length;

        // INSTITUCIONAL: Slippage dinámico en cierre
        const slippagePercent = calculateDynamicSlippage(position.shares, avgVolume);
        const executionPrice = lastBar.c * (1 - slippagePercent / 100);

        const sellValue = position.shares * executionPrice;
        const buyValue = position.shares * position.entryPrice;
        const grossPnl = sellValue - buyValue;

        // INSTITUCIONAL: Fees completos
        const regFees = calculateRegulatoryFees(sellValue, position.shares);
        const sellCommission = COMMISSION_PER_TRADE;
        const totalFees = position.buyCommission + sellCommission + regFees.total;
        const netPnl = grossPnl - totalFees;

        capital += sellValue - sellCommission - regFees.total;
        totalCommissions += sellCommission + regFees.total;

        const trade = {
            symbol,
            date: lastBar.t.split('T')[0],
            time: lastBar.t,
            entryDate: position.entryDate.split('T')[0],
            entryTime: position.entryDate,
            entryPrice: position.entryPrice,
            exitPrice: executionPrice,
            shares: position.shares,
            grossPnl: parseFloat(grossPnl.toFixed(2)),
            fees: {
                buyCommission: position.buyCommission,
                sellCommission: sellCommission,
                secFee: regFees.secFee,
                tafFee: regFees.tafFee,
                total: parseFloat(totalFees.toFixed(2))
            },
            slippage: {
                buy: position.slippage,
                sell: slippagePercent
            },
            pnl: parseFloat(netPnl.toFixed(2)),
            pnlPercent: parseFloat(((executionPrice - position.entryPrice) / position.entryPrice * 100).toFixed(2))
        };

        trades.push(trade);

        if (netPnl > bestTrade.pnl) {
            bestTrade = { symbol, pnl: netPnl };
        }
        if (netPnl < worstTrade.pnl) {
            worstTrade = { symbol, pnl: netPnl };
        }

        // Calcular índice del mes en el array de 36 meses
        const tradeYear = parseInt(trade.date.split('-')[0]);
        const tradeMonth = parseInt(trade.date.split('-')[1]) - 1; // 0-11
        const monthIndex = (tradeYear - 2023) * 12 + tradeMonth;

        if (monthIndex >= 0 && monthIndex < monthlyBreakdown.length) {
            monthlyBreakdown[monthIndex].trades++;
            monthlyBreakdown[monthIndex].grossPnl += grossPnl;
            monthlyBreakdown[monthIndex].commissions += totalFees;
            monthlyBreakdown[monthIndex].pnl += netPnl;
        }

        console.log(`   ${symbol}: Cerrado @ $${executionPrice.toFixed(2)} | P&L: $${netPnl.toFixed(2)}`);
    }

    // Redondear valores mensuales
    monthlyBreakdown.forEach(month => {
        month.pnl = parseFloat(month.pnl.toFixed(2));
        month.grossPnl = parseFloat(month.grossPnl.toFixed(2));
        month.commissions = parseFloat(month.commissions.toFixed(2));
    });

    // DEBUG: Mostrar resumen de meses con trades
    console.log(`\n📊 Resumen Monthly Breakdown:`);
    const monthsWithTrades = monthlyBreakdown.filter(m => m.trades > 0);
    console.log(`   Total meses con trades: ${monthsWithTrades.length}/36`);

    // Mostrar distribución por año
    const trades2023 = monthlyBreakdown.filter(m => m.year === 2023 && m.trades > 0).length;
    const trades2024 = monthlyBreakdown.filter(m => m.year === 2024 && m.trades > 0).length;
    const trades2025 = monthlyBreakdown.filter(m => m.year === 2025 && m.trades > 0).length;
    console.log(`   Distribución: 2023=${trades2023} meses, 2024=${trades2024} meses, 2025=${trades2025} meses`);

    monthsWithTrades.slice(0, 5).forEach(m => {
        console.log(`   ${m.monthYear}: ${m.trades} trades, P&L: $${m.pnl}`);
    });
    if (monthsWithTrades.length > 5) {
        console.log(`   ... y ${monthsWithTrades.length - 5} meses más`);
    }

    // ============================================
    // CALCULAR RESULTADOS FINALES + MÉTRICAS PROFESIONALES
    // ============================================
    const finalCapital = capital;
    const totalPnL = finalCapital - initialCapital;
    const totalGrossPnl = trades.reduce((sum, t) => sum + t.grossPnl, 0);
    const roi = (totalPnL / initialCapital) * 100;
    const winningTrades = trades.filter(t => t.pnl > 0).length;
    const winRate = trades.length > 0 ? (winningTrades / trades.length) * 100 : 0;

    // INSTITUCIONAL: Calcular métricas profesionales
    const professionalMetrics = calculateProfessionalMetrics(trades, initialCapital, finalCapital);

    // ============================================
    // LOGGING FINAL INSTITUCIONAL
    // ============================================
    console.log(`\n✅ ============================================`);
    console.log(`   RESULTADOS INSTITUCIONALES - ${strategy.toUpperCase()} 2023-2025`);
    console.log(`   ============================================`);
    console.log(`   Capital inicial:     $${initialCapital.toLocaleString()}`);
    console.log(`   Capital final:       $${finalCapital.toLocaleString()}`);
    console.log(`   P&L Bruto:           $${totalGrossPnl.toFixed(2)}`);
    console.log(`   Fees totales:        -$${totalCommissions.toFixed(2)}`);
    console.log(`   P&L Neto:            $${totalPnL.toFixed(2)}`);
    console.log(`   ROI:                 ${roi.toFixed(2)}%`);
    console.log(`   -------------------------------------------`);
    console.log(`   Total trades:        ${trades.length}`);
    console.log(`   Trades ganadores:    ${winningTrades}`);
    console.log(`   Win rate:            ${winRate.toFixed(1)}%`);
    console.log(`   Mejor trade:         ${bestTrade.symbol} (+$${bestTrade.pnl.toFixed(2)})`);
    console.log(`   Peor trade:          ${worstTrade.symbol} ($${worstTrade.pnl.toFixed(2)})`);
    console.log(`   -------------------------------------------`);
    console.log(`   📊 MÉTRICAS PROFESIONALES:`);
    console.log(`   Sharpe Ratio:        ${professionalMetrics.sharpeRatio}`);
    console.log(`   Max Drawdown:        ${professionalMetrics.maxDrawdown}%`);
    console.log(`   Calmar Ratio:        ${professionalMetrics.calmarRatio}`);
    console.log(`   Profit Factor:       ${professionalMetrics.profitFactor}`);
    console.log(`   Avg Win:             $${professionalMetrics.avgWin}`);
    console.log(`   Avg Loss:            $${professionalMetrics.avgLoss}`);
    console.log(`   Win/Loss Ratio:      ${professionalMetrics.winLossRatio}`);
    console.log(`   Avg Trade Duration:  ${professionalMetrics.avgTradeDuration} días`);
    console.log(`   ============================================\n`);

    return {
        year,
        strategy,
        initialCapital,
        finalCapital: parseFloat(finalCapital.toFixed(2)),
        totalPnL: parseFloat(totalPnL.toFixed(2)),
        totalGrossPnl: parseFloat(totalGrossPnl.toFixed(2)),
        totalCommissions: parseFloat(totalCommissions.toFixed(2)),
        roi: parseFloat(roi.toFixed(2)),
        winRate: parseFloat(winRate.toFixed(2)),
        totalTrades: trades.length,
        winningTrades,
        bestTrade,
        worstTrade,
        monthlyBreakdown,
        trades: trades.slice(0, 100),
        ranAt: new Date().toISOString(),
        // INSTITUCIONAL: Métricas profesionales
        professionalMetrics,
        // Metadata institucional completa
        metadata: {
            backtestingType: 'INSTITUTIONAL_GRADE',
            dataSource: 'Alpaca Markets',
            timeframe: '1Hour',
            adjustment: 'all',
            period: '2023-01-01 to 2025-12-11',
            periodYears: '2023-2025',
            commissionPerTrade: COMMISSION_PER_TRADE,
            secFeeRate: 0.0000278,
            tafFeeRate: 0.000166,
            baseSlippage: 0.05,
            dynamicSlippage: true,
            minVolumeThreshold: MIN_VOLUME_THRESHOLD,
            maxPositionPercent: MAX_POSITION_PERCENT,
            maxPositions: MAX_POSITIONS,
            marketHours: '9:30-16:00 EST',
            tradingDays: tradingDays.length,
            stopLoss: -5,
            takeProfit: 15
        }
    };
}

module.exports = { runSimulation };

module.exports = { runSimulation };
