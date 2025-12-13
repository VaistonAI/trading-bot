import { Timestamp } from 'firebase/firestore';
import { TradeType } from './trade';

export const NotificationType = {
    BUY: 'BUY',
    SELL: 'SELL',
    STATUS: 'STATUS',
    ALERT: 'ALERT',
    ERROR: 'ERROR',
} as const;

export type NotificationType = typeof NotificationType[keyof typeof NotificationType];


export interface Notification {
    id: string;
    strategyId: string;
    strategyName: string;
    type: NotificationType;
    title: string;
    message: string;
    timestamp: Timestamp;
    sentToTelegram: boolean;
    telegramMessageId?: number; // ID del mensaje en Telegram (opcional)
    metadata?: {
        symbol?: string;
        tradeType?: TradeType;
        quantity?: number;
        price?: number;
        totalValue?: number;
    };
    createdAt: Timestamp;
}

export interface NotificationFormData {
    strategyId: string;
    strategyName: string;
    type: NotificationType;
    title: string;
    message: string;
    metadata?: Notification['metadata'];
}

