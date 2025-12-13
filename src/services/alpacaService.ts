/**
 * Servicio de Alpaca para datos de mercado y trading
 * Documentación: https://alpaca.markets/docs/
 */

const API_KEY = import.meta.env.VITE_ALPACA_API_KEY;
const SECRET_KEY = import.meta.env.VITE_ALPACA_SECRET_KEY;
const BASE_URL = import.meta.env.VITE_ALPACA_BASE_URL || 'https://paper-api.alpaca.markets';
const DATA_URL = 'https://data.alpaca.markets';

interface AlpacaQuote {
    symbol: string;
    price: number;
    change: number;
    changePercent: number;
    volume: number;
    latestTradingDay: string;
}

interface AlpacaBar {
    t: string; // timestamp
    o: number; // open
    h: number; // high
    l: number; // low
    c: number; // close
    v: number; // volume
}

interface AlpacaSnapshot {
    symbol: string;
    latestTrade: {
        p: number; // price
        t: string; // timestamp
    };
    latestQuote: {
        ap: number; // ask price
        bp: number; // bid price
    };
    dailyBar: {
        o: number;
        h: number;
        l: number;
        c: number;
        v: number;
    };
}

export const alpacaService = {
    /**
     * Headers para autenticación
     */
    getHeaders(): HeadersInit {
        return {
            'APCA-API-KEY-ID': API_KEY,
            'APCA-API-SECRET-KEY': SECRET_KEY,
            'Content-Type': 'application/json',
        };
    },

    /**
     * Obtiene cotización actual de un símbolo
     */
    async getQuote(symbol: string): Promise<AlpacaQuote> {
        try {
            console.log(`📊 Fetching quote for ${symbol} from Alpaca...`);

            const url = `${DATA_URL}/v2/stocks/${symbol}/snapshot`;
            const response = await fetch(url, {
                headers: this.getHeaders(),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`❌ Alpaca HTTP error: ${response.status}`, errorText);
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data: AlpacaSnapshot = await response.json();
            console.log(`📥 Alpaca snapshot for ${symbol}:`, data);

            if (!data || !data.latestTrade) {
                throw new Error(`No data available for ${symbol}`);
            }

            const currentPrice = data.latestTrade.p;
            const dailyBar = data.dailyBar;
            const change = dailyBar ? currentPrice - dailyBar.o : 0;
            const changePercent = dailyBar && dailyBar.o > 0 ? ((change / dailyBar.o) * 100) : 0;

            const quote: AlpacaQuote = {
                symbol: data.symbol,
                price: currentPrice,
                change: change,
                changePercent: changePercent,
                volume: dailyBar?.v || 0,
                latestTradingDay: new Date(data.latestTrade.t).toISOString().split('T')[0],
            };

            console.log(`✅ Quote for ${symbol}:`, quote);
            return quote;
        } catch (error) {
            console.error(`❌ Error fetching quote for ${symbol}:`, error);
            throw error;
        }
    },

    /**
     * Obtiene datos históricos (barras OHLCV)
     */
    async getHistoricalBars(
        symbol: string,
        timeframe: '1Min' | '5Min' | '15Min' | '1Hour' | '1Day' = '1Day',
        start: string,
        end: string
    ): Promise<AlpacaBar[]> {
        try {
            console.log(`📊 Fetching historical bars for ${symbol}...`);

            const url = `${DATA_URL}/v2/stocks/${symbol}/bars?timeframe=${timeframe}&start=${start}&end=${end}&limit=10000`;
            const response = await fetch(url, {
                headers: this.getHeaders(),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`❌ Alpaca HTTP error: ${response.status}`, errorText);
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log(`📥 Alpaca bars for ${symbol}:`, data.bars?.length || 0, 'bars');

            return data.bars || [];
        } catch (error) {
            console.error(`❌ Error fetching historical bars for ${symbol}:`, error);
            throw error;
        }
    },

    /**
     * Obtiene múltiples cotizaciones a la vez
     */
    async getMultipleQuotes(symbols: string[]): Promise<Map<string, AlpacaQuote>> {
        const quotes = new Map<string, AlpacaQuote>();

        for (const symbol of symbols) {
            try {
                const quote = await this.getQuote(symbol);
                quotes.set(symbol, quote);

                // Pequeño delay para no saturar
                await new Promise(resolve => setTimeout(resolve, 100));
            } catch (error) {
                console.error(`Error getting quote for ${symbol}:`, error);
            }
        }

        return quotes;
    },

    /**
     * Obtiene información de la cuenta
     */
    async getAccount() {
        try {
            const url = `${BASE_URL}/v2/account`;
            const response = await fetch(url, {
                headers: this.getHeaders(),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const account = await response.json();
            console.log('📊 Alpaca Account:', account);
            return account;
        } catch (error) {
            console.error('❌ Error fetching account:', error);
            throw error;
        }
    },

    /**
     * Obtiene posiciones actuales
     */
    async getPositions() {
        try {
            const url = `${BASE_URL}/v2/positions`;
            const response = await fetch(url, {
                headers: this.getHeaders(),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const positions = await response.json();
            console.log('📊 Alpaca Positions:', positions);
            return positions;
        } catch (error) {
            console.error('❌ Error fetching positions:', error);
            throw error;
        }
    },

    /**
     * Crea una orden de compra/venta (Paper Trading)
     */
    async createOrder(params: {
        symbol: string;
        qty: number;
        side: 'buy' | 'sell';
        type: 'market' | 'limit';
        time_in_force: 'day' | 'gtc';
        limit_price?: number;
    }) {
        try {
            console.log('📝 Creating order:', params);

            const url = `${BASE_URL}/v2/orders`;
            const response = await fetch(url, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(params),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`❌ Order error: ${response.status}`, errorText);
                throw new Error(`Order failed: ${errorText}`);
            }

            const order = await response.json();
            console.log('✅ Order created:', order);
            return order;
        } catch (error) {
            console.error('❌ Error creating order:', error);
            throw error;
        }
    },

    /**
     * Obtiene órdenes
     */
    async getOrders(status: 'open' | 'closed' | 'all' = 'all') {
        try {
            const url = `${BASE_URL}/v2/orders?status=${status}`;
            const response = await fetch(url, {
                headers: this.getHeaders(),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const orders = await response.json();
            return orders;
        } catch (error) {
            console.error('❌ Error fetching orders:', error);
            throw error;
        }
    },

    /**
     * Cancela una orden
     */
    async cancelOrder(orderId: string) {
        try {
            const url = `${BASE_URL}/v2/orders/${orderId}`;
            const response = await fetch(url, {
                method: 'DELETE',
                headers: this.getHeaders(),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            console.log(`✅ Order ${orderId} cancelled`);
            return true;
        } catch (error) {
            console.error('❌ Error cancelling order:', error);
            throw error;
        }
    },
};
