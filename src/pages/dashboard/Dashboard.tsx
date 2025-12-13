import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../../components/layout/MainLayout';
import { useAuth } from '../../contexts/AuthContext';
import { FaChartLine, FaDollarSign, FaWallet, FaRocket } from 'react-icons/fa';
import { backendDataService, type AccountData, type BackendPosition } from '../../services/backendDataService';

export const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [account, setAccount] = useState<AccountData | null>(null);
    const [positions, setPositions] = useState<BackendPosition[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
        // Auto-refresh cada 30 segundos - SIEMPRE datos frescos del backend
        const interval = setInterval(loadDashboardData, 30000);
        return () => clearInterval(interval);
    }, []);

    const loadDashboardData = async () => {
        try {
            // Obtener datos en tiempo real del backend (NO Firebase, NO caché)
            const [accountData, positionsData] = await Promise.all([
                backendDataService.getAccount(),
                backendDataService.getPositions(currentUser?.uid)
            ]);

            setAccount(accountData);
            setPositions(positionsData);
        } catch (error) {
            console.error('Error loading dashboard:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const initialCapital = 100000;
    const currentValue = account ? parseFloat(account.equity) : initialCapital;
    const totalPnL = currentValue - initialCapital;
    const roi = ((currentValue - initialCapital) / initialCapital) * 100;
    const cash = account ? parseFloat(account.cash) : 0;

    if (isLoading) {
        return (
            <MainLayout>
                <div className="flex items-center justify-center h-96">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-text-primary">Dashboard de Trading</h1>
                        <p className="text-text-secondary mt-2">
                            Resumen de tu cuenta de Alpaca Paper Trading
                        </p>
                    </div>
                    <button
                        onClick={() => navigate('/trading')}
                        className="px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors flex items-center gap-2"
                    >
                        <FaChartLine />
                        Ir a Trading
                    </button>
                </div>

                {/* Métricas principales */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* ROI */}
                    <div className="bg-white rounded-xl shadow-md border border-border p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-3 bg-primary/10 rounded-lg">
                                <FaChartLine className="text-2xl text-primary" />
                            </div>
                            <h3 className="text-sm font-medium text-text-secondary">ROI</h3>
                        </div>
                        <p className={`text-3xl font-bold ${roi >= 0 ? 'text-success' : 'text-danger'}`}>
                            {roi >= 0 ? '+' : ''}{roi.toFixed(2)}%
                        </p>
                        <p className="text-sm text-text-secondary mt-1">
                            Desde $100,000 inicial
                        </p>
                    </div>

                    {/* Valor de Cuenta */}
                    <div className="bg-white rounded-xl shadow-md border border-border p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-3 bg-success/10 rounded-lg">
                                <FaDollarSign className="text-2xl text-success" />
                            </div>
                            <h3 className="text-sm font-medium text-text-secondary">Valor de Cuenta</h3>
                        </div>
                        <p className="text-3xl font-bold text-text-primary">
                            ${currentValue.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <p className={`text-sm mt-1 ${totalPnL >= 0 ? 'text-success' : 'text-danger'}`}>
                            {totalPnL >= 0 ? '+' : ''}${Math.abs(totalPnL).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                    </div>

                    {/* Efectivo */}
                    <div className="bg-white rounded-xl shadow-md border border-border p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-3 bg-info/10 rounded-lg">
                                <FaWallet className="text-2xl text-info" />
                            </div>
                            <h3 className="text-sm font-medium text-text-secondary">Efectivo</h3>
                        </div>
                        <p className="text-3xl font-bold text-text-primary">
                            ${cash.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <p className="text-sm text-text-secondary mt-1">
                            Disponible
                        </p>
                    </div>

                    {/* Posiciones */}
                    <div className="bg-white rounded-xl shadow-md border border-border p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-3 bg-warning/10 rounded-lg">
                                <FaRocket className="text-2xl text-warning" />
                            </div>
                            <h3 className="text-sm font-medium text-text-secondary">Posiciones Activas</h3>
                        </div>
                        <p className="text-3xl font-bold text-text-primary">
                            {positions.length}
                        </p>
                        <p className="text-sm text-text-secondary mt-1">
                            En el mercado
                        </p>
                    </div>
                </div>

                {/* Posiciones Activas */}
                {positions.length > 0 && (
                    <div className="bg-white rounded-xl shadow-md border border-border overflow-hidden">
                        <div className="p-6 border-b border-border">
                            <h2 className="text-xl font-semibold text-text-primary">Posiciones Activas</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-bg-primary">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                                            Símbolo
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                                            Cantidad
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                                            P&L
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {positions.slice(0, 5).map((position) => {
                                        const pnl = parseFloat(position.unrealized_pl);
                                        return (
                                            <tr key={position.symbol} className="hover:bg-bg-primary transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="font-semibold text-text-primary">{position.symbol}</span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-text-secondary">
                                                    {parseFloat(position.qty).toFixed(0)} acciones
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`font-semibold ${pnl >= 0 ? 'text-success' : 'text-danger'}`}>
                                                        {pnl >= 0 ? '+' : ''}${Math.abs(pnl).toFixed(2)}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        {positions.length > 5 && (
                            <div className="p-4 bg-bg-primary border-t border-border text-center">
                                <button
                                    onClick={() => navigate('/trading')}
                                    className="text-primary hover:text-primary/80 font-semibold text-sm"
                                >
                                    Ver todas las posiciones ({positions.length})
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                        💡 <strong>Tip:</strong> Los datos se actualizan automáticamente cada 30 segundos.
                        El mercado opera de 9:30 AM a 4:00 PM EST (8:30 AM - 3:00 PM hora de México).
                    </p>
                </div>
            </div>
        </MainLayout>
    );
};
