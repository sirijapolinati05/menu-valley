
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface StudentProfileProps {
  userInfo: any;
}

const StudentProfile = ({ userInfo }: StudentProfileProps) => {
  const studentStats = {
    totalVotes: 12,
    complaintsSubmitted: 2,
    favoriteMeal: 'Lunch',
    joinedDate: 'September 2023'
  };

  const studentInfo = {
    name: 'John Doe',
    rollNumber: 'CS21B1001',
    roomNumber: 'A-204',
    phoneNumber: '+91 9876543210',
    year: '3rd Year',
    department: 'Computer Science'
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-green-700">Student Profile</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Your account and hostel details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Full Name</label>
              <p className="text-lg">{studentInfo.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Email</label>
              <p className="text-lg">{userInfo.email}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Roll Number</label>
                <p className="text-lg">{studentInfo.rollNumber}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Room Number</label>
                <p className="text-lg">{studentInfo.roomNumber}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Year</label>
                <p className="text-lg">{studentInfo.year}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Department</label>
                <p className="text-lg">{studentInfo.department}</p>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Phone Number</label>
              <p className="text-lg">{studentInfo.phoneNumber}</p>
            </div>
            <Button className="w-full">Edit Profile</Button>
          </CardContent>
        </Card>

        {/* Activity Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Your Activity</CardTitle>
            <CardDescription>
              Your participation in the hostel food system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{studentStats.totalVotes}</div>
                <p className="text-sm text-gray-600">Total Votes</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{studentStats.complaintsSubmitted}</div>
                <p className="text-sm text-gray-600">Complaints</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Favorite Meal</span>
                <Badge className="bg-orange-100 text-orange-800">{studentStats.favoriteMeal}</Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Member Since</span>
                <span className="text-sm text-gray-700">{studentStats.joinedDate}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Status</span>
                <Badge className="bg-green-100 text-green-800">Active Resident</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Frequently used student functions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-20 flex flex-col">
              <span className="font-medium">Vote Today</span>
              <span className="text-xs text-gray-500">for meals</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col">
              <span className="font-medium">Submit Complaint</span>
              <span className="text-xs text-gray-500">food issue</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col">
              <span className="font-medium">View Menu</span>
              <span className="text-xs text-gray-500">this week</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentProfile;
