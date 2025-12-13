import React, { useState } from 'react';
import { FaSearch, FaDownload } from 'react-icons/fa';
import type { Trade } from '../../types/trade';
import { TradeType } from '../../types/trade';

interface TradeHistoryProps {
    trades: Trade[];
    isLoading?: boolean;
}

export const TradeHistory: React.FC<TradeHistoryProps> = ({
    trades,
    isLoading = false,
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<'ALL' | 'BUY' | 'SELL'>('ALL');

    const formatCurrency = (value: number) => {
        return `$${value.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const formatDate = (timestamp: any) => {
        return new Date(timestamp.toDate()).toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const filteredTrades = trades.filter(trade => {
        const matchesSearch = trade.symbol.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterType === 'ALL' || trade.type === filterType;
        return matchesSearch && matchesFilter;
    });

    const exportToCSV = () => {
        const headers = ['Fecha', 'Tipo', 'Símbolo', 'Cantidad', 'Precio USD', 'Precio MXN', 'Total MXN', 'Comisión', 'Impuesto'];
        const rows = filteredTrades.map(trade => [
            formatDate(trade.timestamp),
            trade.type,
            trade.symbol,
            trade.quantity,
            trade.price,
            trade.priceInMXN,
            trade.totalCost,
            trade.fees.commission,
            trade.fees.tax,
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(',')),
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `trades_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
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

    return (
        <div className="bg-white rounded-xl shadow-md border border-border">
            {/* Filtros y búsqueda */}
            <div className="p-6 border-b border-border">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="flex-1 w-full md:w-auto">
                        <div className="relative">
                            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" />
                            <input
                                type="text"
                                placeholder="Buscar por símbolo..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                    </div>

                    <div className="flex gap-2 w-full md:w-auto">
                        <button
                            onClick={() => setFilterType('ALL')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer ${filterType === 'ALL'
                                ? 'bg-primary text-white'
                                : 'bg-bg-secondary text-text-secondary hover:bg-bg-secondary/80'
                                }`}
                        >
                            Todas
                        </button>
                        <button
                            onClick={() => setFilterType('BUY')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer ${filterType === 'BUY'
                                ? 'bg-success text-white'
                                : 'bg-bg-secondary text-text-secondary hover:bg-bg-secondary/80'
                                }`}
                        >
                            Compras
                        </button>
                        <button
                            onClick={() => setFilterType('SELL')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer ${filterType === 'SELL'
                                ? 'bg-danger text-white'
                                : 'bg-bg-secondary text-text-secondary hover:bg-bg-secondary/80'
                                }`}
                        >
                            Ventas
                        </button>
                        <button
                            onClick={exportToCSV}
                            className="px-4 py-2 rounded-lg font-medium bg-bg-secondary text-text-secondary hover:bg-bg-secondary/80 transition-colors cursor-pointer flex items-center gap-2"
                        >
                            <FaDownload />
                            Exportar
                        </button>
                    </div>
                </div>
            </div>

            {/* Tabla */}
            <div className="overflow-x-auto">
                {filteredTrades.length === 0 ? (
                    <div className="p-8 text-center text-text-secondary">
                        No se encontraron operaciones
                    </div>
                ) : (
                    <table className="min-w-full divide-y divide-border">
                        <thead className="bg-bg-secondary">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                                    Fecha
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                                    Tipo
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                                    Símbolo
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">
                                    Cantidad
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">
                                    Precio
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">
                                    Total
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">
                                    Comisión
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">
                                    Impuesto
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-border">
                            {filteredTrades.map((trade) => (
                                <tr key={trade.id} className="hover:bg-bg-primary transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                                        {formatDate(trade.timestamp)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${trade.type === TradeType.BUY
                                            ? 'bg-success/10 text-success'
                                            : 'bg-danger/10 text-danger'
                                            }`}>
                                            {trade.type === TradeType.BUY ? 'COMPRA' : 'VENTA'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-semibold text-text-primary">
                                            {trade.symbol}
                                        </div>
                                        {trade.companyName && (
                                            <div className="text-xs text-text-secondary">
                                                {trade.companyName}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-text-primary">
                                        {trade.quantity}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <div className="text-sm text-text-primary">
                                            ${trade.price.toFixed(2)} USD
                                        </div>
                                        <div className="text-xs text-text-secondary">
                                            {formatCurrency(trade.priceInMXN)} MXN
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-text-primary">
                                        {formatCurrency(trade.totalCost)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-text-secondary">
                                        {formatCurrency(trade.fees.commission)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-text-secondary">
                                        {formatCurrency(trade.fees.tax)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};
