const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

// Initialize Firebase Admin
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const auth = admin.auth();
const db = admin.firestore();

async function createAdminUser() {
    const email = 'admin@admin.com';
    const password = '$Vaiston123';
    const displayName = 'Administrador';

    try {
        console.log('🔄 Creating admin user...');
        console.log('📧 Email:', email);

        // Create user in Firebase Authentication
        const userRecord = await auth.createUser({
            email: email,
            password: password,
            displayName: displayName,
            emailVerified: true,
        });

        console.log('✅ Auth user created with UID:', userRecord.uid);

        // Create user document in Firestore
        await db.collection('users').doc(userRecord.uid).set({
            email: email,
            displayName: displayName,
            role: 'admin',
            isActive: true,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        console.log('✅ User document created in Firestore');
        console.log('\n🎉 SUCCESS! Admin user created:');
        console.log('   UID:', userRecord.uid);
        console.log('   Email:', email);
        console.log('   Password:', password);
        console.log('   Role: admin');
        console.log('\n✨ You can now login with these credentials at /login');

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error:', error.message);

        if (error.code === 'auth/email-already-exists') {
            console.log('\n⚠️  This email is already registered.');
            console.log('   You can delete it from Firebase Console and try again.');
        } else if (error.code === 'auth/invalid-password') {
            console.log('\n⚠️  Password must be at least 6 characters.');
        }

        process.exit(1);
    }
}

createAdminUser();
