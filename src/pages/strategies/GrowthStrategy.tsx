import React, { useState, useEffect } from 'react';
import { MainLayout } from '../../components/layout/MainLayout';
import { TradingCard } from '../../components/ui/TradingCard';
import { StrategyChart } from '../../components/strategies/StrategyChart';
import { PositionsTable } from '../../components/strategies/PositionsTable';
import { TradeHistory } from '../../components/strategies/TradeHistory';
import { ReportTab } from '../../components/strategies/ReportTab';

import { FaChartLine, FaDollarSign, FaRocket } from 'react-icons/fa';
import { strategyService } from '../../services/strategyService';
import { tradeService } from '../../services/tradeService';
import { positionService } from '../../services/positionService';

import { StrategyType } from '../../types/strategy';
import type { Strategy } from '../../types/strategy';
import type { Trade } from '../../types/trade';
import type { Position } from '../../types/position';
import { Timestamp } from 'firebase/firestore';

export const GrowthStrategy: React.FC = () => {
    const [strategy, setStrategy] = useState<Strategy | null>(null);
    const [positions, setPositions] = useState<Position[]>([]);
    const [trades, setTrades] = useState<Trade[]>([]);
    const [activeTab, setActiveTab] = useState<'overview' | 'positions' | 'history' | 'reports'>('overview');
    const [isLoading, setIsLoading] = useState(true);

    const STRATEGY_ID = 'growth-investing';

    useEffect(() => {
        loadStrategy();
    }, []);

    const loadStrategy = async () => {
        setIsLoading(true);
        try {
            let existingStrategy = await strategyService.getById(STRATEGY_ID);

            if (!existingStrategy) {
                const newStrategyData: Omit<Strategy, 'id'> = {
                    name: 'Growth Investing',
                    type: StrategyType.GROWTH,
                    description: 'Inversión en crecimiento. Identifica empresas con alto potencial de expansión usando EPS Growth, Revenue Growth y proyecciones futuras.',
                    isActive: true,
                    telegramNotificationsEnabled: false,
                    liveAlertsEnabled: false,
                    virtualCapital: 10000,
                    lastUpdate: Timestamp.now(),
                    performance: {
                        totalReturn: 0,
                        totalInvested: 0,
                        currentValue: 0,
                        realizedGains: 0,
                        unrealizedGains: 0,
                        totalTrades: 0,
                        winRate: 0,
                    },
                    createdAt: Timestamp.now(),
                    updatedAt: Timestamp.now(),
                };

                await strategyService.create(newStrategyData, STRATEGY_ID);
                existingStrategy = await strategyService.getById(STRATEGY_ID);
            }

            setStrategy(existingStrategy);

            if (existingStrategy) {
                const [positionsData, tradesData] = await Promise.all([
                    positionService.getByStrategy(existingStrategy.id),
                    tradeService.getByStrategy(existingStrategy.id),
                ]);
                setPositions(positionsData);
                setTrades(tradesData);
            }
        } catch (error) {
            console.error('Error loading strategy:', error);
        } finally {
            setIsLoading(false);
        }
    };



    const tabs = [
        { id: 'overview', label: 'Vista General' },
        { id: 'positions', label: 'Posiciones' },
        { id: 'history', label: 'Histórico' },
        { id: 'reports', label: 'Reportes' },
    ];

    if (isLoading || !strategy) {
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
                <div>
                    <h1 className="text-3xl font-bold text-text-primary">Growth Investing</h1>
                    <p className="text-text-secondary mt-2">{strategy.description}</p>
                    <div className="mt-2 flex items-center gap-4 text-sm">
                        <span className="text-text-secondary">Capital Virtual:</span>
                        <span className="font-bold text-primary">${(strategy?.virtualCapital || 10000).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <TradingCard
                        title="ROI Total"
                        value={`${strategy.performance.totalReturn > 0 ? '+' : ''}${strategy.performance.totalReturn.toFixed(2)}%`}
                        icon={<FaChartLine />}
                        trend={strategy.performance.totalReturn > 0 ? 'up' : strategy.performance.totalReturn < 0 ? 'down' : 'neutral'}
                    />
                    <TradingCard
                        title="Capital Invertido"
                        value={`$${strategy.performance.totalInvested.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}
                        icon={<FaDollarSign />}
                        subtitle="MXN"
                    />
                    <TradingCard
                        title="Valor Actual"
                        value={`$${strategy.performance.currentValue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}
                        icon={<FaRocket />}
                        change={strategy.performance.unrealizedGains}
                        subtitle="MXN"
                    />
                    <TradingCard
                        title="Tasa de Éxito"
                        value={`${strategy.performance.winRate.toFixed(1)}%`}
                        subtitle={`${strategy.performance.totalTrades} operaciones`}
                        trend={strategy.performance.winRate >= 50 ? 'up' : 'down'}
                    />
                </div>





                <div className="bg-white rounded-xl shadow-md border border-border overflow-hidden">
                    <div className="border-b border-border">
                        <div className="flex">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex-1 px-6 py-4 font-semibold transition-colors cursor-pointer ${activeTab === tab.id
                                        ? 'bg-primary text-white'
                                        : 'text-text-secondary hover:bg-bg-primary'
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="p-6">
                        {activeTab === 'overview' && (
                            <div className="space-y-6">
                                <StrategyChart symbol="NVDA" interval="D" height={500} />
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div>
                                        <h3 className="text-lg font-semibold text-text-primary mb-4">Métricas de Crecimiento</h3>
                                        <div className="space-y-3">
                                            <div className="p-4 bg-bg-primary rounded-lg">
                                                <p className="text-sm text-text-secondary">EPS Growth</p>
                                                <p className="text-xl font-bold text-text-primary">&gt; 20% anual</p>
                                            </div>
                                            <div className="p-4 bg-bg-primary rounded-lg">
                                                <p className="text-sm text-text-secondary">Revenue Growth</p>
                                                <p className="text-xl font-bold text-text-primary">&gt; 15% anual</p>
                                            </div>
                                            <div className="p-4 bg-bg-primary rounded-lg">
                                                <p className="text-sm text-text-secondary">PEG Ratio</p>
                                                <p className="text-xl font-bold text-text-primary">&lt; 2.0</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-text-primary mb-4">Criterios de Selección</h3>
                                        <div className="space-y-3">
                                            <div className="p-4 bg-success/10 rounded-lg border border-success/20">
                                                <p className="text-sm font-semibold text-success mb-2">✓ Compra</p>
                                                <ul className="text-xs text-text-secondary space-y-1">
                                                    <li>• EPS Growth &gt; 20%</li>
                                                    <li>• Revenue Growth &gt; 15%</li>
                                                    <li>• Sector en expansión</li>
                                                    <li>• Ventaja competitiva clara</li>
                                                </ul>
                                            </div>
                                            <div className="p-4 bg-info/10 rounded-lg border border-info/20">
                                                <p className="text-sm font-semibold text-info mb-2">ℹ Sectores Objetivo</p>
                                                <p className="text-xs text-text-secondary">Tecnología, Healthcare, E-commerce, FinTech</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'positions' && <PositionsTable positions={positions} />}
                        {activeTab === 'history' && <TradeHistory trades={trades} />}
                        {activeTab === 'reports' && <ReportTab performance={strategy.performance} />}
                    </div>
                </div>
            </div>


        </MainLayout>
    );
};
