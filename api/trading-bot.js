const fetch = require('node-fetch');

// Configuración
const ALPACA_PAPER_URL = 'https://paper-api.alpaca.markets';
const MAX_CAPITAL = 1000; // Límite de seguridad
const MAX_POSITIONS = 5;
const STOP_LOSS_PERCENT = -5;
const TAKE_PROFIT_PERCENT = 15;
const POSITION_SIZE = MAX_CAPITAL / MAX_POSITIONS; // $200 por posición

/**
 * TRADING BOT - Value Investing Strategy
 * Ejecuta 1 vez al día después del cierre del mercado
 */

class TradingBot {
    constructor(alpacaApiKey, alpacaSecretKey) {
        this.apiKey = alpacaApiKey;
        this.secretKey = alpacaSecretKey;
        this.isActive = false;
    }

    getHeaders() {
        return {
            'APCA-API-KEY-ID': this.apiKey,
            'APCA-API-SECRET-KEY': this.secretKey,
            'Content-Type': 'application/json'
        };
    }

    // Obtener cuenta
    async getAccount() {
        const response = await fetch(`${ALPACA_PAPER_URL}/v2/account`, {
            headers: this.getHeaders()
        });

        if (!response.ok) {
            throw new Error(`Error getting account: ${response.status}`);
        }

        return await response.json();
    }

    // Obtener posiciones actuales
    async getPositions() {
        const response = await fetch(`${ALPACA_PAPER_URL}/v2/positions`, {
            headers: this.getHeaders()
        });

        if (!response.ok) {
            throw new Error(`Error getting positions: ${response.status}`);
        }

        return await response.json();
    }

    // Crear orden
    async createOrder(symbol, qty, side, type = 'market') {
        const order = {
            symbol,
            qty,
            side, // 'buy' or 'sell'
            type,
            time_in_force: 'day'
        };

        console.log(`📝 Creating ${side} order: ${qty} shares of ${symbol}`);

        const response = await fetch(`${ALPACA_PAPER_URL}/v2/orders`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(order)
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Error creating order: ${error}`);
        }

        const result = await response.json();
        console.log(`✅ Order created: ${result.id}`);
        return result;
    }

    // Cerrar posición
    async closePosition(symbol) {
        console.log(`🔴 Closing position: ${symbol}`);

        const response = await fetch(`${ALPACA_PAPER_URL}/v2/positions/${symbol}`, {
            method: 'DELETE',
            headers: this.getHeaders()
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Error closing position ${symbol}:`, response.status, errorText);

            if (response.status === 403) {
                throw new Error(`No se puede cerrar la posición de ${symbol}. El mercado está cerrado o hay órdenes pendientes. Intenta durante el horario de mercado (9:30 AM - 4:00 PM EST).`);
            }

            throw new Error(`Error closing position: ${response.status} - ${errorText}`);
        }

