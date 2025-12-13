import React, { useState, useEffect } from 'react';
import type { SimulationConfig } from '../../types/simulation';
import { StrategyType } from '../../types/strategy';
import type { UniverseType } from '../../config/universes';

interface SimulationConfigFormProps {
    onSubmit: (config: SimulationConfig) => void;
    isLoading: boolean;
}

export const SimulationConfigForm: React.FC<SimulationConfigFormProps> = ({ onSubmit, isLoading }) => {
    // Usar directamente las 20 acciones investigadas
    const researchStocks = [
        'SPY', 'SLV', 'XLF', 'QQQ', 'IWM', 'HYG', 'THH', 'NVDA', 'TQQQ', 'SOXL',
        'AVGO', 'ONDS', 'WULF', 'INTC', 'TE', 'DNN', 'RVNL', 'FEIM', 'BBAI', 'BMNR'
    ];
    const hasResearch = true;

    // Calcular fechas dinámicamente
    const today = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(today.getFullYear() - 1);

    const [config, setConfig] = useState<SimulationConfig>({
        strategyType: StrategyType.MOMENTUM,
        strategyName: 'Momentum Trading',
        initialCapital: 10000,
        maxPositions: 5,
        startDate: oneYearAgo.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0],
        universe: 'research',
        topN: 20,
    });

    // Actualizar topN cuando cambie el universo
    useEffect(() => {
        if (config.universe === 'research') {
            setConfig(prev => ({ ...prev, topN: researchStocks.length }));
        }
    }, [config.universe]);

    const strategies = [
        { type: StrategyType.MOMENTUM, name: 'Momentum Trading' },
        { type: StrategyType.VALUE, name: 'Value Investing' },
        { type: StrategyType.GROWTH, name: 'Growth Investing' },
        { type: StrategyType.DIVIDEND, name: 'Dividend Aristocrats' },
        { type: StrategyType.SECTOR_ROTATION, name: 'Sector Rotation' },
    ];

    const universes = [
        ...(hasResearch ? [{
            value: 'research',
            label: `🔬 Investigación (${researchStocks.length} acciones)`,
            count: researchStocks.length
        }] : []),
        { value: 'sp500', label: 'S&P 500 (100 símbolos)', count: 100 },
        { value: 'nasdaq100', label: 'NASDAQ 100', count: 20 },
        { value: 'dow30', label: 'Dow Jones 30', count: 30 },
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(config);
    };

    const handleStrategyChange = (type: string) => {
        const strategy = strategies.find(s => s.type === type);
        if (strategy) {
            setConfig({ ...config, strategyType: strategy.type, strategyName: strategy.name });
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md border border-border p-6">
            <h2 className="text-2xl font-bold text-text-primary mb-6">Configuración de Simulación</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Estrategia */}
                <div>
                    <label className="block text-sm font-semibold text-text-primary mb-2">
                        Estrategia
                    </label>
                    <select
                        value={config.strategyType}
                        onChange={(e) => handleStrategyChange(e.target.value)}
                        className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                        disabled={isLoading}
                    >
                        {strategies.map(s => (
                            <option key={s.type} value={s.type}>{s.name}</option>
                        ))}
                    </select>
                </div>

                {/* Universo de Acciones */}
                <div>
                    <label className="block text-sm font-semibold text-text-primary mb-2">
                        Universo de Acciones
                    </label>
                    <select
                        value={config.universe}
                        onChange={(e) => setConfig({ ...config, universe: e.target.value as UniverseType })}
                        className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                        disabled={isLoading}
                    >
                        {universes.map(u => (
                            <option key={u.value} value={u.value}>{u.label}</option>
                        ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                        El sistema escaneará automáticamente estos símbolos
                    </p>
                </div>

                {/* Capital Inicial */}
                <div>
                    <label className="block text-sm font-semibold text-text-primary mb-2">
                        Capital Inicial (MXN)
                    </label>
                    <input
                        type="number"
                        value={config.initialCapital}
                        onChange={(e) => setConfig({ ...config, initialCapital: Number(e.target.value) })}
                        min="1000"
                        step="1000"
                        className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                        disabled={isLoading}
                    />
                </div>

                {/* Posiciones Simultáneas */}
                <div>
                    <label className="block text-sm font-semibold text-text-primary mb-2">
                        Posiciones Simultáneas
                    </label>
                    <input
                        type="range"
                        value={config.maxPositions}
                        onChange={(e) => setConfig({ ...config, maxPositions: Number(e.target.value) })}
                        min="1"
                        max="10"
                        className="w-full"
                        disabled={isLoading}
                    />
                    <div className="text-center text-2xl font-bold text-primary mt-2">
                        {config.maxPositions}
                    </div>
                </div>

                {/* Top N Símbolos */}
                <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-text-primary mb-2">
                        Top Símbolos a Seleccionar
                    </label>
                    <input
                        type="range"
                        value={config.topN}
                        onChange={(e) => setConfig({ ...config, topN: Number(e.target.value) })}
                        min="5"
                        max="20"
                        className="w-full"
                        disabled={isLoading}
                    />
                    <div className="text-center text-2xl font-bold text-primary mt-2">
                        {config.topN} símbolos
                    </div>
                    <p className="text-xs text-gray-500 text-center mt-1">
                        Se seleccionarán los {config.topN} mejores según la estrategia
                    </p>
                </div>

                {/* Fecha Inicio */}
                <div>
                    <label className="block text-sm font-semibold text-text-primary mb-2">
                        Fecha Inicio
                    </label>
                    <input
                        type="date"
                        value={config.startDate}
                        onChange={(e) => setConfig({ ...config, startDate: e.target.value })}
                        max={config.endDate}
                        className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                        disabled={isLoading}
                    />
                </div>

                {/* Fecha Fin */}
                <div>
                    <label className="block text-sm font-semibold text-text-primary mb-2">
                        Fecha Fin
                    </label>
                    <input
                        type="date"
                        value={config.endDate}
                        onChange={(e) => setConfig({ ...config, endDate: e.target.value })}
                        min={config.startDate}
                        max={new Date().toISOString().split('T')[0]}
                        className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                        disabled={isLoading}
                    />
                </div>
            </div>

            {/* Info Box */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-2">🔍 Escaneo Automático</h3>
                <p className="text-sm text-blue-800">
                    El sistema escaneará automáticamente el universo seleccionado, analizará cada símbolo
                    según la estrategia elegida, y seleccionará los {config.topN} mejores para la simulación.
                </p>
            </div>

            {/* Botones */}
            <div className="mt-6 flex gap-4">
                <button
                    type="submit"
                    disabled={isLoading}
                    className={`flex-1 px-6 py-3 bg-primary text-white rounded-lg font-semibold transition-colors ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary/90 cursor-pointer'
                        }`}
                >
                    {isLoading ? '🔄 Ejecutando...' : '🚀 Ejecutar Simulación'}
                </button>

                <button
                    type="button"
                    onClick={() => setConfig({
                        strategyType: StrategyType.MOMENTUM,
                        strategyName: 'Momentum Trading',
                        initialCapital: 50000,
                        maxPositions: 5,
                        startDate: '2024-01-01',
                        endDate: '2024-12-11',
                        universe: 'sp500',
                        topN: 10,
                    })}
                    disabled={isLoading}
                    className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all cursor-pointer shadow-md hover:shadow-lg whitespace-nowrap"
                    title="Configura los mejores parámetros recomendados"
                >
                    ✨ Ajustes Recomendados
                </button>

                <button
                    type="button"
                    onClick={() => setConfig({
                        strategyType: StrategyType.MOMENTUM,
                        strategyName: 'Momentum Trading',
                        initialCapital: 10000,
                        maxPositions: 5,
                        startDate: '2024-01-01',
                        endDate: '2024-12-11',
                        universe: 'sp500',
                        topN: 10,
                    })}
                    disabled={isLoading}
                    className="px-6 py-3 bg-gray-200 text-text-primary rounded-lg font-semibold hover:bg-gray-300 transition-colors cursor-pointer"
                >
                    🔄 Limpiar
                </button>
            </div>

            {/* Recommended Settings Info */}
            <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-xs text-green-800">
                    <strong>💡 Ajustes Recomendados:</strong> Momentum Trading • $50,000 MXN • S&P 500 • Top 10 símbolos • 5 posiciones • Año 2024
                </p>
            </div>
        </form>
    );
};
