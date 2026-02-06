import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '@/integrations/firebase/client';
import {
  onAuthStateChanged,
  signOut,
  User as FirebaseUser,
} from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';

interface AuthContextType {
  user: FirebaseUser | null;
  session: null;
  login: (userType: 'management' | 'student', username: string, password?: string) => Promise<void>;
  logout: (persistData?: string[]) => Promise<void>;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('AuthContext: Setting up onAuthStateChanged listener');
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      console.log('AuthContext: onAuthStateChanged fired, user:', firebaseUser ? { email: firebaseUser.email, uid: firebaseUser.uid, displayName: firebaseUser.displayName } : null);
      if (firebaseUser) {
        const userInfo = {
          username: firebaseUser.email,
          role: firebaseUser.displayName || 'unknown',
          loginTime: new Date().toISOString(),
        };
        localStorage.setItem('hostel_user', JSON.stringify(userInfo));
        console.log('AuthContext: Updated hostel_user in localStorage:', userInfo);
      } else {
        localStorage.removeItem('hostel_user');
        console.log('AuthContext: Removed hostel_user from localStorage');
      }
      setUser(firebaseUser);
      setLoading(false);
    });

    const savedUser = localStorage.getItem('hostel_user');
    if (savedUser) {
      try {
        const userInfo = JSON.parse(savedUser);
        console.log('AuthContext: Loaded initial user from localStorage:', userInfo);
      } catch (e) {
        console.error('AuthContext: Failed to parse hostel_user from localStorage:', e);
        localStorage.removeItem('hostel_user');
      }
    }

    return () => {
      console.log('AuthContext: Cleaning up onAuthStateChanged listener');
      unsubscribe();
    };
  }, []);

  const login = async (userType: 'management' | 'student', username: string, password?: string) => {
    console.log('AuthContext: Login called with userType:', userType, 'username:', username, 'password:', password ? '[provided]' : '[not provided]');

    try {
      if (userType === 'management') {
        const userInfo = {
          username,
          role: userType,
          loginTime: new Date().toISOString(),
        };
        localStorage.setItem('hostel_user', JSON.stringify(userInfo));

        const mockUser = {
          uid: `${userType}_${Date.now()}`,
          email: username,
          displayName: userType,
          emailVerified: true,
          phoneNumber: null,
          photoURL: null,
          providerId: 'mock',
          tenantId: null,
          reload: async () => {},
          getIdToken: async () => 'mock-token',
          getIdTokenResult: async () => ({ token: 'mock-token' }),
          toJSON: () => userInfo,
          delete: async () => {},
        } as FirebaseUser;

        setUser(mockUser);
        console.log('AuthContext: Management login successful, user:', { username, uid: mockUser.uid });
      } else if (userType === 'student') {
        if (!password) {
          throw new Error('Password is required for student login');
        }

        const normalizedUsername = username.trim().toLowerCase();
        const inputPassword = password.trim();
        console.log('AuthContext: Querying Firestore with username:', normalizedUsername, 'password:', inputPassword);

        const studentsRef = collection(db, 'students');
        const allDocs = await getDocs(studentsRef);
        console.log('AuthContext: All documents in students collection:');
        allDocs.forEach((doc) => console.log(doc.id, doc.data()));

        const q = query(
          studentsRef,
          where('studentusername', '==', normalizedUsername),
          where('studentpassword', '==', inputPassword)
        );
        const querySnapshot = await getDocs(q);

        console.log('AuthContext: Firestore query results for studentusername:', normalizedUsername, 'password:', inputPassword);
        if (querySnapshot.empty) {
          console.log('AuthContext: No matching documents found for studentusername:', normalizedUsername, 'password:', inputPassword);
          throw new Error('Invalid username or password');
        }

        const studentDoc = querySnapshot.docs[0];
        const studentData = studentDoc.data();
        const userInfo = {
          username: studentData.studentusername,
          email: studentData.studentemail,
          role: userType,
          loginTime: new Date().toISOString(),
        };
        localStorage.setItem('hostel_user', JSON.stringify(userInfo));
        localStorage.setItem('studentDashboardActiveTab', 'food-menu'); // Set default tab for student

        const mockUser = {
          uid: studentDoc.id,
          email: studentData.studentusername,
          displayName: userType,
          emailVerified: true,
          phoneNumber: null,
          photoURL: null,
          providerId: 'mock',
          tenantId: null,
          reload: async () => {},
          getIdToken: async () => 'mock-token',
          getIdTokenResult: async () => ({ token: 'mock-token' }),
          toJSON: () => userInfo,
          delete: async () => {},
        } as FirebaseUser;

        setUser(mockUser);
        console.log('AuthContext: Student login successful, user:', { email: studentData.studentusername, uid: studentDoc.id, fullEmail: studentData.studentemail });
      }
    } catch (error) {
      console.error('AuthContext: Login failed:', error);
      throw error;
    }
  };

  const logout = async (persistData: string[] = ['weekly_menus', 'excelData', 'userProfile_']) => {
    console.log('AuthContext: Logout triggered, persistData:', persistData);
    try {
      localStorage.removeItem('hostel_user');
      localStorage.removeItem('studentDashboardActiveTab'); // Explicitly clear active tab
      const allKeys = Object.keys(localStorage);
      allKeys.forEach((key) => {
        if (!persistData.some((persistKey) => key.includes(persistKey))) {
          localStorage.removeItem(key);
        }
      });
      await signOut(auth);
      setUser(null);
      console.log('AuthContext: Logout successful, user set to null');
    } catch (error) {
      console.error('AuthContext: Logout failed:', error);
      throw error;
    }
  };

  const value = {
    user,
    session: null,
    login,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};