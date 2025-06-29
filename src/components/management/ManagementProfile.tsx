
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ManagementProfileProps {
  userInfo: any;
}

const ManagementProfile = ({ userInfo }: ManagementProfileProps) => {
  const todayStats = {
    totalVotes: 245,
    activeStudents: 189,
    menuItems: 12,
    complaints: 3
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-orange-700">Management Profile</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Your account details and role</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Email</label>
              <p className="text-lg">{userInfo.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Role</label>
              <div className="flex items-center gap-2">
                <p className="text-lg">Hostel Management</p>
                <Badge className="bg-orange-100 text-orange-800">Admin</Badge>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Department</label>
              <p className="text-lg">Food Services</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Joined</label>
              <p className="text-lg">January 2024</p>
            </div>
            <Button className="w-full">Edit Profile</Button>
          </CardContent>
        </Card>

        {/* Today's Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Today's Overview</CardTitle>
            <CardDescription>
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{todayStats.totalVotes}</div>
                <p className="text-sm text-gray-600">Total Votes</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{todayStats.activeStudents}</div>
                <p className="text-sm text-gray-600">Active Students</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{todayStats.menuItems}</div>
                <p className="text-sm text-gray-600">Menu Items</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{todayStats.complaints}</div>
                <p className="text-sm text-gray-600">New Complaints</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Frequently used management functions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-20 flex flex-col">
              <span className="font-medium">Add Food Item</span>
              <span className="text-xs text-gray-500">to menu</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col">
              <span className="font-medium">Plan Tomorrow</span>
              <span className="text-xs text-gray-500">menu</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col">
              <span className="font-medium">View Reports</span>
              <span className="text-xs text-gray-500">analytics</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ManagementProfile;
