import React from 'react';
import type { Position } from '../../types/position';

interface PositionsTableProps {
    positions: Position[];
    onSell?: (position: Position) => void;
    isLoading?: boolean;
}

export const PositionsTable: React.FC<PositionsTableProps> = ({
    positions,
    onSell,
    isLoading = false,
}) => {
    const formatCurrency = (value: number) => {
        return `$${value.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const formatPercent = (value: number) => {
        const sign = value >= 0 ? '+' : '';
        return `${sign}${value.toFixed(2)}%`;
    };

    const getProfitColor = (value: number) => {
        if (value > 0) return 'text-success';
        if (value < 0) return 'text-danger';
        return 'text-text-secondary';
    };

    if (isLoading) {
        return (
            <div className="bg-white rounded-xl shadow-md p-8 border border-border">
                <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            </div>
        );
    }

    if (positions.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-md p-8 border border-border text-center">
                <p className="text-text-secondary">No hay posiciones abiertas</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-border">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                    <thead className="bg-bg-secondary">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                                Símbolo
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">
                                Cantidad
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">
                                Precio Promedio
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">
                                Precio Actual
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">
                                Valor Total
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">
                                P&L
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">
                                P&L %
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">
                                Acciones
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-border">
                        {positions.map((position) => (
                            <tr key={position.id} className="hover:bg-bg-primary transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div>
                                        <div className="text-sm font-semibold text-text-primary">
                                            {position.symbol}
                                        </div>
                                        <div className="text-xs text-text-secondary">
                                            {position.companyName}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-text-primary">
                                    {position.quantity}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-text-primary">
                                    {formatCurrency(position.avgBuyPriceInMXN)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                    <div className="text-sm font-semibold text-text-primary">
                                        {formatCurrency(position.currentPriceInMXN)}
                                    </div>
                                    <div className={`text-xs ${getProfitColor(position.metrics.dayChangePercent)}`}>
                                        {formatPercent(position.metrics.dayChangePercent)}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-text-primary">
                                    {formatCurrency(position.metrics.totalValue)}
                                </td>
                                <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-semibold ${getProfitColor(position.metrics.unrealizedGain)}`}>
                                    {formatCurrency(position.metrics.unrealizedGain)}
                                </td>
                                <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-bold ${getProfitColor(position.metrics.unrealizedGainPercent)}`}>
                                    {formatPercent(position.metrics.unrealizedGainPercent)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                    {onSell && (
                                        <button
                                            onClick={() => onSell(position)}
                                            className="text-danger hover:text-danger/80 font-medium cursor-pointer transition-colors"
                                        >
                                            Vender
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
