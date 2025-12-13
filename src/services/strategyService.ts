import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Strategy, StrategyPerformance } from '../types/strategy';

const COLLECTION_NAME = 'strategies';

export const strategyService = {
    /**
     * Obtiene todas las estrategias
     */
    async getAll(): Promise<Strategy[]> {
        try {
            const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Strategy));
        } catch (error) {
            console.error('Error getting strategies:', error);
            throw new Error('Error al obtener estrategias');
        }
    },

    /**
     * Obtiene una estrategia por ID
     */
    async getById(id: string): Promise<Strategy | null> {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                return { id: docSnap.id, ...docSnap.data() } as Strategy;
            }
            return null;
        } catch (error) {
            console.error('Error getting strategy:', error);
            throw new Error('Error al obtener estrategia');
        }
    },

    /**
     * Crea una nueva estrategia
     * @param strategy - Datos de la estrategia
     * @param customId - ID personalizado opcional (si no se proporciona, se genera automáticamente)
     */
    async create(strategy: Omit<Strategy, 'id'>, customId?: string): Promise<string> {
        try {
            const strategyData = {
                ...strategy,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
            };

            if (customId) {
                // Usar setDoc con ID personalizado
                const docRef = doc(db, COLLECTION_NAME, customId);
                await setDoc(docRef, strategyData);
                return customId;
            } else {
                // Usar addDoc para generar ID automático
                const docRef = await addDoc(collection(db, COLLECTION_NAME), strategyData);
                return docRef.id;
            }
        } catch (error) {
            console.error('Error creating strategy:', error);
            throw new Error('Error al crear estrategia');
        }
    },

    /**
     * Actualiza una estrategia
     */
    async update(id: string, updates: Partial<Strategy>): Promise<void> {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            await updateDoc(docRef, {
                ...updates,
                updatedAt: Timestamp.now(),
            });
        } catch (error) {
            console.error('Error updating strategy:', error);
            throw new Error('Error al actualizar estrategia');
        }
    },

    /**
     * Elimina una estrategia
     */
    async delete(id: string): Promise<void> {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            await deleteDoc(docRef);
        } catch (error) {
            console.error('Error deleting strategy:', error);
            throw new Error('Error al eliminar estrategia');
        }
    },

    /**
     * Actualiza el performance de una estrategia
     */
    async updatePerformance(id: string, performance: StrategyPerformance): Promise<void> {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            await updateDoc(docRef, {
                performance,
                lastUpdate: Timestamp.now(),
                updatedAt: Timestamp.now(),
            });
        } catch (error) {
            console.error('Error updating performance:', error);
            throw new Error('Error al actualizar performance');
        }
    },

    /**
     * Activa/desactiva notificaciones de Telegram para una estrategia
     */
    async toggleTelegramNotifications(id: string, enabled: boolean): Promise<void> {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            await updateDoc(docRef, {
                telegramNotificationsEnabled: enabled,
                updatedAt: Timestamp.now(),
            });
        } catch (error) {
            console.error('Error toggling notifications:', error);
            throw new Error('Error al cambiar notificaciones');
        }
    },

    /**
     * Activa/desactiva alertas en vivo para una estrategia
     */
    async toggleLiveAlerts(id: string, enabled: boolean): Promise<void> {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            await updateDoc(docRef, {
                liveAlertsEnabled: enabled,
                updatedAt: Timestamp.now(),
            });
        } catch (error) {
            console.error('Error toggling live alerts:', error);
            throw new Error('Error al cambiar alertas en vivo');
        }
    },

    /**
     * Obtiene estrategias activas con notificaciones habilitadas
     */
    async getActiveWithNotifications(): Promise<Strategy[]> {
        try {
            const q = query(
                collection(db, COLLECTION_NAME),
                where('isActive', '==', true),
                where('telegramNotificationsEnabled', '==', true)
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Strategy));
        } catch (error) {
            console.error('Error getting active strategies:', error);
            throw new Error('Error al obtener estrategias activas');
        }
    },
};
