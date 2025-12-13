import {
    collection,
    doc,
    getDocs,
    addDoc,
    updateDoc,
    query,
    where,
    orderBy,
    Timestamp,
    limit,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Notification, NotificationFormData } from '../types/notification';
import { telegramService } from './telegramService';

const COLLECTION_NAME = 'notifications';

export const notificationService = {
    /**
     * Crea una nueva notificación
     */
    async create(formData: NotificationFormData, sendToTelegram: boolean = false): Promise<string> {
        try {
            const notification: Omit<Notification, 'id'> = {
                ...formData,
                timestamp: Timestamp.now(),
                sentToTelegram: false,
                createdAt: Timestamp.now(),
            };

            const docRef = await addDoc(collection(db, COLLECTION_NAME), notification);

            // Enviar a Telegram si está habilitado
            if (sendToTelegram) {
                try {
                    const messageId = await telegramService.sendMessage(
                        `${formData.title}\n\n${formData.message}`
                    );

                    if (messageId) {
                        await this.markAsSent(docRef.id, messageId);
                    }
                } catch (error) {
                    console.error('Error sending to Telegram:', error);
                }
            }

            return docRef.id;
        } catch (error) {
            console.error('Error creating notification:', error);
            throw new Error('Error al crear notificación');
        }
    },

    /**
     * Obtiene todas las notificaciones de una estrategia
     */
    async getByStrategy(strategyId: string, limitCount?: number): Promise<Notification[]> {
        try {
            let q = query(
                collection(db, COLLECTION_NAME),
                where('strategyId', '==', strategyId),
                orderBy('timestamp', 'desc')
            );

            if (limitCount) {
                q = query(q, limit(limitCount));
            }

            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
        } catch (error) {
            console.error('Error getting notifications:', error);
            throw new Error('Error al obtener notificaciones');
        }
    },

    /**
     * Obtiene las últimas notificaciones globales
     */
    async getRecent(limitCount: number = 20): Promise<Notification[]> {
        try {
            const q = query(
                collection(db, COLLECTION_NAME),
                orderBy('timestamp', 'desc'),
                limit(limitCount)
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
        } catch (error) {
            console.error('Error getting recent notifications:', error);
            throw new Error('Error al obtener notificaciones recientes');
        }
    },

    /**
     * Marca una notificación como enviada a Telegram
     */
    async markAsSent(id: string, telegramMessageId: number): Promise<void> {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            await updateDoc(docRef, {
                sentToTelegram: true,
                telegramMessageId,
            });
        } catch (error) {
            console.error('Error marking as sent:', error);
            throw new Error('Error al marcar como enviada');
        }
    },

    /**
     * Obtiene notificaciones por tipo
     */
    async getByType(type: string, limitCount?: number): Promise<Notification[]> {
        try {
            let q = query(
                collection(db, COLLECTION_NAME),
                where('type', '==', type),
                orderBy('timestamp', 'desc')
            );

            if (limitCount) {
                q = query(q, limit(limitCount));
            }

            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
        } catch (error) {
            console.error('Error getting notifications by type:', error);
            throw new Error('Error al obtener notificaciones por tipo');
        }
    },
};
