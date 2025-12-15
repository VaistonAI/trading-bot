const fetch = require('node-fetch');
const { admin, db } = require('./firebase-admin');

const ALPACA_DATA_URL = 'https://data.alpaca.markets';

/**
 * Obtiene datos históricos de Alpaca
 */
async function getHistoricalBars(symbol, start, end, alpacaHeaders) {
    const url = `${ALPACA_DATA_URL}/v2/stocks/${symbol}/bars?start=${start}&end=${end}&timeframe=1Day`;
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
 * Ejecuta una simulación de backtesting PROFESIONAL para un año específico
 * INCLUYE: Comisiones, Slippage, Validación de Volumen, Días Hábiles
 */
async function runSimulation(year, strategy, symbols, initialCapital, alpacaHeaders) {
    console.log(`\n🔄 ============================================`);
    console.log(`   BACKTESTING PROFESIONAL ${year}`);
    console.log(`   ============================================`);
    console.log(`   Estrategia: ${strategy.toUpperCase()}`);
    console.log(`   Capital inicial: $${initialCapital.toLocaleString()}`);
    console.log(`   Símbolos: ${symbols.length}`);

    const startDate = `${year}-01-01T00:00:00Z`;
    const endDate = year === 2025 ? `${year}-12-14T23:59:59Z` : `${year}-12-31T23:59:59Z`;

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
    const monthlyBreakdown = Array(12).fill(null).map((_, i) => ({
        month: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'][i],
        trades: 0,
        pnl: 0,
        grossPnl: 0,
        commissions: 0
    }));

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
    // SIMULACIÓN DÍA POR DÍA
    // ============================================
    for (const date of tradingDays) {
        for (const [symbol, bars] of historicalData.entries()) {
            const barIndex = bars.findIndex(b => b.t.startsWith(date));
            if (barIndex === -1) continue;

            const currentBar = bars[barIndex];
            const historicalBars = bars.slice(0, barIndex + 1);

            // VALIDACIÓN DE VOLUMEN
            if (currentBar.v < MIN_VOLUME_THRESHOLD) {
                continue; // Saltar si no hay liquidez suficiente
            }

            // Calcular señal según estrategia
            let signal;
            if (strategy === 'momentum') {
                signal = calculateMomentumSignal(historicalBars);
            } else if (strategy === 'growth') {
                signal = calculateGrowthSignal(historicalBars);
            } else {
                signal = calculateValueSignal(historicalBars);
            }

            // ============================================
            // LÓGICA DE COMPRA CON RESTRICCIONES REALES
            // ============================================
            if (signal && signal.signal === 'BUY' && !positions.has(symbol) && positions.size < MAX_POSITIONS) {
                // Calcular tamaño de posición dinámico
                const maxPositionValue = capital * MAX_POSITION_PERCENT;
                const basePositionValue = initialCapital / MAX_POSITIONS;
                const positionValue = Math.min(maxPositionValue, basePositionValue);

                // APLICAR SLIPPAGE EN COMPRA (compramos más caro)
                const executionPrice = currentBar.c * (1 + SLIPPAGE_PERCENT / 100);

                const shares = Math.floor(positionValue / executionPrice);
                const totalCost = (shares * executionPrice) + COMMISSION_PER_TRADE;

                if (shares > 0 && totalCost <= capital) {
                    positions.set(symbol, {
                        shares,
                        entryPrice: executionPrice,
                        entryDate: date,
                        buyCommission: COMMISSION_PER_TRADE
                    });

                    capital -= totalCost;
                    totalCommissions += COMMISSION_PER_TRADE;

                    console.log(`📈 BUY  ${symbol.padEnd(6)} | ${shares} shares @ $${executionPrice.toFixed(2)} | Comisión: $${COMMISSION_PER_TRADE} | Capital: $${capital.toFixed(2)}`);
                }
            }
            // ============================================
            // LÓGICA DE VENTA CON RESTRICCIONES REALES
            // ============================================
            else if (positions.has(symbol)) {
                const position = positions.get(symbol);

                // APLICAR SLIPPAGE EN VENTA (vendemos más barato)
                const executionPrice = currentBar.c * (1 - SLIPPAGE_PERCENT / 100);
                const pnlPercent = ((executionPrice - position.entryPrice) / position.entryPrice) * 100;

                // Vender si: señal SELL, stop-loss (-5%), o take-profit (+15%)
                if ((signal && signal.signal === 'SELL') || pnlPercent <= -5 || pnlPercent >= 15) {
                    const sellValue = position.shares * executionPrice;
                    const buyValue = position.shares * position.entryPrice;

                    // P&L BRUTO (sin comisiones)
                    const grossPnl = sellValue - buyValue;

                    // P&L NETO (después de comisiones)
                    const sellCommission = COMMISSION_PER_TRADE;
                    const totalTradeCommissions = position.buyCommission + sellCommission;
                    const netPnl = grossPnl - totalTradeCommissions;

                    capital += sellValue - sellCommission;
                    totalCommissions += sellCommission;
                    positions.delete(symbol);

                    const trade = {
                        symbol,
                        date,
                        entryDate: position.entryDate,
                        entryPrice: position.entryPrice,
                        exitPrice: executionPrice,
                        shares: position.shares,
                        grossPnl: parseFloat(grossPnl.toFixed(2)),
                        commissions: parseFloat(totalTradeCommissions.toFixed(2)),
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
                    const month = parseInt(date.split('-')[1]) - 1;
                    monthlyBreakdown[month].trades++;
                    monthlyBreakdown[month].grossPnl += grossPnl;
                    monthlyBreakdown[month].commissions += totalTradeCommissions;
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
        const executionPrice = lastBar.c * (1 - SLIPPAGE_PERCENT / 100);

        const sellValue = position.shares * executionPrice;
        const buyValue = position.shares * position.entryPrice;
        const grossPnl = sellValue - buyValue;

        const sellCommission = COMMISSION_PER_TRADE;
        const totalTradeCommissions = position.buyCommission + sellCommission;
        const netPnl = grossPnl - totalTradeCommissions;

        capital += sellValue - sellCommission;
        totalCommissions += sellCommission;

        const trade = {
            symbol,
            date: tradingDays[tradingDays.length - 1],
            entryDate: position.entryDate,
            entryPrice: position.entryPrice,
            exitPrice: executionPrice,
            shares: position.shares,
            grossPnl: parseFloat(grossPnl.toFixed(2)),
            commissions: parseFloat(totalTradeCommissions.toFixed(2)),
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

        const month = parseInt(trade.date.split('-')[1]) - 1;
        monthlyBreakdown[month].trades++;
        monthlyBreakdown[month].grossPnl += grossPnl;
        monthlyBreakdown[month].commissions += totalTradeCommissions;
        monthlyBreakdown[month].pnl += netPnl;

        console.log(`   ${symbol}: Cerrado @ $${executionPrice.toFixed(2)} | P&L: $${netPnl.toFixed(2)}`);
    }

    // Redondear valores mensuales
    monthlyBreakdown.forEach(month => {
        month.pnl = parseFloat(month.pnl.toFixed(2));
        month.grossPnl = parseFloat(month.grossPnl.toFixed(2));
        month.commissions = parseFloat(month.commissions.toFixed(2));
    });

    // ============================================
    // CALCULAR RESULTADOS FINALES
    // ============================================
    const finalCapital = capital;
    const totalPnL = finalCapital - initialCapital;
    const totalGrossPnl = trades.reduce((sum, t) => sum + t.grossPnl, 0);
    const roi = (totalPnL / initialCapital) * 100;
    const winningTrades = trades.filter(t => t.pnl > 0).length;
    const winRate = trades.length > 0 ? (winningTrades / trades.length) * 100 : 0;

    // ============================================
    // LOGGING FINAL
    // ============================================
    console.log(`\n✅ ============================================`);
    console.log(`   RESULTADOS FINALES - ${strategy.toUpperCase()} ${year}`);
    console.log(`   ============================================`);
    console.log(`   Capital inicial:     $${initialCapital.toLocaleString()}`);
    console.log(`   Capital final:       $${finalCapital.toLocaleString()}`);
    console.log(`   P&L Bruto:           $${totalGrossPnl.toFixed(2)}`);
    console.log(`   Comisiones totales:  -$${totalCommissions.toFixed(2)}`);
    console.log(`   P&L Neto:            $${totalPnL.toFixed(2)}`);
    console.log(`   ROI:                 ${roi.toFixed(2)}%`);
    console.log(`   Total trades:        ${trades.length}`);
    console.log(`   Trades ganadores:    ${winningTrades}`);
    console.log(`   Win rate:            ${winRate.toFixed(1)}%`);
    console.log(`   Mejor trade:         ${bestTrade.symbol} (+$${bestTrade.pnl.toFixed(2)})`);
    console.log(`   Peor trade:          ${worstTrade.symbol} ($${worstTrade.pnl.toFixed(2)})`);
    console.log(`   Días de trading:     ${tradingDays.length}`);
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
        // Metadata profesional
        metadata: {
            commissionPerTrade: COMMISSION_PER_TRADE,
            slippagePercent: SLIPPAGE_PERCENT,
            minVolumeThreshold: MIN_VOLUME_THRESHOLD,
            maxPositionPercent: MAX_POSITION_PERCENT,
            maxPositions: MAX_POSITIONS,
            tradingDays: tradingDays.length,
            backtestingType: 'PROFESSIONAL_GRADE'
        }
    };
}

module.exports = { runSimulation };
