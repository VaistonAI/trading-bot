const fetch = require('node-fetch');

// Universos de símbolos
const SP500_SYMBOLS = [
    // Tecnología
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'AVGO', 'ORCL', 'ADBE',
    'CRM', 'CSCO', 'ACN', 'AMD', 'INTC', 'QCOM', 'TXN', 'INTU', 'IBM', 'NOW',

    // Finanzas
    'JPM', 'BAC', 'WFC', 'GS', 'MS', 'C', 'BLK', 'SCHW', 'AXP', 'SPGI',
    'CME', 'PNC', 'USB', 'TFC', 'COF', 'BK', 'STT', 'TROW', 'AFL', 'MET',

    // Salud
    'UNH', 'JNJ', 'LLY', 'ABBV', 'MRK', 'PFE', 'TMO', 'ABT', 'DHR', 'AMGN',
    'CVS', 'BMY', 'GILD', 'CI', 'ELV', 'ISRG', 'REGN', 'VRTX', 'ZTS', 'SYK',

    // Consumo
    'WMT', 'HD', 'PG', 'KO', 'PEP', 'COST', 'MCD', 'NKE', 'SBUX', 'TGT',
    'LOW', 'TJX', 'EL', 'MDLZ', 'CL', 'KMB', 'GIS', 'HSY', 'K', 'CPB',

    // Energía
    'XOM', 'CVX', 'COP', 'SLB', 'EOG', 'MPC', 'PSX', 'VLO', 'OXY', 'HAL',

    // Industriales
    'BA', 'CAT', 'GE', 'HON', 'UPS', 'RTX', 'LMT', 'DE', 'MMM', 'GD',
];

const NASDAQ100_SYMBOLS = [
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'AVGO', 'COST', 'NFLX',
    'ADBE', 'PEP', 'CSCO', 'CMCSA', 'TMUS', 'INTC', 'AMD', 'QCOM', 'TXN', 'INTU',
];

const DOW30_SYMBOLS = [
    'AAPL', 'MSFT', 'UNH', 'GS', 'HD', 'CAT', 'MCD', 'AMGN', 'V', 'BA',
    'TRV', 'AXP', 'JPM', 'IBM', 'HON', 'CVX', 'JNJ', 'WMT', 'PG', 'MRK',
    'DIS', 'NKE', 'CRM', 'KO', 'MMM', 'DOW', 'VZ', 'CSCO', 'INTC', 'WBA',
];

// Top 20 acciones de la investigación
const RESEARCH_SYMBOLS = [
    'SPY', 'SLV', 'XLF', 'QQQ', 'IWM', 'HYG', 'THH', 'NVDA', 'TQQQ', 'SOXL',
    'AVGO', 'ONDS', 'WULF', 'INTC', 'TE', 'DNN', 'RVNL', 'FEIM', 'BBAI', 'BMNR'
];

const UNIVERSES = {
    sp500: SP500_SYMBOLS,
    nasdaq100: NASDAQ100_SYMBOLS,
    dow30: DOW30_SYMBOLS,
    research: RESEARCH_SYMBOLS,
};

function getUniverseSymbols(universe) {
    return UNIVERSES[universe] || SP500_SYMBOLS;
}

// Algoritmos de ranking por estrategia
function rankByStrategy(strategy, snapshot) {
    const { dailyBar, latestTrade, latestQuote } = snapshot;

    if (!dailyBar || !latestTrade) return 0;

    const price = latestTrade.p;
    const open = dailyBar.o;
    const high = dailyBar.h;
    const low = dailyBar.l;
    const close = dailyBar.c;
    const volume = dailyBar.v;

    const changePercent = ((price - open) / open) * 100;

    switch (strategy) {
        case 'MOMENTUM':
            return rankMomentum({ price, open, high, low, close, volume, changePercent });
        case 'VALUE':
            return rankValue({ price, open, high, low, close, volume, changePercent });
        case 'GROWTH':
            return rankGrowth({ price, open, high, low, close, volume, changePercent });
        case 'DIVIDEND':
        case 'SECTOR_ROTATION':
            return rankGeneral({ price, open, high, low, close, volume, changePercent });
        default:
            return 0;
    }
}

