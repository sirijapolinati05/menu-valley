
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Complaint {
  id: string;
  studentName: string;
  meal: string;
  category: string;
  complaint: string;
  date: Date;
  status: 'new' | 'reviewed' | 'resolved';
}

const Complaints = () => {
  const [complaints] = useState<Complaint[]>([
    {
      id: '1',
      studentName: 'John Doe',
      meal: 'Lunch',
      category: 'Rice',
      complaint: 'The rice was cold and not properly cooked.',
      date: new Date('2024-01-15'),
      status: 'new'
    },
    {
      id: '2',
      studentName: 'Jane Smith',
      meal: 'Breakfast',
      category: 'Dosa',
      complaint: 'Dosa was burnt and the chutney was too spicy.',
      date: new Date('2024-01-14'),
      status: 'reviewed'
    },
    {
      id: '3',
      studentName: 'Mike Johnson',
      meal: 'Dinner',
      category: 'Chapati',
      complaint: 'Chapati was hard and difficult to eat.',
      date: new Date('2024-01-13'),
      status: 'resolved'
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-red-100 text-red-800';
      case 'reviewed': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const groupedComplaints = complaints.reduce((acc, complaint) => {
    const key = complaint.category;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(complaint);
    return acc;
  }, {} as Record<string, Complaint[]>);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-orange-700">Student Complaints</h2>
        <div className="text-sm text-gray-600">
          Total Complaints: {complaints.length}
        </div>
      </div>

      {/* Complaint Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">
              {complaints.filter(c => c.status === 'new').length}
            </div>
            <p className="text-sm text-gray-600">New Complaints</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">
              {complaints.filter(c => c.status === 'reviewed').length}
            </div>
            <p className="text-sm text-gray-600">Under Review</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {complaints.filter(c => c.status === 'resolved').length}
            </div>
            <p className="text-sm text-gray-600">Resolved</p>
          </CardContent>
        </Card>
      </div>

      {/* Most Complained Food Items */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Most Complained Food Items</CardTitle>
          <CardDescription>Items with highest number of complaints</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(groupedComplaints)
              .sort(([,a], [,b]) => b.length - a.length)
              .slice(0, 5)
              .map(([food, complaints]) => (
                <div key={food} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="font-medium">{food}</span>
                  <Badge variant="outline">{complaints.length} complaints</Badge>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Individual Complaints */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-800">Recent Complaints</h3>
        {complaints.map((complaint) => (
          <Card key={complaint.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{complaint.category} - {complaint.meal}</CardTitle>
                  <CardDescription>
                    By {complaint.studentName} on {complaint.date.toLocaleDateString()}
                  </CardDescription>
                </div>
                <Badge className={getStatusColor(complaint.status)}>
                  {complaint.status.charAt(0).toUpperCase() + complaint.status.slice(1)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">{complaint.complaint}</p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">
                  Mark as Reviewed
                </Button>
                <Button size="sm" variant="outline">
                  Mark as Resolved
                </Button>
                <Button size="sm" variant="outline">
                  Reply to Student
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Complaints;
