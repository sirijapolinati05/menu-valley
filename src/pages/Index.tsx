
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import LoginSection from '@/components/LoginSection';
import ManagementDashboard from '@/components/ManagementDashboard';
import StudentDashboard from '@/components/StudentDashboard';

export type UserType = 'management' | 'student' | null;

const Index = () => {
  const { user, login, logout, loading } = useAuth();
  const [userInfo, setUserInfo] = useState<any>(null);

  useEffect(() => {
    // Check for persisted user data on component mount
    const savedUser = localStorage.getItem('hostel_user');
    if (savedUser && !user) {
      const userData = JSON.parse(savedUser);
      setUserInfo(userData);
      login(userData.role, userData.email);
    } else if (user) {
      // If user exists, get their info from localStorage
      const savedUser = localStorage.getItem('hostel_user');
      if (savedUser) {
        setUserInfo(JSON.parse(savedUser));
      }
    }
  }, [user, login]);

  const handleLogin = (userType: UserType, info: any) => {
    login(userType!, info.email);
    setUserInfo(info);
  };

  const handleLogout = () => {
    logout();
    setUserInfo(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-green-50 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!user || !userInfo) {
    return <LoginSection onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-green-50">
      {userInfo.role === 'management' ? (
        <ManagementDashboard userInfo={userInfo} onLogout={handleLogout} />
      ) : (
        <StudentDashboard userInfo={userInfo} onLogout={handleLogout} />
      )}
    </div>
  );
};

export default Index;
