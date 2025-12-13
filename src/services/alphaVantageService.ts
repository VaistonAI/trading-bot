import axios from 'axios';

const API_KEY = import.meta.env.VITE_ALPHA_VANTAGE_API_KEY;
const BASE_URL = 'https://www.alphavantage.co/query';
/**
 * Servicio de Alpha Vantage para obtener datos del mercado de valores
 * Documentación: https://www.alphavantage.co/documentation/
 */

// Cache para evitar exceder límites de API (5 requests/min, 500/día)
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_DURATION = 60000; // 1 minuto

export interface QuoteData {
    symbol: string;
    price: number;
    change: number;
    changePercent: number;
    volume: number;
    high: number;
    low: number;
    open: number;
    previousClose: number;
    latestTradingDay: string;
}

export interface TimeSeriesData {
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

interface TechnicalIndicator {
    date: string;
    value: number;
}

interface FundamentalData {
    symbol: string;
    name: string;
    peRatio: number;
    pbRatio: number;
    dividendYield: number;
    eps: number;
    marketCap: number;
    debtToEquity: number;
}

const getCachedData = <T>(key: string): T | null => {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data as T;
    }
    return null;
};

const setCachedData = (key: string, data: unknown) => {
    cache.set(key, { data, timestamp: Date.now() });
};

