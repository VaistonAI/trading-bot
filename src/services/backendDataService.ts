/**
 * Servicio para obtener datos en tiempo real del backend (Alpaca API)
 * SIN CACHÉ - Todos los datos son siempre frescos y precisos
 */

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface AccountData {
    equity: string;
    cash: string;
    buying_power: string;
    portfolio_value: string;
    last_equity: string;
    currency: string;
}

export interface BackendPosition {
    symbol: string;
    qty: string;
    avg_entry_price: string;
    current_price: string;
    market_value: string;
    cost_basis: string;
    unrealized_pl: string;
    unrealized_plpc: string;
    side: string;
}

export interface MarketStatus {
    is_open: boolean;
    next_open: string;
    next_close: string;
}

export const backendDataService = {
    /**
     * Obtiene datos de cuenta en tiempo real desde Alpaca
     * NO USA CACHÉ - Siempre datos frescos
     */
    async getAccount(): Promise<AccountData> {
        try {
            const response = await fetch(`${BACKEND_URL}/api/trading/account`);

            if (!response.ok) {
                throw new Error(`Error fetching account: ${response.statusText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error getting account data:', error);
            throw new Error('No se pudo obtener datos de cuenta');
        }
    },

    /**
     * Obtiene posiciones actuales en tiempo real desde Alpaca
     * NO USA CACHÉ - Siempre datos frescos
     */
    async getPositions(userId?: string): Promise<BackendPosition[]> {
        try {
            const url = userId
                ? `${BACKEND_URL}/api/trading/positions?userId=${userId}`
                : `${BACKEND_URL}/api/trading/positions`;

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Error fetching positions: ${response.statusText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error getting positions:', error);
            throw new Error('No se pudo obtener posiciones');
        }
    },

    /**
     * Obtiene el estado del mercado en tiempo real
     * NO USA CACHÉ - Siempre datos frescos
     */
    async getMarketStatus(): Promise<MarketStatus> {
        try {
            const response = await fetch(`${BACKEND_URL}/api/trading/market-status`);

            if (!response.ok) {
                throw new Error(`Error fetching market status: ${response.statusText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error getting market status:', error);
            // Fallback: asumir mercado cerrado si hay error
            return {
                is_open: false,
                next_open: '',
                next_close: ''
            };
        }
    },

    /**
     * Ejecuta una orden de compra/venta en Alpaca
     */
    async executeOrder(orderData: {
        symbol: string;
        qty: number;
        side: 'buy' | 'sell';
        type: 'market' | 'limit';
        time_in_force: 'day' | 'gtc';
        limit_price?: number;
    }): Promise<any> {
        try {
            const response = await fetch(`${BACKEND_URL}/api/trading/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(orderData),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Error ejecutando orden');
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error executing order:', error);
            throw error;
        }
    },

    /**
     * Obtiene el historial de órdenes
     */
    async getOrders(status?: 'open' | 'closed' | 'all'): Promise<any[]> {
        try {
            const url = status
                ? `${BACKEND_URL}/api/trading/orders?status=${status}`
                : `${BACKEND_URL}/api/trading/orders`;

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Error fetching orders: ${response.statusText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error getting orders:', error);
            return [];
        }
    }
};
