import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyA-z4EZqjV7HQF8NY3DygBS25xX-CKKgBI",
  authDomain: "hostelapp-6b14e.firebaseapp.com",
  projectId: "hostelapp-6b14e",
  storageBucket: "hostelapp-6b14e.appspot.com",
  messagingSenderId: "85557403111",
  appId: "1:85557403111:web:118edffb34f83db71cf142",
  measurementId: "G-07LN0SXKX6",
};

const app = initializeApp(firebaseConfig);
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
      const userCredential = await createUserWithEmailAndPassword(auth, user.email, user.password);
      const uid = userCredential.user.uid;
      await setDoc(doc(db, 'users', uid), {
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
      if (error.code === 'auth/email-already-in-use') {
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
