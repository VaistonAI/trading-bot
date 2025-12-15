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
 * Ejecuta una simulación de backtesting para un año específico
 */
async function runSimulation(year, strategy, symbols, initialCapital, alpacaHeaders) {
    // Check if already exists in Firebase
    try {
        const docRef = db.collection('simulations').doc(year.toString());
        const doc = await docRef.get();

        if (doc.exists) {
            console.log(`📦 Returning existing simulation from Firebase for ${year}`);
            return doc.data();
        }
    } catch (error) {
        console.log('Firebase check failed, proceeding with new simulation');
    }

    console.log(`\n🔄 Iniciando backtesting REAL para ${year}...`);
    console.log(`   Estrategia: ${strategy}`);
    console.log(`   Capital inicial: $${initialCapital}`);
    console.log(`   Símbolos: ${symbols.length}`);

    const startDate = `${year}-01-01T00:00:00Z`;
    const endDate = `${year}-12-31T23:59:59Z`;

    let capital = initialCapital;
    const trades = [];
    const monthlyBreakdown = Array(12).fill(null).map((_, i) => ({
        month: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'][i],
        trades: 0,
        pnl: 0
    }));

    let bestTrade = { symbol: '', pnl: -Infinity };
    let worstTrade = { symbol: '', pnl: Infinity };
    const positions = new Map(); // symbol -> { shares, entryPrice, entryDate }

    console.log('\n📊 Obteniendo datos históricos...');

    // Obtener datos históricos para todos los símbolos
    const historicalData = new Map();
    for (const symbol of symbols) {
        try {
            console.log(`   Descargando ${symbol}...`);
            const bars = await getHistoricalBars(symbol, startDate, endDate, alpacaHeaders);
            if (bars.length > 0) {
                historicalData.set(symbol, bars);
            }
            // Delay para evitar rate limiting
            await new Promise(resolve => setTimeout(resolve, 200));
        } catch (error) {
            console.error(`   Error con ${symbol}:`, error.message);
        }
    }

    console.log(`\n✅ Datos descargados para ${historicalData.size} símbolos`);
    console.log('🤖 Ejecutando estrategia...\n');

    // Simular trading día por día
    const allDates = new Set();
    historicalData.forEach(bars => {
        bars.forEach(bar => allDates.add(bar.t.split('T')[0]));
    });

    const sortedDates = Array.from(allDates).sort();
    const maxPositions = 10;
    const positionSize = initialCapital / maxPositions;

    for (const date of sortedDates) {
        // Revisar cada símbolo
        for (const [symbol, bars] of historicalData.entries()) {
            const barIndex = bars.findIndex(b => b.t.startsWith(date));
            if (barIndex === -1) continue;

            const currentBar = bars[barIndex];
            const historicalBars = bars.slice(0, barIndex + 1);

            // Calcular señal
            const signal = calculateValueSignal(historicalBars);

            if (signal && signal.signal === 'BUY' && !positions.has(symbol) && positions.size < maxPositions) {
                // Comprar
                const shares = Math.floor(positionSize / currentBar.c);
                if (shares > 0) {
                    positions.set(symbol, {
                        shares,
                        entryPrice: currentBar.c,
                        entryDate: date
                    });
                    capital -= shares * currentBar.c;
                }
            } else if (positions.has(symbol)) {
                const position = positions.get(symbol);
                const currentPrice = currentBar.c;
                const pnlPercent = ((currentPrice - position.entryPrice) / position.entryPrice) * 100;

                // Vender si: señal de venta, stop-loss (-5%), o take-profit (+15%)
                if ((signal && signal.signal === 'SELL') || pnlPercent <= -5 || pnlPercent >= 15) {
                    const sellValue = position.shares * currentPrice;
                    const buyValue = position.shares * position.entryPrice;
                    const pnl = sellValue - buyValue;

                    capital += sellValue;
                    positions.delete(symbol);

                    const trade = {
                        symbol,
                        date,
                        entryDate: position.entryDate,
                        entryPrice: position.entryPrice,
                        exitPrice: currentPrice,
                        shares: position.shares,
                        pnl: parseFloat(pnl.toFixed(2)),
                        pnlPercent: parseFloat(pnlPercent.toFixed(2))
                    };

                    trades.push(trade);

                    // Actualizar mejor/peor trade
                    if (pnl > bestTrade.pnl) {
                        bestTrade = { symbol, pnl: parseFloat(pnl.toFixed(2)) };
                    }
                    if (pnl < worstTrade.pnl) {
                        worstTrade = { symbol, pnl: parseFloat(pnl.toFixed(2)) };
                    }

                    // Actualizar desglose mensual
                    const month = parseInt(date.split('-')[1]) - 1;
                    monthlyBreakdown[month].trades++;
                    monthlyBreakdown[month].pnl += pnl;
                }
            }
        }
    }

    // Cerrar posiciones abiertas al final del año
    for (const [symbol, position] of positions.entries()) {
        const bars = historicalData.get(symbol);
        const lastBar = bars[bars.length - 1];
        const sellValue = position.shares * lastBar.c;
        const buyValue = position.shares * position.entryPrice;
        const pnl = sellValue - buyValue;

        capital += sellValue;

        trades.push({
            symbol,
            date: sortedDates[sortedDates.length - 1],
            entryDate: position.entryDate,
            entryPrice: position.entryPrice,
            exitPrice: lastBar.c,
            shares: position.shares,
            pnl: parseFloat(pnl.toFixed(2)),
            pnlPercent: parseFloat((pnl / buyValue * 100).toFixed(2))
        });
    }

    // Redondear P&L mensual
    monthlyBreakdown.forEach(month => {
        month.pnl = parseFloat(month.pnl.toFixed(2));
    });

    const finalCapital = capital;
    const totalPnL = finalCapital - initialCapital;
    const roi = ((totalPnL / initialCapital) * 100);
    const winningTrades = trades.filter(t => t.pnl > 0).length;
    const winRate = trades.length > 0 ? (winningTrades / trades.length) * 100 : 0;

    const results = {
        year,
        strategy,
        initialCapital,
        finalCapital: parseFloat(finalCapital.toFixed(2)),
        totalPnL: parseFloat(totalPnL.toFixed(2)),
        roi: parseFloat(roi.toFixed(2)),
        winRate: parseFloat(winRate.toFixed(2)),
        totalTrades: trades.length,
        bestTrade,
        worstTrade,
        monthlyBreakdown,
        trades: trades.slice(0, 100), // Limitar a 100 trades para no sobrecargar
        ranAt: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Save to Firebase
    console.log(`\n💾 Guardando resultados en Firebase...`);
    try {
        const docRef = db.collection('simulations').doc(year.toString());
        await docRef.set(results);
        console.log(`✅ Resultados guardados exitosamente en Firebase`);
        console.log(`   Documento: simulations/${year}`);

        // Verificar que se guardó
        const savedDoc = await docRef.get();
        if (savedDoc.exists) {
            console.log(`✅ Verificación: Documento existe en Firebase`);
        } else {
            console.error(`❌ ERROR: Documento NO se guardó en Firebase`);
        }
    } catch (error) {
        console.error('❌ Error saving to Firebase:', error.message);
        console.error('   Stack:', error.stack);
    }

    console.log(`\n✅ Backtesting completado:`);
    console.log(`   Total Trades: ${trades.length}`);
    console.log(`   Total P&L: $${totalPnL.toFixed(2)}`);
    console.log(`   ROI: ${roi.toFixed(2)}%`);
    console.log(`   Win Rate: ${winRate.toFixed(2)}%\n`);

    return results;
}

module.exports = { runSimulation };