export const alphaVantageService = {
    /**
     * Obtiene la cotización actual de una acción
     */
    async getQuote(symbol: string): Promise<QuoteData> {
        const cacheKey = `quote_${symbol}`;
        const cached = getCachedData<QuoteData>(cacheKey);
        if (cached) return cached;

        try {
            const response = await axios.get(BASE_URL, {
                params: {
                    function: 'GLOBAL_QUOTE',
                    symbol,
                    apikey: API_KEY,
                },
            });

            const quote = response.data['Global Quote'];
            if (!quote || Object.keys(quote).length === 0) {
                throw new Error(`No se encontraron datos para ${symbol}`);
            }

            const data: QuoteData = {
                symbol: quote['01. symbol'],
                price: parseFloat(quote['05. price']),
                change: parseFloat(quote['09. change']),
                changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
                volume: parseInt(quote['06. volume']),
                high: parseFloat(quote['03. high']),
                low: parseFloat(quote['04. low']),
                open: parseFloat(quote['02. open']),
                previousClose: parseFloat(quote['08. previous close']),
                latestTradingDay: quote['07. latest trading day'],
            };

            setCachedData(cacheKey, data);
            return data;
        } catch (error) {
            console.error('Error fetching quote:', error);
            throw new Error(`Error al obtener cotización de ${symbol}`);
        }
    },

    /**
     * Obtiene el histórico de precios (diario)
     */
    async getTimeSeries(symbol: string, outputSize: 'compact' | 'full' = 'compact'): Promise<TimeSeriesData[]> {
        const cacheKey = `timeseries_${symbol}_${outputSize}`;
        const cached = getCachedData<TimeSeriesData[]>(cacheKey);
        if (cached) return cached;

        try {
            const response = await axios.get(BASE_URL, {
                params: {
                    function: 'TIME_SERIES_DAILY',
                    symbol,
                    outputsize: outputSize,
                    apikey: API_KEY,
                },
            });

            const timeSeries = response.data['Time Series (Daily)'];
            if (!timeSeries) {
                throw new Error(`No se encontraron datos históricos para ${symbol}`);
            }

            const data: TimeSeriesData[] = Object.entries(timeSeries).map(([date, values]: [string, any]) => ({
                date,
                open: parseFloat(values['1. open']),
                high: parseFloat(values['2. high']),
                low: parseFloat(values['3. low']),
                close: parseFloat(values['4. close']),
                volume: parseInt(values['5. volume']),
            }));

            setCachedData(cacheKey, data);
            return data;
        } catch (error) {
            console.error('Error fetching time series:', error);
            throw new Error(`Error al obtener histórico de ${symbol}`);
        }
    },

    /**
     * Obtiene RSI (Relative Strength Index)
     */
    async getRSI(symbol: string, interval: '1min' | '5min' | '15min' | '30min' | '60min' | 'daily' | 'weekly' | 'monthly' = 'daily', timePeriod: number = 14): Promise<TechnicalIndicator[]> {
        const cacheKey = `rsi_${symbol}_${interval}_${timePeriod}`;
        const cached = getCachedData<TechnicalIndicator[]>(cacheKey);
        if (cached) return cached;

        try {
            const response = await axios.get(BASE_URL, {
                params: {
                    function: 'RSI',
                    symbol,
                    interval,
                    time_period: timePeriod,
                    series_type: 'close',
                    apikey: API_KEY,
                },
            });

            const technicalAnalysis = response.data['Technical Analysis: RSI'];
            if (!technicalAnalysis) {
                throw new Error(`No se encontraron datos de RSI para ${symbol}`);
            }

            const data: TechnicalIndicator[] = Object.entries(technicalAnalysis).map(([date, values]: [string, any]) => ({
                date,
                value: parseFloat(values['RSI']),
            }));

            setCachedData(cacheKey, data);
            return data;
        } catch (error) {
            console.error('Error fetching RSI:', error);
            throw new Error(`Error al obtener RSI de ${symbol}`);
        }
    },

    /**
     * Obtiene MACD (Moving Average Convergence Divergence)
     */
    async getMACD(symbol: string, interval: '1min' | '5min' | '15min' | '30min' | '60min' | 'daily' | 'weekly' | 'monthly' = 'daily'): Promise<any[]> {
        const cacheKey = `macd_${symbol}_${interval}`;
        const cached = getCachedData<any[]>(cacheKey);
        if (cached) return cached;

        try {
            const response = await axios.get(BASE_URL, {
                params: {
                    function: 'MACD',
                    symbol,
                    interval,
                    series_type: 'close',
                    apikey: API_KEY,
                },
            });

            const technicalAnalysis = response.data['Technical Analysis: MACD'];
            if (!technicalAnalysis) {
                throw new Error(`No se encontraron datos de MACD para ${symbol}`);
            }

            const data = Object.entries(technicalAnalysis).map(([date, values]: [string, any]) => ({
                date,
                macd: parseFloat(values['MACD']),
                signal: parseFloat(values['MACD_Signal']),
                histogram: parseFloat(values['MACD_Hist']),
            }));

            setCachedData(cacheKey, data);
            return data;
        } catch (error) {
            console.error('Error fetching MACD:', error);
            throw new Error(`Error al obtener MACD de ${symbol}`);
        }
    },

    /**
     * Obtiene SMA (Simple Moving Average)
     */
    async getSMA(symbol: string, interval: '1min' | '5min' | '15min' | '30min' | '60min' | 'daily' | 'weekly' | 'monthly' = 'daily', timePeriod: number = 20): Promise<TechnicalIndicator[]> {
        const cacheKey = `sma_${symbol}_${interval}_${timePeriod}`;
        const cached = getCachedData<TechnicalIndicator[]>(cacheKey);
        if (cached) return cached;

        try {
            const response = await axios.get(BASE_URL, {
                params: {
                    function: 'SMA',
                    symbol,
                    interval,
                    time_period: timePeriod,
                    series_type: 'close',
                    apikey: API_KEY,
                },
            });

            const technicalAnalysis = response.data['Technical Analysis: SMA'];
            if (!technicalAnalysis) {
                throw new Error(`No se encontraron datos de SMA para ${symbol}`);
            }

            const data: TechnicalIndicator[] = Object.entries(technicalAnalysis).map(([date, values]: [string, any]) => ({
                date,
                value: parseFloat(values['SMA']),
            }));

            setCachedData(cacheKey, data);
            return data;
        } catch (error) {
            console.error('Error fetching SMA:', error);
            throw new Error(`Error al obtener SMA de ${symbol}`);
        }
    },

    /**
     * Obtiene datos fundamentales de una empresa
     */
    async getFundamentals(symbol: string): Promise<FundamentalData> {
        const cacheKey = `fundamentals_${symbol}`;
        const cached = getCachedData<FundamentalData>(cacheKey);
        if (cached) return cached;

        try {
            const response = await axios.get(BASE_URL, {
                params: {
                    function: 'OVERVIEW',
                    symbol,
                    apikey: API_KEY,
                },
            });

            const overview = response.data;
            if (!overview || Object.keys(overview).length === 0) {
                throw new Error(`No se encontraron datos fundamentales para ${symbol}`);
            }

            const data: FundamentalData = {
                symbol: overview['Symbol'],
                name: overview['Name'],
                peRatio: parseFloat(overview['PERatio']) || 0,
                pbRatio: parseFloat(overview['PriceToBookRatio']) || 0,
                dividendYield: parseFloat(overview['DividendYield']) || 0,
                eps: parseFloat(overview['EPS']) || 0,
                marketCap: parseFloat(overview['MarketCapitalization']) || 0,
                debtToEquity: parseFloat(overview['DebtToEquity']) || 0,
            };

            setCachedData(cacheKey, data);
            return data;
        } catch (error) {
            console.error('Error fetching fundamentals:', error);
            throw new Error(`Error al obtener datos fundamentales de ${symbol}`);
        }
    },

    /**
     * Obtiene el tipo de cambio USD/MXN
     */
    async getExchangeRate(): Promise<number> {
        const cacheKey = 'exchange_rate_usd_mxn';
        const cached = getCachedData<number>(cacheKey);
        if (cached) return cached;

        try {
            const response = await axios.get(BASE_URL, {
                params: {
                    function: 'CURRENCY_EXCHANGE_RATE',
                    from_currency: 'USD',
                    to_currency: 'MXN',
                    apikey: API_KEY,
                },
            });

            const exchangeData = response.data['Realtime Currency Exchange Rate'];
            if (!exchangeData) {
                throw new Error('No se pudo obtener el tipo de cambio');
            }

            const rate = parseFloat(exchangeData['5. Exchange Rate']);
            setCachedData(cacheKey, rate);
            return rate;
        } catch (error) {
            console.error('Error fetching exchange rate:', error);
            // Fallback a un tipo de cambio aproximado si falla
            return 20.0;
        }
    },
};
