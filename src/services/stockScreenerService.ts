import { apiConfig } from '../config/api';
import { StrategyType } from '../types/strategy';
import type { UniverseType } from '../config/universes';

export interface ScreenerProgress {
    stage: 'scanning' | 'ranking' | 'selecting' | 'complete';
    current: number;
    total: number;
    message: string;
    percentage: number;
}

export interface ScreenerResult {
    symbol: string;
    score: number;
    reason: string;
}

export type ProgressCallback = (progress: ScreenerProgress) => void;

/**
 * Servicio de Stock Screener
 * Escanea el mercado y selecciona los mejores símbolos según la estrategia
 */
export const stockScreenerService = {
    /**
     * Escanea el mercado y retorna los mejores símbolos
     */
    async scanMarket(
        strategy: StrategyType,
        universe: UniverseType,
        topN: number,
        startDate: string,
        endDate: string,
        onProgress?: ProgressCallback
    ): Promise<string[]> {
        try {
            // Llamar al backend para escanear
            const url = `${apiConfig.baseUrl}/api/screener/scan`;

            // Iniciar progreso
            onProgress?.({
                stage: 'scanning',
                current: 0,
                total: 100,
                message: 'Iniciando escaneo del mercado...',
                percentage: 0,
            });

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    strategy,
                    universe,
                    topN,
                    startDate,
                    endDate,
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Leer el stream de progreso
            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            let symbols: string[] = [];

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();

                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || '';

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const data = JSON.parse(line.slice(6));

                            if (data.type === 'progress') {
                                onProgress?.(data.progress);
                            } else if (data.type === 'complete') {
                                symbols = data.symbols;
                            }
                        }
                    }
                }
            }

            return symbols;
        } catch (error) {
            console.error('Error en stock screener:', error);
            throw error;
        }
    },
};
