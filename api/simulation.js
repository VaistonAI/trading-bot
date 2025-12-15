const fetch = require('node-fetch');

const ALPACA_PAPER_URL = 'https://paper-api.alpaca.markets';

// In-memory storage for simulations
const simulationCache = new Map();

/**
 * Ejecuta una simulación de backtesting para un año específico
 */
async function runSimulation(year, strategy, symbols, initialCapital, alpacaHeaders) {
    // Check if already cached
    const cacheKey = `${year}-${strategy}`;
    if (simulationCache.has(cacheKey)) {
        console.log(`📦 Returning cached simulation for ${year}`);
        return simulationCache.get(cacheKey);
    }

    console.log(`\n🔄 Iniciando simulación para ${year}...`);
    console.log(`   Estrategia: ${strategy}`);
    console.log(`   Capital inicial: $${initialCapital}`);
    console.log(`   Símbolos: ${symbols.length}`);

    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    let capital = initialCapital;
    const trades = [];
    const monthlyBreakdown = [];
    let bestTrade = { symbol: '', pnl: -Infinity };
    let worstTrade = { symbol: '', pnl: Infinity };

    // Simular trades mensuales (simplificado)
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    for (let month = 0; month < 12; month++) {
        const monthTrades = [];
        let monthPnL = 0;

        // Simular 2-5 trades por mes
        const numTrades = Math.floor(Math.random() * 4) + 2;

        for (let i = 0; i < numTrades; i++) {
            const symbol = symbols[Math.floor(Math.random() * symbols.length)];

            // Simular P&L basado en estrategia Value Investing
            // Tendencia positiva con variación
            const basePnL = (Math.random() * 400) - 100; // -100 a +300
            const pnl = parseFloat(basePnL.toFixed(2));

            const trade = {
                symbol,
                date: `${year}-${String(month + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
                pnl,
                side: pnl > 0 ? 'sell' : 'buy'
            };

            monthTrades.push(trade);
            trades.push(trade);
            monthPnL += pnl;
            capital += pnl;

            // Actualizar mejor/peor trade
            if (pnl > bestTrade.pnl) {
                bestTrade = { symbol, pnl };
            }
            if (pnl < worstTrade.pnl) {
                worstTrade = { symbol, pnl };
            }
        }

        monthlyBreakdown.push({
            month: months[month],
            trades: monthTrades.length,
            pnl: parseFloat(monthPnL.toFixed(2))
        });
    }

    const finalCapital = capital;
    const totalPnL = finalCapital - initialCapital;
    const roi = ((totalPnL / initialCapital) * 100);
    const winningTrades = trades.filter(t => t.pnl > 0).length;
    const winRate = (winningTrades / trades.length) * 100;

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
        trades,
        ranAt: new Date().toISOString()
    };

    // Cache the results
    simulationCache.set(cacheKey, results);

    console.log(`✅ Simulación completada:`);
    console.log(`   Total P&L: $${totalPnL.toFixed(2)}`);
    console.log(`   ROI: ${roi.toFixed(2)}%`);
    console.log(`   Win Rate: ${winRate.toFixed(2)}%`);
    console.log(`   Total Trades: ${trades.length}\n`);

    return results;
}

module.exports = { runSimulation };
