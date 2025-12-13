import axios from 'axios';

const API_KEY = import.meta.env.VITE_FINNHUB_API_KEY;
const BASE_URL = 'https://finnhub.io/api/v1';

interface NewsArticle {
    category: string;
    datetime: number;
    headline: string;
    id: number;
    image: string;
    related: string;
    source: string;
    summary: string;
    url: string;
}

interface SentimentData {
    symbol: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    score: number; // -1 a 1
    articlesPositive: number;
    articlesNegative: number;
    articlesNeutral: number;
}

interface EarningsData {
    symbol: string;
    date: string;
    epsActual: number;
    epsEstimate: number;
    revenueActual: number;
    revenueEstimate: number;
    surprise: number;
    surprisePercent: number;
}

export const finnhubService = {
    /**
     * Obtiene noticias de mercado por símbolo
     */
    async getNews(symbol: string, from?: string, to?: string): Promise<NewsArticle[]> {
        try {
            const fromDate = from || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            const toDate = to || new Date().toISOString().split('T')[0];

            const response = await axios.get(`${BASE_URL}/company-news`, {
                params: {
                    symbol,
                    from: fromDate,
                    to: toDate,
                    token: API_KEY,
                },
            });

            return response.data.slice(0, 10); // Limitar a 10 noticias más recientes
        } catch (error) {
            console.error('Error fetching news:', error);
            throw new Error(`Error al obtener noticias de ${symbol}`);
        }
    },

    /**
     * Obtiene noticias generales del mercado
     */
    async getMarketNews(category: 'general' | 'forex' | 'crypto' | 'merger' = 'general'): Promise<NewsArticle[]> {
        try {
            const response = await axios.get(`${BASE_URL}/news`, {
                params: {
                    category,
                    token: API_KEY,
                },
            });

            return response.data.slice(0, 20); // Limitar a 20 noticias
        } catch (error) {
            console.error('Error fetching market news:', error);
            throw new Error('Error al obtener noticias del mercado');
        }
    },

    /**
     * Obtiene sentimiento de noticias para un símbolo
     */
    async getSentiment(symbol: string): Promise<SentimentData> {
        try {
            const response = await axios.get(`${BASE_URL}/news-sentiment`, {
                params: {
                    symbol,
                    token: API_KEY,
                },
            });

            const data = response.data;
            const score = data.sentiment?.score || 0;

            let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
            if (score > 0.2) sentiment = 'positive';
            else if (score < -0.2) sentiment = 'negative';

            return {
                symbol,
                sentiment,
                score,
                articlesPositive: data.sentiment?.positive || 0,
                articlesNegative: data.sentiment?.negative || 0,
                articlesNeutral: data.sentiment?.neutral || 0,
            };
        } catch (error) {
            console.error('Error fetching sentiment:', error);
            // Retornar datos neutrales si falla
            return {
                symbol,
                sentiment: 'neutral',
                score: 0,
                articlesPositive: 0,
                articlesNegative: 0,
                articlesNeutral: 0,
            };
        }
    },

    /**
     * Obtiene datos de earnings (reportes de ganancias)
     */
    async getEarnings(symbol: string): Promise<EarningsData[]> {
        try {
            const response = await axios.get(`${BASE_URL}/stock/earnings`, {
                params: {
                    symbol,
                    token: API_KEY,
                },
            });

            return response.data.map((earning: any) => ({
                symbol,
                date: earning.period,
                epsActual: earning.actual || 0,
                epsEstimate: earning.estimate || 0,
                revenueActual: earning.revenueActual || 0,
                revenueEstimate: earning.revenueEstimate || 0,
                surprise: earning.surprise || 0,
                surprisePercent: earning.surprisePercent || 0,
            }));
        } catch (error) {
            console.error('Error fetching earnings:', error);
            return [];
        }
    },

    /**
     * Busca símbolos por nombre de empresa
     */
    async searchSymbol(query: string): Promise<Array<{ symbol: string; description: string; type: string }>> {
        try {
            const response = await axios.get(`${BASE_URL}/search`, {
                params: {
                    q: query,
                    token: API_KEY,
                },
            });

            return response.data.result.slice(0, 10).map((item: any) => ({
                symbol: item.symbol,
                description: item.description,
                type: item.type,
            }));
        } catch (error) {
            console.error('Error searching symbol:', error);
            return [];
        }
    },
};
