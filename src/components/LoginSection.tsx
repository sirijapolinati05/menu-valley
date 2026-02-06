import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { db } from '@/integrations/firebase/client';
import { collection, query, where, getDocs } from 'firebase/firestore';
import logo from '@/assets/Vishnu.png';

const LoginSection = () => {
  const [managementUsername, setManagementUsername] = useState('');
  const [managementPassword, setManagementPassword] = useState('');
  const [studentUsername, setStudentUsername] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user, login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.email) {
      console.log('LoginSection: Current user:', {
        email: user.email,
        uid: user.uid,
        role: user.displayName,
      });
      // Redirect based on user role (stored in displayName)
      if (user.displayName === 'management') {
        console.log('LoginSection: Redirecting to management dashboard');
        navigate('/management');
      } else if (user.displayName === 'student') {
        console.log('LoginSection: Redirecting to student dashboard');
        navigate('/');
      } else {
        console.error('LoginSection: User role not set or invalid:', user.displayName);
        setError('User role not found. Please contact support.');
      }
    }
  }, [user, navigate]);

  const handleManagementLogin = async (e) => {
    e.preventDefault();
    if (managementUsername && managementPassword) {
      setIsLoading(true);
      try {
        // Normalize username, preserve password case
        const normalizedUsername = managementUsername.trim().toLowerCase();
        const inputPassword = managementPassword.trim();

        // Query Firestore for management credentials
        const usersQuery = query(
          collection(db, 'users'),
          where('managementusername', '==', normalizedUsername),
          where('managementpassword', '==', inputPassword)
        );
        const querySnapshot = await getDocs(usersQuery);

        console.log('LoginSection: Firestore query executed for management username:', normalizedUsername, 'password:', inputPassword);
        if (querySnapshot.empty) {
          console.log('LoginSection: No management user found with username:', normalizedUsername, 'password:', inputPassword);
          // Log all users for debugging
          const allUsers = await getDocs(collection(db, 'users'));
          console.log('LoginSection: All users in collection:');
          allUsers.forEach(doc => console.log(doc.id, doc.data()));
          throw new Error('Invalid Management Username or Password');
        }

        // Log the found management user data
        querySnapshot.forEach((doc) => {
          console.log('LoginSection: Found management user:', doc.id, doc.data());
        });

        // Call login with role and username
        await login('management', normalizedUsername, inputPassword);
        setError(null);
      } catch (error) {
        console.error('LoginSection: Management login failed:', error);
        setError(error.message || 'Management login failed. Please try again.');
      } finally {
        setIsLoading(false);
      }
    } else {
      setError('Please enter both username and password');
    }
  };

  const handleStudentLogin = async (e) => {
    e.preventDefault();
    if (studentUsername && studentPassword) {
      setIsLoading(true);
      try {
        // Normalize username only, preserve password case
        const normalizedUsername = studentUsername.trim().toLowerCase();
        const inputPassword = studentPassword.trim();
        console.log('LoginSection: Attempting student login with username:', normalizedUsername, 'password:', inputPassword);

        // Query Firestore for student credentials
        const studentsQuery = query(
          collection(db, 'students'),
          where('studentusername', '==', normalizedUsername),
          where('studentpassword', '==', inputPassword)
        );
        const querySnapshot = await getDocs(studentsQuery);

        console.log('LoginSection: Firestore query executed for username:', normalizedUsername, 'password:', inputPassword);
        if (querySnapshot.empty) {
          console.log('LoginSection: No student found with username:', normalizedUsername, 'password:', inputPassword);
          // Log all students for debugging
          const allStudents = await getDocs(collection(db, 'students'));
          console.log('LoginSection: All students in collection:');
          allStudents.forEach(doc => console.log(doc.id, doc.data()));
          throw new Error('Invalid Student Username or Password');
        }

        // Get student data
        let studentData = {};
        querySnapshot.forEach((doc) => {
          console.log('LoginSection: Found student:', doc.id, doc.data());
          studentData = doc.data();
        });

        // Call login function with student role, username, and additional data
        await login('student', normalizedUsername, inputPassword, {
          email: studentData.studentemail || normalizedUsername,
          name: studentData.studentname || 'Not Specified',
          studentusername: normalizedUsername,
          course: studentData.course || 'Not Specified',
          studentbranch: studentData.studentbranch || 'Not Specified',
          roomNumber: studentData.roomNumber || 'Not Specified',
          gender: studentData.gender || 'Not Specified',
          contact: studentData.phoneNumber || 'Not Specified',
        });
        setError(null);
      } catch (error) {
        console.error('LoginSection: Student login failed:', error);
        setError(error.message || 'Student login failed. Please try again.');
      } finally {
        setIsLoading(false);
      }
    } else {
      setError('Please enter both Student Username and Student Password');
    }
  };

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{
        backgroundImage: 'url("/src/assets/raindrop9.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="text-center mb-4">
        <img src={logo} alt="Shri Vishnu Engineering College for Women Hostel Logo" className="w-24 h-24 mx-auto mb-4" />
        <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-green-600" style={{ WebkitTextStroke: '0.5px black' }}>
          Welcome to Menu Valley
        </h1>
        <p className="text-2xl font-extrabold text-gray-600 mt-2">Shri Vishnu Engineering College for Women Hostel</p>
      </div>
      {error && (
        <div className="text-center mb-6 text-red-600">
          {error}
        </div>
      )}
      <div className="grid md:grid-cols-2 gap-6 w-full max-w-4xl">
        <Card 
          className="bg-gradient-to-br from-orange-50 to-orange-100 transform hover:scale-105 transition-transform duration-300 perspective-1200 rotate-x-3 rotate-y-3 translate-z-10 hover:translate-z-20"
          style={{ 
            boxShadow: '6px 6px 12px rgba(0, 0, 0, 0.4), -6px -6px 12px rgba(255, 255, 255, 0.8), 0 10px 20px rgba(0, 0, 0, 0.3)', 
            transform: 'translateY(-4px)'
          }}
        >
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl text-orange-700">Hostel Management Portal</CardTitle>
            <CardDescription className="text-orange-600">
              Login to manage food menus and track preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleManagementLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mgmt-username">Username</Label>
                <Input
                  id="mgmt-username"
                  type="text"
                  placeholder="Enter management username"
                  value={managementUsername}
                  onChange={(e) => setManagementUsername(e.target.value)}
                  className="border-orange-200 focus:border-orange-400 bg-white/50"
                  style={{ boxShadow: 'inset 2px 2px 5px rgba(0, 0, 0, 0.1), inset -2px -2px 5px rgba(255, 255, 255, 0.7)' }}
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
                  className="border-orange-200 focus:border-orange-400 bg-white/50"
                  style={{ boxShadow: 'inset 2px 2px 5px rgba(0, 0, 0, 0.1), inset -2px -2px 5px rgba(255, 255, 255, 0.7)' }}
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
                style={{ boxShadow: '3px 3px 8px rgba(0, 0, 0, 0.3), -3px -3px 8px rgba(255, 255, 255, 0.7)', transform: 'translateY(-2px)' }}
                disabled={isLoading}
              >
                {isLoading ? 'Logging in...' : 'Login as Management'}
              </Button>
            </form>
          </CardContent>
        </Card>
        <Card 
          className="bg-gradient-to-br from-green-50 to-green-100 transform hover:scale-105 transition-transform duration-300 perspective-1200 rotate-x-3 rotate-y-3 translate-z-10 hover:translate-z-20"
          style={{ 
            boxShadow: '6px 6px 12px rgba(0, 0, 0, 0.4), -6px -6px 12px rgba(255, 255, 255, 0.8), 0 10px 20px rgba(0, 0, 0, 0.3)', 
            transform: 'translateY(-4px)'
          }}
        >
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl text-green-700">Student Portal</CardTitle>
            <CardDescription className="text-green-600">
              Login to vote for your preferred meals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleStudentLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="student-username">Student Username</Label>
                <Input
                  id="student-username"
                  type="text"
                  placeholder="Enter your username (e.g., 22b01a0216)"
                  value={studentUsername}
                  onChange={(e) => setStudentUsername(e.target.value)}
                  className="border-green-200 focus:border-green-400 bg-white/50"
                  style={{ boxShadow: 'inset 2px 2px 5px rgba(0, 0, 0, 0.1), inset -2px -2px 5px rgba(255, 255, 255, 0.7)' }}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="student-password">Student Password</Label>
                <Input
                  id="student-password"
                  type="password"
                  placeholder="Enter your password"
                  value={studentPassword}
                  onChange={(e) => setStudentPassword(e.target.value)}
                  className="border-green-200 focus:border-green-400 bg-white/50"
                  style={{ boxShadow: 'inset 2px 2px 5px rgba(0, 0, 0, 0.1), inset -2px -2px 5px rgba(255, 255, 255, 0.7)' }}
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                style={{ boxShadow: '3px 3px 8px rgba(0, 0, 0, 0.3), -3px -3px 8px rgba(255, 255, 255, 0.7)', transform: 'translateY(-2px)' }}
                disabled={isLoading}
              >
                {isLoading ? 'Logging in...' : 'Login as Student'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginSection;