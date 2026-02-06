import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Utensils, ChefHat, Calendar, MessageSquare, User } from 'lucide-react';
import FoodMenu from '@/components/management/FoodMenu';
import TodaysFoodMenu from '@/components/management/TodaysFoodMenu';
import WeeklyCalendar from '@/components/management/WeeklyCalendar';
import Complaints from '@/components/management/Complaints';
import ManagementProfile from '@/components/management/ManagementProfile';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import logo from '@/assets/Vishnu.png';

const MOBILE_BREAKPOINT = 768;

function useIsMobile() {
  const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}

const ManagementDashboard = () => {
  const [activeTab, setActiveTab] = useState('food-menu');
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const handleLogoutClick = async () => {
    console.log('ManagementDashboard: Logout button clicked');
    try {
      await logout();
      console.log('ManagementDashboard: Logout successful');
      navigate('/login');
    } catch (error) {
      console.error('ManagementDashboard: Logout failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 flex flex-col md:flex-row">
      <style>
        {`
          @media (max-width: ${MOBILE_BREAKPOINT}px) {
            .mobile-header {
              font-size: 18px !important; /* Set Management Dashboard heading to 18px on mobile */
            }
          }
        `}
      </style>
      <div className={`${isMobile ? 'fixed bottom-0 left-0 w-full h-16 flex-row justify-around items-center shadow-lg bg-white z-50' : 'w-48 shadow-sm fixed top-0 left-0 h-screen flex flex-col perspective-1200'}`}>
        {!isMobile && (
          <div className="p-4 text-center">
            <img src={logo} alt="Logo" className="h-12 w-auto mx-auto mb-2" />
            <span className="text-gray-800 font-semibold">Menu Valley</span>
          </div>
        )}
        <Tabs value={activeTab} onValueChange={setActiveTab} orientation={isMobile ? 'horizontal' : 'vertical'} className="flex-1">
          <TabsList className={`${isMobile ? 'flex-row w-full h-full justify-around items-center bg-transparent px-0' : 'flex flex-col bg-transparent h-full px-4 space-y-4 pt-4'}`}>
            <TabsTrigger
              value="food-menu"
              className={`${isMobile ? 'rounded-full p-3 bg-gradient-to-b from-orange-100 to-orange-200 hover:from-orange-300 hover:to-orange-400 hover:scale-110 data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white transition-all duration-300 shadow-md hover:shadow-lg' : 'flex flex-col items-center py-3 px-4 w-full bg-gradient-to-b from-orange-100 to-orange-200 hover:from-orange-300 hover:to-orange-400 hover:scale-115 data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white data-[state=active]:scale-115 transition-all duration-300 shadow-2xl hover:shadow-3xl rounded-xl transform hover:-translate-y-2 hover:translate-z-20 hover:skew-y-1'}`}
            >
              <span className={`${isMobile ? 'hidden' : 'font-bold text-gray-800 data-[state=active]:text-white'}`}>Food Menu</span>
              <Utensils className={`${isMobile ? 'h-6 w-6' : 'mt-1 h-8 w-8'} text-gray-800 data-[state=active]:text-white`} />
            </TabsTrigger>
            <TabsTrigger
              value="todays-menu"
              className={`${isMobile ? 'rounded-full p-3 bg-gradient-to-b from-orange-100 to-orange-200 hover:from-orange-300 hover:to-orange-400 hover:scale-110 data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white transition-all duration-300 shadow-md hover:shadow-lg' : 'flex flex-col items-center py-3 px-4 w-full bg-gradient-to-b from-orange-100 to-orange-200 hover:from-orange-300 hover:to-orange-400 hover:scale-115 data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white data-[state=active]:scale-115 transition-all duration-300 shadow-2xl hover:shadow-3xl rounded-xl transform hover:-translate-y-2 hover:translate-z-20 hover:skew-y-1'}`}
            >
              <span className={`${isMobile ? 'hidden' : 'font-bold text-gray-800 data-[state=active]:text-white'}`}>Today's Menu</span>
              <ChefHat className={`${isMobile ? 'h-6 w-6' : 'mt-1 h-8 w-8'} text-gray-800 data-[state=active]:text-white`} />
            </TabsTrigger>
            <TabsTrigger
              value="weekly-calendar"
              className={`${isMobile ? 'rounded-full p-3 bg-gradient-to-b from-orange-100 to-orange-200 hover:from-orange-300 hover:to-orange-400 hover:scale-110 data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white transition-all duration-300 shadow-md hover:shadow-lg' : 'flex flex-col items-center py-3 px-4 w-full bg-gradient-to-b from-orange-100 to-orange-200 hover:from-orange-300 hover:to-orange-400 hover:scale-115 data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white data-[state=active]:scale-115 transition-all duration-300 shadow-2xl hover:shadow-3xl rounded-xl transform hover:-translate-y-2 hover:translate-z-20 hover:skew-y-1'}`}
            >
              <span className={`${isMobile ? 'hidden' : 'font-bold text-gray-800 data-[state=active]:text-white'}`}>Weekly Calendar</span>
              <Calendar className={`${isMobile ? 'h-6 w-6' : 'mt-1 h-8 w-8'} text-gray-800 data-[state=active]:text-white`} />
            </TabsTrigger>
            <TabsTrigger
              value="complaints"
              className={`${isMobile ? 'rounded-full p-3 bg-gradient-to-b from-orange-100 to-orange-200 hover:from-orange-300 hover:to-orange-400 hover:scale-110 data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white transition-all duration-300 shadow-md hover:shadow-lg' : 'flex flex-col items-center py-3 px-4 w-full bg-gradient-to-b from-orange-100 to-orange-200 hover:from-orange-300 hover:to-orange-400 hover:scale-115 data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white data-[state=active]:scale-115 transition-all duration-300 shadow-2xl hover:shadow-3xl rounded-xl transform hover:-translate-y-2 hover:translate-z-20 hover:skew-y-1'}`}
            >
              <span className={`${isMobile ? 'hidden' : 'font-bold text-gray-800 data-[state=active]:text-white'}`}>Complaints</span>
              <MessageSquare className={`${isMobile ? 'h-6 w-6' : 'mt-1 h-8 w-8'} text-gray-800 data-[state=active]:text-white`} />
            </TabsTrigger>
            <TabsTrigger
              value="profile"
              className={`${isMobile ? 'rounded-full p-3 bg-gradient-to-b from-orange-100 to-orange-200 hover:from-orange-300 hover:to-orange-400 hover:scale-110 data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white transition-all duration-300 shadow-md hover:shadow-lg' : 'flex flex-col items-center py-3 px-4 w-full bg-gradient-to-b from-orange-100 to-orange-200 hover:from-orange-300 hover:to-orange-400 hover:scale-115 data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white data-[state=active]:scale-115 transition-all duration-300 shadow-2xl hover:shadow-3xl rounded-xl transform hover:-translate-y-2 hover:translate-z-20 hover:skew-y-1'}`}
            >
              <span className={`${isMobile ? 'hidden' : 'font-bold text-gray-800 data-[state=active]:text-white'}`}>Profile</span>
              <User className={`${isMobile ? 'h-6 w-6' : 'mt-1 h-8 w-8'} text-gray-800 data-[state=active]:text-white`} />
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <div className={`flex-1 flex flex-col ${isMobile ? 'ml-0 pb-16' : 'ml-48'}`}>
        <header className="shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <h1 className={`text-2xl font-bold text-orange-700 ${isMobile ? 'mobile-header' : ''}`}>Management Dashboard</h1>
              <div className="flex items-center space-x-4">
                <span className="text-gray-600">Welcome, {user?.email || 'Manager'}</span>
                <Button
                  onClick={handleLogoutClick}
                  variant="outline"
                  className="bg-gradient-to-b from-orange-100 to-orange-200 text-orange-600 hover:from-orange-300 hover:to-orange-400 hover:scale-115 transition-all duration-300 shadow-2xl hover:shadow-3xl rounded-xl transform hover:-translate-y-2 hover:translate-z-20 hover:skew-y-1"
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
              <FoodMenu />
            </TabsContent>
            <TabsContent value="todays-menu" className="min-h-[calc(100vh-4rem)]">
              <TodaysFoodMenu />
            </TabsContent>
            <TabsContent value="weekly-calendar" className="min-h-[calc(100vh-4rem)]">
              <WeeklyCalendar />
            </TabsContent>
            <TabsContent value="complaints" className="min-h-[calc(100vh-4rem)]">
              <Complaints />
            </TabsContent>
            <TabsContent value="profile" className="min-h-[calc(100vh-4rem)]">
              <ManagementProfile userInfo={user} />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
};

export default ManagementDashboard;