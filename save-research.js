// Script para subir las 20 mejores acciones a Firebase
// Ejecutar en la consola del navegador (F12)

const top20Stocks = [
    'SPY', 'SLV', 'XLF', 'QQQ', 'IWM', 'HYG', 'THH', 'NVDA', 'TQQQ', 'SOXL',
    'AVGO', 'ONDS', 'WULF', 'INTC', 'TE', 'DNN', 'RVNL', 'FEIM', 'BBAI', 'BMNR'
];

// Importar Firebase (ya está cargado en la app)
import { doc, setDoc } from 'firebase/firestore';
import { db } from './config/firebase';
import { auth } from './config/firebase';

async function saveResearchToFirebase() {
    const user = auth.currentUser;

    if (!user) {
        console.error('❌ No hay usuario autenticado');
        return;
    }

    try {
        await setDoc(doc(db, 'users', user.uid, 'research', 'latest'), {
            date: new Date().toISOString(),
            stocks: top20Stocks,
            updatedAt: new Date()
        });

        console.log('✅ Acciones guardadas en Firebase:', top20Stocks);
        console.log('🔄 Refresca la página de Simulación para ver la opción');
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

// Ejecutar
saveResearchToFirebase();
