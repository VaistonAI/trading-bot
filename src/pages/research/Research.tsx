import React, { useState } from 'react';
import { MainLayout } from '../../components/layout/MainLayout';
import { FaFlask, FaChartLine, FaStar } from 'react-icons/fa';
import type { StockResearch } from '../../types/research';
import { useAuth } from '../../contexts/AuthContext';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { SaveResearchButton } from '../../components/SaveResearchButton';

interface ResearchProgress {
    stage: string;
    current: number;
    total: number;
    message: string;
    percentage: number;
}

export const Research: React.FC = () => {
    const { currentUser } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [results, setResults] = useState<StockResearch[]>([]);
    const [progress, setProgress] = useState<ResearchProgress | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleStartResearch = async () => {
        setIsLoading(true);
        setError(null);
        setResults([]);
        setProgress(null);

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/research/top-performers?years=5&limit=20`);

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

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
                                setProgress(data.progress);
                            } else if (data.type === 'complete') {
                                setResults(data.results);

                                // Guardar en Firebase
                                if (currentUser) {
                                    const top20 = data.results.slice(0, 20);
                                    await setDoc(doc(db, 'users', currentUser.uid, 'research', 'latest'), {
                                        date: new Date().toISOString(),
                                        stocks: top20.map((s: StockResearch) => s.symbol),
                                        updatedAt: new Date()
                                    });
                                }
                            } else if (data.type === 'error') {
                                setError(data.error);
                            }
                        }
                    }
                }
            }
        } catch (err) {
            console.error('Error en investigación:', err);
            setError(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            setIsLoading(false);
            setProgress(null);
        }
    };

    const getRecommendationColor = (rec: string) => {
        switch (rec) {
            case 'BUY': return 'text-green-600 bg-green-50';
            case 'HOLD': return 'text-yellow-600 bg-yellow-50';
            case 'AVOID': return 'text-red-600 bg-red-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    const getRecommendationIcon = (rec: string) => {
        switch (rec) {
            case 'BUY': return '✅';
            case 'HOLD': return '⏸️';
            case 'AVOID': return '❌';
            default: return '❓';
        }
    };

    return (
        <MainLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-100 rounded-lg">
                            <FaFlask className="text-3xl text-purple-600" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-text-primary">Investigación de Acciones</h1>
                            <p className="text-text-secondary mt-1">
                                Análisis profundo de las mejores acciones del último año
                            </p>
                        </div>
                    </div>

                    {!isLoading && results.length === 0 && (
                        <>
                            <button
                                onClick={handleStartResearch}
                                className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors shadow-md hover:shadow-lg"
                            >
                                🔬 Iniciar Investigación
                            </button>
                        </>
                    )}

                    {results.length > 0 && (
                        <SaveResearchButton />
                    )}
                </div>

                {/* Info Banner */}
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                        <FaChartLine className="text-purple-600 text-xl mt-1" />
                        <div>
                            <h3 className="font-semibold text-purple-900 mb-1">¿Qué hace esta herramienta?</h3>
                            <p className="text-sm text-purple-800">
                                Analiza las acciones más activas del mercado durante el último año usando datos profesionales de Massive.com,
                                calcula métricas de estabilidad, rendimiento y riesgo, y te muestra las mejores
                                opciones para invertir basándose en datos históricos reales.
                            </p>
                            <p className="text-xs text-purple-700 mt-2">
                                ⏱️ Este análisis puede tardar 15-20 minutos debido a límites de API. Por favor, espera mientras procesamos los datos.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Progress Modal */}
                {isLoading && (
                    <div className="bg-white rounded-xl shadow-md border border-border p-6">
                        <div className="text-center mb-6">
                            <div className="text-6xl mb-4 animate-pulse">🔬</div>
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">
                                Analizando Acciones
                            </h2>
                            <p className="text-sm text-gray-600">
                                {progress?.message || 'Iniciando análisis...'}
                            </p>
                        </div>

                        {progress && (
                            <>
                                <div className="mb-6">
                                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                                        <span>Progreso</span>
                                        <span className="font-bold text-purple-600">{progress.percentage}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                                        <div
                                            className="bg-gradient-to-r from-purple-500 to-purple-600 h-4 rounded-full transition-all duration-300"
                                            style={{ width: `${progress.percentage}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="bg-gray-50 rounded-lg p-4">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-600">Acciones procesadas:</span>
                                        <span className="font-bold text-gray-800">
                                            {progress.current} / {progress.total}
                                        </span>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                        <h3 className="font-semibold text-red-900 mb-2">Error en el Análisis</h3>
                        <p className="text-sm text-red-800">{error}</p>
                    </div>
                )}

                {/* Results */}
                {results.length > 0 && !isLoading && (
                    <div className="bg-white rounded-xl shadow-md border border-border p-6">
                        <h2 className="text-2xl font-bold text-text-primary mb-6">
                            🏆 Top {results.length} Acciones - Último Año
                        </h2>

                        <div className="space-y-4">
                            {results.map((stock, index) => (
                                <div
                                    key={stock.symbol}
                                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="text-2xl font-bold text-gray-400">
                                                #{index + 1}
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-text-primary">
                                                    {stock.symbol}
                                                </h3>
                                                <p className="text-sm text-text-secondary">{stock.name}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6">
                                            <div className="text-right">
                                                <div className="text-2xl font-bold text-green-600">
                                                    +{stock.totalReturn5Y.toFixed(1)}%
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    CAGR: {stock.cagr.toFixed(1)}%/año
                                                </div>
                                            </div>

                                            <div className="text-right">
                                                <div className="flex items-center gap-1 text-yellow-500">
                                                    <FaStar />
                                                    <span className="font-bold">{stock.stabilityScore}/100</span>
                                                </div>
                                                <div className="text-xs text-gray-500">Estabilidad</div>
                                            </div>

                                            <div className={`px-4 py-2 rounded-lg font-semibold ${getRecommendationColor(stock.recommendation)}`}>
                                                {getRecommendationIcon(stock.recommendation)} {stock.recommendation}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Métricas adicionales */}
                                    <div className="mt-4 grid grid-cols-4 gap-4 text-sm">
                                        <div>
                                            <span className="text-gray-500">Volatilidad:</span>
                                            <span className="ml-2 font-semibold">{stock.volatility.toFixed(1)}%</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Sharpe:</span>
                                            <span className="ml-2 font-semibold">{stock.sharpeRatio.toFixed(2)}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Max Drawdown:</span>
                                            <span className="ml-2 font-semibold text-red-600">{stock.maxDrawdown.toFixed(1)}%</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Años Positivos:</span>
                                            <span className="ml-2 font-semibold">{stock.positiveYears}/5</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {!isLoading && results.length === 0 && !error && (
                    <div className="bg-white rounded-xl shadow-md border border-border p-12 text-center">
                        <div className="text-6xl mb-4">🔬</div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">
                            Listo para Investigar
                        </h3>
                        <p className="text-gray-600 mb-6">
                            Haz clic en "Iniciar Investigación" para analizar las mejores acciones
                        </p>
                    </div>
                )}
            </div>
        </MainLayout>
    );
};
