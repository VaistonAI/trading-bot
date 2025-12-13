import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, Timestamp } from 'firebase/firestore';

// Firebase configuration - using environment variables
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function createAdminUser() {
    const email = 'admin@admin.com';
    const password = '$Vaiston123';
    const displayName = 'Administrador';

    try {
        console.log('🔄 Creating admin user...');

        // Create authentication user
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        console.log('✅ Auth user created:', user.uid);

        // Create user document in Firestore
        await setDoc(doc(db, 'users', user.uid), {
            email: email,
            displayName: displayName,
            role: 'admin',
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
            isActive: true,
        });

        console.log('✅ User document created in Firestore');
        console.log('\n🎉 Admin user created successfully!');
        console.log('📧 Email:', email);
        console.log('🔑 Password:', password);
        console.log('👤 Role: admin');
        console.log('\nYou can now login with these credentials.');

        process.exit(0);
    } catch (error: any) {
        console.error('❌ Error creating admin user:', error.message);

        if (error.code === 'auth/email-already-in-use') {
            console.log('\n⚠️  User already exists. If you need to reset the password, delete the user first from Firebase Console.');
        }

        process.exit(1);
    }
}

createAdminUser();