function rankMomentum({ price, changePercent, volume }) {
    let score = 0;

    // Momentum positivo fuerte
    if (changePercent > 2) score += 30;
    else if (changePercent > 1) score += 20;
    else if (changePercent > 0) score += 10;

    // Volumen alto
    if (volume > 1000000) score += 20;

    // Precio en tendencia alcista
    if (changePercent > 0) score += changePercent * 2;

    return score;
}

function rankValue({ price, changePercent }) {
    let score = 0;

    // Caídas recientes (oportunidad de compra)
    if (changePercent < -2) score += 30;
    else if (changePercent < -1) score += 20;
    else if (changePercent < 0) score += 10;

    // Precio bajo relativo
    if (price < 100) score += 10;

    return score;
}

function rankGrowth({ changePercent, volume }) {
    let score = 0;

    // Crecimiento moderado
    if (changePercent > 1 && changePercent < 5) score += 30;
    else if (changePercent > 0.5) score += 20;

    // Volumen significativo
    if (volume > 500000) score += 20;

    return score;
}

function rankGeneral({ changePercent, volume }) {
    let score = 0;

    if (changePercent > 0) score += 20;
    if (volume > 500000) score += 10;

    return score;
}

// Función principal de screener
async function scanMarket(strategy, universe, topN, startDate, endDate, getAlpacaHeaders, sendProgress) {
    const symbols = getUniverseSymbols(universe);
    const total = symbols.length;

    console.log(`🔍 Escaneando ${total} símbolos del universo ${universe}`);

    // Fase 1: Escanear símbolos
    sendProgress({
        stage: 'scanning',
        current: 0,
        total,
        message: `Escaneando ${total} símbolos...`,
        percentage: 0,
    });

    const results = [];
    const BATCH_SIZE = 10; // Procesar en lotes

    for (let i = 0; i < symbols.length; i += BATCH_SIZE) {
        const batch = symbols.slice(i, i + BATCH_SIZE);
        const symbolsParam = batch.join(',');

        try {
            const url = `https://data.alpaca.markets/v2/stocks/snapshots?symbols=${symbolsParam}`;
            const response = await fetch(url, {
                headers: getAlpacaHeaders(),
            });

            if (response.ok) {
                const data = await response.json();

                for (const symbol of batch) {
                    const snapshot = data[symbol];
                    if (snapshot) {
                        const score = rankByStrategy(strategy, snapshot);
                        results.push({ symbol, score });
                    }
                }
            }

            // Actualizar progreso
            const current = Math.min(i + BATCH_SIZE, total);
            const percentage = Math.floor((current / total) * 70); // 0-70%

            sendProgress({
                stage: 'scanning',
                current,
                total,
                message: `Escaneados ${current} de ${total} símbolos...`,
                percentage,
            });

            // Pequeño delay para no saturar API
            await new Promise(resolve => setTimeout(resolve, 200));
        } catch (error) {
            console.error(`Error escaneando batch ${i}:`, error.message);
        }
    }

    // Fase 2: Rankear
    sendProgress({
        stage: 'ranking',
        current: 0,
        total: results.length,
        message: 'Rankeando símbolos por mejor señal...',
        percentage: 75,
    });

    results.sort((a, b) => b.score - a.score);

    // Fase 3: Seleccionar top N
    sendProgress({
        stage: 'selecting',
        current: 0,
        total: topN,
        message: `Seleccionando los mejores ${topN} símbolos...`,
        percentage: 90,
    });

    const topSymbols = results.slice(0, topN).map(r => r.symbol);

    // Completado
    sendProgress({
        stage: 'complete',
        current: topN,
        total: topN,
        message: `¡Completado! ${topN} símbolos seleccionados`,
        percentage: 100,
    });

    console.log(`✅ Top ${topN} símbolos:`, topSymbols);

    return topSymbols;
}

module.exports = { scanMarket, SP500_SYMBOLS };
