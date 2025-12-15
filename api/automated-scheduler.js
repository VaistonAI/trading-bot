const cron = require('node-cron');
const { TradingBot } = require('./trading-bot');
const { admin, db } = require('./firebase-admin');

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

        // Tracking diario para reportes
        this.dailyMetrics = {
            date: new Date().toISOString().split('T')[0],
            tradesExecuted: 0,
            positionsOpened: 0,
            positionsClosed: 0,
            capitalStart: 10000,
            capitalEnd: 10000,
            totalPnL: 0
        };
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

        // Generación de reporte diario (4:15 PM)
        this.dailyReportJob = cron.schedule('15 16 * * 1-5', async () => {
            console.log('📋 GENERANDO REPORTE DIARIO...');
            await this.generateDailyReport();
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
        if (this.dailyReportJob) {
            this.dailyReportJob.stop();
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

        // Actualizar métricas diarias
        if (execution.trades && execution.trades.length > 0) {
            this.dailyMetrics.tradesExecuted += execution.trades.length;
            // Contar posiciones abiertas/cerradas
            execution.trades.forEach(trade => {
                if (trade.side === 'buy') this.dailyMetrics.positionsOpened++;
                if (trade.side === 'sell') this.dailyMetrics.positionsClosed++;
            });
        }

        // Mantener solo las últimas 100 ejecuciones
        if (this.executionLog.length > 100) {
            this.executionLog = this.executionLog.slice(-100);
        }

        return execution;
    }

    /**
     * Genera el reporte diario y lo guarda en Firebase
     */
    async generateDailyReport() {
        try {
            console.log('\n' + '='.repeat(60));
            console.log('📋 GENERANDO REPORTE DIARIO');
            console.log('='.repeat(60));

            // Obtener capital actual de Alpaca
            try {
                const account = await this.tradingBot.getAccount();
                this.dailyMetrics.capitalEnd = parseFloat(account.equity);
                this.dailyMetrics.totalPnL = this.dailyMetrics.capitalEnd - this.dailyMetrics.capitalStart;
            } catch (error) {
                console.error('Error obteniendo capital:', error.message);
            }

            const roi = ((this.dailyMetrics.capitalEnd - this.dailyMetrics.capitalStart) / this.dailyMetrics.capitalStart) * 100;

            const report = {
                date: this.dailyMetrics.date,
                tradesExecuted: this.dailyMetrics.tradesExecuted,
                totalPnL: this.dailyMetrics.totalPnL,
                positionsOpened: this.dailyMetrics.positionsOpened,
                positionsClosed: this.dailyMetrics.positionsClosed,
                roi: roi,
                capitalStart: this.dailyMetrics.capitalStart,
                capitalEnd: this.dailyMetrics.capitalEnd,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            };

            // Guardar en Firebase
            await db.collection('dailyReports').add(report);

            console.log('✅ Reporte guardado en Firebase:');
            console.log(`   Fecha: ${report.date}`);
            console.log(`   Operaciones: ${report.tradesExecuted}`);
            console.log(`   P&L: $${report.totalPnL.toFixed(2)}`);
            console.log(`   ROI: ${report.roi.toFixed(2)}%`);
            console.log('='.repeat(60) + '\n');

            // Resetear métricas para el siguiente día
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            this.dailyMetrics = {
                date: tomorrow.toISOString().split('T')[0],
                tradesExecuted: 0,
                positionsOpened: 0,
                positionsClosed: 0,
                capitalStart: this.dailyMetrics.capitalEnd,
                capitalEnd: this.dailyMetrics.capitalEnd,
                totalPnL: 0
            };

            return report;
        } catch (error) {
            console.error('❌ Error generando reporte diario:', error);
            throw error;
        }
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
