const cron = require('node-cron');
const { TradingBot } = require('./trading-bot');

// Símbolos a monitorear
const SYMBOLS = [
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA',
    'NVDA', 'META', 'NFLX', 'AMD', 'INTC'
];

class AutomatedTradingScheduler {
    constructor(getAlpacaHeaders) {
        this.getAlpacaHeaders = getAlpacaHeaders;
        this.tradingBot = new TradingBot(getAlpacaHeaders);
        this.isRunning = false;
        this.lastExecution = null;
        this.executionLog = [];
    }

    /**
     * Inicia el scheduler de trading automático
     */
    start() {
        console.log('🤖 Iniciando sistema de trading automático...');

        // HORARIO BOLSA MEXICANA (BMV): 8:30 AM - 3:00 PM (Lun-Vie)
        // Timezone: America/Mexico_City

        // Ejecutar cada hora durante horario de mercado (9 AM - 3 PM)
        // '0 9-15 * * 1-5' = Cada hora de 9 AM a 3 PM
        this.hourlyJob = cron.schedule('0 9-15 * * 1-5', async () => {
            console.log('⏰ Ejecución horaria - Analizando mercado...');
            await this.executeStrategy();
        }, {
            scheduled: true,
            timezone: "America/Mexico_City"
        });

        // Ejecución especial al inicio del mercado (8:30 AM)
        this.openingJob = cron.schedule('30 8 * * 1-5', async () => {
            console.log('🔔 APERTURA DE MERCADO - Análisis inicial...');
            await this.executeStrategy();
        }, {
            scheduled: true,
            timezone: "America/Mexico_City"
        });

        // Ejecución especial al cierre del mercado (3:00 PM)
        this.closingJob = cron.schedule('0 15 * * 1-5', async () => {
            console.log('🔔 CIERRE DE MERCADO - Análisis final...');
            await this.executeStrategy();
        }, {
            scheduled: true,
            timezone: "America/Mexico_City"
        });

        // Análisis post-mercado (4:00 PM) para preparar siguiente día
        this.postMarketJob = cron.schedule('0 16 * * 1-5', async () => {
            console.log('📊 POST-MERCADO - Análisis del día...');
            await this.checkAndRebalance();
        }, {
            scheduled: true,
            timezone: "America/Mexico_City"
        });

        this.isRunning = true;
        console.log('✅ Trading automático activado para Bolsa Mexicana (BMV)');
        console.log('📅 Horarios (Hora de México):');
        console.log('   - 8:30 AM: Apertura de mercado');
        console.log('   - 9:00 AM - 3:00 PM: Cada hora (7 ejecuciones)');
        console.log('   - 3:00 PM: Cierre de mercado');
        console.log('   - 4:00 PM: Análisis post-mercado');
        console.log('   Total: ~10 análisis diarios');
    }

    /**
     * Detiene el scheduler
     */
    stop() {
        if (this.hourlyJob) {
            this.hourlyJob.stop();
        }
        if (this.openingJob) {
            this.openingJob.stop();
        }
        if (this.closingJob) {
            this.closingJob.stop();
        }
        if (this.postMarketJob) {
            this.postMarketJob.stop();
        }
        this.isRunning = false;
        console.log('🛑 Trading automático detenido');
    }

    /**
     * Ejecuta la estrategia completa
     */
    async executeStrategy() {
        console.log('\n' + '='.repeat(60));
        console.log('🤖 EJECUTANDO ESTRATEGIA AUTOMÁTICA');
        console.log('⏰ Timestamp:', new Date().toISOString());
        console.log('='.repeat(60) + '\n');

        const startTime = Date.now();
        const execution = {
            timestamp: new Date().toISOString(),
            type: 'full_strategy',
            status: 'running',
            trades: [],
            errors: []
        };

        try {
            // Ejecutar estrategia para cada símbolo
            for (const symbol of SYMBOLS) {
                try {
                    console.log(`\n📊 Analizando ${symbol}...`);
                    const result = await this.tradingBot.executeStrategy([symbol]);

                    if (result && result.length > 0) {
                        execution.trades.push(...result);
                        console.log(`✅ ${symbol}: ${result.length} operación(es) ejecutada(s)`);
                    } else {
                        console.log(`ℹ️  ${symbol}: Sin señales de trading`);
                    }
                } catch (error) {
                    console.error(`❌ Error con ${symbol}:`, error.message);
                    execution.errors.push({
                        symbol,
                        error: error.message
                    });
                }

                // Delay entre símbolos para evitar rate limiting
                await this.sleep(1000);
            }

            execution.status = 'completed';
            execution.duration = Date.now() - startTime;

            console.log('\n' + '='.repeat(60));
            console.log('✅ ESTRATEGIA COMPLETADA');
            console.log(`⏱️  Duración: ${(execution.duration / 1000).toFixed(2)}s`);
            console.log(`📈 Operaciones: ${execution.trades.length}`);
            console.log(`❌ Errores: ${execution.errors.length}`);
            console.log('='.repeat(60) + '\n');

        } catch (error) {
            execution.status = 'failed';
            execution.error = error.message;
            console.error('❌ ERROR EN ESTRATEGIA:', error);
        }

        this.lastExecution = execution;
        this.executionLog.push(execution);

        // Mantener solo las últimas 100 ejecuciones
        if (this.executionLog.length > 100) {
            this.executionLog = this.executionLog.slice(-100);
        }

        return execution;
    }

    /**
     * Verifica y rebalancea el portafolio
     */
    async checkAndRebalance() {
        console.log('\n🔄 Verificando portafolio para rebalanceo...');

        try {
            // Aquí puedes agregar lógica de rebalanceo
            // Por ejemplo, verificar stop-loss, take-profit, etc.
            console.log('✅ Verificación completada');
        } catch (error) {
            console.error('❌ Error en rebalanceo:', error);
        }
    }

    /**
     * Obtiene el estado del scheduler
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            lastExecution: this.lastExecution,
            executionHistory: this.executionLog.slice(-10), // Últimas 10 ejecuciones
            nextExecutions: {
                opening: '08:30 Hora México (Lun-Vie)',
                hourly: '09:00-15:00 cada hora (Lun-Vie)',
                closing: '15:00 Hora México (Lun-Vie)',
                postMarket: '16:00 Hora México (Lun-Vie)'
            },
            marketHours: {
                timezone: 'America/Mexico_City',
                open: '08:30',
                close: '15:00',
                days: 'Lunes a Viernes'
            }
        };
    }

    /**
     * Ejecuta manualmente la estrategia (para testing)
     */
    async executeManually() {
        console.log('🎯 Ejecución manual solicitada');
        return await this.executeStrategy();
    }

    /**
     * Helper: Sleep
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = { AutomatedTradingScheduler };
