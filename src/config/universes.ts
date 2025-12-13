// Lista de símbolos del S&P 500 (top 100 más líquidos para empezar)
export const SP500_SYMBOLS = [
    // Tecnología
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'AVGO', 'ORCL', 'ADBE',
    'CRM', 'CSCO', 'ACN', 'AMD', 'INTC', 'QCOM', 'TXN', 'INTU', 'IBM', 'NOW',

    // Finanzas
    'JPM', 'BAC', 'WFC', 'GS', 'MS', 'C', 'BLK', 'SCHW', 'AXP', 'SPGI',
    'CME', 'PNC', 'USB', 'TFC', 'COF', 'BK', 'STT', 'TROW', 'AFL', 'MET',

    // Salud
    'UNH', 'JNJ', 'LLY', 'ABBV', 'MRK', 'PFE', 'TMO', 'ABT', 'DHR', 'AMGN',
    'CVS', 'BMY', 'GILD', 'CI', 'ELV', 'ISRG', 'REGN', 'VRTX', 'ZTS', 'SYK',

    // Consumo
    'WMT', 'HD', 'PG', 'KO', 'PEP', 'COST', 'MCD', 'NKE', 'SBUX', 'TGT',
    'LOW', 'TJX', 'EL', 'MDLZ', 'CL', 'KMB', 'GIS', 'HSY', 'K', 'CPB',

    // Energía
    'XOM', 'CVX', 'COP', 'SLB', 'EOG', 'MPC', 'PSX', 'VLO', 'OXY', 'HAL',

    // Industriales
    'BA', 'CAT', 'GE', 'HON', 'UPS', 'RTX', 'LMT', 'DE', 'MMM', 'GD',
];

export const NASDAQ100_SYMBOLS = [
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'AVGO', 'COST', 'NFLX',
    'ADBE', 'PEP', 'CSCO', 'CMCSA', 'TMUS', 'INTC', 'AMD', 'QCOM', 'TXN', 'INTU',
];

export const DOW30_SYMBOLS = [
    'AAPL', 'MSFT', 'UNH', 'GS', 'HD', 'CAT', 'MCD', 'AMGN', 'V', 'BA',
    'TRV', 'AXP', 'JPM', 'IBM', 'HON', 'CVX', 'JNJ', 'WMT', 'PG', 'MRK',
    'DIS', 'NKE', 'CRM', 'KO', 'MMM', 'DOW', 'VZ', 'CSCO', 'INTC', 'WBA',
];

export type UniverseType = 'sp500' | 'nasdaq100' | 'dow30' | 'research';

export const UNIVERSES: Partial<Record<UniverseType, string[]>> = {
    sp500: SP500_SYMBOLS,
    nasdaq100: NASDAQ100_SYMBOLS,
    dow30: DOW30_SYMBOLS,
};

export function getUniverseSymbols(universe: UniverseType): string[] {
    // Para 'research', los símbolos se pasan directamente desde el componente
    // que ya los cargó de Firebase
    if (universe === 'research') {
        return []; // Se manejará en el backend
    }
    return UNIVERSES[universe] || SP500_SYMBOLS;
}
