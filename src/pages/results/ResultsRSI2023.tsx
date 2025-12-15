import React, { useState, useEffect } from 'react';
import { MainLayout } from '../../components/layout/MainLayout';
import { FaChartArea, FaPlay, FaCheckCircle, FaArrowUp, FaArrowDown } from 'react-icons/fa';
import { db } from '../../config/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface SimulationResult {
    year: number;
    strategy: string;
    initialCapital: number;
    finalCapital: number;
    totalPnL: number;
    roi: number;
    winRate: number;
    totalTrades: number;
    bestTrade: { symbol: string; pnl: number };
    worstTrade: { symbol: string; pnl: number };
    monthlyBreakdown: Array<{ month: string; pnl: number; trades: number }>;
    trades: Array<any>;
    ranAt: any;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const ResultsRSI2023 = () => {
    const [results, setResults] = useState<SimulationResult | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRunning, setIsRunning] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showSaveButton, setShowSaveButton] = useState(false);

    useEffect(() => {
        loadResults();
    }, []);

    const loadResults = async () => {
        try {
            setIsLoading(true);
            const docRef = doc(db, 'simulations-RSI', '2023');
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                setResults(docSnap.data() as SimulationResult);
            }
        } catch (error) {
            console.error('Error loading results:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const runSimulation = async () => {
        try {
            setIsRunning(true);
            const response = await fetch(`${API_URL}/api/simulations/run`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    year: 2023,
                    strategy: 'RSI',
                    symbols: ['SPY', 'SLV', 'XLF', 'QQQ', 'IWM', 'HYG', 'NVDA', 'TQQQ', 'SOXL', 'AVGO', 'ONDS', 'WULF', 'INTC', 'TE', 'DNN', 'FEIM', 'BBAI', 'BMNR'],
                    initialCapital: 10000
                })
            });

            if (response.ok) {
                const data = await response.json();
                setResults(data);
                setShowSaveButton(true);
            } else {
                const error = await response.json();
                alert(`Error: ${error.error}`);
            }
        } catch (error) {
            console.error('Error running simulation:', error);
            alert('Error ejecutando simulaciÃ³n');
        } finally {
            setIsRunning(false);
        }
    };

    const saveToFirebase = async () => {
        if (!results) return;

        try {
            setIsSaving(true);
            const docRef = doc(db, 'simulations-RSI', '2023');
            await setDoc(docRef, {
                ...results,
                ranAt: new Date().toISOString(),
                savedAt: new Date().toISOString()
            });
            alert('âœ… Resultados guardados en Firebase exitosamente');
            setShowSaveButton(false);
            await loadResults();
        } catch (error) {
            console.error('Error saving to Firebase:', error);
            alert('Error guardando en Firebase: ' + (error as Error).message);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <MainLayout>
                <div className="p-6 flex items-center justify-center">
                    <p className="text-text-secondary">Cargando resultados...</p>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="p-6">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-text-primary mb-2">
                            R RSI 2023
                        </h1>
                        <p className="text-text-secondary">
                            SimulaciÃ³n histÃ³rica de la estrategia RSI en 2023 (YTD: Ene 1 - Dic 14)
                        </p>
                    </div>
                    <div className="flex gap-3">
                        {!results && (
                            <button
                                onClick={runSimulation}
                                disabled={isRunning}
                                className={`px-6 py-3 rounded-lg font-semibold flex items-center gap-2 ${isRunning
                                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                                    : 'bg-primary text-white hover:bg-primary-dark'
                                    }`}
                            >
                                <FaPlay />
                                {isRunning ? 'Ejecutando...' : 'Ejecutar SimulaciÃ³n'}
                            </button>
                        )}
                        {showSaveButton && (
                            <button
                                onClick={saveToFirebase}
                                disabled={isSaving}
                                className={`px-6 py-3 rounded-lg font-semibold flex items-center gap-2 ${isSaving
                                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                                    : 'bg-green-600 text-white hover:bg-green-700'
                                    }`}
                            >
                                <FaCheckCircle />
                                {isSaving ? 'Guardando...' : 'Guardar en Firebase'}
                            </button>
                        )}
                    </div>
                </div>

                {results ? (
                    <>
                        <div className="mb-6 flex items-center gap-2 text-green-600">
                            <FaCheckCircle />
                            <span className="font-semibold">
                                SimulaciÃ³n completada el {results.ranAt?.toDate ? new Date(results.ranAt.toDate()).toLocaleDateString('es-MX') : new Date(results.ranAt).toLocaleDateString('es-MX')}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                            <div className="bg-white rounded-lg shadow-sm border border-border p-6">
                                <p className="text-sm text-text-secondary mb-2">P&L Total</p>
                                <p className={`text-3xl font-bold ${results.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {results.totalPnL >= 0 ? '+' : ''}${results.totalPnL.toFixed(2)}
                                </p>
                            </div>

                            <div className="bg-white rounded-lg shadow-sm border border-border p-6">
                                <p className="text-sm text-text-secondary mb-2">ROI</p>
                                <p className={`text-3xl font-bold ${results.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {results.roi >= 0 ? '+' : ''}{results.roi.toFixed(2)}%
                                </p>
                            </div>

                            <div className="bg-white rounded-lg shadow-sm border border-border p-6">
                                <p className="text-sm text-text-secondary mb-2">Win Rate</p>
                                <p className="text-3xl font-bold text-primary">
                                    {results.winRate.toFixed(1)}%
                                </p>
                            </div>

                            <div className="bg-white rounded-lg shadow-sm border border-border p-6">
                                <p className="text-sm text-text-secondary mb-2">Total Trades</p>
                                <p className="text-3xl font-bold text-text-primary">
                                    {results.totalTrades}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div className="bg-white rounded-lg shadow-sm border border-border p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <FaArrowUp className="text-green-600" />
                                    <h3 className="text-lg font-semibold text-text-primary">Mejor Trade</h3>
                                </div>
                                <p className="text-2xl font-bold text-text-primary mb-1">{results.bestTrade?.symbol || 'N/A'}</p>
                                <p className="text-xl font-semibold text-green-600">
                                    +${results.bestTrade?.pnl?.toFixed(2) || '0.00'}
                                </p>
                            </div>

                            <div className="bg-white rounded-lg shadow-sm border border-border p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <FaArrowDown className="text-red-600" />
                                    <h3 className="text-lg font-semibold text-text-primary">Peor Trade</h3>
                                </div>
                                <p className="text-2xl font-bold text-text-primary mb-1">{results.worstTrade?.symbol || 'N/A'}</p>
                                <p className="text-xl font-semibold text-red-600">
                                    ${results.worstTrade?.pnl?.toFixed(2) || '0.00'}
                                </p>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm border border-border p-6 mb-6">
                            <h3 className="text-xl font-semibold text-text-primary mb-4">Desglose Mensual</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-background">
                                        <tr>
                                            <th className="text-left py-3 px-4 font-semibold text-text-primary">Mes</th>
                                            <th className="text-right py-3 px-4 font-semibold text-text-primary">Trades</th>
                                            <th className="text-right py-3 px-4 font-semibold text-text-primary">P&L</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {results.monthlyBreakdown.map((month, idx) => (
                                            <tr key={idx} className="border-t border-gray-100">
                                                <td className="py-3 px-4 text-text-primary">{month.month}</td>
                                                <td className="py-3 px-4 text-right text-text-secondary">{month.trades}</td>
                                                <td className={`py-3 px-4 text-right font-semibold ${month.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                    {month.pnl >= 0 ? '+' : ''}${month.pnl.toFixed(2)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm border border-border p-6">
                            <h3 className="text-xl font-semibold text-text-primary mb-4">Resumen de Capital</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-text-secondary mb-1">Capital Inicial</p>
                                    <p className="text-2xl font-bold text-text-primary">${results.initialCapital.toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-text-secondary mb-1">Capital Final</p>
                                    <p className="text-2xl font-bold text-primary">${results.finalCapital.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="bg-white rounded-lg shadow-sm border border-border p-12 text-center">
                        <FaChartArea className="text-6xl text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-text-primary mb-2">
                            No hay resultados disponibles
                        </h3>
                        <p className="text-text-secondary mb-6">
                            Ejecuta la simulaciÃ³n para ver el rendimiento de la estrategia RSI en 2023
                        </p>
                    </div>
                )}
            </div>
        </MainLayout>
    );
};


