const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware de seguridad
app.use(helmet());
app.use(compression());

// CORS - Permitir llamadas desde el frontend
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://trading.vaiston.com',
    'http://trading.vaiston.com',
    process.env.FRONTEND_URL || 'https://tudominio.com'
];

app.use(cors({
    origin: function (origin, callback) {
        // Permitir requests sin origin (como mobile apps o curl)
        if (!origin) return callback(null, true);

        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true
}));

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'CRM Trading API'
    });
});

// ==========================================
// ALPACA API PROXY ENDPOINTS
// ==========================================

const ALPACA_API_KEY = process.env.ALPACA_API_KEY;
const ALPACA_SECRET_KEY = process.env.ALPACA_SECRET_KEY;
const ALPACA_BASE_URL = process.env.ALPACA_BASE_URL || 'https://paper-api.alpaca.markets';
const ALPACA_DATA_URL = 'https://data.alpaca.markets';

// Headers para Alpaca
const getAlpacaHeaders = () => ({
    'APCA-API-KEY-ID': ALPACA_API_KEY,
    'APCA-API-SECRET-KEY': ALPACA_SECRET_KEY,
    'Content-Type': 'application/json',
});

/**
 * GET /api/alpaca/quote/:symbol
 * Obtiene cotización actual de un símbolo
 */
