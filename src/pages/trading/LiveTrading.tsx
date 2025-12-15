import React, { useState, useEffect } from 'react';
import { MainLayout } from '../../components/layout/MainLayout';
import { useAuth } from '../../contexts/AuthContext';
import { FaPlay, FaStop, FaExclamationTriangle, FaChartLine, FaDollarSign } from 'react-icons/fa';
import { SuccessModal } from '../../components/ui/SuccessModal';
import { AlertModal } from '../../components/ui/AlertModal';
import { ConfirmModal } from '../../components/ui/ConfirmModal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface Position {
    asset_id: string;
    symbol: string;
    qty: string;
    avg_entry_price: string;
    current_price: string;
    market_value: string;
    unrealized_pl: string;
    unrealized_plpc: string;
}

interface AccountData {
    equity: string;
    cash: string;
    buying_power: string;
    portfolio_value: string;
}

export const LiveTrading: React.FC = () => {
    const { currentUser, firebaseUser, loading: authLoading } = useAuth();
    const [positions, setPositions] = useState<Position[]>([]);
    const [account, setAccount] = useState<AccountData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [botActive, setBotActive] = useState(false);

    // Modales
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [modalMessage, setModalMessage] = useState({ title: '', message: '' });
    const [positionToClose, setPositionToClose] = useState<string | null>(null);
    const [isMarketOpen, setIsMarketOpen] = useState(false);
    const [nextExecutionTime, setNextExecutionTime] = useState<string>('');
    const [timeUntilNext, setTimeUntilNext] = useState<string>('');

    // Helper functions para mostrar modales
    const showSuccess = (message: string) => {
        setModalMessage({ title: 'Éxito', message });
        setShowSuccessModal(true);
    };

    const showError = (message: string) => {
        setModalMessage({ title: 'Error', message });
        setShowErrorModal(true);
    };

    // Verificar si el mercado está abierto (9:30 AM - 4:00 PM EST, Lunes-Viernes)
    const checkMarketHours = () => {
        const now = new Date();
        const estTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
        const day = estTime.getDay(); // 0 = Domingo, 6 = Sábado
        const hours = estTime.getHours();
        const minutes = estTime.getMinutes();
        const currentTime = hours * 60 + minutes;

        // Mercado abierto: Lunes-Viernes, 9:30 AM - 4:00 PM EST
        const isWeekday = day >= 1 && day <= 5;
        const marketOpen = 9 * 60 + 30; // 9:30 AM
        const marketClose = 16 * 60; // 4:00 PM
        const isDuringMarketHours = currentTime >= marketOpen && currentTime < marketClose;

        return isWeekday && isDuringMarketHours;
    };

    // Calcular próxima ejecución
    const getNextExecutionTime = () => {
        const now = new Date();
        const mexicoTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Mexico_City' }));
        const currentHour = mexicoTime.getHours();
        const currentMinute = mexicoTime.getMinutes();
        const currentTime = currentHour * 60 + currentMinute;

        // Horarios de ejecución en minutos desde medianoche (hora de México)
        const executionTimes = [
            { time: 8 * 60 + 30, label: '8:30 AM' },   // 8:30 AM
            { time: 9 * 60, label: '9:00 AM' },        // 9:00 AM
            { time: 10 * 60, label: '10:00 AM' },      // 10:00 AM
            { time: 11 * 60, label: '11:00 AM' },      // 11:00 AM
            { time: 12 * 60, label: '12:00 PM' },      // 12:00 PM
            { time: 13 * 60, label: '1:00 PM' },       // 1:00 PM
            { time: 14 * 60, label: '2:00 PM' },       // 2:00 PM
            { time: 15 * 60, label: '3:00 PM' },       // 3:00 PM
            { time: 16 * 60, label: '4:00 PM' }        // 4:00 PM
        ];

        // Encontrar próxima ejecución
        for (const exec of executionTimes) {
            if (currentTime < exec.time) {
                const minutesUntil = exec.time - currentTime;
                const hours = Math.floor(minutesUntil / 60);
                const minutes = minutesUntil % 60;
                const timeStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
                return { next: exec.label, until: timeStr };
            }
        }

        // Si ya pasaron todas las ejecuciones de hoy, mostrar primera de mañana
        return { next: 'Mañana 8:30 AM', until: 'Mercado cerrado' };
    };

    // Mostrar loading mientras se carga la autenticación
    if (authLoading) {
        return (
            <MainLayout>
                <div className="p-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-blue-800">
                            ⏳ Cargando...
                        </p>
                    </div>
                </div>
            </MainLayout>
        );
    }

    // Verificar autenticación
    if (!currentUser) {
        return (
            <MainLayout>
                <div className="p-6">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="text-yellow-800">
                            ⚠️ Debes iniciar sesión para acceder al trading en vivo
                        </p>
                    </div>
                </div>
            </MainLayout>
        );
    }

    // Cargar cuenta de Alpaca
    const loadAccount = async () => {
        try {
            const response = await fetch(`${API_URL}/api/trading/account`);
            if (response.ok) {
                const data = await response.json();
                setAccount(data);
            }
        } catch (error) {
            console.error('Error loading account:', error);
        }
    };

    // Cargar posiciones desde Alpaca
    const loadPositions = async () => {
        if (!firebaseUser) return;

        try {
            const response = await fetch(`${API_URL}/api/trading/positions?userId=${firebaseUser.uid}`);
            if (response.ok) {
                const data = await response.json();
                setPositions(data);
            }
        } catch (error) {
            console.error('Error loading positions:', error);
        }
    };

    // Verificar horario del mercado
    useEffect(() => {
        setIsMarketOpen(checkMarketHours());
        const interval = setInterval(() => {
            setIsMarketOpen(checkMarketHours());
        }, 60000); // Verificar cada minuto
        return () => clearInterval(interval);
    }, []);

    // Actualizar contador regresivo cada segundo
    useEffect(() => {
        const updateCountdown = () => {
            const { next, until } = getNextExecutionTime();
            setNextExecutionTime(next);
            setTimeUntilNext(until);
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 1000); // Actualizar cada segundo
        return () => clearInterval(interval);
    }, []);

    // Actualizar datos cada 10 segundos
    useEffect(() => {
        loadAccount();
        loadPositions();
        const interval = setInterval(() => {
            loadAccount();
            loadPositions();
        }, 10000);
        return () => clearInterval(interval);
    }, [firebaseUser]);

    // Verificar estado del bot al cargar
    useEffect(() => {
        const checkBotStatus = async () => {
            if (!firebaseUser) return;
            try {
                const response = await fetch(`${API_URL}/api/trading/status?userId=${firebaseUser.uid}`);
                if (response.ok) {
                    const data = await response.json();
                    setBotActive(data.botActive || false);
                }
            } catch (error) {
                console.error('Error checking bot status:', error);
            }
        };
        checkBotStatus();
    }, [firebaseUser]);

    const handleStartBot = async () => {
        console.log('=== DEBUGGING BOT START ===');
        console.log('1. currentUser:', currentUser);
        console.log('2. firebaseUser:', firebaseUser);
        console.log('3. firebaseUser?.uid:', firebaseUser?.uid);

        if (!currentUser || !firebaseUser) {
            showError('Usuario no autenticado. Por favor, recarga la página.');
            return;
        }

        if (!firebaseUser.uid) {
            console.error('firebaseUser exists but uid is missing:', firebaseUser);
            showError('UID de usuario no disponible');
            return;
        }

        console.log('4. Starting bot for user:', firebaseUser.uid);
        setIsLoading(true);

        try {
            const requestBody = {
                userId: firebaseUser.uid,
                capital: 10000,
                symbols: ['SPY', 'SLV', 'XLF', 'QQQ', 'IWM', 'HYG', 'NVDA', 'TQQQ', 'SOXL', 'AVGO', 'ONDS', 'WULF', 'INTC', 'TE', 'DNN', 'FEIM', 'BBAI', 'BMNR']
            };

            console.log('5. Request body:', JSON.stringify(requestBody, null, 2));

            const response = await fetch(`${API_URL}/api/trading/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            console.log('6. Response status:', response.status);
            console.log('7. Response ok:', response.ok);

            if (response.ok) {
                const result = await response.json();
                console.log('8. Bot started successfully:', result);
                setBotActive(true);
                loadPositions();
                showSuccess('Bot activado - Buscará oportunidades automáticamente');
            } else {
                const error = await response.text();
                console.error('9. Error response:', error);
                showError('Error al iniciar el bot: ' + error);
            }
        } catch (error) {
            console.error('10. Exception:', error);
            showError('Error al iniciar el bot: ' + (error as Error).message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleStopBot = async () => {
        if (!firebaseUser) return;
        setIsLoading(true);

        try {
            const response = await fetch(`${API_URL}/api/trading/stop`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: firebaseUser.uid })
            });

            if (response.ok) {
                setBotActive(false);
                showSuccess('Bot pausado - Las posiciones actuales se mantienen, pero no se harán nuevas compras/ventas');
            }
        } catch (error) {
            console.error('Error stopping bot:', error);
            showError('Error al detener el bot');
        } finally {
            setIsLoading(false);
        }
    };

    const handleEmergencyStop = async () => {
        if (!confirm('⚠️ ¿Cerrar TODAS las posiciones inmediatamente?')) return;

        if (!firebaseUser) return;
        setIsLoading(true);

        try {
            const response = await fetch(`${API_URL}/api/trading/emergency-stop`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: firebaseUser.uid })
            });

            if (response.ok) {
                showSuccess('Parada de emergencia ejecutada - Todas las posiciones cerradas');
                setBotActive(false);
                loadPositions();
            }
        } catch (error) {
            console.error('Error in emergency stop:', error);
            showError('Error en parada de emergencia');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClosePosition = async (symbol: string) => {
        setPositionToClose(symbol);
        setShowConfirmModal(true);
    };

    const confirmClosePosition = async () => {
        if (!positionToClose || !firebaseUser) return;

        setShowConfirmModal(false);
        setIsLoading(true);

        try {
            const response = await fetch(`${API_URL}/api/trading/close-position/${positionToClose}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: firebaseUser.uid })
            });

            if (response.ok) {
                showSuccess(`Posición de ${positionToClose} cerrada`);
                loadPositions();
            }
        } catch (error) {
            console.error('Error closing position:', error);
            showError('Error al cerrar posición');
        } finally {
            setIsLoading(false);
            setPositionToClose(null);
        }
    };

    // Calcular métricas con datos reales
    const initialCapital = 100000; // Capital inicial
    const currentValue = account ? parseFloat(account.equity) : initialCapital;
    const totalPnL = currentValue - initialCapital;
    const roi = ((currentValue - initialCapital) / initialCapital) * 100;
    const cash = account ? parseFloat(account.cash) : 0;

    return (
        <MainLayout>
            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-text-primary">Trading en Vivo</h1>
                        <p className="text-text-secondary mt-1">
                            Bot automático con estrategia Value Investing
                        </p>
                    </div>

                    <div className="flex gap-3">
                        {/* Solo administradores pueden controlar el bot */}
                        {currentUser?.role === 'admin' && (
                            <>
                                {!botActive ? (
                                    <button
                                        onClick={handleStartBot}
                                        disabled={isLoading || !isMarketOpen}
                                        className={`px-6 py-3 rounded-lg font-semibold flex items-center gap-2 ${isLoading || !isMarketOpen
                                            ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                                            : 'bg-green-600 text-white hover:bg-green-700'
                                            }`}
                                    >
                                        <FaPlay /> Iniciar Bot
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleStopBot}
                                        disabled={isLoading || !isMarketOpen}
                                        className={`px-6 py-3 rounded-lg font-semibold flex items-center gap-2 ${isLoading || !isMarketOpen
                                            ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                                            : 'bg-gray-600 text-white hover:bg-gray-700'
                                            }`}
                                    >
                                        <FaStop /> Pausar Bot
                                    </button>
                                )}

                                <button
                                    onClick={handleEmergencyStop}
                                    disabled={isLoading || !isMarketOpen}
                                    className={`px-6 py-3 rounded-lg font-semibold flex items-center gap-2 ${isLoading || !isMarketOpen
                                        ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                                        : 'bg-red-600 text-white hover:bg-red-700'
                                        }`}
                                >
                                    <FaExclamationTriangle /> Parada de Emergencia
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Market Status Info */}
                <div className={`${isMarketOpen ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'} border rounded-lg p-4`}>
                    <p className={`${isMarketOpen ? 'text-green-800' : 'text-yellow-800'} font-semibold mb-2`}>
                        {isMarketOpen ? '✅ Mercado Abierto' : '⚠️ Mercado Cerrado'}
                    </p>
                    <p className={`text-sm ${isMarketOpen ? 'text-green-700' : 'text-yellow-700'}`}>
                        {isMarketOpen
                            ? 'El mercado de valores opera de Lunes a Viernes, 9:30 AM - 4:00 PM EST (8:30 AM - 3:00 PM hora de México).'
                            : 'El mercado de valores opera de Lunes a Viernes, 9:30 AM - 4:00 PM EST (8:30 AM - 3:00 PM hora de México). Las operaciones de compra/venta solo están disponibles durante el horario de mercado.'
                        }
                    </p>
                    {isMarketOpen && botActive && (
                        <div className="mt-3 pt-3 border-t border-green-200">
                            <p className="text-sm text-green-800">
                                <strong>Próximo análisis:</strong> {nextExecutionTime}
                            </p>
                            <p className="text-sm text-green-700 mt-1">
                                <strong>Tiempo restante:</strong> {timeUntilNext}
                            </p>
                        </div>
                    )}
                </div>

                {/* Métricas Principales */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white rounded-xl shadow-md border border-border p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <FaChartLine className="text-primary text-2xl" />
                            <h3 className="text-sm font-semibold text-text-secondary">ROI</h3>
                        </div>
                        <p className={`text-3xl font-bold ${roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {roi >= 0 ? '+' : ''}{roi.toFixed(2)}%
                        </p>
                        <p className="text-sm text-text-secondary mt-1">
                            Desde $100,000
                        </p>
                    </div>

                    <div className="bg-white rounded-xl shadow-md border border-border p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <FaDollarSign className="text-green-600 text-2xl" />
                            <h3 className="text-sm font-semibold text-text-secondary">Valor de Cuenta</h3>
                        </div>
                        <p className="text-3xl font-bold text-text-primary">
                            ${currentValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <p className="text-sm text-text-secondary mt-1">
                            Efectivo: ${cash.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                    </div>

                    <div className="bg-white rounded-xl shadow-md border border-border p-6">
                        <h3 className="text-sm font-semibold text-text-secondary mb-2">Posiciones</h3>
                        <p className="text-3xl font-bold text-text-primary">
                            {positions.length}
                        </p>
                        <p className="text-sm text-text-secondary mt-1">
                            Activas
                        </p>
                    </div>

                    <div className="bg-white rounded-xl shadow-md border border-border p-6">
                        <h3 className="text-sm font-semibold text-text-secondary mb-2">P&L Total</h3>
                        <p className={`text-3xl font-bold ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {totalPnL >= 0 ? '+' : ''}${totalPnL.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <p className="text-sm text-text-secondary mt-1">
                            {totalPnL >= 0 ? 'Ganancia' : 'Pérdida'}
                        </p>
                    </div>
                </div>

                {/* Posiciones Activas */}
                <div className="bg-white rounded-xl shadow-md border border-border p-6">
                    <h2 className="text-2xl font-bold text-text-primary mb-4">
                        Posiciones Activas ({positions.length})
                    </h2>

                    {positions.length === 0 ? (
                        <p className="text-text-secondary text-center py-8">
                            No hay posiciones abiertas
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-200">
                                        <th className="text-left py-3 px-4 font-semibold text-text-primary">Activo</th>
                                        <th className="text-right py-3 px-4 font-semibold text-text-primary">Cantidad</th>
                                        <th className="text-right py-3 px-4 font-semibold text-text-primary">Precio</th>
                                        <th className="text-right py-3 px-4 font-semibold text-text-primary">Valor de Mercado</th>
                                        <th className="text-right py-3 px-4 font-semibold text-text-primary">P&L Total</th>
                                        <th className="text-center py-3 px-4 font-semibold text-text-primary">Acción</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {positions.map((position) => {
                                        const qty = parseFloat(position.qty);
                                        const price = parseFloat(position.current_price);
                                        const marketValue = parseFloat(position.market_value);
                                        const pnl = parseFloat(position.unrealized_pl);

                                        return (
                                            <tr key={position.symbol} className="border-b border-gray-100 hover:bg-gray-50">
                                                <td className="py-3 px-4 font-semibold">{position.symbol}</td>
                                                <td className="py-3 px-4 text-right">{qty.toFixed(0)}</td>
                                                <td className="py-3 px-4 text-right">${price.toFixed(2)}</td>
                                                <td className="py-3 px-4 text-right">${marketValue.toFixed(2)}</td>
                                                <td className={`py-3 px-4 text-right font-semibold ${pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                    {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
                                                </td>
                                                <td className="text-center py-3 px-4">
                                                    <button
                                                        onClick={() => handleClosePosition(position.symbol)}
                                                        disabled={!isMarketOpen}
                                                        className={`px-3 py-1 text-sm rounded ${!isMarketOpen
                                                            ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                                                            : 'bg-red-600 text-white hover:bg-red-700'
                                                            }`}
                                                    >
                                                        Cerrar
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Modales */}
            <SuccessModal
                isOpen={showSuccessModal}
                onClose={() => setShowSuccessModal(false)}
                title={modalMessage.title}
                message={modalMessage.message}
            />

            <AlertModal
                isOpen={showErrorModal}
                onClose={() => setShowErrorModal(false)}
                title={modalMessage.title}
                message={modalMessage.message}
                type="error"
            />

            <ConfirmModal
                isOpen={showConfirmModal}
                onClose={() => setShowConfirmModal(false)}
                onConfirm={confirmClosePosition}
                title="Confirmar cierre de posición"
                message={`¿Estás seguro de que deseas cerrar la posición de ${positionToClose}? Esta acción venderá todas las acciones al precio de mercado actual.`}
                confirmText="Cerrar posición"
                cancelText="Cancelar"
            />
        </MainLayout>
    );
};
