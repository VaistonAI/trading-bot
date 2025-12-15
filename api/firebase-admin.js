const admin = require('firebase-admin');

// Inicializar Firebase Admin SDK
if (!admin.apps.length) {
    let credential;

    // En producción (Render), usar variable de entorno
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        try {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
            credential = admin.credential.cert(serviceAccount);
            console.log('✅ Firebase Admin SDK initialized from environment variable');
        } catch (error) {
            console.error('❌ Error parsing FIREBASE_SERVICE_ACCOUNT:', error.message);
            throw error;
        }
    } else {
        // En desarrollo local, usar archivo
        const serviceAccount = require('./serviceAccountKey.json');
        credential = admin.credential.cert(serviceAccount);
        console.log('✅ Firebase Admin SDK initialized from local file');
    }

    admin.initializeApp({ credential });
}

const db = admin.firestore();

module.exports = { admin, db };
