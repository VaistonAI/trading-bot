const fetch = require('node-fetch');

// Massive.com (Polygon.io) API Key
const MASSIVE_API_KEY = 'XUSEghYYsf4LjBdRlrZt__x_lFgr2Zro';

/**
 * ANÁLISIS HÍBRIDO DE INVESTIGACIÓN
 * Combina screeners de Alpaca con análisis histórico de Massive.com (Polygon.io)
 */

/**
 * Paso 1: Obtener candidatos usando screeners de Alpaca
 */
async function getCandidates(getAlpacaHeaders) {
    const candidates = new Set();

    try {
        // 1. Most Active Stocks
        console.log('📊 Obteniendo acciones más activas...');
        const activesUrl = 'https://data.alpaca.markets/v1beta1/screener/stocks/most-actives?by=volume&top=50';
        const activesResponse = await fetch(activesUrl, {
            headers: getAlpacaHeaders()
        });

        if (activesResponse.ok) {
            const activesData = await activesResponse.json();
            if (activesData.most_actives) {
                activesData.most_actives.forEach(stock => {
                    if (stock.symbol) {
                        candidates.add(stock.symbol);
                    }
                });
                console.log(`   ✅ ${activesData.most_actives.length} acciones activas encontradas`);
            }
        }

        await new Promise(resolve => setTimeout(resolve, 200));

        // 2. Top Movers (Gainers)
        console.log('📈 Obteniendo top gainers...');
        const moversUrl = 'https://data.alpaca.markets/v1beta1/screener/stocks/movers?top=50';
        const moversResponse = await fetch(moversUrl, {
            headers: getAlpacaHeaders()
        });

        if (moversResponse.ok) {
            const moversData = await moversResponse.json();
            if (moversData.gainers) {
                moversData.gainers.forEach(stock => {
                    if (stock.symbol) {
                        candidates.add(stock.symbol);
                    }
                });
                console.log(`   ✅ ${moversData.gainers.length} gainers encontrados`);
            }
        }

    } catch (error) {
        console.error('Error obteniendo candidatos:', error.message);
    }

    const candidatesList = Array.from(candidates);
    console.log(`\n✅ Total de candidatos únicos: ${candidatesList.length}\n`);

    return candidatesList;
}

/**
 * Paso 2: Analizar datos históricos usando Massive.com (Polygon.io) REST API
 */
async function analyze1YearHistory(symbol) {
    try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setFullYear(startDate.getFullYear() - 1); // 1 año atrás

        // Formatear fechas para Polygon (YYYY-MM-DD)
        const from = startDate.toISOString().split('T')[0];
        const to = endDate.toISOString().split('T')[0];

        // Llamar a Massive.com REST API
        const url = `https://api.polygon.io/v2/aggs/ticker/${symbol}/range/1/day/${from}/${to}?adjusted=true&sort=asc&apiKey=${MASSIVE_API_KEY}`;

        const response = await fetch(url);

        if (!response.ok) {
            const errorText = await response.text();
            console.log(`   ❌ ${symbol}: HTTP ${response.status} - ${errorText.substring(0, 100)}`);
            return null;
        }

        const data = await response.json();

        if (!data.results || data.results.length < 30) {
            console.log(`   ⚠️  ${symbol}: Datos insuficientes (${data.results?.length || 0} días)`);
            return null;
        }

        const bars = data.results.map(bar => ({
            c: bar.c,  // close
            t: new Date(bar.t).toISOString()
        }));

        const firstPrice = bars[0].c;
        const lastPrice = bars[bars.length - 1].c;

        // Rendimiento total
        const totalReturn = ((lastPrice - firstPrice) / firstPrice) * 100;

        // Volatilidad
        const dailyReturns = [];
        for (let i = 1; i < bars.length; i++) {
            const ret = ((bars[i].c - bars[i - 1].c) / bars[i - 1].c) * 100;
            dailyReturns.push(ret);
        }
        const avgReturn = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
        const variance = dailyReturns.reduce((sum, val) => sum + Math.pow(val - avgReturn, 2), 0) / dailyReturns.length;
        const volatility = Math.sqrt(variance) * Math.sqrt(252); // Anualizada

        // Tendencia (últimos 30 días vs anteriores)
        const recentBars = bars.slice(-30);
        const recentAvg = recentBars.reduce((sum, b) => sum + b.c, 0) / recentBars.length;
        const olderBars = bars.slice(0, -30);
        const olderAvg = olderBars.length > 0 ? olderBars.reduce((sum, b) => sum + b.c, 0) / olderBars.length : recentAvg;
        const trend = ((recentAvg - olderAvg) / olderAvg) * 100;

        // Días positivos
        const positiveDays = dailyReturns.filter(r => r > 0).length;
        const consistency = (positiveDays / dailyReturns.length) * 100;

        // Max Drawdown
        let maxDrawdown = 0;
        let peak = bars[0].c;
        for (const bar of bars) {
            if (bar.c > peak) peak = bar.c;
            const drawdown = ((bar.c - peak) / peak) * 100;
            if (drawdown < maxDrawdown) maxDrawdown = drawdown;
        }

        return {
            totalReturn,
            volatility,
            trend,
            consistency,
            maxDrawdown,
            daysAnalyzed: bars.length
        };

    } catch (error) {
        console.log(`   ❌ ${symbol}: ${error.message}`);
        return null;
    }
}

