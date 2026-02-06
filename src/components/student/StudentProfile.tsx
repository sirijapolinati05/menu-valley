import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState } from 'react';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/integrations/firebase/client';
import { useAuth } from '@/contexts/AuthContext';

interface StudentData {
  coursename: string;
  studentgender: string;
  hostelname: string;
  roomnumber: string;
  studentbranch: string;
  studentemail: string;
  studentid: string;
  studentname: string;
  studentusername: string;
  studentphonenumber: string;
  timestamp: string;
  uploadedBy: string;
  joiningdate: string;
}

const StudentProfile = () => {
  const { user, loading: authLoading } = useAuth();
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [managementEmail, setManagementEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStudentData = async () => {
      if (!user || !user.uid) {
        setError('User not logged in');
        setLoading(false);
        return;
      }

      try {
        // Fetch student data
        const studentDocRef = doc(db, 'students', user.uid);
        const studentDocSnap = await getDoc(studentDocRef);

        if (studentDocSnap.exists()) {
          const studentData = studentDocSnap.data() as StudentData;
          setStudentData(studentData);

          // Fetch management email from users collection
          if (studentData.uploadedBy) {
            const usersQuery = query(
              collection(db, 'users'),
              where('managementid', '==', studentData.uploadedBy)
            );
            const usersQuerySnap = await getDocs(usersQuery);

            if (!usersQuerySnap.empty) {
              const userDoc = usersQuerySnap.docs[0].data();
              setManagementEmail(userDoc.email || 'Not Specified');
            } else {
              setManagementEmail('Not Specified');
            }
          } else {
            setManagementEmail('Not Specified');
          }
        } else {
          setError('No student data found');
        }
      } catch (err) {
        setError('Failed to fetch student data');
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchStudentData();
    }
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="text-center py-8">
        <div className="text-6xl text-gray-300">⏳</div>
        <p className="text-gray-500 text-lg">Loading...</p>
      </div>
    );
  }

  if (error || !studentData) {
    return <div className="text-red-500 text-sm">{error || 'No student data available'}</div>;
  }

  const studentStats = {
    totalVotes: 12,
    complaintsSubmitted: 2,
    favoriteMeal: 'Lunch',
    joinedDate: studentData.joiningdate || 'Not Specified'
  };

  return (
    <div className="space-y-6">
      <style>
        {`
          .profile-card {
            border: 2px solid #d1d5db;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            border-radius: 1rem;
          }
          .profile-card:hover {
            transform: scale(1.02);
            box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          .stats-card {
            border: 2px solid #d1d5db;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            border-radius: 1rem;
          }
          .stats-card:hover {
            transform: scale(1.05);
            box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          .status-badge {
            background-color: #d1fae5;
            color: #15803d;
            transition: all 0.2s ease;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
            border-radius: 0.5rem;
            padding: 0.25rem 0.5rem;
          }
          .status-badge:hover {
            background-color: #34d399;
            color: #000000;
            transform: scale(1.1);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
          }
          @media (max-width: 640px) {
            .profile-card {
              min-width: 0;
              padding: 0.5rem;
            }
            .stats-card {
              min-width: 0;
              padding: 0.5rem;
            }
            .stats-card .text-2xl {
              font-size: 1.25rem;
            }
            .stats-card .text-sm {
              font-size: 0.75rem;
            }
            .status-badge {
              font-size: 0.65rem;
              padding: 0.15rem 0.3rem;
            }
          }
        `}
      </style>

      <h2 className="text-[18px] md:text-[20px] font-bold text-green-700">Student Profile</h2>
      
      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="grid grid-cols-1 gap-6">
        <Card className="profile-card min-w-[475px]">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Your account and hostel details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs lg:text-sm font-medium text-gray-600">Full Name</label>
              <p className="text-base lg:text-lg">{studentData.studentname || 'Not Specified'}</p>
            </div>
            <div>
              <label className="text-xs lg:text-sm font-medium text-gray-600">Email</label>
              <p className="text-base lg:text-lg">{studentData.studentemail || 'Not Specified'}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs lg:text-sm font-medium text-gray-600">Roll Number</label>
                <p className="text-base lg:text-lg">{studentData.studentid || 'Not Specified'}</p>
              </div>
              <div>
                <label className="text-xs lg:text-sm font-medium text-gray-600">Username</label>
                <p className="text-base lg:text-lg">{studentData.studentusername || 'Not Specified'}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs lg:text-sm font-medium text-gray-600">Course</label>
                <p className="text-base lg:text-lg">{studentData.coursename || 'Not Specified'}</p>
              </div>
              <div>
                <label className="text-xs lg:text-sm font-medium text-gray-600">Branch</label>
                <p className="text-base lg:text-lg">{studentData.studentbranch || 'Not Specified'}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs lg:text-sm font-medium text-gray-600">Gender</label>
                <p className="text-base lg:text-lg">{studentData.studentgender || 'Not Specified'}</p>
              </div>
              <div>
                <label className="text-xs lg:text-sm font-medium text-gray-600">Hostel Name</label>
                <p className="text-base lg:text-lg">{studentData.hostelname || 'Not Specified'}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs lg:text-sm font-medium text-gray-600">Room Number</label>
                <p className="text-base lg:text-lg">{studentData.roomnumber || 'Not Specified'}</p>
              </div>
              <div>
                <label className="text-xs lg:text-sm font-medium text-gray-600">Phone Number</label>
                <p className="text-base lg:text-lg">{studentData.studentphonenumber || 'Not Specified'}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs lg:text-sm font-medium text-gray-600">Uploaded By</label>
                <p className="text-base lg:text-lg">{managementEmail}</p>
              </div>
              <div>
                <label className="text-xs lg:text-sm font-medium text-gray-600">Joined Date</label>
                <p className="text-base lg:text-lg">{studentStats.joinedDate}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="profile-card min-w-[475px]">
          <CardHeader>
            <CardTitle>Your Activity</CardTitle>
            <CardDescription>Your participation in the hostel food system</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-green-50 stats-card">
                <div className="text-2xl font-bold text-green-600">{studentStats.totalVotes}</div>
                <p className="text-sm text-gray-600">Total Votes</p>
              </div>
              <div className="text-center p-4 bg-blue-50 stats-card">
                <div className="text-2xl font-bold text-blue-600">{studentStats.complaintsSubmitted}</div>
                <p className="text-sm text-gray-600">Complaints</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs lg:text-sm font-medium text-gray-600">Member Since</span>
                <span className="text-sm text-gray-700">{studentStats.joinedDate}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs lg:text-sm font-medium text-gray-600">Status</span>
                <Badge className="status-badge">Active Resident</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentProfile;