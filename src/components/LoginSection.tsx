
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { UserType } from '@/pages/Index';

interface LoginSectionProps {
  onLogin: (userType: UserType, info: any) => void;
}

const LoginSection = ({ onLogin }: LoginSectionProps) => {
  const [managementEmail, setManagementEmail] = useState('');
  const [managementPassword, setManagementPassword] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentPassword, setStudentPassword] = useState('');

  const handleManagementLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (managementEmail && managementPassword) {
      onLogin('management', { email: managementEmail, role: 'management' });
    }
  };

  const handleStudentLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (studentEmail && studentPassword) {
      onLogin('student', { email: studentEmail, role: 'student' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-yellow-50 to-green-100 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-orange-600 to-green-600 bg-clip-text text-transparent mb-4">
            Hostel Food Management
          </h1>
          <p className="text-lg text-gray-600">Reducing food wastage through smart meal planning</p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          {/* Management Login */}
          <Card className="shadow-xl border-0 bg-gradient-to-br from-orange-50 to-orange-100">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-2xl text-orange-700">Hostel Management</CardTitle>
              <CardDescription className="text-orange-600">
                Login to manage food menus and track preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleManagementLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="mgmt-email">Email Address</Label>
                  <Input
                    id="mgmt-email"
                    type="email"
                    placeholder="management@hostel.edu"
                    value={managementEmail}
                    onChange={(e) => setManagementEmail(e.target.value)}
                    className="border-orange-200 focus:border-orange-400"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mgmt-password">Password</Label>
                  <Input
                    id="mgmt-password"
                    type="password"
                    placeholder="Enter your password"
                    value={managementPassword}
                    onChange={(e) => setManagementPassword(e.target.value)}
                    className="border-orange-200 focus:border-orange-400"
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
                >
                  Login as Management
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Student Login */}
          <Card className="shadow-xl border-0 bg-gradient-to-br from-green-50 to-green-100">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-2xl text-green-700">Student Portal</CardTitle>
              <CardDescription className="text-green-600">
                Login to vote for your preferred meals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleStudentLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="student-email">Student Email</Label>
                  <Input
                    id="student-email"
                    type="email"
                    placeholder="student@college.edu"
                    value={studentEmail}
                    onChange={(e) => setStudentEmail(e.target.value)}
                    className="border-green-200 focus:border-green-400"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="student-password">Password</Label>
                  <Input
                    id="student-password"
                    type="password"
                    placeholder="Enter your password"
                    value={studentPassword}
                    onChange={(e) => setStudentPassword(e.target.value)}
                    className="border-green-200 focus:border-green-400"
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                >
                  Login as Student
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LoginSection;
