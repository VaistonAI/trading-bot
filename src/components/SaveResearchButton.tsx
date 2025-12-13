import React from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';

export const SaveResearchButton: React.FC = () => {
    const { currentUser } = useAuth();

    const top20Stocks = [
        'SPY', 'SLV', 'XLF', 'QQQ', 'IWM', 'HYG', 'THH', 'NVDA', 'TQQQ', 'SOXL',
        'AVGO', 'ONDS', 'WULF', 'INTC', 'TE', 'DNN', 'RVNL', 'FEIM', 'BBAI', 'BMNR'
    ];

    const handleSave = async () => {
        if (!currentUser) {
            alert('Debes estar autenticado');
            return;
        }

        try {
            await setDoc(doc(db, 'users', currentUser.uid, 'research', 'latest'), {
                date: new Date().toISOString(),
                stocks: top20Stocks,
                updatedAt: new Date()
            });

            alert('✅ Acciones guardadas! Ve a Simulación y refresca la página');
        } catch (error) {
            console.error('Error:', error);
            alert('❌ Error al guardar');
        }
    };

    return (
        <button
            onClick={handleSave}
            className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
        >
            💾 Guardar Top 20 en Firebase
        </button>
    );
};
