import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { StrategyPerformance } from '../../types/strategy';

interface ReportTabProps {
    performance: StrategyPerformance;
    evolutionData?: Array<{ date: string; value: number }>;
}

export const ReportTab: React.FC<ReportTabProps> = ({
    performance,
    evolutionData = [],
}) => {
    const formatCurrency = (value: number) => {
        return `$${value.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const metrics = [
        {
            label: 'ROI Total',
            value: `${performance.totalReturn > 0 ? '+' : ''}${performance.totalReturn.toFixed(2)}%`,
            color: performance.totalReturn > 0 ? 'text-success' : performance.totalReturn < 0 ? 'text-danger' : 'text-text-secondary',
            bgColor: performance.totalReturn > 0 ? 'bg-success/10' : performance.totalReturn < 0 ? 'bg-danger/10' : 'bg-bg-secondary',
        },
        {
            label: 'Capital Invertido',
            value: formatCurrency(performance.totalInvested),
            color: 'text-primary',
            bgColor: 'bg-primary/10',
        },
        {
            label: 'Valor Actual',
            value: formatCurrency(performance.currentValue),
            color: 'text-info',
            bgColor: 'bg-info/10',
        },
        {
            label: 'Ganancias Realizadas',
            value: formatCurrency(performance.realizedGains),
            color: 'text-success',
            bgColor: 'bg-success/10',
        },
        {
            label: 'Ganancias No Realizadas',
            value: formatCurrency(performance.unrealizedGains),
            color: 'text-warning',
            bgColor: 'bg-warning/10',
        },
        {
            label: 'Total de Operaciones',
            value: performance.totalTrades.toString(),
            color: 'text-text-primary',
            bgColor: 'bg-bg-secondary',
        },
        {
            label: 'Tasa de Éxito',
            value: `${performance.winRate.toFixed(1)}%`,
            color: performance.winRate >= 50 ? 'text-success' : 'text-danger',
            bgColor: performance.winRate >= 50 ? 'bg-success/10' : 'bg-danger/10',
        },
    ];

    if (performance.sharpeRatio !== undefined) {
        metrics.push({
            label: 'Sharpe Ratio',
            value: performance.sharpeRatio.toFixed(2),
            color: performance.sharpeRatio > 1 ? 'text-success' : 'text-warning',
            bgColor: performance.sharpeRatio > 1 ? 'bg-success/10' : 'bg-warning/10',
        });
    }

    if (performance.maxDrawdown !== undefined) {
        metrics.push({
            label: 'Max Drawdown',
            value: `${performance.maxDrawdown.toFixed(2)}%`,
            color: 'text-danger',
            bgColor: 'bg-danger/10',
        });
    }

    return (
        <div className="space-y-6">
            {/* Métricas principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {metrics.map((metric, index) => (
                    <div
                        key={index}
                        className={`${metric.bgColor} rounded-xl p-6 border border-border`}
                    >
                        <p className="text-sm text-text-secondary font-medium mb-2">
                            {metric.label}
                        </p>
                        <p className={`text-3xl font-bold ${metric.color}`}>
                            {metric.value}
                        </p>
                    </div>
                ))}
            </div>

            {/* Gráfica de evolución */}
            {evolutionData.length > 0 && (
                <div className="bg-white rounded-xl shadow-md p-6 border border-border">
                    <h3 className="text-lg font-semibold text-text-primary mb-4">
                        Evolución del Capital
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={evolutionData}>
                            <defs>
                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#2d9bf0" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#2d9bf0" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip
                                formatter={(value: number) => formatCurrency(value)}
                                labelStyle={{ color: '#111827' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke="#2d9bf0"
                                fillOpacity={1}
                                fill="url(#colorValue)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Desglose de impuestos */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-border">
                <h3 className="text-lg font-semibold text-text-primary mb-4">
                    Desglose Fiscal (México)
                </h3>
                <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-bg-primary rounded-lg">
                        <span className="text-text-secondary">ISR sobre Ganancias (10%)</span>
                        <span className="font-semibold text-text-primary">
                            {formatCurrency(performance.realizedGains * 0.10)}
                        </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-bg-primary rounded-lg">
                        <span className="text-text-secondary">Ganancias Netas (después de impuestos)</span>
                        <span className="font-semibold text-success">
                            {formatCurrency(performance.realizedGains * 0.90)}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};
