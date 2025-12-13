import React, { useState } from 'react';
import { MainLayout } from '../../components/layout/MainLayout';
import { SimulationConfigForm } from '../../components/simulation/SimulationConfigForm';
import { SimulationResults } from '../../components/simulation/SimulationResults';
import { ProgressModal } from '../../components/simulation/ProgressModal';
import { backtestingService } from '../../services/backtestingService';
import type { SimulationConfig, SimulationResult } from '../../types/simulation';
import type { ScreenerProgress } from '../../services/stockScreenerService';
import { FaChartLine, FaHistory } from 'react-icons/fa';

export const Simulation: React.FC = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<SimulationResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState<ScreenerProgress | null>(null);

    const handleRunSimulation = async (config: SimulationConfig) => {
        setIsLoading(true);
        setError(null);
        setResult(null);
        setProgress(null);

        try {
            console.log('Ejecutando simulación con config:', config);

            // Ejecutar simulación con callback de progreso
            const simulationResult = await backtestingService.runSimulation(
                config,
                (progressUpdate) => {
                    setProgress(progressUpdate);
                }
            );

            setResult(simulationResult);
            console.log('Simulación completada:', simulationResult);
        } catch (err) {
            console.error('Error en simulación:', err);
            setError(err instanceof Error ? err.message : 'Error desconocido en la simulación');
        } finally {
            setIsLoading(false);
            setProgress(null);
        }
    };

    return (
        <MainLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg">
                        <FaHistory className="text-3xl text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-text-primary">Simulación Histórica</h1>
                        <p className="text-text-secondary mt-1">
                            El sistema escanea automáticamente el mercado y selecciona las mejores oportunidades
                        </p>
                    </div>
                </div>

                {/* Info Banner */}
                <div className="bg-info/10 border border-info/20 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                        <FaChartLine className="text-info text-xl mt-1" />
                        <div>
                            <h3 className="font-semibold text-info mb-1">🔍 Escaneo Automático de Mercado</h3>
                            <p className="text-sm text-text-secondary">
                                Selecciona una estrategia y un universo de acciones. El sistema escaneará automáticamente
                                todos los símbolos, los rankeará según la estrategia elegida, y seleccionará los mejores
                                para ejecutar la simulación histórica.
                            </p>
                            <p className="text-xs text-warning mt-2">
                                ⚠️ Nota: Los resultados pasados no garantizan rendimientos futuros. Herramienta educativa.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Formulario de Configuración */}
                <SimulationConfigForm
                    onSubmit={handleRunSimulation}
                    isLoading={isLoading}
                />

                {/* Error */}
                {error && (
                    <div className="bg-danger/10 border border-danger/20 rounded-xl p-4">
                        <h3 className="font-semibold text-danger mb-2">Error en la Simulación</h3>
                        <p className="text-sm text-text-secondary">{error}</p>
                    </div>
                )}

                {/* Resultados */}
                {result && !isLoading && (
                    <SimulationResults result={result} />
                )}

                {/* Progress Modal */}
                <ProgressModal isOpen={isLoading} progress={progress} />
            </div>
        </MainLayout>
    );
};