app.get('/api/alpaca/quote/:symbol', async (req, res) => {
    try {
        const { symbol } = req.params;

        const url = `${ALPACA_DATA_URL}/v2/stocks/${symbol}/snapshot`;
        const response = await fetch(url, {
            headers: getAlpacaHeaders(),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Alpaca error for ${symbol}:`, errorText);
            return res.status(response.status).json({
                error: 'Failed to fetch quote',
                details: errorText
            });
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error fetching quote:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/alpaca/bars/:symbol
 * Obtiene datos históricos (barras OHLCV)
 * Query params: timeframe, start, end
 */
app.get('/api/alpaca/bars/:symbol', async (req, res) => {
    try {
        const { symbol } = req.params;
        const { timeframe = '1Day', start, end, limit = 10000 } = req.query;

        if (!start || !end) {
            return res.status(400).json({
                error: 'Missing required parameters: start and end dates'
            });
        }

        const url = `${ALPACA_DATA_URL}/v2/stocks/${symbol}/bars?timeframe=${timeframe}&start=${start}&end=${end}&limit=${limit}`;

        console.log(`📊 Fetching bars for ${symbol}: ${start} to ${end}`);

        const response = await fetch(url, {
            headers: getAlpacaHeaders(),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Alpaca error for ${symbol}:`, errorText);
            return res.status(response.status).json({
                error: 'Failed to fetch historical data',
                details: errorText
            });
        }

        const data = await response.json();
        console.log(`✅ Retrieved ${data.bars?.length || 0} bars for ${symbol}`);

        res.json(data);
    } catch (error) {
        console.error('Error fetching bars:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/alpaca/account
 * Obtiene información de la cuenta
 */
app.get('/api/alpaca/account', async (req, res) => {
    try {
        const url = `${ALPACA_BASE_URL}/v2/account`;
        const response = await fetch(url, {
            headers: getAlpacaHeaders(),
        });

        if (!response.ok) {
            const errorText = await response.text();
            return res.status(response.status).json({
                error: 'Failed to fetch account',
                details: errorText
            });
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error fetching account:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/alpaca/positions
 * Obtiene posiciones actuales
 */
app.get('/api/alpaca/positions', async (req, res) => {
    try {
        const url = `${ALPACA_BASE_URL}/v2/positions`;
        const response = await fetch(url, {
            headers: getAlpacaHeaders(),
        });

        if (!response.ok) {
            const errorText = await response.text();
            return res.status(response.status).json({
                error: 'Failed to fetch positions',
                details: errorText
            });
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error fetching positions:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/alpaca/orders
 * Crea una orden
 */
app.post('/api/alpaca/orders', async (req, res) => {
    try {
        const url = `${ALPACA_BASE_URL}/v2/orders`;
        const response = await fetch(url, {
            method: 'POST',
            headers: getAlpacaHeaders(),
            body: JSON.stringify(req.body),
        });

        if (!response.ok) {
            const errorText = await response.text();
            return res.status(response.status).json({
                error: 'Failed to create order',
                details: errorText
            });
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/alpaca/orders
 * Obtiene órdenes
 */
app.get('/api/alpaca/orders', async (req, res) => {
    try {
        const { status = 'all' } = req.query;
        const url = `${ALPACA_BASE_URL}/v2/orders?status=${status}`;

        const response = await fetch(url, {
            headers: getAlpacaHeaders(),
        });

        if (!response.ok) {
            const errorText = await response.text();
            return res.status(response.status).json({
                error: 'Failed to fetch orders',
                details: errorText
            });
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: error.message });
    }
});

// ==========================================
// STOCK SCREENER ENDPOINT
// ==========================================

const { scanMarket } = require('./screener');

/**
 * POST /api/screener/scan
 * Escanea el mercado y retorna mejores símbolos
 * Usa Server-Sent Events para progreso en tiempo real
 */
app.post('/api/screener/scan', async (req, res) => {
    const { strategy, universe, topN, startDate, endDate } = req.body;

    console.log(`🔍 Iniciando screener: ${strategy} - ${universe} - Top ${topN}`);

    // Configurar SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Función para enviar progreso
    const sendProgress = (progress) => {
        res.write(`data: ${JSON.stringify({ type: 'progress', progress })}\n\n`);
    };

    try {
        const symbols = await scanMarket(
            strategy,
            universe,
            topN,
            startDate,
            endDate,
            getAlpacaHeaders,
            sendProgress
        );

        // Enviar resultado final
        res.write(`data: ${JSON.stringify({ type: 'complete', symbols })}\n\n`);
        res.end();
    } catch (error) {
        console.error('Error en screener:', error);
        res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`);
        res.end();
    }
});

// ==========================================
// RESEARCH ENDPOINT
// ==========================================

const { hybridResearch } = require('./research');

/**
 * GET /api/research/top-performers
 * Análisis híbrido: Screeners + Histórico 3 meses
 */
app.get('/api/research/top-performers', async (req, res) => {
    const { limit = 20 } = req.query;

    console.log(`🔬 Iniciando análisis híbrido de investigación (top ${limit})`);

    // Configurar SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const sendProgress = (progress) => {
        res.write(`data: ${JSON.stringify({ type: 'progress', progress })}\n\n`);
    };

    try {
        const results = await hybridResearch(getAlpacaHeaders, sendProgress);

        // Limitar resultados
        const topResults = results.slice(0, parseInt(limit));

        // Enviar resultado final
        res.write(`data: ${JSON.stringify({ type: 'complete', results: topResults })}\n\n`);
        res.end();
    } catch (error) {
        console.error('Error en research:', error);
        res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`);
        res.end();
    }
});

// ==========================================
// DAILY REPORTS ENDPOINT
// ==========================================

app.get('/api/reports/daily', async (req, res) => {
    try {
        // Fetch reports from Firebase
        const reportsSnapshot = await db.collection('dailyReports')
            .orderBy('date', 'desc')
            .limit(100)
            .get();

        const reports = [];
        reportsSnapshot.forEach(doc => {
            reports.push({
                id: doc.id,
                ...doc.data()
            });
        });

        res.json(reports);
    } catch (error) {
        console.error('Error fetching daily reports:', error);
        res.status(500).json({ error: error.message });
    }
});

// ==========================================
// SIMULATION ENDPOINT
// ==========================================

const { runSimulation } = require('./simulation');

app.post('/api/simulations/run', async (req, res) => {
    try {
        const { year, strategy, symbols, initialCapital } = req.body;

        if (!year || !symbols || !initialCapital) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }

        // Ejecutar simulación
        const results = await runSimulation(
            year,
            strategy || 'value',
            symbols,
            initialCapital,
            getAlpacaHeaders()
        );

        res.json(results);
    } catch (error) {
        console.error('Error running simulation:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/simulations/:year', async (req, res) => {
    try {
        const { year } = req.params;

        // Return null if not cached (frontend will show "run simulation" button)
        res.json(null);
    } catch (error) {
        console.error('Error getting simulation:', error);
        res.status(500).json({ error: error.message });
    }
});

// ==========================================
// TEST ENDPOINT
// ==========================================

const { testAlpacaAPI } = require('./test-alpaca');

/**
 * GET /api/test/alpaca
 * Prueba la conexión con Alpaca API
 */
app.get('/api/test/alpaca', async (req, res) => {
    console.log('🧪 Endpoint de prueba llamado');
    const result = await testAlpacaAPI(getAlpacaHeaders);
    res.json({ success: result });
});


// Error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: err.message
    });
});


// ==========================================
// TRADING BOT ENDPOINTS
// ==========================================
const { setupTradingRoutes } = require('./trading-routes');
setupTradingRoutes(app, getAlpacaHeaders);

// ==========================================
// AUTOMATED TRADING SCHEDULER
// ==========================================
const { AutomatedTradingScheduler } = require('./automated-scheduler');
const scheduler = new AutomatedTradingScheduler(getAlpacaHeaders);

// Iniciar trading automático si está habilitado en .env
if (process.env.AUTO_TRADING_ENABLED === 'true') {
    scheduler.start();
}

/**
 * GET /api/trading/auto/status
 * Obtiene el estado del trading automático
 */
app.get('/api/trading/auto/status', (req, res) => {
    res.json(scheduler.getStatus());
});

/**
 * POST /api/trading/auto/start
 * Inicia el trading automático
 */
app.post('/api/trading/auto/start', (req, res) => {
    scheduler.start();
    res.json({ success: true, message: 'Trading automático iniciado' });
});

/**
 * POST /api/trading/auto/stop
 * Detiene el trading automático
 */
app.post('/api/trading/auto/stop', (req, res) => {
    scheduler.stop();
    res.json({ success: true, message: 'Trading automático detenido' });
});

/**
 * POST /api/trading/auto/execute
 * Ejecuta manualmente la estrategia (para testing)
 */
app.post('/api/trading/auto/execute', async (req, res) => {
    try {
        const result = await scheduler.executeManually();
        res.json({ success: true, result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════╗
║   CRM Trading API Server               ║
║   Port: ${PORT}                       ║
║   Environment: ${process.env.NODE_ENV || 'development'}           ║
║   Status: ✅ Running                   ║
║   Auto-Trading: ${process.env.AUTO_TRADING_ENABLED === 'true' ? '✅ Enabled' : '❌ Disabled'}        ║
╚════════════════════════════════════════╝
    `);

    // Verificar variables de entorno
    if (!ALPACA_API_KEY || !ALPACA_SECRET_KEY) {
        console.warn('⚠️  WARNING: Alpaca API credentials not configured!');
        console.warn('   Set ALPACA_API_KEY and ALPACA_SECRET_KEY in .env file');
    } else {
        console.log('✅ Alpaca API credentials configured');
    }

    if (process.env.AUTO_TRADING_ENABLED === 'true') {
        console.log('🤖 Trading automático ACTIVO');
    } else {
        console.log('ℹ️  Trading automático DESACTIVADO (set AUTO_TRADING_ENABLED=true para activar)');
    }
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    scheduler.stop();
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT signal received: closing HTTP server');
    scheduler.stop();
    process.exit(0);
});
