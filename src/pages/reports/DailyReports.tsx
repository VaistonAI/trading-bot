import React, { useState, useEffect } from 'react';
import { MainLayout } from '../../components/layout/MainLayout';
import { FaChartLine, FaSearch, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';

interface DailyReport {
    id: string;
    date: string;
    tradesExecuted: number;
    totalPnL: number;
    positionsOpened: number;
    positionsClosed: number;
    roi: number;
    capitalStart: number;
    capitalEnd: number;
}

type SortField = 'date' | 'tradesExecuted' | 'totalPnL' | 'roi';
type SortDirection = 'asc' | 'desc';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const DailyReports: React.FC = () => {
    const [reports, setReports] = useState<DailyReport[]>([]);
    const [filteredReports, setFilteredReports] = useState<DailyReport[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortField, setSortField] = useState<SortField>('date');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const reportsPerPage = 10;

    // Cargar reportes
    useEffect(() => {
        loadReports();
    }, []);

    const loadReports = async () => {
        try {
            setIsLoading(true);
            const response = await fetch(`${API_URL}/api/reports/daily`);
            if (response.ok) {
                const data = await response.json();
                setReports(data);
                setFilteredReports(data);
            }
        } catch (error) {
            console.error('Error loading reports:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Filtrar por búsqueda
    useEffect(() => {
        const filtered = reports.filter(report =>
            report.date.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredReports(filtered);
        setCurrentPage(1);
    }, [searchTerm, reports]);

    // Ordenar
    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc');
        }
    };

    const sortedReports = [...filteredReports].sort((a, b) => {
        const aValue = a[sortField];
        const bValue = b[sortField];
        const multiplier = sortDirection === 'asc' ? 1 : -1;

        if (typeof aValue === 'string') {
            return aValue.localeCompare(bValue as string) * multiplier;
        }
        return ((aValue as number) - (bValue as number)) * multiplier;
    });

    // Paginación
    const indexOfLastReport = currentPage * reportsPerPage;
    const indexOfFirstReport = indexOfLastReport - reportsPerPage;
    const currentReports = sortedReports.slice(indexOfFirstReport, indexOfLastReport);
    const totalPages = Math.ceil(sortedReports.length / reportsPerPage);

    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field) return <FaSort className="text-gray-400" />;
        return sortDirection === 'asc' ? <FaSortUp className="text-primary" /> : <FaSortDown className="text-primary" />;
    };

    return (
        <MainLayout>
            <div className="p-6">
                {/* Header */}
                <div className="mb-6">
                    <h2 className="text-3xl font-bold text-text-primary mb-2 flex items-center gap-3">
                        <FaChartLine className="text-primary" />
                        Reportes Diarios
                    </h2>
                    <p className="text-text-secondary">
                        Historial de análisis y operaciones ejecutadas por el bot de trading
                    </p>
                </div>

                {/* Search Bar */}
                <div className="mb-6">
                    <div className="relative">
                        <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar por fecha (YYYY-MM-DD)..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-lg shadow-sm border border-border overflow-hidden">
                    {isLoading ? (
                        <div className="p-8 text-center text-text-secondary">
                            Cargando reportes...
                        </div>
                    ) : currentReports.length === 0 ? (
                        <div className="p-8 text-center text-text-secondary">
                            No se encontraron reportes
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-background">
                                        <tr>
                                            <th
                                                onClick={() => handleSort('date')}
                                                className="text-left py-4 px-6 font-semibold text-text-primary cursor-pointer hover:bg-gray-100 transition-colors"
                                            >
                                                <div className="flex items-center gap-2">
                                                    Fecha
                                                    <SortIcon field="date" />
                                                </div>
                                            </th>
                                            <th
                                                onClick={() => handleSort('tradesExecuted')}
                                                className="text-right py-4 px-6 font-semibold text-text-primary cursor-pointer hover:bg-gray-100 transition-colors"
                                            >
                                                <div className="flex items-center justify-end gap-2">
                                                    Operaciones
                                                    <SortIcon field="tradesExecuted" />
                                                </div>
                                            </th>
                                            <th
                                                onClick={() => handleSort('totalPnL')}
                                                className="text-right py-4 px-6 font-semibold text-text-primary cursor-pointer hover:bg-gray-100 transition-colors"
                                            >
                                                <div className="flex items-center justify-end gap-2">
                                                    P&L Total
                                                    <SortIcon field="totalPnL" />
                                                </div>
                                            </th>
                                            <th className="text-right py-4 px-6 font-semibold text-text-primary">
                                                Posiciones Abiertas
                                            </th>
                                            <th className="text-right py-4 px-6 font-semibold text-text-primary">
                                                Posiciones Cerradas
                                            </th>
                                            <th
                                                onClick={() => handleSort('roi')}
                                                className="text-right py-4 px-6 font-semibold text-text-primary cursor-pointer hover:bg-gray-100 transition-colors"
                                            >
                                                <div className="flex items-center justify-end gap-2">
                                                    ROI
                                                    <SortIcon field="roi" />
                                                </div>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentReports.map((report) => (
                                            <tr key={report.id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                                                <td className="py-4 px-6 font-medium text-text-primary">
                                                    {new Date(report.date).toLocaleDateString('es-MX', {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric'
                                                    })}
                                                </td>
                                                <td className="py-4 px-6 text-right text-text-secondary">
                                                    {report.tradesExecuted}
                                                </td>
                                                <td className={`py-4 px-6 text-right font-semibold ${report.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                    {report.totalPnL >= 0 ? '+' : ''}${report.totalPnL.toFixed(2)}
                                                </td>
                                                <td className="py-4 px-6 text-right text-text-secondary">
                                                    {report.positionsOpened}
                                                </td>
                                                <td className="py-4 px-6 text-right text-text-secondary">
                                                    {report.positionsClosed}
                                                </td>
                                                <td className={`py-4 px-6 text-right font-semibold ${report.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                    {report.roi >= 0 ? '+' : ''}{report.roi.toFixed(2)}%
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
                                    <p className="text-sm text-text-secondary">
                                        Mostrando {indexOfFirstReport + 1} a {Math.min(indexOfLastReport, sortedReports.length)} de {sortedReports.length} reportes
                                    </p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                            disabled={currentPage === 1}
                                            className="px-4 py-2 border border-border rounded-lg hover:bg-background disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            Anterior
                                        </button>
                                        <div className="flex items-center gap-1">
                                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                                <button
                                                    key={page}
                                                    onClick={() => setCurrentPage(page)}
                                                    className={`px-4 py-2 rounded-lg transition-colors ${currentPage === page
                                                        ? 'bg-primary text-white'
                                                        : 'border border-border hover:bg-background'
                                                        }`}
                                                >
                                                    {page}
                                                </button>
                                            ))}
                                        </div>
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                            disabled={currentPage === totalPages}
                                            className="px-4 py-2 border border-border rounded-lg hover:bg-background disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            Siguiente
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </MainLayout>
    );
};
