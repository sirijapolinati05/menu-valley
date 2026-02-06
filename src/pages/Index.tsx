import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import LoginSection from '@/components/LoginSection';
import ManagementDashboard from '@/components/ManagementDashboard';
import StudentDashboard from '@/components/StudentDashboard';
import { db } from '@/integrations/firebase/client';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';

export type UserType = 'management' | 'student' | null;

interface UserInfo {
  id: string;
  email: string;
  role: UserType; 
  name: string;
  roomNumber?: string;
  feesStatus?: string;
  complaints?: string[];
  studentid?: string;
  studentbranch?: string;
  timestamp?: string;
  studentusername?: string;
  gender?: string;
  course?: string;
}

const Index = () => {
  const { user, logout, loading } = useAuth();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  useEffect(() => {
    if (user) {
      const fetchUserData = async () => {
        try {
          const normalizedUsername = user.email?.toLowerCase() || '';
          console.log('Index: Fetching user data for username:', normalizedUsername);

          // Get full email from hostel_user
          const savedUser = localStorage.getItem('hostel_user');
          let fullEmail = normalizedUsername;
          if (savedUser) {
            const userInfo = JSON.parse(savedUser);
            fullEmail = userInfo.email || normalizedUsername;
            console.log('Index: Full email from localStorage:', fullEmail);
          }

          // Check userProfile_${username} for cached profile data
          const profileKey = `userProfile_${normalizedUsername}`;
          let profileData: Partial<UserInfo> = {};
          const savedProfile = localStorage.getItem(profileKey);
          if (savedProfile) {
            try {
              profileData = JSON.parse(savedProfile);
              console.log('Index: Loaded profile from localStorage:', JSON.stringify(profileData, null, 2));
            } catch (e) {
              console.error('Index: Failed to parse profile from localStorage:', e);
            }
          }

          // Fetch from Firestore
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          let userData: UserInfo;

          if (userDoc.exists()) {
            userData = { id: user.uid, ...userDoc.data() } as UserInfo;
            console.log('Index: Found existing user document:', JSON.stringify(userData, null, 2));
          } else {
            const studentsRef = collection(db, 'students');
            const q = query(studentsRef, where('studentusername', '==', normalizedUsername));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
              const studentDoc = querySnapshot.docs[0];
              const studentData = studentDoc.data();
              console.log('Index: Found student document:', JSON.stringify(studentData, null, 2));
              userData = {
                id: user.uid,
                email: studentData.studentemail || fullEmail,
                role: 'student',
                name: studentData.studentname || profileData.name || 'Unknown Student',
                roomNumber: studentData.roomNumber || profileData.roomNumber || 'Not Assigned',
                feesStatus: studentData.feesStatus || 'Pending',
                complaints: studentData.complaints || [],
                studentid: studentData.studentid || '',
                studentbranch: studentData.studentbranch || profileData.studentbranch || '',
                timestamp: studentData.timestamp || '',
                studentusername: studentData.studentusername || normalizedUsername,
                gender: studentData.gender || profileData.gender || '',
                course: studentData.course || profileData.course || '',
              };
            } else {
              console.log('Index: No student document found for username:', normalizedUsername);
              userData = {
                id: user.uid,
                email: fullEmail,
                role: user.displayName === 'management' ? 'management' : 'student',
                name: profileData.name || user.displayName || 'User',
                roomNumber: profileData.roomNumber || (user.displayName === 'management' ? undefined : 'Not Assigned'),
                feesStatus: user.displayName === 'management' ? undefined : 'Pending',
                complaints: [],
                studentusername: normalizedUsername,
                studentbranch: profileData.studentbranch || '',
                gender: profileData.gender || '',
                course: profileData.course || '',
              };
            }

            // Create students document if not exists
            if (userData.role === 'student' && querySnapshot.empty) {
              await setDoc(doc(db, 'students', fullEmail), {
                studentemail: fullEmail,
                studentname: userData.name,
                studentusername: normalizedUsername,
                roomNumber: userData.roomNumber || 'Not Assigned',
                feesStatus: 'Pending',
                complaints: [],
                createdAt: new Date(),
                studentbranch: userData.studentbranch || '',
                gender: userData.gender || '',
                course: userData.course || '',
              });
              console.log(`Index: Created students document for ${fullEmail}`);
            }

            await setDoc(doc(db, 'users', user.uid), userData);
            console.log(`Index: Created users document for UID: ${user.uid}`);
          }

          // Forcefully set userInfo to trigger re-render with correct role
          setUserInfo(prev => {
            if (!prev || prev.role !== userData.role) return userData;
            return { ...prev, ...userData };
          });
          console.log('Index: User logged in, userInfo set:', JSON.stringify(userData, null, 2));
        } catch (error: any) {
          console.error('Index: Error fetching/creating user data:', error);
          let errorMessage = 'Failed to load user information. Please try again.';
          if (error.code === 'permission-denied') {
            errorMessage = 'Permission denied. Please check your account settings.';
          }
          toast({
            title: 'Error loading user data',
            description: errorMessage,
            variant: 'destructive',
          });
        }
      };

      fetchUserData();
    } else {
      console.log('Index: No Firebase user, clearing userInfo');
      setUserInfo(null);
      // Clear localStorage to avoid stale data
      localStorage.removeItem('hostel_user');
    }
  }, [user]);

  const handleLogout = async () => {
    console.log('Index: handleLogout triggered');
    try {
      await logout();
      setUserInfo(null);
      // Clear all relevant localStorage data
      localStorage.removeItem('hostel_user');
      localStorage.removeItem(`userProfile_${user?.email?.toLowerCase() || ''}`);
      console.log('Index: Logout successful, userInfo cleared');
      toast({
        title: 'Logged out successfully',
        description: 'You have been logged out.',
      });
    } catch (error: any) {
      console.error('Index: Logout failed:', error);
      toast({
        title: 'Error logging out',
        description: 'Failed to log out. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-green-50 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!user || !userInfo) {
    console.log('Index: Rendering LoginSection (no user or userInfo)');
    return <LoginSection />;
  }

  console.log('Index: Rendering dashboard for role:', userInfo.role);
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-green-50">
      {userInfo.role === 'management' ? (
        <ManagementDashboard userInfo={userInfo} onLogout={handleLogout} />
      ) : (
        <StudentDashboard userInfo={userInfo} onLogout={handleLogout} updateUserInfo={setUserInfo} />
      )}
    </div>
  );
};

export default Index;