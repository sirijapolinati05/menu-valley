
import { useState } from 'react';
import LoginSection from '@/components/LoginSection';
import ManagementDashboard from '@/components/ManagementDashboard';
import StudentDashboard from '@/components/StudentDashboard';

export type UserType = 'management' | 'student' | null;

const Index = () => {
  const [currentUser, setCurrentUser] = useState<UserType>(null);
  const [userInfo, setUserInfo] = useState<any>(null);

  const handleLogin = (userType: UserType, info: any) => {
    setCurrentUser(userType);
    setUserInfo(info);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setUserInfo(null);
  };

  if (!currentUser) {
    return <LoginSection onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-green-50">
      {currentUser === 'management' ? (
        <ManagementDashboard userInfo={userInfo} onLogout={handleLogout} />
      ) : (
        <StudentDashboard userInfo={userInfo} onLogout={handleLogout} />
      )}
    </div>
  );
};

export default Index;
