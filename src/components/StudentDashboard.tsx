import { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Utensils, ChefHat, Calendar, MessageSquare, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StudentFoodMenu from '@/components/student/StudentFoodMenu';
import StudentTodaysMenu from '@/components/student/StudentTodaysMenu';
import StudentWeeklyCalendar from '@/components/student/StudentWeeklyCalendar';
import StudentComplaints from '@/components/student/StudentComplaints';
import StudentProfile from '@/components/student/StudentProfile';
import { useNavigate } from 'react-router-dom';
import logo from '@/assets/Vishnu.png';

interface StudentDashboardProps {
  userInfo: any;
  onLogout: () => void;
  updateUserInfo: (userInfo: any) => void;
}

const MOBILE_BREAKPOINT = 768;

function useIsMobile() {
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth < MOBILE_BREAKPOINT);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile;
}

const StudentDashboard = ({ userInfo, onLogout, updateUserInfo }: StudentDashboardProps) => {
  const [activeTab, setActiveTab] = useState(() => {
    const savedTab = localStorage.getItem('studentDashboardActiveTab');
    return savedTab || 'food-menu'; // Changed default to 'food-menu'
  });
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  useEffect(() => {
    localStorage.setItem('studentDashboardActiveTab', activeTab);
  }, [activeTab]);

  const handleLogoutClick = () => {
    console.log('StudentDashboard: Logout button clicked, calling onLogout');
    try {
      onLogout();
      console.log('StudentDashboard: Logout successful');
      localStorage.removeItem('studentDashboardActiveTab');
      navigate('/');
    } catch (error) {
      console.error('StudentDashboard: Logout failed:', error);
    }
  };

  useEffect(() => {
    if (userInfo) {
      updateUserInfo(userInfo);
    }
  }, [userInfo, updateUserInfo]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 flex flex-col">
      <style>
        {`
          @media (max-width: ${MOBILE_BREAKPOINT}px) {
            .mobile-content {
              padding-bottom: 80px;
              min-height: calc(100vh - 80px);
            }
            .mobile-navbar {
              position: fixed;
              bottom: 0;
              left: 0;
              right: 0;
              z-index: 50;
              height: 64px;
              background: white;
              box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.1);
            }
            .mobile-header {
              font-size: 18px !important; /* Set Student Portal heading to 18px on mobile */
            }
          }
          .dashboard-content {
            --card-shadow: 0 6px 12px rgba(0, 0, 0, 0.3), inset 0 -2px 4px rgba(0, 0, 0, 0.2), inset 0 2px 4px rgba(255, 255, 255, 0.4);
            --card-transition: transition-all duration-300 cursor-pointer rounded-lg bg-gray-100 border border-gray-200;
          }
          .dashboard-content .food-card,
          .dashboard-content .prominent-card {
            box-shadow: var(--card-shadow);
            @apply ${isMobile ? 'w-full' : 'w-auto'};
          }
          .dashboard-content .food-card:hover,
          .dashboard-content .prominent-card:hover {
            animation: bulge 1.5s infinite ease-in-out;
          }
          @keyframes bulge {
            0% { transform: scale(1); box-shadow: var(--card-shadow); }
            50% { transform: scale(1.05); box-shadow: 0 8px 16px rgba(0, 0, 0, 0.35), inset 0 -3px 5px rgba(0, 0, 0, 0.25), inset 0 3px 5px rgba(255, 255, 255, 0.5); }
            100% { transform: scale(1); box-shadow: var(--card-shadow); }
          }
        `}
      </style>
      <div className={`z-50 ${isMobile ? 'mobile-navbar' : 'w-48 shadow-sm fixed top-0 left-0 h-screen flex flex-col'}`}>
        {!isMobile && (
          <div className="p-4 text-center">
            <img src={logo} alt="Logo" className="h-12 w-auto mx-auto mb-2" />
            <span className="text-gray-800 font-semibold">Menu Valley</span>
          </div>
        )}
        <Tabs value={activeTab} onValueChange={setActiveTab} orientation={isMobile ? 'horizontal' : 'vertical'} className="flex-1">
          <TabsList className={`${isMobile ? 'flex w-full h-full justify-around items-center bg-transparent px-0' : 'flex flex-col bg-transparent h-full px-4 space-y-4 pt-4'}`}>
            <TabsTrigger
              value="food-menu"
              className={`${isMobile ? 'rounded-full p-3 bg-gradient-to-b from-green-100 to-green-200 hover:from-green-300 hover:to-green-400 data-[state=active]:from-green-500 data-[state=active]:to-green-600 data-[state=active]:text-white transition-all duration-300 shadow-md hover:shadow-lg' : 'flex flex-col items-center py-3 px-4 w-full bg-gradient-to-b from-green-100 to-green-200 hover:from-green-300 hover:to-green-400 data-[state=active]:from-green-500 data-[state=active]:to-green-600 data-[state=active]:text-white transition-all duration-300 shadow-md hover:shadow-lg rounded-xl'}`}
            >
              <span className={`${isMobile ? 'hidden' : 'font-bold text-gray-800 data-[state=active]:text-white'}`}>Food Menu</span>
              <Utensils className={`${isMobile ? 'h-6 w-6' : 'mt-1 h-8 w-8'} text-gray-800 data-[state=active]:text-white`} />
            </TabsTrigger>
            <TabsTrigger
              value="todays-menu"
              className={`${isMobile ? 'rounded-full p-3 bg-gradient-to-b from-green-100 to-green-200 hover:from-green-300 hover:to-green-400 data-[state=active]:from-green-500 data-[state=active]:to-green-600 data-[state=active]:text-white transition-all duration-300 shadow-md hover:shadow-lg' : 'flex flex-col items-center py-3 px-4 w-full bg-gradient-to-b from-green-100 to-green-200 hover:from-green-300 hover:to-green-400 data-[state=active]:from-green-500 data-[state=active]:to-green-600 data-[state=active]:text-white transition-all duration-300 shadow-md hover:shadow-lg rounded-xl'}`}
            >
              <span className={`${isMobile ? 'hidden' : 'font-bold text-gray-800 data-[state=active]:text-white'}`}>Today's Menu</span>
              <ChefHat className={`${isMobile ? 'h-6 w-6' : 'mt-1 h-8 w-8'} text-gray-800 data-[state=active]:text-white`} />
            </TabsTrigger>
            <TabsTrigger
              value="weekly-calendar"
              className={`${isMobile ? 'rounded-full p-3 bg-gradient-to-b from-green-100 to-green-200 hover:from-green-300 hover:to-green-400 data-[state=active]:from-green-500 data-[state=active]:to-green-600 data-[state=active]:text-white transition-all duration-300 shadow-md hover:shadow-lg' : 'flex flex-col items-center py-3 px-4 w-full bg-gradient-to-b from-green-100 to-green-200 hover:from-green-300 hover:to-green-400 data-[state=active]:from-green-500 data-[state=active]:to-green-600 data-[state=active]:text-white transition-all duration-300 shadow-md hover:shadow-lg rounded-xl'}`}
            >
              <span className={`${isMobile ? 'hidden' : 'font-bold text-gray-800 data-[state=active]:text-white'}`}>Weekly Calendar</span>
              <Calendar className={`${isMobile ? 'h-6 w-6' : 'mt-1 h-8 w-8'} text-gray-800 data-[state=active]:text-white`} />
            </TabsTrigger>
            <TabsTrigger
              value="complaints"
              className={`${isMobile ? 'rounded-full p-3 bg-gradient-to-b from-green-100 to-green-200 hover:from-green-300 hover:to-green-400 data-[state=active]:from-green-500 data-[state=active]:to-green-600 data-[state=active]:text-white transition-all duration-300 shadow-md hover:shadow-lg' : 'flex flex-col items-center py-3 px-4 w-full bg-gradient-to-b from-green-100 to-green-200 hover:from-green-300 hover:to-green-400 data-[state=active]:from-green-500 data-[state=active]:to-green-600 data-[state=active]:text-white transition-all duration-300 shadow-md hover:shadow-lg rounded-xl'}`}
            >
              <span className={`${isMobile ? 'hidden' : 'font-bold text-gray-800 data-[state=active]:text-white'}`}>Complaints</span>
              <MessageSquare className={`${isMobile ? 'h-6 w-6' : 'mt-1 h-8 w-8'} text-gray-800 data-[state=active]:text-white`} />
            </TabsTrigger>
            <TabsTrigger
              value="profile"
              className={`${isMobile ? 'rounded-full p-3 bg-gradient-to-b from-green-100 to-green-200 hover:from-green-300 hover:to-green-400 data-[state=active]:from-green-500 data-[state=active]:to-green-600 data-[state=active]:text-white transition-all duration-300 shadow-md hover:shadow-lg' : 'flex flex-col items-center py-3 px-4 w-full bg-gradient-to-b from-green-100 to-green-200 hover:from-green-300 hover:to-green-400 data-[state=active]:from-green-500 data-[state=active]:to-green-600 data-[state=active]:text-white transition-all duration-300 shadow-md hover:shadow-lg rounded-xl'}`}
            >
              <span className={`${isMobile ? 'hidden' : 'font-bold text-gray-800 data-[state=active]:text-white'}`}>Profile</span>
              <User className={`${isMobile ? 'h-6 w-6' : 'mt-1 h-8 w-8'} text-gray-800 data-[state=active]:text-white`} />
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <div className={`flex-1 flex flex-col ${isMobile ? 'mobile-content' : 'ml-48'} dashboard-content`}>
        <header className="shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <h1 className={`text-2xl font-bold text-orange-700 ${isMobile ? 'mobile-header' : ''}`}>Student Portal</h1>
              <div className="flex items-center space-x-4">
                <span className="text-gray-600">Welcome, {userInfo.email}</span>
                <Button
                  onClick={handleLogoutClick}
                  variant="outline"
                  className="bg-gradient-to-b from-green-100 to-green-200 text-green-600 hover:from-green-300 hover:to-green-400 transition-all duration-300 shadow-md hover:shadow-lg rounded-xl"
                >
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} orientation={isMobile ? 'horizontal' : 'vertical'}>
            <TabsContent value="food-menu" className="min-h-[calc(100vh-4rem)]">
              <StudentFoodMenu />
            </TabsContent>
            <TabsContent value="todays-menu" className="min-h-[calc(100vh-4rem)]">
              <StudentTodaysMenu />
            </TabsContent>
            <TabsContent value="weekly-calendar" className="min-h-[calc(100vh-4rem)]">
              <StudentWeeklyCalendar />
            </TabsContent>
            <TabsContent value="complaints" className="min-h-[calc(100vh-4rem)]">
              <StudentComplaints />
            </TabsContent>
            <TabsContent value="profile" className="min-h-[calc(100vh-4rem)]">
              <StudentProfile userInfo={userInfo} />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
};

export default StudentDashboard;