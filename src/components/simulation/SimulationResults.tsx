import React from 'react';
import type { SimulationResult } from '../../types/simulation';
import { Line } from 'recharts';
import { LineChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface SimulationResultsProps {
    result: SimulationResult;
}

export const SimulationResults: React.FC<SimulationResultsProps> = ({ result }) => {
    const { metrics, snapshots, trades, config } = result;

    // Preparar datos para gráfica
    const chartData = snapshots.map(s => ({
        date: s.date,
        capital: s.totalValue,
        inicial: config.initialCapital,
    }));

    return (
        <div className="space-y-6">
            {/* Métricas Principales */}
            <div className="bg-white rounded-xl shadow-md border border-border p-6">
                <h2 className="text-2xl font-bold text-text-primary mb-6">Resultados de Simulación</h2>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-bg-primary rounded-lg">
                        <p className="text-sm text-text-secondary">Rendimiento Total</p>
                        <p className={`text-2xl font-bold ${metrics.totalReturn >= 0 ? 'text-success' : 'text-danger'}`}>
                            {metrics.totalReturn >= 0 ? '+' : ''}{metrics.totalReturn.toFixed(2)}%
                        </p>
                    </div>

                    <div className="p-4 bg-bg-primary rounded-lg">
                        <p className="text-sm text-text-secondary">Ganancia Neta</p>
                        <p className={`text-2xl font-bold ${metrics.totalReturnMXN >= 0 ? 'text-success' : 'text-danger'}`}>
                            ${metrics.totalReturnMXN.toFixed(2)} MXN
                        </p>
                    </div>

                    <div className="p-4 bg-bg-primary rounded-lg">
                        <p className="text-sm text-text-secondary">Operaciones</p>
                        <p className="text-2xl font-bold text-text-primary">{metrics.totalTrades}</p>
                    </div>

                    <div className="p-4 bg-bg-primary rounded-lg">
                        <p className="text-sm text-text-secondary">Tasa de Éxito</p>
                        <p className="text-2xl font-bold text-primary">{metrics.winRate.toFixed(1)}%</p>
                    </div>

                    <div className="p-4 bg-bg-primary rounded-lg">
                        <p className="text-sm text-text-secondary">Mejor Operación</p>
                        <p className="text-xl font-bold text-success">+${metrics.bestTrade.toFixed(2)}</p>
                    </div>

                    <div className="p-4 bg-bg-primary rounded-lg">
                        <p className="text-sm text-text-secondary">Peor Operación</p>
                        <p className="text-xl font-bold text-danger">${metrics.worstTrade.toFixed(2)}</p>
                    </div>

                    <div className="p-4 bg-bg-primary rounded-lg">
                        <p className="text-sm text-text-secondary">Drawdown Máximo</p>
                        <p className="text-xl font-bold text-warning">-{metrics.maxDrawdown.toFixed(2)}%</p>
                    </div>

                    <div className="p-4 bg-bg-primary rounded-lg">
                        <p className="text-sm text-text-secondary">vs Buy & Hold</p>
                        <p className={`text-xl font-bold ${metrics.vsMarket >= 0 ? 'text-success' : 'text-danger'}`}>
                            {metrics.vsMarket >= 0 ? '+' : ''}{metrics.vsMarket.toFixed(2)}%
                        </p>
                    </div>
                </div>

                {/* Comparación */}
                <div className="mt-6 p-4 bg-info/10 rounded-lg border border-info/20">
                    <h3 className="font-semibold text-text-primary mb-2">Comparación con Buy & Hold</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-text-secondary">Estrategia {config.strategyName}:</p>
                            <p className={`font-bold ${metrics.totalReturn >= 0 ? 'text-success' : 'text-danger'}`}>
                                {metrics.totalReturn >= 0 ? '+' : ''}{metrics.totalReturn.toFixed(2)}%
                            </p>
                        </div>
                        <div>
                            <p className="text-text-secondary">Buy & Hold:</p>
                            <p className={`font-bold ${metrics.buyAndHoldReturn >= 0 ? 'text-success' : 'text-danger'}`}>
                                {metrics.buyAndHoldReturn >= 0 ? '+' : ''}{metrics.buyAndHoldReturn.toFixed(2)}%
                            </p>
                        </div>
                    </div>
                </div>

                {/* Costos */}
                <div className="mt-4 grid grid-cols-2 gap-4">
                    <div className="p-3 bg-warning/10 rounded-lg">
                        <p className="text-sm text-text-secondary">Comisiones Totales</p>
                        <p className="text-lg font-bold text-warning">${metrics.totalCommissions.toFixed(2)}</p>
                    </div>
                    <div className="p-3 bg-danger/10 rounded-lg">
                        <p className="text-sm text-text-secondary">Impuestos (ISR)</p>
                        <p className="text-lg font-bold text-danger">${metrics.totalTaxes.toFixed(2)}</p>
                    </div>
                </div>
            </div>

            {/* Gráfica de Capital */}
            <div className="bg-white rounded-xl shadow-md border border-border p-6">
                <h3 className="text-xl font-bold text-text-primary mb-4">Evolución del Capital</h3>
                <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                            dataKey="date"
                            tick={{ fontSize: 12 }}
                            angle={-45}
                            textAnchor="end"
                            height={80}
                        />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Legend />
                        <Line
                            type="monotone"
                            dataKey="capital"
                            stroke="#2d9bf0"
                            strokeWidth={2}
                            name="Capital"
                            dot={false}
                        />
                        <Line
                            type="monotone"
                            dataKey="inicial"
                            stroke="#94a3b8"
                            strokeWidth={1}
                            strokeDasharray="5 5"
                            name="Capital Inicial"
                            dot={false}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Tabla de Operaciones */}
            <div className="bg-white rounded-xl shadow-md border border-border p-6">
                <h3 className="text-xl font-bold text-text-primary mb-4">
                    Historial de Operaciones ({trades.length})
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-bg-primary">
                            <tr>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-text-primary">Fecha</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-text-primary">Tipo</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-text-primary">Símbolo</th>
                                <th className="px-4 py-3 text-right text-sm font-semibold text-text-primary">Cantidad</th>
                                <th className="px-4 py-3 text-right text-sm font-semibold text-text-primary">Precio</th>
                                <th className="px-4 py-3 text-right text-sm font-semibold text-text-primary">Total</th>
                                <th className="px-4 py-3 text-right text-sm font-semibold text-text-primary">Ganancia</th>
                            </tr>
                        </thead>
                        <tbody>
                            {trades.map((trade, index) => (
                                <tr key={index} className="border-t border-border hover:bg-bg-primary">
                                    <td className="px-4 py-3 text-sm text-text-secondary">{trade.date}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded text-xs font-semibold ${trade.type === 'BUY' ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'
                                            }`}>
                                            {trade.type}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm font-semibold text-text-primary">{trade.symbol}</td>
                                    <td className="px-4 py-3 text-sm text-text-secondary text-right">{trade.quantity}</td>
                                    <td className="px-4 py-3 text-sm text-text-secondary text-right">${trade.price.toFixed(2)}</td>
                                    <td className="px-4 py-3 text-sm text-text-primary text-right font-semibold">
                                        ${trade.total.toFixed(2)}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-right">
                                        {trade.profit !== undefined && (
                                            <span className={trade.profit >= 0 ? 'text-success font-semibold' : 'text-danger font-semibold'}>
                                                {trade.profit >= 0 ? '+' : ''}${trade.profit.toFixed(2)}
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
