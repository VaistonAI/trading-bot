const { TradingBot } = require('./trading-bot');
const { admin, db } = require('./firebase-admin');

// Inicializar bot (se creará por usuario)
const activeBots = new Map();

/**
 * Trading API Endpoints
 */
function setupTradingRoutes(app, getAlpacaHeaders) {

    // Iniciar bot de trading
    app.post('/api/trading/start', async (req, res) => {
        try {
            const { userId, capital = 10000, symbols } = req.body;

            if (!userId) {
                return res.status(400).json({ error: 'userId required' });
            }

            // Verificar límite de capital
            if (capital > 10000) {
                return res.status(400).json({ error: 'Capital exceeds $10,000 limit' });
            }

            // Crear bot para este usuario
            const bot = new TradingBot(
                process.env.ALPACA_API_KEY,
                process.env.ALPACA_SECRET_KEY
            );

            bot.start();
            activeBots.set(userId, bot);

            // Guardar config en Firebase
            await db.collection('users').doc(userId).collection('trading').doc('config').set({
                botActive: true,
                strategy: 'value',
                capital,
                maxPositions: 5,
                startedAt: admin.firestore.FieldValue.serverTimestamp()
            });

            // Ejecutar estrategia inmediatamente
            const result = await bot.executeStrategy(symbols || []);

            res.json({
                success: true,
                message: 'Trading bot started',
                result
            });

        } catch (error) {
            console.error('Error starting bot:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // Detener bot
    app.post('/api/trading/stop', async (req, res) => {
        try {
            const { userId } = req.body;

            if (!userId) {
                return res.status(400).json({ error: 'userId required' });
            }

            const bot = activeBots.get(userId);
            if (bot) {
                bot.stop();
                activeBots.delete(userId);
            }

            // Actualizar Firebase
            await db.collection('users').doc(userId).collection('trading').doc('config').update({
                botActive: false,
                stoppedAt: admin.firestore.FieldValue.serverTimestamp()
            });

            res.json({
                success: true,
                message: 'Trading bot stopped'
            });

        } catch (error) {
            console.error('Error stopping bot:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // Obtener estado del bot
    app.get('/api/trading/status', async (req, res) => {
        try {
            const { userId } = req.query;

            if (!userId) {
                return res.status(400).json({ error: 'userId required' });
            }

            const bot = activeBots.get(userId);
            const isActive = bot ? bot.isActive : false;

            res.json({
                botActive: isActive,
                userId
            });

        } catch (error) {
            console.error('Error getting status:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // Emergency stop - Cerrar todas las posiciones
    app.post('/api/trading/emergency-stop', async (req, res) => {
        try {
            const { userId } = req.body;

            if (!userId) {
                return res.status(400).json({ error: 'userId required' });
            }

            const bot = activeBots.get(userId) || new TradingBot(
                process.env.ALPACA_API_KEY,
                process.env.ALPACA_SECRET_KEY
            );

            const result = await bot.emergencyStop();
            activeBots.delete(userId);

            // Actualizar Firebase
            await db.collection('users').doc(userId).collection('trading').doc('config').update({
                botActive: false,
                emergencyStop: true,
                stoppedAt: admin.firestore.FieldValue.serverTimestamp()
            });

            res.json(result);

        } catch (error) {
            console.error('Error in emergency stop:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // Obtener posiciones actuales
    app.get('/api/trading/positions', async (req, res) => {
        try {
            const bot = new TradingBot(
                process.env.ALPACA_API_KEY,
                process.env.ALPACA_SECRET_KEY
            );

            const positions = await bot.getPositions();
            res.json(positions);

        } catch (error) {
            console.error('Error getting positions:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // Obtener cuenta
    app.get('/api/trading/account', async (req, res) => {
        try {
            const bot = new TradingBot(
                process.env.ALPACA_API_KEY,
                process.env.ALPACA_SECRET_KEY
            );

            const account = await bot.getAccount();
            res.json(account);

        } catch (error) {
            console.error('Error getting account:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // Cerrar posición específica
    app.post('/api/trading/close-position/:symbol', async (req, res) => {
        try {
            const { symbol } = req.params;
            const { userId } = req.body;

            const bot = new TradingBot(
                process.env.ALPACA_API_KEY,
                process.env.ALPACA_SECRET_KEY
            );

            const result = await bot.closePosition(symbol);

            // Guardar en Firebase
            if (userId) {
                const db = admin.firestore();

                // Eliminar de posiciones activas
                await db.collection('users')
                    .doc(userId)
                    .collection('trading')
                    .doc('positions')
                    .collection('active')
                    .doc(symbol)
                    .delete();

                // Agregar al historial
                await db.collection('users')
                    .doc(userId)
                    .collection('trading')
                    .doc('history')
                    .collection('trades')
                    .add({
                        symbol,
                        action: 'MANUAL_CLOSE',
                        timestamp: admin.firestore.FieldValue.serverTimestamp(),
                        result
                    });
            }

            res.json(result);

        } catch (error) {
            console.error('Error closing position:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // Ejecutar estrategia manualmente
    app.post('/api/trading/execute-strategy', async (req, res) => {
        try {
            const { userId, symbols } = req.body;

            if (!userId || !symbols) {
                return res.status(400).json({ error: 'userId and symbols required' });
            }

            const bot = activeBots.get(userId) || new TradingBot(
                process.env.ALPACA_API_KEY,
                process.env.ALPACA_SECRET_KEY
            );

            const result = await bot.executeStrategy(symbols);

            res.json(result);

        } catch (error) {
            console.error('Error executing strategy:', error);
            res.status(500).json({ error: error.message });
        }
    });
}

module.exports = { setupTradingRoutes };
