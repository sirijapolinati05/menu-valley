
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import FoodMenu from '@/components/management/FoodMenu';
import TodaysFoodMenu from '@/components/management/TodaysFoodMenu';
import WeeklyCalendar from '@/components/management/WeeklyCalendar';
import Complaints from '@/components/management/Complaints';
import ManagementProfile from '@/components/management/ManagementProfile';

interface ManagementDashboardProps {
  userInfo: any;
  onLogout: () => void;
}

const ManagementDashboard = ({ userInfo, onLogout }: ManagementDashboardProps) => {
  const [activeTab, setActiveTab] = useState('food-menu');

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-orange-700">Management Dashboard</h1>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">Welcome, {userInfo.email}</span>
              <Button 
                onClick={onLogout}
                variant="outline"
                className="border-orange-200 text-orange-600 hover:bg-orange-50"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5 mb-8">
            <TabsTrigger value="food-menu">Food Menu</TabsTrigger>
            <TabsTrigger value="todays-menu">Today's Menu</TabsTrigger>
            <TabsTrigger value="weekly-calendar">Weekly Calendar</TabsTrigger>
            <TabsTrigger value="complaints">Complaints</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="food-menu">
            <FoodMenu />
          </TabsContent>

          <TabsContent value="todays-menu">
            <TodaysFoodMenu />
          </TabsContent>

          <TabsContent value="weekly-calendar">
            <WeeklyCalendar />
          </TabsContent>

          <TabsContent value="complaints">
            <Complaints />
          </TabsContent>

          <TabsContent value="profile">
            <ManagementProfile userInfo={userInfo} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default ManagementDashboard;
