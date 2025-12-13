import React from 'react';

interface TradingCardProps {
    title: string;
    value: string | number;
    change?: number;
    changePercent?: number;
    icon?: React.ReactNode;
    trend?: 'up' | 'down' | 'neutral';
    subtitle?: string;
    className?: string;
}

export const TradingCard: React.FC<TradingCardProps> = ({
    title,
    value,
    change,
    changePercent,
    icon,
    trend,
    subtitle,
    className = '',
}) => {
    const getTrendColor = () => {
        if (trend === 'up' || (change && change > 0)) return 'text-success';
        if (trend === 'down' || (change && change < 0)) return 'text-danger';
        return 'text-text-secondary';
    };

    const getTrendBg = () => {
        if (trend === 'up' || (change && change > 0)) return 'bg-success/10';
        if (trend === 'down' || (change && change < 0)) return 'bg-danger/10';
        return 'bg-bg-secondary';
    };

    const formatChange = () => {
        if (change === undefined) return null;
        const sign = change >= 0 ? '+' : '';
        return `${sign}${change.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const formatChangePercent = () => {
        if (changePercent === undefined) return null;
        const sign = changePercent >= 0 ? '+' : '';
        return `${sign}${changePercent.toFixed(2)}%`;
    };

    return (
        <div className={`bg-white rounded-xl shadow-md p-6 border border-border hover:shadow-lg transition-all duration-300 ${className}`}>
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    <p className="text-sm text-text-secondary font-medium mb-1">{title}</p>
                    <h3 className="text-3xl font-bold text-text-primary">{value}</h3>
                    {subtitle && (
                        <p className="text-xs text-text-secondary mt-1">{subtitle}</p>
                    )}
                </div>
                {icon && (
                    <div className={`p-3 rounded-lg ${getTrendBg()}`}>
                        <div className={`text-2xl ${getTrendColor()}`}>{icon}</div>
                    </div>
                )}
            </div>

            {(change !== undefined || changePercent !== undefined) && (
                <div className={`flex items-center gap-2 text-sm font-semibold ${getTrendColor()}`}>
                    {change !== undefined && (
                        <span>{formatChange()}</span>
                    )}
                    {changePercent !== undefined && (
                        <span className="px-2 py-1 rounded-md bg-current/10">
                            {formatChangePercent()}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
};
