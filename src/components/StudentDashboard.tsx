
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StudentFoodMenu from '@/components/student/StudentFoodMenu';
import StudentTodaysMenu from '@/components/student/StudentTodaysMenu';
import StudentWeeklyCalendar from '@/components/student/StudentWeeklyCalendar';
import StudentComplaints from '@/components/student/StudentComplaints';
import StudentProfile from '@/components/student/StudentProfile';

interface StudentDashboardProps {
  userInfo: any;
  onLogout: () => void;
}

const StudentDashboard = ({ userInfo, onLogout }: StudentDashboardProps) => {
  const [activeTab, setActiveTab] = useState('food-menu');

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-green-700">Student Portal</h1>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">Welcome, {userInfo.email}</span>
              <Button 
                onClick={onLogout}
                variant="outline"
                className="border-green-200 text-green-600 hover:bg-green-50"
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
            <StudentFoodMenu />
          </TabsContent>

          <TabsContent value="todays-menu">
            <StudentTodaysMenu />
          </TabsContent>

          <TabsContent value="weekly-calendar">
            <StudentWeeklyCalendar />
          </TabsContent>

          <TabsContent value="complaints">
            <StudentComplaints />
          </TabsContent>

          <TabsContent value="profile">
            <StudentProfile userInfo={userInfo} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default StudentDashboard;
