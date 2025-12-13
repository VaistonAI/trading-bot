import React, { useEffect, useRef } from 'react';

interface StrategyChartProps {
    symbol: string;
    interval?: 'D' | 'W' | '1' | '5' | '15' | '30' | '60';
    theme?: 'light' | 'dark';
    height?: number;
    showToolbar?: boolean;
    studies?: string[];
}

export const StrategyChart: React.FC<StrategyChartProps> = ({
    symbol,
    interval = 'D',
    theme = 'light',
    height = 500,
    showToolbar = true,
    studies = [],
}) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        // Limpiar contenedor
        containerRef.current.innerHTML = '';

        // Crear script de TradingView
        const script = document.createElement('script');
        script.src = 'https://s3.tradingview.com/tv.js';
        script.async = true;
        script.onload = () => {
            if (typeof (window as any).TradingView !== 'undefined') {
                new (window as any).TradingView.widget({
                    autosize: false,
                    symbol: symbol,
                    interval: interval,
                    timezone: 'America/Mexico_City',
                    theme: theme,
                    style: '1',
                    locale: 'es',
                    toolbar_bg: '#f1f3f6',
                    enable_publishing: false,
                    hide_side_toolbar: !showToolbar,
                    allow_symbol_change: true,
                    container_id: containerRef.current?.id,
                    height: height,
                    width: '100%',
                    studies: studies,
                    show_popup_button: true,
                    popup_width: '1000',
                    popup_height: '650',
                });
            }
        };

        document.head.appendChild(script);

        return () => {
            if (script.parentNode) {
                script.parentNode.removeChild(script);
            }
        };
    }, [symbol, interval, theme, height, showToolbar, studies]);

    return (
        <div className="w-full bg-white rounded-xl shadow-md overflow-hidden border border-border">
            <div
                ref={containerRef}
                id={`tradingview_${symbol}_${Date.now()}`}
                className="tradingview-widget-container"
                style={{ height: `${height}px` }}
            />
        </div>
    );
};