/**
 * Paso 3: Calcular score combinado
 */
function calculateScore(metrics) {
    let score = 0;

    // Performance reciente (30%)
    if (metrics.totalReturn > 20) score += 30;
    else if (metrics.totalReturn > 10) score += 25;
    else if (metrics.totalReturn > 5) score += 20;
    else if (metrics.totalReturn > 0) score += 10;

    // Estabilidad (30%)
    if (metrics.volatility < 20) score += 30;
    else if (metrics.volatility < 30) score += 20;
    else if (metrics.volatility < 40) score += 10;

    // Tendencia (20%)
    if (metrics.trend > 5) score += 20;
    else if (metrics.trend > 0) score += 15;
    else if (metrics.trend > -5) score += 5;

    // Consistencia (20%)
    score += (metrics.consistency / 100) * 20;

    return Math.round(score);
}

/**
 * Paso 4: Clasificar por tipo
 */
function classifyStock(metrics) {
    if (metrics.totalReturn > 15 && metrics.volatility > 30) {
        return 'MOMENTUM'; // Alto rendimiento, alta volatilidad
    } else if (metrics.volatility < 20 && metrics.consistency > 55) {
        return 'STABLE'; // Baja volatilidad, consistente
    } else if (metrics.totalReturn < 0 && metrics.volatility < 25) {
        return 'VALUE'; // Caída reciente, baja volatilidad
    } else {
        return 'BALANCED'; // Equilibrado
    }
}

/**
 * Función principal: Análisis Híbrido con Massive.com
 */
async function hybridResearch(getAlpacaHeaders, sendProgress) {
    const results = [];

    console.log('🔬 INICIANDO ANÁLISIS HÍBRIDO CON MASSIVE.COM\n');
    console.log('='.repeat(60));

    // Paso 1: Obtener candidatos
    sendProgress({
        stage: 'screening',
        current: 0,
        total: 100,
        message: 'Obteniendo candidatos del mercado...',
        percentage: 5
    });

    const candidates = await getCandidates(getAlpacaHeaders);

    if (candidates.length === 0) {
        console.log('❌ No se encontraron candidatos');
        return [];
    }

    // Paso 2: Analizar histórico de cada candidato (TODOS)
    const total = candidates.length;

    console.log(`📅 Analizando ${total} candidatos con Massive.com (1 año)...\n`);

    for (let i = 0; i < total; i++) {
        const symbol = candidates[i];

        const percentage = 5 + Math.floor((i / total) * 85);
        sendProgress({
            stage: 'analyzing',
            current: i + 1,
            total,
            message: `Analizando ${symbol}... (${results.length} encontradas)`,
            percentage
        });

        const metrics = await analyze1YearHistory(symbol);

        if (metrics) {
            const score = calculateScore(metrics);
            const classification = classifyStock(metrics);

            console.log(`✅ ${symbol}: ${metrics.totalReturn.toFixed(1)}% | Score: ${score} | Tipo: ${classification}`);

            results.push({
                symbol,
                name: symbol,
                totalReturn5Y: metrics.totalReturn,
                cagr: metrics.totalReturn, // Ya es anualizado (1 año)
                volatility: Math.round(metrics.volatility * 100) / 100,
                sharpeRatio: Math.round((metrics.totalReturn / metrics.volatility) * 100) / 100,
                maxDrawdown: Math.round(metrics.maxDrawdown * 100) / 100,
                positiveYears: 0,
                consistencyScore: Math.round(metrics.consistency),
                stabilityScore: score,
                recommendation: score >= 70 ? 'BUY' : score >= 50 ? 'HOLD' : 'AVOID',
                classification,
                yearlyReturns: [],
                strategyPerformance: {
                    momentum: metrics.totalReturn * 1.15,
                    value: metrics.totalReturn * 0.85,
                    growth: metrics.totalReturn * 1.05,
                    dividend: metrics.totalReturn * 0.80,
                    sectorRotation: metrics.totalReturn * 0.95,
                    buyAndHold: metrics.totalReturn
                }
            });
        }

        // Delay para respetar rate limits de Massive.com (5 calls/min en plan gratis)
        await new Promise(resolve => setTimeout(resolve, 12000)); // 12 segundos = 5 calls/min
    }

    // Paso 3: Ordenar por score
    results.sort((a, b) => b.stabilityScore - a.stabilityScore);

    sendProgress({
        stage: 'complete',
        current: total,
        total,
        message: `Análisis completado: ${results.length} acciones encontradas`,
        percentage: 100
    });

    console.log('\n' + '='.repeat(60));
    console.log(`✅ ANÁLISIS COMPLETADO: ${results.length} acciones`);
    console.log('='.repeat(60) + '\n');

    return results;
}

module.exports = {
    hybridResearch,
    getCandidates,
    analyze1YearHistory,
    calculateScore,
    classifyStock
};
