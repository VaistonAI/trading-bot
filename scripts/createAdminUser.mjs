import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load service account key
const serviceAccount = JSON.parse(
    readFileSync(join(__dirname, '../serviceAccountKey.json'), 'utf8')
);

// Initialize Firebase Admin
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const auth = admin.auth();
const db = admin.firestore();

async function ensureAdminUser() {
    const email = 'admin@admin.com';
    const password = '$Vaiston123';
    const displayName = 'Administrador';

    try {
        console.log('🔍 Checking if user exists...');

        let userRecord;
        let isNewUser = false;

        try {
            // Try to get existing user
            userRecord = await auth.getUserByEmail(email);
            console.log('✅ User already exists with UID:', userRecord.uid);

            // Update password
            await auth.updateUser(userRecord.uid, {
                password: password,
                displayName: displayName,
                emailVerified: true,
            });
            console.log('✅ Password updated');

        } catch (error) {
            if (error.code === 'auth/user-not-found') {
                // Create new user
                console.log('📝 Creating new user...');
                userRecord = await auth.createUser({
                    email: email,
                    password: password,
                    displayName: displayName,
                    emailVerified: true,
                });
                console.log('✅ Auth user created with UID:', userRecord.uid);
                isNewUser = true;
            } else {
                throw error;
            }
        }

        // Create or update user document in Firestore with FULL permissions
        const userDoc = {
            email: email,
            displayName: displayName,
            role: 'admin',
            isActive: true,
            permissions: {
                canViewStrategies: true,
                canEditStrategies: true,
                canManageUsers: true,
                canViewReports: true,
                canEditSettings: true,
            },
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        if (isNewUser) {
            userDoc.createdAt = admin.firestore.FieldValue.serverTimestamp();
        }

        await db.collection('users').doc(userRecord.uid).set(userDoc, { merge: true });
        console.log('✅ User document updated in Firestore with full permissions');

        console.log('\n🎉 SUCCESS! Admin user is ready:');
        console.log('   UID:', userRecord.uid);
        console.log('   Email:', email);
        console.log('   Password:', password);
        console.log('   Role: admin');
        console.log('   Permissions: ALL');
        console.log('\n✨ You can now login at http://localhost:5173/login');

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error('Code:', error.code);
        process.exit(1);
    }
}

ensureAdminUser();
