import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const serviceAccount = require('./service-account.json'); // Replace with your service account key path

const app = initializeApp({
  credential: cert(serviceAccount),
  projectId: 'hostelapp-6b14e'
});

const auth = getAuth(app);
const db = getFirestore(app);

async function createDefaultUsers() {
  const defaultUsers = [
    {
      email: 'admin@example.com',
      password: 'Admin123!',
      role: 'management',
      name: 'Admin User',
      contact: 'admin@example.com'
    },
    {
      email: 'student1@example.com',
      password: 'Student123!',
      role: 'student',
      name: 'Student One',
      roomNumber: '101',
      contact: 'student1@example.com',
      feesStatus: 'Pending',
      complaints: []
    },
    {
      email: 'student2@example.com',
      password: 'Student123!',
      role: 'student',
      name: 'Student Two',
      roomNumber: '102',
      contact: 'student2@example.com',
      feesStatus: 'Paid',
      complaints: []
    }
  ];

  for (const user of defaultUsers) {
    try {
      const userRecord = await auth.createUser({
        email: user.email,
        password: user.password,
        displayName: user.name
      });
      const uid = userRecord.uid;
      await db.collection('users').doc(uid).set({
        id: uid,
        email: user.email,
        role: user.role,
        name: user.name,
        contact: user.contact,
        ...(user.role === 'student' && {
          roomNumber: user.roomNumber,
          feesStatus: user.feesStatus,
          complaints: user.complaints
        })
      });
      console.log(`Created user: ${user.email}`);
    } catch (error: any) {
      if (error.code === 'auth/email-already-exists') {
        console.log(`User ${user.email} already exists, skipping.`);
      } else {
        console.error(`Error creating user ${user.email}:`, error);
      }
    }
  }
}

createDefaultUsers().then(() => {
  console.log('Default users creation process completed.');
  process.exit(0);
});
