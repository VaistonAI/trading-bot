/**
 * Configuración de la API backend
 */

// URL del backend API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const apiConfig = {
    baseUrl: API_BASE_URL,

    endpoints: {
        // Alpaca endpoints
        alpacaQuote: (symbol: string) => `${API_BASE_URL}/api/alpaca/quote/${symbol}`,
        alpacaBars: (symbol: string) => `${API_BASE_URL}/api/alpaca/bars/${symbol}`,
        alpacaAccount: () => `${API_BASE_URL}/api/alpaca/account`,
        alpacaPositions: () => `${API_BASE_URL}/api/alpaca/positions`,
        alpacaOrders: () => `${API_BASE_URL}/api/alpaca/orders`,

        // Health check
        health: () => `${API_BASE_URL}/health`,
    },
};

/**
 * Helper para hacer fetch con manejo de errores
 */
export async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options?.headers,
            },
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(error.error || `HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API fetch error:', error);
        throw error;
    }
}