        return await response.json();
    }

    // Analizar posiciones para stop loss / take profit
    async checkPositions() {
        const positions = await this.getPositions();
        const actions = [];

        for (const position of positions) {
            const currentPrice = parseFloat(position.current_price);
            const avgPrice = parseFloat(position.avg_entry_price);
            const pnlPercent = ((currentPrice - avgPrice) / avgPrice) * 100;

            console.log(`📊 ${position.symbol}: ${pnlPercent.toFixed(2)}% P&L`);

            // Stop Loss
            if (pnlPercent <= STOP_LOSS_PERCENT) {
                console.log(`🛑 STOP LOSS triggered for ${position.symbol}`);
                await this.closePosition(position.symbol);
                actions.push({
                    symbol: position.symbol,
                    action: 'STOP_LOSS',
                    pnl: pnlPercent
                });
            }
            // Take Profit
            else if (pnlPercent >= TAKE_PROFIT_PERCENT) {
                console.log(`💰 TAKE PROFIT triggered for ${position.symbol}`);
                await this.closePosition(position.symbol);
                actions.push({
                    symbol: position.symbol,
                    action: 'TAKE_PROFIT',
                    pnl: pnlPercent
                });
            }
        }

        return actions;
    }

    // Estrategia Value Investing
    async findValueOpportunities(symbols) {
        const opportunities = [];

        for (const symbol of symbols) {
            try {
                // Obtener snapshot
                const response = await fetch(
                    `https://data.alpaca.markets/v2/stocks/${symbol}/snapshot`,
                    { headers: this.getHeaders() }
                );

                if (!response.ok) continue;

                const data = await response.json();
                const snapshot = data.snapshot || data;

                if (!snapshot.dailyBar || !snapshot.prevDailyBar) continue;

                const currentPrice = snapshot.dailyBar.c;
                const prevPrice = snapshot.prevDailyBar.c;
                const changePercent = ((currentPrice - prevPrice) / prevPrice) * 100;
                const volume = snapshot.dailyBar.v;

                // Criterios Value:
                // 1. Caída > 5%
                // 2. Volumen alto
                // 3. Precio razonable
                if (changePercent < -5 && volume > 500000 && currentPrice > 5) {
                    opportunities.push({
                        symbol,
                        price: currentPrice,
                        changePercent,
                        volume,
                        score: Math.abs(changePercent) // Mayor caída = mejor oportunidad
                    });
                }

                // Rate limiting
                await new Promise(resolve => setTimeout(resolve, 100));

            } catch (error) {
                console.error(`Error analyzing ${symbol}:`, error.message);
            }
        }

        // Ordenar por mejor oportunidad
        opportunities.sort((a, b) => b.score - a.score);
        return opportunities;
    }

    // Ejecutar estrategia
    async executeStrategy(symbols) {
        console.log('\n🤖 EJECUTANDO ESTRATEGIA VALUE INVESTING\n');
        console.log('='.repeat(60));

        try {
            // 1. Verificar cuenta
            const account = await this.getAccount();
            const buyingPower = parseFloat(account.buying_power);

            console.log(`💰 Buying Power: $${buyingPower.toFixed(2)}`);

            // 2. Verificar límite de capital
            if (buyingPower < POSITION_SIZE) {
                console.log('⚠️  Insufficient buying power');
                return { success: false, reason: 'Insufficient capital' };
            }

            // 3. Verificar posiciones actuales
            const currentPositions = await this.getPositions();
            console.log(`📊 Current positions: ${currentPositions.length}/${MAX_POSITIONS}`);

            // 4. Check stop loss / take profit
            await this.checkPositions();

            // 5. Si hay espacio, buscar nuevas oportunidades
            if (currentPositions.length < MAX_POSITIONS) {
                const opportunities = await this.findValueOpportunities(symbols);

                console.log(`\n🔍 Found ${opportunities.length} value opportunities`);

                const slotsAvailable = MAX_POSITIONS - currentPositions.length;
                const toBuy = opportunities.slice(0, slotsAvailable);

                for (const opp of toBuy) {
                    const qty = Math.floor(POSITION_SIZE / opp.price);

                    if (qty > 0) {
                        console.log(`\n💵 BUY: ${qty} shares of ${opp.symbol} @ $${opp.price}`);
                        console.log(`   Reason: ${opp.changePercent.toFixed(2)}% drop (Value opportunity)`);

                        await this.createOrder(opp.symbol, qty, 'buy');
                    }
                }
            }

            console.log('\n' + '='.repeat(60));
            console.log('✅ Strategy execution completed\n');

            return { success: true };

        } catch (error) {
            console.error('❌ Error executing strategy:', error);
            return { success: false, error: error.message };
        }
    }

    // Iniciar bot
    start() {
        this.isActive = true;
        console.log('🚀 Trading bot STARTED');
    }

    // Detener bot
    stop() {
        this.isActive = false;
        console.log('🛑 Trading bot STOPPED');
    }

    // Emergency stop - Cerrar todas las posiciones
    async emergencyStop() {
        console.log('🚨 EMERGENCY STOP - Closing all positions');

        try {
            const response = await fetch(`${ALPACA_PAPER_URL}/v2/positions`, {
                method: 'DELETE',
                headers: this.getHeaders()
            });

            if (!response.ok) {
                throw new Error('Failed to close positions');
            }

            this.stop();
            console.log('✅ All positions closed');
            return { success: true };

        } catch (error) {
            console.error('❌ Emergency stop failed:', error);
            return { success: false, error: error.message };
        }
    }
}

module.exports = { TradingBot };

module.exports = TradingBot;
